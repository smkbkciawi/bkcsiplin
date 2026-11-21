/* ============================================================================
 * BKCSIPLIN — PWA INSTALLER & CONNECTIVITY HELPER
 * SMK Bhakti Kencana Ciawi
 * ============================================================================
 * - Mendaftarkan Service Worker (./sw.js) untuk dukungan instalasi PWA.
 * - Menampilkan tombol "Instal Aplikasi" di slot #pwa-install-slot (Beranda)
 *   dan otomatis menyembunyikannya jika sudah berjalan dalam mode aplikasi
 *   (standalone).
 * - Menyediakan panduan instalasi khusus iPhone/iPad (Safari) dan browser
 *   bawaan WhatsApp/Telegram.
 * - Menampilkan indikator non-intrusif saat perangkat sedang Offline.
 * ============================================================================ */
(function () {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  let deferredPrompt = null;

  const isStandalone = () =>
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  const ua = (navigator.userAgent || '').toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isInAppBrowser = /whatsapp|fban|fbav|instagram|line|telegram|wv\)/.test(ua);

  // 1. Daftarkan Service Worker
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {});
    });
  }

  // 2. Suntikkan gaya CSS ringan & serasi untuk tombol instal, modal iOS, dan indikator offline
  function injectStyles() {
    if (document.getElementById('bkc-pwa-style')) return;
    const style = document.createElement('style');
    style.id = 'bkc-pwa-style';
    style.textContent = `
      .bkc-pwa-btn {
        height: 42px;
        padding: 0 .88rem;
        border-radius: 11px;
        border: 1px solid rgba(15, 43, 91, 0.25);
        background: #0F2B5B;
        color: #FFFFFF;
        font-family: inherit;
        font-size: .82rem;
        font-weight: 700;
        display: inline-flex;
        align-items: center;
        gap: .45rem;
        cursor: pointer;
        white-space: nowrap;
        transition: transform .16s ease, background-color .16s ease, opacity .16s ease;
      }
      .bkc-pwa-btn:hover { background: #1D4ED8; transform: translateY(-1px); }
      html.dark .bkc-pwa-btn { background: #2563EB; border-color: rgba(147,197,253,0.35); }
      html.dark .bkc-pwa-btn:hover { background: #1D4ED8; }
      @media (max-width: 560px) {
        .bkc-pwa-btn span { display: none; }
        .bkc-pwa-btn { width: 42px; padding: 0; justify-content: center; }
      }

      .bkc-pwa-modal-bg {
        position: fixed;
        inset: 0;
        z-index: 9998;
        background: rgba(15, 23, 42, 0.62);
        backdrop-filter: blur(4px);
        display: none;
        align-items: center;
        justify-content: center;
        padding: 1.25rem;
      }
      .bkc-pwa-modal-bg.show { display: flex; }
      .bkc-pwa-modal {
        width: 100%;
        max-width: 410px;
        background: #FFFFFF;
        color: #0F172A;
        border: 1px solid #E2E8F0;
        border-radius: 18px;
        padding: 1.45rem;
        box-shadow: 0 24px 60px rgba(0,0,0,0.32);
        font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      }
      html.dark .bkc-pwa-modal {
        background: #111A2E;
        color: #F1F5F9;
        border-color: #1E2D4A;
      }
      .bkc-pwa-modal-head {
        display: flex;
        align-items: center;
        gap: .8rem;
        margin-bottom: .85rem;
      }
      .bkc-pwa-modal-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        border: 1px solid #E2E8F0;
        object-fit: cover;
        background: #FCFCFC;
        flex-shrink: 0;
      }
      .bkc-pwa-modal h3 {
        font-size: 1.02rem;
        font-weight: 800;
        margin: 0;
        line-height: 1.25;
      }
      .bkc-pwa-modal .sub {
        font-size: .78rem;
        color: #64748B;
        margin-top: .15rem;
      }
      html.dark .bkc-pwa-modal .sub { color: #94A3B8; }
      .bkc-pwa-steps {
        margin: .75rem 0 1.1rem;
        padding-left: 1.2rem;
        display: flex;
        flex-direction: column;
        gap: .45rem;
        font-size: .86rem;
        line-height: 1.5;
        color: #334155;
      }
      html.dark .bkc-pwa-steps { color: #CBD5E1; }
      .bkc-pwa-close {
        width: 100%;
        padding: .78rem;
        border: none;
        border-radius: 11px;
        background: #0F2B5B;
        color: #FFFFFF;
        font-family: inherit;
        font-size: .88rem;
        font-weight: 700;
        cursor: pointer;
      }
      html.dark .bkc-pwa-close { background: #2563EB; }

      .bkc-offline-bar {
        position: fixed;
        bottom: 14px;
        left: 14px;
        z-index: 9990;
        display: none;
        align-items: center;
        gap: .5rem;
        padding: .55rem .9rem;
        border-radius: 10px;
        background: #B45309;
        color: #FFFFFF;
        font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
        font-size: .78rem;
        font-weight: 700;
        box-shadow: 0 8px 24px rgba(0,0,0,0.22);
      }
      .bkc-offline-bar.show { display: inline-flex; }
    `;
    document.head.appendChild(style);
  }

  function ensureModal() {
    let overlay = document.getElementById('bkc-pwa-guide-modal');
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'bkc-pwa-guide-modal';
    overlay.className = 'bkc-pwa-modal-bg';
    overlay.innerHTML = `
      <div class="bkc-pwa-modal" role="dialog" aria-modal="true" aria-labelledby="bkc-pwa-modal-title">
        <div class="bkc-pwa-modal-head">
          <img src="./icons/pwa-192x192.png" alt="Ikon BKCSiplin" class="bkc-pwa-modal-icon">
          <div>
            <h3 id="bkc-pwa-modal-title">Instal Aplikasi BKCSiplin</h3>
            <div class="sub">SMK Bhakti Kencana Ciawi · Tanpa Play Store</div>
          </div>
        </div>
        <ol class="bkc-pwa-steps" id="bkc-pwa-steps-list"></ol>
        <button type="button" class="bkc-pwa-close" id="bkc-pwa-close-btn">Saya Mengerti</button>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('show');
    });
    document.getElementById('bkc-pwa-close-btn').addEventListener('click', () => {
      overlay.classList.remove('show');
    });
    return overlay;
  }

  function openGuideModal(mode) {
    const overlay = ensureModal();
    const list = document.getElementById('bkc-pwa-steps-list');
    const title = document.getElementById('bkc-pwa-modal-title');
    if (mode === 'ios') {
      title.textContent = 'Instal BKCSiplin di iPhone / iPad';
      list.innerHTML = `
        <li>Pastikan halaman ini dibuka melalui browser <b>Safari</b>.</li>
        <li>Ketuk tombol <b>Bagikan (Share)</b> bergambar kotak dengan panah ke atas di bilah bawah Safari.</li>
        <li>Gulir ke bawah lalu pilih <b>Tambahkan ke Layar Utama (Add to Home Screen)</b>.</li>
        <li>Ketuk <b>Tambah (Add)</b> di pojok kanan atas — ikon <b>BKCSiplin</b> langsung muncul di layar utama.</li>
      `;
    } else if (mode === 'inapp') {
      title.textContent = 'Buka di Chrome untuk Menginstal';
      list.innerHTML = `
        <li>Saat ini halaman terbuka di browser bawaan aplikasi (WhatsApp/Telegram).</li>
        <li>Ketuk ikon <b>titik tiga (⋮)</b> di pojok kanan atas lalu pilih <b>Buka di Chrome</b> (atau <b>Buka di Safari</b> untuk iPhone).</li>
        <li>Setelah terbuka di Chrome, ketuk tombol <b>Instal App</b> agar ikon <b>BKCSiplin</b> terpasang di layar utama HP.</li>
      `;
    } else {
      title.textContent = 'Pasang Ikon BKCSiplin di Layar HP';
      list.innerHTML = `
        <li>Di browser <b>Google Chrome</b>, ketuk ikon <b>titik tiga (⋮)</b> di pojok kanan atas.</li>
        <li>Pilih menu <b>Instal aplikasi</b> atau <b>Tambahkan ke layar utama</b>.</li>
        <li>Ketuk <b>Instal</b> — ikon <b>BKCSiplin</b> akan muncul seperti aplikasi Android asli dan terbuka layar penuh.</li>
      `;
    }
    overlay.classList.add('show');
  }

  async function triggerInstall() {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice && choice.outcome === 'accepted') {
          deferredPrompt = null;
          renderInstallButton();
        }
        return;
      } catch (_) {}
    }
    if (isIOS) {
      openGuideModal('ios');
    } else if (isInAppBrowser) {
      openGuideModal('inapp');
    } else {
      openGuideModal('manual');
    }
  }

  function renderInstallButton() {
    const slot = document.getElementById('pwa-install-slot');
    if (!slot) return;

    // Sembunyikan jika sudah berjalan sebagai aplikasi terinstal (standalone)
    if (isStandalone()) {
      slot.innerHTML = '';
      return;
    }

    // Tampilkan tombol jika browser mendukung prompt langsung, atau di perangkat HP (iOS / Android)
    const isMobile = /android|iphone|ipad|ipod|mobile/.test(ua);
    if (!deferredPrompt && !isIOS && !isMobile) {
      slot.innerHTML = '';
      return;
    }

    slot.innerHTML = `
      <button type="button" class="bkc-pwa-btn" id="btn-pwa-install" title="Pasang ikon BKCSiplin ke layar utama HP" aria-label="Instal Aplikasi BKCSiplin">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        <span>Instal App</span>
      </button>
    `;
    const btn = document.getElementById('btn-pwa-install');
    if (btn) btn.addEventListener('click', triggerInstall);
  }

  function setupOfflineIndicator() {
    let bar = document.getElementById('bkc-offline-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'bkc-offline-bar';
      bar.className = 'bkc-offline-bar';
      bar.setAttribute('role', 'status');
      bar.textContent = 'Mode Offline — Koneksi internet terputus';
      document.body.appendChild(bar);
    }
    const sync = () => {
      if (navigator.onLine) bar.classList.remove('show');
      else bar.classList.add('show');
    };
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    sync();
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    renderInstallButton();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    renderInstallButton();
  });

  window.bkcInstallPWA = triggerInstall;

  function init() {
    injectStyles();
    renderInstallButton();
    setupOfflineIndicator();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
