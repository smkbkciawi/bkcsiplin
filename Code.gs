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
  MASTER_SISWA: ['nis', 'nama', 'kelas', 'jk', 'status', 'uid_rfid', 'foto_url', 'tgl_daftar', 'catatan'],
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
    if (e && e.postData && e.postData.contents) {
      try {
        const parsed = JSON.parse(e.postData.contents);
        Object.assign(params, parsed);
      } catch (err) {}
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
    else if (action === 'getSiswaBolosSholat') result = getSiswaBolosSholat_(token, payload);
    else if (action === 'validasiBolosSholat') result = validasiBolosSholat_(token, payload);

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
    String(g.status).trim().toUpperCase() === 'AKTIF'
  );

  if (!guru) return { ok: false, message: 'ID/PIN salah atau akun nonaktif.' };

  const rolesArr = String(guru.role).toUpperCase().split(',').map(r => r.trim());
  const izin = {
    gerbang: ['GURU_PIKET', 'SUPER_ADMIN'],
    sholat: ['GURU_PIKET', 'GURU_BK', 'WALI_KELAS', 'KEPSEK', 'SUPER_ADMIN'],
    disiplin: ['GURU_BK', 'WAKA_KESISWAAN', 'SUPER_ADMIN', 'KEPSEK'],
    admin: ['SUPER_ADMIN', 'KEPSEK', 'GURU_BK', 'WAKA_KESISWAAN', 'WALI_KELAS']
  };

  const boleh = izin[modul] ? rolesArr.some(r => izin[modul].includes(r)) : false;
  if (!boleh) return { ok: false, message: 'Role Anda (' + guru.role + ') tidak berhak membuka modul ' + modul + '.' };

  const token = Utilities.getUuid();
  const sesi = { id_guru: guru.id_guru, nama: guru.nama, role: guru.role, modul: modul };
  CacheService.getScriptCache().put('sess_' + token, JSON.stringify(sesi), 21600);

  catatAudit_({ id_guru: guru.id_guru, nama_guru: guru.nama, aksi: 'LOGIN', modul: modul, detail: 'Login sukses' });
  return { ok: true, message: 'Login berhasil', data: { token: token, nama: sesi.nama, role: sesi.role } };
}

function heartbeat_(token) { try { verifikasiToken_(token); return { ok: true, message: 'OK' }; } catch (e) { return { ok: false, message: e.message }; } }

// --- KETERANGAN ABSEN ---
function simpanKeteranganAbsen_(token, p) {
  try {
    const sesi = verifikasiToken_(token);
    const rolesArr = String(sesi.role).toUpperCase().split(',').map(r => r.trim());
    const nis = String(p.nis || '').trim();
    const tanggal = String(p.tanggal || '').trim();
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

    appendRow_(SHEET.KETERANGAN, {
      id_keterangan: makeId_('KET'), tanggal: tanggal, nis: nis, nama: siswa.nama, kelas: siswa.kelas,
      status: status, keterangan: keterangan, dicatat_oleh: sesi.nama, timestamp: nowStr_()
    }, ['tanggal', 'nis']);
    return { ok: true, message: 'Keterangan ' + status + ' untuk ' + siswa.nama + ' disimpan.' };
  } catch (e) { return { ok: false, message: e.message }; }
}

function getKeteranganAbsen_(token, p) {
  try {
    verifikasiToken_(token);
    const tanggal = String(p.tanggal || todayStr_());
    const kelas = String(p.kelas || '');
    let data = readAll_(SHEET.KETERANGAN).filter(r => getTanggalBersih_(r.tanggal) === tanggal);
    if (kelas) data = data.filter(r => String(r.kelas) === kelas);
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
      .filter(s => String(s.status).toUpperCase() === 'AKTIF')
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

    const setting = getPengaturan_(null).data;
    const poinAwalSiswa = Number(setting.poin_awal) || 100;

    const siswaKelas = readAll_(SHEET.SISWA).filter(s => String(s.status).toUpperCase() === 'AKTIF' && kelasAmpu.includes(String(s.kelas).trim()));
    const nisKelas = siswaKelas.map(s => String(s.nis));
    const gerbangHariIni = readAll_(SHEET.GERBANG).filter(r => getTanggalBersih_(r.tanggal) === hariIni && String(r.sesi).toUpperCase() === 'PAGI' && nisKelas.includes(String(r.nis)));
    const keteranganHariIni = readAll_(SHEET.KETERANGAN).filter(r => getTanggalBersih_(r.tanggal) === hariIni && nisKelas.includes(String(r.nis)));
    const poinAll = readAll_(SHEET.POIN).filter(r => nisKelas.includes(String(r.nis)));
    const saldo = {}; siswaKelas.forEach(s => saldo[String(s.nis)] = poinAwalSiswa);
    poinAll.forEach(p => { if (saldo[String(p.nis)] !== undefined) saldo[String(p.nis)] += (Number(p.poin) || 0); });
    const zonaMerah = Object.keys(saldo).filter(nis => saldo[nis] <= 25).length;

    const hadir = new Set(); const tepat = new Set(); const telat = new Set();
    gerbangHariIni.forEach(r => {
      const n = String(r.nis);
      hadir.add(n);
      const st = String(r.status).toUpperCase();
      if (st === 'TEPAT_WAKTU' || st === 'HADIR') tepat.add(n);
      else if (st === 'TERLAMBAT') telat.add(n);
    });
    const izin = keteranganHariIni.filter(r => String(r.status).toUpperCase() === 'IZIN').length;
    const sakit = keteranganHariIni.filter(r => String(r.status).toUpperCase() === 'SAKIT').length;
    const alpa = keteranganHariIni.filter(r => String(r.status).toUpperCase() === 'ALPA').length;

    return { ok: true, data: {
      kelas_ampu: kelasAmpu,
      total_siswa: siswaKelas.length,
      hadir_gerbang: hadir.size,
      izin: izin, sakit: sakit, alpa: alpa,
      zona_merah: zonaMerah,
      ketepatan: { tepat_waktu: tepat.size, terlambat: telat.size, tidak_hadir: Math.max(0, siswaKelas.length - hadir.size - izin - sakit - alpa) }
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
      return roles.includes('WALI_KELAS') || roles.includes('GURU') || roles.includes('GURU_BK');
    }).map(g => ({ id_guru: g.id_guru, nama: g.nama, role: g.role }));
    return { ok: true, data: list };
  } catch (e) { return { ok: false, message: e.message }; }
}

