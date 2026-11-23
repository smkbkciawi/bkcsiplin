/* ============================================================================
 * BKCSIPLIN — HYBRID DUAL SCANNER (QR 2D + BARCODE 1D)
 * SMK Bhakti Kencana Ciawi
 * ============================================================================
 * Arsitektur 3 lapis untuk kecepatan maksimal & kompatibilitas luas di HP:
 * 1. Native Hardware `BarcodeDetector` (Chrome Android / Edge / modern browser)
 *    — langsung membaca elemen <video> tanpa salin canvas (cepat & hemat CPU).
 * 2. Fallback QR via `jsQR` dengan 1 offscreen canvas yang dipakai ulang.
 * 3. Fallback Barcode 1D via `@zxing/library` (Code 128, Code 39, EAN-13/8,
 *    UPC-A/E, Codabar) pada pita horizontal tengah untuk iOS Safari / Firefox.
 *
 * Jika CDN ZXing tidak tersedia (misal offline), QR tetap berjalan 100% normal.
 * ============================================================================ */
(function (global) {
  'use strict';

  const TARGET_FORMATS = [
    'qr_code',
    'code_128',
    'code_39',
    'ean_13',
    'ean_8',
    'upc_a',
    'upc_e',
    'codabar'
  ];

  const FORMAT_1D_SET = new Set([
    'code_128',
    'code_39',
    'ean_13',
    'ean_8',
    'upc_a',
    'upc_e',
    'codabar'
  ]);

  let cachedNativeInfo = null;
  let cachedNativePromise = null;

  /**
   * Mendeteksi dukungan Native BarcodeDetector secara aman (memeriksa
   * getSupportedFormats agar tidak pernah melempar TypeError).
   */
  async function initNativeDetector() {
    if (cachedNativeInfo) return cachedNativeInfo;
    if (cachedNativePromise) return cachedNativePromise;

    cachedNativePromise = (async () => {
      const result = {
        detector: null,
        formats: [],
        hasQR: false,
        has1D: false
      };

      try {
        if (typeof global.BarcodeDetector !== 'function') {
          cachedNativeInfo = result;
          return result;
        }

        let supported = [];
        if (typeof global.BarcodeDetector.getSupportedFormats === 'function') {
          supported = await global.BarcodeDetector.getSupportedFormats();
        }
        if (!Array.isArray(supported) || !supported.length) {
          cachedNativeInfo = result;
          return result;
        }

        const supportedSet = new Set(supported.map((f) => String(f).toLowerCase()));
        const intersected = TARGET_FORMATS.filter((f) => supportedSet.has(f));
        if (!intersected.length) {
          cachedNativeInfo = result;
          return result;
        }

        const detector = new global.BarcodeDetector({ formats: intersected });
        result.detector = detector;
        result.formats = intersected;
        result.hasQR = intersected.includes('qr_code');
        result.has1D = intersected.some((f) => FORMAT_1D_SET.has(f));
      } catch (_) {
        result.detector = null;
        result.formats = [];
        result.hasQR = false;
        result.has1D = false;
      }

      cachedNativeInfo = result;
      return result;
    })();

    return cachedNativePromise;
  }

  /**
   * Membuka kamera dengan kualitas HD 1280x720 (penting agar garis barcode 1D tajam)
   * dan fallback bertingkat jika perangkat tidak mendukung resolusi / facingMode.
   */
  async function openCameraStream(facingMode) {
    const media = global.navigator && global.navigator.mediaDevices;
    if (!media || typeof media.getUserMedia !== 'function') {
      throw new Error('Browser tidak mendukung akses kamera atau halaman belum dibuka melalui HTTPS.');
    }

    const facing = facingMode === 'user' ? 'user' : 'environment';
    const candidates = [
      { video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
      { video: { facingMode: facing }, audio: false },
      { video: true, audio: false }
    ];

    let stream = null;
    let lastErr = null;
    for (let i = 0; i < candidates.length; i++) {
      try {
        stream = await media.getUserMedia(candidates[i]);
        if (stream) break;
      } catch (err) {
        lastErr = err;
        // Jika izin kamera ditolak pengguna, jangan ulangi percobaan lain
        if (err && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) {
          throw err;
        }
      }
    }

    if (!stream) {
      throw lastErr || new Error('Gagal membuka kamera perangkat.');
    }

    // Aktifkan autofocus kontinu secara best-effort (tidak mengganggu jika tidak didukung)
    try {
      const track = stream.getVideoTracks()[0];
      if (track && typeof track.getCapabilities === 'function' && typeof track.applyConstraints === 'function') {
        const caps = track.getCapabilities() || {};
        if (Array.isArray(caps.focusMode) && caps.focusMode.includes('continuous')) {
          track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] }).catch(() => {});
        }
      }
    } catch (_) {
      // Abaikan bila perangkat tidak mendukung focusMode
    }

    return stream;
  }

  /**
   * Mengonversi RGBA ImageData ke array grayscale Uint8ClampedArray (width * height)
   * sebagai fallback aman untuk ZXing.RGBLuminanceSource.
   */
  function rgbaToLuminance(rgba, width, height) {
    const total = width * height;
    const luminances = new Uint8ClampedArray(total);
    for (let i = 0, p = 0; i < total; i++, p += 4) {
      // Bobot standar Rec.601 cepat tanpa floating point
      luminances[i] = (rgba[p] * 306 + rgba[p + 1] * 601 + rgba[p + 2] * 117) >> 10;
    }
    return luminances;
  }

  /**
   * Inisialisasi lazy ZXing MultiFormatReader khusus 1D Barcode (Code 128, Code 39, dll).
   * Mengembalikan null jika library ZXing belum termuat / offline.
   */
  function createZxing1DReader() {
    const Z = global.ZXing;
    if (!Z || typeof Z.MultiFormatReader !== 'function' || !Z.DecodeHintType || !Z.BarcodeFormat) {
      return null;
    }

    try {
      const bf = Z.BarcodeFormat;
      const formats = [];
      const formatMap = new Map();

      const entries = [
        ['CODE_128', 'code_128'],
        ['CODE_39', 'code_39'],
        ['EAN_13', 'ean_13'],
        ['EAN_8', 'ean_8'],
        ['UPC_A', 'upc_a'],
        ['UPC_E', 'upc_e'],
        ['CODABAR', 'codabar']
      ];

      entries.forEach(([key, label]) => {
        if (typeof bf[key] !== 'undefined') {
          formats.push(bf[key]);
          formatMap.set(bf[key], label);
        }
      });

      if (!formats.length) return null;

      const hints = new Map();
      hints.set(Z.DecodeHintType.POSSIBLE_FORMATS, formats);

      const reader = new Z.MultiFormatReader();
      if (typeof reader.setHints === 'function') {
        reader.setHints(hints);
      }

      return { reader, formatMap, ZXing: Z };
    } catch (_) {
      return null;
    }
  }

  function decode1DWithZxing(zxingCtx, canvas, ctx, width, height) {
    if (!zxingCtx || !zxingCtx.reader) return null;
    const Z = zxingCtx.ZXing;
    if (typeof Z.HybridBinarizer !== 'function' || typeof Z.BinaryBitmap !== 'function') {
      return null;
    }

    try {
      let source = null;
      if (typeof Z.HTMLCanvasElementLuminanceSource === 'function') {
        source = new Z.HTMLCanvasElementLuminanceSource(canvas);
      } else if (typeof Z.RGBLuminanceSource === 'function') {
        const img = ctx.getImageData(0, 0, width, height);
        const gray = rgbaToLuminance(img.data, width, height);
        source = new Z.RGBLuminanceSource(gray, width, height);
      }
      if (!source) return null;

      const bitmap = new Z.BinaryBitmap(new Z.HybridBinarizer(source));
      const res = typeof zxingCtx.reader.decodeWithState === 'function'
        ? zxingCtx.reader.decodeWithState(bitmap)
        : zxingCtx.reader.decode(bitmap);

      if (!res) return null;
      const text = typeof res.getText === 'function' ? res.getText() : (res.text || '');
      const rawFmt = typeof res.getBarcodeFormat === 'function' ? res.getBarcodeFormat() : res.format;
      const fmtName = zxingCtx.formatMap.get(rawFmt) || 'barcode_1d';
      return { rawValue: String(text || '').trim(), format: fmtName };
    } catch (_) {
      // NotFoundException / ChecksumException normal terjadi bila frame belum berisi barcode
      return null;
    }
  }

  function buildResult(rawValue, format) {
    const clean = String(rawValue || '').trim();
    const fmt = String(format || 'qr_code').toLowerCase();
    const isQR = fmt === 'qr_code';
    return {
      rawValue: clean,
      format: fmt,
      isQR: isQR,
      sumber: isQR ? 'QR' : 'BARCODE'
    };
  }

  /**
   * Membuat loop pemindaian non-overlapping (anti-macet & bersih saat dihentikan).
   *
   * @param {Object} opts
   * @param {HTMLVideoElement} opts.video
   * @param {Function} [opts.isPaused] - Mengembalikan true jika sedang memproses hasil sebelumnya
   * @param {number} [opts.minLength=3] - Panjang karakter minimal agar tidak memicu bacaan palsu
   * @param {Function} opts.onDetected - Callback ({ rawValue, format, isQR, sumber })
   * @param {Function} [opts.onReady] - Callback opsional ({ mode, formats })
   */
  function createLoop(opts) {
    const video = opts && opts.video;
    const isPaused = typeof (opts && opts.isPaused) === 'function' ? opts.isPaused : () => false;
    const minLength = typeof (opts && opts.minLength) === 'number' ? opts.minLength : 3;
    const onDetected = typeof (opts && opts.onDetected) === 'function' ? opts.onDetected : () => {};
    const onReady = typeof (opts && opts.onReady) === 'function' ? opts.onReady : null;

    let active = true;
    let timerId = null;
    let tickCount = 0;
    let qrTickCount = 0;
    let nativeBroken = false;
    let zxingCtx = null;
    let zxingCheckedCount = 0;

    // 2 canvas offscreen kecil yang dipakai ulang (tanpa GC stutter tiap frame)
    let qrCanvas = null;
    let qrCtx = null;
    let barCanvas = null;
    let barCtx = null;

    function ensureQrCanvas(vw, vh) {
      const maxW = 640;
      const scale = vw > maxW ? (maxW / vw) : 1;
      const w = Math.max(1, Math.round(vw * scale));
      const h = Math.max(1, Math.round(vh * scale));
      if (!qrCanvas) {
        qrCanvas = global.document.createElement('canvas');
        qrCtx = qrCanvas.getContext('2d', { willReadFrequently: true });
      }
      if (qrCanvas.width !== w || qrCanvas.height !== h) {
        qrCanvas.width = w;
        qrCanvas.height = h;
      }
      return { canvas: qrCanvas, ctx: qrCtx, w, h };
    }

    function ensureBarCanvas(vw, vh) {
      // Ambil pita horizontal tengah (56% tinggi frame) agar garis 1D tetap tajam & 2x lebih ringan
      const cropY = Math.round(vh * 0.22);
      const cropH = Math.max(1, Math.round(vh * 0.56));
      const maxW = 900;
      const scale = vw > maxW ? (maxW / vw) : 1;
      const w = Math.max(1, Math.round(vw * scale));
      const h = Math.max(1, Math.round(cropH * scale));
      if (!barCanvas) {
        barCanvas = global.document.createElement('canvas');
        barCtx = barCanvas.getContext('2d', { willReadFrequently: true });
      }
      if (barCanvas.width !== w || barCanvas.height !== h) {
        barCanvas.width = w;
        barCanvas.height = h;
      }
      return { canvas: barCanvas, ctx: barCtx, cropY, cropH, w, h };
    }

    function scanQrFallback(vw, vh) {
      if (typeof global.jsQR !== 'function') return null;
      const { ctx, w, h } = ensureQrCanvas(vw, vh);
      if (!ctx) return null;
      ctx.drawImage(video, 0, 0, w, h);
      const imageData = ctx.getImageData(0, 0, w, h);
      qrTickCount++;
      // Mayoritas kartu memakai QR gelap di dasar putih; cek inversi tiap 4 frame agar hemat CPU
      const inv = (qrTickCount % 4 === 0) ? 'attemptBoth' : 'dontInvert';
      const code = global.jsQR(imageData.data, w, h, { inversionAttempts: inv });
      if (code && code.data) {
        return buildResult(code.data, 'qr_code');
      }
      return null;
    }

    function scan1DFallback(vw, vh) {
      // Coba inisialisasi ZXing secara lazy (mengantisipasi script defer selesai sesaat setelah load)
      if (!zxingCtx && zxingCheckedCount < 20) {
        zxingCheckedCount++;
        zxingCtx = createZxing1DReader();
      }
      if (!zxingCtx) return null;

      const { canvas, ctx, cropY, cropH, w, h } = ensureBarCanvas(vw, vh);
      if (!ctx) return null;
      ctx.drawImage(video, 0, cropY, vw, cropH, 0, 0, w, h);
      const hit = decode1DWithZxing(zxingCtx, canvas, ctx, w, h);
      if (hit && hit.rawValue) {
        return buildResult(hit.rawValue, hit.format);
      }
      return null;
    }

    function stop() {
      active = false;
      if (timerId !== null) {
        clearTimeout(timerId);
        timerId = null;
      }
      if (zxingCtx && zxingCtx.reader && typeof zxingCtx.reader.reset === 'function') {
        try { zxingCtx.reader.reset(); } catch (_) {}
      }
    }

    initNativeDetector().then((nativeInfo) => {
      if (!active) return;

      const useFullNative = Boolean(nativeInfo.detector && nativeInfo.hasQR && nativeInfo.has1D);
      const mode = useFullNative ? 'native' : (nativeInfo.detector ? 'hybrid' : 'fallback');
      if (onReady) {
        try { onReady({ mode, formats: nativeInfo.formats.slice() }); } catch (_) {}
      }

      const scheduleNext = (delayMs) => {
        if (!active) return;
        timerId = setTimeout(tick, delayMs);
      };

      const tick = async () => {
        timerId = null;
        if (!active) return;

        if (!video || isPaused() || video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
          scheduleNext(150);
          return;
        }

        const vw = video.videoWidth;
        const vh = video.videoHeight;
        let detected = null;

        // Lapis 1: Native BarcodeDetector (tercepat)
        if (nativeInfo.detector && !nativeBroken) {
          try {
            const barcodes = await nativeInfo.detector.detect(video);
            if (!active) return;
            if (Array.isArray(barcodes) && barcodes.length) {
              for (let i = 0; i < barcodes.length; i++) {
                const b = barcodes[i];
                const val = String((b && b.rawValue) || '').trim();
                if (val.length >= minLength) {
                  detected = buildResult(val, b.format || 'qr_code');
                  break;
                }
              }
            }
          } catch (_) {
            // Jika native detector gagal saat runtime, otomatis pindah ke fallback JS tanpa error
            nativeBroken = true;
          }
        }

        // Lapis 2 & 3: Fallback JS (hanya jalan untuk bagian yang tidak ditangani Native)
        if (!detected && active) {
          const needQrFallback = nativeBroken || !nativeInfo.hasQR;
          const need1DFallback = nativeBroken || !nativeInfo.has1D;

          if (needQrFallback && need1DFallback) {
            // Bergantian tiap tick (genap = QR, ganjil = Barcode 1D) agar HP iOS/Firefox tetap lancar
            if (tickCount % 2 === 0) {
              detected = scanQrFallback(vw, vh);
            } else {
              detected = scan1DFallback(vw, vh);
            }
          } else if (needQrFallback) {
            detected = scanQrFallback(vw, vh);
          } else if (need1DFallback) {
            // Native menangani QR, ZXing melengkapi 1D setiap 2 tick
            if (tickCount % 2 === 1) {
              detected = scan1DFallback(vw, vh);
            }
          }
        }

        tickCount++;

        if (detected && detected.rawValue.length >= minLength && active && !isPaused()) {
          try {
            onDetected(detected);
          } catch (_) {
            // Jangan biarkan error callback menghentikan loop scanner
          }
        }

        // Jeda dinamis: native 120ms (~8 fps), fallback JS 160ms (~6 fps)
        const nextDelay = (useFullNative && !nativeBroken) ? 120 : 160;
        scheduleNext(nextDelay);
      };

      scheduleNext(100);
    });

    return { stop };
  }

  /**
   * Reset cache detektor (hanya untuk kebutuhan pengujian internal).
   */
  function _resetCacheForTest() {
    cachedNativeInfo = null;
    cachedNativePromise = null;
  }

  global.BKCScanner = {
    TARGET_FORMATS: TARGET_FORMATS.slice(),
    initNativeDetector,
    openCameraStream,
    createLoop,
    rgbaToLuminance,
    _resetCacheForTest
  };
})(typeof window !== 'undefined' ? window : globalThis);
