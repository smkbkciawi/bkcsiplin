/* =========================================================
   NAVBAR UNIVERSAL (SOLID & AUTO-THEME) BKCSIPLIN
   ========================================================= */
(function() {
  const token = sessionStorage.getItem('bkc_token') || 
                sessionStorage.getItem('bkc_sholat_token') || 
                sessionStorage.getItem('bkc_disiplin_token') || 
                sessionStorage.getItem('bkc_admin_token');
                
  const nama = sessionStorage.getItem('bkc_petugas') || 
               sessionStorage.getItem('bkc_sholat_nama') || 
               sessionStorage.getItem('bkc_disiplin_nama') || 
               sessionStorage.getItem('bkc_admin_nama') || 'Petugas';
               
  const role = sessionStorage.getItem('bkc_role') || 
               sessionStorage.getItem('bkc_sholat_role') || 
               sessionStorage.getItem('bkc_disiplin_role') || 
               sessionStorage.getItem('bkc_admin_role') || '';
               
  const roleUpper = String(role).toUpperCase();
  const page = window.location.pathname.split('/').pop() || 'index.html';

  // Jangan tampilkan di halaman login (jika belum ada token)
  if (!token && page !== 'index.html') return;

  // Warna Tema Berdasarkan Halaman
  let themeColor = '#0A1533'; // Biru Gelap
  if (page.includes('sholat')) themeColor = '#059669'; // Hijau Emerald
  if (page.includes('disiplin')) themeColor = '#881337'; // Maroon

  // Daftar Menu (Saya buka akses Gerbang untuk sementara agar muncul)
  const menu = [
    { href: 'gerbang.html', label: 'Gerbang', roles: ['GURU_PIKET','SUPER_ADMIN','GURU_BK'] },
    { href: 'sholat.html', label: 'Sholat', roles: ['GURU_PIKET','GURU_BK','WALI_KELAS','KEPSEK','SUPER_ADMIN'] },
    { href: 'disiplin.html', label: 'Disiplin', roles: ['GURU_BK','WAKA_KESISWAAN','SUPER_ADMIN','KEPSEK'] },
    { href: 'admin.html', label: 'Admin', roles: ['SUPER_ADMIN','KEPSEK','GURU_BK','WAKA_KESISWAAN'] }
  ];

  const allowed = menu.filter(m => !m.roles || m.roles.some(r => roleUpper.includes(r)));
  
  let linksHtml = '';
  allowed.forEach(m => {
    const active = (page === m.href) ? 'active' : '';
    linksHtml += `<a href="${m.href}" class="${active}">${m.label}</a>`;
  });

  // Buat HTML Navbar
  const nav = document.createElement('nav');
  nav.className = 'bkc-navbar';
  nav.style.backgroundColor = themeColor;
  nav.innerHTML = `
    <div class="bkc-brand">
      <div class="bkc-logo">BK</div>
      <span class="bkc-title">BKCSiplin</span>
    </div>
    <div class="bkc-links">${linksHtml}</div>
    <div class="bkc-user">
      <span class="bkc-pill">${nama}</span>
      <button class="bkc-btn" onclick="bkcLogout()">Keluar</button>
      <button class="bkc-hamburger" onclick="bkcToggleNav()">☰</button>
    </div>
  `;

  // Buat HTML Menu Mobile (Warna Solid)
  const mobileNav = document.createElement('div');
  mobileNav.className = 'bkc-mobile-nav';
  mobileNav.id = 'bkc-mobile-nav';
  mobileNav.style.backgroundColor = themeColor;
  mobileNav.innerHTML = linksHtml;

  // Suntikkan CSS
  const style = document.createElement('style');
  style.innerHTML = `
    /* Tambah jarak atas agar tidak menutupi konten */
    body { padding-top: 60px !important; }
    
    .bkc-navbar {
      position: fixed; top: 0; left: 0; right: 0; height: 60px; z-index: 99999;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 1.2rem; color: #fff; font-family: 'Inter', sans-serif;
      box-shadow: 0 4px 15px rgba(0,0,0,.2);
    }
    .bkc-navbar .bkc-brand { display: flex; align-items: center; gap: .6rem; font-weight: 800; }
    .bkc-navbar .bkc-logo { width: 34px; height: 34px; border-radius: 8px; background: rgba(255,255,255,.2); display: grid; place-items: center; font-weight: 900; font-size: .9rem; }
    .bkc-navbar .bkc-links { display: flex; gap: .5rem; }
    .bkc-navbar .bkc-links a { color: rgba(255,255,255,.85); text-decoration: none; font-weight: 700; font-size: .85rem; padding: .5rem .8rem; border-radius: 8px; transition: .2s; }
    .bkc-navbar .bkc-links a:hover, .bkc-navbar .bkc-links a.active { background: rgba(255,255,255,.25); color: #fff; }
    .bkc-navbar .bkc-user { display: flex; align-items: center; gap: .6rem; }
    .bkc-navbar .bkc-pill { background: rgba(255,255,255,.2); padding: .35rem .7rem; border-radius: 99px; font-size: .75rem; font-weight: 700; }
    .bkc-navbar .bkc-btn { background: rgba(239,68,68,.3); border: 1px solid rgba(239,68,68,.6); color: #fff; padding: .4rem .8rem; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: .75rem; }
    .bkc-navbar .bkc-hamburger { display: none; background: rgba(255,255,255,.2); border: none; color: #fff; font-size: 1.2rem; width: 36px; height: 36px; border-radius: 8px; cursor: pointer; }
    
    /* MENU MOBILE SOLID */
    .bkc-mobile-nav { 
      position: fixed; top: 60px; left: 0; right: 0; z-index: 99998; 
      padding: .5rem; display: none; flex-direction: column; gap: .2rem; 
      box-shadow: 0 4px 10px rgba(0,0,0,.2); 
    }
    .bkc-mobile-nav.show { display: flex; }
    .bkc-mobile-nav a { 
      text-decoration: none; font-weight: 700; padding: .9rem 1rem; 
      border-radius: 8px; font-size: .95rem; color: #fff; 
      background: rgba(255,255,255,.1); 
    }
    .bkc-mobile-nav a.active { background: rgba(255,255,255,.3); }
    
    @media (max-width: 768px) {
      .bkc-navbar .bkc-links { display: none; }
      .bkc-navbar .bkc-hamburger { display: grid; place-items: center; }
      .bkc-navbar .bkc-title { display: none; }
    }
  `;

  // Suntikkan CSS ke Head (sebelum halaman render)
  document.head.appendChild(style);

  // Suntikkan HTML ke Body saat DOM siap
  document.addEventListener('DOMContentLoaded', function() {
    document.body.insertBefore(nav, document.body.firstChild);
    document.body.insertBefore(mobileNav, nav.nextSibling);
  });

  window.bkcToggleNav = function() {
    const el = document.getElementById('bkc-mobile-nav');
    if (el) el.classList.toggle('show');
  };

  window.bkcLogout = function() {
    if (!confirm('Logout dari sistem?')) return;
    sessionStorage.clear();
    window.location.href = 'index.html';
  };
})();