function tambahGuru_(token, p) {
  try {
    verifikasiToken_(token);
    appendRow_(SHEET.GURU, { id_guru: p.id_guru, nama: p.nama, pin: p.pin, role: p.role, status: 'AKTIF', no_hp: p.no_hp || '', uid_rfid: '' }, ['id_guru', 'pin', 'no_hp']);
    return { ok: true, message: 'Guru ditambahkan.' };
  } catch (e) { return { ok: false, message: e.message }; }
}

function editGuru_(token, p) {
  try {
    verifikasiToken_(token);
    const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET.GURU);
    const d = sh.getDataRange().getValues(); const headers = d[0].map(h => String(h).trim());
    for (let i = 1; i < d.length; i++) {
      if (String(d[i][0]) === String(p.id_guru)) {
        d[i][headers.indexOf('nama')] = p.nama;
        d[i][headers.indexOf('role')] = p.role;
        if (p.pin) d[i][headers.indexOf('pin')] = p.pin;
        d[i][headers.indexOf('no_hp')] = p.no_hp || '';
        d[i][headers.indexOf('status')] = p.status;
        sh.getRange(i + 1, 1, 1, headers.length).setValues([d[i]]);
        break;
      }
    }
    return { ok: true, message: 'Guru diperbarui.' };
  } catch (e) { return { ok: false, message: e.message }; }
}

function getGuruTanpaRfid_(token) { try { verifikasiToken_(token); return { ok: true, data: readAll_(SHEET.GURU).filter(g => !g.uid_rfid) }; } catch (e) { return { ok: false, message: e.message }; } }

function daftarRfidGuru_(token, p) {
  try {
    verifikasiToken_(token);
    const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET.GURU);
    const d = sh.getDataRange().getValues(); const headers = d[0].map(h => String(h).trim());
    const idxUid = headers.indexOf('uid_rfid');
    for (let i = 1; i < d.length; i++) {
      if (String(d[i][0]) === String(p.id_guru)) {
        d[i][idxUid] = normalisasiUid_(p.uid_rfid);
        sh.getRange(i + 1, idxUid + 1).setNumberFormat('@');
        sh.getRange(i + 1, 1, 1, headers.length).setValues([d[i]]);
        break;
      }
    }
    return { ok: true, message: 'Kartu guru didaftarkan.' };
  } catch (e) { return { ok: false, message: e.message }; }
}

// --- PENCARIAN & PRESENSI GABUNGAN ---
function searchOrang_(token, p) {
  try {
    verifikasiToken_(token); const q = String(p.q || '').trim().toLowerCase();
    if (q.length < 2) return { ok: false, message: 'Minimal 2 karakter.' };
    let hasil = [];
    readAll_(SHEET.SISWA).filter(s => String(s.status).toUpperCase() === 'AKTIF').filter(s => String(s.nis).toLowerCase().includes(q) || String(s.nama).toLowerCase().includes(q)).slice(0, 10).forEach(s => hasil.push({ id: s.nis, nama: s.nama, kelas: s.kelas, tipe: 'SISWA' }));
    readAll_(SHEET.GURU).filter(g => String(g.status).toUpperCase() === 'AKTIF').filter(g => String(g.id_guru).toLowerCase().includes(q) || String(g.nama).toLowerCase().includes(q)).slice(0, 10).forEach(g => hasil.push({ id: g.id_guru, nama: g.nama, kelas: String(g.role || '').replace(/,/g, ' / '), tipe: 'GURU' }));
    return { ok: true, data: hasil };
  } catch (e) { return { ok: false, message: e.message }; }
}

