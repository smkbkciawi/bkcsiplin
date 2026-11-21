const SPREADSHEET_ID = '1Qal6IxJ9_qqEP1Z-w49pcUsQPx94MmIK4W1ghOm7jPU';
const TZ = 'Asia/Jakarta';

const SHEET = {
  SISWA: 'MASTER_SISWA',
  GURU: 'MASTER_GURU',
  KELAS: 'MASTER_KELAS',
  GERBANG: 'PRESENSI_GERBANG',
  GURU_HADIR: 'PRESENSI_GURU',
  REKAP_GURU: 'REKAP_GURU',
  REKAP_SISWA: 'REKAP_SISWA',
  SHOLAT: 'PRESENSI_SHOLAT',
  POIN: 'POIN_BK',
  PENGATURAN: 'PENGATURAN',
  TATA_TERTIB: 'MASTER_TATA_TERTIB',
  UDZUR: 'UDZUR_SYARI',
  AUDIT: 'LOG_AUDIT',
  KETERANGAN: 'KETERANGAN_ABSEN'
};

const DEFAULT_HEADERS = {
  MASTER_SISWA: ['nis', 'nama', 'kelas', 'jk', 'status', 'uid_rfid', 'foto_url', 'tgl_daftar', 'catatan', 'no_hp_ortu'],
  MASTER_GURU: ['id_guru', 'nama', 'pin', 'role', 'status', 'no_hp', 'uid_rfid'],
  MASTER_KELAS: ['id_kelas', 'nama_kelas', 'tingkat', 'jurusan', 'wali_kelas', 'status'],
  PRESENSI_GERBANG: ['id_log', 'timestamp', 'tanggal', 'nis', 'nama', 'kelas', 'tipe', 'sesi', 'status', 'petugas', 'sumber'],
  PRESENSI_GURU: ['id_log', 'timestamp', 'tanggal', 'jam', 'id_guru', 'nama_guru', 'tipe', 'sumber'],
  REKAP_SISWA: ['tanggal', 'nis', 'nama', 'kelas', 'jam_masuk', 'jam_pulang', 'status_masuk', 'status_pulang'],
  REKAP_GURU: ['id_guru', 'tanggal', 'jam_masuk', 'jam_pulang', 'status', 'total_jam'],
  PRESENSI_SHOLAT: ['id_log', 'timestamp', 'tanggal', 'nis', 'nama', 'kelas', 'waktu_sholat', 'status', 'petugas', 'sumber'],
  POIN_BK: ['id_poin', 'timestamp', 'tanggal', 'nis', 'nama', 'kelas', 'jenis', 'pasal', 'deskripsi', 'poin', 'saldo_setelah', 'petugas', 'divalidasi'],
  PENGATURAN: ['kunci', 'nilai', 'keterangan'],
  MASTER_TATA_TERTIB: ['kode', 'kategori', 'deskripsi', 'poin', 'jenis', 'aktif'],
  UDZUR_SYARI: ['id_udzur', 'nis', 'nama', 'tgl_mulai', 'tgl_selesai', 'alasan', 'dicatat_oleh', 'timestamp'],
  LOG_AUDIT: ['timestamp', 'id_guru', 'nama_guru', 'aksi', 'modul', 'detail', 'ip_hash'],
  KETERANGAN_ABSEN: ['id_keterangan', 'tanggal', 'nis', 'nama', 'kelas', 'status', 'keterangan', 'dicatat_oleh', 'timestamp']
};

function doGet(e) { return handleRequest_(e); }
function doPost(e) { return handleRequest_(e); }

function handleRequest_(e) {
  try {
    let params = (e && e.parameter) ? e.parameter : {};
    let parsedBody = null;
    if (e && e.postData && e.postData.contents) {
      try {
        parsedBody = JSON.parse(e.postData.contents);
        Object.assign(params, parsedBody);
      } catch (err) {}
    }
    // Deteksi Webhook 2 Arah dari Telegram Bot API (tidak membawa parameter action)
    // WAJIB balas HtmlService (HTTP 200 langsung) agar tidak terkena redirect 302 ContentService yang memicu loop retry Telegram
    if (parsedBody && parsedBody.update_id !== undefined) {
      try {
        if (parsedBody.callback_query) {
          handleTelegramCallback_(parsedBody);
        } else if (parsedBody.message || parsedBody.edited_message) {
          handleTelegramWebhook_(parsedBody);
        }
      } catch (_) {}
      return HtmlService.createHtmlOutput('OK');
    }
    const action = params.action || '';
    const token = params.token || '';
    let payload = params.payload || params;
    if (typeof payload === 'string') {
      try { payload = JSON.parse(payload); } catch (err) { payload = {}; }
    }
    if (typeof payload !== 'object' || payload === null) payload = {};
    if (!payload.rows && params.rows) {
      try { payload.rows = typeof params.rows === 'string' ? JSON.parse(params.rows) : params.rows; } catch (err) {}
    }

    let result;
    if (action === 'ping') result = { ok: true, message: 'pong' };
    else if (action === 'login') result = login_(payload);
    else if (action === 'logout') result = { ok: true, message: 'Logout' };
    else if (action === 'heartbeat') result = heartbeat_(token);

    // SISWA & KELAS
    else if (action === 'getMasterSiswa') result = getMasterSiswa_(token, payload);
    else if (action === 'getAbsenHariIni') result = getAbsenHariIni_(token, payload);
    else if (action === 'tambahSiswa') result = tambahSiswa_(token, payload);
    else if (action === 'editSiswa') result = editSiswa_(token, payload);
    else if (action === 'simpanNoWaOrtu') result = simpanNoWaOrtu_(token, payload);
    else if (action === 'hapusSiswa') result = hapusSiswa_(token, payload);
    else if (action === 'getMasterKelas') result = getMasterKelas_(token);
    else if (action === 'tambahKelas') result = tambahKelas_(token, payload);
    else if (action === 'editKelas') result = editKelas_(token, payload);
    else if (action === 'hapusKelas') result = hapusKelas_(token, payload);
    else if (action === 'getSiswaPerKelas') result = getSiswaPerKelas_(token, payload);
    else if (action === 'prosesNaikKelas') result = prosesNaikKelas_(token, payload);
    else if (action === 'prosesLulus') result = prosesLulus_(token, payload);

    // GURU & RFID
    else if (action === 'getMasterGuruFull') result = getMasterGuruFull_(token);
    else if (action === 'tambahGuru') result = tambahGuru_(token, payload);
    else if (action === 'editGuru') result = editGuru_(token, payload);
    else if (action === 'getGuruTanpaRfid') result = getGuruTanpaRfid_(token);
    else if (action === 'daftarRfidGuru') result = daftarRfidGuru_(token, payload);
    else if (action === 'getGuruWaliKelas') result = getGuruWaliKelas_(token);

    // SISWA RFID
    else if (action === 'getSiswaTanpaRfid') result = getSiswaTanpaRfid_(token);
    else if (action === 'daftarRfid') result = daftarRfid_(token, payload);

    // PRESENSI
    else if (action === 'presensiGerbang') result = presensiGerbang_(token, payload);
    else if (action === 'sinkronMassalGerbang') result = sinkronMassalGerbang_(token, payload);
    else if (action === 'searchOrang') result = searchOrang_(token, payload);
    else if (action === 'presensiSholat') result = presensiSholat_(token, payload);
    else if (action === 'simpanUdzur') result = simpanUdzur_(token, payload);
    else if (action === 'getUdzurAktif') result = getUdzurAktif_(token);
    else if (action === 'hapusUdzur') result = hapusUdzur_(token, payload);

    // DISIPLIN & POIN
    else if (action === 'catatPoin') result = catatPoin_(token, payload);
    else if (action === 'getRiwayatPoin') result = getRiwayatPoin_(token, payload);
    else if (action === 'getRekapPoinSemua') result = getRekapPoinSemua_(token, payload);
    else if (action === 'getSiswaBolosSholat') result = getSiswaBolosSholat_(token, payload);
    else if (action === 'validasiBolosSholat') result = validasiBolosSholat_(token, payload);
    else if (action === 'getLaporanOsisPending') result = getLaporanOsisPending_(token);
    else if (action === 'validasiLaporanOsis') result = validasiLaporanOsis_(token, payload);
    else if (action === 'batalkanPoinDispensasi') result = batalkanPoinDispensasi_(token, payload);

    // PUBLIK (TANPA TOKEN)
    else if (action === 'searchOrangPublik') result = searchOrangPublik_(payload);
    else if (action === 'getRiwayatPoinPublik') result = getRiwayatPoinPublik_(payload);
    else if (action === 'getRiwayatSiswaPublik') result = getRiwayatSiswaPublik_(payload);

    // KETERANGAN ABSEN
    else if (action === 'simpanKeteranganAbsen') result = simpanKeteranganAbsen_(token, payload);
    else if (action === 'getKeteranganAbsen') result = getKeteranganAbsen_(token, payload);
    else if (action === 'hapusKeteranganAbsen') result = hapusKeteranganAbsen_(token, payload);
    else if (action === 'getSiswaKelasSaya') result = getSiswaKelasSaya_(token);
    else if (action === 'getDashboardWaliKelas') result = getDashboardWaliKelas_(token);

    // IMPORT & RAPORT
    else if (action === 'importSiswa') result = importSiswa_(token, payload);
    else if (action === 'importGuru') result = importGuru_(token, payload);
    else if (action === 'importTatib') result = importTatib_(token, payload);
    else if (action === 'importSaldoAwal') result = importSaldoAwal_(token, payload);
    else if (action === 'setSaldoAwalBatch') result = setSaldoAwalBatch_(token, payload);
    else if (action === 'getRaportSiswa') result = getRaportSiswa_(token, payload);

    // LAINNYA
    else if (action === 'getTataTertib') result = getTataTertib_(token);
    else if (action === 'tambahTataTertib') result = tambahTataTertib_(token, payload);
    else if (action === 'editTataTertib') result = editTataTertib_(token, payload);
    else if (action === 'hapusTataTertib') result = hapusTataTertib_(token, payload);
    else if (action === 'getLaporan') result = getLaporan_(token, payload);
    else if (action === 'getDaftarKelas') result = getDaftarKelas_(token);
    else if (action === 'getKartuKelas') result = getKartuKelas_(token, payload);
    else if (action === 'getPengaturan') result = getPengaturan_(token);
    else if (action === 'simpanPengaturan') result = simpanPengaturan_(token, payload);
    else if (action === 'simpanPengaturanTerlambat') result = simpanPengaturanTerlambat_(token, payload);
    else if (action === 'tesTelegram') result = tesTelegram_(token, payload);
    else if (action === 'deteksiChatIdTelegram') result = deteksiChatIdTelegram_(token, payload);
    else if (action === 'setWebhookTelegram') result = setWebhookTelegram_(token, payload);
    else if (action === 'kirimRekapTelegramManual') result = kirimRekapTelegramManual_(token, payload);
    else if (action === 'aturJadwalTelegram') result = aturJadwalTelegram_(token, payload);
    else if (action === 'getDashboardSummary') result = getDashboardSummary_(token);
    else if (action === 'getJadwalSholat') result = getJadwalSholat_(token);
    else result = { ok: false, message: 'Aksi tidak dikenal: ' + action };

    const callback = params.callback;
    if (callback) return ContentService.createTextOutput(callback + '(' + JSON.stringify(result) + ')').setMimeType(ContentService.MimeType.JAVASCRIPT);
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, message: 'Server error: ' + err.message })).setMimeType(ContentService.MimeType.JSON);
  }
}

// --- UTILITAS SHEET & HEADER ---
function getOrCreateSheet_(ss, name) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  ensureHeaders_(sh, name);
  return sh;
}

function ensureHeaders_(sh, name) {
  if (!sh) return [];
  const lastCol = sh.getLastColumn();
  if (lastCol === 0 || sh.getLastRow() === 0) {
    const def = DEFAULT_HEADERS[name];
    if (def && def.length) {
      sh.getRange(1, 1, 1, def.length).setValues([def]);
      return def.slice();
    }
    return [];
  }
  const row1 = sh.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h).trim());
  if (!row1[0] && DEFAULT_HEADERS[name]) {
    const def = DEFAULT_HEADERS[name];
    sh.getRange(1, 1, 1, def.length).setValues([def]);
    return def.slice();
  }
  return row1;
}

function ensureColumn_(sh, sheetName, colName) {
  const headers = ensureHeaders_(sh, sheetName);
  const target = String(colName || '').trim().toLowerCase();
  const idx = headers.findIndex(h => String(h).trim().toLowerCase() === target);
  if (idx !== -1) return { headers: headers, idx: idx };
  const newCol = headers.length + 1;
  sh.getRange(1, newCol).setValue(colName);
  headers.push(colName);
  return { headers: headers, idx: newCol - 1 };
}

function getNoHpOrtu_(s) {
  if (!s) return '';
  return String(s.no_hp_ortu || s.no_wa || s.hp_ortu || s.no_hp || '').trim();
}

// Jalankan fungsi ini 1x manual dari editor Apps Script jika ingin membuat/melengkapi seluruh tab & header
function SetupSemuaSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  Object.keys(DEFAULT_HEADERS).forEach(name => {
    getOrCreateSheet_(ss, name);
  });
}

// --- UTILITAS TANGGAL & WAKTU ---
function getTanggalBersih_(val) {
  if (!val) return '';
  try {
    if (val instanceof Date) {
      return Utilities.formatDate(val, TZ, 'yyyy-MM-dd');
    }
    const str = String(val).trim();
    if (str.includes('T')) {
      const d = new Date(str);
      if (!isNaN(d.getTime())) return Utilities.formatDate(d, TZ, 'yyyy-MM-dd');
    }
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
      return str.substring(0, 10);
    }
    if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(str)) {
      const parts = str.split('/');
      return parts[2] + '-' + parts[1].padStart(2, '0') + '-' + parts[0].padStart(2, '0');
    }
    return str.substring(0, 10);
  } catch (e) {
    return String(val).substring(0, 10);
  }
}

function formatJamSheet(val, def) {
  if (val === undefined || val === null || val === '') return def;
  if (val instanceof Date) return Utilities.formatDate(val, TZ, 'HH:mm');
  const str = String(val).trim();
  if (str === '-' || str === 'null' || str === 'undefined') return def;
  if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(str)) {
    const d = new Date(str);
    if (!isNaN(d.getTime()) && str.includes('T')) return Utilities.formatDate(d, TZ, 'HH:mm');
    const parts = str.split(/[T ]/);
    if (parts[1]) return parts[1].substring(0, 5);
  }
  const clean = str.replace('.', ':');
  if (/^\d{2}:\d{2}/.test(clean)) return clean.substring(0, 5);
  const m = clean.match(/(\d{1,2}):(\d{2})/);
  if (m) return (m[1].length === 1 ? '0' : '') + m[1] + ':' + m[2];
  return def;
}

function readAll_(name) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(name);
    if (!sh) return [];
    const values = sh.getDataRange().getValues();
    if (values.length < 2) return [];
    const headers = values[0].map(h => String(h).trim());
    const rows = [];
    for (let i = 1; i < values.length; i++) {
      const obj = { _row: i + 1 };
      for (let j = 0; j < headers.length; j++) obj[headers[j]] = values[i][j];
      rows.push(obj);
    }
    return rows;
  } catch (e) { return []; }
}

function appendRow_(name, obj, textColumns) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sh = getOrCreateSheet_(ss, name);
  const headers = ensureHeaders_(sh, name);
  if (!headers.length) return;
  const rowArr = headers.map(h => (obj[h] !== undefined ? obj[h] : ''));
  const targetRow = sh.getLastRow() + 1;
  const range = sh.getRange(targetRow, 1, 1, headers.length);
  if (Array.isArray(textColumns) && textColumns.length) {
    textColumns.forEach(colName => {
      const idx = headers.findIndex(h => h.toLowerCase() === String(colName).toLowerCase());
      if (idx !== -1) sh.getRange(targetRow, idx + 1).setNumberFormat('@');
    });
  }
  range.setValues([rowArr]);
}

function appendRowsObjects_(name, objList, textColumns) {
  if (!objList || !objList.length) return;
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sh = getOrCreateSheet_(ss, name);
  const headers = ensureHeaders_(sh, name);
  if (!headers.length) return;
  const startRow = sh.getLastRow() + 1;
  const rowsArr = objList.map(obj => headers.map(h => (obj[h] !== undefined ? obj[h] : '')));
  if (Array.isArray(textColumns) && textColumns.length) {
    textColumns.forEach(colName => {
      const idx = headers.findIndex(h => h.toLowerCase() === String(colName).toLowerCase());
      if (idx !== -1) sh.getRange(startRow, idx + 1, rowsArr.length, 1).setNumberFormat('@');
    });
  }
  sh.getRange(startRow, 1, rowsArr.length, headers.length).setValues(rowsArr);
}

function verifikasiToken_(token) {
  if (!token) throw new Error('Token kosong.');
  const raw = CacheService.getScriptCache().get('sess_' + token);
  if (!raw) throw new Error('Sesi kedaluwarsa.');
  return JSON.parse(raw);
}
function makeId_(p) { const d = new Date(); return p + '-' + Utilities.formatDate(d, TZ, 'yyyyMMdd') + '-' + Utilities.formatDate(d, TZ, 'HHmmss') + '-' + Math.floor(Math.random() * 9000 + 1000); }
function normalisasiUid_(u) { return String(u || '').replace(/[\s\-:]/g, '').toUpperCase(); }
function todayStr_() { return Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd'); }
function nowStr_() { return Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm:ss'); }

function isAdminRole_(roleStr) {
  const arr = String(roleStr || '').toUpperCase().split(',').map(r => r.trim());
  return ['SUPER_ADMIN', 'KEPSEK', 'GURU_BK', 'WAKA_KESISWAAN'].some(r => arr.includes(r));
}

function isOsisOnly_(roleStr) {
  const arr = String(roleStr || '').toUpperCase().split(',').map(r => r.trim()).filter(Boolean);
  if (!arr.includes('PETUGAS_OSIS')) return false;
  return !['SUPER_ADMIN', 'KEPSEK', 'GURU_BK', 'WAKA_KESISWAAN', 'WALI_KELAS'].some(r => arr.includes(r));
}

function isPoinSah_(r) {
  const dv = String((r && r.divalidasi) || '').trim().toUpperCase();
  return dv !== 'MENUNGGU' && dv !== 'DITOLAK';
}

function isAktifStatus_(st) {
  const u = String(st || '').trim().toUpperCase();
  return u === '' || u === 'AKTIF';
}

function getKelasAmpu_(sesi) {
  const rolesArr = String(sesi.role || '').toUpperCase().split(',').map(r => r.trim());
  if (!rolesArr.includes('WALI_KELAS')) return [];
  return readAll_(SHEET.KELAS)
    .filter(k => String(k.wali_kelas || '').trim().toLowerCase() === String(sesi.nama).trim().toLowerCase())
    .map(k => String(k.nama_kelas).trim());
}

function catatAudit_(o) {
  try {
    appendRow_(SHEET.AUDIT, {
      timestamp: nowStr_(),
      id_guru: o.id_guru || '',
      nama_guru: o.nama_guru || '',
      aksi: o.aksi || '',
      modul: o.modul || '',
      detail: o.detail || '',
      ip_hash: ''
    });
  } catch (_) {}
}

// --- AUTH ---
function login_(p) {
  const username = String(p.username || '').trim();
  const pin = String(p.pin || '').trim();
  const modul = String(p.modul || 'admin');

  if (!username || !pin) return { ok: false, message: 'ID dan PIN wajib diisi.' };

  const isPinKios = (pin === 'gerbang2026');

  const guru = readAll_(SHEET.GURU).find(g =>
    (String(g.id_guru).trim() === username || String(g.nama).trim().toLowerCase() === username.toLowerCase()) &&
    (String(g.pin).trim() === pin || isPinKios) &&
    isAktifStatus_(g.status)
  );

  if (!guru) return { ok: false, message: 'ID/PIN salah atau akun nonaktif.' };

  const rolesArr = String(guru.role).toUpperCase().split(',').map(r => r.trim());
  const izin = {
    gerbang: ['GURU_PIKET', 'SUPER_ADMIN'],
    sholat: ['GURU_PIKET', 'GURU_BK', 'WAKA_KESISWAAN', 'WALI_KELAS', 'KEPSEK', 'SUPER_ADMIN'],
    disiplin: ['GURU_BK', 'WAKA_KESISWAAN', 'WALI_KELAS', 'SUPER_ADMIN', 'KEPSEK', 'PETUGAS_OSIS'],
    admin: ['SUPER_ADMIN', 'KEPSEK', 'GURU_BK', 'WAKA_KESISWAAN', 'WALI_KELAS']
  };

  const boleh = izin[modul] ? rolesArr.some(r => izin[modul].includes(r)) : false;
  if (!boleh) return { ok: false, message: 'Role Anda (' + guru.role + ') tidak berhak membuka modul ' + modul + '.' };

  const token = Utilities.getUuid();
  const sesi = { id_guru: guru.id_guru, nama: guru.nama, role: guru.role, modul: modul };
  CacheService.getScriptCache().put('sess_' + token, JSON.stringify(sesi), 21600);

  const kelasAmpu = getKelasAmpu_(sesi);
  catatAudit_({ id_guru: guru.id_guru, nama_guru: guru.nama, aksi: 'LOGIN', modul: modul, detail: 'Login sukses' });
  return { ok: true, message: 'Login berhasil', data: { token: token, nama: sesi.nama, role: sesi.role, kelas_ampu: kelasAmpu } };
}

function heartbeat_(token) {
  try {
    const sesi = verifikasiToken_(token);
    const out = Object.assign({}, sesi, { kelas_ampu: getKelasAmpu_(sesi) });
    return { ok: true, message: 'OK', data: out };
  } catch (e) { return { ok: false, message: e.message }; }
}

// --- KETERANGAN ABSEN ---
function simpanKeteranganAbsen_(token, p) {
  try {
    const sesi = verifikasiToken_(token);
    const rolesArr = String(sesi.role).toUpperCase().split(',').map(r => r.trim());
    const nis = String(p.nis || '').trim();
    const tanggal = getTanggalBersih_(p.tanggal);
    const status = String(p.status || '').trim().toUpperCase();
    const keterangan = String(p.keterangan || '').trim();

    if (!nis || !tanggal || !status) return { ok: false, message: 'Data tidak lengkap.' };
    if (!['SAKIT', 'IZIN', 'ALPA'].includes(status)) return { ok: false, message: 'Status harus SAKIT / IZIN / ALPA.' };

    const siswa = readAll_(SHEET.SISWA).find(s => String(s.nis).trim() === nis);
    if (!siswa) return { ok: false, message: 'Siswa tidak ditemukan.' };

    const bolehSemua = isAdminRole_(sesi.role);
    if (!bolehSemua) {
      if (!rolesArr.includes('WALI_KELAS')) return { ok: false, message: 'Role Anda tidak berhak mengedit keterangan absen.' };
      const kelasAmpu = getKelasAmpu_(sesi);
      if (!kelasAmpu.length) return { ok: false, message: 'Anda belum ditugaskan sebagai wali kelas mana pun.' };
      if (!kelasAmpu.includes(String(siswa.kelas).trim())) return { ok: false, message: 'Anda hanya boleh mengedit siswa di kelas ' + kelasAmpu.join(', ') + '.' };
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = getOrCreateSheet_(ss, SHEET.KETERANGAN);
    const headers = ensureHeaders_(sh, SHEET.KETERANGAN).map(h => h.toLowerCase());
    const data = sh.getDataRange().getValues();
    const cTgl = headers.indexOf('tanggal');
    const cNis = headers.indexOf('nis');
    const cStatus = headers.indexOf('status');
    const cKet = headers.indexOf('keterangan');
    const cDicatat = headers.indexOf('dicatat_oleh');
    const cTs = headers.indexOf('timestamp');
    const cNama = headers.indexOf('nama');
    const cKelas = headers.indexOf('kelas');

    let updated = false;
    for (let i = 1; i < data.length; i++) {
      if (getTanggalBersih_(data[i][cTgl]) === tanggal && String(data[i][cNis] || '').trim() === nis) {
        if (cNama !== -1) data[i][cNama] = siswa.nama;
        if (cKelas !== -1) data[i][cKelas] = siswa.kelas;
        if (cStatus !== -1) data[i][cStatus] = status;
        if (cKet !== -1) data[i][cKet] = keterangan;
        if (cDicatat !== -1) data[i][cDicatat] = sesi.nama;
        if (cTs !== -1) data[i][cTs] = nowStr_();
        if (cTgl !== -1) sh.getRange(i + 1, cTgl + 1).setNumberFormat('@');
        if (cNis !== -1) sh.getRange(i + 1, cNis + 1).setNumberFormat('@');
        sh.getRange(i + 1, 1, 1, headers.length).setValues([data[i]]);
        updated = true;
        break;
      }
    }

    if (!updated) {
      appendRow_(SHEET.KETERANGAN, {
        id_keterangan: makeId_('KET'), tanggal: tanggal, nis: nis, nama: siswa.nama, kelas: siswa.kelas,
        status: status, keterangan: keterangan, dicatat_oleh: sesi.nama, timestamp: nowStr_()
      }, ['tanggal', 'nis']);
    }

    const tapPagi = readAll_(SHEET.GERBANG).find(r =>
      getTanggalBersih_(r.tanggal) === tanggal &&
      String(r.nis || '').trim() === nis &&
      String(r.sesi || 'PAGI').toUpperCase() === 'PAGI'
    );
    const rekapAda = !tapPagi ? readAll_(SHEET.REKAP_SISWA).find(r =>
      getTanggalBersih_(r.tanggal) === tanggal &&
      String(r.nis || '').trim() === nis &&
      formatJamSheet(r.jam_masuk, '')
    ) : null;
    const jamHadirAda = tapPagi
      ? formatJamSheet(tapPagi.jam || tapPagi.timestamp, '')
      : (rekapAda ? formatJamSheet(rekapAda.jam_masuk, '') : '');
    const noteHadir = (tapPagi || rekapAda)
      ? ' (Catatan: pada tanggal ' + tanggal + ' siswa tercatat sudah tap masuk gerbang' + (jamHadirAda ? ' pukul ' + jamHadirAda : '') + ', sehingga di rekap kehadiran tetap dihitung Hadir.)'
      : '';

    return { ok: true, message: 'Keterangan ' + status + ' untuk ' + siswa.nama + (updated ? ' diperbarui.' : ' disimpan.') + noteHadir };
  } catch (e) { return { ok: false, message: e.message }; }
}

function getKeteranganAbsen_(token, p) {
  try {
    const sesi = verifikasiToken_(token);
    const tanggal = getTanggalBersih_(p.tanggal) || todayStr_();
    const kelas = String(p.kelas || '').trim();
    const bolehSemua = isAdminRole_(sesi.role);
    let data = readAll_(SHEET.KETERANGAN).filter(r => getTanggalBersih_(r.tanggal) === tanggal);
    if (!bolehSemua) {
      const kelasAmpu = getKelasAmpu_(sesi);
      if (!kelasAmpu.length) return { ok: true, data: [] };
      data = data.filter(r => kelasAmpu.includes(String(r.kelas || '').trim()));
    }
    if (kelas) data = data.filter(r => String(r.kelas || '').trim() === kelas);
    return { ok: true, data: data };
  } catch (e) { return { ok: false, message: e.message }; }
}

function hapusKeteranganAbsen_(token, p) {
  try {
    const sesi = verifikasiToken_(token);
    const idKet = String(p.id_keterangan || '').trim();
    if (!idKet) return { ok: false, message: 'ID keterangan kosong.' };
    const rows = readAll_(SHEET.KETERANGAN);
    const target = rows.find(r => String(r.id_keterangan) === idKet);
    if (!target) return { ok: false, message: 'Keterangan tidak ditemukan.' };
    const bolehSemua = isAdminRole_(sesi.role);
    if (!bolehSemua) {
      const kelasAmpu = getKelasAmpu_(sesi);
      if (!kelasAmpu.includes(String(target.kelas).trim())) return { ok: false, message: 'Anda hanya boleh menghapus keterangan kelas ' + kelasAmpu.join(', ') + '.' };
    }
    const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET.KETERANGAN);
    sh.deleteRow(target._row);
    return { ok: true, message: 'Keterangan dihapus.' };
  } catch (e) { return { ok: false, message: e.message }; }
}

function getSiswaKelasSaya_(token) {
  try {
    const sesi = verifikasiToken_(token);
    const bolehSemua = isAdminRole_(sesi.role);
    let kelasList = [];
    if (!bolehSemua) {
      const rolesArr = String(sesi.role).toUpperCase().split(',').map(r => r.trim());
      if (!rolesArr.includes('WALI_KELAS')) return { ok: false, message: 'Role Anda tidak berhak.' };
      kelasList = getKelasAmpu_(sesi);
      if (!kelasList.length) return { ok: true, data: [], message: 'Anda belum ditugaskan sebagai wali kelas mana pun.' };
    }
    const siswa = readAll_(SHEET.SISWA)
      .filter(s => isAktifStatus_(s.status))
      .filter(s => !kelasList.length || kelasList.includes(String(s.kelas).trim()))
      .map(s => ({ nis: s.nis, nama: s.nama, kelas: s.kelas }));
    return { ok: true, data: siswa, kelas_ampu: kelasList };
  } catch (e) { return { ok: false, message: e.message }; }
}

function getDashboardWaliKelas_(token) {
  try {
    const sesi = verifikasiToken_(token);
    const kelasAmpu = getKelasAmpu_(sesi);
    if (!kelasAmpu.length) return { ok: true, data: null, message: 'Anda belum ditugaskan sebagai wali kelas mana pun.' };
    const hariIni = todayStr_();

    const setting = getPengaturan_(null).data || {};
    const poinAwalSiswa = Number(setting.poin_awal) || 100;
    const zKuning = Number(setting.zona_kuning_min) || 51;
    const zOranye = Number(setting.zona_oranye_min) || 26;
    const zMerah = Number(setting.zona_merah_min) || 1;

    const siswaKelas = readAll_(SHEET.SISWA).filter(s => isAktifStatus_(s.status) && kelasAmpu.includes(String(s.kelas).trim()));
    const nisKelas = siswaKelas.map(s => String(s.nis).trim());
    const nisSet = new Set(nisKelas);
    const gerbangHariIni = readAll_(SHEET.GERBANG).filter(r => getTanggalBersih_(r.tanggal) === hariIni && String(r.sesi).toUpperCase() === 'PAGI' && nisSet.has(String(r.nis).trim()));
    const keteranganHariIni = readAll_(SHEET.KETERANGAN).filter(r => getTanggalBersih_(r.tanggal) === hariIni && nisSet.has(String(r.nis).trim()));
    const poinAll = readAll_(SHEET.POIN).filter(r => nisSet.has(String(r.nis).trim()) && isPoinSah_(r));

    const saldo = {};
    siswaKelas.forEach(s => { saldo[String(s.nis).trim()] = poinAwalSiswa; });
    poinAll.forEach(p => {
      const n = String(p.nis).trim();
      if (saldo[n] !== undefined) saldo[n] += (Number(p.poin) || 0);
    });

    const siswaKelasMap = {};
    siswaKelas.forEach(s => { siswaKelasMap[String(s.nis).trim()] = s; });

    let zonaMerah = 0;
    const prioritasList = [];
    siswaKelas.forEach(s => {
      const n = String(s.nis).trim();
      const v = saldo[n];
      if (v < zOranye) zonaMerah++;
      if (v < zKuning + 25) {
        let zKode = 'Kuning', zCls = 'kuning';
        if (v <= 0 || v < zMerah) { zKode = 'Kritis'; zCls = 'kritis'; }
        else if (v < zOranye) { zKode = 'Merah'; zCls = 'merah'; }
        else if (v < zKuning) { zKode = 'Oranye'; zCls = 'oranye'; }
        prioritasList.push({ nis: n, nama: s.nama, kelas: s.kelas, saldo: v, zona: zKode, zona_cls: zCls, no_hp_ortu: getNoHpOrtu_(s) });
      }
    });
    prioritasList.sort((a, b) => a.saldo - b.saldo);

    const hadir = new Set(); const tepat = new Set(); const telat = new Set();
    const siswaTerlambat = [];
    gerbangHariIni.forEach(r => {
      const n = String(r.nis).trim();
      hadir.add(n);
      const st = String(r.status).toUpperCase();
      if (st === 'TEPAT_WAKTU' || st === 'HADIR') tepat.add(n);
      else if (st === 'TERLAMBAT') {
        if (!telat.has(n)) {
          telat.add(n);
          siswaTerlambat.push({
            nis: n,
            nama: r.nama,
            kelas: r.kelas,
            jam: formatJamSheet(r.jam || r.timestamp, '-'),
            no_hp_ortu: getNoHpOrtu_(siswaKelasMap[n])
          });
        }
      }
    });

    const ketMap = {};
    const ketList = [];
    keteranganHariIni.forEach(r => {
      const n = String(r.nis).trim();
      if (n) {
        const st = String(r.status || '').toUpperCase();
        ketMap[n] = st;
        ketList.push({ nis: n, nama: r.nama || (siswaKelasMap[n] ? siswaKelasMap[n].nama : n), kelas: r.kelas || (siswaKelasMap[n] ? siswaKelasMap[n].kelas : ''), status: st, keterangan: r.keterangan || '-', no_hp_ortu: getNoHpOrtu_(siswaKelasMap[n]) });
      }
    });
    const ketSet = new Set(Object.keys(ketMap));
    const belumHadir = siswaKelas
      .filter(s => !hadir.has(String(s.nis).trim()) && !ketSet.has(String(s.nis).trim()))
      .map(s => ({ nis: String(s.nis).trim(), nama: s.nama, kelas: s.kelas, no_hp_ortu: getNoHpOrtu_(s) }));

    let izin = 0, sakit = 0, alpa = 0, ketBelumTap = 0;
    Object.keys(ketMap).forEach(n => {
      if (hadir.has(n)) return;
      const st = ketMap[n];
      if (st === 'IZIN') izin++;
      else if (st === 'SAKIT') sakit++;
      else if (st === 'ALPA') alpa++;
      ketBelumTap++;
    });

    return { ok: true, data: {
      kelas_ampu: kelasAmpu,
      total_siswa: siswaKelas.length,
      hadir_gerbang: hadir.size,
      izin: izin, sakit: sakit, alpa: alpa,
      zona_merah: zonaMerah,
      ketepatan: {
        tepat_waktu: tepat.size,
        terlambat: telat.size,
        izin_sakit_alpa: ketBelumTap,
        tidak_hadir: Math.max(0, siswaKelas.length - hadir.size - ketBelumTap)
      },
      siswa_terlambat: siswaTerlambat,
      siswa_prioritas: prioritasList.slice(0, 12),
      belum_hadir: belumHadir.slice(0, 20),
      keterangan_list: ketList,
      updated_at: nowStr_()
    }};
  } catch (e) { return { ok: false, message: e.message }; }
}

// --- GURU & REKAP GURU ---
function getMasterGuruFull_(token) { try { verifikasiToken_(token); return { ok: true, data: readAll_(SHEET.GURU) }; } catch (e) { return { ok: false, message: e.message }; } }
function getGuruWaliKelas_(token) {
  try {
    verifikasiToken_(token);
    const list = readAll_(SHEET.GURU).filter(g => {
      const roles = String(g.role).toUpperCase();
      return isAktifStatus_(g.status) && (roles.includes('WALI_KELAS') || roles.includes('GURU') || roles.includes('GURU_BK'));
    }).map(g => ({ id_guru: g.id_guru, nama: g.nama, role: g.role }));
    return { ok: true, data: list };
  } catch (e) { return { ok: false, message: e.message }; }
}

function tambahGuru_(token, p) {
  try {
    verifikasiToken_(token);
    const idGuru = String(p.id_guru || '').trim();
    const nama = String(p.nama || '').trim();
    const pin = String(p.pin || '').trim();
    if (!idGuru || !nama || !pin) return { ok: false, message: 'ID Guru, Nama, dan PIN wajib diisi.' };
    if (readAll_(SHEET.GURU).some(g => String(g.id_guru).trim() === idGuru)) {
      return { ok: false, message: 'ID Guru "' + idGuru + '" sudah terdaftar.' };
    }
    appendRow_(SHEET.GURU, { id_guru: idGuru, nama: nama, pin: pin, role: p.role, status: 'AKTIF', no_hp: p.no_hp || '', uid_rfid: '' }, ['id_guru', 'pin', 'no_hp']);
    return { ok: true, message: 'Guru ditambahkan.' };
  } catch (e) { return { ok: false, message: e.message }; }
}

function editGuru_(token, p) {
  try {
    verifikasiToken_(token);
    const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET.GURU);
    const d = sh.getDataRange().getValues();
    if (d.length < 2) return { ok: false, message: 'Data guru kosong.' };
    const headers = ensureHeaders_(sh, SHEET.GURU).map(h => String(h).trim().toLowerCase());
    const iId = headers.indexOf('id_guru');
    const iNama = headers.indexOf('nama');
    const iRole = headers.indexOf('role');
    const iPin = headers.indexOf('pin');
    const iHp = headers.indexOf('no_hp');
    const iStatus = headers.indexOf('status');
    const targetId = String(p.id_guru || '').trim();
    for (let i = 1; i < d.length; i++) {
      if (String(d[i][iId !== -1 ? iId : 0]).trim() === targetId) {
        if (iNama !== -1) d[i][iNama] = p.nama;
        if (iRole !== -1) d[i][iRole] = p.role;
        if (p.pin && iPin !== -1) { sh.getRange(i + 1, iPin + 1).setNumberFormat('@'); d[i][iPin] = String(p.pin).trim(); }
        if (iHp !== -1) { sh.getRange(i + 1, iHp + 1).setNumberFormat('@'); d[i][iHp] = p.no_hp || ''; }
        if (iStatus !== -1) d[i][iStatus] = p.status;
        sh.getRange(i + 1, 1, 1, headers.length).setValues([d[i]]);
        return { ok: true, message: 'Guru diperbarui.' };
      }
    }
    return { ok: false, message: 'ID Guru tidak ditemukan.' };
  } catch (e) { return { ok: false, message: e.message }; }
}

function getGuruTanpaRfid_(token) {
  try {
    verifikasiToken_(token);
    return {
      ok: true,
      data: readAll_(SHEET.GURU).filter(g => isAktifStatus_(g.status) && !String(g.uid_rfid || '').trim())
    };
  } catch (e) { return { ok: false, message: e.message }; }
}

function daftarRfidGuru_(token, p) {
  try {
    verifikasiToken_(token);
    const idGuru = String(p.id_guru || '').trim();
    const uid = normalisasiUid_(p.uid_rfid);
    if (!idGuru || !uid) return { ok: false, message: 'ID Guru dan UID RFID wajib diisi.' };

    const dupeSiswa = readAll_(SHEET.SISWA).find(s => normalisasiUid_(s.uid_rfid) === uid);
    if (dupeSiswa) return { ok: false, message: 'Kartu RFID ini sudah terdaftar atas nama siswa ' + dupeSiswa.nama + ' (' + dupeSiswa.nis + ').' };
    const dupeGuru = readAll_(SHEET.GURU).find(g => String(g.id_guru).trim() !== idGuru && normalisasiUid_(g.uid_rfid) === uid);
    if (dupeGuru) return { ok: false, message: 'Kartu RFID ini sudah terdaftar atas nama guru ' + dupeGuru.nama + ' (' + dupeGuru.id_guru + ').' };

    const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET.GURU);
    const d = sh.getDataRange().getValues();
    const headers = ensureHeaders_(sh, SHEET.GURU).map(h => String(h).trim().toLowerCase());
    const iId = headers.indexOf('id_guru');
    const idxUid = headers.indexOf('uid_rfid');
    if (idxUid === -1) return { ok: false, message: 'Kolom uid_rfid tidak ditemukan.' };
    for (let i = 1; i < d.length; i++) {
      if (String(d[i][iId !== -1 ? iId : 0]).trim() === idGuru) {
        d[i][idxUid] = uid;
        sh.getRange(i + 1, idxUid + 1).setNumberFormat('@');
        sh.getRange(i + 1, 1, 1, headers.length).setValues([d[i]]);
        return { ok: true, message: 'Kartu guru didaftarkan.' };
      }
    }
    return { ok: false, message: 'Guru tidak ditemukan.' };
  } catch (e) { return { ok: false, message: e.message }; }
}

