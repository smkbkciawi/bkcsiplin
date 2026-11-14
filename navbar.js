/* =========================================================
   NAVBAR UNIVERSAL BKCSIPLIN
   Cukup panggil <script src="navbar.js"></script> di setiap HTML
   ========================================================= */
(function() {
  // 1. Ambil data sesi (fleksibel dari modul mana pun)
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

  // 2. Jangan tampilkan navbar jika belum login (di halaman login)
  const halamanSaatIni = window.location.pathname.split('/').pop() || 'index.html';
  if (!token && halamanSaatIni !== 'index.html') return;

  // 3. Daftar menu & hak akses
  const menuAll = [
    { href: 'gerbang.html', label: 'Gerbang', icon: '🚪', roles: ['GURU_PIKET','SUPER_ADMIN'] },
    { href: 'sholat.html', label: 'Sholat', icon: '🕌', roles: ['GURU_PIKET','GURU_BK','WALI_KELAS','KEPSEK','SUPER_ADMIN'] },
    { href: 'disiplin.html', label: 'Disiplin', icon: '⚖️', roles: ['GURU_BK','WAKA_KESISWAAN','SUPER_ADMIN','KEPSEK'] },
    { href: 'admin.html', label: 'Admin', icon: '⚙️', roles: ['SUPER_ADMIN','KEPSEK','GURU_BK','WAKA_KESISWAAN'] }
  ];

  const allowed = menuAll.filter(m => !m.roles || m.roles.some(r => roleUpper.includes(r)));

  // 4. Buat elemen Navbar
  const nav = document.createElement('nav');
  nav.className = 'bkc-navbar';
  
  let linksHtml = '';
  allowed.forEach(m => {
    const active = (halamanSaatIni === m.href) ? 'bkc-active' : '';
    linksHtml += `<a href="${m.href}" class="bkc-link ${active}">${m.icon} ${m.label}</a>`;
  });

  nav.innerHTML = `
    <div class="bkc-brand">
      <div class="bkc-logo">BK</div>
      <span class="bkc-brand-txt">BKCSiplin</span>
    </div>
    <div class="bkc-links">${linksHtml}</div>
    <div class="bkc-user">
      <span class="bkc-badge">${nama}</span>
      <button class="bkc-logout" onclick="bkcDoLogout()">Logout</button>
      <button class="bkc-hamburger" onclick="bkcToggleMenu()">☰</button>
    </div>
  `;

  // 5. Buat elemen Menu Mobile
  const mobileMenu = document.createElement('div');
  mobileMenu.className = 'bkc-mobile-menu';
  mobileMenu.id = 'bkc-mobile-menu';
  mobileMenu.innerHTML = linksHtml;

  // 6. Suntikkan CSS & HTML ke halaman
  const style = document.createElement('style');
  style.innerHTML = `
    body { padding-top: 56px !important; }
    .bkc-navbar {
      position: fixed; top: 0; left: 0; right: 0; z-index: 99999;
      background: linear-gradient(135deg, #0A1533, #102252);
      color: #fff; display: flex; align-items: center; justify-content: space-between;
      padding: 0 1rem; height: 56px; box-shadow: 0 4px 12px rgba(0,0,0,.2);
      font-family: 'Inter', system-ui, sans-serif;
    }
    .bkc-navbar .bkc-brand { display: flex; align-items: center; gap: .6rem; font-weight: 800; font-size: .95rem; }
    .bkc-navbar .bkc-logo { width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg, #3B82F6, #1E40AF); display: grid; place-items: center; font-weight: 900; font-size: .85rem; }
    .bkc-navbar .bkc-links { display: flex; gap: .3rem; align-items: center; }
    .bkc-navbar .bkc-link { color: #B9CDF0; text-decoration: none; font-weight: 600; padding: .5rem .8rem; border-radius: 8px; font-size: .85rem; transition: .15s; }
    .bkc-navbar .bkc-link:hover, .bkc-navbar .bkc-link.bkc-active { background: rgba(59,130,246,.25); color: #fff; }
    .bkc-navbar .bkc-user { display: flex; align-items: center; gap: .6rem; font-size: .78rem; font-weight: 700; }
    .bkc-navbar .bkc-badge { background: rgba(255,255,255,.15); padding: .35rem .7rem; border-radius: 99px; }
    .bkc-navbar .bkc-logout { background: rgba(239,68,68,.2); border: 1px solid rgba(239,68,68,.4); color: #FCA5A5; padding: .35rem .7rem; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: .78rem; }
    .bkc-navbar .bkc-hamburger { display: none; background: rgba(255,255,255,.15); border: none; color: #fff; font-size: 1.2rem; width: 38px; height: 38px; border-radius: 8px; cursor: pointer; }
    .bkc-mobile-menu { position: fixed; top: 56px; left: 0; right: 0; background: #0A1533; z-index: 99998; padding: .5rem; display: none; flex-direction: column; gap: .2rem; border-bottom: 1px solid rgba(96,165,250,.2); font-family: 'Inter', sans-serif; }
    .bkc-mobile-menu.show { display: flex; }
    .bkc-mobile-menu a { color: #B9CDF0; text-decoration: none; font-weight: 600; padding: .8rem 1rem; border-radius: 8px; font-size: .9rem; }
    .bkc-mobile-menu a:hover, .bkc-mobile-menu a.bkc-active { background: #3B82F6; color: #fff; }
    @media (max-width: 768px) {
      .bkc-navbar .bkc-links { display: none; }
      .bkc-navbar .bkc-hamburger { display: grid; place-items: center; }
      .bkc-navbar .bkc-brand-txt { display: none; }
    }
  `;

  document.head.appendChild(style);
  document.body.insertBefore(nav, document.body.firstChild);
  document.body.insertBefore(mobileMenu, nav.nextSibling);

  window.bkcToggleMenu = function() {
    document.getElementById('bkc-mobile-menu').classList.toggle('show');
  };

  window.bkcDoLogout = function() {
    if (!confirm('Logout dari sistem?')) return;
    sessionStorage.clear();
    window.location.href = 'index.html';
  };
})();