function searchOrangPublik_(p) {
  try {
    const q = String(p.q || '').trim().toLowerCase();
    if (q.length < 2) return { ok: false, message: 'Minimal 2 karakter.' };
    let hasil = [];
    readAll_(SHEET.SISWA).filter(s => String(s.status).toUpperCase() === 'AKTIF').filter(s =>
      String(s.nis).toLowerCase().includes(q) || String(s.nama).toLowerCase().includes(q)
    ).slice(0, 10).forEach(s => hasil.push({ id: s.nis, nama: s.nama, kelas: s.kelas, tipe: 'SISWA' }));
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
function prosesRekapSiswa_(sh, siswa, tgl, jam, sesiTap, setting) {
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
  const statusVal = hitungStatusSiswa_(jam, sesiUpper, setting || {});

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
      if (!jm) {
        if (cMasuk !== -1) sh.getRange(r, cMasuk + 1).setNumberFormat('@').setValue(jamTap);
        if (cStatus !== -1) sh.getRange(r, cStatus + 1).setValue('HADIR');
        SpreadsheetApp.flush();
        return;
      }
      if (jamTap !== jm) {
        if (cPulang !== -1) sh.getRange(r, cPulang + 1).setNumberFormat('@').setValue(jamTap);
        const p1 = jm.split(':').map(Number);
        const p2 = jamTap.split(':').map(Number);
        if (!isNaN(p1[0]) && !isNaN(p2[0])) {
          let diff = ((p2[0] * 60) + (p2[1] || 0)) - ((p1[0] * 60) + (p1[1] || 0));
          if (diff < 0) diff = 0;
          if (cTotal !== -1) sh.getRange(r, cTotal + 1).setNumberFormat('@').setValue(Math.floor(diff / 60) + ' Jam ' + (diff % 60) + ' Mnt');
        }
        if (cStatus !== -1 && !data[i][cStatus]) sh.getRange(r, cStatus + 1).setValue('HADIR');
        SpreadsheetApp.flush();
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
    const statusSiswa = hitungStatusSiswa_(jamNow, sesiSiswa, setting);

    appendRow_(SHEET.GERBANG, {
      id_log: makeId_('GRB'), timestamp: now, tanggal: hariIni,
      nis: siswa.nis, nama: siswa.nama, kelas: siswa.kelas,
      tipe: 'SISWA', sesi: sesiSiswa, status: statusSiswa,
      petugas: petugas.nama, sumber: sumber
    }, ['tanggal', 'nis']);

    const shRekapSiswa = getOrCreateSheet_(ss, SHEET.REKAP_SISWA);
    prosesRekapSiswa_(shRekapSiswa, siswa, hariIni, jamNow, sesiSiswa, setting);

    return {
      ok: true,
      message: siswa.nama + ' (' + (sesiSiswa === 'PAGI' ? 'Masuk' : 'Pulang') + ')',
      data: {
        nama: siswa.nama,
        kelas: siswa.kelas,
        jam: jamNow,
        sesi: sesiSiswa,
        status: statusSiswa,
        status_detail: statusSiswa
      }
    };
  } catch (e) { return { ok: false, message: e.message }; }
}

function presensiSholat_(token, p) {
  try {
    const petugas = verifikasiToken_(token); const kode = String(p.kode || '').trim(); const waktu = String(p.waktu_sholat || '').toUpperCase();
    if (!kode || !waktu) return { ok: false, message: 'Data tidak lengkap.' };
    const semua = readAll_(SHEET.SISWA);
    const siswa = semua.find(s => String(s.nis).trim() === kode) || semua.find(s => normalisasiUid_(s.uid_rfid) === normalisasiUid_(kode));
    if (!siswa) return { ok: false, message: 'NIS/Kartu tidak terdaftar.' };
    if (String(siswa.status).toUpperCase() !== 'AKTIF') return { ok: false, message: 'Siswa nonaktif.' };

    const hariIni = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');

    const udzur = readAll_(SHEET.UDZUR).find(u => String(u.nis).trim() === String(siswa.nis).trim() && getTanggalBersih_(u.tgl_mulai) <= hariIni && getTanggalBersih_(u.tgl_selesai) >= hariIni);
    if (udzur) return { ok: true, message: siswa.nama + ' (Udzur)', data: { nis: siswa.nis, nama: siswa.nama, kelas: siswa.kelas, status: 'UDZUR', waktu: waktu } };

    const log = readAll_(SHEET.SHOLAT).find(r => String(r.nis).trim() === String(siswa.nis).trim() && getTanggalBersih_(r.tanggal) === hariIni && String(r.waktu_sholat).toUpperCase() === waktu);
    if (log) return { ok: false, message: 'Sudah tercatat ' + waktu + ' hari ini.' };

    appendRow_(SHEET.SHOLAT, {
      id_log: makeId_('SHL'), timestamp: nowStr_(), tanggal: hariIni,
      nis: siswa.nis, nama: siswa.nama, kelas: siswa.kelas,
      waktu_sholat: waktu, status: 'HADIR', petugas: petugas.nama, sumber: String(p.sumber || 'QR')
    }, ['tanggal', 'nis']);
    return { ok: true, message: siswa.nama + ' Hadir ' + waktu, data: { nis: siswa.nis, nama: siswa.nama, kelas: siswa.kelas, status: 'HADIR', waktu: waktu } };
  } catch (e) { return { ok: false, message: e.message }; }
}

function simpanUdzur_(token, p) { try { const petugas = verifikasiToken_(token); const nis = String(p.nis || '').trim(); const tglMulai = String(p.tgl_mulai || '').trim(); const tglSelesai = String(p.tgl_selesai || '').trim(); if (!nis || !tglMulai || !tglSelesai) return { ok: false, message: 'Data tidak lengkap.' }; const siswa = readAll_(SHEET.SISWA).find(s => String(s.nis).trim() === nis); if (!siswa) return { ok: false, message: 'Siswa tidak ditemukan.' }; appendRow_(SHEET.UDZUR, { id_udzur: makeId_('UDZ'), nis: nis, nama: siswa.nama, tgl_mulai: tglMulai, tgl_selesai: tglSelesai, alasan: p.alasan || 'Udzur', dicatat_oleh: petugas.nama, timestamp: nowStr_() }, ['nis', 'tgl_mulai', 'tgl_selesai']); return { ok: true, message: 'Udzur ' + siswa.nama + ' dicatat.' }; } catch (e) { return { ok: false, message: e.message }; } }
function getUdzurAktif_(token) { try { verifikasiToken_(token); const hariIni = todayStr_(); return { ok: true, data: readAll_(SHEET.UDZUR).filter(u => getTanggalBersih_(u.tgl_selesai) >= hariIni).map(u => ({ _row: u._row, nis: u.nis, nama: u.nama, tgl_mulai: u.tgl_mulai, tgl_selesai: u.tgl_selesai, alasan: u.alasan })) }; } catch (e) { return { ok: false, message: e.message }; } }
function hapusUdzur_(token, p) { try { verifikasiToken_(token); SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET.UDZUR).deleteRow(p.row); return { ok: true, message: 'Udzur dihapus.' }; } catch (e) { return { ok: false, message: e.message }; } }

// --- POIN BK ---
function catatPoin_(token, p) {
  try {
    const petugas = verifikasiToken_(token);
    const nis = String(p.nis || '').trim();
    const pasalArray = p.pasal || [];
    const deskripsi = String(p.deskripsi || '').trim();
    if (!nis || !pasalArray.length) return { ok: false, message: 'Data tidak lengkap.' };

    const setting = getPengaturan_(null).data;
    const poinAwal = Number(setting.poin_awal) || 100;

    const siswa = readAll_(SHEET.SISWA).find(s => String(s.nis).trim() === nis);
    if (!siswa) return { ok: false, message: 'Siswa tidak ditemukan.' };

    const poinRows = readAll_(SHEET.POIN).filter(r => String(r.nis).trim() === nis);
    let saldo = poinAwal;
    poinRows.forEach(r => { saldo += (Number(r.poin) || 0); });

    pasalArray.forEach(pasal => {
      const poinVal = Number(pasal.poin) || 0;
      saldo += poinVal;
      appendRow_(SHEET.POIN, {
        id_poin: makeId_('PON'), timestamp: nowStr_(), tanggal: todayStr_(),
        nis: nis, nama: siswa.nama, kelas: siswa.kelas,
        jenis: poinVal > 0 ? 'PRESTASI' : 'PELANGGARAN',
        pasal: pasal.kode, deskripsi: deskripsi || pasal.deskripsi || '',
        poin: poinVal, saldo_setelah: saldo, petugas: petugas.nama, divalidasi: 'YA'
      }, ['tanggal', 'nis']);
    });

    return { ok: true, message: 'Poin tercatat. Saldo akhir: ' + saldo, data: { saldo: saldo } };
  } catch (e) { return { ok: false, message: e.message }; }
}

function getRiwayatPoin_(token, p) {
  try {
    verifikasiToken_(token);
    const nis = String(p.nis || '').trim();
    if (!nis) return { ok: false, message: 'NIS kosong.' };
    const riwayat = readAll_(SHEET.POIN).filter(r => String(r.nis).trim() === nis).sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));
    return { ok: true, data: riwayat };
  } catch (e) { return { ok: false, message: e.message }; }
}