// --- PENCARIAN & PRESENSI GABUNGAN ---
function searchOrang_(token, p) {
  try {
    verifikasiToken_(token);
    const rawQ = String(p.q || '').trim();
    const q = rawQ.toLowerCase();
    const qUid = normalisasiUid_(rawQ);
    if (q.length < 2) return { ok: false, message: 'Minimal 2 karakter.' };
    let hasil = [];
    readAll_(SHEET.SISWA)
      .filter(s => isAktifStatus_(s.status))
      .filter(s => String(s.nis).toLowerCase().includes(q) || String(s.nama).toLowerCase().includes(q) || (qUid.length >= 4 && normalisasiUid_(s.uid_rfid) === qUid))
      .slice(0, 10)
      .forEach(s => hasil.push({ id: s.nis, nama: s.nama, kelas: s.kelas, tipe: 'SISWA' }));
    readAll_(SHEET.GURU)
      .filter(g => isAktifStatus_(g.status))
      .filter(g => String(g.id_guru).toLowerCase().includes(q) || String(g.nama).toLowerCase().includes(q) || (qUid.length >= 4 && normalisasiUid_(g.uid_rfid) === qUid))
      .slice(0, 10)
      .forEach(g => hasil.push({ id: g.id_guru, nama: g.nama, kelas: String(g.role || '').replace(/,/g, ' / '), tipe: 'GURU' }));
    return { ok: true, data: hasil };
  } catch (e) { return { ok: false, message: e.message }; }
}

function searchOrangPublik_(p) {
  try {
    const rawQ = String(p.q || '').trim();
    const q = rawQ.toLowerCase();
    const qUid = normalisasiUid_(rawQ);
    if (q.length < 2) return { ok: false, message: 'Minimal 2 karakter.' };
    let hasil = [];
    readAll_(SHEET.SISWA)
      .filter(s => isAktifStatus_(s.status))
      .filter(s => String(s.nis).toLowerCase().includes(q) || String(s.nama).toLowerCase().includes(q) || (qUid.length >= 4 && normalisasiUid_(s.uid_rfid) === qUid))
      .slice(0, 10)
      .forEach(s => hasil.push({ id: s.nis, nama: s.nama, kelas: s.kelas, tipe: 'SISWA' }));
    return { ok: true, data: hasil };
  } catch (e) { return { ok: false, message: e.message }; }
}

// --- HELPER STATUS KETEPATAN WAKTU SISWA ---
function hitungStatusSiswa_(jamTap, sesiTap, setting) {
  if (String(sesiTap).toUpperCase() === 'PULANG') {
    const jp = formatJamSheet(setting.jam_pulang, '15:00');
    return jamTap < jp ? 'PULANG_AWAL' : 'PULANG';
  }
  const jm = formatJamSheet(setting.jam_masuk, '07:15');
  const toleransi = Number(setting.toleransi_menit) || 0;
  const parts = jm.split(':').map(Number);
  const totalMenit = (parts[0] * 60) + (parts[1] || 0) + toleransi;
  const batas = String(Math.floor(totalMenit / 60)).padStart(2, '0') + ':' + String(totalMenit % 60).padStart(2, '0');
  return jamTap > batas ? 'TERLAMBAT' : 'TEPAT_WAKTU';
}

// --- HELPER REKAP SISWA & GURU ---
function prosesRekapSiswa_(sh, siswa, tgl, jam, sesiTap, setting, statusOverride) {
  const headers = ensureHeaders_(sh, SHEET.REKAP_SISWA).map(h => h.toLowerCase());
  const data = sh.getDataRange().getValues();

  const cTgl = headers.indexOf('tanggal');
  const cNis = headers.indexOf('nis');
  const cNama = headers.indexOf('nama');
  const cKelas = headers.indexOf('kelas');
  const cMasuk = headers.indexOf('jam_masuk');
  const cPulang = headers.indexOf('jam_pulang');
  const cStMasuk = headers.indexOf('status_masuk');
  const cStPulang = headers.indexOf('status_pulang');

  const sesiUpper = String(sesiTap || 'PAGI').toUpperCase();
  const statusVal = statusOverride || hitungStatusSiswa_(jam, sesiUpper, setting || {});

  for (let i = 1; i < data.length; i++) {
    const tglRow = getTanggalBersih_(data[i][cTgl]);
    if (String(data[i][cNis]).trim() === String(siswa.nis).trim() && tglRow === tgl) {
      const r = i + 1;
      if (sesiUpper === 'PULANG') {
        if (cPulang !== -1) sh.getRange(r, cPulang + 1).setNumberFormat('@').setValue(jam);
        if (cStPulang !== -1) sh.getRange(r, cStPulang + 1).setValue(statusVal);
      } else {
        const jmAda = cMasuk !== -1 ? formatJamSheet(data[i][cMasuk], '') : '';
        if (!jmAda && cMasuk !== -1) sh.getRange(r, cMasuk + 1).setNumberFormat('@').setValue(jam);
        if (!jmAda && cStMasuk !== -1) sh.getRange(r, cStMasuk + 1).setValue(statusVal);
      }
      SpreadsheetApp.flush();
      return;
    }
  }

  const newRow = new Array(headers.length).fill('');
  if (cTgl !== -1) newRow[cTgl] = tgl;
  if (cNis !== -1) newRow[cNis] = String(siswa.nis);
  if (cNama !== -1) newRow[cNama] = siswa.nama;
  if (cKelas !== -1) newRow[cKelas] = siswa.kelas;
  if (sesiUpper === 'PAGI') {
    if (cMasuk !== -1) newRow[cMasuk] = jam;
    if (cPulang !== -1) newRow[cPulang] = '-';
    if (cStMasuk !== -1) newRow[cStMasuk] = statusVal;
    if (cStPulang !== -1) newRow[cStPulang] = '-';
  } else {
    if (cMasuk !== -1) newRow[cMasuk] = '-';
    if (cPulang !== -1) newRow[cPulang] = jam;
    if (cStMasuk !== -1) newRow[cStMasuk] = '-';
    if (cStPulang !== -1) newRow[cStPulang] = statusVal;
  }

  const targetRow = sh.getLastRow() + 1;
  [cTgl, cNis, cMasuk, cPulang].forEach(c => {
    if (c !== -1) sh.getRange(targetRow, c + 1).setNumberFormat('@');
  });
  sh.getRange(targetRow, 1, 1, headers.length).setValues([newRow]);
  SpreadsheetApp.flush();
}

function menitDariJam_(jamStr) {
  const parts = String(jamStr || '').split(':').map(Number);
  if (isNaN(parts[0])) return -1;
  return (parts[0] * 60) + (parts[1] || 0);
}

function prosesRekapGuru_(sh, guru, tgl, jamTap) {
  const headers = ensureHeaders_(sh, SHEET.REKAP_GURU).map(h => h.toLowerCase());
  const data = sh.getDataRange().getValues();

  const cId = headers.indexOf('id_guru');
  const cTgl = headers.indexOf('tanggal');
  const cMasuk = headers.indexOf('jam_masuk');
  const cPulang = headers.indexOf('jam_pulang');
  const cStatus = headers.indexOf('status');
  const cTotal = headers.indexOf('total_jam');

  for (let i = 1; i < data.length; i++) {
    const tglRow = getTanggalBersih_(data[i][cTgl]);
    if (String(data[i][cId]).trim() === String(guru.id_guru).trim() && tglRow === tgl) {
      const r = i + 1;
      const jm = cMasuk !== -1 ? formatJamSheet(data[i][cMasuk], '') : '';
      const jpAda = cPulang !== -1 ? formatJamSheet(data[i][cPulang], '') : '';
      if (!jm) {
        if (cMasuk !== -1) sh.getRange(r, cMasuk + 1).setNumberFormat('@').setValue(jamTap);
        if (cStatus !== -1) sh.getRange(r, cStatus + 1).setValue('HADIR');
        SpreadsheetApp.flush();
        return;
      }
      if (jamTap !== jm) {
        const mExist = menitDariJam_(jm);
        const mNew = menitDariJam_(jamTap);
        const mPulang = jpAda ? menitDariJam_(jpAda) : -1;
        if (mExist >= 0 && mNew >= 0) {
          if (mNew < mExist) {
            if ((mExist - mNew) >= 120) {
              const finalPulang = (mPulang > mExist) ? jpAda : jm;
              const diff = Math.max(mExist, mPulang) - mNew;
              if (cMasuk !== -1) sh.getRange(r, cMasuk + 1).setNumberFormat('@').setValue(jamTap);
              if (cPulang !== -1) sh.getRange(r, cPulang + 1).setNumberFormat('@').setValue(finalPulang);
              if (cTotal !== -1) sh.getRange(r, cTotal + 1).setNumberFormat('@').setValue(Math.floor(diff / 60) + ' Jam ' + (diff % 60) + ' Mnt');
              if (cStatus !== -1 && !data[i][cStatus]) sh.getRange(r, cStatus + 1).setValue('HADIR');
              SpreadsheetApp.flush();
            } else {
              if (cMasuk !== -1) sh.getRange(r, cMasuk + 1).setNumberFormat('@').setValue(jamTap);
              if (mPulang >= 0 && (mPulang - mNew) >= 120 && cTotal !== -1) {
                const diff = mPulang - mNew;
                sh.getRange(r, cTotal + 1).setNumberFormat('@').setValue(Math.floor(diff / 60) + ' Jam ' + (diff % 60) + ' Mnt');
              }
              SpreadsheetApp.flush();
            }
          } else {
            const diff = mNew - mExist;
            if (diff >= 120 && (mPulang === -1 || mNew > mPulang)) {
              if (cPulang !== -1) sh.getRange(r, cPulang + 1).setNumberFormat('@').setValue(jamTap);
              if (cTotal !== -1) sh.getRange(r, cTotal + 1).setNumberFormat('@').setValue(Math.floor(diff / 60) + ' Jam ' + (diff % 60) + ' Mnt');
              if (cStatus !== -1 && !data[i][cStatus]) sh.getRange(r, cStatus + 1).setValue('HADIR');
              SpreadsheetApp.flush();
            }
          }
        }
      }
      return;
    }
  }

  const newRow = new Array(headers.length).fill('');
  if (cId !== -1) newRow[cId] = String(guru.id_guru);
  if (cTgl !== -1) newRow[cTgl] = tgl;
  if (cMasuk !== -1) newRow[cMasuk] = jamTap;
  if (cPulang !== -1) newRow[cPulang] = '-';
  if (cStatus !== -1) newRow[cStatus] = 'HADIR';
  if (cTotal !== -1) newRow[cTotal] = '-';

  const targetRow = sh.getLastRow() + 1;
  [cId, cTgl, cMasuk, cPulang, cTotal].forEach(c => {
    if (c !== -1) sh.getRange(targetRow, c + 1).setNumberFormat('@');
  });
  sh.getRange(targetRow, 1, 1, headers.length).setValues([newRow]);
  SpreadsheetApp.flush();
}

// ==========================================
// PRESENSI GERBANG ONLINE (gerbang2online.html)
// ==========================================
function presensiGerbang_(token, p) {
  try {
    const petugas = verifikasiToken_(token);
    const kode = String(p.nis || '').trim();
    const sumber = String(p.sumber || 'RFID').toUpperCase();
    if (!kode) return { ok: false, message: 'Kode kosong.' };

    let waktuAcuan = new Date();
    if (p.waktu_tap) waktuAcuan = new Date(p.waktu_tap);
    const hariIni = Utilities.formatDate(waktuAcuan, TZ, 'yyyy-MM-dd');
    const now = Utilities.formatDate(waktuAcuan, TZ, 'yyyy-MM-dd HH:mm:ss');
    const jamNow = Utilities.formatDate(waktuAcuan, TZ, 'HH:mm');

    const setting = getPengaturan_(null).data || {};
    const MINIMAL_JAM_KERJA = 2;
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const normKode = normalisasiUid_(kode);

    // 1. CEK GURU
    const guru = readAll_(SHEET.GURU).find(g =>
      String(g.id_guru).trim() === kode || (g.uid_rfid && normalisasiUid_(g.uid_rfid) === normKode)
    );
    if (guru) {
      if (!isAktifStatus_(guru.status)) {
        return { ok: false, message: 'Akun guru/staf ' + guru.nama + ' berstatus ' + (guru.status || 'NONAKTIF') + '.' };
      }
      const logGuru = readAll_(SHEET.GURU_HADIR).filter(l =>
        String(l.id_guru).trim() === String(guru.id_guru).trim() && getTanggalBersih_(l.tanggal) === hariIni
      );
      if (logGuru.length >= 2) {
        return { ok: false, message: 'Guru ' + guru.nama + ' sudah tap masuk & pulang hari ini.' };
      }
      if (logGuru.length === 1) {
        const jamTapPertama = formatJamSheet(logGuru[0].jam || logGuru[0].timestamp, '');
        if (jamTapPertama) {
          const [h1, m1] = jamTapPertama.split(':').map(Number);
          const [h2, m2] = jamNow.split(':').map(Number);
          const selisihMenit = ((h2 * 60) + m2) - ((h1 * 60) + m1);
          if (selisihMenit < (MINIMAL_JAM_KERJA * 60)) {
            return { ok: false, message: guru.nama + ' belum bisa pulang. Minimal ' + MINIMAL_JAM_KERJA + ' jam sejak masuk (' + jamTapPertama + ').' };
          }
        }
      }

      appendRow_(SHEET.GURU_HADIR, {
        id_log: makeId_('GRH'), timestamp: now, tanggal: hariIni, jam: jamNow,
        id_guru: guru.id_guru, nama_guru: guru.nama, tipe: 'GURU', sumber: sumber
      }, ['tanggal', 'jam', 'id_guru']);

      const shRekapGuru = getOrCreateSheet_(ss, SHEET.REKAP_GURU);
      prosesRekapGuru_(shRekapGuru, guru, hariIni, jamNow);

      const statusGuru = logGuru.length === 0 ? 'MASUK' : 'PULANG';
      return {
        ok: true,
        message: guru.nama + ' (' + (logGuru.length === 0 ? 'Masuk' : 'Pulang') + ')',
        data: {
          nama: guru.nama,
          kelas: String(guru.role || 'GURU').replace(/,/g, ' / '),
          jam: jamNow,
          sesi: logGuru.length === 0 ? 'PAGI' : 'PULANG',
          status: statusGuru,
          status_detail: statusGuru
        }
      };
    }

    // 2. CEK SISWA
    const siswa = readAll_(SHEET.SISWA).find(s =>
      String(s.nis).trim() === kode || (s.uid_rfid && normalisasiUid_(s.uid_rfid) === normKode)
    );
    if (!siswa) return { ok: false, message: 'Kartu/NIS tidak dikenali.' };
    if (!isAktifStatus_(siswa.status)) return { ok: false, message: 'Status siswa ' + siswa.nama + ' (' + siswa.status + ') tidak aktif.' };

    const logSiswa = readAll_(SHEET.GERBANG).filter(l =>
      String(l.nis).trim() === String(siswa.nis).trim() && getTanggalBersih_(l.tanggal) === hariIni
    );
    if (logSiswa.length >= 2) {
      return { ok: false, message: siswa.nama + ' sudah tap masuk & pulang hari ini.' };
    }
    if (logSiswa.length === 1) {
      const jamTapPertama = formatJamSheet(logSiswa[0].jam || logSiswa[0].timestamp, '');
      if (jamTapPertama) {
        const [h1, m1] = jamTapPertama.split(':').map(Number);
        const [h2, m2] = jamNow.split(':').map(Number);
        const selisihMenit = ((h2 * 60) + m2) - ((h1 * 60) + m1);
        if (selisihMenit < (MINIMAL_JAM_KERJA * 60)) {
          return { ok: false, message: siswa.nama + ' belum bisa pulang. Minimal ' + MINIMAL_JAM_KERJA + ' jam sejak masuk (' + jamTapPertama + ').' };
        }
      }
    }

    const sesiSiswa = logSiswa.length === 0 ? 'PAGI' : 'PULANG';
    const dispensasi = String(p.dispensasi || '').trim().toUpperCase();
    const alasanDisp = String(p.alasan_dispensasi || '').trim();
    const nisStr = String(siswa.nis).trim();
    const hasKetIzinSakit = sesiSiswa === 'PAGI' && readAll_(SHEET.KETERANGAN).some(k =>
      String(k.nis).trim() === nisStr &&
      getTanggalBersih_(k.tanggal) === hariIni &&
      ['IZIN', 'SAKIT'].includes(String(k.status || '').trim().toUpperCase())
    );
    const isDisp = Boolean(dispensasi) || hasKetIzinSakit;
    const rawStatusSiswa = hitungStatusSiswa_(jamNow, sesiSiswa, setting);
    const statusSiswa = (sesiSiswa === 'PAGI' && rawStatusSiswa === 'TERLAMBAT' && isDisp) ? 'TEPAT_WAKTU' : rawStatusSiswa;

    appendRow_(SHEET.GERBANG, {
      id_log: makeId_('GRB'), timestamp: now, tanggal: hariIni,
      nis: siswa.nis, nama: siswa.nama, kelas: siswa.kelas,
      tipe: 'SISWA', sesi: sesiSiswa, status: statusSiswa,
      petugas: petugas.nama, sumber: sumber
    }, ['tanggal', 'nis']);

    const shRekapSiswa = getOrCreateSheet_(ss, SHEET.REKAP_SISWA);
    prosesRekapSiswa_(shRekapSiswa, siswa, hariIni, jamNow, sesiSiswa, setting, statusSiswa);

    let potongPoin = 0;
    if (sesiSiswa === 'PAGI' && statusSiswa === 'TERLAMBAT' && !isDisp) {
      potongPoin = terapkanPotongTerlambatSatuan_(setting, siswa, hariIni, jamNow, petugas.nama);
      notifTelegramTelatBatch_(setting, [{ nama: siswa.nama, kelas: siswa.kelas, jam: jamNow, potong: potongPoin }], petugas.nama);
    }

    return {
      ok: true,
      message: siswa.nama + ' (' + (sesiSiswa === 'PAGI' ? 'Masuk' : 'Pulang') + ')',
      data: {
        nama: siswa.nama,
        kelas: siswa.kelas,
        jam: jamNow,
        sesi: sesiSiswa,
        status: statusSiswa,
        status_detail: statusSiswa,
        dispensasi: isDisp ? (dispensasi || 'KETERANGAN_ABSEN') : '',
        alasan_dispensasi: alasanDisp,
        potong_poin: potongPoin
      }
    };
  } catch (e) { return { ok: false, message: e.message }; }
}

function presensiSholat_(token, p) {
  try {
    const petugas = verifikasiToken_(token);
    const kode = String(p.kode || '').trim();
    const waktu = String(p.waktu_sholat || '').trim().toUpperCase();
    if (!kode || !waktu) return { ok: false, message: 'Data tidak lengkap.' };

    const semua = readAll_(SHEET.SISWA);
    const kodeUid = normalisasiUid_(kode);
    const siswa = semua.find(s => String(s.nis).trim() === kode) ||
                  (kodeUid ? semua.find(s => normalisasiUid_(s.uid_rfid) === kodeUid) : null);
    if (!siswa) return { ok: false, message: 'NIS/Kartu tidak terdaftar.' };
    if (!isAktifStatus_(siswa.status)) return { ok: false, message: 'Siswa nonaktif.' };

    const now = new Date();
    const hariIni = Utilities.formatDate(now, TZ, 'yyyy-MM-dd');
    const jamIni = Utilities.formatDate(now, TZ, 'HH:mm');

    const udzur = readAll_(SHEET.UDZUR).find(u =>
      String(u.nis).trim() === String(siswa.nis).trim() &&
      getTanggalBersih_(u.tgl_mulai) <= hariIni &&
      getTanggalBersih_(u.tgl_selesai) >= hariIni
    );
    if (udzur) {
      return {
        ok: true,
        message: siswa.nama + ' (Udzur)',
        data: {
          nis: siswa.nis,
          nama: siswa.nama,
          kelas: siswa.kelas,
          status: 'UDZUR',
          waktu: waktu,
          jam: jamIni,
          alasan: String(udzur.alasan || "Udzur Syar'i"),
          tgl_mulai: getTanggalBersih_(udzur.tgl_mulai),
          tgl_selesai: getTanggalBersih_(udzur.tgl_selesai),
          id_udzur: String(udzur.id_udzur || ''),
          _row_udzur: udzur._row
        }
      };
    }

    const log = readAll_(SHEET.SHOLAT).find(r =>
      String(r.nis).trim() === String(siswa.nis).trim() &&
      getTanggalBersih_(r.tanggal) === hariIni &&
      String(r.waktu_sholat).toUpperCase() === waktu
    );
    if (log) return { ok: false, message: siswa.nama + ' sudah tercatat ' + waktu + ' hari ini.' };

    appendRow_(SHEET.SHOLAT, {
      id_log: makeId_('SHL'), timestamp: nowStr_(), tanggal: hariIni,
      nis: siswa.nis, nama: siswa.nama, kelas: siswa.kelas,
      waktu_sholat: waktu, status: 'HADIR', petugas: petugas.nama, sumber: String(p.sumber || 'QR')
    }, ['tanggal', 'nis']);

    return {
      ok: true,
      message: siswa.nama + ' Hadir ' + waktu,
      data: { nis: siswa.nis, nama: siswa.nama, kelas: siswa.kelas, status: 'HADIR', waktu: waktu, jam: jamIni }
    };
  } catch (e) { return { ok: false, message: e.message }; }
}

function simpanUdzur_(token, p) {
  try {
    const petugas = verifikasiToken_(token);
    if (isOsisOnly_(petugas.role)) return { ok: false, message: 'Role PETUGAS_OSIS tidak berhak mengelola data udzur siswi.' };
    const nis = String(p.nis || '').trim();
    const tglMulai = String(p.tgl_mulai || '').trim();
    const tglSelesai = String(p.tgl_selesai || '').trim();
    if (!nis || !tglMulai || !tglSelesai) return { ok: false, message: 'Data tidak lengkap.' };
    if (tglSelesai < tglMulai) return { ok: false, message: 'Tanggal selesai harus >= tanggal mulai.' };
    const siswa = readAll_(SHEET.SISWA).find(s => String(s.nis).trim() === nis);
    if (!siswa) return { ok: false, message: 'Siswa tidak ditemukan.' };
    appendRow_(SHEET.UDZUR, {
      id_udzur: makeId_('UDZ'), nis: nis, nama: siswa.nama,
      tgl_mulai: tglMulai, tgl_selesai: tglSelesai,
      alasan: String(p.alasan || "Udzur Syar'i").trim(),
      dicatat_oleh: petugas.nama, timestamp: nowStr_()
    }, ['nis', 'tgl_mulai', 'tgl_selesai']);
    return { ok: true, message: 'Udzur ' + siswa.nama + ' dicatat.' };
  } catch (e) { return { ok: false, message: e.message }; }
}
function getUdzurAktif_(token) {
  try {
    const sesi = verifikasiToken_(token);
    if (isOsisOnly_(sesi.role)) return { ok: false, message: 'Role PETUGAS_OSIS tidak berhak mengakses data udzur siswi.' };
    const hariIni = todayStr_();
    return {
      ok: true,
      data: readAll_(SHEET.UDZUR)
        .filter(u => getTanggalBersih_(u.tgl_selesai) >= hariIni)
        .map(u => ({
          _row: u._row,
          id_udzur: String(u.id_udzur || ''),
          nis: String(u.nis || '').trim(),
          nama: String(u.nama || ''),
          tgl_mulai: getTanggalBersih_(u.tgl_mulai),
          tgl_selesai: getTanggalBersih_(u.tgl_selesai),
          alasan: String(u.alasan || "Udzur Syar'i")
        }))
    };
  } catch (e) { return { ok: false, message: e.message }; }
}
function hapusUdzur_(token, p) {
  try {
    const sesi = verifikasiToken_(token);
    if (isOsisOnly_(sesi.role)) return { ok: false, message: 'Role PETUGAS_OSIS tidak berhak menghapus data udzur.' };
    const idUdzur = String(p.id_udzur || '').trim();
    const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET.UDZUR);
    if (!sh) return { ok: false, message: 'Data udzur sudah tidak ada.' };
    let targetRow = 0;
    if (idUdzur) {
      const target = readAll_(SHEET.UDZUR).find(u => String(u.id_udzur || '').trim() === idUdzur);
      if (target) targetRow = target._row;
    }
    if (!targetRow && p.row) targetRow = Number(p.row);
    if (!targetRow || targetRow < 2 || targetRow > sh.getLastRow()) {
      return { ok: false, message: 'Data udzur tidak ditemukan atau sudah dihapus.' };
    }
    sh.deleteRow(targetRow);
    return { ok: true, message: 'Udzur dihapus.' };
  } catch (e) { return { ok: false, message: e.message }; }
}

// --- POIN BK ---
function catatPoin_(token, p) {
  try {
    const petugas = verifikasiToken_(token);
    const osisMode = isOsisOnly_(petugas.role);
    const nis = String(p.nis || '').trim();
    const pasalArray = p.pasal || [];
    const deskripsi = String(p.deskripsi || '').trim();
    if (!nis || !pasalArray.length) return { ok: false, message: 'Data tidak lengkap.' };
    if (osisMode && !deskripsi) return { ok: false, message: 'Kronologi pelanggaran wajib diisi agar bisa divalidasi Guru BK / Waka Kesiswaan.' };

    const setting = getPengaturan_(null).data;
    const poinAwal = Number(setting.poin_awal) || 100;

    const siswa = readAll_(SHEET.SISWA).find(s => String(s.nis).trim() === nis);
    if (!siswa) return { ok: false, message: 'Siswa tidak ditemukan.' };

    const poinRows = readAll_(SHEET.POIN).filter(r => String(r.nis).trim() === nis && isPoinSah_(r));
    let saldo = poinAwal;
    poinRows.forEach(r => { saldo += (Number(r.poin) || 0); });

    if (osisMode) {
      const tatibMap = {};
      readAll_(SHEET.TATA_TERTIB).forEach(t => {
        if (String(t.aktif || 'YA').trim().toUpperCase() === 'YA') {
          tatibMap[String(t.kode || '').trim().toUpperCase()] = t;
        }
      });
      const verifiedItems = [];
      for (let i = 0; i < pasalArray.length; i++) {
        const kd = String((pasalArray[i] && pasalArray[i].kode) || '').trim().toUpperCase();
        if (!kd || kd === 'KOREKSI') {
          return { ok: false, message: 'Akun PETUGAS_OSIS tidak diizinkan melakukan koreksi manual atau input poin positif.' };
        }
        const t = tatibMap[kd];
        if (!t) return { ok: false, message: 'Pasal "' + kd + '" tidak ditemukan atau tidak aktif.' };
        if (String(t.jenis || '').trim().toUpperCase() !== 'PELANGGARAN') {
          return { ok: false, message: 'Akun PETUGAS_OSIS hanya boleh melaporkan pasal PELANGGARAN.' };
        }
        verifiedItems.push({
          kode: String(t.kode).trim().toUpperCase(),
          deskripsi: String(t.deskripsi || '').trim(),
          poinVal: -Math.abs(Number(t.poin) || 0)
        });
      }
      const batchId = makeId_('PON');
      verifiedItems.forEach((item, idx) => {
        item.id_poin = batchId + '-' + idx;
        appendRow_(SHEET.POIN, {
          id_poin: item.id_poin, timestamp: nowStr_(), tanggal: todayStr_(),
          nis: nis, nama: siswa.nama, kelas: siswa.kelas,
          jenis: 'PELANGGARAN',
          pasal: item.kode, deskripsi: deskripsi,
          poin: item.poinVal, saldo_setelah: saldo, petugas: petugas.nama, divalidasi: 'MENUNGGU'
        }, ['tanggal', 'nis']);
      });
      catatAudit_({ id_guru: petugas.id_guru, nama_guru: petugas.nama, aksi: 'CATAT_POIN_OSIS', modul: 'disiplin', detail: `${siswa.nama} (${nis}) - ${verifiedItems.map(v => v.kode).join(', ')} [MENUNGGU]` });
      notifTelegramOsisBaru_(setting, siswa, verifiedItems, deskripsi, petugas.nama, batchId);
      return { ok: true, pending: true, message: 'Laporan OSIS dikirim! Menunggu validasi Guru BK / Waka Kesiswaan.', data: { saldo: saldo, pending: true } };
    }

    const saldoSebelum = saldo;
    pasalArray.forEach((pasal, idx) => {
      const poinVal = Number(pasal.poin) || 0;
      saldo += poinVal;
      appendRow_(SHEET.POIN, {
        id_poin: makeId_('PON') + (pasalArray.length > 1 ? '-' + idx : ''), timestamp: nowStr_(), tanggal: todayStr_(),
        nis: nis, nama: siswa.nama, kelas: siswa.kelas,
        jenis: poinVal > 0 ? 'PRESTASI' : 'PELANGGARAN',
        pasal: pasal.kode, deskripsi: deskripsi || pasal.deskripsi || '',
        poin: poinVal, saldo_setelah: saldo, petugas: petugas.nama, divalidasi: 'YA'
      }, ['tanggal', 'nis']);
    });

    if (saldo < saldoSebelum) {
      const ringkasPasal = pasalArray.map(x => x.kode).join(', ');
      notifTelegramZonaPoin_(setting, siswa, saldoSebelum, saldo, ringkasPasal, deskripsi, petugas.nama);
    }

    return { ok: true, message: 'Poin tercatat. Saldo akhir: ' + saldo, data: { saldo: saldo } };
  } catch (e) { return { ok: false, message: e.message }; }
}

function hitungZona_(saldo, setting) {
  const s = setting || {};
  const zKuning = Number(s.zona_kuning_min) || 51;
  const zOranye = Number(s.zona_oranye_min) || 26;
  const zMerah = Number(s.zona_merah_min) || 1;
  if (saldo <= 0 || saldo < zMerah) return { kode: 'KRITIS', label: 'Kritis / Konferensi', css: 'chip-kritis' };
  if (saldo < zOranye) return { kode: 'MERAH', label: 'Risiko Tinggi / SP3', css: 'chip-merah' };
  if (saldo < zKuning) return { kode: 'ORANYE', label: 'Perlu Perhatian / SP2', css: 'chip-oranye' };
  if (saldo < (zKuning + 25)) return { kode: 'KUNING', label: 'Baik / SP1', css: 'chip-kuning' };
  return { kode: 'HIJAU', label: 'Sangat Baik', css: 'chip-hijau' };
}

function getRiwayatPoin_(token, p) {
  try {
    const sesi = verifikasiToken_(token);
    if (isOsisOnly_(sesi.role)) {
      return { ok: true, data: [], hidden_for_osis: true, message: 'Detail riwayat & saldo siswa hanya dapat diakses Guru / Wali Kelas / BK.' };
    }
    const nis = String(p.nis || '').trim();
    if (!nis) return { ok: false, message: 'NIS kosong.' };
    const setting = getPengaturan_(null).data || {};
    const poinAwal = Number(setting.poin_awal) || 100;
    const riwayat = readAll_(SHEET.POIN).filter(r => String(r.nis).trim() === nis && isPoinSah_(r)).sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));
    let saldo = poinAwal;
    riwayat.forEach(r => { saldo += (Number(r.poin) || 0); });
    return { ok: true, data: riwayat, poin_awal: poinAwal, saldo: saldo, zona: hitungZona_(saldo, setting) };
  } catch (e) { return { ok: false, message: e.message }; }
}

