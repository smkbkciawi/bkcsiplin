/* ============================================================================
 * BKCSIPLIN — SERVICE WORKER PWA (NETWORK-FIRST & ANTI-STALE API)
 * SMK Bhakti Kencana Ciawi
 * ============================================================================
 * - Permintaan API (Cloudflare Workers / Google Apps Script / Telegram) TIDAK
 *   PERNAH di-cache agar presensi, sholat, poin BK, dan raport selalu 100%
 *   realtime.
 * - Halaman HTML & JS lokal memakai strategi Network-First: selalu ambil versi
 *   terbaru saat online (auto-update otomatis), dan jatuh ke cache jika offline
 *   (misalnya Portal Gerbang saat internet putus).
 * ============================================================================ */

const CACHE_NAME = 'bkcsiplin-pwa-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './api-config.js',
  './navbar.js',
  './pwa.js',
  './icons/pwa-192x192.png',
  './icons/pwa-512x512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .catch(() => {})
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Jangan pernah sentuh POST / PUT / DELETE (semua transaksi API BKCSiplin)
  if (req.method !== 'GET') return;

  let url;
  try {
    url = new URL(req.url);
  } catch (_) {
    return;
  }

  // Jangan pernah cache API eksternal (Cloudflare Proxy, Apps Script, Telegram)
  if (
    url.hostname.endsWith('.workers.dev') ||
    url.hostname.endsWith('script.google.com') ||
    url.hostname.endsWith('script.googleusercontent.com') ||
    url.hostname.endsWith('api.telegram.org')
  ) {
    return;
  }

  // Hanya kelola aset dari origin yang sama
  if (url.origin !== self.location.origin) return;

  // Ikon lokal: cache-first dengan pembaruan latar belakang
  if (url.pathname.includes('/icons/')) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const netFetch = fetch(req).then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        }).catch(() => cached);
        return cached || netFetch;
      })
    );
    return;
  }

  // HTML, JS, CSS, manifest lokal: Network-First agar update GitHub langsung masuk
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || caches.match('./index.html')))
  );
});