function getRiwayatPoinPublik_(p) {
  try {
    const nis = String(p.nis || '').trim();
    if (!nis) return { ok: false, message: 'NIS kosong.' };
    const riwayat = readAll_(SHEET.POIN).filter(r => String(r.nis).trim() === nis).sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));
    return { ok: true, data: riwayat };
  } catch (e) { return { ok: false, message: e.message }; }
}

function getRiwayatSiswaPublik_(p) {
  try {
    const nis = String(p.nis || '').trim();
    if (!nis) return { ok: false, message: 'NIS kosong.' };
    const siswa = readAll_(SHEET.SISWA).find(s => String(s.nis).trim() === nis);
    if (!siswa) return { ok: false, message: 'Siswa tidak ditemukan.' };
    const infoSiswa = { nis: String(siswa.nis), nama: String(siswa.nama || ''), kelas: String(siswa.kelas || ''), jk: String(siswa.jk || '-') };
    const gerbang = readAll_(SHEET.GERBANG).filter(r => String(r.nis).trim() === nis && String(r.sesi || '').toUpperCase() === 'PAGI').map(r => ({ tanggal: getTanggalBersih_(r.tanggal), jam: formatJamSheet(r.jam || r.timestamp, ''), sesi: String(r.sesi || ''), status: String(r.status || ''), sumber: String(r.sumber || '') })).sort((a, b) => (b.tanggal + b.jam).localeCompare(a.tanggal + a.jam)).slice(0, 30);
    const sholat = readAll_(SHEET.SHOLAT).filter(r => String(r.nis).trim() === nis).map(r => ({ tanggal: getTanggalBersih_(r.tanggal), waktu_sholat: String(r.waktu_sholat || '').toUpperCase(), status: String(r.status || 'HADIR').toUpperCase(), petugas: String(r.petugas || '') })).sort((a, b) => b.tanggal.localeCompare(a.tanggal)).slice(0, 30);
    const keterangan = readAll_(SHEET.KETERANGAN).filter(r => String(r.nis).trim() === nis).map(r => ({ tanggal: getTanggalBersih_(r.tanggal), status: String(r.status || '').toUpperCase(), keterangan: String(r.keterangan || '') })).sort((a, b) => b.tanggal.localeCompare(a.tanggal)).slice(0, 20);
    const poin = readAll_(SHEET.POIN).filter(r => String(r.nis).trim() === nis).map(r => ({ tanggal: getTanggalBersih_(r.tanggal), pasal: String(r.pasal || ''), deskripsi: String(r.deskripsi || ''), jenis: String(r.jenis || ''), poin: Number(r.poin) || 0, petugas: String(r.petugas || '') })).sort((a, b) => b.tanggal.localeCompare(a.tanggal)).slice(0, 30);
    let poinAwal = 100;
    try { const setting = getPengaturan_(null).data; poinAwal = Number(setting.poin_awal) || 100; } catch (_) {}
    let saldo = poinAwal;
    readAll_(SHEET.POIN).filter(r => String(r.nis).trim() === nis).forEach(r => { saldo += Number(r.poin) || 0; });
    return { ok: true, data: { siswa: infoSiswa, gerbang: gerbang, sholat: sholat, keterangan: keterangan, poin: poin, poin_awal: poinAwal, saldo_poin: saldo } };
  } catch (e) { return { ok: false, message: 'Gagal memuat data: ' + e.message }; }
}

// --- VALIDASI BOLOS SHOLAT ---
function getSiswaBolosSholat_(token, p) {
  try {
    verifikasiToken_(token);
    const hariIni = todayStr_();
    const hadirGerbang = readAll_(SHEET.GERBANG).filter(r => getTanggalBersih_(r.tanggal) === hariIni && String(r.sesi).toUpperCase() === 'PAGI').map(r => String(r.nis));
    const hadirSholat = readAll_(SHEET.SHOLAT).filter(r => getTanggalBersih_(r.tanggal) === hariIni).map(r => String(r.nis));
    const udzur = readAll_(SHEET.UDZUR).filter(u => getTanggalBersih_(u.tgl_mulai) <= hariIni && getTanggalBersih_(u.tgl_selesai) >= hariIni).map(u => String(u.nis));
    const semuaSiswa = readAll_(SHEET.SISWA).filter(s => String(s.status).toUpperCase() === 'AKTIF');
    const bolos = semuaSiswa.filter(s =>
      hadirGerbang.includes(String(s.nis)) &&
      !hadirSholat.includes(String(s.nis)) &&
      !udzur.includes(String(s.nis))
    ).map(s => ({ nis: s.nis, nama: s.nama, kelas: s.kelas }));
    return { ok: true, data: bolos };
  } catch (e) { return { ok: false, message: e.message }; }
}

