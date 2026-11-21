// =========================================================================
// KONFIGURASI KONEKSI SERVER BKCSIPLIN (1 PINTU UNTUK SEMUA PORTAL WEB)
// SMK Bhakti Kencana Ciawi
// =========================================================================
// 1. URL Asli Google Apps Script
//    (Tetap dipakai untuk Webhook Bot Telegram & sebagai cadangan otomatis
//     selama Proxy Cloudflare belum diisi.)
window.BKC_GAS_URL = 'https://script.google.com/macros/s/AKfycbzrtKQLgECnB1PqFm9Tl9QpA79-y7XQFB5G96mfiXPwXupLAyucnqc16kKrYDjEYR1E/exec';

// 2. URL Proxy Cloudflare Workers (AKTIF — meneruskan ke Google Apps Script tanpa cookie)
window.BKC_PROXY_URL = 'https://bkcsiplin-api.limatujuhempat.workers.dev';

// 3. URL Aktif yang dipakai seluruh portal (otomatis memilih Proxy jika terisi)
window.BKC_API_URL = (window.BKC_PROXY_URL && window.BKC_PROXY_URL.trim())
  ? window.BKC_PROXY_URL.trim().replace(/\/+$/, '')
  : window.BKC_GAS_URL;

// Penanda internal apakah jalur Proxy Cloudflare sedang aktif
window.BKC_USING_PROXY = Boolean(window.BKC_PROXY_URL && window.BKC_PROXY_URL.trim());
