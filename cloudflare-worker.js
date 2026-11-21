/**
 * ============================================================================
 * BKCSIPLIN — CLOUDFLARE WORKERS PROXY RELAY (GRATIS 100.000 REQUEST/HARI)
 * SMK Bhakti Kencana Ciawi
 * ============================================================================
 * Fungsi:
 *   Menjadi jembatan bersih antara browser HP (Chrome, Safari, Samsung, Xiaomi,
 *   browser bawaan WhatsApp) dengan Google Apps Script agar TIDAK TERBLOKIR
 *   oleh konflik multi-akun Gmail di HP pengguna.
 *
 * Keamanan:
 *   - Tidak menyimpan data siswa/guru di Cloudflare (hanya meneruskan request).
 *   - Cookie akun Google di HP otomatis dibuang (tidak diteruskan ke Google).
 *   - Hanya mengizinkan request dari domain resmi BKCSiplin.
 *
 * Cara Pasang (1x saja di dash.cloudflare.com):
 *   1. Buka https://dash.cloudflare.com -> Workers & Pages -> Create Worker
 *   2. Beri nama (misal: bkcsiplin-api) -> klik Deploy
 *   3. Klik "Edit code", hapus semua isi lama, tempel seluruh kode ini -> Deploy
 *   4. Salin URL Worker Anda (contoh: https://bkcsiplin-api.xxxx.workers.dev)
 *   5. Tempel URL tersebut ke file api-config.js baris window.BKC_PROXY_URL
 * ============================================================================
 */

const GAS_URL = 'https://script.google.com/macros/s/AKfycbzrtKQLgECnB1PqFm9Tl9QpA79-y7XQFB5G96mfiXPwXupLAyucnqc16kKrYDjEYR1E/exec';

// Daftar asal web (Origin) yang diizinkan memakai jembatan ini
const ALLOWED_EXACT_ORIGINS = new Set([
  'https://smkbkciawi.github.io',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
]);

function isAllowedOrigin(origin) {
  if (!origin) return true; // Buka langsung di browser / JSONP <script>
  if (ALLOWED_EXACT_ORIGINS.has(origin)) return true;
  // Izinkan pratinjau AI Studio (*.run.app) & subdomain github.io sekolah bila ada
  try {
    const u = new URL(origin);
    if (u.protocol === 'https:' && u.hostname.endsWith('.run.app')) return true;
  } catch (_) {
    return false;
  }
  return false;
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
    'Cache-Control': 'no-store, no-cache, must-revalidate'
  };
}

export default {
  async fetch(request) {
    const origin = request.headers.get('Origin') || '';
    const method = request.method.toUpperCase();

    // 1. Cek izin Origin (tolak domain asing yang menyalahgunakan proxy)
    if (origin && !isAllowedOrigin(origin)) {
      return new Response(
        JSON.stringify({ ok: false, message: 'Akses ditolak: Origin tidak terdaftar.' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json; charset=utf-8' }
        }
      );
    }

    const baseCors = corsHeaders(origin);

    // 2. Jawab preflight CORS (OPTIONS) seketika
    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: baseCors });
    }

    // 3. Hanya terima GET dan POST
    if (method !== 'GET' && method !== 'POST') {
      return new Response(
        JSON.stringify({ ok: false, message: 'Metode tidak didukung.' }),
        {
          status: 405,
          headers: { ...baseCors, 'Content-Type': 'application/json; charset=utf-8' }
        }
      );
    }

    const reqUrl = new URL(request.url);

    // 4. Cek kesehatan saat URL Worker dibuka langsung di browser (tanpa query)
    if (method === 'GET' && !reqUrl.search) {
      return new Response(
        JSON.stringify({
          ok: true,
          service: 'BKCSiplin Cloudflare Proxy Relay',
          status: 'AKTIF',
          pesan: 'Jembatan siap dipakai! Tempel URL ini ke file api-config.js (window.BKC_PROXY_URL).'
        }),
        {
          status: 200,
          headers: { ...baseCors, 'Content-Type': 'application/json; charset=utf-8' }
        }
      );
    }

    // 5. Teruskan permintaan ke Google Apps Script TANPA membawa cookie pengguna
    try {
      const targetUrl = GAS_URL + reqUrl.search;
      const forwardHeaders = {
        'Accept': 'application/json, text/javascript, text/plain, */*'
      };

      let body = undefined;
      if (method === 'POST') {
        const incomingCT = request.headers.get('Content-Type') || 'text/plain;charset=utf-8';
        forwardHeaders['Content-Type'] = incomingCT;
        body = await request.arrayBuffer();
      }

      const upstream = await fetch(targetUrl, {
        method,
        headers: forwardHeaders,
        body,
        redirect: 'follow'
      });

      const responseText = await upstream.text();
      const upstreamCT = upstream.headers.get('Content-Type') || 'application/json; charset=utf-8';

      return new Response(responseText, {
        status: upstream.status,
        headers: {
          ...baseCors,
          'Content-Type': upstreamCT
        }
      });
    } catch (err) {
      return new Response(
        JSON.stringify({
          ok: false,
          message: 'Gagal menghubungi server Google Apps Script: ' + (err && err.message ? err.message : 'Unknown error')
        }),
        {
          status: 502,
          headers: { ...baseCors, 'Content-Type': 'application/json; charset=utf-8' }
        }
      );
    }
  }
};