function getRiwayatPoinPublik_(p) {
  try {
    const nis = String(p.nis || '').trim();
    if (!nis) return { ok: false, message: 'NIS kosong.' };
    const setting = getPengaturan_(null).data || {};
    const poinAwal = Number(setting.poin_awal) || 100;
    const riwayat = readAll_(SHEET.POIN).filter(r => String(r.nis).trim() === nis && isPoinSah_(r)).sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));
    let saldo = poinAwal;
    riwayat.forEach(r => { saldo += (Number(r.poin) || 0); });
    return { ok: true, data: riwayat, poin_awal: poinAwal, saldo: saldo, zona: hitungZona_(saldo, setting) };
  } catch (e) { return { ok: false, message: e.message }; }
}

function getRekapPoinSemua_(token, p) {
  try {
    const sesi = verifikasiToken_(token);
    const osisMode = isOsisOnly_(sesi.role);
    const hariIni = todayStr_();
    const setting = getPengaturan_(null).data || {};
    const poinAwal = Number(setting.poin_awal) || 100;
    const poinAll = readAll_(SHEET.POIN);

    if (osisMode) {
      const namaSaya = String(sesi.nama || '').trim().toLowerCase();
      const riwayatSaya = [];
      poinAll.forEach(r => {
        const tgl = getTanggalBersih_(r.tanggal);
        const pet = String(r.petugas || '').trim().toLowerCase();
        if (tgl === hariIni && (pet === namaSaya || pet.startsWith(namaSaya + ' ['))) {
          riwayatSaya.push({
            nis: String(r.nis || '').trim(),
            nama: String(r.nama || ''),
            kelas: String(r.kelas || ''),
            pasal: String(r.pasal || ''),
            deskripsi: String(r.deskripsi || ''),
            poin: Number(r.poin) || 0,
            petugas: String(r.petugas || ''),
            divalidasi: String(r.divalidasi || 'YA').trim().toUpperCase(),
            timestamp: String(r.timestamp || '')
          });
        }
      });
      riwayatSaya.sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));
      return { ok: true, data: { siswa: [], riwayat_hari_ini: riwayatSaya, kelas_ampu: [], poin_awal: poinAwal, is_admin: false, is_osis: true, pending_osis_count: 0 } };
    }

    const bolehSemua = isAdminRole_(sesi.role);
    const kelasAmpu = bolehSemua ? [] : getKelasAmpu_(sesi);
    if (!bolehSemua && !kelasAmpu.length) {
      return { ok: true, data: { siswa: [], riwayat_hari_ini: [], kelas_ampu: [], poin_awal: 100, is_admin: false, is_osis: false, pending_osis_count: 0 }, message: 'Anda belum ditugaskan sebagai wali kelas mana pun.' };
    }

    let siswaAktif = readAll_(SHEET.SISWA).filter(s => isAktifStatus_(s.status));
    if (!bolehSemua && kelasAmpu.length) {
      siswaAktif = siswaAktif.filter(s => kelasAmpu.includes(String(s.kelas).trim()));
    }

    const stats = {};
    siswaAktif.forEach(s => {
      stats[String(s.nis).trim()] = { saldo: poinAwal, pelanggaran: 0, prestasi: 0 };
    });

    const riwayatHariIni = [];
    let pendingOsisCount = 0;
    poinAll.forEach(r => {
      const dv = String(r.divalidasi || '').trim().toUpperCase();
      if (dv === 'MENUNGGU') { pendingOsisCount++; return; }
      if (dv === 'DITOLAK') return;
      const nis = String(r.nis).trim();
      const val = Number(r.poin) || 0;
      const isSaldoAwal = String(r.pasal || '').trim().toUpperCase() === 'SALDO_AWAL';
      if (stats[nis]) {
        stats[nis].saldo += val;
        if (!isSaldoAwal) {
          if (val < 0) stats[nis].pelanggaran++;
          else if (val > 0) stats[nis].prestasi++;
        }
      }
      const tgl = getTanggalBersih_(r.tanggal);
      if (tgl === hariIni && (bolehSemua || kelasAmpu.includes(String(r.kelas).trim()))) {
        riwayatHariIni.push({
          nis: nis,
          nama: String(r.nama || ''),
          kelas: String(r.kelas || ''),
          pasal: String(r.pasal || ''),
          deskripsi: String(r.deskripsi || ''),
          poin: val,
          petugas: String(r.petugas || ''),
          timestamp: String(r.timestamp || '')
        });
      }
    });

    riwayatHariIni.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    const rekapSiswa = siswaAktif.map(s => {
      const nis = String(s.nis).trim();
      const st = stats[nis] || { saldo: poinAwal, pelanggaran: 0, prestasi: 0 };
      const z = hitungZona_(st.saldo, setting);
      return {
        nis: nis,
        nama: String(s.nama || ''),
        kelas: String(s.kelas || ''),
        no_hp_ortu: getNoHpOrtu_(s),
        saldo: st.saldo,
        pelanggaran: st.pelanggaran,
        prestasi: st.prestasi,
        zona: z.kode,
        zona_label: z.label,
        zona_css: z.css
      };
    });

    return {
      ok: true,
      data: {
        siswa: rekapSiswa,
        riwayat_hari_ini: riwayatHariIni.slice(0, 20),
        kelas_ampu: kelasAmpu,
        poin_awal: poinAwal,
        setting: {
          poin_awal: poinAwal,
          zona_kuning_min: Number(setting.zona_kuning_min) || 51,
          zona_oranye_min: Number(setting.zona_oranye_min) || 26,
          zona_merah_min: Number(setting.zona_merah_min) || 1
        },
        is_admin: bolehSemua,
        is_osis: false,
        pending_osis_count: bolehSemua ? pendingOsisCount : 0
      }
    };
  } catch (e) { return { ok: false, message: e.message }; }
}

function getRiwayatSiswaPublik_(p) {
  try {
    const nis = String(p.nis || '').trim();
    if (!nis) return { ok: false, message: 'NIS kosong.' };
    const siswa = readAll_(SHEET.SISWA).find(s => String(s.nis).trim() === nis);
    if (!siswa) return { ok: false, message: 'Siswa tidak ditemukan.' };

    const infoSiswa = {
      nis: String(siswa.nis),
      nama: String(siswa.nama || ''),
      kelas: String(siswa.kelas || ''),
      jk: String(siswa.jk || '-'),
      status: String(siswa.status || 'AKTIF').toUpperCase()
    };

    const setting = getPengaturan_(null).data || {};
    const hariIni = todayStr_();

    // 1. Gabungkan REKAP_SISWA & PRESENSI_GERBANG agar jam masuk + pulang lengkap per hari
    const gerbangMap = {};
    readAll_(SHEET.REKAP_SISWA)
      .filter(r => String(r.nis).trim() === nis)
      .forEach(r => {
        const tgl = getTanggalBersih_(r.tanggal);
        if (!tgl) return;
        const jm = formatJamSheet(r.jam_masuk, '');
        const jp = formatJamSheet(r.jam_pulang, '');
        const stM = String(r.status_masuk || '').toUpperCase();
        const stP = String(r.status_pulang || '').toUpperCase();
        gerbangMap[tgl] = {
          tanggal: tgl,
          jam_masuk: jm || '-',
          status_masuk: jm ? (stM && stM !== '-' ? stM : hitungStatusSiswa_(jm, 'PAGI', setting)) : '-',
          jam_pulang: jp || '-',
          status_pulang: jp ? (stP && stP !== '-' ? stP : hitungStatusSiswa_(jp, 'PULANG', setting)) : '-'
        };
      });

    readAll_(SHEET.GERBANG)
      .filter(r => String(r.nis).trim() === nis)
      .sort((a, b) => String(a.timestamp || '').localeCompare(String(b.timestamp || '')))
      .forEach(r => {
        const tgl = getTanggalBersih_(r.tanggal);
        if (!tgl) return;
        if (!gerbangMap[tgl]) {
          gerbangMap[tgl] = { tanggal: tgl, jam_masuk: '-', status_masuk: '-', jam_pulang: '-', status_pulang: '-' };
        }
        const sesi = String(r.sesi || 'PAGI').toUpperCase();
        const jam = formatJamSheet(r.jam || r.timestamp, '');
        const st = String(r.status || '').toUpperCase();
        if (sesi === 'PULANG') {
          if (jam) {
            gerbangMap[tgl].jam_pulang = jam;
            gerbangMap[tgl].status_pulang = (st && st !== '-') ? st : hitungStatusSiswa_(jam, 'PULANG', setting);
          }
        } else {
          if (gerbangMap[tgl].jam_masuk === '-' && jam) {
            gerbangMap[tgl].jam_masuk = jam;
            gerbangMap[tgl].status_masuk = (st && st !== '-') ? st : hitungStatusSiswa_(jam, 'PAGI', setting);
          }
        }
      });

    const semuaGerbang = Object.values(gerbangMap).sort((a, b) => b.tanggal.localeCompare(a.tanggal));
    let totalHadir = 0, totalTepat = 0, totalTelat = 0, totalPulangAwal = 0;
    semuaGerbang.forEach(g => {
      if (g.jam_masuk !== '-' || g.status_masuk !== '-') totalHadir++;
      if (g.status_masuk === 'TEPAT_WAKTU') totalTepat++;
      else if (g.status_masuk === 'TERLAMBAT') totalTelat++;
      if (g.status_pulang === 'PULANG_AWAL') totalPulangAwal++;
    });

    // 2. Sholat & Udzur
    const semuaSholat = readAll_(SHEET.SHOLAT)
      .filter(r => String(r.nis).trim() === nis)
      .map(r => ({
        tanggal: getTanggalBersih_(r.tanggal),
        waktu_sholat: String(r.waktu_sholat || '').toUpperCase(),
        status: String(r.status || 'HADIR').toUpperCase(),
        petugas: String(r.petugas || ''),
        timestamp: String(r.timestamp || '')
      }))
      .sort((a, b) => (b.tanggal + b.timestamp).localeCompare(a.tanggal + a.timestamp));

    const udzurAktifRaw = readAll_(SHEET.UDZUR).find(u =>
      String(u.nis).trim() === nis &&
      getTanggalBersih_(u.tgl_mulai) <= hariIni &&
      getTanggalBersih_(u.tgl_selesai) >= hariIni
    );
    const udzurAktif = udzurAktifRaw ? {
      tgl_mulai: getTanggalBersih_(udzurAktifRaw.tgl_mulai),
      tgl_selesai: getTanggalBersih_(udzurAktifRaw.tgl_selesai),
      alasan: String(udzurAktifRaw.alasan || 'Udzur')
    } : null;

    // 3. Keterangan Absen (Izin / Sakit / Alpa) — deduplikasi per tanggal & skip tanggal yang sudah hadir
    const ketPerTgl = {};
    readAll_(SHEET.KETERANGAN)
      .filter(r => String(r.nis).trim() === nis)
      .forEach(r => {
        const tgl = getTanggalBersih_(r.tanggal);
        if (!tgl) return;
        ketPerTgl[tgl] = {
          tanggal: tgl,
          status: String(r.status || '').toUpperCase(),
          keterangan: String(r.keterangan || '')
        };
      });
    const semuaKet = Object.values(ketPerTgl).sort((a, b) => b.tanggal.localeCompare(a.tanggal));

    let totalIzin = 0, totalSakit = 0, totalAlpa = 0;
    semuaKet.forEach(k => {
      const gTgl = gerbangMap[k.tanggal];
      const sudahHadir = gTgl && (gTgl.jam_masuk !== '-' || gTgl.status_masuk !== '-');
      if (sudahHadir) return;
      if (k.status === 'IZIN') totalIzin++;
      else if (k.status === 'SAKIT') totalSakit++;
      else if (k.status === 'ALPA') totalAlpa++;
    });

    // 4. Poin Disiplin & Zona
    const semuaPoin = readAll_(SHEET.POIN)
      .filter(r => String(r.nis).trim() === nis && isPoinSah_(r))
      .map(r => ({
        tanggal: getTanggalBersih_(r.tanggal),
        pasal: String(r.pasal || ''),
        deskripsi: String(r.deskripsi || ''),
        jenis: String(r.jenis || ''),
        poin: Number(r.poin) || 0,
        petugas: String(r.petugas || ''),
        timestamp: String(r.timestamp || '')
      }))
      .sort((a, b) => (b.tanggal + b.timestamp).localeCompare(a.tanggal + a.timestamp));

    const poinAwal = Number(setting.poin_awal) || 100;
    let saldo = poinAwal, totalPelanggaran = 0, totalPrestasi = 0;
    semuaPoin.forEach(r => {
      saldo += r.poin;
      if (String(r.pasal || '').trim().toUpperCase() === 'SALDO_AWAL') return;
      if (r.poin < 0) totalPelanggaran++;
      else if (r.poin > 0) totalPrestasi++;
    });

    const zKuning = Number(setting.zona_kuning_min) || 51;
    const zOranye = Number(setting.zona_oranye_min) || 26;
    const zMerah = Number(setting.zona_merah_min) || 1;
    let zonaKode = 'HIJAU', zonaLabel = 'Sangat Baik';
    if (saldo <= 0 || saldo < zMerah) { zonaKode = 'KRITIS'; zonaLabel = 'Kritis'; }
    else if (saldo < zOranye) { zonaKode = 'MERAH'; zonaLabel = 'Risiko Tinggi'; }
    else if (saldo < zKuning) { zonaKode = 'ORANYE'; zonaLabel = 'Perlu Perhatian'; }
    else if (saldo < (zKuning + 25)) { zonaKode = 'KUNING'; zonaLabel = 'Baik'; }

    // 5. Ringkasan Status Hari Ini
    const gHariIni = gerbangMap[hariIni] || null;
    const kHariIni = semuaKet.find(k => k.tanggal === hariIni) || null;
    const sHariIni = semuaSholat.filter(s => s.tanggal === hariIni).map(s => s.waktu_sholat);

    return {
      ok: true,
      data: {
        siswa: infoSiswa,
        hari_ini: {
          tanggal: hariIni,
          jam_masuk: gHariIni ? gHariIni.jam_masuk : '-',
          status_masuk: gHariIni ? gHariIni.status_masuk : '-',
          jam_pulang: gHariIni ? gHariIni.jam_pulang : '-',
          status_pulang: gHariIni ? gHariIni.status_pulang : '-',
          keterangan_status: kHariIni ? kHariIni.status : '',
          keterangan_teks: kHariIni ? kHariIni.keterangan : '',
          sholat: sHariIni,
          udzur: udzurAktif
        },
        ringkasan: {
          hadir: totalHadir,
          tepat: totalTepat,
          telat: totalTelat,
          pulang_awal: totalPulangAwal,
          sholat: semuaSholat.length,
          izin: totalIzin,
          sakit: totalSakit,
          alpa: totalAlpa,
          pelanggaran: totalPelanggaran,
          prestasi: totalPrestasi
        },
        gerbang: semuaGerbang.slice(0, 20),
        sholat: semuaSholat.slice(0, 20).map(({ timestamp, ...rest }) => rest),
        keterangan: semuaKet.slice(0, 20),
        poin: semuaPoin.slice(0, 20).map(({ timestamp, ...rest }) => rest),
        poin_awal: poinAwal,
        saldo_poin: saldo,
        zona: { kode: zonaKode, label: zonaLabel }
      }
    };
  } catch (e) { return { ok: false, message: 'Gagal memuat data: ' + e.message }; }
}

// --- VALIDASI BOLOS SHOLAT ---
function getSiswaBolosSholat_(token, p) {
  try {
    const petugas = verifikasiToken_(token);
    if (!isAdminRole_(petugas.role)) return { ok: false, message: 'Hanya Guru BK / Waka Kesiswaan / Admin yang berhak validasi bolos sholat.' };
    const hariIni = todayStr_();
    const hadirGerbang = readAll_(SHEET.GERBANG).filter(r => getTanggalBersih_(r.tanggal) === hariIni && String(r.sesi).toUpperCase() === 'PAGI').map(r => String(r.nis).trim());
    const hadirSholat = readAll_(SHEET.SHOLAT).filter(r => getTanggalBersih_(r.tanggal) === hariIni).map(r => String(r.nis).trim());
    const udzur = readAll_(SHEET.UDZUR).filter(u => getTanggalBersih_(u.tgl_mulai) <= hariIni && getTanggalBersih_(u.tgl_selesai) >= hariIni).map(u => String(u.nis).trim());
    const ketAbsen = readAll_(SHEET.KETERANGAN).filter(k => getTanggalBersih_(k.tanggal) === hariIni).map(k => String(k.nis).trim());

    const tatib = readAll_(SHEET.TATA_TERTIB).find(t => String(t.kategori).toUpperCase() === 'IBADAH' && String(t.jenis).toUpperCase() === 'PELANGGARAN');
    const pasalKode = tatib ? String(tatib.kode) : 'TT-02';
    const poinBolos = tatib ? -Math.abs(Number(tatib.poin) || 10) : -10;
    const sudahDivalidasi = readAll_(SHEET.POIN)
      .filter(r => getTanggalBersih_(r.tanggal) === hariIni && (String(r.pasal) === pasalKode || String(r.deskripsi || '').toLowerCase().includes('sholat berjamaah')))
      .map(r => String(r.nis).trim());

    const semuaSiswa = readAll_(SHEET.SISWA).filter(s => isAktifStatus_(s.status));
    const bolos = semuaSiswa.filter(s => {
      const nis = String(s.nis).trim();
      return hadirGerbang.includes(nis) &&
        !hadirSholat.includes(nis) &&
        !udzur.includes(nis) &&
        !ketAbsen.includes(nis) &&
        !sudahDivalidasi.includes(nis);
    }).map(s => ({ nis: s.nis, nama: s.nama, kelas: s.kelas }));

    return {
      ok: true,
      data: bolos,
      meta: {
        pasal_kode: pasalKode,
        poin_potong: poinBolos,
        sudah_divalidasi_hari_ini: new Set(sudahDivalidasi).size
      }
    };
  } catch (e) { return { ok: false, message: e.message }; }
}

function validasiBolosSholat_(token, p) {
  try {
    const petugas = verifikasiToken_(token);
    if (!isAdminRole_(petugas.role)) return { ok: false, message: 'Hanya Guru BK / Waka Kesiswaan / Admin yang berhak validasi bolos sholat.' };
    const nisList = Array.isArray(p.nisList) ? [...new Set(p.nisList.map(n => String(n).trim()).filter(Boolean))] : [];
    if (!nisList.length) return { ok: false, message: 'Tidak ada siswa dipilih.' };

    let count = 0, skipped = 0;
    const hariIni = todayStr_();
    const tatib = readAll_(SHEET.TATA_TERTIB).find(t => String(t.kategori).toUpperCase() === 'IBADAH' && String(t.jenis).toUpperCase() === 'PELANGGARAN');
    const poinBolos = tatib ? -Math.abs(Number(tatib.poin) || 10) : -10;
    const pasalKode = tatib ? String(tatib.kode) : 'TT-02';

    const setting = getPengaturan_(null).data;
    const poinAwal = Number(setting.poin_awal) || 100;
    const poinAll = readAll_(SHEET.POIN).filter(isPoinSah_);
    const sudahSet = new Set(
      poinAll
        .filter(r => getTanggalBersih_(r.tanggal) === hariIni && (String(r.pasal) === pasalKode || String(r.deskripsi || '').toLowerCase().includes('sholat berjamaah')))
        .map(r => String(r.nis).trim())
    );
    const semuaSiswa = readAll_(SHEET.SISWA);

    nisList.forEach(nis => {
      if (sudahSet.has(nis)) { skipped++; return; }
      const siswa = semuaSiswa.find(s => String(s.nis).trim() === nis);
      if (!siswa) return;
      let saldo = poinAwal;
      poinAll.filter(r => String(r.nis).trim() === nis).forEach(r => { saldo += (Number(r.poin) || 0); });
      saldo += poinBolos;
      appendRow_(SHEET.POIN, {
        id_poin: makeId_('PON'), timestamp: nowStr_(), tanggal: hariIni,
        nis: siswa.nis, nama: siswa.nama, kelas: siswa.kelas,
        jenis: 'PELANGGARAN', pasal: pasalKode, deskripsi: 'Tidak mengikuti sholat berjamaah (validasi BK)',
        poin: poinBolos, saldo_setelah: saldo, petugas: petugas.nama, divalidasi: 'YA'
      }, ['tanggal', 'nis']);
      sudahSet.add(nis);
      count++;
    });
    const msg = count + ' siswa dipotong poinnya (' + poinBolos + ' per siswa).' + (skipped ? ' ' + skipped + ' siswa dilewati karena sudah divalidasi hari ini.' : '');
    return { ok: true, message: msg };
  } catch (e) { return { ok: false, message: e.message }; }
}

function getLaporanOsisPending_(token) {
  try {
    const sesi = verifikasiToken_(token);
    if (!isAdminRole_(sesi.role)) {
      return { ok: false, message: 'Hanya Guru BK / Waka Kesiswaan / Kepsek / Super Admin yang berhak melihat antrean validasi OSIS.' };
    }
    const setting = getPengaturan_(null).data || {};
    const poinAwal = Number(setting.poin_awal) || 100;
    const poinAll = readAll_(SHEET.POIN);
    const saldoMap = {};
    poinAll.filter(isPoinSah_).forEach(r => {
      const nis = String(r.nis || '').trim();
      if (saldoMap[nis] === undefined) saldoMap[nis] = poinAwal;
      saldoMap[nis] += (Number(r.poin) || 0);
    });
    const pending = poinAll
      .filter(r => String(r.divalidasi || '').trim().toUpperCase() === 'MENUNGGU')
      .map(r => {
        const nis = String(r.nis || '').trim();
        const saldoSaatIni = saldoMap[nis] !== undefined ? saldoMap[nis] : poinAwal;
        const poin = Number(r.poin) || 0;
        return {
          id_poin: String(r.id_poin || ''),
          timestamp: String(r.timestamp || ''),
          tanggal: getTanggalBersih_(r.tanggal),
          nis: nis,
          nama: String(r.nama || ''),
          kelas: String(r.kelas || ''),
          pasal: String(r.pasal || ''),
          deskripsi: String(r.deskripsi || ''),
          poin: poin,
          saldo_saat_ini: saldoSaatIni,
          estimasi_saldo: saldoSaatIni + poin,
          petugas: String(r.petugas || '')
        };
      })
      .sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));
    return { ok: true, data: pending };
  } catch (e) { return { ok: false, message: e.message }; }
}

function validasiLaporanOsis_(token, p) {
  try {
    const sesi = verifikasiToken_(token);
    if (!isAdminRole_(sesi.role)) {
      return { ok: false, message: 'Hanya Guru BK / Waka Kesiswaan / Kepsek / Super Admin yang berhak memvalidasi laporan OSIS.' };
    }
    const keputusan = String(p.keputusan || '').trim().toUpperCase();
    if (!['SETUJU', 'TOLAK'].includes(keputusan)) {
      return { ok: false, message: 'Keputusan validasi harus SETUJU atau TOLAK.' };
    }
    const ids = Array.isArray(p.ids) ? p.ids.map(x => String(x).trim()).filter(Boolean)
      : (p.id_poin ? [String(p.id_poin).trim()] : []);
    if (!ids.length) return { ok: false, message: 'Tidak ada laporan yang dipilih.' };
    const catatanBk = String(p.catatan_bk || '').trim();

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = getOrCreateSheet_(ss, SHEET.POIN);
    const headers = ensureHeaders_(sh, SHEET.POIN).map(h => String(h).trim().toLowerCase());
    const d = sh.getDataRange().getValues();
    if (d.length < 2) return { ok: false, message: 'Data poin kosong.' };

    const iId = headers.indexOf('id_poin');
    const iNis = headers.indexOf('nis');
    const iPoin = headers.indexOf('poin');
    const iSaldo = headers.indexOf('saldo_setelah');
    const iPetugas = headers.indexOf('petugas');
    const iDesk = headers.indexOf('deskripsi');
    const iValid = headers.indexOf('divalidasi');

    const setting = getPengaturan_(null).data || {};
    const poinAwal = Number(setting.poin_awal) || 100;
    const saldoMap = {};
    readAll_(SHEET.POIN).filter(isPoinSah_).forEach(r => {
      const n = String(r.nis || '').trim();
      if (saldoMap[n] === undefined) saldoMap[n] = poinAwal;
      saldoMap[n] += (Number(r.poin) || 0);
    });

    const iNama = headers.indexOf('nama');
    const iKelas = headers.indexOf('kelas');
    const iPasal = headers.indexOf('pasal');
    const targetSet = new Set(ids);
    const zonaAlertQueue = [];
    let diproses = 0, dilewati = 0;
    for (let i = 1; i < d.length; i++) {
      const idRow = String(d[i][iId !== -1 ? iId : 0] || '').trim();
      if (!targetSet.has(idRow)) continue;
      const curValid = String(d[i][iValid] || '').trim().toUpperCase();
      if (curValid !== 'MENUNGGU') { dilewati++; continue; }

      const nis = String(d[i][iNis] || '').trim();
      const poinVal = Number(d[i][iPoin]) || 0;
      const origPet = String(d[i][iPetugas] || '').trim();
      const origDesk = String(d[i][iDesk] || '').trim();

      if (keputusan === 'SETUJU') {
        const curSaldo = saldoMap[nis] !== undefined ? saldoMap[nis] : poinAwal;
        const newSaldo = curSaldo + poinVal;
        saldoMap[nis] = newSaldo;
        if (iSaldo !== -1) d[i][iSaldo] = newSaldo;
        if (iValid !== -1) d[i][iValid] = 'YA';
        if (iPetugas !== -1) d[i][iPetugas] = origPet ? `${origPet} [✓ ${sesi.nama}]` : sesi.nama;
        if (catatanBk && iDesk !== -1) d[i][iDesk] = origDesk ? `${origDesk} (Catatan BK: ${catatanBk})` : catatanBk;
        if (newSaldo < curSaldo) {
          zonaAlertQueue.push({
            siswa: { nis: nis, nama: iNama !== -1 ? d[i][iNama] : nis, kelas: iKelas !== -1 ? d[i][iKelas] : '-' },
            saldoSebelum: curSaldo,
            saldoSesudah: newSaldo,
            pasal: iPasal !== -1 ? String(d[i][iPasal] || '') : '',
            deskripsi: origDesk,
            petugas: (origPet ? origPet + ' ✓ ' : '') + sesi.nama
          });
        }
      } else {
        if (iValid !== -1) d[i][iValid] = 'DITOLAK';
        if (iPetugas !== -1) d[i][iPetugas] = origPet ? `${origPet} [✗ ${sesi.nama}]` : sesi.nama;
        if (catatanBk && iDesk !== -1) d[i][iDesk] = origDesk ? `${origDesk} [Ditolak: ${catatanBk}]` : `[Ditolak: ${catatanBk}]`;
      }
      sh.getRange(i + 1, 1, 1, headers.length).setValues([d[i]]);
      diproses++;
    }

    if (zonaAlertQueue.length > 0) {
      zonaAlertQueue.forEach(item => {
        notifTelegramZonaPoin_(setting, item.siswa, item.saldoSebelum, item.saldoSesudah, item.pasal, item.deskripsi, item.petugas);
      });
    }

    if (diproses > 0) {
      catatAudit_({
        id_guru: sesi.id_guru,
        nama_guru: sesi.nama,
        aksi: keputusan === 'SETUJU' ? 'VALIDASI_OSIS_SETUJU' : 'VALIDASI_OSIS_TOLAK',
        modul: 'disiplin',
        detail: `${diproses} laporan ${keputusan === 'SETUJU' ? 'disetujui' : 'ditolak'}${catatanBk ? ' (' + catatanBk + ')' : ''}`
      });
    }
    const label = keputusan === 'SETUJU' ? 'disetujui dan memotong poin siswa' : 'ditolak (poin tidak dipotong)';
    return {
      ok: true,
      message: `${diproses} laporan OSIS berhasil ${label}.` + (dilewati ? ` (${dilewati} sudah divalidasi sebelumnya.)` : ''),
      data: { diproses, dilewati }
    };
  } catch (e) { return { ok: false, message: e.message }; }
}

function batalkanPoinDispensasi_(token, p) {
  try {
    const sesi = verifikasiToken_(token);
    if (isOsisOnly_(sesi.role)) {
      return { ok: false, message: 'Petugas OSIS tidak berhak membatalkan potongan poin.' };
    }
    const bolehSemua = isAdminRole_(sesi.role);
    const rolesArr = String(sesi.role || '').toUpperCase().split(',').map(r => r.trim());
    const kelasAmpu = bolehSemua ? [] : (rolesArr.includes('WALI_KELAS') ? getKelasAmpu_(sesi) : []);
    if (!bolehSemua && !kelasAmpu.length) {
      return { ok: false, message: 'Hanya Guru BK / Waka Kesiswaan / Kepsek / Admin / Wali Kelas binaan yang berhak memberikan dispensasi.' };
    }

    const idPoin = String(p.id_poin || '').trim();
    const alasan = String(p.alasan || '').trim();
    if (!idPoin) return { ok: false, message: 'ID poin tidak valid.' };

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = getOrCreateSheet_(ss, SHEET.POIN);
    const headers = ensureHeaders_(sh, SHEET.POIN).map(h => String(h).trim().toLowerCase());
    const d = sh.getDataRange().getValues();
    if (d.length < 2) return { ok: false, message: 'Data poin kosong.' };

    const iId = headers.indexOf('id_poin');
    const iNama = headers.indexOf('nama');
    const iNis = headers.indexOf('nis');
    const iKelas = headers.indexOf('kelas');
    const iDesk = headers.indexOf('deskripsi');
    const iPoin = headers.indexOf('poin');
    const iValid = headers.indexOf('divalidasi');

    for (let i = 1; i < d.length; i++) {
      const rowId = String(d[i][iId !== -1 ? iId : 0] || '').trim();
      if (rowId !== idPoin) continue;
      const kelasRow = String(d[i][iKelas] || '').trim();
      if (!bolehSemua && !kelasAmpu.includes(kelasRow)) {
        return { ok: false, message: 'Anda hanya dapat memberi dispensasi untuk siswa di kelas ' + kelasAmpu.join(', ') + '.' };
      }
      const curValid = String(d[i][iValid] || '').trim().toUpperCase();
      if (curValid === 'DITOLAK') {
        return { ok: false, message: 'Catatan poin ini sudah dibatalkan sebelumnya.' };
      }
      if (iValid !== -1) d[i][iValid] = 'DITOLAK';
      const origDesk = String(d[i][iDesk] || '').trim();
      const note = `[Dispensasi oleh ${sesi.nama}${alasan ? ': ' + alasan : ''}]`;
      if (iDesk !== -1) d[i][iDesk] = origDesk ? `${origDesk} ${note}` : note;
      sh.getRange(i + 1, 1, 1, headers.length).setValues([d[i]]);

      catatAudit_({
        id_guru: sesi.id_guru,
        nama_guru: sesi.nama,
        aksi: 'BATAL_POIN_DISPENSA',
        modul: 'disiplin',
        detail: `${d[i][iNama]} (${d[i][iNis]}) poin ${d[i][iPoin]} dibatalkan${alasan ? ' — ' + alasan : ''}`
      });
      return { ok: true, message: 'Dispensasi berhasil! Potongan poin dibatalkan dan saldo siswa otomatis dipulihkan.' };
    }
    return { ok: false, message: 'Catatan poin tidak ditemukan.' };
  } catch (e) { return { ok: false, message: e.message }; }
}

// --- LAPORAN ---
function getLaporan_(token, p) {
  try {
    verifikasiToken_(token);
    const jenis = String(p.jenis || '').toLowerCase();
    const dari = String(p.dari || '').trim();
    const sampai = String(p.sampai || '').trim();
    const kelas = String(p.kelas || '').trim();

    let rawData = [];
    if (jenis === 'gerbang') rawData = readAll_(SHEET.GERBANG);
    else if (jenis === 'sholat') rawData = readAll_(SHEET.SHOLAT);
    else if (jenis === 'poin') rawData = readAll_(SHEET.POIN).filter(isPoinSah_);
    else if (jenis === 'guru') {
      const guruMap = {};
      readAll_(SHEET.GURU).forEach(g => guruMap[String(g.id_guru).trim()] = g.nama);
      rawData = readAll_(SHEET.REKAP_GURU).map(r => {
        r.nama_guru = guruMap[String(r.id_guru).trim()] || r.id_guru;
        r.jam_masuk = (r.jam_masuk && r.jam_masuk !== '-') ? formatJamSheet(r.jam_masuk, String(r.jam_masuk)) : '-';
        r.jam_pulang = (r.jam_pulang && r.jam_pulang !== '-') ? formatJamSheet(r.jam_pulang, String(r.jam_pulang)) : '-';
        return r;
      });
    }
    else if (jenis === 'siswa') rawData = readAll_(SHEET.SISWA);
    else if (jenis === 'keterangan') rawData = readAll_(SHEET.KETERANGAN);
    else if (jenis === 'rekap_siswa') {
      rawData = readAll_(SHEET.REKAP_SISWA).map(r => {
        r.jam_masuk = (r.jam_masuk && r.jam_masuk !== '-') ? formatJamSheet(r.jam_masuk, String(r.jam_masuk)) : '-';
        r.jam_pulang = (r.jam_pulang && r.jam_pulang !== '-') ? formatJamSheet(r.jam_pulang, String(r.jam_pulang)) : '-';
        return r;
      });
    }

    let data = rawData.map(r => {
      r.tanggal = getTanggalBersih_(r.tanggal);
      return r;
    });

    if (dari && sampai && jenis !== 'siswa') data = data.filter(r => r.tanggal >= dari && r.tanggal <= sampai);
    if (kelas) data = data.filter(r => String(r.kelas) === kelas);
    return { ok: true, data: data, ringkasan: {} };
  } catch (e) { return { ok: false, message: e.message }; }
}