function validasiBolosSholat_(token, p) {
  try {
    const petugas = verifikasiToken_(token);
    const nisList = p.nisList || [];
    if (!nisList.length) return { ok: false, message: 'Tidak ada siswa dipilih.' };

    let count = 0;
    const hariIni = todayStr_();
    const tatib = readAll_(SHEET.TATA_TERTIB).find(t => String(t.kategori).toUpperCase() === 'IBADAH' && String(t.jenis).toUpperCase() === 'PELANGGARAN');
    const poinBolos = tatib ? -Math.abs(Number(tatib.poin) || 10) : -10;
    const pasalKode = tatib ? tatib.kode : 'TT-02';

    const setting = getPengaturan_(null).data;
    const poinAwal = Number(setting.poin_awal) || 100;

    nisList.forEach(nis => {
      const siswa = readAll_(SHEET.SISWA).find(s => String(s.nis).trim() === String(nis).trim());
      if (!siswa) return;
      const poinRows = readAll_(SHEET.POIN).filter(r => String(r.nis).trim() === String(nis).trim());
      let saldo = poinAwal;
      poinRows.forEach(r => { saldo += (Number(r.poin) || 0); });
      saldo += poinBolos;
      appendRow_(SHEET.POIN, {
        id_poin: makeId_('PON'), timestamp: nowStr_(), tanggal: hariIni,
        nis: siswa.nis, nama: siswa.nama, kelas: siswa.kelas,
        jenis: 'PELANGGARAN', pasal: pasalKode, deskripsi: 'Tidak mengikuti sholat berjamaah (validasi BK)',
        poin: poinBolos, saldo_setelah: saldo, petugas: petugas.nama, divalidasi: 'YA'
      }, ['tanggal', 'nis']);
      count++;
    });
    return { ok: true, message: count + ' siswa dipotong poinnya (' + poinBolos + ' per siswa).' };
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
    else if (jenis === 'poin') rawData = readAll_(SHEET.POIN);
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
    const setting = getPengaturan_(null).data;

    const poinAwal = Number(setting.poin_awal) || 100;
    const zKuning = Number(setting.zona_kuning_min) || 51;
    const zOranye = Number(setting.zona_oranye_min) || 26;
    const zMerah = Number(setting.zona_merah_min) || 1;

    const siswa = readAll_(SHEET.SISWA).filter(s => String(s.status).toUpperCase() === 'AKTIF');
    const gerbangHariIni = readAll_(SHEET.GERBANG).filter(r => getTanggalBersih_(r.tanggal) === hariIni && String(r.sesi).toUpperCase() === 'PAGI');
    const sholatHariIni = readAll_(SHEET.SHOLAT).filter(r => getTanggalBersih_(r.tanggal) === hariIni);

    const hadirSet = {}; gerbangHariIni.forEach(r => hadirSet[String(r.nis)] = true);
    const infoBox = { total_siswa: siswa.length, hadir_gerbang: Object.keys(hadirSet).length, partisipasi_sholat: siswa.length ? Math.round((sholatHariIni.length / siswa.length) * 100) : 0, zona_merah: 0 };

    const pelanggaran = readAll_(SHEET.POIN).filter(r => String(r.jenis).toUpperCase() === 'PELANGGARAN' && getTanggalBersih_(r.tanggal).slice(0, 7) === hariIni.slice(0, 7));
    const hitungPasal = {}; pelanggaran.forEach(r => { hitungPasal[r.pasal] = (hitungPasal[r.pasal] || 0) + 1; });
    const topPelanggaran = Object.keys(hitungPasal).map(k => ({ pasal: k, jumlah: hitungPasal[k] })).sort((a, b) => b.jumlah - a.jumlah).slice(0, 5);

    const kelasSholat = {};
    sholatHariIni.forEach(r => { if (!kelasSholat[r.kelas]) kelasSholat[r.kelas] = 0; kelasSholat[r.kelas]++; });
    const raporKelas = Object.keys(kelasSholat).map(k => ({ kelas: k, jumlah: kelasSholat[k] })).sort((a, b) => b.jumlah - a.jumlah);

    const poinRows = readAll_(SHEET.POIN);
    const saldo = {}; siswa.forEach(s => saldo[String(s.nis)] = poinAwal);
    poinRows.forEach(p => { if (saldo[String(p.nis)] !== undefined) saldo[String(p.nis)] += (Number(p.poin) || 0); });

    const zonasi = { hijau: 0, kuning: 0, oranye: 0, merah: 0, kritis: 0 };
    Object.keys(saldo).forEach(nis => {
      const v = saldo[nis];
      if (v >= (zKuning + 25)) zonasi.hijau++;
      else if (v >= zKuning) zonasi.kuning++;
      else if (v >= zOranye) zonasi.oranye++;
      else if (v >= zMerah) zonasi.merah++;
      else zonasi.kritis++;
    });

    const tepat = {}, telat = {};
    gerbangHariIni.forEach(r => {
      const st = String(r.status).toUpperCase();
      if (st === 'TEPAT_WAKTU' || st === 'HADIR') tepat[r.nis] = true;
      else if (st === 'TERLAMBAT') telat[r.nis] = true;
    });
    const ketepatan = { tepat_waktu: Object.keys(tepat).length, terlambat: Object.keys(telat).length, tidak_hadir: Math.max(0, siswa.length - Object.keys(hadirSet).length) };

    return { ok: true, data: { info_box: infoBox, top_pelanggaran: topPelanggaran, zonasi: zonasi, ketepatan: ketepatan, rapor_kelas: raporKelas } };
  } catch (err) { return { ok: false, message: err.message }; }
}

