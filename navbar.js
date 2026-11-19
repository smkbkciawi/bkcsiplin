/* =========================================================
   NAVBAR TERPADU (INLINE & ADMINLTE) — BKCSIPLIN
   Tidak menimpa header/drawer/konten; menyatu rapi di tiap halaman.
   ========================================================= */
(function () {
  const ICONS = {
    home: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5L12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/></svg>',
    gerbang: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
    sholat: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c-2.5 2-4 4.2-4 6.5V21h8V9.5C16 7.2 14.5 5 12 3z"/><path d="M4 21V12l2-1.5"/><path d="M20 21V12l-2-1.5"/></svg>',
    disiplin: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="3" x2="12" y2="21"/><path d="M5 21h14"/><path d="M4 7h16"/><path d="M4 7l-2 6h4l-2-6z"/><path d="M20 7l-2 6h4l-2-6z"/></svg>',
    admin: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>'
  };

  const MODULES = [
    { href: 'index.html', label: 'Beranda', icon: ICONS.home, always: true },
    { href: 'gerbang.html', label: 'Gerbang', icon: ICONS.gerbang, roles: ['GURU_PIKET', 'SUPER_ADMIN'], match: ['gerbang.html', 'gerbang2online.html'] },
    { href: 'sholat.html', label: 'Sholat', icon: ICONS.sholat, roles: ['GURU_PIKET', 'GURU_BK', 'WAKA_KESISWAAN', 'WALI_KELAS', 'KEPSEK', 'SUPER_ADMIN'], match: ['sholat.html'] },
    { href: 'disiplin.html', label: 'Disiplin', icon: ICONS.disiplin, roles: ['GURU_BK', 'WAKA_KESISWAAN', 'WALI_KELAS', 'SUPER_ADMIN', 'KEPSEK'], match: ['disiplin.html'] },
    { href: 'admin.html', label: 'Admin', icon: ICONS.admin, roles: ['SUPER_ADMIN', 'KEPSEK', 'GURU_BK', 'WAKA_KESISWAAN', 'WALI_KELAS'], match: ['admin.html'] }
  ];

  function getActiveAuth() {
    const page = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
    // Prioritaskan sesi milik halaman yang sedang dibuka
    if (page === 'admin.html') {
      const t = sessionStorage.getItem('bkc_admin_token');
      const r = sessionStorage.getItem('bkc_admin_role');
      if (t) return { token: t, role: r || '' };
    } else if (page === 'disiplin.html') {
      const t = sessionStorage.getItem('bkc_disiplin_token');
      const r = sessionStorage.getItem('bkc_disiplin_role');
      if (t) return { token: t, role: r || '' };
    } else if (page === 'sholat.html') {
      const t = sessionStorage.getItem('bkc_sholat_token');
      const r = sessionStorage.getItem('bkc_sholat_role');
      if (t) return { token: t, role: r || '' };
    } else if (page === 'gerbang.html' || page === 'gerbang2online.html') {
      const t = sessionStorage.getItem('bkc_token');
      const r = sessionStorage.getItem('bkc_role');
      if (t) return { token: t, role: r || '' };
    }

    // Fallback ke sesi modul mana pun yang tersedia
    const pairs = [
      ['bkc_admin_token', 'bkc_admin_role'],
      ['bkc_disiplin_token', 'bkc_disiplin_role'],
      ['bkc_sholat_token', 'bkc_sholat_role'],
      ['bkc_token', 'bkc_role']
    ];
    for (const [tk, rk] of pairs) {
      const t = sessionStorage.getItem(tk);
      if (t) return { token: t, role: sessionStorage.getItem(rk) || '' };
    }
    return { token: '', role: '' };
  }

  function getAllowedModules(auth) {
    if (!auth.token) {
      return MODULES.filter(m => m.always);
    }
    const rolesArr = String(auth.role || '')
      .toUpperCase()
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    return MODULES.filter(m => {
      if (m.always) return true;
      if (!rolesArr.length) return false;
      return m.roles.some(r => rolesArr.includes(r));
    });
  }

  function injectStyleOnce() {
    if (document.getElementById('bkc-navbar-style')) return;
    const style = document.createElement('style');
    style.id = 'bkc-navbar-style';
    style.textContent = `
      .bkc-inline-nav {
        display: flex;
        align-items: center;
        gap: .35rem;
        flex-wrap: wrap;
      }
      .bkc-inline-link {
        display: inline-flex;
        align-items: center;
        gap: .38rem;
        padding: .38rem .72rem;
        border-radius: 9px;
        font-size: .78rem;
        font-weight: 700;
        text-decoration: none;
        color: rgba(255,255,255,.88);
        background: rgba(255,255,255,.10);
        border: 1px solid rgba(255,255,255,.16);
        transition: background .15s, color .15s, border-color .15s;
        white-space: nowrap;
        line-height: 1.2;
      }
      .bkc-inline-link:hover {
        background: rgba(255,255,255,.22);
        color: #fff;
      }
      .bkc-inline-link.active {
        background: rgba(255,255,255,.95);
        color: #0F172A;
        border-color: transparent;
        box-shadow: 0 2px 8px rgba(0,0,0,.15);
      }

      /* AdminLTE Top Bar Integration */
      .bkc-admin-nav {
        display: flex;
        align-items: center;
        gap: .3rem;
        position: relative;
      }
      .bkc-admin-pills {
        display: flex;
        align-items: center;
        gap: .28rem;
      }
      .bkc-admin-link {
        display: inline-flex;
        align-items: center;
        gap: .35rem;
        padding: .32rem .68rem;
        border-radius: 8px;
        font-size: .78rem;
        font-weight: 700;
        text-decoration: none !important;
        color: #475569;
        background: #F1F5F9;
        border: 1px solid #E2E8F0;
        transition: all .15s;
        white-space: nowrap;
      }
      .bkc-admin-link:hover {
        background: #DBEAFE;
        color: #1E3A8A;
        border-color: #BFDBFE;
      }
      .bkc-admin-link.active {
        background: #1E3A8A;
        color: #fff;
        border-color: #1E3A8A;
      }
      .bkc-admin-drop-wrap {
        display: none;
        position: relative;
      }
      .bkc-admin-drop-btn {
        display: inline-flex;
        align-items: center;
        gap: .35rem;
        padding: .32rem .65rem;
        border-radius: 8px;
        font-size: .78rem;
        font-weight: 700;
        color: #1E3A8A;
        background: #EFF6FF;
        border: 1px solid #BFDBFE;
        cursor: pointer;
      }
      .bkc-admin-drop-menu {
        position: absolute;
        top: calc(100% + 6px);
        left: 0;
        min-width: 170px;
        background: #fff;
        border: 1px solid #E2E8F0;
        border-radius: 10px;
        box-shadow: 0 10px 28px rgba(15,23,42,.15);
        padding: .35rem;
        display: none;
        flex-direction: column;
        gap: .2rem;
        z-index: 1050;
      }
      .bkc-admin-drop-menu.show { display: flex; }
      .bkc-admin-drop-menu a {
        display: flex;
        align-items: center;
        gap: .5rem;
        padding: .48rem .7rem;
        border-radius: 7px;
        font-size: .82rem;
        font-weight: 700;
        text-decoration: none !important;
        color: #1E293B;
      }
      .bkc-admin-drop-menu a:hover { background: #EFF6FF; color: #1E3A8A; }
      .bkc-admin-drop-menu a.active { background: #1E3A8A; color: #fff; }

      @media (max-width: 991px) {
        .bkc-admin-pills { display: none; }
        .bkc-admin-drop-wrap { display: inline-block; }
      }

      @media (max-width: 820px) {
        .bkc-inline-nav {
          order: 10;
          flex-basis: 100%;
          width: 100%;
          padding-top: .55rem;
          margin-top: .15rem;
          border-top: 1px solid rgba(255,255,255,.15);
          flex-wrap: nowrap;
          overflow-x: auto;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
        }
        .bkc-inline-nav::-webkit-scrollbar { display: none; }
        .bkc-inline-link { font-size: .74rem; padding: .34rem .62rem; }
      }

      @media print {
        #bkc-inline-nav, #bkc-admin-nav, .bkc-inline-nav, .bkc-admin-nav {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function renderNavbar() {
    injectStyleOnce();
    const page = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
    const auth = getActiveAuth();
    const allowed = getAllowedModules(auth);

    // 1. Render pada header halaman modul (sholat, disiplin, gerbang, gerbang2online)
    const inlineHost = document.getElementById('bkc-inline-nav');
    if (inlineHost) {
      inlineHost.className = 'bkc-inline-nav';
      inlineHost.setAttribute('aria-label', 'Navigasi Modul');
      inlineHost.innerHTML = allowed.map(m => {
        const isActive = (m.match ? m.match.includes(page) : page === m.href);
        return `<a href="${m.href}" class="bkc-inline-link${isActive ? ' active' : ''}">${m.icon}<span>${m.label}</span></a>`;
      }).join('');
    }

    // 2. Render pada top bar AdminLTE (admin.html)
    const adminHost = document.getElementById('bkc-admin-nav');
    if (adminHost) {
      adminHost.className = 'bkc-admin-nav';
      const pillsHtml = allowed.map(m => {
        const isActive = (m.match ? m.match.includes(page) : page === m.href);
        return `<a href="${m.href}" class="bkc-admin-link${isActive ? ' active' : ''}">${m.icon}<span>${m.label}</span></a>`;
      }).join('');
      const dropHtml = allowed.map(m => {
        const isActive = (m.match ? m.match.includes(page) : page === m.href);
        return `<a href="${m.href}" class="${isActive ? 'active' : ''}">${m.icon}<span>${m.label}</span></a>`;
      }).join('');

      adminHost.innerHTML = `
        <div class="bkc-admin-pills">${pillsHtml}</div>
        <div class="bkc-admin-drop-wrap">
          <button type="button" class="bkc-admin-drop-btn" id="bkc-admin-drop-toggle">
            <i class="fas fa-th-large"></i><span>Modul</span><i class="fas fa-caret-down"></i>
          </button>
          <div class="bkc-admin-drop-menu" id="bkc-admin-drop-menu">${dropHtml}</div>
        </div>
      `;

      const toggleBtn = document.getElementById('bkc-admin-drop-toggle');
      const dropMenu = document.getElementById('bkc-admin-drop-menu');
      if (toggleBtn && dropMenu) {
        toggleBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          dropMenu.classList.toggle('show');
        });
      }
    }
  }

  document.addEventListener('click', function () {
    const dropMenu = document.getElementById('bkc-admin-drop-menu');
    if (dropMenu) dropMenu.classList.remove('show');
  });

  window.bkcRefreshNav = renderNavbar;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderNavbar);
  } else {
    renderNavbar();
  }
  window.addEventListener('pageshow', renderNavbar);
})();