// --- DASHBOARD ---
function getDashboardSummary_(token) {
  try {
    verifikasiToken_(token);
    const hariIni = todayStr_();
    const bulanIni = hariIni.slice(0, 7);
    const setting = getPengaturan_(null).data || {};

    const poinAwal = Number(setting.poin_awal) || 100;
    const zKuning = Number(setting.zona_kuning_min) || 51;
    const zOranye = Number(setting.zona_oranye_min) || 26;
    const zMerah = Number(setting.zona_merah_min) || 1;

    const jamMasukAturan = formatJamSheet(setting.jam_masuk, '07:00');
    const toleransi = Number(setting.toleransi_menit) || 0;
    const jmParts = jamMasukAturan.split(':').map(Number);
    const batasMasukMenit = ((jmParts[0] || 7) * 60) + (jmParts[1] || 0) + toleransi;

    const siswa = readAll_(SHEET.SISWA).filter(s => isAktifStatus_(s.status));
    const guruAktif = readAll_(SHEET.GURU).filter(g => isAktifStatus_(g.status));
    const kelasList = readAll_(SHEET.KELAS);

    const siswaMap = {};
    let siswaPunyaRfid = 0;
    const siswaPerKelas = {};
    siswa.forEach(s => {
      const nis = String(s.nis || '').trim();
      siswaMap[nis] = s;
      if (String(s.uid_rfid || '').trim()) siswaPunyaRfid++;
      const k = String(s.kelas || '-').trim();
      siswaPerKelas[k] = (siswaPerKelas[k] || 0) + 1;
    });

    const gerbangHariIni = readAll_(SHEET.GERBANG).filter(r => getTanggalBersih_(r.tanggal) === hariIni && String(r.sesi).toUpperCase() === 'PAGI');
    const sholatHariIni = readAll_(SHEET.SHOLAT).filter(r => getTanggalBersih_(r.tanggal) === hariIni);
    const udzurAktifList = readAll_(SHEET.UDZUR).filter(u => getTanggalBersih_(u.tgl_mulai) <= hariIni && getTanggalBersih_(u.tgl_selesai) >= hariIni);
    const ketHariIni = readAll_(SHEET.KETERANGAN).filter(r => getTanggalBersih_(r.tanggal) === hariIni);

    // Gerbang & Ketepatan Siswa
    const hadirSet = {};
    const tepat = {};
    const telat = {};
    const siswaTerlambat = [];
    gerbangHariIni.forEach(r => {
      const nis = String(r.nis || '').trim();
      if (!siswaMap[nis]) return;
      hadirSet[nis] = true;
      const st = String(r.status || '').toUpperCase();
      if (st === 'TEPAT_WAKTU' || st === 'HADIR') {
        tepat[nis] = true;
      } else if (st === 'TERLAMBAT') {
        if (!telat[nis]) {
          telat[nis] = true;
          siswaTerlambat.push({
            nis: nis,
            nama: r.nama || siswaMap[nis].nama,
            kelas: r.kelas || siswaMap[nis].kelas,
            jam: formatJamSheet(r.jam || r.timestamp, '-'),
            no_hp_ortu: getNoHpOrtu_(siswaMap[nis])
          });
        }
      }
    });
    siswaTerlambat.sort((a, b) => String(b.jam).localeCompare(String(a.jam)));

    // Keterangan Absen Hari Ini (Izin / Sakit / Alpa) — deduplikasi per NIS
    const ketLatestMap = {};
    ketHariIni.forEach(r => {
      const nis = String(r.nis || '').trim();
      if (!siswaMap[nis]) return;
      const st = String(r.status || '').toUpperCase();
      ketLatestMap[nis] = {
        nis: nis,
        nama: r.nama || siswaMap[nis].nama,
        kelas: r.kelas || siswaMap[nis].kelas,
        status: st,
        keterangan: r.keterangan || '-',
        no_hp_ortu: getNoHpOrtu_(siswaMap[nis])
      };
    });
    const ketMap = {};
    const keteranganList = [];
    let jmlIzin = 0, jmlSakit = 0, jmlAlpa = 0, ketBelumTap = 0;
    Object.keys(ketLatestMap).forEach(nis => {
      const item = ketLatestMap[nis];
      ketMap[nis] = item.status;
      keteranganList.push(item);
      if (!hadirSet[nis]) {
        ketBelumTap++;
        if (item.status === 'IZIN') jmlIzin++;
        else if (item.status === 'SAKIT') jmlSakit++;
        else if (item.status === 'ALPA') jmlAlpa++;
      }
    });
    const hadirCount = Object.keys(hadirSet).length;
    const belumHadirCount = Math.max(0, siswa.length - hadirCount - ketBelumTap);

    // Sholat Unik & Udzur
    const sholatUnikSet = new Set();
    const udzurSet = new Set();
    udzurAktifList.forEach(u => {
      const nis = String(u.nis || '').trim();
      if (siswaMap[nis]) udzurSet.add(nis);
    });

    const kelasSholatUnik = {};
    const kelasSholatScan = {};
    sholatHariIni.forEach(r => {
      const nis = String(r.nis || '').trim();
      if (!siswaMap[nis]) return;
      sholatUnikSet.add(nis);
      const k = String(r.kelas || siswaMap[nis].kelas || '-').trim();
      if (!kelasSholatUnik[k]) kelasSholatUnik[k] = new Set();
      kelasSholatUnik[k].add(nis);
      kelasSholatScan[k] = (kelasSholatScan[k] || 0) + 1;
    });

    const semuaKelasSet = new Set(Object.keys(siswaPerKelas));
    kelasList.forEach(k => { if (k.nama_kelas) semuaKelasSet.add(String(k.nama_kelas).trim()); });
    const raporKelas = Array.from(semuaKelasSet).filter(k => (siswaPerKelas[k] || 0) > 0).map(k => {
      const tot = siswaPerKelas[k] || 0;
      const unik = kelasSholatUnik[k] ? kelasSholatUnik[k].size : 0;
      const scan = kelasSholatScan[k] || 0;
      const persen = tot > 0 ? Math.min(100, Math.round((unik / tot) * 100)) : 0;
      return { kelas: k, unik: unik, total_siswa: tot, jumlah: scan, persen: persen };
    }).sort((a, b) => b.persen - a.persen || b.unik - a.unik || a.kelas.localeCompare(b.kelas));

    // Zonasi Poin & Siswa Prioritas Pembinaan
    const poinRows = readAll_(SHEET.POIN).filter(isPoinSah_);
    const saldo = {};
    siswa.forEach(s => { saldo[String(s.nis).trim()] = poinAwal; });
    poinRows.forEach(p => {
      const nis = String(p.nis || '').trim();
      if (saldo[nis] !== undefined) saldo[nis] += (Number(p.poin) || 0);
    });

    const zonasi = { hijau: 0, kuning: 0, oranye: 0, merah: 0, kritis: 0 };
    const prioritasList = [];
    siswa.forEach(s => {
      const nis = String(s.nis).trim();
      const v = saldo[nis];
      let zKode = 'Hijau', zCls = 'hijau';
      if (v >= (zKuning + 25)) {
        zonasi.hijau++;
      } else if (v >= zKuning) {
        zonasi.kuning++; zKode = 'Kuning'; zCls = 'kuning';
      } else if (v >= zOranye) {
        zonasi.oranye++; zKode = 'Oranye'; zCls = 'oranye';
      } else if (v >= zMerah && v > 0) {
        zonasi.merah++; zKode = 'Merah'; zCls = 'merah';
      } else {
        zonasi.kritis++; zKode = 'Kritis'; zCls = 'kritis';
      }
      if (zCls !== 'hijau') {
        prioritasList.push({
          nis: nis,
          nama: s.nama,
          kelas: s.kelas,
          saldo: v,
          zona: zKode,
          zona_cls: zCls,
          no_hp_ortu: getNoHpOrtu_(s)
        });
      }
    });
    prioritasList.sort((a, b) => a.saldo - b.saldo || String(a.nama).localeCompare(String(b.nama)));

    // Top 5 Pelanggaran Bulan Ini (kecualikan SALDO_AWAL & tampilkan deskripsi tata tertib)
    const tatibDescMap = {};
    readAll_(SHEET.TATA_TERTIB).forEach(t => {
      const kd = String(t.kode || '').trim().toUpperCase();
      if (kd) tatibDescMap[kd] = String(t.deskripsi || '').trim();
    });
    const pelanggaran = poinRows.filter(r =>
      String(r.jenis).toUpperCase() === 'PELANGGARAN' &&
      String(r.pasal || '').trim().toUpperCase() !== 'SALDO_AWAL' &&
      getTanggalBersih_(r.tanggal).slice(0, 7) === bulanIni
    );
    const hitungPasal = {};
    pelanggaran.forEach(r => {
      const kd = String(r.pasal || '-').trim().toUpperCase();
      hitungPasal[kd] = (hitungPasal[kd] || 0) + 1;
    });
    const topPelanggaran = Object.keys(hitungPasal)
      .map(k => ({ pasal: k, deskripsi: tatibDescMap[k] || k, jumlah: hitungPasal[k] }))
      .sort((a, b) => b.jumlah - a.jumlah)
      .slice(0, 5);

    // Kehadiran Guru & Staf Hari Ini
    const guruMap = {};
    let guruPunyaRfid = 0;
    guruAktif.forEach(g => {
      const id = String(g.id_guru || '').trim();
      guruMap[id] = g;
      if (String(g.uid_rfid || '').trim()) guruPunyaRfid++;
    });

    const rekapGuruHariIni = readAll_(SHEET.REKAP_GURU).filter(r => getTanggalBersih_(r.tanggal) === hariIni);
    const guruLogHariIni = readAll_(SHEET.GURU_HADIR).filter(r => getTanggalBersih_(r.tanggal) === hariIni);
    const guruTapMap = {};

    rekapGuruHariIni.forEach(r => {
      const id = String(r.id_guru || '').trim();
      if (!guruMap[id]) return;
      const jm = (r.jam_masuk && r.jam_masuk !== '-') ? formatJamSheet(r.jam_masuk, '') : '';
      const jp = (r.jam_pulang && r.jam_pulang !== '-') ? formatJamSheet(r.jam_pulang, '') : '';
      if (jm) guruTapMap[id] = { jam_masuk: jm, jam_pulang: jp || '-' };
    });

    // Fallback bila PRESENSI_GURU ada tapi belum masuk REKAP_GURU
    guruLogHariIni.forEach(r => {
      const id = String(r.id_guru || '').trim();
      if (!guruMap[id]) return;
      const jm = formatJamSheet(r.jam || r.timestamp, '');
      if (!jm) return;
      if (!guruTapMap[id]) guruTapMap[id] = { jam_masuk: jm, jam_pulang: '-' };
      else if (jm < guruTapMap[id].jam_masuk) guruTapMap[id].jam_masuk = jm;
      else if (jm > guruTapMap[id].jam_masuk && guruTapMap[id].jam_pulang === '-') guruTapMap[id].jam_pulang = jm;
    });

    let guruTepat = 0, guruTelat = 0, guruPulang = 0;
    const guruHadirList = [];
    const guruBelumAbsen = [];

    guruAktif.forEach(g => {
      const id = String(g.id_guru || '').trim();
      const tap = guruTapMap[id];
      if (!tap) {
        guruBelumAbsen.push({
          id_guru: id,
          nama: g.nama,
          role: String(g.role || '-').replace(/,/g, ' · '),
          no_hp: String(g.no_hp || '-')
        });
      } else {
        const parts = tap.jam_masuk.split(':').map(Number);
        const mIn = (parts[0] * 60) + (parts[1] || 0);
        const telatMnt = mIn > batasMasukMenit ? (mIn - batasMasukMenit) : 0;
        if (telatMnt > 0) guruTelat++; else guruTepat++;
        if (tap.jam_pulang && tap.jam_pulang !== '-') guruPulang++;
        guruHadirList.push({
          id_guru: id,
          nama: g.nama,
          role: String(g.role || '-').replace(/,/g, ' · '),
          jam_masuk: tap.jam_masuk,
          jam_pulang: tap.jam_pulang || '-',
          telat_menit: telatMnt
        });
      }
    });
    guruHadirList.sort((a, b) => b.telat_menit - a.telat_menit || String(b.jam_masuk).localeCompare(String(a.jam_masuk)));
    guruBelumAbsen.sort((a, b) => String(a.nama).localeCompare(String(b.nama)));

    const infoBox = {
      total_siswa: siswa.length,
      hadir_gerbang: hadirCount,
      tepat_waktu: Object.keys(tepat).length,
      terlambat: Object.keys(telat).length,
      partisipasi_sholat: siswa.length ? Math.min(100, Math.round((sholatUnikSet.size / siswa.length) * 100)) : 0,
      sholat_unik: sholatUnikSet.size,
      sholat_scan: sholatHariIni.length,
      udzur_aktif: udzurSet.size,
      zona_merah: zonasi.merah + zonasi.kritis,
      zona_perhatian: zonasi.kuning + zonasi.oranye + zonasi.merah + zonasi.kritis,
      siswa_punya_rfid: siswaPunyaRfid,
      siswa_tanpa_rfid: Math.max(0, siswa.length - siswaPunyaRfid),
      guru_tanpa_rfid: Math.max(0, guruAktif.length - guruPunyaRfid)
    };

    const ketepatan = {
      tepat_waktu: Object.keys(tepat).length,
      terlambat: Object.keys(telat).length,
      izin_sakit_alpa: ketBelumTap,
      belum_hadir: belumHadirCount,
      tidak_hadir: Math.max(0, siswa.length - hadirCount)
    };

    return {
      ok: true,
      data: {
        info_box: infoBox,
        top_pelanggaran: topPelanggaran,
        zonasi: zonasi,
        ketepatan: ketepatan,
        rapor_kelas: raporKelas,
        guru_ringkasan: {
          total: guruAktif.length,
          hadir: guruHadirList.length,
          tepat_waktu: guruTepat,
          terlambat: guruTelat,
          pulang: guruPulang,
          belum_absen: guruBelumAbsen.length,
          batas_masuk: String(Math.floor(batasMasukMenit / 60)).padStart(2, '0') + ':' + String(batasMasukMenit % 60).padStart(2, '0')
        },
        guru_belum_absen: guruBelumAbsen,
        guru_hadir_list: guruHadirList,
        siswa_zona_prioritas: prioritasList.slice(0, 15),
        siswa_terlambat: siswaTerlambat.slice(0, 25),
        keterangan_hari_ini: {
          izin: jmlIzin,
          sakit: jmlSakit,
          alpa: jmlAlpa,
          total: keteranganList.length,
          list: keteranganList
        },
        updated_at: nowStr_()
      }
    };
  } catch (err) { return { ok: false, message: err.message }; }
}

// --- SISWA & KELAS ---
function getMasterSiswa_(token, p) { try { verifikasiToken_(token); return { ok: true, data: readAll_(SHEET.SISWA) }; } catch (err) { return { ok: false, message: err.message }; } }
function tambahSiswa_(token, p) {
  try {
    verifikasiToken_(token);
    const nis = String(p.nis || '').trim();
    const nama = String(p.nama || '').trim();
    const kelas = String(p.kelas || '').trim();
    if (!nis || !nama || !kelas) return { ok: false, message: 'NIS, Nama, dan Kelas wajib diisi.' };
    if (readAll_(SHEET.SISWA).some(s => String(s.nis).trim() === nis)) {
      return { ok: false, message: 'NIS "' + nis + '" sudah terdaftar.' };
    }
    if (p.no_hp_ortu) {
      const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      const sh = getOrCreateSheet_(ss, SHEET.SISWA);
      ensureColumn_(sh, SHEET.SISWA, 'no_hp_ortu');
    }
    appendRow_(SHEET.SISWA, Object.assign({}, p, { nis: nis, nama: nama, kelas: kelas, no_hp_ortu: String(p.no_hp_ortu || '').trim() }), ['nis', 'uid_rfid', 'no_hp_ortu']);
    return { ok: true, message: 'Siswa ditambahkan.' };
  } catch (e) { return { ok: false, message: e.message }; }
}
function editSiswa_(token, p) {
  try {
    verifikasiToken_(token);
    const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET.SISWA);
    if (p.no_hp_ortu !== undefined && String(p.no_hp_ortu).trim() !== '') {
      ensureColumn_(sh, SHEET.SISWA, 'no_hp_ortu');
    }
    const headers = ensureHeaders_(sh, SHEET.SISWA).map(h => String(h).trim().toLowerCase());
    const d = sh.getDataRange().getValues();
    const iNis = headers.indexOf('nis');
    const iNama = headers.indexOf('nama');
    const iKelas = headers.indexOf('kelas');
    const iJk = headers.indexOf('jk');
    const iStatus = headers.indexOf('status');
    const iCatatan = headers.indexOf('catatan');
    const iWa = headers.indexOf('no_hp_ortu');
    for (let i = 1; i < d.length; i++) {
      if (String(d[i][iNis !== -1 ? iNis : 0]).trim() === String(p.nis).trim()) {
        while (d[i].length < headers.length) d[i].push('');
        if (iNama !== -1) d[i][iNama] = p.nama;
        if (iKelas !== -1) d[i][iKelas] = p.kelas;
        if (iJk !== -1) d[i][iJk] = p.jk;
        if (iStatus !== -1) d[i][iStatus] = p.status;
        if (iCatatan !== -1 && p.catatan !== undefined) d[i][iCatatan] = p.catatan;
        if (iWa !== -1 && p.no_hp_ortu !== undefined) {
          sh.getRange(i + 1, iWa + 1).setNumberFormat('@');
          d[i][iWa] = String(p.no_hp_ortu || '').trim();
        }
        sh.getRange(i + 1, 1, 1, headers.length).setValues([d[i]]);
        break;
      }
    }
    return { ok: true, message: 'Siswa diperbarui.' };
  } catch (e) { return { ok: false, message: e.message }; }
}
function simpanNoWaOrtu_(token, p) {
  try {
    const sesi = verifikasiToken_(token);
    const roles = String(sesi.role || '').toUpperCase().split(',').map(r => r.trim());
    const boleh = ['SUPER_ADMIN', 'GURU_BK', 'WAKA_KESISWAAN', 'WALI_KELAS', 'KEPSEK'].some(r => roles.includes(r));
    if (!boleh) return { ok: false, message: 'Tidak punya akses mengubah nomor WA orang tua.' };
    const nis = String(p.nis || '').trim();
    const noWa = String(p.no_hp_ortu || '').trim();
    if (!nis) return { ok: false, message: 'NIS wajib diisi.' };
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = getOrCreateSheet_(ss, SHEET.SISWA);
    const colInfo = ensureColumn_(sh, SHEET.SISWA, 'no_hp_ortu');
    const headers = colInfo.headers.map(h => String(h).trim().toLowerCase());
    const iNis = headers.indexOf('nis');
    const iWa = colInfo.idx;
    const d = sh.getDataRange().getValues();
    for (let i = 1; i < d.length; i++) {
      if (String(d[i][iNis !== -1 ? iNis : 0]).trim() === nis) {
        sh.getRange(i + 1, iWa + 1).setNumberFormat('@').setValue(noWa);
        return { ok: true, message: 'Nomor WA orang tua tersimpan.', data: { nis: nis, no_hp_ortu: noWa } };
      }
    }
    return { ok: false, message: 'Siswa dengan NIS ' + nis + ' tidak ditemukan.' };
  } catch (e) { return { ok: false, message: e.message }; }
}
function hapusSiswa_(token, p) {
  try {
    verifikasiToken_(token);
    const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET.SISWA);
    const d = sh.getDataRange().getValues();
    if (d.length < 2) return { ok: false, message: 'Siswa tidak ditemukan.' };
    const headers = ensureHeaders_(sh, SHEET.SISWA).map(h => String(h).trim().toLowerCase());
    const iNis = headers.indexOf('nis');
    for (let i = 1; i < d.length; i++) {
      if (String(d[i][iNis !== -1 ? iNis : 0]).trim() === String(p.nis || '').trim()) {
        sh.deleteRow(i + 1);
        return { ok: true, message: 'Siswa dihapus.' };
      }
    }
    return { ok: false, message: 'Siswa tidak ditemukan.' };
  } catch (e) { return { ok: false, message: e.message }; }
}
function getSiswaTanpaRfid_(token) {
  try {
    verifikasiToken_(token);
    return {
      ok: true,
      data: readAll_(SHEET.SISWA).filter(s => isAktifStatus_(s.status) && !String(s.uid_rfid || '').trim())
    };
  } catch (e) { return { ok: false, message: e.message }; }
}
function daftarRfid_(token, p) {
  try {
    verifikasiToken_(token);
    const nis = String(p.nis || '').trim();
    const uid = normalisasiUid_(p.uid_rfid);
    if (!nis || !uid) return { ok: false, message: 'NIS dan UID RFID wajib diisi.' };

    const dupeSiswa = readAll_(SHEET.SISWA).find(s => String(s.nis).trim() !== nis && normalisasiUid_(s.uid_rfid) === uid);
    if (dupeSiswa) return { ok: false, message: 'Kartu RFID ini sudah terdaftar atas nama siswa ' + dupeSiswa.nama + ' (' + dupeSiswa.nis + ').' };
    const dupeGuru = readAll_(SHEET.GURU).find(g => normalisasiUid_(g.uid_rfid) === uid);
    if (dupeGuru) return { ok: false, message: 'Kartu RFID ini sudah terdaftar atas nama guru ' + dupeGuru.nama + ' (' + dupeGuru.id_guru + ').' };

    const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET.SISWA);
    const d = sh.getDataRange().getValues();
    const headers = ensureHeaders_(sh, SHEET.SISWA).map(h => String(h).trim().toLowerCase());
    const iNis = headers.indexOf('nis');
    const idxUid = headers.indexOf('uid_rfid');
    if (idxUid === -1) return { ok: false, message: 'Kolom uid_rfid tidak ditemukan.' };
    for (let i = 1; i < d.length; i++) {
      if (String(d[i][iNis !== -1 ? iNis : 0]).trim() === nis) {
        d[i][idxUid] = uid;
        sh.getRange(i + 1, idxUid + 1).setNumberFormat('@');
        sh.getRange(i + 1, 1, 1, headers.length).setValues([d[i]]);
        return { ok: true, message: 'Kartu didaftarkan.' };
      }
    }
    return { ok: false, message: 'Siswa tidak ditemukan.' };
  } catch (e) { return { ok: false, message: e.message }; }
}
function getMasterKelas_(token) { try { verifikasiToken_(token); return { ok: true, data: readAll_(SHEET.KELAS) }; } catch (err) { return { ok: false, message: err.message }; } }
function tambahKelas_(token, p) {
  try {
    verifikasiToken_(token);
    const idKelas = String(p.id_kelas || '').trim();
    const namaKelas = String(p.nama_kelas || '').trim();
    if (!idKelas || !namaKelas) return { ok: false, message: 'ID Kelas dan Nama Kelas wajib diisi.' };
    if (readAll_(SHEET.KELAS).some(k => String(k.id_kelas).trim() === idKelas)) {
      return { ok: false, message: 'ID Kelas "' + idKelas + '" sudah terdaftar.' };
    }
    appendRow_(SHEET.KELAS, { id_kelas: idKelas, nama_kelas: namaKelas, tingkat: p.tingkat, jurusan: p.jurusan, wali_kelas: p.wali_kelas, status: 'AKTIF' });
    return { ok: true, message: 'Kelas ditambahkan.' };
  } catch (err) { return { ok: false, message: err.message }; }
}
function editKelas_(token, p) {
  try {
    verifikasiToken_(token);
    const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET.KELAS);
    const d = sh.getDataRange().getValues();
    if (d.length < 2) return { ok: false, message: 'Data kelas kosong.' };
    const headers = ensureHeaders_(sh, SHEET.KELAS).map(h => String(h).trim().toLowerCase());
    const iId = headers.indexOf('id_kelas');
    const iNama = headers.indexOf('nama_kelas');
    const iTingkat = headers.indexOf('tingkat');
    const iJurusan = headers.indexOf('jurusan');
    const iWali = headers.indexOf('wali_kelas');
    const targetId = String(p.id_kelas || '').trim();
    for (let i = 1; i < d.length; i++) {
      if (String(d[i][iId !== -1 ? iId : 0]).trim() === targetId) {
        if (iNama !== -1) d[i][iNama] = p.nama_kelas;
        if (iTingkat !== -1) d[i][iTingkat] = p.tingkat;
        if (iJurusan !== -1) d[i][iJurusan] = p.jurusan;
        if (iWali !== -1) d[i][iWali] = p.wali_kelas;
        sh.getRange(i + 1, 1, 1, headers.length).setValues([d[i]]);
        return { ok: true, message: 'Kelas diperbarui.' };
      }
    }
    return { ok: false, message: 'ID Kelas tidak ditemukan.' };
  } catch (e) { return { ok: false, message: e.message }; }
}
function hapusKelas_(token, p) {
  try {
    verifikasiToken_(token);
    const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET.KELAS);
    const d = sh.getDataRange().getValues();
    if (d.length < 2) return { ok: false, message: 'Kelas tidak ditemukan.' };
    const headers = ensureHeaders_(sh, SHEET.KELAS).map(h => String(h).trim().toLowerCase());
    const iId = headers.indexOf('id_kelas');
    for (let i = 1; i < d.length; i++) {
      if (String(d[i][iId !== -1 ? iId : 0]).trim() === String(p.id_kelas || '').trim()) {
        sh.deleteRow(i + 1);
        return { ok: true, message: 'Kelas dihapus.' };
      }
    }
    return { ok: false, message: 'Kelas tidak ditemukan.' };
  } catch (e) { return { ok: false, message: e.message }; }
}
function getSiswaPerKelas_(token, p) {
  try {
    verifikasiToken_(token);
    return { ok: true, data: readAll_(SHEET.SISWA).filter(s => String(s.kelas).trim() === String(p.kelas || '').trim() && isAktifStatus_(s.status)) };
  } catch (err) { return { ok: false, message: err.message }; }
}
function prosesNaikKelas_(token, p) {
  try {
    verifikasiToken_(token);
    const nisList = Array.isArray(p.nisList) ? p.nisList : [];
    const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET.SISWA);
    const data = sh.getDataRange().getValues();
    const headers = ensureHeaders_(sh, SHEET.SISWA).map(h => String(h).trim().toLowerCase());
    const idxNis = headers.indexOf('nis');
    const idxKelas = headers.indexOf('kelas');
    if (idxKelas === -1) return { ok: false, message: 'Kolom kelas tidak ditemukan.' };
    let count = 0;
    nisList.forEach(nis => {
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][idxNis !== -1 ? idxNis : 0]).trim() === String(nis).trim()) {
          data[i][idxKelas] = p.kelasTujuan;
          sh.getRange(i + 1, 1, 1, headers.length).setValues([data[i]]);
          count++;
          break;
        }
      }
    });
    return { ok: true, message: count + ' siswa berhasil dinaikkan ke ' + p.kelasTujuan };
  } catch (err) { return { ok: false, message: err.message }; }
}
function prosesLulus_(token, p) {
  try {
    verifikasiToken_(token);
    const nisList = Array.isArray(p.nisList) ? p.nisList : [];
    const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET.SISWA);
    const data = sh.getDataRange().getValues();
    const headers = ensureHeaders_(sh, SHEET.SISWA).map(h => String(h).trim().toLowerCase());
    const idxNis = headers.indexOf('nis');
    const idxStatus = headers.indexOf('status');
    if (idxStatus === -1) return { ok: false, message: 'Kolom status tidak ditemukan.' };
    let count = 0;
    nisList.forEach(nis => {
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][idxNis !== -1 ? idxNis : 0]).trim() === String(nis).trim()) {
          data[i][idxStatus] = 'LULUS';
          sh.getRange(i + 1, 1, 1, headers.length).setValues([data[i]]);
          count++;
          break;
        }
      }
    });
    return { ok: true, message: count + ' siswa berhasil diluluskan.' };
  } catch (err) { return { ok: false, message: err.message }; }
}
function getTataTertib_(token) {
  try {
    const sesi = verifikasiToken_(token);
    let rows = readAll_(SHEET.TATA_TERTIB);
    if (isOsisOnly_(sesi.role)) {
      rows = rows.filter(t => String(t.jenis || '').trim().toUpperCase() === 'PELANGGARAN' && String(t.aktif || 'YA').trim().toUpperCase() === 'YA');
    }
    return { ok: true, data: rows };
  } catch (err) { return { ok: false, message: err.message }; }
}
function tambahTataTertib_(token, p) {
  try {
    verifikasiToken_(token);
    const kode = String(p.kode || '').trim().toUpperCase();
    if (!kode || !String(p.deskripsi || '').trim()) return { ok: false, message: 'Kode dan deskripsi wajib diisi.' };
    const existing = readAll_(SHEET.TATA_TERTIB).find(t => String(t.kode).trim().toUpperCase() === kode);
    if (existing) return { ok: false, message: 'Kode tata tertib "' + kode + '" sudah ada.' };
    const aktifVal = String(p.aktif || 'YA').trim().toUpperCase();
    const obj = {
      kode: kode,
      kategori: String(p.kategori || '').trim().toUpperCase(),
      deskripsi: String(p.deskripsi || '').trim(),
      poin: Math.abs(Number(p.poin) || 0),
      jenis: String(p.jenis || 'PELANGGARAN').trim().toUpperCase() === 'PRESTASI' ? 'PRESTASI' : 'PELANGGARAN',
      aktif: (aktifVal === 'TIDAK' || aktifVal === 'NONAKTIF') ? 'TIDAK' : 'YA'
    };
    appendRow_(SHEET.TATA_TERTIB, obj);
    return { ok: true, message: 'Tatib ditambahkan.' };
  } catch (err) { return { ok: false, message: err.message }; }
}
function editTataTertib_(token, p) {
  try {
    verifikasiToken_(token);
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = getOrCreateSheet_(ss, SHEET.TATA_TERTIB);
    const d = sh.getDataRange().getValues();
    if (d.length < 2) return { ok: false, message: 'Data kosong.' };
    const headers = ensureHeaders_(sh, SHEET.TATA_TERTIB).map(h => String(h).trim().toLowerCase());
    const iKode = headers.indexOf('kode');
    const iKat = headers.indexOf('kategori');
    const iDesk = headers.indexOf('deskripsi');
    const iPoin = headers.indexOf('poin');
    const iJenis = headers.indexOf('jenis');
    const iAktif = headers.indexOf('aktif');
    const targetKode = String(p.kode || '').trim().toUpperCase();
    const aktifVal = String(p.aktif || 'YA').trim().toUpperCase();
    for (let i = 1; i < d.length; i++) {
      if (String(d[i][iKode !== -1 ? iKode : 0]).trim().toUpperCase() === targetKode) {
        if (iKat !== -1) d[i][iKat] = String(p.kategori || '').trim().toUpperCase();
        if (iDesk !== -1) d[i][iDesk] = String(p.deskripsi || '').trim();
        if (iPoin !== -1) d[i][iPoin] = Math.abs(Number(p.poin) || 0);
        if (iJenis !== -1) d[i][iJenis] = String(p.jenis || 'PELANGGARAN').trim().toUpperCase() === 'PRESTASI' ? 'PRESTASI' : 'PELANGGARAN';
        if (iAktif !== -1) d[i][iAktif] = (aktifVal === 'TIDAK' || aktifVal === 'NONAKTIF') ? 'TIDAK' : 'YA';
        sh.getRange(i + 1, 1, 1, headers.length).setValues([d[i]]);
        return { ok: true, message: 'Tatib diperbarui.' };
      }
    }
    return { ok: false, message: 'Kode tatib tidak ditemukan.' };
  } catch (e) { return { ok: false, message: e.message }; }
}
function hapusTataTertib_(token, p) { try { verifikasiToken_(token); const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET.TATA_TERTIB); const d = sh.getDataRange().getValues(); for (let i = 1; i < d.length; i++) { if (String(d[i][0]).trim().toUpperCase() === String(p.kode).trim().toUpperCase()) { sh.deleteRow(i + 1); break; } } return { ok: true, message: 'Tatib dihapus.' }; } catch (e) { return { ok: false, message: e.message }; } }
function getDaftarKelas_(token) { try { verifikasiToken_(token); return { ok: true, data: readAll_(SHEET.KELAS).map(k => k.nama_kelas) }; } catch (e) { return { ok: false, message: e.message }; } }
function getKartuKelas_(token, p) { try { verifikasiToken_(token); return { ok: true, data: readAll_(SHEET.SISWA).filter(s => s.kelas === p.kelas), sekolah: 'SMK Bhakti Kencana Ciawi' }; } catch (e) { return { ok: false, message: e.message }; } }

function getPengaturan_(token) {
  try {
    let sesi = null;
    if (token) sesi = verifikasiToken_(token);
    const m = {};
    const data = readAll_(SHEET.PENGATURAN);
    data.forEach(r => {
      let val = r.nilai;
      const kunci = String(r.kunci).toLowerCase();
      if (kunci.includes('jam_') || kunci.includes('toleransi')) {
        if (val instanceof Date) {
          if (kunci.includes('toleransi')) val = '0';
          else val = Utilities.formatDate(val, TZ, 'HH:mm');
        }
        else if (typeof val === 'number' && !kunci.includes('toleransi')) {
          if (val >= 0 && val < 1) {
            const totalMin = Math.round(val * 1440) % 1440;
            val = String(Math.floor(totalMin / 60)).padStart(2, '0') + ':' + String(totalMin % 60).padStart(2, '0');
          } else {
            const jam = Math.floor(val);
            const menit = Math.round((val - jam) * 60);
            val = String(jam).padStart(2, '0') + ':' + String(menit).padStart(2, '0');
          }
        }
        else if (val) {
          let str = String(val).replace('.', ':');
          if (/^\d{1,2}:\d{2}/.test(str)) {
            const parts = str.split(':');
            val = parts[0].padStart(2, '0') + ':' + parts[1].substring(0, 2);
          }
        }
      }
      m[r.kunci] = val;
    });
    // Lindungi token Bot Telegram agar hanya dapat dilihat oleh role Admin (SUPER_ADMIN/KEPSEK/BK/WAKASIS)
    if (token && sesi && !isAdminRole_(sesi.role)) {
      delete m.tg_bot_token;
    }
    return { ok: true, data: m };
  } catch (e) { return { ok: false, message: e.message }; }
}

function simpanPengaturan_(token, p) {
  try {
    verifikasiToken_(token);
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = getOrCreateSheet_(ss, SHEET.PENGATURAN);
    const d = sh.getDataRange().getValues();
    for (let k in p) {
      let f = false;
      const valToSave = p[k];
      for (let i = 1; i < d.length; i++) {
        if (String(d[i][0]).trim() === String(k).trim()) {
          const cell = sh.getRange(i + 1, 2);
          cell.setNumberFormat('@');
          cell.setValue(valToSave);
          f = true; break;
        }
      }
      if (!f) {
        const nextRow = sh.getLastRow() + 1;
        sh.getRange(nextRow, 2).setNumberFormat('@');
        sh.getRange(nextRow, 1, 1, 3).setValues([[k, valToSave, '']]);
      }
    }
    return { ok: true, message: 'Disimpan.' };
  } catch (e) { return { ok: false, message: e.message }; }
}

function getRulePotongTerlambat_(setting, tatibList) {
  const s = setting || {};
  if (String(s.auto_potong_terlambat || 'TIDAK').trim().toUpperCase() !== 'YA') return null;
  const list = Array.isArray(tatibList) ? tatibList : readAll_(SHEET.TATA_TERTIB);
  const kodeCfg = String(s.pasal_terlambat_kode || '').trim().toUpperCase();
  const isAktifPelanggaran = t =>
    String(t.jenis || 'PELANGGARAN').trim().toUpperCase() === 'PELANGGARAN' &&
    String(t.aktif || 'YA').trim().toUpperCase() === 'YA';

  let rule = kodeCfg ? list.find(t => String(t.kode || '').trim().toUpperCase() === kodeCfg && isAktifPelanggaran(t)) : null;
  if (!rule) {
    rule = list.find(t => String(t.kode || '').trim().toUpperCase() === 'TT-TELAT' && isAktifPelanggaran(t)) ||
           list.find(t => String(t.kategori || '').trim().toUpperCase() === 'KETERLAMBATAN' && isAktifPelanggaran(t));
  }
  if (!rule) return null;
  const poinVal = Math.abs(Number(rule.poin) || 0);
  if (poinVal <= 0) return null;
  return { kode: String(rule.kode).trim().toUpperCase(), deskripsi: String(rule.deskripsi || 'Terlambat masuk gerbang'), poin: poinVal };
}

