// =========================================================================
// KONFIGURASI KONEKSI SERVER BKCSIPLIN (1 PINTU UNTUK SEMUA PORTAL WEB)
// SMK Bhakti Kencana Ciawi
// =========================================================================
// 1. URL Asli Google Apps Script
//    (Tetap dipakai untuk Webhook Bot Telegram & sebagai cadangan otomatis
//     selama Proxy Cloudflare belum diisi.)
window.BKC_GAS_URL = 'https://script.google.com/macros/s/AKfycbzrtKQLgECnB1PqFm9Tl9QpA79-y7XQFB5G96mfiXPwXupLAyucnqc16kKrYDjEYR1E/exec';

// 2. URL Proxy Cloudflare Workers (AKTIF — meneruskan ke Google Apps Script tanpa cookie)
//    PENGINGAT PENTING SAAT PINDAH DOMAIN SEKOLAH:
//    Jika nanti web pindah dari https://smkbkciawi.github.io ke domain baru
//    (misal https://bkcsiplin.smkbkc.sch.id), WAJIB tambahkan 1 baris domain baru
//    tersebut ke daftar ALLOWED_EXACT_ORIGINS di Cloudflare Worker (bkcsiplin-api)
//    lalu klik Deploy (15 detik) agar domain baru ikut diizinkan melewati Proxy!
window.BKC_PROXY_URL = 'https://bkcsiplin-api.limatujuhempat.workers.dev';

// 3. URL Aktif yang dipakai seluruh portal (otomatis memilih Proxy jika terisi)
window.BKC_API_URL = (window.BKC_PROXY_URL && window.BKC_PROXY_URL.trim())
  ? window.BKC_PROXY_URL.trim().replace(/\/+$/, '')
  : window.BKC_GAS_URL;

// Penanda internal apakah jalur Proxy Cloudflare sedang aktif
window.BKC_USING_PROXY = Boolean(window.BKC_PROXY_URL && window.BKC_PROXY_URL.trim());

// =========================================================================
// 4. HELPER NAVIGASI LOGIN, LOGOUT & AUTO-LOGIN LINTAS PORTAL (SSO RINGAN)
// =========================================================================
(function initBkcSso() {
  const MODULE_ROLES = {
    gerbang: ['GURU_PIKET', 'SUPER_ADMIN'],
    sholat: ['GURU_PIKET', 'GURU_BK', 'WAKA_KESISWAAN', 'WALI_KELAS', 'KEPSEK', 'SUPER_ADMIN'],
    disiplin: ['GURU_BK', 'WAKA_KESISWAAN', 'WALI_KELAS', 'SUPER_ADMIN', 'KEPSEK', 'PETUGAS_OSIS'],
    admin: ['SUPER_ADMIN', 'KEPSEK', 'GURU_BK', 'WAKA_KESISWAAN', 'WALI_KELAS']
  };

  const PORTAL_KEYS = [
    { modul: 'admin', token: 'bkc_admin_token', nama: 'bkc_admin_nama', role: 'bkc_admin_role' },
    { modul: 'disiplin', token: 'bkc_disiplin_token', nama: 'bkc_disiplin_nama', role: 'bkc_disiplin_role' },
    { modul: 'sholat', token: 'bkc_sholat_token', nama: 'bkc_sholat_nama', role: 'bkc_sholat_role' },
    { modul: 'gerbang', token: 'bkc_token', nama: 'bkc_petugas', role: 'bkc_role' }
  ];

  function roleAllowed(modul, roleStr) {
    const allowed = MODULE_ROLES[modul];
    if (!allowed || !roleStr) return false;
    const arr = String(roleStr).toUpperCase().split(',').map(s => s.trim()).filter(Boolean);
    return arr.some(r => allowed.includes(r));
  }

  function findCandidate(targetModul) {
    try {
      if (sessionStorage.getItem('bkc_logged_out_' + targetModul) === '1') return null;
      for (const p of PORTAL_KEYS) {
        if (p.modul === targetModul) continue;
        const sTok = sessionStorage.getItem(p.token);
        const lTok = localStorage.getItem(p.token);
        const token = sTok || lTok || '';
        if (!token || token === 'offline-token') continue;
        const nama = sessionStorage.getItem(p.nama) || localStorage.getItem(p.nama) || '';
        const role = sessionStorage.getItem(p.role) || localStorage.getItem(p.role) || '';
        if (roleAllowed(targetModul, role)) {
          return { token, nama, role, persisted: Boolean(lTok && !sTok) || Boolean(lTok) };
        }
      }
    } catch (_) {}
    return null;
  }

  function markLoggedOut(modul) {
    try { sessionStorage.setItem('bkc_logged_out_' + modul, '1'); } catch (_) {}
  }

  function clearAllLoggedOut() {
    try {
      ['admin', 'sholat', 'disiplin', 'gerbang'].forEach(m => sessionStorage.removeItem('bkc_logged_out_' + m));
    } catch (_) {}
  }

  function goHome(flashMsg) {
    try {
      if (flashMsg) sessionStorage.setItem('bkc_flash_msg', String(flashMsg));
    } catch (_) {}
    window.location.href = 'index.html';
  }

  function consumeFlash() {
    try {
      const msg = sessionStorage.getItem('bkc_flash_msg') || '';
      if (msg) sessionStorage.removeItem('bkc_flash_msg');
      return msg;
    } catch (_) {
      return '';
    }
  }

  function bindLoginEsc(loginModalId, blockingModalIds) {
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      const loginEl = document.getElementById(loginModalId);
      if (!loginEl || !loginEl.classList.contains('show')) return;
      const blockers = Array.isArray(blockingModalIds) ? blockingModalIds : [];
      for (const id of blockers) {
        const el = document.getElementById(id);
        if (el && el.classList.contains('show')) return;
      }
      e.preventDefault();
      goHome();
    });
  }

  window.BKC_SSO = {
    roleAllowed,
    findCandidate,
    markLoggedOut,
    clearAllLoggedOut,
    goHome,
    consumeFlash,
    bindLoginEsc
  };
})();
