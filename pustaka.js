// ==========================================
// PUSTAKA BKCSIPLIN (API CALL & POP-UP BLOKIR)
// ==========================================

// 1. Fungsi API Call Otomatis (PC / HP)
function apiCall(action, payload = {}, isPost = false) {
  return new Promise((resolve, reject) => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Ambil token dari sessionStorage (mencakup semua modul)
    let currentToken = '';
    if (typeof state !== 'undefined' && state.token) {
      currentToken = state.token;
    } else {
      currentToken = sessionStorage.getItem('bkc_admin_token') || 
                     sessionStorage.getItem('bkc_sholat_token') || 
                     sessionStorage.getItem('bkc_disiplin_token') || 
                     sessionStorage.getItem('bkc_token') || '';
    }

    if (isMobile) {
      // JALUR HP: Pakai FETCH Form-URL-Encoded (Kebal Blokir)
      let formBody = `action=${encodeURIComponent(action)}`;
      if (currentToken) formBody += `&token=${encodeURIComponent(currentToken)}`;
      formBody += `&payload=${encodeURIComponent(JSON.stringify(payload))}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 detik timeout

      fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formBody,
        signal: controller.signal
      })
      .then(r => r.json())
      .then(res => {
        clearTimeout(timeoutId);
        resolve(res);
      })
      .catch(err => {
        clearTimeout(timeoutId);
        // Jika gagal/diblokir, panggil pop-up
        tampilkanPeringatanBlokir();
        reject(new Error('Gagal koneksi / Diblokir Browser'));
      });
      
    } else {
      // JALUR PC: Pakai JSONP (Cara Lama, Stabil)
      const cbName = 'jsonp_' + Math.round(100000 * Math.random());
      const script = document.createElement('script');
      
      let url = `${API_URL}?callback=${cbName}&action=${action}`;
      if (currentToken) url += `&token=${currentToken}`;
      
      if (isPost) { 
        url += `&payload=${encodeURIComponent(JSON.stringify(payload))}`; 
      } else { 
        for (let k in payload) { 
          if (payload[k] !== undefined && payload[k] !== null) {
            url += `&${k}=${encodeURIComponent(payload[k])}`; 
          }
        } 
      }

      window[cbName] = function(res) { 
        try { document.body.removeChild(script); } catch (e) {}
        delete window[cbName]; 
        resolve(res); 
      };
      
      script.src = url;
      script.onerror = () => {
        try { document.body.removeChild(script); } catch (e) {}
        delete window[cbName];
        reject(new Error('Gagal koneksi'));
      };
      document.body.appendChild(script);
    }
  });
}

// 2. Fungsi Memunculkan Pop-up
function tampilkanPeringatanBlokir() {
  let popup = document.getElementById('popup-blokir');
  if (!popup) {
    // Jika HTML pop-up belum ada, buat otomatis
    const div = document.createElement('div');
    div.innerHTML = `
      <div class="popup-blokir-overlay" id="popup-blokir">
        <div class="popup-blokir-box">
          <i class="fas fa-shield-alt" style="font-size: 3rem; color: #EF4444; margin-bottom: 15px;"></i>
          <h3>Akses Diblokir Browser</h3>
          <p>Google mendeteksi ada lebih dari 1 akun login di browser ini. Pindah ke <b>Mode Incognito</b> atau gunakan <b>Browser Lain (Edge/UC)</b> untuk melanjutkan.</p>
          <a href="#" class="btn-pindah-browser" id="btn-incognito">Buka Mode Aman (Incognito)</a>
          <button onclick="document.getElementById('popup-blokir').classList.remove('show')" class="btn-tutup-popup">Tutup Peringatan</button>
        </div>
      </div>
    `;
    document.body.appendChild(div);
    popup = document.getElementById('popup-blokir');
    
    // Set URL Incognito sesuai halaman saat ini
    document.getElementById('btn-incognito').href = `googlechrome://navigate?url=${window.location.href}`;
  }
  popup.classList.add('show');
}

// 3. Suntikkan CSS Pop-up otomatis ke dalam <head>
(function() {
  if (!document.getElementById('css-pustaka-bkc')) {
    const style = document.createElement('style');
    style.id = 'css-pustaka-bkc';
    style.innerHTML = `
      .popup-blokir-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 9999; display: none; align-items: center; justify-content: center; padding: 20px; backdrop-filter: blur(4px); }
      .popup-blokir-overlay.show { display: flex; }
      .popup-blokir-box { background: #fff; border-radius: 16px; padding: 24px; max-width: 400px; width: 100%; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.2); font-family: 'Inter', sans-serif; }
      .popup-blokir-box h3 { color: #EF4444; font-size: 1.2rem; margin-bottom: 10px; font-weight: 800; }
      .popup-blokir-box p { color: #475569; font-size: 0.95rem; line-height: 1.5; margin-bottom: 20px; }
      .btn-pindah-browser { display: block; width: 100%; padding: 12px; background: #2563EB; color: #fff; border: none; border-radius: 8px; font-weight: 700; font-size: 1rem; cursor: pointer; margin-bottom: 10px; text-decoration: none; }
      .btn-pindah-browser:hover { background: #1D4ED8; }
      .btn-tutup-popup { display: block; width: 100%; padding: 12px; background: #F1F5F9; color: #475569; border: none; border-radius: 8px; font-weight: 700; font-size: 1rem; cursor: pointer; }
      .btn-tutup-popup:hover { background: #E2E8F0; }
    `;
    document.head.appendChild(style);
  }
})();