function simpanPengaturanTerlambat_(token, p) {
  try {
    const sesi = verifikasiToken_(token);
    if (!isAdminRole_(sesi.role)) {
      return { ok: false, message: 'Hanya Admin / Guru BK / Waka Kesiswaan / Kepsek yang berhak mengubah aturan poin terlambat.' };
    }
    const aktif = String(p.aktif || 'TIDAK').trim().toUpperCase() === 'YA' ? 'YA' : 'TIDAK';
    let kode = String(p.kode || '').trim().toUpperCase();
    const poin = Math.abs(parseInt(p.poin, 10) || 0);
    const deskripsi = String(p.deskripsi || '').trim() || 'Terlambat masuk gerbang sekolah';

    if (aktif === 'YA' && poin <= 0) {
      return { ok: false, message: 'Jumlah poin potongan terlambat harus lebih dari 0 saat fitur aktif.' };
    }
    if (!kode) kode = 'TT-TELAT';

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const shTatib = getOrCreateSheet_(ss, SHEET.TATA_TERTIB);
    const dTatib = shTatib.getDataRange().getValues();
    const hTatib = ensureHeaders_(shTatib, SHEET.TATA_TERTIB).map(h => String(h).trim().toLowerCase());
    const iKode = hTatib.indexOf('kode');
    const iKat = hTatib.indexOf('kategori');
    const iDesk = hTatib.indexOf('deskripsi');
    const iPoin = hTatib.indexOf('poin');
    const iJenis = hTatib.indexOf('jenis');
    const iAktif = hTatib.indexOf('aktif');

    let foundTatib = false;
    for (let i = 1; i < dTatib.length; i++) {
      if (String(dTatib[i][iKode !== -1 ? iKode : 0] || '').trim().toUpperCase() === kode) {
        if (iPoin !== -1) dTatib[i][iPoin] = poin;
        if (iJenis !== -1) dTatib[i][iJenis] = 'PELANGGARAN';
        if (aktif === 'YA' && iAktif !== -1) dTatib[i][iAktif] = 'YA';
        if (p.deskripsi && iDesk !== -1) dTatib[i][iDesk] = deskripsi;
        shTatib.getRange(i + 1, 1, 1, hTatib.length).setValues([dTatib[i]]);
        foundTatib = true;
        break;
      }
    }
    if (!foundTatib) {
      appendRow_(SHEET.TATA_TERTIB, {
        kode: kode,
        kategori: 'KETERLAMBATAN',
        deskripsi: deskripsi,
        poin: poin,
        jenis: 'PELANGGARAN',
        aktif: 'YA'
      });
    }

    simpanPengaturan_(token, {
      auto_potong_terlambat: aktif,
      pasal_terlambat_kode: kode
    });

    catatAudit_({
      id_guru: sesi.id_guru,
      nama_guru: sesi.nama,
      aksi: 'PENGATURAN_TERLAMBAT',
      modul: 'admin',
      detail: `Auto potong terlambat: ${aktif}, Pasal ${kode} (-${poin} poin)`
    });

    return {
      ok: true,
      message: aktif === 'YA'
        ? `Pemotongan poin terlambat otomatis AKTIF (${kode}: -${poin} poin).`
        : `Pemotongan poin terlambat otomatis NONAKTIF (poin pasal ${kode} tetap disimpan: -${poin}).`,
      data: { auto_potong_terlambat: aktif, pasal_terlambat_kode: kode, poin: poin }
    };
  } catch (e) { return { ok: false, message: e.message }; }
}

function terapkanPotongTerlambatSatuan_(setting, siswa, tgl, jamTap, petugasNama) {
  try {
    const tatibList = readAll_(SHEET.TATA_TERTIB);
    const rule = getRulePotongTerlambat_(setting, tatibList);
    if (!rule) return 0;
    const nis = String(siswa.nis || '').trim();
    const poinSah = readAll_(SHEET.POIN).filter(r => String(r.nis).trim() === nis && isPoinSah_(r));
    const sudahAda = poinSah.some(r =>
      getTanggalBersih_(r.tanggal) === tgl &&
      String(r.pasal || '').trim().toUpperCase() === rule.kode
    );
    if (sudahAda) return 0;
    const poinAwal = Number((setting || {}).poin_awal) || 100;
    let saldo = poinAwal;
    poinSah.forEach(r => { saldo += (Number(r.poin) || 0); });
    const potong = -Math.abs(rule.poin);
    const saldoSetelah = saldo + potong;
    appendRow_(SHEET.POIN, {
      id_poin: makeId_('PON'),
      timestamp: nowStr_(),
      tanggal: tgl,
      nis: nis,
      nama: siswa.nama,
      kelas: siswa.kelas,
      jenis: 'PELANGGARAN',
      pasal: rule.kode,
      deskripsi: 'Terlambat masuk gerbang pukul ' + jamTap + ' WIB (otomatis)',
      poin: potong,
      saldo_setelah: saldoSetelah,
      petugas: 'Sistem Gerbang (' + petugasNama + ')',
      divalidasi: 'YA'
    }, ['tanggal', 'nis']);
    notifTelegramZonaPoin_(setting, siswa, saldo, saldoSetelah, rule.kode, 'Terlambat masuk gerbang pukul ' + jamTap + ' WIB', 'Sistem Gerbang');
    return potong;
  } catch (_) { return 0; }
}

function getJadwalSholat_(token) { try { verifikasiToken_(token); const s = getPengaturan_(token).data; return { ok: true, data: { subuh: s.jam_subuh || '04:30', dzuhur: s.jam_dzuhur || '12:00', ashar: s.jam_ashar || '15:15', maghrib: s.jam_maghrib || '18:00', isya: s.jam_isya || '19:15' } }; } catch (e) { return { ok: false, message: e.message }; } }

// --- IMPORT & RAPORT ---
function normalisasiHeader_(h) {
  const map = { 'nis': 'nis', 'nomor induk siswa': 'nis', 'nomor induk': 'nis', 'no induk': 'nis', 'nama': 'nama', 'nama siswa': 'nama', 'nama lengkap': 'nama', 'nama_lengkap': 'nama', 'kelas': 'kelas', 'rombel': 'kelas', 'jk': 'jk', 'jenis kelamin': 'jk', 'jenis_kelamin': 'jk', 'gender': 'jk', 'status': 'status', 'keterangan': 'status', 'uid_rfid': 'uid_rfid', 'rfid': 'uid_rfid', 'uid': 'uid_rfid', 'kartu': 'uid_rfid', 'no kartu': 'uid_rfid', 'foto_url': 'foto_url', 'foto': 'foto_url', 'url foto': 'foto_url', 'tgl_daftar': 'tgl_daftar', 'tanggal daftar': 'tgl_daftar', 'tgl daftar': 'tgl_daftar', 'catatan': 'catatan', 'keterangan tambahan': 'catatan', 'no hp ortu': 'no_hp_ortu', 'no wa ortu': 'no_hp_ortu', 'no wa': 'no_hp_ortu', 'wa ortu': 'no_hp_ortu', 'hp ortu': 'no_hp_ortu', 'whatsapp': 'no_hp_ortu', 'wa': 'no_hp_ortu', 'telepon ortu': 'no_hp_ortu', 'id_guru': 'id_guru', 'id guru': 'id_guru', 'id': 'id_guru', 'kode guru': 'id_guru', 'nama guru': 'nama', 'pin': 'pin', 'password': 'pin', 'role': 'role', 'jabatan': 'role', 'peran': 'role', 'no_hp': 'no_hp', 'no hp': 'no_hp', 'telepon': 'no_hp', 'hp': 'no_hp', 'kode': 'kode', 'kode tatib': 'kode', 'kategori': 'kategori', 'kategori pelanggaran': 'kategori', 'deskripsi': 'deskripsi', 'uraian': 'deskripsi', 'poin': 'poin', 'nilai poin': 'poin', 'jenis': 'jenis', 'tipe': 'jenis', 'aktif': 'aktif', 'status aktif': 'aktif', 'sisa_poin': 'sisa_poin', 'sisa poin': 'sisa_poin', 'sisa': 'sisa_poin', 'saldo': 'sisa_poin', 'saldo_poin': 'sisa_poin', 'saldo poin': 'sisa_poin', 'saldo_awal': 'sisa_poin', 'saldo awal': 'sisa_poin', 'poin akhir': 'sisa_poin', 'poin_akhir': 'sisa_poin', 'alasan': 'catatan' };
  const key = String(h || '').trim().toLowerCase().replace(/[_]/g, ' ').replace(/\s+/g, ' ');
  return map[key] || null;
}
function normalisasiRole_(v) {
  if (!v) return '';
  const list = String(v).toUpperCase().split(',').map(r => r.trim()).filter(Boolean);
  const valid = ['SUPER_ADMIN', 'KEPSEK', 'GURU_BK', 'WAKA_KESISWAAN', 'GURU_PIKET', 'WALI_KELAS', 'PETUGAS_OSIS'];
  const hasil = list.map(r => {
    const normalized = r.replace(/\s+/g, '_');
    return valid.includes(normalized) ? normalized : null;
  });
  if (hasil.some(h => h === null)) return null;
  return hasil.join(',');
}
function normalisasiJenis_(v) {
  const s = String(v || '').trim().toUpperCase();
  if (['PELANGGARAN', 'PRESTASI'].includes(s)) return s;
  return null;
}

function importSiswa_(token, payload) {
  try {
    verifikasiToken_(token);
    const rows = payload.rows || [];
    if (!rows.length) return { ok: false, message: 'Tidak ada baris untuk diimport.' };
    const kelasSet = new Set(readAll_(SHEET.KELAS).map(k => String(k.nama_kelas || '').trim()).filter(Boolean));
    const siswaLama = new Map(readAll_(SHEET.SISWA).map(s => [String(s.nis || '').trim(), s]));
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = getOrCreateSheet_(ss, SHEET.SISWA);
    const headers = ensureHeaders_(sh, SHEET.SISWA);
    let berhasil = 0, gagal = 0;
    const detailError = [], detailPeringatan = [];
    const barisBaru = [];
    rows.forEach((row, i) => {
      const nomor = i + 2;
      const mapped = {};
      Object.keys(row).forEach(k => { const norm = normalisasiHeader_(k); if (norm) mapped[norm] = row[k]; });
      const nis = String(mapped.nis || '').trim();
      const nama = String(mapped.nama || '').trim();
      const kelas = String(mapped.kelas || '').trim();
      if (!nis) { gagal++; detailError.push({ baris: nomor, alasan: 'NIS kosong' }); return; }
      if (!nama) { gagal++; detailError.push({ baris: nomor, alasan: 'Nama kosong' }); return; }
      if (!kelas) { gagal++; detailError.push({ baris: nomor, alasan: 'Kelas kosong' }); return; }
      if (!kelasSet.has(kelas)) detailPeringatan.push(`Baris ${nomor}: kelas "${kelas}" belum ada di MASTER_KELAS.`);
      const obj = { nis: nis, nama: nama, kelas: kelas, jk: String(mapped.jk || '').trim().toUpperCase() || '-', status: String(mapped.status || 'AKTIF').trim().toUpperCase(), uid_rfid: normalisasiUid_(mapped.uid_rfid || ''), foto_url: String(mapped.foto_url || '').trim(), tgl_daftar: String(mapped.tgl_daftar || '').trim(), catatan: String(mapped.catatan || '').trim(), no_hp_ortu: String(mapped.no_hp_ortu || mapped.no_hp || '').trim() };
      if (['AKTIF', 'LULUS', 'KELUAR'].indexOf(obj.status) === -1) obj.status = 'AKTIF';
      if (siswaLama.has(nis)) { gagal++; detailError.push({ baris: nomor, alasan: `NIS ${nis} sudah ada.` }); } else { barisBaru.push(obj); berhasil++; }
    });
    if (barisBaru.length) {
      if (barisBaru.some(x => x.no_hp_ortu)) ensureColumn_(sh, SHEET.SISWA, 'no_hp_ortu');
      appendRowsObjects_(SHEET.SISWA, barisBaru, ['nis', 'uid_rfid', 'no_hp_ortu']);
    }
    catatAudit_({ id_guru: '', nama_guru: '', aksi: 'IMPORT_SISWA', modul: 'admin', detail: `${berhasil} baru, ${gagal} dilewati` });
    return { ok: true, message: `Import selesai: ${berhasil} baru, ${gagal} dilewati.`, data: { berhasil, gagal, diperbarui: 0, detail_error: detailError, detail_peringatan: detailPeringatan } };
  } catch (e) { return { ok: false, message: 'Import siswa gagal: ' + e.message }; }
}

function importGuru_(token, payload) {
  try {
    verifikasiToken_(token);
    const rows = payload.rows || [];
    if (!rows.length) return { ok: false, message: 'Tidak ada baris.' };
    const guruLama = new Map(readAll_(SHEET.GURU).map(g => [String(g.id_guru || '').trim(), g]));
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = getOrCreateSheet_(ss, SHEET.GURU);
    ensureHeaders_(sh, SHEET.GURU);
    let berhasil = 0, gagal = 0;
    const detailError = [];
    const barisBaru = [];
    rows.forEach((row, i) => {
      const nomor = i + 2;
      const mapped = {};
      Object.keys(row).forEach(k => { const norm = normalisasiHeader_(k); if (norm) mapped[norm] = row[k]; });
      const id_guru = String(mapped.id_guru || '').trim();
      const nama = String(mapped.nama || '').trim();
      if (!id_guru) { gagal++; detailError.push({ baris: nomor, alasan: 'ID Guru kosong' }); return; }
      if (!nama) { gagal++; detailError.push({ baris: nomor, alasan: 'Nama Guru kosong' }); return; }
      const roleNorm = normalisasiRole_(mapped.role);
      if (roleNorm === null) { gagal++; detailError.push({ baris: nomor, alasan: 'Role tidak valid.' }); return; }
      const obj = { id_guru: id_guru, nama: nama, pin: String(mapped.pin || '').trim() || '123456', role: roleNorm || 'GURU_PIKET', status: String(mapped.status || 'AKTIF').trim().toUpperCase(), no_hp: String(mapped.no_hp || '').trim(), uid_rfid: normalisasiUid_(mapped.uid_rfid || '') };
      if (['AKTIF', 'NONAKTIF'].indexOf(obj.status) === -1) obj.status = 'AKTIF';
      if (guruLama.has(id_guru)) { gagal++; detailError.push({ baris: nomor, alasan: `ID Guru ${id_guru} sudah ada.` }); } else { barisBaru.push(obj); berhasil++; }
    });
    if (barisBaru.length) {
      appendRowsObjects_(SHEET.GURU, barisBaru, ['id_guru', 'pin', 'no_hp', 'uid_rfid']);
    }
    catatAudit_({ id_guru: '', nama_guru: '', aksi: 'IMPORT_GURU', modul: 'admin', detail: `${berhasil} baru, ${gagal} dilewati` });
    return { ok: true, message: `Import selesai: ${berhasil} baru, ${gagal} dilewati.`, data: { berhasil, gagal, diperbarui: 0, detail_error: detailError, detail_peringatan: [] } };
  } catch (e) { return { ok: false, message: 'Import guru gagal: ' + e.message }; }
}

function importTatib_(token, payload) {
  try {
    verifikasiToken_(token);
    const rows = payload.rows || [];
    if (!rows.length) return { ok: false, message: 'Tidak ada baris.' };
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = getOrCreateSheet_(ss, SHEET.TATA_TERTIB);
    const headers = ensureHeaders_(sh, SHEET.TATA_TERTIB);
    const dataSaatIni = sh.getDataRange().getValues();
    const idxKode = headers.indexOf('kode');
    let berhasil = 0, gagal = 0, diperbarui = 0;
    const detailError = [];
    const barisBaru = [];
    rows.forEach((row, i) => {
      const nomor = i + 2;
      const mapped = {};
      Object.keys(row).forEach(k => { const norm = normalisasiHeader_(k); if (norm) mapped[norm] = row[k]; });
      const kode = String(mapped.kode || '').trim().toUpperCase();
      if (!kode) { gagal++; detailError.push({ baris: nomor, alasan: 'Kode kosong' }); return; }
      const jenisNorm = normalisasiJenis_(mapped.jenis);
      if (jenisNorm === null) { gagal++; detailError.push({ baris: nomor, alasan: 'Jenis tidak valid.' }); return; }
      const poinRaw = Number(mapped.poin);
      if (isNaN(poinRaw)) { gagal++; detailError.push({ baris: nomor, alasan: 'Poin bukan angka.' }); return; }
      const poin = Math.abs(poinRaw);
      const aktif = String(mapped.aktif || 'YA').trim().toUpperCase();
      if (['YA', 'TIDAK'].indexOf(aktif) === -1) { gagal++; detailError.push({ baris: nomor, alasan: 'Aktif harus YA/TIDAK.' }); return; }
      const obj = { kode: kode, kategori: String(mapped.kategori || '').trim(), deskripsi: String(mapped.deskripsi || '').trim(), poin: poin, jenis: jenisNorm, aktif: aktif };
      let found = false;
      for (let r = 1; r < dataSaatIni.length; r++) {
        if (String(dataSaatIni[r][idxKode]).trim().toUpperCase() === kode) {
          headers.forEach((h, c) => { if (obj[h] !== undefined) dataSaatIni[r][c] = obj[h]; });
          sh.getRange(r + 1, 1, 1, headers.length).setValues([dataSaatIni[r]]);
          found = true; diperbarui++; berhasil++; break;
        }
      }
      if (!found) { barisBaru.push(obj); berhasil++; }
    });
    if (barisBaru.length) {
      appendRowsObjects_(SHEET.TATA_TERTIB, barisBaru);
    }
    catatAudit_({ id_guru: '', nama_guru: '', aksi: 'IMPORT_TATIB', modul: 'admin', detail: `${berhasil} (${diperbarui} diperbarui)` });
    return { ok: true, message: `Import selesai: ${berhasil} (${diperbarui} diperbarui, ${berhasil - diperbarui} baru), ${gagal} dilewati.`, data: { berhasil, gagal, diperbarui, detail_error: detailError, detail_peringatan: [] } };
  } catch (e) { return { ok: false, message: 'Import tatib gagal: ' + e.message }; }
}

function setSaldoAwalBatch_(token, payload) {
  try {
    const sesi = verifikasiToken_(token);
    if (!isAdminRole_(sesi.role)) {
      return { ok: false, message: 'Hanya Guru BK / Waka Kesiswaan / Kepsek / Admin yang berhak mengatur saldo awal.' };
    }
    const items = Array.isArray(payload.items) ? payload.items : [];
    if (!items.length) return { ok: false, message: 'Tidak ada data penyesuaian dikirim.' };

    const setting = getPengaturan_(null).data || {};
    const poinAwal = Number(setting.poin_awal) || 100;
    const siswaMap = new Map();
    readAll_(SHEET.SISWA).forEach(s => {
      siswaMap.set(String(s.nis || '').trim(), s);
    });

    const saldoMap = {};
    readAll_(SHEET.POIN).filter(isPoinSah_).forEach(r => {
      const nis = String(r.nis || '').trim();
      if (saldoMap[nis] === undefined) saldoMap[nis] = poinAwal;
      saldoMap[nis] += (Number(r.poin) || 0);
    });

    const tgl = todayStr_();
    const ts = nowStr_();
    const rowsToInsert = [];
    const detailError = [];
    let tidakBerubah = 0;

    items.forEach((it, idx) => {
      const nis = String(it.nis || '').trim();
      const target = Number(it.target_saldo);
      if (!nis || isNaN(target) || target < 0 || target > 1000) {
        detailError.push({ nis: nis || '-', alasan: 'NIS atau nilai saldo tidak valid (0-1000).' });
        return;
      }
      const siswa = siswaMap.get(nis);
      if (!siswa) {
        detailError.push({ nis: nis, alasan: 'NIS tidak ditemukan di Master Siswa.' });
        return;
      }
      const currentSaldo = saldoMap[nis] !== undefined ? saldoMap[nis] : poinAwal;
      const delta = Math.round(target - currentSaldo);
      if (delta === 0) {
        tidakBerubah++;
        return;
      }
      const catatan = String(it.catatan || '').trim() || ('Saldo awal buku manual BK (disesuaikan ke ' + target + ' poin)');
      rowsToInsert.push({
        id_poin: makeId_('SAL') + '-' + idx,
        timestamp: ts,
        tanggal: tgl,
        nis: nis,
        nama: siswa.nama,
        kelas: siswa.kelas,
        jenis: delta > 0 ? 'PRESTASI' : 'PELANGGARAN',
        pasal: 'SALDO_AWAL',
        deskripsi: catatan,
        poin: delta,
        saldo_setelah: target,
        petugas: sesi.nama,
        divalidasi: 'YA'
      });
      saldoMap[nis] = target;
    });

    if (rowsToInsert.length) {
      appendRowsObjects_(SHEET.POIN, rowsToInsert, ['tanggal', 'nis']);
      catatAudit_({ id_guru: sesi.id_guru, nama_guru: sesi.nama, aksi: 'SET_SALDO_AWAL', modul: 'disiplin', detail: `${rowsToInsert.length} disesuaikan, ${tidakBerubah} tidak berubah` });
    }

    return {
      ok: true,
      message: `${rowsToInsert.length} siswa berhasil disesuaikan saldonya` + (tidakBerubah ? `, ${tidakBerubah} siswa sudah sama.` : '.'),
      data: {
        berhasil: rowsToInsert.length,
        tidak_berubah: tidakBerubah,
        gagal: detailError.length,
        detail_error: detailError
      }
    };
  } catch (e) { return { ok: false, message: 'Gagal menyimpan saldo awal: ' + e.message }; }
}

function importSaldoAwal_(token, payload) {
  try {
    const sesi = verifikasiToken_(token);
    if (!isAdminRole_(sesi.role)) {
      return { ok: false, message: 'Hanya Guru BK / Waka Kesiswaan / Kepsek / Admin yang berhak import saldo awal.' };
    }
    const rows = Array.isArray(payload.rows) ? payload.rows : [];
    if (!rows.length) return { ok: false, message: 'Tidak ada baris untuk diimport.' };

    const setting = getPengaturan_(null).data || {};
    const poinAwal = Number(setting.poin_awal) || 100;
    const siswaMap = new Map();
    readAll_(SHEET.SISWA).forEach(s => {
      siswaMap.set(String(s.nis || '').trim(), s);
    });

    const saldoMap = {};
    readAll_(SHEET.POIN).filter(isPoinSah_).forEach(r => {
      const nis = String(r.nis || '').trim();
      if (saldoMap[nis] === undefined) saldoMap[nis] = poinAwal;
      saldoMap[nis] += (Number(r.poin) || 0);
    });

    const tgl = todayStr_();
    const ts = nowStr_();
    const rowsToInsert = [];
    const detailError = [];
    const detailPeringatan = [];
    let gagal = 0, sudahSama = 0;

    rows.forEach((row, i) => {
      const nomor = i + 2;
      const mapped = {};
      let rawKet = '';
      Object.keys(row).forEach(k => {
        const keyLower = String(k || '').trim().toLowerCase();
        if (keyLower === 'keterangan' || keyLower === 'catatan' || keyLower === 'alasan') {
          if (!rawKet && row[k] !== undefined && row[k] !== '') rawKet = String(row[k]).trim();
        }
        const norm = normalisasiHeader_(k);
        if (norm) mapped[norm] = row[k];
      });

      const nis = String(mapped.nis || '').trim();
      if (!nis) { gagal++; detailError.push({ baris: nomor, alasan: 'NIS kosong' }); return; }
      const siswa = siswaMap.get(nis);
      if (!siswa) { gagal++; detailError.push({ baris: nomor, alasan: `NIS ${nis} tidak ditemukan di Master Siswa.` }); return; }

      const rawSisa = mapped.sisa_poin;
      if (rawSisa === '' || rawSisa === null || rawSisa === undefined || isNaN(Number(rawSisa))) {
        gagal++; detailError.push({ baris: nomor, alasan: `Nilai sisa_poin/saldo kosong atau bukan angka (${rawSisa}).` }); return;
      }
      const target = Math.round(Number(rawSisa));
      if (target < 0 || target > 1000) {
        gagal++; detailError.push({ baris: nomor, alasan: `Nilai sisa_poin harus 0-1000 (${target}).` }); return;
      }

      const currentSaldo = saldoMap[nis] !== undefined ? saldoMap[nis] : poinAwal;
      const delta = Math.round(target - currentSaldo);
      if (delta === 0) {
        sudahSama++;
        return;
      }

      const catatan = rawKet || String(mapped.catatan || '').trim() || ('Saldo awal buku manual BK (disesuaikan ke ' + target + ' poin)');
      rowsToInsert.push({
        id_poin: makeId_('SAL') + '-' + i,
        timestamp: ts,
        tanggal: tgl,
        nis: nis,
        nama: siswa.nama,
        kelas: siswa.kelas,
        jenis: delta > 0 ? 'PRESTASI' : 'PELANGGARAN',
        pasal: 'SALDO_AWAL',
        deskripsi: catatan,
        poin: delta,
        saldo_setelah: target,
        petugas: sesi.nama,
        divalidasi: 'YA'
      });
      saldoMap[nis] = target;
    });

    if (rowsToInsert.length) {
      appendRowsObjects_(SHEET.POIN, rowsToInsert, ['tanggal', 'nis']);
    }
    if (sudahSama > 0) {
      detailPeringatan.push(`${sudahSama} siswa saldonya sudah sama dengan file Excel sehingga dilewati (tidak dibuat baris ganda).`);
    }
    catatAudit_({ id_guru: sesi.id_guru, nama_guru: sesi.nama, aksi: 'IMPORT_SALDO_AWAL', modul: 'admin', detail: `${rowsToInsert.length} disesuaikan, ${sudahSama} sama, ${gagal} error` });

    return {
      ok: true,
      message: `Import saldo selesai: ${rowsToInsert.length} disesuaikan, ${sudahSama} sudah sama, ${gagal} error.`,
      data: {
        berhasil: rowsToInsert.length,
        gagal: gagal,
        diperbarui: sudahSama,
        detail_error: detailError,
        detail_peringatan: detailPeringatan
      }
    };
  } catch (e) { return { ok: false, message: 'Import saldo awal gagal: ' + e.message }; }
}

function getRaportSiswa_(token, payload) {
  try {
    verifikasiToken_(token);
    const nis = String(payload.nis || '').trim();
    const mode = String(payload.mode || 'semester').toLowerCase();
    const bulan = String(payload.bulan || '').trim();
    const tahunAjaran = String(payload.tahun_ajaran || '').trim();
    const semester = String(payload.semester || '').trim();
    if (!nis) return { ok: false, message: 'NIS kosong.' };
    const siswa = readAll_(SHEET.SISWA).find(s => String(s.nis || '').trim() === nis);
    if (!siswa) return { ok: false, message: 'Siswa tidak ditemukan.' };
    const setting = getPengaturan_(null).data || {};
    const poinAwalSiswa = Number(setting.poin_awal) || 100;
    const namaKepsek = setting.kepala_sekolah || '...............................';
    let namaWali = '...............................';
    const kelasInfo = readAll_(SHEET.KELAS).find(k => String(k.nama_kelas || '').trim() === String(siswa.kelas || '').trim());
    if (kelasInfo && kelasInfo.wali_kelas) namaWali = String(kelasInfo.wali_kelas).trim();
    let dari, sampai, labelPeriode;
    if (mode === 'bulan' && /^\d{4}-\d{2}$/.test(bulan)) {
      dari = bulan + '-01';
      const [y, m] = bulan.split('-').map(Number);
      const lastDay = new Date(y, m, 0).getDate();
      sampai = bulan + '-' + String(lastDay).padStart(2, '0');
      const namaBulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][m - 1];
      labelPeriode = 'Bulan ' + namaBulan + ' ' + y;
    } else {
      if (!semester || !tahunAjaran) return { ok: false, message: 'Semester dan tahun ajaran wajib diisi.' };
      const [taAwal, taAkhir] = tahunAjaran.split('/').map(s => s.trim());
      if (semester.toUpperCase() === 'GANJIL') { dari = taAwal + '-07-01'; sampai = taAwal + '-12-31'; }
      else { dari = taAkhir + '-01-01'; sampai = taAkhir + '-06-30'; }
      labelPeriode = 'Semester ' + semester + ' TA ' + tahunAjaran;
    }
    const gerbang = readAll_(SHEET.GERBANG).filter(r => String(r.nis || '').trim() === nis);
    const rekapSiswaRows = readAll_(SHEET.REKAP_SISWA).filter(r => String(r.nis || '').trim() === nis);
    const keterangan = readAll_(SHEET.KETERANGAN).filter(r => String(r.nis || '').trim() === nis);
    const poin = readAll_(SHEET.POIN).filter(r => String(r.nis || '').trim() === nis && isPoinSah_(r));
    const rekapBulanan = {};
    const daftarBulan = [];
    if (mode === 'bulan') daftarBulan.push(bulan);
    else {
      let cur = dari.slice(0, 7);
      while (cur <= sampai.slice(0, 7)) { daftarBulan.push(cur); const [y, m] = cur.split('-').map(Number); const nextM = m === 12 ? 1 : m + 1; const nextY = m === 12 ? y + 1 : y; cur = nextY + '-' + String(nextM).padStart(2, '0'); }
    }
    daftarBulan.forEach(b => { rekapBulanan[b] = { hadir: 0, izin: 0, sakit: 0, alpa: 0 }; });
    const hadirDates = new Set();
    gerbang.forEach(r => {
      const tgl = getTanggalBersih_(r.tanggal);
      if (tgl < dari || tgl > sampai) return;
      if (String(r.sesi).toUpperCase() !== 'PAGI') return;
      hadirDates.add(tgl);
    });
    rekapSiswaRows.forEach(r => {
      const tgl = getTanggalBersih_(r.tanggal);
      if (tgl < dari || tgl > sampai) return;
      const jm = formatJamSheet(r.jam_masuk, '');
      if (jm) hadirDates.add(tgl);
    });
    hadirDates.forEach(tgl => {
      const b = tgl.slice(0, 7);
      if (rekapBulanan[b]) rekapBulanan[b].hadir++;
    });
    const ketPerTgl = {};
    keterangan.forEach(r => {
      const tgl = getTanggalBersih_(r.tanggal);
      if (!tgl || tgl < dari || tgl > sampai) return;
      ketPerTgl[tgl] = String(r.status || '').toUpperCase();
    });
    Object.keys(ketPerTgl).forEach(tgl => {
      if (hadirDates.has(tgl)) return;
      const b = tgl.slice(0, 7);
      if (!rekapBulanan[b]) return;
      const st = ketPerTgl[tgl];
      if (st === 'IZIN') rekapBulanan[b].izin++;
      if (st === 'SAKIT') rekapBulanan[b].sakit++;
      if (st === 'ALPA') rekapBulanan[b].alpa++;
    });
    const poinPeriode = poin.filter(r => {
      const tgl = getTanggalBersih_(r.tanggal);
      return tgl >= dari && tgl <= sampai;
    }).sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));
    let saldoTotal = poinAwalSiswa;
    poin.forEach(r => { saldoTotal += (Number(r.poin) || 0); });
    const zonaKuning = Number(setting.zona_kuning_min) || 51;
    const zonaOranye = Number(setting.zona_oranye_min) || 26;
    const zonaMerah = Number(setting.zona_merah_min) || 1;
    let zona = 'Hijau', zonaLabel = 'Sangat Baik';
    if (saldoTotal <= 0) { zona = 'Kritis'; zonaLabel = 'Kritis'; }
    else if (saldoTotal < zonaMerah) { zona = 'Kritis'; zonaLabel = 'Kritis'; }
    else if (saldoTotal < zonaOranye) { zona = 'Merah'; zonaLabel = 'Risiko Tinggi'; }
    else if (saldoTotal < zonaKuning) { zona = 'Oranye'; zonaLabel = 'Perlu Perhatian'; }
    else if (saldoTotal < (zonaKuning + 25)) { zona = 'Kuning'; zonaLabel = 'Baik'; }
    return {
      ok: true,
      data: {
        siswa: { nis: siswa.nis, nama: siswa.nama, kelas: siswa.kelas, jk: siswa.jk, foto_url: siswa.foto_url || '' },
        periode: { label: labelPeriode, dari, sampai, mode, bulan, semester, tahun_ajaran: tahunAjaran },
        rekap_bulanan: daftarBulan.map(b => ({ bulan: b, ...rekapBulanan[b] })),
        poin_detail: poinPeriode.map(p => ({ tanggal: getTanggalBersih_(p.tanggal), pasal: p.pasal, deskripsi: p.deskripsi, poin: Number(p.poin) || 0, petugas: p.petugas })),
        saldo_akhir: saldoTotal,
        zona: { kode: zona, label: zonaLabel },
        nama_wali: namaWali,
        nama_kepsek: namaKepsek
      }
    };
  } catch (e) { return { ok: false, message: 'Gagal memuat raport: ' + e.message }; }
}

// =========================================================
// KIOS GERBANG OFFLINE-FIRST (gerbang.html)
// =========================================================
function getAbsenHariIni_(token, p) {
  try {
    verifikasiToken_(token);
    const tanggal = String(p.tanggal || todayStr_());
    const dataGerbang = readAll_(SHEET.GERBANG)
      .filter(r => getTanggalBersih_(r.tanggal) === tanggal)
      .sort((a, b) => String(a.timestamp || '').localeCompare(String(b.timestamp || '')));
    const dataGuru = readAll_(SHEET.GURU_HADIR)
      .filter(r => getTanggalBersih_(r.tanggal) === tanggal)
      .sort((a, b) => String(a.timestamp || '').localeCompare(String(b.timestamp || '')));

    const hasil = {};
    const riwayat = [];

    dataGerbang.forEach(r => {
      const nis = String(r.nis || '').trim();
      if (!nis) return;
      if (!hasil[nis]) hasil[nis] = { masuk: null, pulang: null };
      const jam = formatJamSheet(r.jam || r.timestamp, '');
      const sesi = String(r.sesi || 'PAGI').toUpperCase();
      if (sesi === 'PAGI' && jam) hasil[nis].masuk = jam;
      if (sesi === 'PULANG' && jam) hasil[nis].pulang = jam;

      const stRaw = String(r.status || '').toUpperCase();
      let statusLabel = sesi === 'PULANG' ? 'Pulang' : 'Masuk';
      let isPeringatan = false;
      if (stRaw === 'TERLAMBAT') { statusLabel = 'Terlambat'; isPeringatan = true; }
      else if (stRaw === 'PULANG_AWAL' || stRaw === 'PULANG_CEPAT') { statusLabel = 'Pulang Awal'; isPeringatan = true; }

      riwayat.push({
        nis: nis,
        nama: String(r.nama || nis),
        kelas: String(r.kelas || ''),
        tipe: 'Siswa',
        jam: jam || '--:--',
        sesi: sesi,
        status: statusLabel,
        isPeringatan: isPeringatan,
        petugas: String(r.petugas || ''),
        timestamp: String(r.timestamp || '')
      });
    });

    const guruOrderMap = {};
    dataGuru.slice().sort((a, b) => {
      const ja = formatJamSheet(a.jam || a.timestamp, '99:99');
      const jb = formatJamSheet(b.jam || b.timestamp, '99:99');
      return ja.localeCompare(jb);
    }).forEach(r => {
      const id = String(r.id_guru || '').trim();
      if (!id) return;
      if (!hasil[id]) hasil[id] = { masuk: null, pulang: null };
      const jam = formatJamSheet(r.jam || r.timestamp, '');
      guruOrderMap[id] = (guruOrderMap[id] || 0) + 1;
      const isPulang = guruOrderMap[id] > 1 && hasil[id].masuk && jam !== hasil[id].masuk;
      if (!hasil[id].masuk && jam) hasil[id].masuk = jam;
      else if (jam && jam !== hasil[id].masuk) hasil[id].pulang = jam;

      riwayat.push({
        nis: id,
        nama: String(r.nama_guru || id),
        kelas: 'Guru',
        tipe: 'Guru',
        jam: jam || '--:--',
        sesi: isPulang ? 'PULANG' : 'PAGI',
        status: isPulang ? 'Pulang' : 'Masuk',
        isPeringatan: false,
        petugas: '',
        timestamp: String(r.timestamp || '')
      });
    });

    riwayat.sort((a, b) => String(b.timestamp || b.jam).localeCompare(String(a.timestamp || a.jam)));

    const guruPiket = readAll_(SHEET.GURU).filter(g => {
      const role = String(g.role || '').toUpperCase();
      return (role.includes('GURU_PIKET') || role.includes('SUPER_ADMIN')) && isAktifStatus_(g.status);
    }).map(g => ({ id: g.id_guru, nama: g.nama }));

    return { ok: true, data: hasil, riwayat: riwayat, guruPiket: guruPiket };
  } catch (e) { return { ok: false, message: e.message }; }
}

