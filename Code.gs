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
    else if (action === 'getRekapPoinSemua') result = getRekapPoinSemua_(token, payload);
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
    sholat: ['GURU_PIKET', 'GURU_BK', 'WAKA_KESISWAAN', 'WALI_KELAS', 'KEPSEK', 'SUPER_ADMIN'],
    disiplin: ['GURU_BK', 'WAKA_KESISWAAN', 'WALI_KELAS', 'SUPER_ADMIN', 'KEPSEK'],
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

    const setting = getPengaturan_(null).data || {};
    const poinAwalSiswa = Number(setting.poin_awal) || 100;
    const zKuning = Number(setting.zona_kuning_min) || 51;
    const zOranye = Number(setting.zona_oranye_min) || 26;
    const zMerah = Number(setting.zona_merah_min) || 1;

    const siswaKelas = readAll_(SHEET.SISWA).filter(s => String(s.status).toUpperCase() === 'AKTIF' && kelasAmpu.includes(String(s.kelas).trim()));
    const nisKelas = siswaKelas.map(s => String(s.nis).trim());
    const nisSet = new Set(nisKelas);
    const gerbangHariIni = readAll_(SHEET.GERBANG).filter(r => getTanggalBersih_(r.tanggal) === hariIni && String(r.sesi).toUpperCase() === 'PAGI' && nisSet.has(String(r.nis).trim()));
    const keteranganHariIni = readAll_(SHEET.KETERANGAN).filter(r => getTanggalBersih_(r.tanggal) === hariIni && nisSet.has(String(r.nis).trim()));
    const poinAll = readAll_(SHEET.POIN).filter(r => nisSet.has(String(r.nis).trim()));

    const saldo = {};
    siswaKelas.forEach(s => { saldo[String(s.nis).trim()] = poinAwalSiswa; });
    poinAll.forEach(p => {
      const n = String(p.nis).trim();
      if (saldo[n] !== undefined) saldo[n] += (Number(p.poin) || 0);
    });

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
        prioritasList.push({ nis: n, nama: s.nama, kelas: s.kelas, saldo: v, zona: zKode, zona_cls: zCls });
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
        telat.add(n);
        siswaTerlambat.push({
          nis: n,
          nama: r.nama,
          kelas: r.kelas,
          jam: formatJamSheet(r.jam || r.timestamp, '-')
        });
      }
    });

    const ketSet = new Set(keteranganHariIni.map(r => String(r.nis).trim()));
    const belumHadir = siswaKelas
      .filter(s => !hadir.has(String(s.nis).trim()) && !ketSet.has(String(s.nis).trim()))
      .map(s => ({ nis: String(s.nis).trim(), nama: s.nama, kelas: s.kelas }));

    const izin = keteranganHariIni.filter(r => String(r.status).toUpperCase() === 'IZIN').length;
    const sakit = keteranganHariIni.filter(r => String(r.status).toUpperCase() === 'SAKIT').length;
    const alpa = keteranganHariIni.filter(r => String(r.status).toUpperCase() === 'ALPA').length;

    return { ok: true, data: {
      kelas_ampu: kelasAmpu,
      total_siswa: siswaKelas.length,
      hadir_gerbang: hadir.size,
      izin: izin, sakit: sakit, alpa: alpa,
      zona_merah: zonaMerah,
      ketepatan: { tepat_waktu: tepat.size, terlambat: telat.size, tidak_hadir: Math.max(0, siswaKelas.length - hadir.size - izin - sakit - alpa) },
      siswa_terlambat: siswaTerlambat,
      siswa_prioritas: prioritasList.slice(0, 12),
      belum_hadir: belumHadir.slice(0, 20),
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

function getGuruTanpaRfid_(token) {
  try {
    verifikasiToken_(token);
    return {
      ok: true,
      data: readAll_(SHEET.GURU).filter(g => String(g.status || 'AKTIF').toUpperCase() === 'AKTIF' && !String(g.uid_rfid || '').trim())
    };
  } catch (e) { return { ok: false, message: e.message }; }
}

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
    verifikasiToken_(token);
    const rawQ = String(p.q || '').trim();
    const q = rawQ.toLowerCase();
    const qUid = normalisasiUid_(rawQ);
    if (q.length < 2) return { ok: false, message: 'Minimal 2 karakter.' };
    let hasil = [];
    readAll_(SHEET.SISWA)
      .filter(s => String(s.status).toUpperCase() === 'AKTIF')
      .filter(s => String(s.nis).toLowerCase().includes(q) || String(s.nama).toLowerCase().includes(q) || (qUid.length >= 4 && normalisasiUid_(s.uid_rfid) === qUid))
      .slice(0, 10)
      .forEach(s => hasil.push({ id: s.nis, nama: s.nama, kelas: s.kelas, tipe: 'SISWA' }));
    readAll_(SHEET.GURU)
      .filter(g => String(g.status).toUpperCase() === 'AKTIF')
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
      .filter(s => String(s.status).toUpperCase() === 'AKTIF')
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
        const p1 = jm.split(':').map(Number);
        const p2 = jamTap.split(':').map(Number);
        if (!isNaN(p1[0]) && !isNaN(p2[0])) {
          const diff = ((p2[0] * 60) + (p2[1] || 0)) - ((p1[0] * 60) + (p1[1] || 0));
          if (diff < 120) return; // Aturan minimal 2 jam sejak tap masuk
          if (cPulang !== -1) sh.getRange(r, cPulang + 1).setNumberFormat('@').setValue(jamTap);
          if (cTotal !== -1) sh.getRange(r, cTotal + 1).setNumberFormat('@').setValue(Math.floor(diff / 60) + ' Jam ' + (diff % 60) + ' Mnt');
          if (cStatus !== -1 && !data[i][cStatus]) sh.getRange(r, cStatus + 1).setValue('HADIR');
          SpreadsheetApp.flush();
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
    const petugas = verifikasiToken_(token);
    const kode = String(p.kode || '').trim();
    const waktu = String(p.waktu_sholat || '').trim().toUpperCase();
    if (!kode || !waktu) return { ok: false, message: 'Data tidak lengkap.' };

    const semua = readAll_(SHEET.SISWA);
    const kodeUid = normalisasiUid_(kode);
    const siswa = semua.find(s => String(s.nis).trim() === kode) ||
                  (kodeUid ? semua.find(s => normalisasiUid_(s.uid_rfid) === kodeUid) : null);
    if (!siswa) return { ok: false, message: 'NIS/Kartu tidak terdaftar.' };
    if (String(siswa.status).toUpperCase() !== 'AKTIF') return { ok: false, message: 'Siswa nonaktif.' };

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
    verifikasiToken_(token);
    const hariIni = todayStr_();
    return {
      ok: true,
      data: readAll_(SHEET.UDZUR)
        .filter(u => getTanggalBersih_(u.tgl_selesai) >= hariIni)
        .map(u => ({
          _row: u._row,
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
    verifikasiToken_(token);
    const row = Number(p.row);
    if (!row || row < 2) return { ok: false, message: 'Baris udzur tidak valid.' };
    const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET.UDZUR);
    if (!sh || row > sh.getLastRow()) return { ok: false, message: 'Data udzur sudah tidak ada.' };
    sh.deleteRow(row);
    return { ok: true, message: 'Udzur dihapus.' };
  } catch (e) { return { ok: false, message: e.message }; }
}

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
    verifikasiToken_(token);
    const nis = String(p.nis || '').trim();
    if (!nis) return { ok: false, message: 'NIS kosong.' };
    const setting = getPengaturan_(null).data || {};
    const poinAwal = Number(setting.poin_awal) || 100;
    const riwayat = readAll_(SHEET.POIN).filter(r => String(r.nis).trim() === nis).sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));
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
    const riwayat = readAll_(SHEET.POIN).filter(r => String(r.nis).trim() === nis).sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));
    let saldo = poinAwal;
    riwayat.forEach(r => { saldo += (Number(r.poin) || 0); });
    return { ok: true, data: riwayat, poin_awal: poinAwal, saldo: saldo, zona: hitungZona_(saldo, setting) };
  } catch (e) { return { ok: false, message: e.message }; }
}