// --- SISWA & KELAS ---
function getMasterSiswa_(token, p) { try { verifikasiToken_(token); return { ok: true, data: readAll_(SHEET.SISWA) }; } catch (err) { return { ok: false, message: err.message }; } }
function tambahSiswa_(token, p) { try { verifikasiToken_(token); appendRow_(SHEET.SISWA, p, ['nis', 'uid_rfid']); return { ok: true, message: 'Siswa ditambahkan.' }; } catch (e) { return { ok: false, message: e.message }; } }
function editSiswa_(token, p) { try { verifikasiToken_(token); const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET.SISWA); const d = sh.getDataRange().getValues(); const headers = d[0].map(h => String(h).trim()); const iNama = headers.indexOf('nama'), iKelas = headers.indexOf('kelas'), iJk = headers.indexOf('jk'), iStatus = headers.indexOf('status'); for (let i = 1; i < d.length; i++) { if (String(d[i][0]) === String(p.nis)) { d[i][iNama !== -1 ? iNama : 1] = p.nama; d[i][iKelas !== -1 ? iKelas : 2] = p.kelas; d[i][iJk !== -1 ? iJk : 3] = p.jk; d[i][iStatus !== -1 ? iStatus : 4] = p.status; sh.getRange(i + 1, 1, 1, headers.length).setValues([d[i]]); break; } } return { ok: true, message: 'Siswa diperbarui.' }; } catch (e) { return { ok: false, message: e.message }; } }
function hapusSiswa_(token, p) { try { verifikasiToken_(token); const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET.SISWA); const d = sh.getDataRange().getValues(); for (let i = 1; i < d.length; i++) { if (String(d[i][0]) === String(p.nis)) { sh.deleteRow(i + 1); break; } } return { ok: true, message: 'Siswa dihapus.' }; } catch (e) { return { ok: false, message: e.message }; } }
function getSiswaTanpaRfid_(token) { try { verifikasiToken_(token); return { ok: true, data: readAll_(SHEET.SISWA).filter(s => !s.uid_rfid) }; } catch (e) { return { ok: false, message: e.message }; } }
function daftarRfid_(token, p) { try { verifikasiToken_(token); const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET.SISWA); const d = sh.getDataRange().getValues(); const headers = d[0].map(h => String(h).trim()); const idxUid = headers.indexOf('uid_rfid'); for (let i = 1; i < d.length; i++) { if (String(d[i][0]) === String(p.nis)) { d[i][idxUid] = normalisasiUid_(p.uid_rfid); sh.getRange(i + 1, idxUid + 1).setNumberFormat('@'); sh.getRange(i + 1, 1, 1, headers.length).setValues([d[i]]); break; } } return { ok: true, message: 'Kartu didaftarkan.' }; } catch (e) { return { ok: false, message: e.message }; } }
function getMasterKelas_(token) { try { verifikasiToken_(token); return { ok: true, data: readAll_(SHEET.KELAS) }; } catch (err) { return { ok: false, message: err.message }; } }
function tambahKelas_(token, p) { try { verifikasiToken_(token); appendRow_(SHEET.KELAS, { id_kelas: p.id_kelas, nama_kelas: p.nama_kelas, tingkat: p.tingkat, jurusan: p.jurusan, wali_kelas: p.wali_kelas, status: 'AKTIF' }); return { ok: true, message: 'Kelas ditambahkan.' }; } catch (err) { return { ok: false, message: err.message }; } }
function editKelas_(token, p) { try { verifikasiToken_(token); const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET.KELAS); const d = sh.getDataRange().getValues(); for (let i = 1; i < d.length; i++) { if (String(d[i][0]) === String(p.id_kelas)) { d[i][1] = p.nama_kelas; d[i][2] = p.tingkat; d[i][3] = p.jurusan; d[i][4] = p.wali_kelas; sh.getRange(i + 1, 1, 1, d[0].length).setValues([d[i]]); break; } } return { ok: true, message: 'Kelas diperbarui.' }; } catch (e) { return { ok: false, message: e.message }; } }
function hapusKelas_(token, p) { try { verifikasiToken_(token); const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET.KELAS); const d = sh.getDataRange().getValues(); for (let i = 1; i < d.length; i++) { if (String(d[i][0]) === String(p.id_kelas)) { sh.deleteRow(i + 1); break; } } return { ok: true, message: 'Kelas dihapus.' }; } catch (e) { return { ok: false, message: e.message }; } }
function getSiswaPerKelas_(token, p) { try { verifikasiToken_(token); return { ok: true, data: readAll_(SHEET.SISWA).filter(s => s.kelas === p.kelas && String(s.status).toUpperCase() === 'AKTIF') }; } catch (err) { return { ok: false, message: err.message }; } }
function prosesNaikKelas_(token, p) { try { verifikasiToken_(token); const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET.SISWA); const data = sh.getDataRange().getValues(); const headers = data[0].map(h => String(h).trim()); const idxKelas = headers.indexOf('kelas'); let count = 0; p.nisList.forEach(nis => { for (let i = 1; i < data.length; i++) { if (String(data[i][0]).trim() === String(nis).trim()) { data[i][idxKelas] = p.kelasTujuan; sh.getRange(i + 1, 1, 1, headers.length).setValues([data[i]]); count++; break; } } }); return { ok: true, message: count + ' siswa berhasil dinaikkan ke ' + p.kelasTujuan }; } catch (err) { return { ok: false, message: err.message }; } }
function prosesLulus_(token, p) { try { verifikasiToken_(token); const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET.SISWA); const data = sh.getDataRange().getValues(); const headers = data[0].map(h => String(h).trim()); const idxStatus = headers.indexOf('status'); let count = 0; p.nisList.forEach(nis => { for (let i = 1; i < data.length; i++) { if (String(data[i][0]).trim() === String(nis).trim()) { data[i][idxStatus] = 'LULUS'; sh.getRange(i + 1, 1, 1, headers.length).setValues([data[i]]); count++; break; } } }); return { ok: true, message: count + ' siswa berhasil diluluskan.' }; } catch (err) { return { ok: false, message: err.message }; } }
function getTataTertib_(token) { try { verifikasiToken_(token); return { ok: true, data: readAll_(SHEET.TATA_TERTIB) }; } catch (err) { return { ok: false, message: err.message }; } }
function tambahTataTertib_(token, p) { try { verifikasiToken_(token); appendRow_(SHEET.TATA_TERTIB, p); return { ok: true, message: 'Tatib ditambahkan.' }; } catch (err) { return { ok: false, message: err.message }; } }
function editTataTertib_(token, p) { try { verifikasiToken_(token); const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET.TATA_TERTIB); const d = sh.getDataRange().getValues(); for (let i = 1; i < d.length; i++) { if (String(d[i][0]) === String(p.kode)) { d[i][1] = p.kategori; d[i][2] = p.deskripsi; d[i][3] = p.poin; d[i][4] = p.jenis; sh.getRange(i + 1, 1, 1, d[0].length).setValues([d[i]]); break; } } return { ok: true, message: 'Tatib diperbarui.' }; } catch (e) { return { ok: false, message: e.message }; } }
function hapusTataTertib_(token, p) { try { verifikasiToken_(token); const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET.TATA_TERTIB); const d = sh.getDataRange().getValues(); for (let i = 1; i < d.length; i++) { if (String(d[i][0]) === String(p.kode)) { sh.deleteRow(i + 1); break; } } return { ok: true, message: 'Tatib dihapus.' }; } catch (e) { return { ok: false, message: e.message }; } }
function getDaftarKelas_(token) { try { verifikasiToken_(token); return { ok: true, data: readAll_(SHEET.KELAS).map(k => k.nama_kelas) }; } catch (e) { return { ok: false, message: e.message }; } }
function getKartuKelas_(token, p) { try { verifikasiToken_(token); return { ok: true, data: readAll_(SHEET.SISWA).filter(s => s.kelas === p.kelas), sekolah: 'SMK Bhakti Kencana Ciawi' }; } catch (e) { return { ok: false, message: e.message }; } }

function getPengaturan_(token) {
  try {
    if (token) verifikasiToken_(token);
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
          const jam = Math.floor(val);
          const menit = Math.round((val - jam) * 60);
          val = String(jam).padStart(2, '0') + ':' + String(menit).padStart(2, '0');
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
      for (let i = 1; i < d.length; i++) {
        if (d[i][0] === k) {
          sh.getRange(i + 1, 2).setValue(p[k]);
          f = true; break;
        }
      }
      if (!f) sh.appendRow([k, p[k], '']);
    }
    return { ok: true, message: 'Disimpan.' };
  } catch (e) { return { ok: false, message: e.message }; }
}