function prosesRekapSiswaBatch_(sh, items, setting) {
  if (!items || !items.length) return;
  const headers = ensureHeaders_(sh, SHEET.REKAP_SISWA).map(h => h.toLowerCase());
  const data = sh.getDataRange().getValues();

  const cTgl = headers.indexOf('tanggal');
  const cNis = headers.indexOf('nis');
  const cNama = headers.indexOf('nama');
  const cKelas = headers.indexOf('kelas');
  const cMasuk = headers.indexOf('jam_masuk');
  const cPulang = headers.indexOf('jam_pulang');
  const cStMasuk = headers.indexOf('status_masuk');
  const cStPulang = headers.indexOf('status_pulang');

  const rowMap = {};
  for (let i = 1; i < data.length; i++) {
    const key = getTanggalBersih_(data[i][cTgl]) + '|' + String(data[i][cNis] || '').trim();
    if (key !== '|') rowMap[key] = { rowIdx: i + 1, row: data[i] };
  }

  const modifiedRows = {};
  const newRows = [];

  items.forEach(item => {
    const siswa = item.siswa;
    const tgl = item.tglTap;
    const jam = item.jamTap;
    const sesiUpper = String(item.sesiTap || 'PAGI').toUpperCase();
    const statusVal = item.statusSiswa || hitungStatusSiswa_(jam, sesiUpper, setting || {});
    const key = tgl + '|' + String(siswa.nis).trim();

    if (rowMap[key]) {
      const target = rowMap[key];
      const row = target.row;
      if (sesiUpper === 'PULANG') {
        if (cPulang !== -1) row[cPulang] = jam;
        if (cStPulang !== -1) row[cStPulang] = statusVal;
        if (target.rowIdx !== -1) modifiedRows[target.rowIdx] = row;
      } else {
        const jmAda = cMasuk !== -1 ? formatJamSheet(row[cMasuk], '') : '';
        if (!jmAda || item.forceOverwrite) {
          if (cMasuk !== -1) row[cMasuk] = jam;
          if (cStMasuk !== -1) row[cStMasuk] = statusVal;
          if (target.rowIdx !== -1) modifiedRows[target.rowIdx] = row;
        }
      }
    } else {
      const newRow = new Array(headers.length).fill('');
      if (cTgl !== -1) newRow[cTgl] = tgl;
      if (cNis !== -1) newRow[cNis] = String(siswa.nis);
      if (cNama !== -1) newRow[cNama] = siswa.nama;
      if (cKelas !== -1) newRow[cKelas] = siswa.kelas;
      if (sesiUpper === 'PAGI') {
        if (cMasuk !== -1) newRow[cMasuk] = jam;
        if (cPulang !== -1) newRow[cPulang] = '-';
        if (cStMasuk !== -1) newRow[cStMasuk] = statusVal;
        if (cStPulang !== -1) newRow[cStPulang] = '-';
      } else {
        if (cMasuk !== -1) newRow[cMasuk] = '-';
        if (cPulang !== -1) newRow[cPulang] = jam;
        if (cStMasuk !== -1) newRow[cStMasuk] = '-';
        if (cStPulang !== -1) newRow[cStPulang] = statusVal;
      }
      rowMap[key] = { rowIdx: -1, row: newRow };
      newRows.push(newRow);
    }
  });

  Object.keys(modifiedRows).forEach(rStr => {
    const r = Number(rStr);
    [cTgl, cNis, cMasuk, cPulang].forEach(c => {
      if (c !== -1) sh.getRange(r, c + 1).setNumberFormat('@');
    });
    sh.getRange(r, 1, 1, headers.length).setValues([modifiedRows[rStr]]);
  });

  if (newRows.length > 0) {
    const startRow = sh.getLastRow() + 1;
    [cTgl, cNis, cMasuk, cPulang].forEach(c => {
      if (c !== -1) sh.getRange(startRow, c + 1, newRows.length, 1).setNumberFormat('@');
    });
    sh.getRange(startRow, 1, newRows.length, headers.length).setValues(newRows);
  }
  SpreadsheetApp.flush();
}

function prosesRekapGuruBatch_(sh, items) {
  if (!items || !items.length) return;
  const headers = ensureHeaders_(sh, SHEET.REKAP_GURU).map(h => h.toLowerCase());
  const data = sh.getDataRange().getValues();

  const cId = headers.indexOf('id_guru');
  const cTgl = headers.indexOf('tanggal');
  const cMasuk = headers.indexOf('jam_masuk');
  const cPulang = headers.indexOf('jam_pulang');
  const cStatus = headers.indexOf('status');
  const cTotal = headers.indexOf('total_jam');

  const rowMap = {};
  for (let i = 1; i < data.length; i++) {
    const key = getTanggalBersih_(data[i][cTgl]) + '|' + String(data[i][cId] || '').trim();
    if (key !== '|') rowMap[key] = { rowIdx: i + 1, row: data[i] };
  }

  const modifiedRows = {};
  const newRows = [];

  items.forEach(item => {
    const guru = item.guru;
    const tgl = item.tglTap;
    const jamTap = item.jamTap;
    const key = tgl + '|' + String(guru.id_guru).trim();

    if (rowMap[key]) {
      const target = rowMap[key];
      const row = target.row;
      const jm = cMasuk !== -1 ? formatJamSheet(row[cMasuk], '') : '';
      const jpAda = cPulang !== -1 ? formatJamSheet(row[cPulang], '') : '';
      if (!jm) {
        if (cMasuk !== -1) row[cMasuk] = jamTap;
        if (cStatus !== -1) row[cStatus] = 'HADIR';
        if (target.rowIdx !== -1) modifiedRows[target.rowIdx] = row;
      } else if (jamTap !== jm) {
        const mExist = menitDariJam_(jm);
        const mNew = menitDariJam_(jamTap);
        const mPulang = jpAda ? menitDariJam_(jpAda) : -1;
        if (mExist >= 0 && mNew >= 0) {
          if (mNew < mExist) {
            if ((mExist - mNew) >= 120) {
              const finalPulang = (mPulang > mExist) ? jpAda : jm;
              const diff = Math.max(mExist, mPulang) - mNew;
              if (cMasuk !== -1) row[cMasuk] = jamTap;
              if (cPulang !== -1) row[cPulang] = finalPulang;
              if (cTotal !== -1) row[cTotal] = Math.floor(diff / 60) + ' Jam ' + (diff % 60) + ' Mnt';
              if (cStatus !== -1 && !row[cStatus]) row[cStatus] = 'HADIR';
              if (target.rowIdx !== -1) modifiedRows[target.rowIdx] = row;
            } else {
              if (cMasuk !== -1) row[cMasuk] = jamTap;
              if (mPulang >= 0 && (mPulang - mNew) >= 120 && cTotal !== -1) {
                const diff = mPulang - mNew;
                row[cTotal] = Math.floor(diff / 60) + ' Jam ' + (diff % 60) + ' Mnt';
              }
              if (target.rowIdx !== -1) modifiedRows[target.rowIdx] = row;
            }
          } else {
            const diff = mNew - mExist;
            if (diff >= 120 && (mPulang === -1 || mNew > mPulang)) {
              if (cPulang !== -1) row[cPulang] = jamTap;
              if (cTotal !== -1) row[cTotal] = Math.floor(diff / 60) + ' Jam ' + (diff % 60) + ' Mnt';
              if (cStatus !== -1 && !row[cStatus]) row[cStatus] = 'HADIR';
              if (target.rowIdx !== -1) modifiedRows[target.rowIdx] = row;
            }
          }
        }
      }
    } else {
      const newRow = new Array(headers.length).fill('');
      if (cId !== -1) newRow[cId] = String(guru.id_guru);
      if (cTgl !== -1) newRow[cTgl] = tgl;
      if (cMasuk !== -1) newRow[cMasuk] = jamTap;
      if (cPulang !== -1) newRow[cPulang] = '-';
      if (cStatus !== -1) newRow[cStatus] = 'HADIR';
      if (cTotal !== -1) newRow[cTotal] = '-';
      rowMap[key] = { rowIdx: -1, row: newRow };
      newRows.push(newRow);
    }
  });

  Object.keys(modifiedRows).forEach(rStr => {
    const r = Number(rStr);
    [cId, cTgl, cMasuk, cPulang, cTotal].forEach(c => {
      if (c !== -1) sh.getRange(r, c + 1).setNumberFormat('@');
    });
    sh.getRange(r, 1, 1, headers.length).setValues([modifiedRows[rStr]]);
  });

  if (newRows.length > 0) {
    const startRow = sh.getLastRow() + 1;
    [cId, cTgl, cMasuk, cPulang, cTotal].forEach(c => {
      if (c !== -1) sh.getRange(startRow, c + 1, newRows.length, 1).setNumberFormat('@');
    });
    sh.getRange(startRow, 1, newRows.length, headers.length).setValues(newRows);
  }
  SpreadsheetApp.flush();
}

function terapkanKoreksiPoinMultiPerangkat_(ss, koreksiList, ruleKode) {
  if (!koreksiList || !koreksiList.length || !ruleKode) return;
  const sh = ss.getSheetByName(SHEET.POIN);
  if (!sh) return;
  const d = sh.getDataRange().getValues();
  if (d.length < 2) return;
  const headers = ensureHeaders_(sh, SHEET.POIN).map(h => String(h).trim().toLowerCase());
  const iTgl = headers.indexOf('tanggal');
  const iNis = headers.indexOf('nis');
  const iPasal = headers.indexOf('pasal');
  const iDesk = headers.indexOf('deskripsi');
  const iPetugas = headers.indexOf('petugas');
  const iValid = headers.indexOf('divalidasi');
  if (iValid === -1) return;

  const mapKoreksi = {};
  koreksiList.forEach(k => { mapKoreksi[k.tgl + '|' + k.nis] = k.alasan || 'Sinkron multi-perangkat'; });
  const kodeTarget = String(ruleKode).trim().toUpperCase();

  for (let i = 1; i < d.length; i++) {
    const key = getTanggalBersih_(d[i][iTgl]) + '|' + String(d[i][iNis] || '').trim();
    if (!mapKoreksi[key]) continue;
    const pasalRow = String(d[i][iPasal] || '').trim().toUpperCase();
    const petRow = String(d[i][iPetugas] || '');
    const dv = String(d[i][iValid] || '').trim().toUpperCase();
    if (pasalRow === kodeTarget && petRow.indexOf('Sistem Gerbang') !== -1 && dv !== 'DITOLAK') {
      d[i][iValid] = 'DITOLAK';
      if (iDesk !== -1) {
        const curD = String(d[i][iDesk] || '').trim();
        d[i][iDesk] = curD + ' [Batal otomatis: ' + mapKoreksi[key] + ']';
      }
      sh.getRange(i + 1, 1, 1, headers.length).setValues([d[i]]);
    }
  }
}

function sinkronMassalGerbang_(token, p) {
  try {
    const sesi = verifikasiToken_(token);
    const antreanRaw = Array.isArray(p.antrean) ? p.antrean : [];
    if (antreanRaw.length === 0) return { ok: true, message: 'Tidak ada data.' };

    // Urutkan antrean dari waktu tap paling awal agar rekonsiliasi batch selalu presisi
    const antrean = antreanRaw.slice().sort((a, b) => {
      const ta = a && a.waktu_tap ? new Date(a.waktu_tap).getTime() : 0;
      const tb = b && b.waktu_tap ? new Date(b.waktu_tap).getTime() : 0;
      return (isNaN(ta) ? 0 : ta) - (isNaN(tb) ? 0 : tb);
    });

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const shRekapGuru = getOrCreateSheet_(ss, SHEET.REKAP_GURU);
    const shRekapSiswa = getOrCreateSheet_(ss, SHEET.REKAP_SISWA);
    const setting = getPengaturan_(null).data || {};

    const masterSiswa = readAll_(SHEET.SISWA);
    const masterGuru = readAll_(SHEET.GURU);

    // Peta log gerbang siswa per (tanggal|nis) untuk rekonsiliasi multi-perangkat (mati lampu / beda urutan sinkron)
    const siswaLogMap = {};
    readAll_(SHEET.GERBANG).forEach(r => {
      const tgl = getTanggalBersih_(r.tanggal);
      const nis = String(r.nis || '').trim();
      if (!tgl || !nis) return;
      const key = tgl + '|' + nis;
      if (!siswaLogMap[key]) siswaLogMap[key] = { pagi: null, pulang: null };
      const sesiRow = String(r.sesi || 'PAGI').toUpperCase();
      const jamRow = formatJamSheet(r.jam || r.timestamp, '');
      const entry = { rowIdx: r._row, objRef: null, jam: jamRow, status: String(r.status || '').toUpperCase() };
      if (sesiRow === 'PULANG') siswaLogMap[key].pulang = entry;
      else siswaLogMap[key].pagi = entry;
    });

    const guruLogMap = {};
    readAll_(SHEET.GURU_HADIR).forEach(r => {
      const tgl = getTanggalBersih_(r.tanggal);
      const id = String(r.id_guru || '').trim();
      if (!tgl || !id) return;
      const k = tgl + '|' + id;
      if (!guruLogMap[k]) guruLogMap[k] = [];
      const jm = formatJamSheet(r.jam || r.timestamp, '');
      if (jm) guruLogMap[k].push({ rowIdx: r._row, jam: jm });
    });

    const objekGerbang = [];
    const gerbangUpdates = {};
    const objekGuru = [];
    const guruUpdates = {};
    const rekapSiswaQueue = [];
    const rekapGuruQueue = [];
    const objekPoinTerlambat = [];
    const poinKoreksiQueue = [];
    let dilewati = 0;
    let diperbaiki = 0;
    const dilewatiDetail = [];

    // Persiapan aturan potong poin terlambat otomatis & daftar izin/sakit agar cepat dalam batch
    const tatibList = readAll_(SHEET.TATA_TERTIB);
    const ruleTelat = getRulePotongTerlambat_(setting, tatibList);
    const ketIzinSakitSet = new Set();
    readAll_(SHEET.KETERANGAN).forEach(k => {
      const stK = String(k.status || '').trim().toUpperCase();
      if (stK === 'IZIN' || stK === 'SAKIT') {
        const tk = getTanggalBersih_(k.tanggal) + '|' + String(k.nis || '').trim();
        ketIzinSakitSet.add(tk);
      }
    });
    const poinAwal = Number(setting.poin_awal) || 100;
    const saldoMap = {};
    const sudahTelatPoinSet = new Set();
    if (ruleTelat) {
      readAll_(SHEET.POIN).filter(isPoinSah_).forEach(r => {
        const n = String(r.nis || '').trim();
        if (saldoMap[n] === undefined) saldoMap[n] = poinAwal;
        saldoMap[n] += (Number(r.poin) || 0);
        if (String(r.pasal || '').trim().toUpperCase() === ruleTelat.kode) {
          sudahTelatPoinSet.add(getTanggalBersih_(r.tanggal) + '|' + n);
        }
      });
    }

    function catatPoinTerlambatJikaPerlu_(siswaObj, tglTap, jamTap, statusPagi, isDisp) {
      if (!ruleTelat || statusPagi !== 'TERLAMBAT' || isDisp) return;
      const nisStr = String(siswaObj.nis).trim();
      const telatKey = tglTap + '|' + nisStr;
      if (sudahTelatPoinSet.has(telatKey)) return;
      sudahTelatPoinSet.add(telatKey);
      const curSaldo = saldoMap[nisStr] !== undefined ? saldoMap[nisStr] : poinAwal;
      const potong = -Math.abs(ruleTelat.poin);
      const saldoSetelah = curSaldo + potong;
      saldoMap[nisStr] = saldoSetelah;
      objekPoinTerlambat.push({
        id_poin: makeId_('PON') + '-' + objekPoinTerlambat.length,
        timestamp: nowStr_(),
        tanggal: tglTap,
        nis: nisStr,
        nama: siswaObj.nama,
        kelas: siswaObj.kelas,
        jenis: 'PELANGGARAN',
        pasal: ruleTelat.kode,
        deskripsi: 'Terlambat masuk gerbang pukul ' + jamTap + ' WIB (otomatis)',
        poin: potong,
        saldo_setelah: saldoSetelah,
        petugas: 'Sistem Gerbang (' + sesi.nama + ')',
        divalidasi: 'YA'
      });
    }

    antrean.forEach(data => {
      let waktuAcuan = new Date();
      if (data.waktu_tap) {
        const parsed = new Date(data.waktu_tap);
        if (!isNaN(parsed.getTime())) waktuAcuan = parsed;
      }

      const tglTap = Utilities.formatDate(waktuAcuan, TZ, 'yyyy-MM-dd');
      const jamTap = Utilities.formatDate(waktuAcuan, TZ, 'HH:mm');
      const tstamp = Utilities.formatDate(waktuAcuan, TZ, 'yyyy-MM-dd HH:mm:ss');

      const kodeRaw = String(data.nis || '').trim();
      const kodeNorm = normalisasiUid_(kodeRaw);

      const siswa = masterSiswa.find(s =>
        String(s.nis).trim() === kodeRaw || (s.uid_rfid && kodeNorm && normalisasiUid_(s.uid_rfid) === kodeNorm)
      );
      const guru = !siswa ? masterGuru.find(g =>
        String(g.id_guru).trim() === kodeRaw || (g.uid_rfid && kodeNorm && normalisasiUid_(g.uid_rfid) === kodeNorm)
      ) : null;

      if (siswa) {
        if (!isAktifStatus_(siswa.status)) {
          dilewati++;
          if (dilewatiDetail.length < 10) dilewatiDetail.push(siswa.nama + ' (status ' + siswa.status + ' tidak aktif)');
          return;
        }
        const sesiHint = String(data.tipe_tap || 'PAGI').toUpperCase();
        const nisStr = String(siswa.nis).trim();
        const keyDay = tglTap + '|' + nisStr;
        if (!siswaLogMap[keyDay]) siswaLogMap[keyDay] = { pagi: null, pulang: null };
        const rec = siswaLogMap[keyDay];

        const dispItem = String(data.dispensasi || '').trim().toUpperCase();
        const hasKetIzinSakit = ketIzinSakitSet.has(keyDay);
        const isDisp = Boolean(dispItem) || hasKetIzinSakit;
        const mNew = menitDariJam_(jamTap);

        if (!rec.pagi && !rec.pulang) {
          const sesiFinal = (sesiHint === 'PULANG') ? 'PULANG' : 'PAGI';
          const rawStatus = hitungStatusSiswa_(jamTap, sesiFinal, setting);
          const statusFinal = (sesiFinal === 'PAGI' && rawStatus === 'TERLAMBAT' && isDisp) ? 'TEPAT_WAKTU' : rawStatus;
          const obj = {
            id_log: makeId_('GRB'), timestamp: tstamp, tanggal: tglTap,
            nis: nisStr, nama: siswa.nama, kelas: siswa.kelas,
            tipe: 'SISWA', sesi: sesiFinal, status: statusFinal,
            petugas: sesi.nama, sumber: data.sumber || 'RFID'
          };
          objekGerbang.push(obj);
          const ref = { rowIdx: -1, objRef: obj, jam: jamTap, status: statusFinal };
          if (sesiFinal === 'PULANG') rec.pulang = ref;
          else rec.pagi = ref;
          rekapSiswaQueue.push({ siswa: siswa, tglTap: tglTap, jamTap: jamTap, sesiTap: sesiFinal, statusSiswa: statusFinal });
          if (sesiFinal === 'PAGI') catatPoinTerlambatJikaPerlu_(siswa, tglTap, jamTap, statusFinal, isDisp);
        } else if (rec.pagi && !rec.pulang) {
          const mPagi = menitDariJam_(rec.pagi.jam);
          const diff = (mNew >= 0 && mPagi >= 0) ? (mNew - mPagi) : 0;

          if (diff >= 120) {
            // Tap lebih akhir >= 2 jam: otomatis catat sebagai PULANG (meski dari laptop lain berlabel PAGI)
            const statusPulang = hitungStatusSiswa_(jamTap, 'PULANG', setting);
            const obj = {
              id_log: makeId_('GRB'), timestamp: tstamp, tanggal: tglTap,
              nis: nisStr, nama: siswa.nama, kelas: siswa.kelas,
              tipe: 'SISWA', sesi: 'PULANG', status: statusPulang,
              petugas: sesi.nama, sumber: data.sumber || 'RFID'
            };
            objekGerbang.push(obj);
            rec.pulang = { rowIdx: -1, objRef: obj, jam: jamTap, status: statusPulang };
            rekapSiswaQueue.push({ siswa: siswa, tglTap: tglTap, jamTap: jamTap, sesiTap: 'PULANG', statusSiswa: statusPulang });
          } else if (diff <= -120) {
            // Kasus mati lampu: tap pulang dari Laptop B sempat tersinkron duluan sebagai PAGI, kini tap pagi asli dari PC A masuk!
            const oldJam = rec.pagi.jam;
            const statusPulangOld = hitungStatusSiswa_(oldJam, 'PULANG', setting);
            if (rec.pagi.rowIdx > 0) {
              gerbangUpdates[rec.pagi.rowIdx] = Object.assign({}, gerbangUpdates[rec.pagi.rowIdx] || {}, { sesi: 'PULANG', status: statusPulangOld });
            } else if (rec.pagi.objRef) {
              rec.pagi.objRef.sesi = 'PULANG';
              rec.pagi.objRef.status = statusPulangOld;
            }
            rec.pulang = { rowIdx: rec.pagi.rowIdx, objRef: rec.pagi.objRef, jam: oldJam, status: statusPulangOld };

            const rawPagi = hitungStatusSiswa_(jamTap, 'PAGI', setting);
            const statusPagi = (rawPagi === 'TERLAMBAT' && isDisp) ? 'TEPAT_WAKTU' : rawPagi;
            const objPagi = {
              id_log: makeId_('GRB'), timestamp: tstamp, tanggal: tglTap,
              nis: nisStr, nama: siswa.nama, kelas: siswa.kelas,
              tipe: 'SISWA', sesi: 'PAGI', status: statusPagi,
              petugas: sesi.nama, sumber: data.sumber || 'RFID'
            };
            objekGerbang.push(objPagi);
            rec.pagi = { rowIdx: -1, objRef: objPagi, jam: jamTap, status: statusPagi };
            rekapSiswaQueue.push({ siswa: siswa, tglTap: tglTap, jamTap: jamTap, sesiTap: 'PAGI', statusSiswa: statusPagi, forceOverwrite: true });
            rekapSiswaQueue.push({ siswa: siswa, tglTap: tglTap, jamTap: oldJam, sesiTap: 'PULANG', statusSiswa: statusPulangOld, forceOverwrite: true });
            if (statusPagi !== 'TERLAMBAT' && ruleTelat) {
              poinKoreksiQueue.push({ tgl: tglTap, nis: nisStr, alasan: 'Jam masuk asli ' + jamTap + ' WIB (tepat waktu)' });
            } else {
              catatPoinTerlambatJikaPerlu_(siswa, tglTap, jamTap, statusPagi, isDisp);
            }
            diperbaiki++;
          } else if (diff < 0) {
            // Sama-sama tap pagi (< 2 jam), tetapi data dari perangkat ini LEBIH AWAL — pakai jam paling awal agar adil!
            const rawPagi = hitungStatusSiswa_(jamTap, 'PAGI', setting);
            const statusPagi = (rawPagi === 'TERLAMBAT' && isDisp) ? 'TEPAT_WAKTU' : rawPagi;
            if (rec.pagi.rowIdx > 0) {
              gerbangUpdates[rec.pagi.rowIdx] = Object.assign({}, gerbangUpdates[rec.pagi.rowIdx] || {}, { timestamp: tstamp, status: statusPagi });
            } else if (rec.pagi.objRef) {
              rec.pagi.objRef.timestamp = tstamp;
              rec.pagi.objRef.status = statusPagi;
            }
            rec.pagi.jam = jamTap;
            rec.pagi.status = statusPagi;
            rekapSiswaQueue.push({ siswa: siswa, tglTap: tglTap, jamTap: jamTap, sesiTap: 'PAGI', statusSiswa: statusPagi, forceOverwrite: true });
            if (statusPagi !== 'TERLAMBAT' && ruleTelat) {
              poinKoreksiQueue.push({ tgl: tglTap, nis: nisStr, alasan: 'Jam masuk awal ' + jamTap + ' WIB (tepat waktu)' });
            }
            diperbaiki++;
          } else {
            dilewati++;
            if (dilewatiDetail.length < 10) dilewatiDetail.push(siswa.nama + ' (tap PAGI ' + tglTap + ' sudah tercatat pukul ' + rec.pagi.jam + ')');
          }
        } else if (!rec.pagi && rec.pulang) {
          const mPulang = menitDariJam_(rec.pulang.jam);
          if (mNew >= 0 && mPulang >= 0 && (mPulang - mNew) >= 120) {
            const rawPagi = hitungStatusSiswa_(jamTap, 'PAGI', setting);
            const statusPagi = (rawPagi === 'TERLAMBAT' && isDisp) ? 'TEPAT_WAKTU' : rawPagi;
            const objPagi = {
              id_log: makeId_('GRB'), timestamp: tstamp, tanggal: tglTap,
              nis: nisStr, nama: siswa.nama, kelas: siswa.kelas,
              tipe: 'SISWA', sesi: 'PAGI', status: statusPagi,
              petugas: sesi.nama, sumber: data.sumber || 'RFID'
            };
            objekGerbang.push(objPagi);
            rec.pagi = { rowIdx: -1, objRef: objPagi, jam: jamTap, status: statusPagi };
            rekapSiswaQueue.push({ siswa: siswa, tglTap: tglTap, jamTap: jamTap, sesiTap: 'PAGI', statusSiswa: statusPagi, forceOverwrite: true });
            catatPoinTerlambatJikaPerlu_(siswa, tglTap, jamTap, statusPagi, isDisp);
          } else {
            dilewati++;
            if (dilewatiDetail.length < 10) dilewatiDetail.push(siswa.nama + ' (PULANG ' + tglTap + ' sudah ada)');
          }
        } else {
          // PAGI & PULANG sudah ada: perbarui jam masuk jika tap susulan ternyata lebih awal dari jam masuk tercatat
          const mPagi = menitDariJam_(rec.pagi.jam);
          if (mNew >= 0 && mPagi >= 0 && mNew < mPagi) {
            const rawPagi = hitungStatusSiswa_(jamTap, 'PAGI', setting);
            const statusPagi = (rawPagi === 'TERLAMBAT' && isDisp) ? 'TEPAT_WAKTU' : rawPagi;
            if (rec.pagi.rowIdx > 0) {
              gerbangUpdates[rec.pagi.rowIdx] = Object.assign({}, gerbangUpdates[rec.pagi.rowIdx] || {}, { timestamp: tstamp, status: statusPagi });
            } else if (rec.pagi.objRef) {
              rec.pagi.objRef.timestamp = tstamp;
              rec.pagi.objRef.status = statusPagi;
            }
            rec.pagi.jam = jamTap;
            rec.pagi.status = statusPagi;
            rekapSiswaQueue.push({ siswa: siswa, tglTap: tglTap, jamTap: jamTap, sesiTap: 'PAGI', statusSiswa: statusPagi, forceOverwrite: true });
            if (statusPagi !== 'TERLAMBAT' && ruleTelat) {
              poinKoreksiQueue.push({ tgl: tglTap, nis: nisStr, alasan: 'Jam masuk awal ' + jamTap + ' WIB (tepat waktu)' });
            }
            diperbaiki++;
          } else {
            dilewati++;
            if (dilewatiDetail.length < 10) dilewatiDetail.push(siswa.nama + ' (Masuk & Pulang ' + tglTap + ' sudah lengkap)');
          }
        }
      } else if (guru) {
        if (!isAktifStatus_(guru.status)) {
          dilewati++;
          if (dilewatiDetail.length < 10) dilewatiDetail.push(guru.nama + ' (akun guru nonaktif)');
          return;
        }
        const keyG = tglTap + '|' + String(guru.id_guru).trim();
        if (!guruLogMap[keyG]) guruLogMap[keyG] = [];
        const listG = guruLogMap[keyG];
        if (listG.some(x => x.jam === jamTap)) {
          dilewati++;
          if (dilewatiDetail.length < 10) dilewatiDetail.push(guru.nama + ' (tap ' + jamTap + ' ' + tglTap + ' sudah ada)');
          return;
        }
        if (listG.length >= 2) {
          // Cek apakah tap baru lebih awal dari jam masuk pertama guru
          listG.sort((a, b) => a.jam.localeCompare(b.jam));
          if (jamTap < listG[0].jam) {
            if (listG[0].rowIdx > 0) {
              guruUpdates[listG[0].rowIdx] = { timestamp: tstamp, jam: jamTap };
            }
            listG[0].jam = jamTap;
            rekapGuruQueue.push({ guru: guru, tglTap: tglTap, jamTap: jamTap });
            diperbaiki++;
          } else {
            dilewati++;
            if (dilewatiDetail.length < 10) dilewatiDetail.push(guru.nama + ' (log guru ' + tglTap + ' sudah lengkap)');
          }
          return;
        }
        if (listG.length === 1) {
          const mFirst = menitDariJam_(listG[0].jam);
          const mNow = menitDariJam_(jamTap);
          if (mFirst >= 0 && mNow >= 0) {
            const diffAbs = Math.abs(mNow - mFirst);
            if (diffAbs < 120) {
              if (mNow < mFirst) {
                // Tap pagi lebih awal dari perangkat lain: perbarui agar jam masuk guru akurat
                if (listG[0].rowIdx > 0) {
                  guruUpdates[listG[0].rowIdx] = { timestamp: tstamp, jam: jamTap };
                }
                listG[0].jam = jamTap;
                rekapGuruQueue.push({ guru: guru, tglTap: tglTap, jamTap: jamTap });
                diperbaiki++;
              } else {
                dilewati++;
                if (dilewatiDetail.length < 10) dilewatiDetail.push(guru.nama + ' (tap ' + jamTap + ' kurang dari 2 jam dari ' + listG[0].jam + ')');
              }
              return;
            }
          }
        }
        listG.push({ rowIdx: -1, jam: jamTap });
        listG.sort((a, b) => a.jam.localeCompare(b.jam));
        objekGuru.push({
          id_log: makeId_('GRH'),
          timestamp: tstamp,
          tanggal: tglTap,
          jam: jamTap,
          id_guru: String(guru.id_guru),
          nama_guru: guru.nama,
          tipe: 'GURU',
          sumber: data.sumber || 'RFID'
        });
        rekapGuruQueue.push({ guru: guru, tglTap: tglTap, jamTap: jamTap });
      } else {
        dilewati++;
        if (dilewatiDetail.length < 10) dilewatiDetail.push('Kode "' + kodeRaw + '" tidak cocok di master server');
      }
    });

    // Terapkan pembaruan baris PRESENSI_GERBANG yang dikoreksi urutannya (multi-perangkat)
    const gerbangUpdKeys = Object.keys(gerbangUpdates);
    if (gerbangUpdKeys.length > 0) {
      const shGerbang = getOrCreateSheet_(ss, SHEET.GERBANG);
      const hG = ensureHeaders_(shGerbang, SHEET.GERBANG).map(h => String(h).trim().toLowerCase());
      const cTs = hG.indexOf('timestamp');
      const cSesi = hG.indexOf('sesi');
      const cStat = hG.indexOf('status');
      gerbangUpdKeys.forEach(rStr => {
        const rIdx = Number(rStr);
        const upd = gerbangUpdates[rStr];
        if (upd.timestamp !== undefined && cTs !== -1) shGerbang.getRange(rIdx, cTs + 1).setNumberFormat('@').setValue(upd.timestamp);
        if (upd.sesi !== undefined && cSesi !== -1) shGerbang.getRange(rIdx, cSesi + 1).setValue(upd.sesi);
        if (upd.status !== undefined && cStat !== -1) shGerbang.getRange(rIdx, cStat + 1).setValue(upd.status);
      });
    }

    if (objekGerbang.length > 0) {
      appendRowsObjects_(SHEET.GERBANG, objekGerbang, ['tanggal', 'nis']);
    }
    if (rekapSiswaQueue.length > 0) {
      prosesRekapSiswaBatch_(shRekapSiswa, rekapSiswaQueue, setting);
    }

    if (poinKoreksiQueue.length > 0 && ruleTelat) {
      terapkanKoreksiPoinMultiPerangkat_(ss, poinKoreksiQueue, ruleTelat.kode);
    }
    if (objekPoinTerlambat.length > 0) {
      appendRowsObjects_(SHEET.POIN, objekPoinTerlambat, ['tanggal', 'nis']);
    }

    const guruUpdKeys = Object.keys(guruUpdates);
    if (guruUpdKeys.length > 0) {
      const shGuruH = getOrCreateSheet_(ss, SHEET.GURU_HADIR);
      const hGh = ensureHeaders_(shGuruH, SHEET.GURU_HADIR).map(h => String(h).trim().toLowerCase());
      const cTs = hGh.indexOf('timestamp');
      const cJam = hGh.indexOf('jam');
      guruUpdKeys.forEach(rStr => {
        const rIdx = Number(rStr);
        const upd = guruUpdates[rStr];
        if (upd.timestamp !== undefined && cTs !== -1) shGuruH.getRange(rIdx, cTs + 1).setNumberFormat('@').setValue(upd.timestamp);
        if (upd.jam !== undefined && cJam !== -1) shGuruH.getRange(rIdx, cJam + 1).setNumberFormat('@').setValue(upd.jam);
      });
    }

    if (objekGuru.length > 0) {
      appendRowsObjects_(SHEET.GURU_HADIR, objekGuru, ['tanggal', 'jam', 'id_guru']);
    }
    if (rekapGuruQueue.length > 0) {
      prosesRekapGuruBatch_(shRekapGuru, rekapGuruQueue);
    }

    // Kirim rangkuman 1 pesan Telegram bila ada siswa terlambat hari ini & fitur aktif
    const hariIniTg = todayStr_();
    const telatHariIniTg = objekGerbang
      .filter(o => o.tanggal === hariIniTg && o.sesi === 'PAGI' && o.status === 'TERLAMBAT')
      .map(o => {
        const pItem = objekPoinTerlambat.find(x => x.nis === o.nis && x.tanggal === o.tanggal);
        return { nama: o.nama, kelas: o.kelas, jam: formatJamSheet(o.timestamp, '-'), potong: pItem ? pItem.poin : 0 };
      });
    if (telatHariIniTg.length > 0) {
      notifTelegramTelatBatch_(setting, telatHariIniTg, sesi.nama);
    }
    if (objekPoinTerlambat.length > 0) {
      objekPoinTerlambat.forEach(pObj => {
        const sSesudah = Number(pObj.saldo_setelah);
        const sSebelum = sSesudah - (Number(pObj.poin) || 0);
        notifTelegramZonaPoin_(setting, { nis: pObj.nis, nama: pObj.nama, kelas: pObj.kelas }, sSebelum, sSesudah, pObj.pasal, pObj.deskripsi, pObj.petugas);
      });
    }

    const totalBaru = objekGerbang.length + objekGuru.length;
    const infoPerbaikan = diperbaiki > 0 ? ', ' + diperbaiki + ' jam masuk/pulang diselaraskan' : '';
    const infoTelat = objekPoinTerlambat.length > 0 ? ', ' + objekPoinTerlambat.length + ' siswa dipotong poin terlambat' : '';
    return {
      ok: true,
      message: 'Sinkronisasi selesai: ' + totalBaru + ' data baru disimpan' + infoPerbaikan + infoTelat + (dilewati ? ', ' + dilewati + ' duplikat/tidak dikenal dilewati.' : '.'),
      data: { siswa: objekGerbang.length, guru: objekGuru.length, diperbaiki: diperbaiki, dilewati: dilewati, potong_terlambat: objekPoinTerlambat.length, dilewati_detail: dilewatiDetail }
    };
  } catch (e) { return { ok: false, message: 'Gagal sinkron: ' + e.message }; }
}