function getRekapPoinSemua_(token, p) {
  try {
    const sesi = verifikasiToken_(token);
    const bolehSemua = isAdminRole_(sesi.role);
    const kelasAmpu = bolehSemua ? [] : getKelasAmpu_(sesi);
    if (!bolehSemua && !kelasAmpu.length) {
      return { ok: true, data: { siswa: [], riwayat_hari_ini: [], kelas_ampu: [], poin_awal: 100, is_admin: false }, message: 'Anda belum ditugaskan sebagai wali kelas mana pun.' };
    }

    const setting = getPengaturan_(null).data || {};
    const poinAwal = Number(setting.poin_awal) || 100;
    const hariIni = todayStr_();

    let siswaAktif = readAll_(SHEET.SISWA).filter(s => String(s.status).toUpperCase() === 'AKTIF');
    if (!bolehSemua && kelasAmpu.length) {
      siswaAktif = siswaAktif.filter(s => kelasAmpu.includes(String(s.kelas).trim()));
    }

    const poinAll = readAll_(SHEET.POIN);
    const stats = {};
    siswaAktif.forEach(s => {
      stats[String(s.nis).trim()] = { saldo: poinAwal, pelanggaran: 0, prestasi: 0 };
    });

    const riwayatHariIni = [];
    poinAll.forEach(r => {
      const nis = String(r.nis).trim();
      const val = Number(r.poin) || 0;
      if (stats[nis]) {
        stats[nis].saldo += val;
        if (val < 0) stats[nis].pelanggaran++;
        else if (val > 0) stats[nis].prestasi++;
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
        is_admin: bolehSemua
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

    // 3. Keterangan Absen (Izin / Sakit / Alpa)
    const semuaKet = readAll_(SHEET.KETERANGAN)
      .filter(r => String(r.nis).trim() === nis)
      .map(r => ({
        tanggal: getTanggalBersih_(r.tanggal),
        status: String(r.status || '').toUpperCase(),
        keterangan: String(r.keterangan || '')
      }))
      .sort((a, b) => b.tanggal.localeCompare(a.tanggal));

    let totalIzin = 0, totalSakit = 0, totalAlpa = 0;
    semuaKet.forEach(k => {
      if (k.status === 'IZIN') totalIzin++;
      else if (k.status === 'SAKIT') totalSakit++;
      else if (k.status === 'ALPA') totalAlpa++;
    });

    // 4. Poin Disiplin & Zona
    const semuaPoin = readAll_(SHEET.POIN)
      .filter(r => String(r.nis).trim() === nis)
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

    const semuaSiswa = readAll_(SHEET.SISWA).filter(s => String(s.status).toUpperCase() === 'AKTIF');
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
    const poinAll = readAll_(SHEET.POIN);
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

    const siswa = readAll_(SHEET.SISWA).filter(s => String(s.status || 'AKTIF').toUpperCase() === 'AKTIF');
    const guruAktif = readAll_(SHEET.GURU).filter(g => String(g.status || 'AKTIF').toUpperCase() === 'AKTIF');
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
        telat[nis] = true;
        siswaTerlambat.push({
          nis: nis,
          nama: r.nama || siswaMap[nis].nama,
          kelas: r.kelas || siswaMap[nis].kelas,
          jam: formatJamSheet(r.jam || r.timestamp, '-')
        });
      }
    });
    siswaTerlambat.sort((a, b) => String(b.jam).localeCompare(String(a.jam)));

    // Keterangan Absen Hari Ini (Izin / Sakit / Alpa)
    const ketMap = {};
    const keteranganList = [];
    let jmlIzin = 0, jmlSakit = 0, jmlAlpa = 0;
    ketHariIni.forEach(r => {
      const nis = String(r.nis || '').trim();
      if (!siswaMap[nis]) return;
      const st = String(r.status || '').toUpperCase();
      if (st === 'IZIN') jmlIzin++;
      else if (st === 'SAKIT') jmlSakit++;
      else if (st === 'ALPA') jmlAlpa++;
      ketMap[nis] = st;
      keteranganList.push({
        nis: nis,
        nama: r.nama || siswaMap[nis].nama,
        kelas: r.kelas || siswaMap[nis].kelas,
        status: st,
        keterangan: r.keterangan || '-'
      });
    });

    let ketBelumTap = 0;
    Object.keys(ketMap).forEach(nis => { if (!hadirSet[nis]) ketBelumTap++; });
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
    const poinRows = readAll_(SHEET.POIN);
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
          zona_cls: zCls
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
function tambahSiswa_(token, p) { try { verifikasiToken_(token); appendRow_(SHEET.SISWA, p, ['nis', 'uid_rfid']); return { ok: true, message: 'Siswa ditambahkan.' }; } catch (e) { return { ok: false, message: e.message }; } }
function editSiswa_(token, p) {
  try {
    verifikasiToken_(token);
    const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET.SISWA);
    const d = sh.getDataRange().getValues();
    const headers = ensureHeaders_(sh, SHEET.SISWA).map(h => String(h).trim().toLowerCase());
    const iNis = headers.indexOf('nis');
    const iNama = headers.indexOf('nama');
    const iKelas = headers.indexOf('kelas');
    const iJk = headers.indexOf('jk');
    const iStatus = headers.indexOf('status');
    const iCatatan = headers.indexOf('catatan');
    for (let i = 1; i < d.length; i++) {
      if (String(d[i][iNis !== -1 ? iNis : 0]).trim() === String(p.nis).trim()) {
        if (iNama !== -1) d[i][iNama] = p.nama;
        if (iKelas !== -1) d[i][iKelas] = p.kelas;
        if (iJk !== -1) d[i][iJk] = p.jk;
        if (iStatus !== -1) d[i][iStatus] = p.status;
        if (iCatatan !== -1 && p.catatan !== undefined) d[i][iCatatan] = p.catatan;
        sh.getRange(i + 1, 1, 1, headers.length).setValues([d[i]]);
        break;
      }
    }
    return { ok: true, message: 'Siswa diperbarui.' };
  } catch (e) { return { ok: false, message: e.message }; }
}
function hapusSiswa_(token, p) { try { verifikasiToken_(token); const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET.SISWA); const d = sh.getDataRange().getValues(); for (let i = 1; i < d.length; i++) { if (String(d[i][0]) === String(p.nis)) { sh.deleteRow(i + 1); break; } } return { ok: true, message: 'Siswa dihapus.' }; } catch (e) { return { ok: false, message: e.message }; } }
function getSiswaTanpaRfid_(token) {
  try {
    verifikasiToken_(token);
    return {
      ok: true,
      data: readAll_(SHEET.SISWA).filter(s => String(s.status || 'AKTIF').toUpperCase() === 'AKTIF' && !String(s.uid_rfid || '').trim())
    };
  } catch (e) { return { ok: false, message: e.message }; }
}
function daftarRfid_(token, p) { try { verifikasiToken_(token); const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET.SISWA); const d = sh.getDataRange().getValues(); const headers = d[0].map(h => String(h).trim()); const idxUid = headers.indexOf('uid_rfid'); for (let i = 1; i < d.length; i++) { if (String(d[i][0]) === String(p.nis)) { d[i][idxUid] = normalisasiUid_(p.uid_rfid); sh.getRange(i + 1, idxUid + 1).setNumberFormat('@'); sh.getRange(i + 1, 1, 1, headers.length).setValues([d[i]]); break; } } return { ok: true, message: 'Kartu didaftarkan.' }; } catch (e) { return { ok: false, message: e.message }; } }
function getMasterKelas_(token) { try { verifikasiToken_(token); return { ok: true, data: readAll_(SHEET.KELAS) }; } catch (err) { return { ok: false, message: err.message }; } }
function tambahKelas_(token, p) { try { verifikasiToken_(token); appendRow_(SHEET.KELAS, { id_kelas: p.id_kelas, nama_kelas: p.nama_kelas, tingkat: p.tingkat, jurusan: p.jurusan, wali_kelas: p.wali_kelas, status: 'AKTIF' }); return { ok: true, message: 'Kelas ditambahkan.' }; } catch (err) { return { ok: false, message: err.message }; } }
function editKelas_(token, p) { try { verifikasiToken_(token); const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET.KELAS); const d = sh.getDataRange().getValues(); for (let i = 1; i < d.length; i++) { if (String(d[i][0]) === String(p.id_kelas)) { d[i][1] = p.nama_kelas; d[i][2] = p.tingkat; d[i][3] = p.jurusan; d[i][4] = p.wali_kelas; sh.getRange(i + 1, 1, 1, d[0].length).setValues([d[i]]); break; } } return { ok: true, message: 'Kelas diperbarui.' }; } catch (e) { return { ok: false, message: e.message }; } }
function hapusKelas_(token, p) { try { verifikasiToken_(token); const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET.KELAS); const d = sh.getDataRange().getValues(); for (let i = 1; i < d.length; i++) { if (String(d[i][0]) === String(p.id_kelas)) { sh.deleteRow(i + 1); break; } } return { ok: true, message: 'Kelas dihapus.' }; } catch (e) { return { ok: false, message: e.message }; } }
function getSiswaPerKelas_(token, p) { try { verifikasiToken_(token); return { ok: true, data: readAll_(SHEET.SISWA).filter(s => s.kelas === p.kelas && String(s.status).toUpperCase() === 'AKTIF') }; } catch (err) { return { ok: false, message: err.message }; } }
function prosesNaikKelas_(token, p) { try { verifikasiToken_(token); const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET.SISWA); const data = sh.getDataRange().getValues(); const headers = data[0].map(h => String(h).trim()); const idxKelas = headers.indexOf('kelas'); let count = 0; p.nisList.forEach(nis => { for (let i = 1; i < data.length; i++) { if (String(data[i][0]).trim() === String(nis).trim()) { data[i][idxKelas] = p.kelasTujuan; sh.getRange(i + 1, 1, 1, headers.length).setValues([data[i]]); count++; break; } } }); return { ok: true, message: count + ' siswa berhasil dinaikkan ke ' + p.kelasTujuan }; } catch (err) { return { ok: false, message: err.message }; } }
function prosesLulus_(token, p) { try { verifikasiToken_(token); const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET.SISWA); const data = sh.getDataRange().getValues(); const headers = data[0].map(h => String(h).trim()); const idxStatus = headers.indexOf('status'); let count = 0; p.nisList.forEach(nis => { for (let i = 1; i < data.length; i++) { if (String(data[i][0]).trim() === String(nis).trim()) { data[i][idxStatus] = 'LULUS'; sh.getRange(i + 1, 1, 1, headers.length).setValues([data[i]]); count++; break; } } }); return { ok: true, message: count + ' siswa berhasil diluluskan.' }; } catch (err) { return { ok: false, message: err.message }; } }
function getTataTertib_(token) { try { verifikasiToken_(token); return { ok: true, data: readAll_(SHEET.TATA_TERTIB) }; } catch (err) { return { ok: false, message: err.message }; } }
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
  const map = { 'nis': 'nis', 'nomor induk siswa': 'nis', 'nomor induk': 'nis', 'no induk': 'nis', 'nama': 'nama', 'nama siswa': 'nama', 'nama lengkap': 'nama', 'nama_lengkap': 'nama', 'kelas': 'kelas', 'rombel': 'kelas', 'jk': 'jk', 'jenis kelamin': 'jk', 'jenis_kelamin': 'jk', 'gender': 'jk', 'status': 'status', 'keterangan': 'status', 'uid_rfid': 'uid_rfid', 'rfid': 'uid_rfid', 'uid': 'uid_rfid', 'kartu': 'uid_rfid', 'no kartu': 'uid_rfid', 'foto_url': 'foto_url', 'foto': 'foto_url', 'url foto': 'foto_url', 'tgl_daftar': 'tgl_daftar', 'tanggal daftar': 'tgl_daftar', 'tgl daftar': 'tgl_daftar', 'catatan': 'catatan', 'keterangan tambahan': 'catatan', 'id_guru': 'id_guru', 'id guru': 'id_guru', 'id': 'id_guru', 'kode guru': 'id_guru', 'nama guru': 'nama', 'pin': 'pin', 'password': 'pin', 'role': 'role', 'jabatan': 'role', 'peran': 'role', 'no_hp': 'no_hp', 'no hp': 'no_hp', 'telepon': 'no_hp', 'hp': 'no_hp', 'kode': 'kode', 'kode tatib': 'kode', 'kategori': 'kategori', 'kategori pelanggaran': 'kategori', 'deskripsi': 'deskripsi', 'uraian': 'deskripsi', 'poin': 'poin', 'nilai poin': 'poin', 'jenis': 'jenis', 'tipe': 'jenis', 'aktif': 'aktif', 'status aktif': 'aktif', 'sisa_poin': 'sisa_poin', 'sisa poin': 'sisa_poin', 'sisa': 'sisa_poin', 'saldo': 'sisa_poin', 'saldo_poin': 'sisa_poin', 'saldo poin': 'sisa_poin', 'saldo_awal': 'sisa_poin', 'saldo awal': 'sisa_poin', 'poin akhir': 'sisa_poin', 'poin_akhir': 'sisa_poin', 'alasan': 'catatan' };
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
    readAll_(SHEET.POIN).forEach(r => {
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
    readAll_(SHEET.POIN).forEach(r => {
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
    const antrean = Array.isArray(p.antrean) ? p.antrean : [];
    if (antrean.length === 0) return { ok: true, message: 'Tidak ada data.' };

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const shRekapGuru = getOrCreateSheet_(ss, SHEET.REKAP_GURU);
    const shRekapSiswa = getOrCreateSheet_(ss, SHEET.REKAP_SISWA);
    const setting = getPengaturan_(null).data || {};

    const masterSiswa = readAll_(SHEET.SISWA);
    const masterGuru = readAll_(SHEET.GURU);

    // Bangun set log yang sudah ada di Sheet agar sinkronisasi ulang/terputus tidak membuat duplikat
    const siswaSesiAda = new Set();
    readAll_(SHEET.GERBANG).forEach(r => {
      const k = getTanggalBersih_(r.tanggal) + '|' + String(r.nis || '').trim() + '|' + String(r.sesi || 'PAGI').toUpperCase();
      siswaSesiAda.add(k);
    });

    const guruLogMap = {};
    readAll_(SHEET.GURU_HADIR).forEach(r => {
      const tgl = getTanggalBersih_(r.tanggal);
      const id = String(r.id_guru || '').trim();
      if (!tgl || !id) return;
      const k = tgl + '|' + id;
      if (!guruLogMap[k]) guruLogMap[k] = [];
      const jm = formatJamSheet(r.jam || r.timestamp, '');
      if (jm) guruLogMap[k].push(jm);
    });

    const objekGerbang = [];
    const objekGuru = [];
    const rekapSiswaQueue = [];
    const rekapGuruQueue = [];
    let dilewati = 0;

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
        const sesiTap = String(data.tipe_tap || 'PAGI').toUpperCase();
        const keyS = tglTap + '|' + String(siswa.nis).trim() + '|' + sesiTap;
        if (siswaSesiAda.has(keyS)) {
          dilewati++;
          return;
        }
        siswaSesiAda.add(keyS);
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
        const keyG = tglTap + '|' + String(guru.id_guru).trim();
        if (!guruLogMap[keyG]) guruLogMap[keyG] = [];
        if (guruLogMap[keyG].length >= 2 || guruLogMap[keyG].includes(jamTap)) {
          dilewati++;
          return;
        }
        guruLogMap[keyG].push(jamTap);
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

    const totalBaru = objekGerbang.length + objekGuru.length;
    return {
      ok: true,
      message: 'Sinkronisasi selesai: ' + totalBaru + ' data baru disimpan' + (dilewati ? ', ' + dilewati + ' duplikat/tidak dikenal dilewati.' : '.'),
      data: { siswa: objekGerbang.length, guru: objekGuru.length, dilewati: dilewati }
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