function getJadwalSholat_(token) { try { verifikasiToken_(token); const s = getPengaturan_(token).data; return { ok: true, data: { subuh: s.jam_subuh || '04:30', dzuhur: s.jam_dzuhur || '12:00', ashar: s.jam_ashar || '15:15', maghrib: s.jam_maghrib || '18:00', isya: s.jam_isya || '19:15' } }; } catch (e) { return { ok: false, message: e.message }; } }

// --- IMPORT & RAPORT ---
function normalisasiHeader_(h) {
  const map = { 'nis': 'nis', 'nomor induk siswa': 'nis', 'nomor induk': 'nis', 'no induk': 'nis', 'nama': 'nama', 'nama siswa': 'nama', 'nama lengkap': 'nama', 'nama_lengkap': 'nama', 'kelas': 'kelas', 'rombel': 'kelas', 'jk': 'jk', 'jenis kelamin': 'jk', 'jenis_kelamin': 'jk', 'gender': 'jk', 'status': 'status', 'keterangan': 'status', 'uid_rfid': 'uid_rfid', 'rfid': 'uid_rfid', 'uid': 'uid_rfid', 'kartu': 'uid_rfid', 'no kartu': 'uid_rfid', 'foto_url': 'foto_url', 'foto': 'foto_url', 'url foto': 'foto_url', 'tgl_daftar': 'tgl_daftar', 'tanggal daftar': 'tgl_daftar', 'tgl daftar': 'tgl_daftar', 'catatan': 'catatan', 'keterangan tambahan': 'catatan', 'id_guru': 'id_guru', 'id guru': 'id_guru', 'id': 'id_guru', 'kode guru': 'id_guru', 'nama guru': 'nama', 'pin': 'pin', 'password': 'pin', 'role': 'role', 'jabatan': 'role', 'peran': 'role', 'no_hp': 'no_hp', 'no hp': 'no_hp', 'telepon': 'no_hp', 'hp': 'no_hp', 'kode': 'kode', 'kode tatib': 'kode', 'kategori': 'kategori', 'kategori pelanggaran': 'kategori', 'deskripsi': 'deskripsi', 'uraian': 'deskripsi', 'poin': 'poin', 'nilai poin': 'poin', 'jenis': 'jenis', 'tipe': 'jenis', 'aktif': 'aktif', 'status aktif': 'aktif' };
  const key = String(h || '').trim().toLowerCase().replace(/[_]/g, ' ').replace(/\s+/g, ' ');
  return map[key] || null;
}
function normalisasiRole_(v) {
  if (!v) return '';
  const list = String(v).toUpperCase().split(',').map(r => r.trim()).filter(Boolean);
  const valid = ['SUPER_ADMIN', 'KEPSEK', 'GURU_BK', 'WAKA_KESISWAAN', 'GURU_PIKET', 'WALI_KELAS'];
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
      const obj = { nis: nis, nama: nama, kelas: kelas, jk: String(mapped.jk || '').trim().toUpperCase() || '-', status: String(mapped.status || 'AKTIF').trim().toUpperCase(), uid_rfid: normalisasiUid_(mapped.uid_rfid || ''), foto_url: String(mapped.foto_url || '').trim(), tgl_daftar: String(mapped.tgl_daftar || '').trim(), catatan: String(mapped.catatan || '').trim() };
      if (['AKTIF', 'LULUS', 'KELUAR'].indexOf(obj.status) === -1) obj.status = 'AKTIF';
      if (siswaLama.has(nis)) { gagal++; detailError.push({ baris: nomor, alasan: `NIS ${nis} sudah ada.` }); } else { barisBaru.push(obj); berhasil++; }
    });
    if (barisBaru.length) {
      appendRowsObjects_(SHEET.SISWA, barisBaru, ['nis', 'uid_rfid']);
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

function getRaportSiswa_(token, payload) {
  try {
    verifikasiToken_(token);
    const nis = String(payload.nis || '').trim();
    const mode = String(payload.mode || 'semester').toLowerCase();
    const bulan = String(payload.bulan || '').trim();
    const tahunAjaran = String(payload.tahun_ajaran || '').trim();
    const semester = String(payload.semester || '').trim();
    if (!nis) return { ok: false, message: 'NIS kosong.' };
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheetSiswa = ss.getSheetByName(SHEET.SISWA);
    const finderSiswa = sheetSiswa.createTextFinder(nis).matchEntireCell(true).findNext();
    if (!finderSiswa) return { ok: false, message: 'Siswa tidak ditemukan.' };
    const rowSiswa = finderSiswa.getRow();
    const dataSiswa = sheetSiswa.getRange(rowSiswa, 1, 1, sheetSiswa.getLastColumn()).getValues()[0];
    const headerSiswa = sheetSiswa.getRange(1, 1, 1, sheetSiswa.getLastColumn()).getValues()[0];
    const siswa = {};
    headerSiswa.forEach((h, i) => siswa[h] = dataSiswa[i]);
    const setting = getPengaturan_(null).data;
    const poinAwalSiswa = Number(setting.poin_awal) || 100;
    const namaKepsek = setting.kepala_sekolah || '...............................';
    let namaWali = '...............................';
    const shKelas = ss.getSheetByName(SHEET.KELAS);
    if (shKelas) {
      const finderKelas = shKelas.createTextFinder(String(siswa.kelas).trim()).matchEntireCell(true).findNext();
      if (finderKelas) {
        const rowKelas = finderKelas.getRow();
        const headerKelas = shKelas.getRange(1, 1, 1, shKelas.getLastColumn()).getValues()[0];
        const idxWali = headerKelas.indexOf('wali_kelas');
        if (idxWali !== -1) namaWali = shKelas.getRange(rowKelas, idxWali + 1).getValue() || namaWali;
      }
    }
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
    function ambilDataCepat(sheetName) {
      const sh = ss.getSheetByName(sheetName);
      if (!sh || sh.getLastRow() < 2) return [];
      const finder = sh.createTextFinder(nis).matchEntireCell(true);
      const found = finder.findAll();
      const result = [];
      const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
      found.forEach(f => {
        const row = f.getRow();
        if (row === 1) return;
        const rowData = sh.getRange(row, 1, 1, sh.getLastColumn()).getValues()[0];
        const obj = {};
        headers.forEach((h, i) => obj[h] = rowData[i]);
        result.push(obj);
      });
      return result;
    }
    const gerbang = ambilDataCepat(SHEET.GERBANG);
    const keterangan = ambilDataCepat(SHEET.KETERANGAN);
    const poin = ambilDataCepat(SHEET.POIN);
    const rekapBulanan = {};
    const daftarBulan = [];
    if (mode === 'bulan') daftarBulan.push(bulan);
    else {
      let cur = dari.slice(0, 7);
      while (cur <= sampai.slice(0, 7)) { daftarBulan.push(cur); const [y, m] = cur.split('-').map(Number); const nextM = m === 12 ? 1 : m + 1; const nextY = m === 12 ? y + 1 : y; cur = nextY + '-' + String(nextM).padStart(2, '0'); }
    }
    daftarBulan.forEach(b => { rekapBulanan[b] = { hadir: 0, izin: 0, sakit: 0, alpa: 0 }; });
    gerbang.forEach(r => {
      const tgl = getTanggalBersih_(r.tanggal);
      if (tgl < dari || tgl > sampai) return;
      if (String(r.sesi).toUpperCase() !== 'PAGI') return;
      const b = tgl.slice(0, 7);
      if (rekapBulanan[b]) rekapBulanan[b].hadir++;
    });
    keterangan.forEach(r => {
      const tgl = getTanggalBersih_(r.tanggal);
      if (tgl < dari || tgl > sampai) return;
      const b = tgl.slice(0, 7);
      if (!rekapBulanan[b]) return;
      const st = String(r.status).toUpperCase();
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
    const dataGerbang = readAll_(SHEET.GERBANG).filter(r => getTanggalBersih_(r.tanggal) === tanggal);
    const dataGuru = readAll_(SHEET.GURU_HADIR).filter(r => getTanggalBersih_(r.tanggal) === tanggal);

    const hasil = {};

    dataGerbang.forEach(r => {
      const nis = String(r.nis || '').trim();
      if (!nis) return;
      if (!hasil[nis]) hasil[nis] = { masuk: null, pulang: null };
      const jam = formatJamSheet(r.jam || r.timestamp, '');
      if (String(r.sesi).toUpperCase() === 'PAGI') hasil[nis].masuk = jam;
      if (String(r.sesi).toUpperCase() === 'PULANG') hasil[nis].pulang = jam;
    });

    dataGuru.forEach(r => {
      const id = String(r.id_guru || '').trim();
      if (!id) return;
      if (!hasil[id]) hasil[id] = { masuk: null, pulang: null };
      const jam = formatJamSheet(r.jam || r.timestamp, '');
      if (!hasil[id].masuk) hasil[id].masuk = jam;
      else if (jam && jam !== hasil[id].masuk) hasil[id].pulang = jam;
    });

    const guruPiket = readAll_(SHEET.GURU).filter(g => {
      const role = String(g.role || '').toUpperCase();
      return (role.includes('GURU_PIKET') || role.includes('SUPER_ADMIN')) && String(g.status || '').toUpperCase() === 'AKTIF';
    }).map(g => ({ id: g.id_guru, nama: g.nama }));

    return { ok: true, data: hasil, guruPiket: guruPiket };
  } catch (e) { return { ok: false, message: e.message }; }
}

function sinkronMassalGerbang_(token, p) {
  try {
    const sesi = verifikasiToken_(token);
    const antrean = p.antrean || [];
    if (antrean.length === 0) return { ok: true, message: 'Tidak ada data.' };

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const shRekapGuru = getOrCreateSheet_(ss, SHEET.REKAP_GURU);
    const shRekapSiswa = getOrCreateSheet_(ss, SHEET.REKAP_SISWA);
    const setting = getPengaturan_(null).data || {};

    const masterSiswa = readAll_(SHEET.SISWA);
    const masterGuru = readAll_(SHEET.GURU);

    const objekGerbang = [];
    const objekGuru = [];
    const rekapSiswaQueue = [];
    const rekapGuruQueue = [];

    antrean.forEach(data => {
      let waktuAcuan = new Date();
      if (data.waktu_tap) waktuAcuan = new Date(data.waktu_tap);

      const tglTap = Utilities.formatDate(waktuAcuan, TZ, 'yyyy-MM-dd');
      const jamTap = Utilities.formatDate(waktuAcuan, TZ, 'HH:mm');
      const tstamp = Utilities.formatDate(waktuAcuan, TZ, 'yyyy-MM-dd HH:mm:ss');

      const kodeRaw = String(data.nis || '').trim();
      const kodeNorm = normalisasiUid_(kodeRaw);

      const siswa = masterSiswa.find(s =>
        String(s.nis).trim() === kodeRaw || (s.uid_rfid && normalisasiUid_(s.uid_rfid) === kodeNorm)
      );
      const guru = !siswa ? masterGuru.find(g =>
        String(g.id_guru).trim() === kodeRaw || (g.uid_rfid && normalisasiUid_(g.uid_rfid) === kodeNorm)
      ) : null;

      if (siswa) {
        const sesiTap = String(data.tipe_tap || 'PAGI').toUpperCase();
        const statusSiswa = hitungStatusSiswa_(jamTap, sesiTap, setting);
        objekGerbang.push({
          id_log: makeId_('GRB'),
          timestamp: tstamp,
          tanggal: tglTap,
          nis: String(siswa.nis),
          nama: siswa.nama,
          kelas: siswa.kelas,
          tipe: 'SISWA',
          sesi: sesiTap,
          status: statusSiswa,
          petugas: sesi.nama,
          sumber: data.sumber || 'RFID'
        });
        rekapSiswaQueue.push({ siswa: siswa, tglTap: tglTap, jamTap: jamTap, sesiTap: sesiTap });
      } else if (guru) {
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
      }
    });

    if (objekGerbang.length > 0) {
      appendRowsObjects_(SHEET.GERBANG, objekGerbang, ['tanggal', 'nis']);
      rekapSiswaQueue.forEach(item => {
        prosesRekapSiswa_(shRekapSiswa, item.siswa, item.tglTap, item.jamTap, item.sesiTap, setting);
      });
    }

    if (objekGuru.length > 0) {
      appendRowsObjects_(SHEET.GURU_HADIR, objekGuru, ['tanggal', 'jam', 'id_guru']);
      rekapGuruQueue.forEach(item => {
        prosesRekapGuru_(shRekapGuru, item.guru, item.tglTap, item.jamTap);
      });
    }

    return { ok: true, message: 'Sinkronisasi massal berhasil, Rekap diperbarui.' };
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