// Jalankan manual dari editor Apps Script untuk menyedot ulang data PRESENSI_GERBANG & PRESENSI_GURU hari ini ke REKAP_SISWA & REKAP_GURU
function SinkronkanRekapHariIni() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const shRekapGuru = getOrCreateSheet_(ss, SHEET.REKAP_GURU);
  const shRekapSiswa = getOrCreateSheet_(ss, SHEET.REKAP_SISWA);
  const hariIni = todayStr_();
  const setting = getPengaturan_(null).data || {};

  const masterSiswa = readAll_(SHEET.SISWA);
  const masterGuru = readAll_(SHEET.GURU);

  // Sedot Siswa (urutkan berdasarkan timestamp/jam)
  const logSiswa = readAll_(SHEET.GERBANG)
    .filter(r => getTanggalBersih_(r.tanggal) === hariIni)
    .sort((a, b) => String(a.timestamp || '').localeCompare(String(b.timestamp || '')));

  logSiswa.forEach(r => {
    const nis = String(r.nis || '').trim();
    const siswa = masterSiswa.find(s => String(s.nis).trim() === nis);
    if (!siswa) return;
    const jam = formatJamSheet(r.jam || r.timestamp, '07:00');
    prosesRekapSiswa_(shRekapSiswa, siswa, hariIni, jam, r.sesi || 'PAGI', setting);
  });

  // Sedot Guru (urutkan berdasarkan jam agar jam_masuk pasti tap paling awal)
  const logGuru = readAll_(SHEET.GURU_HADIR)
    .filter(r => getTanggalBersih_(r.tanggal) === hariIni)
    .sort((a, b) => formatJamSheet(a.jam || a.timestamp, '').localeCompare(formatJamSheet(b.jam || b.timestamp, '')));

  logGuru.forEach(r => {
    const id = String(r.id_guru || '').trim();
    const guru = masterGuru.find(g => String(g.id_guru).trim() === id);
    if (!guru) return;
    const jam = formatJamSheet(r.jam || r.timestamp, '');
    if (jam) prosesRekapGuru_(shRekapGuru, guru, hariIni, jam);
  });
}

// =========================================================
// BOT TELEGRAM GRATIS — PAKET B (NOTIFIKASI + CEK 2 ARAH)
// =========================================================
function tgEsc_(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function tgConfig_(setting) {
  const s = setting || getPengaturan_(null).data || {};
  const aktif = String(s.tg_aktif || 'TIDAK').trim().toUpperCase() === 'YA';
  const token = String(s.tg_bot_token || '').trim();
  const chatPimpinan = String(s.tg_chat_pimpinan || '').trim();
  const chatWali = String(s.tg_chat_walikelas || '').trim();
  const validatorIds = String(s.tg_validator_ids || '').split(/[\s,;]+/).map(x => x.trim()).filter(Boolean);
  return {
    aktif: aktif && Boolean(token),
    rawAktif: aktif,
    token: token,
    chatPimpinan: chatPimpinan,
    chatWali: chatWali,
    notifOsis: String(s.tg_notif_osis || 'YA').trim().toUpperCase() === 'YA',
    notifZona: String(s.tg_notif_zona || 'YA').trim().toUpperCase() === 'YA',
    notifTelat: String(s.tg_notif_telat || 'YA').trim().toUpperCase() === 'YA',
    rekapPagi: String(s.tg_rekap_pagi || 'YA').trim().toUpperCase() === 'YA',
    rekapSore: String(s.tg_rekap_sore || 'YA').trim().toUpperCase() === 'YA',
    perintahAktif: String(s.tg_perintah_aktif || 'YA').trim().toUpperCase() === 'YA',
    validasiAktif: String(s.tg_validasi_aktif || 'YA').trim().toUpperCase() === 'YA',
    validatorIds: validatorIds,
    sekolah: String(s.nama_sekolah || 'SMK Bhakti Kencana Ciawi').trim()
  };
}

function potongHtmlTelegram_(htmlText) {
  let text = String(htmlText || '');
  if (text.length <= 3950) return text;
  const cut = text.slice(0, 3900);
  const lastNl = cut.lastIndexOf('\n');
  const safe = lastNl > 200 ? cut.slice(0, lastNl) : cut.replace(/<[^>]*$/, '');
  return safe + '\n\n<i>…(ringkasan dipotong otomatis agar muat di Telegram)</i>';
}

function kirimTelegram_(botToken, chatId, htmlText, extraOpts) {
  if (!botToken || !chatId || !htmlText) return { ok: false, message: 'Token / Chat ID kosong.' };
  try {
    const body = {
      chat_id: String(chatId).trim(),
      text: potongHtmlTelegram_(htmlText),
      parse_mode: 'HTML',
      disable_web_page_preview: true
    };
    if (extraOpts && extraOpts.reply_markup) body.reply_markup = extraOpts.reply_markup;
    const url = 'https://api.telegram.org/bot' + botToken + '/sendMessage';
    const res = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(body),
      muteHttpExceptions: true
    });
    const parsed = JSON.parse(res.getContentText() || '{}');
    if (parsed.ok) return { ok: true, message: 'Terkirim', result: parsed.result };
    return { ok: false, message: parsed.description || ('HTTP ' + res.getResponseCode()) };
  } catch (e) {
    return { ok: false, message: e.message };
  }
}

function editTelegramMessage_(botToken, chatId, messageId, htmlText, replyMarkup) {
  if (!botToken || !chatId || !messageId) return { ok: false, message: 'Parameter edit kosong.' };
  try {
    const body = {
      chat_id: String(chatId).trim(),
      message_id: Number(messageId),
      text: potongHtmlTelegram_(htmlText),
      parse_mode: 'HTML',
      disable_web_page_preview: true
    };
    if (replyMarkup !== undefined) body.reply_markup = replyMarkup;
    const res = UrlFetchApp.fetch('https://api.telegram.org/bot' + botToken + '/editMessageText', {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(body),
      muteHttpExceptions: true
    });
    const parsed = JSON.parse(res.getContentText() || '{}');
    return parsed.ok ? { ok: true } : { ok: false, message: parsed.description || '' };
  } catch (e) {
    return { ok: false, message: e.message };
  }
}

function jawabCallbackTelegram_(botToken, callbackId, text, showAlert) {
  if (!botToken || !callbackId) return;
  try {
    UrlFetchApp.fetch('https://api.telegram.org/bot' + botToken + '/answerCallbackQuery', {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        callback_query_id: String(callbackId),
        text: String(text || '').slice(0, 195),
        show_alert: Boolean(showAlert)
      }),
      muteHttpExceptions: true
    });
  } catch (_) {}
}

function bangunKartuOsisTelegram_(siswa, items, kronologi, petugasNama, batchId, validasiAktif) {
  const list = items || [];
  const pendingItems = list.filter(it => String(it.status || 'MENUNGGU').toUpperCase() === 'MENUNGGU');
  const headerStatus = pendingItems.length > 0 ? 'MENUNGGU VALIDASI' : 'SELESAI DIVALIDASI';
  const headerIcon = pendingItems.length > 0 ? '🔔' : '✅';
  const daftarPasal = list.map((it, i) => {
    const st = String(it.status || 'MENUNGGU').toUpperCase();
    const badge = st === 'YA' ? '✅ <b>DISETUJUI</b>' : (st === 'DITOLAK' ? '❌ <b>DITOLAK</b>' : '⏳ <i>MENUNGGU</i>');
    const infoExtra = it.info ? ' <i>(' + tgEsc_(it.info) + ')</i>' : '';
    return (i + 1) + '. <b>' + tgEsc_(it.kode) + '</b> — ' + tgEsc_(it.deskripsi) + ' (<code>' + it.poinVal + '</code>) · ' + badge + infoExtra;
  }).join('\n');

  let msg =
    headerIcon + ' <b>LAPORAN OSIS (' + headerStatus + ')</b>\n' +
    '👤 Siswa: <b>' + tgEsc_(siswa.nama) + '</b> (' + tgEsc_(siswa.kelas) + ')\n' +
    '🆔 NIS: <code>' + tgEsc_(siswa.nis) + '</code>\n' +
    '📌 Pelanggaran:\n' + daftarPasal + '\n' +
    '📝 Kronologi: ' + tgEsc_(kronologi || '-') + '\n' +
    '👮 Pelapor: ' + tgEsc_(petugasNama || '-');

  const keyboard = [];
  if (validasiAktif && pendingItems.length > 0) {
    msg += '\n\n<i>Pilah langsung di bawah (Setujui / Tolak) atau lewat menu Kedisiplinan → Validasi OSIS:</i>';
    if (list.length === 1 && pendingItems.length === 1) {
      const it = pendingItems[0];
      keyboard.push([
        { text: '✅ Setujui (' + it.poinVal + ' poin)', callback_data: 'os:A:' + it.id_poin },
        { text: '❌ Tolak Laporan', callback_data: 'os:R:' + it.id_poin }
      ]);
    } else {
      pendingItems.slice(0, 6).forEach(it => {
        keyboard.push([
          { text: '✅ Setujui ' + it.kode + ' (' + it.poinVal + ')', callback_data: 'os:A:' + it.id_poin },
          { text: '❌ Tolak ' + it.kode, callback_data: 'os:R:' + it.id_poin }
        ]);
      });
      if (pendingItems.length > 1 && batchId) {
        keyboard.push([
          { text: '✅ Setujui Semua (' + pendingItems.length + ')', callback_data: 'os:AA:' + batchId },
          { text: '❌ Tolak Semua (' + pendingItems.length + ')', callback_data: 'os:RR:' + batchId }
        ]);
      }
    }
  } else if (pendingItems.length > 0) {
    msg += '\n\n<i>Mohon Guru BK / Waka Kesiswaan memvalidasi di menu Kedisiplinan → Validasi OSIS.</i>';
  }
  return { text: msg, reply_markup: { inline_keyboard: keyboard } };
}

function notifTelegramOsisBaru_(setting, siswa, items, kronologi, petugasNama, batchId) {
  try {
    const cfg = tgConfig_(setting);
    if (!cfg.aktif || !cfg.notifOsis || !cfg.chatPimpinan) return;
    const kartu = bangunKartuOsisTelegram_(siswa, items, kronologi, petugasNama, batchId, cfg.validasiAktif);
    kirimTelegram_(cfg.token, cfg.chatPimpinan, kartu.text, { reply_markup: kartu.reply_markup });
  } catch (_) {}
}

function notifTelegramZonaPoin_(setting, siswa, saldoSebelum, saldoSesudah, pasal, deskripsi, petugasNama) {
  try {
    const cfg = tgConfig_(setting);
    if (!cfg.aktif || !cfg.notifZona || !cfg.chatPimpinan) return;
    const zSebelum = hitungZona_(saldoSebelum, setting);
    const zSesudah = hitungZona_(saldoSesudah, setting);
    if (zSesudah.kode === 'HIJAU') return;
    // Kirim peringatan jika siswa baru masuk/turun zona, atau sudah di zona MERAH/KRITIS
    const pindahZona = (zSebelum.kode !== zSesudah.kode);
    if (!pindahZona && zSesudah.kode !== 'MERAH' && zSesudah.kode !== 'KRITIS') return;
    const icon = (zSesudah.kode === 'KRITIS' || zSesudah.kode === 'MERAH') ? '🚨' : '⚠️';
    const msg =
      icon + ' <b>PERINGATAN ZONA POIN SISWA</b>\n' +
      '👤 Siswa: <b>' + tgEsc_(siswa.nama) + '</b> (' + tgEsc_(siswa.kelas) + ')\n' +
      '🆔 NIS: <code>' + tgEsc_(siswa.nis) + '</code>\n' +
      '📉 Saldo Poin: <b>' + saldoSebelum + ' → ' + saldoSesudah + '</b>\n' +
      '🏷️ Status: <b>Zona ' + tgEsc_(zSesudah.kode) + ' (' + tgEsc_(zSesudah.label) + ')</b>\n' +
      '📌 Pemicu: <code>' + tgEsc_(pasal || '-') + '</code> — ' + tgEsc_(deskripsi || '-') + '\n' +
      '👮 Dicatat oleh: ' + tgEsc_(petugasNama || '-');
    kirimTelegram_(cfg.token, cfg.chatPimpinan, msg);
  } catch (_) {}
}

function notifTelegramTelatBatch_(setting, lateList, petugasNama) {
  try {
    const cfg = tgConfig_(setting);
    if (!cfg.aktif || !cfg.notifTelat || !lateList || !lateList.length) return;
    const targetChat = cfg.chatWali || cfg.chatPimpinan;
    if (!targetChat) return;
    const baris = lateList.slice(0, 25).map((x, i) =>
      (i + 1) + '. <b>' + tgEsc_(x.nama) + '</b> (' + tgEsc_(x.kelas) + ') — <code>' + tgEsc_(x.jam) + ' WIB</code>' +
      (x.potong ? ' <i>[' + x.potong + ' poin]</i>' : '')
    ).join('\n');
    const sisa = lateList.length > 25 ? '\n<i>…dan ' + (lateList.length - 25) + ' siswa lainnya.</i>' : '';
    const msg =
      '⏰ <b>RINGKASAN SISWA TERLAMBAT (' + lateList.length + ' Siswa)</b>\n' +
      '📅 Tanggal: ' + todayStr_() + ' | Piket: ' + tgEsc_(petugasNama || '-') + '\n\n' +
      baris + sisa;
    kirimTelegram_(cfg.token, targetChat, msg);
  } catch (_) {}
}

function kumpulkanDataRekapTelegram_(setting) {
  const hariIni = todayStr_();
  const s = setting || getPengaturan_(null).data || {};
  const siswaAktif = readAll_(SHEET.SISWA).filter(x => isAktifStatus_(x.status));
  const guruAktif = readAll_(SHEET.GURU).filter(x => isAktifStatus_(x.status));
  const gerbangPagi = readAll_(SHEET.GERBANG).filter(r => getTanggalBersih_(r.tanggal) === hariIni && String(r.sesi || 'PAGI').toUpperCase() === 'PAGI');
  const sholatHari = readAll_(SHEET.SHOLAT).filter(r => getTanggalBersih_(r.tanggal) === hariIni);
  const ketHari = readAll_(SHEET.KETERANGAN).filter(r => getTanggalBersih_(r.tanggal) === hariIni);
  const poinAll = readAll_(SHEET.POIN);

  const siswaMap = {};
  siswaAktif.forEach(x => { siswaMap[String(x.nis).trim()] = x; });

  const hadirSet = new Set();
  const tepatSet = new Set();
  const telatList = [];
  const telatSet = new Set();
  gerbangPagi.forEach(r => {
    const n = String(r.nis || '').trim();
    if (!siswaMap[n]) return;
    hadirSet.add(n);
    const st = String(r.status || '').toUpperCase();
    if (st === 'TERLAMBAT') {
      if (!telatSet.has(n)) {
        telatSet.add(n);
        telatList.push({ nis: n, nama: siswaMap[n].nama, kelas: siswaMap[n].kelas, jam: formatJamSheet(r.jam || r.timestamp, '-') });
      }
    } else {
      tepatSet.add(n);
    }
  });
  telatList.sort((a, b) => String(a.kelas).localeCompare(String(b.kelas)) || String(a.jam).localeCompare(String(b.jam)));

  const ketMap = {};
  ketHari.forEach(k => {
    const n = String(k.nis || '').trim();
    if (siswaMap[n]) ketMap[n] = { status: String(k.status || '').toUpperCase(), ket: String(k.keterangan || '') };
  });
  let izin = 0, sakit = 0, alpa = 0;
  const belumList = [];
  siswaAktif.forEach(x => {
    const n = String(x.nis).trim();
    if (hadirSet.has(n)) return;
    if (ketMap[n]) {
      const st = ketMap[n].status;
      if (st === 'IZIN') izin++;
      else if (st === 'SAKIT') sakit++;
      else if (st === 'ALPA') alpa++;
    } else {
      belumList.push({ nis: n, nama: x.nama, kelas: x.kelas });
    }
  });

  // Guru
  const rekapGuruHari = readAll_(SHEET.REKAP_GURU).filter(r => getTanggalBersih_(r.tanggal) === hariIni);
  const logGuruHari = readAll_(SHEET.GURU_HADIR).filter(r => getTanggalBersih_(r.tanggal) === hariIni);
  const guruHadirMap = {};
  rekapGuruHari.forEach(r => {
    const id = String(r.id_guru || '').trim();
    const jm = formatJamSheet(r.jam_masuk, '');
    if (id && jm) guruHadirMap[id] = { masuk: jm, pulang: formatJamSheet(r.jam_pulang, '-') };
  });
  logGuruHari.forEach(r => {
    const id = String(r.id_guru || '').trim();
    const jm = formatJamSheet(r.jam || r.timestamp, '');
    if (id && jm && !guruHadirMap[id]) guruHadirMap[id] = { masuk: jm, pulang: '-' };
  });
  const guruHadirList = [];
  const guruBelumList = [];
  guruAktif.forEach(g => {
    const id = String(g.id_guru || '').trim();
    if (guruHadirMap[id]) guruHadirList.push({ nama: g.nama, masuk: guruHadirMap[id].masuk, pulang: guruHadirMap[id].pulang });
    else guruBelumList.push({ nama: g.nama });
  });

  const sholatUnik = new Set(sholatHari.map(r => String(r.nis || '').trim()).filter(n => siswaMap[n]));
  const pendingOsis = poinAll.filter(r => String(r.divalidasi || '').trim().toUpperCase() === 'MENUNGGU');
  const pelanggaranHari = poinAll.filter(r => getTanggalBersih_(r.tanggal) === hariIni && isPoinSah_(r) && Number(r.poin) < 0 && String(r.pasal || '').toUpperCase() !== 'SALDO_AWAL');
  const prestasiHari = poinAll.filter(r => getTanggalBersih_(r.tanggal) === hariIni && isPoinSah_(r) && Number(r.poin) > 0 && String(r.pasal || '').toUpperCase() !== 'SALDO_AWAL');

  return {
    hariIni: hariIni,
    sekolah: String(s.nama_sekolah || 'SMK Bhakti Kencana Ciawi'),
    totalSiswa: siswaAktif.length,
    hadirCount: hadirSet.size,
    tepatCount: tepatSet.size,
    telatList: telatList,
    izin: izin, sakit: sakit, alpa: alpa,
    belumList: belumList,
    totalGuru: guruAktif.length,
    guruHadirList: guruHadirList,
    guruBelumList: guruBelumList,
    sholatUnik: sholatUnik.size,
    pendingOsis: pendingOsis,
    pelanggaranHari: pelanggaranHari.length,
    prestasiHari: prestasiHari.length
  };
}

function bangunRekapPagiPimpinan_(d) {
  const pctSiswa = d.totalSiswa ? Math.round((d.hadirCount / d.totalSiswa) * 100) : 0;
  const pctGuru = d.totalGuru ? Math.round((d.guruHadirList.length / d.totalGuru) * 100) : 0;
  let txt =
    '📋 <b>REKAP KEHADIRAN PAGI (PIMPINAN &amp; BK)</b>\n' +
    '🏫 ' + tgEsc_(d.sekolah) + ' | 📅 ' + d.hariIni + '\n\n' +
    '👨‍🎓 <b>Siswa Hadir:</b> ' + d.hadirCount + ' / ' + d.totalSiswa + ' (' + pctSiswa + '%)\n' +
    '• Tepat Waktu: <b>' + d.tepatCount + '</b> | Terlambat: <b>' + d.telatList.length + '</b>\n' +
    '• Izin: ' + d.izin + ' | Sakit: ' + d.sakit + ' | Alpa: ' + d.alpa + '\n' +
    '• Belum Ada Kabar: <b>' + d.belumList.length + '</b> siswa\n\n' +
    '👩‍🏫 <b>Guru/Staf Hadir:</b> ' + d.guruHadirList.length + ' / ' + d.totalGuru + ' (' + pctGuru + '%)';

  if (d.guruBelumList.length > 0) {
    txt += '\n⏳ <b>Guru Belum Absen (' + d.guruBelumList.length + '):</b> ' +
      d.guruBelumList.slice(0, 15).map(g => tgEsc_(g.nama)).join(', ') +
      (d.guruBelumList.length > 15 ? ', …' : '');
  }
  if (d.telatList.length > 0) {
    txt += '\n\n⏰ <b>Siswa Terlambat (' + d.telatList.length + '):</b>\n' +
      d.telatList.slice(0, 20).map((t, i) => (i + 1) + '. ' + tgEsc_(t.nama) + ' (' + tgEsc_(t.kelas) + ') — ' + t.jam).join('\n') +
      (d.telatList.length > 20 ? '\n<i>…dan ' + (d.telatList.length - 20) + ' lainnya.</i>' : '');
  }
  if (d.pendingOsis.length > 0) {
    txt += '\n\n🔔 <b>Antrean Validasi OSIS:</b> ' + d.pendingOsis.length + ' laporan menunggu dicek BK/Wakasis.';
  }
  return txt;
}

function bangunRekapPagiWaliKelas_(d) {
  const pctSiswa = d.totalSiswa ? Math.round((d.hadirCount / d.totalSiswa) * 100) : 0;
  let txt =
    '📋 <b>REKAP KEHADIRAN SISWA (WALI KELAS)</b>\n' +
    '🏫 ' + tgEsc_(d.sekolah) + ' | 📅 ' + d.hariIni + '\n\n' +
    '✅ Hadir: <b>' + d.hadirCount + ' / ' + d.totalSiswa + '</b> (' + pctSiswa + '%)\n' +
    '⏰ Terlambat: <b>' + d.telatList.length + '</b> | 📝 Izin/Sakit/Alpa: ' + d.izin + '/' + d.sakit + '/' + d.alpa + '\n' +
    '⚠️ Belum Ada Kabar: <b>' + d.belumList.length + '</b> siswa';

  if (d.telatList.length > 0) {
    txt += '\n\n⏰ <b>Daftar Terlambat:</b>\n' +
      d.telatList.slice(0, 25).map((t, i) => (i + 1) + '. ' + tgEsc_(t.nama) + ' (' + tgEsc_(t.kelas) + ') — ' + t.jam).join('\n');
  }
  if (d.belumList.length > 0) {
    const perKelas = {};
    d.belumList.forEach(b => {
      if (!perKelas[b.kelas]) perKelas[b.kelas] = [];
      perKelas[b.kelas].push(b.nama);
    });
    const kelasKeys = Object.keys(perKelas).sort();
    txt += '\n\n⚠️ <b>Belum Hadir / Belum Ada Keterangan:</b>\n';
    kelasKeys.slice(0, 15).forEach(k => {
      const names = perKelas[k];
      txt += '• <b>' + tgEsc_(k) + ' (' + names.length + '):</b> ' + names.slice(0, 6).map(tgEsc_).join(', ') + (names.length > 6 ? ', …' : '') + '\n';
    });
    txt += '\n<i>Mohon Wali Kelas melengkapi keterangan Izin/Sakit/Alpa di aplikasi BKCSiplin.</i>';
  }
  return txt;
}

function bangunRekapSorePimpinan_(d) {
  const pctSiswa = d.totalSiswa ? Math.round((d.hadirCount / d.totalSiswa) * 100) : 0;
  const pctSholat = d.totalSiswa ? Math.min(100, Math.round((d.sholatUnik / d.totalSiswa) * 100)) : 0;
  let txt =
    '🌇 <b>REKAP PENUTUP HARIAN</b>\n' +
    '🏫 ' + tgEsc_(d.sekolah) + ' | 📅 ' + d.hariIni + '\n\n' +
    '👨‍🎓 Kehadiran Siswa: <b>' + d.hadirCount + ' / ' + d.totalSiswa + '</b> (' + pctSiswa + '%)\n' +
    '• Tepat: ' + d.tepatCount + ' | Telat: ' + d.telatList.length + ' | I/S/A: ' + d.izin + '/' + d.sakit + '/' + d.alpa + '\n' +
    '👩‍🏫 Kehadiran Guru: <b>' + d.guruHadirList.length + ' / ' + d.totalGuru + '</b>\n' +
    '🕌 Partisipasi Sholat: <b>' + d.sholatUnik + ' siswa</b> (' + pctSholat + '%)\n' +
    '⚖️ Kedisiplinan Hari Ini: <b>' + d.pelanggaranHari + '</b> pelanggaran · <b>' + d.prestasiHari + '</b> prestasi';
  if (d.pendingOsis.length > 0) {
    txt += '\n\n🔔 <b>Pengingat:</b> Masih ada <b>' + d.pendingOsis.length + ' laporan OSIS</b> belum divalidasi.';
  }
  return txt;
}

// Fungsi pemicu terjadwal otomatis (pasang 1 klik dari Admin atau menu Triggers Apps Script)
function KirimRekapPagiTelegram() {
  const setting = getPengaturan_(null).data || {};
  const cfg = tgConfig_(setting);
  if (!cfg.aktif || !cfg.rekapPagi) return;
  const d = kumpulkanDataRekapTelegram_(setting);
  // Lewati hari Minggu bila tidak ada aktivitas tap sama sekali (libur)
  const isMinggu = Utilities.formatDate(new Date(), TZ, 'EEE') === 'Sun';
  if (isMinggu && d.hadirCount === 0 && d.guruHadirList.length === 0) return;
  if (cfg.chatPimpinan) kirimTelegram_(cfg.token, cfg.chatPimpinan, bangunRekapPagiPimpinan_(d), {
    reply_markup: { inline_keyboard: [[{ text: '🏫 Lihat Rekap Per Kelas', callback_data: 'kl:LIST' }]] }
  });
  if (cfg.chatWali && cfg.chatWali !== cfg.chatPimpinan) {
    kirimTelegram_(cfg.token, cfg.chatWali, bangunRekapPagiWaliKelas_(d), {
      reply_markup: { inline_keyboard: [[{ text: '🏫 Lihat Detail Per Kelas', callback_data: 'kl:LIST' }]] }
    });
  }
}

function KirimRekapSoreTelegram() {
  const setting = getPengaturan_(null).data || {};
  const cfg = tgConfig_(setting);
  if (!cfg.aktif || !cfg.rekapSore) return;
  const d = kumpulkanDataRekapTelegram_(setting);
  const isMinggu = Utilities.formatDate(new Date(), TZ, 'EEE') === 'Sun';
  if (isMinggu && d.hadirCount === 0 && d.guruHadirList.length === 0) return;
  if (cfg.chatPimpinan) kirimTelegram_(cfg.token, cfg.chatPimpinan, bangunRekapSorePimpinan_(d), {
    reply_markup: { inline_keyboard: [[{ text: '🏫 Lihat Rekap Per Kelas', callback_data: 'kl:LIST' }]] }
  });
}

function PasangTriggerTelegram() {
  HapusTriggerTelegram();
  ScriptApp.newTrigger('KirimRekapPagiTelegram').timeBased().everyDays(1).atHour(8).inTimezone(TZ).create();
  ScriptApp.newTrigger('KirimRekapSoreTelegram').timeBased().everyDays(1).atHour(16).inTimezone(TZ).create();
}

function HapusTriggerTelegram() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => {
    const fn = t.getHandlerFunction();
    if (fn === 'KirimRekapPagiTelegram' || fn === 'KirimRekapSoreTelegram') {
      ScriptApp.deleteTrigger(t);
    }
  });
}

// --- ENDPOINT ADMIN UNTUK PENGATURAN BOT TELEGRAM ---
function tesTelegram_(token, p) {
  try {
    const sesi = verifikasiToken_(token);
    if (!isAdminRole_(sesi.role)) return { ok: false, message: 'Hanya Admin/Pimpinan yang berhak menguji Bot Telegram.' };
    const setting = getPengaturan_(null).data || {};
    const botToken = String((p && p.tg_bot_token) || setting.tg_bot_token || '').trim();
    const chatPimpinan = String((p && p.tg_chat_pimpinan) || setting.tg_chat_pimpinan || '').trim();
    const chatWali = String((p && p.tg_chat_walikelas) || setting.tg_chat_walikelas || '').trim();
    if (!botToken) return { ok: false, message: 'Bot Token Telegram masih kosong.' };
    if (!chatPimpinan) return { ok: false, message: 'Chat ID Grup Pimpinan & BK masih kosong.' };

    const sekolah = String(setting.nama_sekolah || 'SMK Bhakti Kencana Ciawi');
    const r1 = kirimTelegram_(botToken, chatPimpinan, '✅ <b>TES KONEKSI BERHASIL!</b>\nBot <b>BKCSiplin</b> (' + tgEsc_(sekolah) + ') berhasil terhubung ke <b>Grup Pimpinan &amp; BK</b>.\nDiujikan oleh: ' + tgEsc_(sesi.nama));
    if (!r1.ok) return { ok: false, message: 'Gagal kirim ke Grup Pimpinan & BK: ' + r1.message };

    let infoWali = '';
    if (chatWali && chatWali !== chatPimpinan) {
      const r2 = kirimTelegram_(botToken, chatWali, '✅ <b>TES KONEKSI BERHASIL!</b>\nBot <b>BKCSiplin</b> (' + tgEsc_(sekolah) + ') berhasil terhubung ke <b>Grup Wali Kelas</b>.\nDiujikan oleh: ' + tgEsc_(sesi.nama));
      if (!r2.ok) return { ok: false, message: 'Grup Pimpinan OK, tapi gagal kirim ke Grup Wali Kelas: ' + r2.message };
      infoWali = ' & Grup Wali Kelas';
    }
    return { ok: true, message: 'Pesan tes berhasil terkirim ke Grup Pimpinan & BK' + infoWali + '!' };
  } catch (e) { return { ok: false, message: e.message }; }
}

function deteksiChatIdTelegram_(token, p) {
  try {
    const sesi = verifikasiToken_(token);
    if (!isAdminRole_(sesi.role)) return { ok: false, message: 'Hanya Admin/Pimpinan yang berhak.' };
    const setting = getPengaturan_(null).data || {};
    const botToken = String((p && p.tg_bot_token) || setting.tg_bot_token || '').trim();
    if (!botToken) return { ok: false, message: 'Isi Bot Token dari @BotFather terlebih dahulu.' };
    const res = UrlFetchApp.fetch('https://api.telegram.org/bot' + botToken + '/getUpdates?limit=25', { muteHttpExceptions: true });
    const parsed = JSON.parse(res.getContentText() || '{}');
    if (!parsed.ok) {
      const desc = String(parsed.description || '');
      if (desc.toLowerCase().indexOf('webhook') !== -1) {
        return { ok: false, message: 'Webhook 2 arah sedang aktif sehingga Deteksi Otomatis tidak bisa membaca getUpdates. Matikan Webhook sementara atau isi Chat ID manual.' };
      }
      return { ok: false, message: 'Telegram error: ' + desc };
    }
    const chatsMap = {};
    (parsed.result || []).forEach(u => {
      const m = u.message || u.edited_message || u.my_chat_member;
      const ch = m && m.chat;
      if (ch && ch.id !== undefined) {
        chatsMap[String(ch.id)] = {
          id: String(ch.id),
          title: ch.title || [ch.first_name, ch.last_name].filter(Boolean).join(' ') || ch.username || String(ch.id),
          type: ch.type || ''
        };
      }
    });
    const list = Object.values(chatsMap);
    if (!list.length) {
      return { ok: false, message: 'Belum ada grup/chat terdeteksi. Pastikan bot sudah dimasukkan ke grup lalu kirim 1 pesan apa saja (misal "halo") di grup tersebut, lalu klik Deteksi lagi.' };
    }
    return { ok: true, message: 'Ditemukan ' + list.length + ' grup/chat.', data: list };
  } catch (e) { return { ok: false, message: e.message }; }
}

function setWebhookTelegram_(token, p) {
  try {
    const sesi = verifikasiToken_(token);
    if (!isAdminRole_(sesi.role)) return { ok: false, message: 'Hanya Admin/Pimpinan yang berhak.' };
    const setting = getPengaturan_(null).data || {};
    const botToken = String((p && p.tg_bot_token) || setting.tg_bot_token || '').trim();
    if (!botToken) return { ok: false, message: 'Isi Bot Token terlebih dahulu.' };
    const aktif = !(p && p.aktif === false);
    if (!aktif) {
      const rDel = UrlFetchApp.fetch('https://api.telegram.org/bot' + botToken + '/deleteWebhook', { muteHttpExceptions: true });
      const jDel = JSON.parse(rDel.getContentText() || '{}');
      return jDel.ok ? { ok: true, message: 'Webhook 2 arah dimatikan.' } : { ok: false, message: jDel.description || 'Gagal mematikan webhook.' };
    }
    const webhookUrl = String((p && p.webhook_url) || ScriptApp.getService().getUrl() || '').trim();
    if (!webhookUrl) return { ok: false, message: 'URL Web App Apps Script tidak terdeteksi.' };
    const res = UrlFetchApp.fetch('https://api.telegram.org/bot' + botToken + '/setWebhook', {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ url: webhookUrl, allowed_updates: ['message', 'callback_query'], drop_pending_updates: true }),
      muteHttpExceptions: true
    });
    const parsed = JSON.parse(res.getContentText() || '{}');
    if (!parsed.ok) return { ok: false, message: 'Gagal set Webhook: ' + (parsed.description || 'Unknown') };
    // Daftarkan daftar perintah agar muncul otomatis saat mengetik "/" di Telegram
    try {
      UrlFetchApp.fetch('https://api.telegram.org/bot' + botToken + '/setMyCommands', {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify({
          commands: [
            { command: 'rekap', description: 'Ringkasan kehadiran hari ini' },
            { command: 'kelas', description: 'Rekap kehadiran per kelas (pilih tombol)' },
            { command: 'telat', description: 'Daftar siswa terlambat hari ini' },
            { command: 'cek', description: 'Cek siswa: /cek Nama atau NIS' },
            { command: 'guru', description: 'Rekap kehadiran guru (Grup Pimpinan)' },
            { command: 'pending', description: 'Pilah & sahkan laporan OSIS (Grup Pimpinan)' },
            { command: 'id', description: 'Lihat User ID Telegram Anda' },
            { command: 'bantuan', description: 'Daftar perintah Bot BKCSiplin' }
          ]
        }),
        muteHttpExceptions: true
      });
    } catch (_) {}
    return { ok: true, message: 'Perintah 2 arah & tombol interaktif (Webhook) berhasil diaktifkan! Di grup kini tersedia /rekap, /kelas, /telat, /cek, /guru, /pending, /id, serta tombol validasi OSIS.' };
  } catch (e) { return { ok: false, message: e.message }; }
}

function kirimRekapTelegramManual_(token, p) {
  try {
    const sesi = verifikasiToken_(token);
    if (!isAdminRole_(sesi.role)) return { ok: false, message: 'Hanya Admin/Pimpinan yang berhak.' };
    const setting = getPengaturan_(null).data || {};
    const cfg = tgConfig_(setting);
    if (!cfg.token || !cfg.chatPimpinan) return { ok: false, message: 'Simpan Bot Token dan Chat ID Grup terlebih dahulu.' };
    const jenis = String((p && p.jenis) || 'pagi').toLowerCase();
    const d = kumpulkanDataRekapTelegram_(setting);
    const btnKelas = { reply_markup: { inline_keyboard: [[{ text: '🏫 Lihat Rekap Per Kelas', callback_data: 'kl:LIST' }]] } };
    if (jenis === 'sore') {
      const r = kirimTelegram_(cfg.token, cfg.chatPimpinan, bangunRekapSorePimpinan_(d), btnKelas);
      return r.ok ? { ok: true, message: 'Rekap Sore berhasil dikirim ke Grup Pimpinan & BK.' } : { ok: false, message: r.message };
    }
    const r1 = kirimTelegram_(cfg.token, cfg.chatPimpinan, bangunRekapPagiPimpinan_(d), btnKelas);
    if (!r1.ok) return { ok: false, message: 'Gagal kirim: ' + r1.message };
    if (cfg.chatWali && cfg.chatWali !== cfg.chatPimpinan) {
      kirimTelegram_(cfg.token, cfg.chatWali, bangunRekapPagiWaliKelas_(d), btnKelas);
    }
    return { ok: true, message: 'Rekap Pagi berhasil dikirim ke Grup Telegram.' };
  } catch (e) { return { ok: false, message: e.message }; }
}

function aturJadwalTelegram_(token, p) {
  try {
    const sesi = verifikasiToken_(token);
    if (!isAdminRole_(sesi.role)) return { ok: false, message: 'Hanya Admin/Pimpinan yang berhak.' };
    const pasang = !(p && p.aktif === false);
    if (pasang) {
      PasangTriggerTelegram();
      return { ok: true, message: 'Jadwal otomatis Rekap Pagi (08:00 WIB) & Sore (16:00 WIB) berhasil dipasang!' };
    } else {
      HapusTriggerTelegram();
      return { ok: true, message: 'Jadwal otomatis Rekap Pagi & Sore telah dimatikan.' };
    }
  } catch (e) {
    return { ok: false, message: 'Gagal mengatur trigger otomatis: ' + e.message + ' (Anda juga bisa jalankan fungsi PasangTriggerTelegram 1x dari editor Apps Script).' };
  }
}

// --- REKAP PER KELAS INTERAKTIF (/kelas & TOMBOL) ---
function kumpulkanDataPerKelasTelegram_(setting) {
  const hariIni = todayStr_();
  const s = setting || getPengaturan_(null).data || {};
  const siswaAktif = readAll_(SHEET.SISWA).filter(x => isAktifStatus_(x.status));
  const kelasMaster = readAll_(SHEET.KELAS);
  const gerbangPagi = readAll_(SHEET.GERBANG).filter(r => getTanggalBersih_(r.tanggal) === hariIni && String(r.sesi || 'PAGI').toUpperCase() === 'PAGI');
  const sholatHari = readAll_(SHEET.SHOLAT).filter(r => getTanggalBersih_(r.tanggal) === hariIni);
  const ketHari = readAll_(SHEET.KETERANGAN).filter(r => getTanggalBersih_(r.tanggal) === hariIni);

  const waliMap = {};
  kelasMaster.forEach(k => {
    const nm = String(k.nama_kelas || '').trim();
    if (nm) waliMap[nm.toUpperCase()] = String(k.wali_kelas || '').trim();
  });

  const hadirMap = {};
  gerbangPagi.forEach(r => {
    const n = String(r.nis || '').trim();
    if (!n) return;
    if (!hadirMap[n]) {
      hadirMap[n] = {
        status: String(r.status || 'TEPAT_WAKTU').toUpperCase(),
        jam: formatJamSheet(r.jam || r.timestamp, '-')
      };
    }
  });
  const sholatSet = new Set(sholatHari.map(r => String(r.nis || '').trim()).filter(Boolean));
  const ketMap = {};
  ketHari.forEach(k => {
    const n = String(k.nis || '').trim();
    if (n) ketMap[n] = { status: String(k.status || '').toUpperCase(), ket: String(k.keterangan || '').trim() };
  });

  const perKelas = {};
  siswaAktif.forEach(sw => {
    const kls = String(sw.kelas || 'TANPA KELAS').trim();
    if (!perKelas[kls]) {
      perKelas[kls] = {
        kelas: kls,
        wali: waliMap[kls.toUpperCase()] || '-',
        total: 0, hadir: 0, tepat: 0, sholat: 0,
        telat: [], ketList: [], belum: []
      };
    }
    const bucket = perKelas[kls];
    bucket.total++;
    const nis = String(sw.nis || '').trim();
    if (sholatSet.has(nis)) bucket.sholat++;
    if (hadirMap[nis]) {
      bucket.hadir++;
      if (hadirMap[nis].status === 'TERLAMBAT') {
        bucket.telat.push({ nama: sw.nama, jam: hadirMap[nis].jam });
      } else {
        bucket.tepat++;
      }
    } else if (ketMap[nis]) {
      bucket.ketList.push({ nama: sw.nama, status: ketMap[nis].status, ket: ketMap[nis].ket });
    } else {
      bucket.belum.push({ nama: sw.nama });
    }
  });

  const list = Object.values(perKelas).sort((a, b) => a.kelas.localeCompare(b.kelas, 'id'));
  return { hariIni: hariIni, sekolah: String(s.nama_sekolah || 'SMK Bhakti Kencana Ciawi'), list: list };
}

function bangunDaftarKelasTelegram_(setting, filterQuery) {
  const data = kumpulkanDataPerKelasTelegram_(setting);
  const q = String(filterQuery || '').trim().toLowerCase();
  const filtered = q ? data.list.filter(k => k.kelas.toLowerCase().indexOf(q) !== -1) : data.list;

  if (!filtered.length) {
    return {
      text: '❌ Kelas dengan kata kunci <b>' + tgEsc_(filterQuery) + '</b> tidak ditemukan.\nKetik <code>/kelas</code> untuk melihat semua kelas.',
      reply_markup: { inline_keyboard: [[{ text: '🏫 Tampilkan Semua Kelas', callback_data: 'kl:LIST' }]] }
    };
  }
  if (q && filtered.length === 1) {
    return bangunDetailKelasTelegram_(setting, filtered[0].kelas);
  }

  let txt =
    '🏫 <b>REKAP KEHADIRAN PER KELAS</b>\n' +
    '📅 ' + data.hariIni + (q ? ' · Filter: <code>' + tgEsc_(filterQuery) + '</code>' : '') + '\n\n';
  filtered.slice(0, 30).forEach(k => {
    const pct = k.total ? Math.round((k.hadir / k.total) * 100) : 0;
    const icon = pct >= 90 ? '🟢' : (pct >= 75 ? '🟡' : '🔴');
    txt += icon + ' <b>' + tgEsc_(k.kelas) + '</b>: <b>' + k.hadir + '/' + k.total + '</b> (' + pct + '%)' +
      (k.telat.length ? ' · Telat ' + k.telat.length : '') +
      (k.belum.length ? ' · Belum ' + k.belum.length : '') + '\n';
  });
  txt += '\n<i>Klik tombol kelas di bawah untuk melihat rincian nama siswa:</i>';

  const keyboard = [];
  const btnClasses = filtered.slice(0, 24);
  for (let i = 0; i < btnClasses.length; i += 2) {
    const row = [];
    const k1 = btnClasses[i];
    row.push({ text: '📘 ' + k1.kelas, callback_data: 'kl:V:' + k1.kelas.slice(0, 48) });
    if (btnClasses[i + 1]) {
      const k2 = btnClasses[i + 1];
      row.push({ text: '📘 ' + k2.kelas, callback_data: 'kl:V:' + k2.kelas.slice(0, 48) });
    }
    keyboard.push(row);
  }
  keyboard.push([
    { text: '🔄 Refresh', callback_data: 'kl:LIST' },
    { text: '📋 Rekap Sekolah', callback_data: 'kl:REKAP' }
  ]);
  return { text: txt, reply_markup: { inline_keyboard: keyboard } };
}

function bangunDetailKelasTelegram_(setting, kelasKey) {
  const data = kumpulkanDataPerKelasTelegram_(setting);
  const keyLow = String(kelasKey || '').trim().toLowerCase();
  const k = data.list.find(x => x.kelas.toLowerCase() === keyLow) ||
            data.list.find(x => x.kelas.toLowerCase().startsWith(keyLow));
  if (!k) {
    return bangunDaftarKelasTelegram_(setting, '');
  }
  const pct = k.total ? Math.round((k.hadir / k.total) * 100) : 0;
  const izinCnt = k.ketList.filter(x => x.status === 'IZIN').length;
  const sakitCnt = k.ketList.filter(x => x.status === 'SAKIT').length;
  const alpaCnt = k.ketList.filter(x => x.status === 'ALPA').length;

  let txt =
    '📘 <b>DETAIL REKAP KELAS ' + tgEsc_(k.kelas) + '</b>\n' +
    '📅 ' + data.hariIni + ' | 👨‍🏫 Wali Kelas: ' + tgEsc_(k.wali) + '\n\n' +
    '✅ Hadir: <b>' + k.hadir + ' / ' + k.total + '</b> (' + pct + '%)\n' +
    '• Tepat Waktu: <b>' + k.tepat + '</b> | Terlambat: <b>' + k.telat.length + '</b>\n' +
    '• Izin: ' + izinCnt + ' | Sakit: ' + sakitCnt + ' | Alpa: ' + alpaCnt + '\n' +
    '• Belum Ada Kabar: <b>' + k.belum.length + '</b> siswa\n' +
    '• Sholat Tercatat: <b>' + k.sholat + '</b> siswa';

  if (k.telat.length) {
    txt += '\n\n⏰ <b>Terlambat (' + k.telat.length + '):</b>\n' +
      k.telat.slice(0, 20).map((t, i) => (i + 1) + '. ' + tgEsc_(t.nama) + ' (<code>' + tgEsc_(t.jam) + '</code>)').join('\n');
  }
  if (k.ketList.length) {
    txt += '\n\n📝 <b>Izin / Sakit / Alpa (' + k.ketList.length + '):</b>\n' +
      k.ketList.slice(0, 20).map((x, i) => (i + 1) + '. ' + tgEsc_(x.nama) + ' — <b>' + tgEsc_(x.status) + '</b>' + (x.ket ? ' <i>(' + tgEsc_(x.ket) + ')</i>' : '')).join('\n');
  }
  if (k.belum.length) {
    txt += '\n\n⚠️ <b>Belum Ada Kabar (' + k.belum.length + '):</b>\n' +
      k.belum.slice(0, 25).map((b, i) => (i + 1) + '. ' + tgEsc_(b.nama)).join('\n') +
      (k.belum.length > 25 ? '\n<i>…dan ' + (k.belum.length - 25) + ' lainnya.</i>' : '');
  }

  return {
    text: txt,
    reply_markup: {
      inline_keyboard: [[
        { text: '⬅️ Semua Kelas', callback_data: 'kl:LIST' },
        { text: '🔄 Refresh Kelas', callback_data: 'kl:V:' + k.kelas.slice(0, 48) }
      ]]
    }
  };
}

// --- ANTREAN PENDING OSIS INTERAKTIF (/pending) ---
function bangunPesanPendingTelegram_(setting, cfg) {
  const pending = readAll_(SHEET.POIN).filter(r => String(r.divalidasi || '').trim().toUpperCase() === 'MENUNGGU');
  if (!pending.length) {
    return {
      text: '✅ Tidak ada laporan OSIS yang menunggu validasi saat ini.',
      reply_markup: { inline_keyboard: [[{ text: '🔄 Cek Ulang', callback_data: 'op:REF' }]] }
    };
  }
  const tampil = pending.slice(0, 8);
  const listTxt = tampil.map((r, i) =>
    (i + 1) + '. <b>' + tgEsc_(r.nama) + '</b> (' + tgEsc_(r.kelas) + ') — <code>' + tgEsc_(r.pasal) + '</code> (<code>' + r.poin + '</code>)\n' +
    '   <i>' + tgEsc_(r.deskripsi || '-') + '</i> · Pelapor: ' + tgEsc_(r.petugas || '-')
  ).join('\n');

  let txt = '🔔 <b>ANTREAN VALIDASI OSIS (' + pending.length + ')</b>\n\n' + listTxt;
  if (pending.length > tampil.length) {
    txt += '\n\n<i>Menampilkan ' + tampil.length + ' dari ' + pending.length + ' antrean.</i>';
  }
  const keyboard = [];
  if (cfg.validasiAktif) {
    txt += '\n\n<i>Pilah langsung di bawah (Setujui / Tolak):</i>';
    tampil.forEach((r, i) => {
      const namaPendek = String(r.nama || '').split(' ')[0].slice(0, 12);
      const idp = String(r.id_poin || '').trim();
      if (idp && idp.length <= 55) {
        keyboard.push([
          { text: '✅ #' + (i + 1) + ' ' + namaPendek + ' (' + r.pasal + ')', callback_data: 'op:A:' + idp },
          { text: '❌ #' + (i + 1) + ' Tolak', callback_data: 'op:R:' + idp }
        ]);
      }
    });
  } else {
    txt += '\n\n<i>Silakan validasi di halaman Kedisiplinan → Validasi OSIS.</i>';
  }
  keyboard.push([{ text: '🔄 Refresh Antrean', callback_data: 'op:REF' }]);
  return { text: txt, reply_markup: { inline_keyboard: keyboard } };
}

// --- PROSES VALIDASI OSIS DARI TOMBOL TELEGRAM (DENGAN LOCK ANTI KLIK GANDA) ---
function prosesValidasiOsisTelegram_(cfg, setting, actionCode, targetId, fromUser) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    return { ok: false, alertText: 'Server sedang sibuk memproses klik lain. Coba lagi 2 detik.' };
  }
  try {
    const keputusan = (actionCode === 'A' || actionCode === 'AA') ? 'SETUJU' : 'TOLAK';
    const isBatch = (actionCode === 'AA' || actionCode === 'RR');
    const validatorNama = [fromUser && fromUser.first_name, fromUser && fromUser.last_name].filter(Boolean).join(' ').trim() ||
                          (fromUser && fromUser.username ? '@' + fromUser.username : 'BK/Pimpinan');

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = getOrCreateSheet_(ss, SHEET.POIN);
    const headers = ensureHeaders_(sh, SHEET.POIN).map(h => String(h).trim().toLowerCase());
    const d = sh.getDataRange().getValues();
    if (d.length < 2) return { ok: false, alertText: 'Data poin tidak ditemukan.' };

    const iId = headers.indexOf('id_poin');
    const iNis = headers.indexOf('nis');
    const iNama = headers.indexOf('nama');
    const iKelas = headers.indexOf('kelas');
    const iPasal = headers.indexOf('pasal');
    const iDesk = headers.indexOf('deskripsi');
    const iPoin = headers.indexOf('poin');
    const iSaldo = headers.indexOf('saldo_setelah');
    const iPetugas = headers.indexOf('petugas');
    const iValid = headers.indexOf('divalidasi');

    const poinAwal = Number(setting.poin_awal) || 100;
    const saldoMap = {};
    for (let i = 1; i < d.length; i++) {
      const st = String(d[i][iValid] || '').trim().toUpperCase();
      if (st === '' || st === 'YA') {
        const n = String(d[i][iNis] || '').trim();
        if (saldoMap[n] === undefined) saldoMap[n] = poinAwal;
        saldoMap[n] += (Number(d[i][iPoin]) || 0);
      }
    }

    const batchPrefix = isBatch ? targetId : String(targetId || '').replace(/-\d+$/, '');
    const tatibMap = {};
    readAll_(SHEET.TATA_TERTIB).forEach(t => {
      tatibMap[String(t.kode || '').trim().toUpperCase()] = String(t.deskripsi || '').trim();
    });

    const zonaAlertQueue = [];
    let diproses = 0;
    let lastInfo = '';

    for (let i = 1; i < d.length; i++) {
      const idRow = String(d[i][iId !== -1 ? iId : 0] || '').trim();
      const matched = isBatch ? (idRow.indexOf(targetId + '-') === 0) : (idRow === targetId);
      if (!matched) continue;
      const curValid = String(d[i][iValid] || '').trim().toUpperCase();
      if (curValid !== 'MENUNGGU') continue;

      const nis = String(d[i][iNis] || '').trim();
      const nama = iNama !== -1 ? String(d[i][iNama] || nis) : nis;
      const kelas = iKelas !== -1 ? String(d[i][iKelas] || '-') : '-';
      const pasal = iPasal !== -1 ? String(d[i][iPasal] || '') : '';
      const desk = iDesk !== -1 ? String(d[i][iDesk] || '') : '';
      const poinVal = Number(d[i][iPoin]) || 0;
      const origPet = iPetugas !== -1 ? String(d[i][iPetugas] || '').trim() : '';

      if (keputusan === 'SETUJU') {
        const curSaldo = saldoMap[nis] !== undefined ? saldoMap[nis] : poinAwal;
        const newSaldo = curSaldo + poinVal;
        saldoMap[nis] = newSaldo;
        d[i][iSaldo] = newSaldo;
        d[i][iValid] = 'YA';
        d[i][iPetugas] = origPet ? (origPet + ' [✓ TG: ' + validatorNama + ']') : ('TG: ' + validatorNama);
        if (iSaldo !== -1) sh.getRange(i + 1, iSaldo + 1).setValue(newSaldo);
        if (iValid !== -1) sh.getRange(i + 1, iValid + 1).setValue('YA');
        if (iPetugas !== -1) sh.getRange(i + 1, iPetugas + 1).setValue(d[i][iPetugas]);
        lastInfo = 'Saldo ' + nama + ': ' + curSaldo + ' → ' + newSaldo;
        if (newSaldo < curSaldo) {
          zonaAlertQueue.push({
            siswa: { nis: nis, nama: nama, kelas: kelas },
            saldoSebelum: curSaldo, saldoSesudah: newSaldo,
            pasal: pasal, deskripsi: desk, petugas: d[i][iPetugas]
          });
        }
      } else {
        d[i][iValid] = 'DITOLAK';
        d[i][iPetugas] = origPet ? (origPet + ' [✕ TG: ' + validatorNama + ']') : ('✕ TG: ' + validatorNama);
        if (iValid !== -1) sh.getRange(i + 1, iValid + 1).setValue('DITOLAK');
        if (iPetugas !== -1) sh.getRange(i + 1, iPetugas + 1).setValue(d[i][iPetugas]);
        lastInfo = 'Laporan ' + nama + ' (' + pasal + ') ditolak.';
      }
      diproses++;
    }

    // Kumpulkan semua baris saudara dalam batch yang sama untuk pembaruan tampilan kartu
    const siblingItems = [];
    let siswaCard = null;
    let kronologiCard = '';
    let pelaporCard = '';
    for (let i = 1; i < d.length; i++) {
      const idRow = String(d[i][iId !== -1 ? iId : 0] || '').trim();
      const sameBatch = batchPrefix ? (idRow === targetId || idRow.indexOf(batchPrefix + '-') === 0) : (idRow === targetId);
      if (!sameBatch) continue;
      if (!siswaCard) {
        siswaCard = {
          nis: String(d[i][iNis] || ''),
          nama: iNama !== -1 ? String(d[i][iNama] || '') : '',
          kelas: iKelas !== -1 ? String(d[i][iKelas] || '') : ''
        };
        kronologiCard = iDesk !== -1 ? String(d[i][iDesk] || '') : '';
        pelaporCard = (iPetugas !== -1 ? String(d[i][iPetugas] || '') : '').replace(/\s*\[[✓✕].*$/, '').trim();
      }
      const st = String(d[i][iValid] || 'MENUNGGU').trim().toUpperCase();
      const kode = iPasal !== -1 ? String(d[i][iPasal] || '').trim().toUpperCase() : '';
      const petTagMatch = (iPetugas !== -1 ? String(d[i][iPetugas] || '') : '').match(/\[([✓✕][^\]]+)\]/);
      const infoStr = st === 'YA'
        ? ('Saldo: ' + d[i][iSaldo] + (petTagMatch ? ' · ' + petTagMatch[1] : ''))
        : (st === 'DITOLAK' && petTagMatch ? petTagMatch[1] : '');
      siblingItems.push({
        id_poin: idRow,
        kode: kode,
        deskripsi: tatibMap[kode] || kode,
        poinVal: Number(d[i][iPoin]) || 0,
        status: st,
        info: infoStr
      });
    }

    if (diproses > 0) {
      catatAudit_({
        id_guru: 'TG:' + String(fromUser && fromUser.id || ''),
        nama_guru: validatorNama,
        aksi: keputusan === 'SETUJU' ? 'VALIDASI_OSIS_SETUJU_TG' : 'VALIDASI_OSIS_TOLAK_TG',
        modul: 'telegram',
        detail: diproses + ' laporan OSIS (' + targetId + ') ' + keputusan + ' via Telegram'
      });
      zonaAlertQueue.forEach(z => {
        notifTelegramZonaPoin_(setting, z.siswa, z.saldoSebelum, z.saldoSesudah, z.pasal, z.deskripsi, z.petugas);
      });
    }

    const updatedCard = siswaCard
      ? bangunKartuOsisTelegram_(siswaCard, siblingItems, kronologiCard, pelaporCard, batchPrefix, cfg.validasiAktif)
      : null;

    const alertText = diproses > 0
      ? ((keputusan === 'SETUJU' ? '✅ Disetujui (' + diproses + '). ' : '❌ Ditolak (' + diproses + '). ') + lastInfo)
      : 'ℹ️ Laporan ini sudah diproses sebelumnya.';
    return { ok: true, diproses: diproses, alertText: alertText, updatedCard: updatedCard };
  } finally {
    lock.releaseLock();
  }
}

// --- HANDLER PERINTAH 2 ARAH DI GRUP TELEGRAM ---
function handleTelegramWebhook_(update) {
  try {
    // Anti-duplikat: abaikan jika update_id ini sudah pernah diproses
    if (update && update.update_id !== undefined) {
      const cache = CacheService.getScriptCache();
      const cacheKey = 'tg_upd_' + String(update.update_id);
      if (cache.get(cacheKey)) return;
      cache.put(cacheKey, '1', 21600);
    }
    const msg = update.message || update.edited_message;
    if (!msg || !msg.text || !msg.chat) return;
    const setting = getPengaturan_(null).data || {};
    const cfg = tgConfig_(setting);
    if (!cfg.aktif || !cfg.perintahAktif) return;

    const chatId = String(msg.chat.id).trim();
    const isPimpinan = Boolean(cfg.chatPimpinan && chatId === cfg.chatPimpinan);
    const isWali = Boolean(cfg.chatWali && chatId === cfg.chatWali);
    if (!isPimpinan && !isWali) return; // Tolak chat/grup tidak terdaftar secara diam-diam

    const rawText = String(msg.text || '').trim();
    if (!rawText.startsWith('/')) return;
    const parts = rawText.split(/\s+/);
    const cmd = parts[0].split('@')[0].toLowerCase();
    const arg = parts.slice(1).join(' ').trim();

    if (cmd === '/start' || cmd === '/help' || cmd === '/bantuan') {
      let bantuan =
        '🤖 <b>PERINTAH BOT BKCSIPLIN</b>\n\n' +
        '• <code>/rekap</code> — Ringkasan kehadiran hari ini\n' +
        '• <code>/kelas</code> — Rekap kehadiran per kelas (pilih tombol)\n' +
        '• <code>/telat</code> — Daftar siswa terlambat hari ini\n' +
        '• <code>/cek Nama/NIS</code> — Cek kehadiran &amp; poin siswa (contoh: <code>/cek Budi</code>)';
      if (isPimpinan) {
        bantuan +=
          '\n• <code>/guru</code> — Rekap hadir &amp; guru belum absen\n' +
          '• <code>/pending</code> — Pilah &amp; sahkan antrean laporan OSIS';
      }
      bantuan += '\n• <code>/id</code> — Lihat User ID Telegram Anda';
      kirimTelegram_(cfg.token, chatId, bantuan);
      return;
    }

    if (cmd === '/id') {
      const u = msg.from || {};
      const nm = [u.first_name, u.last_name].filter(Boolean).join(' ').trim() || u.username || '-';
      kirimTelegram_(cfg.token, chatId, '🆔 <b>User ID Telegram Anda:</b> <code>' + tgEsc_(u.id || '-') + '</code>\n👤 Nama: ' + tgEsc_(nm) + '\n\n<i>Angka ini bisa ditempel ke kolom "User ID Validator BK/Wakasis" di Admin jika ingin membatasi hak klik tombol validasi OSIS.</i>');
      return;
    }

    if (cmd === '/rekap') {
      const d = kumpulkanDataRekapTelegram_(setting);
      const reply = isPimpinan ? bangunRekapPagiPimpinan_(d) : bangunRekapPagiWaliKelas_(d);
      kirimTelegram_(cfg.token, chatId, reply, {
        reply_markup: { inline_keyboard: [[{ text: '🏫 Lihat Rekap Per Kelas', callback_data: 'kl:LIST' }]] }
      });
      return;
    }

    if (cmd === '/kelas') {
      const resKls = bangunDaftarKelasTelegram_(setting, arg);
      kirimTelegram_(cfg.token, chatId, resKls.text, { reply_markup: resKls.reply_markup });
      return;
    }

    if (cmd === '/telat') {
      const d = kumpulkanDataRekapTelegram_(setting);
      if (!d.telatList.length) {
        kirimTelegram_(cfg.token, chatId, '✅ Belum ada siswa yang tercatat terlambat hari ini (' + d.hariIni + ').');
        return;
      }
      const listTxt = d.telatList.slice(0, 35).map((t, i) =>
        (i + 1) + '. <b>' + tgEsc_(t.nama) + '</b> (' + tgEsc_(t.kelas) + ') — <code>' + t.jam + ' WIB</code>'
      ).join('\n');
      kirimTelegram_(cfg.token, chatId, '⏰ <b>SISWA TERLAMBAT HARI INI (' + d.telatList.length + ')</b>\n📅 ' + d.hariIni + '\n\n' + listTxt);
      return;
    }

    if (cmd === '/guru') {
      if (!isPimpinan) {
        kirimTelegram_(cfg.token, chatId, '🔒 Perintah <code>/guru</code> hanya tersedia di Grup Pimpinan &amp; BK.');
        return;
      }
      const d = kumpulkanDataRekapTelegram_(setting);
      let txt = '👩‍🏫 <b>KEHADIRAN GURU &amp; STAF (' + d.hariIni + ')</b>\n' +
        '✅ Hadir: <b>' + d.guruHadirList.length + ' / ' + d.totalGuru + '</b>\n';
      if (d.guruHadirList.length) {
        txt += '\n<b>Sudah Hadir:</b>\n' + d.guruHadirList.slice(0, 25).map((g, i) =>
          (i + 1) + '. ' + tgEsc_(g.nama) + ' (<code>' + g.masuk + '</code>' + (g.pulang && g.pulang !== '-' ? '–<code>' + g.pulang + '</code>' : '') + ')'
        ).join('\n');
      }
      if (d.guruBelumList.length) {
        txt += '\n\n⏳ <b>Belum Absen (' + d.guruBelumList.length + '):</b>\n' +
          d.guruBelumList.slice(0, 25).map((g, i) => (i + 1) + '. ' + tgEsc_(g.nama)).join('\n');
      }
      kirimTelegram_(cfg.token, chatId, txt);
      return;
    }

    if (cmd === '/pending') {
      if (!isPimpinan) {
        kirimTelegram_(cfg.token, chatId, '🔒 Perintah <code>/pending</code> hanya tersedia di Grup Pimpinan &amp; BK.');
        return;
      }
      const pMsg = bangunPesanPendingTelegram_(setting, cfg);
      kirimTelegram_(cfg.token, chatId, pMsg.text, { reply_markup: pMsg.reply_markup });
      return;
    }

    if (cmd === '/cek') {
      if (!arg || arg.length < 2) {
        kirimTelegram_(cfg.token, chatId, 'ℹ️ Ketik nama atau NIS setelah perintah. Contoh: <code>/cek Budi</code> atau <code>/cek 2024001</code>');
        return;
      }
      const q = arg.toLowerCase();
      const matches = readAll_(SHEET.SISWA).filter(s =>
        isAktifStatus_(s.status) && (String(s.nis).trim().toLowerCase() === q || String(s.nama || '').toLowerCase().indexOf(q) !== -1)
      );
      if (!matches.length) {
        kirimTelegram_(cfg.token, chatId, '❌ Siswa dengan kata kunci <b>' + tgEsc_(arg) + '</b> tidak ditemukan.');
        return;
      }
      if (matches.length > 1 && String(matches[0].nis).trim().toLowerCase() !== q) {
        const pilihan = matches.slice(0, 8).map((s, i) => (i + 1) + '. <b>' + tgEsc_(s.nama) + '</b> (' + tgEsc_(s.kelas) + ') — <code>/cek ' + tgEsc_(s.nis) + '</code>').join('\n');
        kirimTelegram_(cfg.token, chatId, '🔎 Ditemukan ' + matches.length + ' siswa. Pilih salah satu:\n\n' + pilihan);
        return;
      }
      const target = matches.find(s => String(s.nis).trim().toLowerCase() === q) || matches[0];
      const info = getRiwayatSiswaPublik_({ nis: target.nis });
      if (!info.ok || !info.data) {
        kirimTelegram_(cfg.token, chatId, '❌ Gagal mengambil data siswa.');
        return;
      }
      const dt = info.data;
      const hi = dt.hari_ini || {};
      const sholatStr = (hi.sholat && hi.sholat.length) ? hi.sholat.join(', ') : (hi.udzur ? 'Udzur Syar\'i' : 'Belum tercatat');
      const statusHari = hi.jam_masuk && hi.jam_masuk !== '-'
        ? 'Hadir pukul <code>' + hi.jam_masuk + '</code> (' + tgEsc_(hi.status_masuk) + ')' + (hi.jam_pulang && hi.jam_pulang !== '-' ? ', Pulang <code>' + hi.jam_pulang + '</code>' : '')
        : (hi.keterangan_status ? '<b>' + tgEsc_(hi.keterangan_status) + '</b> (' + tgEsc_(hi.keterangan_teks || '-') + ')' : 'Belum tap gerbang');
      const reply =
        '👤 <b>' + tgEsc_(dt.siswa.nama) + '</b> (' + tgEsc_(dt.siswa.kelas) + ')\n' +
        '🆔 NIS: <code>' + tgEsc_(dt.siswa.nis) + '</code>\n\n' +
        '📅 <b>Hari Ini (' + hi.tanggal + '):</b>\n' +
        '• Gerbang: ' + statusHari + '\n' +
        '• Sholat: ' + tgEsc_(sholatStr) + '\n\n' +
        '⭐ <b>Kedisiplinan:</b>\n' +
        '• Saldo Poin: <b>' + dt.saldo_poin + '</b> (Zona ' + tgEsc_(dt.zona.kode) + ' — ' + tgEsc_(dt.zona.label) + ')\n' +
        '• Total Pelanggaran: ' + (dt.ringkasan.pelanggaran || 0) + ' | Prestasi: ' + (dt.ringkasan.prestasi || 0) + '\n' +
        '• Riwayat Hadir: ' + (dt.ringkasan.hadir || 0) + ' hari (Telat: ' + (dt.ringkasan.telat || 0) + ')';
      kirimTelegram_(cfg.token, chatId, reply);
    }
  } catch (_) {}
}

// --- HANDLER TOMBOL INLINE INTERAKTIF (VALIDASI OSIS & REKAP PER KELAS) ---
function handleTelegramCallback_(update) {
  try {
    if (update && update.update_id !== undefined) {
      const cache = CacheService.getScriptCache();
      const cacheKey = 'tg_upd_' + String(update.update_id);
      if (cache.get(cacheKey)) return;
      cache.put(cacheKey, '1', 21600);
    }
    const cq = update.callback_query;
    if (!cq || !cq.id || !cq.message || !cq.message.chat) return;
    const setting = getPengaturan_(null).data || {};
    const cfg = tgConfig_(setting);
    if (!cfg.aktif || !cfg.perintahAktif) {
      jawabCallbackTelegram_(cfg.token, cq.id, 'Bot Telegram sedang dinonaktifkan di Pengaturan Admin.', true);
      return;
    }

    const chatId = String(cq.message.chat.id).trim();
    const messageId = cq.message.message_id;
    const isPimpinan = Boolean(cfg.chatPimpinan && chatId === cfg.chatPimpinan);
    const isWali = Boolean(cfg.chatWali && chatId === cfg.chatWali);
    if (!isPimpinan && !isWali) {
      jawabCallbackTelegram_(cfg.token, cq.id, 'Grup tidak terdaftar.', true);
      return;
    }

    const dataStr = String(cq.data || '').trim();
    const fromUser = cq.from || {};

    // 1. Navigasi Rekap Per Kelas (Tersedia di Grup 1 & Grup 2)
    if (dataStr === 'kl:LIST') {
      const resKls = bangunDaftarKelasTelegram_(setting, '');
      editTelegramMessage_(cfg.token, chatId, messageId, resKls.text, resKls.reply_markup);
      jawabCallbackTelegram_(cfg.token, cq.id, 'Daftar kelas diperbarui', false);
      return;
    }
    if (dataStr === 'kl:REKAP') {
      const d = kumpulkanDataRekapTelegram_(setting);
      const reply = isPimpinan ? bangunRekapPagiPimpinan_(d) : bangunRekapPagiWaliKelas_(d);
      editTelegramMessage_(cfg.token, chatId, messageId, reply, {
        inline_keyboard: [[{ text: '🏫 Lihat Rekap Per Kelas', callback_data: 'kl:LIST' }]]
      });
      jawabCallbackTelegram_(cfg.token, cq.id, 'Kembali ke rekap sekolah', false);
      return;
    }
    if (dataStr.indexOf('kl:V:') === 0) {
      const kelasKey = dataStr.slice(5);
      const det = bangunDetailKelasTelegram_(setting, kelasKey);
      editTelegramMessage_(cfg.token, chatId, messageId, det.text, det.reply_markup);
      jawabCallbackTelegram_(cfg.token, cq.id, 'Menampilkan kelas ' + kelasKey, false);
      return;
    }

    // 2. Refresh & Validasi OSIS (KHUSUS Grup 1 Pimpinan & BK)
    if (dataStr === 'op:REF' || dataStr.indexOf('os:') === 0 || dataStr.indexOf('op:') === 0) {
      if (!isPimpinan) {
        jawabCallbackTelegram_(cfg.token, cq.id, '🔒 Fitur validasi OSIS hanya tersedia di Grup Pimpinan & BK.', true);
        return;
      }
      if (dataStr === 'op:REF') {
        const pMsg = bangunPesanPendingTelegram_(setting, cfg);
        editTelegramMessage_(cfg.token, chatId, messageId, pMsg.text, pMsg.reply_markup);
        jawabCallbackTelegram_(cfg.token, cq.id, 'Antrean diperbarui', false);
        return;
      }
      if (!cfg.validasiAktif) {
        jawabCallbackTelegram_(cfg.token, cq.id, '🔒 Validasi OSIS lewat tombol Telegram sedang dimatikan di Pengaturan Admin.', true);
        return;
      }
      // Pengaman opsional User ID Validator (jika diisi di Admin)
      if (cfg.validatorIds.length > 0 && !cfg.validatorIds.includes(String(fromUser.id || '').trim())) {
        jawabCallbackTelegram_(cfg.token, cq.id, '🔒 Hanya Guru BK / Waka Kesiswaan yang terdaftar di Pengaturan Admin yang berhak menyetujui/menolak.', true);
        return;
      }

      const parts = dataStr.split(':');
      const prefix = parts[0]; // 'os' atau 'op'
      const act = parts[1];    // 'A', 'R', 'AA', 'RR'
      const targetId = parts.slice(2).join(':');
      if (!['A', 'R', 'AA', 'RR'].includes(act) || !targetId) {
        jawabCallbackTelegram_(cfg.token, cq.id, 'Data tombol tidak valid.', true);
        return;
      }

      const hasil = prosesValidasiOsisTelegram_(cfg, setting, act, targetId, fromUser);
      jawabCallbackTelegram_(cfg.token, cq.id, hasil.alertText || 'Selesai', !hasil.ok || hasil.diproses === 0);

      if (prefix === 'op') {
        const pMsg = bangunPesanPendingTelegram_(setting, cfg);
        editTelegramMessage_(cfg.token, chatId, messageId, pMsg.text, pMsg.reply_markup);
      } else if (hasil.updatedCard) {
        editTelegramMessage_(cfg.token, chatId, messageId, hasil.updatedCard.text, hasil.updatedCard.reply_markup);
      }
      return;
    }

    jawabCallbackTelegram_(cfg.token, cq.id, 'Aksi tidak dikenal.', false);
  } catch (e) {
    try {
      const cq = update && update.callback_query;
      const cfg = tgConfig_(getPengaturan_(null).data || {});
      if (cq && cq.id && cfg.token) jawabCallbackTelegram_(cfg.token, cq.id, 'Gagal memproses: ' + e.message, true);
    } catch (_) {}
  }
}
