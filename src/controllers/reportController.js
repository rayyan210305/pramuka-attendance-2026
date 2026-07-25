const { getDatabase } = require('../config/database');
const XLSX = require('xlsx');
const ExcelJS = require('exceljs');

const C = {
  red: 'FF7F1D1D',
  redDark: 'FF5C1515',
  gold: 'FFD9A43F',
  goldLight: 'FFEACF8C',
  white: 'FFFFFFFF',
  brown: 'FF4A2C0A',
  zebra: 'FFFBF2E3',
  line: 'FFDCC29B',
  green: 'FF0D8A2E',
  amber: 'FFB06A00',
  gray: 'FF8A7355'
};

const thinBorder = { style: 'thin', color: { argb: C.line } };

function borderBox() {
  return { top: thinBorder, left: thinBorder, bottom: thinBorder, right: thinBorder };
}

function sanitizeSheetName(name) {
  const cleaned = String(name || '').replace(/[\\\/\?\*\[\]:]/g, '').trim().slice(0, 31);
  return cleaned || 'Pesantren';
}

function safeFileName(name) {
  return String(name || 'rekap').replace(/[^\w\-]+/g, '_').replace(/_+/g, '_').slice(0, 60) || 'rekap';
}

function addSummarySheet(wb, data) {
  const { activity, schools, categories, total, hadir, belum, pct } = data;
  const ws = wb.addWorksheet('Rekap LP3 XVII', {
    properties: { tabColor: { argb: C.gold } },
    views: [{ state: 'visible', showGridLines: false }]
  });
  ws.columns = [
    { width: 7 }, { width: 46 }, { width: 12 }, { width: 10 }, { width: 12 }, { width: 16 }, { width: 4 }
  ];
  ws.pageSetup = { orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0, horizontalCentered: true };

  const merge = (row, from, to) => ws.mergeCells(row, from, row, to);

  ws.getCell(1, 1).value = 'LAPORAN ABSENSI PRAMUKA LP3 XVII 2026';
  merge(1, 1, 7);
  ws.getRow(1).height = 28;

  ws.getCell(2, 1).value = activity.name;
  merge(2, 1, 7);
  ws.getRow(2).height = 20;

  ws.getCell(3, 1).value = `Jenis Kegiatan: ${activity.type}    •    Tanggal: ${activity.date}`;
  merge(3, 1, 7);

  [1, 2, 3].forEach(r => {
    ws.getRow(r).alignment = { horizontal: 'center', vertical: 'middle' };
  });
  styleRange(ws, 1, 1, 1, 7, { fill: C.red, font: { bold: true, size: 16, color: { argb: C.white } } });
  styleRange(ws, 2, 1, 2, 7, { fill: C.goldLight, font: { bold: true, size: 12, color: { argb: C.brown } } });
  styleRange(ws, 3, 1, 3, 7, { font: { size: 10, color: { argb: C.gray } } });

  // STATISTIK UMUM
  const secRow = (r, text) => {
    ws.getCell(r, 1).value = text;
    merge(r, 1, 7);
    styleRange(ws, r, 1, r, 7, { fill: C.gold, font: { bold: true, size: 11, color: { argb: C.brown } } });
    ws.getRow(r).alignment = { vertical: 'middle' };
    ws.getRow(r).height = 20;
  };
  secRow(5, 'STATISTIK UMUM');

  const statsHeader = ['Total Peserta', 'Hadir', 'Belum Hadir', 'Persentase Kehadiran'];
  statsHeader.forEach((h, i) => {
    ws.getCell(6, i + 1).value = h;
    styleRange(ws, 6, i + 1, 6, i + 1, { fill: C.redDark, font: { bold: true, color: { argb: C.white } } });
  });
  const statsValues = [total, hadir, belum, `${pct}%`];
  statsValues.forEach((v, i) => {
    ws.getCell(7, i + 1).value = v;
    styleRange(ws, 7, i + 1, 7, i + 1, { bold: true, center: true });
  });

  const addTable = (startRow, title, headers, rows) => {
    secRow(startRow, title);
    headers.forEach((h, i) => {
      ws.getCell(startRow + 1, i + 1).value = h;
      styleRange(ws, startRow + 1, i + 1, startRow + 1, i + 1, { fill: C.red, font: { bold: true, color: { argb: C.white } } });
    });
    rows.forEach((row, idx) => {
      const r = startRow + 2 + idx;
      row.forEach((v, i) => {
        ws.getCell(r, i + 1).value = v;
      });
      const isEven = idx % 2 === 1;
      styleRange(ws, r, 1, r, headers.length, { fill: isEven ? C.zebra : 'FFFFFFFF' });
      ws.getRow(r).height = 18;
    });
  };

  const schoolRows = Array.from(schools.values())
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((s, i) => [
      i + 1,
      s.name,
      s.total,
      s.hadir,
      s.total - s.hadir,
      `${s.total > 0 ? ((s.hadir / s.total) * 100).toFixed(1) : '0.0'}%`
    ]);

  const catRows = Array.from(categories.values())
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((c, i) => [
      i + 1,
      c.name,
      c.total,
      c.hadir,
      c.total - c.hadir,
      `${c.total > 0 ? ((c.hadir / c.total) * 100).toFixed(1) : '0.0'}%`
    ]);

  addTable(9, 'REKAP PER PESANTREN', ['No', 'Pesantren', 'Total', 'Hadir', 'Belum', 'Persentase'], schoolRows, 11);
  const afterSchool = 9 + 2 + schoolRows.length + 1;
  addTable(afterSchool, 'REKAP PER GOLONGAN', ['No', 'Golongan', 'Total', 'Hadir', 'Belum', 'Persentase'], catRows);

  const footerRow = afterSchool + 2 + catRows.length + 1;
  const now = new Date();
  ws.getCell(footerRow, 1).value = `Dokumen dibuat otomatis oleh Sistem Absensi Pramuka LP3 XVII 2026 — ${now.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB`;
  merge(footerRow, 1, 7);
  ws.getCell(footerRow, 1).font = { italic: true, size: 9, color: { argb: C.gray } };
}

function styleRange(ws, r1, c1, r2, c2, opts) {
  for (let r = r1; r <= r2; r++) {
    for (let c = c1; c <= c2; c++) {
      const cell = ws.getCell(r, c);
      if (opts.fill) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: opts.fill } };
      if (opts.font) cell.font = opts.font;
      if (opts.bold || opts.center) {
        cell.font = Object.assign({}, cell.font || {}, { bold: !!opts.bold });
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
    }
  }
}

function addSchoolSheet(wb, school, activity) {
  const ws = wb.addWorksheet(sanitizeSheetName(school.name), {
    properties: { tabColor: { argb: C.red } },
    views: [{ state: 'visible', showGridLines: false }]
  });
  ws.columns = [
    { width: 6 }, { width: 38 }, { width: 14 }, { width: 18 }, { width: 21 }
  ];
  ws.pageSetup = { orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0, horizontalCentered: true };

  const merge = (row, from, to) => ws.mergeCells(row, from, row, to);

  ws.getCell(1, 1).value = `PESANTREN ${school.name.toUpperCase()}`;
  merge(1, 1, 5);
  ws.getRow(1).height = 24;

  ws.getCell(2, 1).value = `Kegiatan: ${activity.name} (${activity.type})  •  Tanggal: ${activity.date}`;
  merge(2, 1, 5);
  ws.getRow(2).height = 18;

  const pct = school.total > 0 ? ((school.hadir / school.total) * 100).toFixed(1) : '0.0';
  ws.getCell(3, 1).value = `Total: ${school.total}   Hadir: ${school.hadir}   Belum: ${school.total - school.hadir}   Kehadiran: ${pct}%`;
  merge(3, 1, 5);

  [1, 2, 3].forEach(r => ws.getRow(r).alignment = { horizontal: 'center', vertical: 'middle' });
  styleRange(ws, 1, 1, 1, 5, { fill: C.red, font: { bold: true, size: 14, color: { argb: C.white } } });
  styleRange(ws, 2, 1, 2, 5, { fill: C.goldLight, font: { size: 10, color: { argb: C.brown } } });
  styleRange(ws, 3, 1, 3, 5, { fill: C.goldLight, font: { bold: true, size: 10, color: { argb: C.brown } } });

  const headers = ['No', 'Nama Peserta', 'Golongan', 'Status', 'Waktu Scan'];
  headers.forEach((h, i) => {
    ws.getCell(5, i + 1).value = h;
    styleRange(ws, 5, i + 1, 5, i + 1, { fill: C.redDark, font: { bold: true, color: { argb: C.white } } });
  });
  ws.getRow(5).height = 18;

  school.list
    .slice()
    .sort((a, b) => String(a['Nama Peserta']).localeCompare(String(b['Nama Peserta'])))
    .forEach((r, idx) => {
      const row = 6 + idx;
      const hadir = r['Status Kehadiran'] === 'HADIR';
      const vals = [idx + 1, r['Nama Peserta'], r['Golongan'], hadir ? 'HADIR' : 'BELUM HADIR', r['Waktu Scan'] || '-'];
      vals.forEach((v, i) => ws.getCell(row, i + 1).value = v);
      const fill = idx % 2 === 1 ? C.zebra : 'FFFFFFFF';
      for (let c = 1; c <= 5; c++) {
        const cell = ws.getCell(row, c);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } };
        cell.border = borderBox();
        cell.font = { size: 10, color: { argb: C.brown } };
        if (c === 1 || c === 3) cell.alignment = { horizontal: 'center', vertical: 'middle' };
        if (c === 4) {
          cell.font = { size: 10, bold: true, color: { argb: hadir ? C.green : C.amber } };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      }
      ws.getRow(row).height = 17;
    });

  const lastDataRow = 5 + school.list.length;
  ws.autoFilter = `A5:E${lastDataRow}`;
  ws.views = [{ state: 'frozen', ySplit: 5, showGridLines: false }];

  const sumRow = lastDataRow + 2;
  const summary = [
    ['TOTAL PESERTA', school.total],
    ['HADIR', school.hadir],
    ['BELUM HADIR', school.total - school.hadir],
    ['PERSENTASE KEHADIRAN', `${pct}%`]
  ];
  summary.forEach(([label, value], i) => {
    const r = sumRow + i;
    ws.getCell(r, 1).value = label;
    ws.mergeCells(r, 1, r, 3);
    styleRange(ws, r, 1, r, 3, { fill: C.goldLight, font: { bold: true, size: 10, color: { argb: C.brown } } });
    ws.getCell(r, 4).value = value;
    ws.mergeCells(r, 4, r, 5);
    styleRange(ws, r, 4, r, 5, { fill: C.gold, font: { bold: true, size: 10, color: { argb: C.white } }, center: true });
    ws.getRow(r).height = 18;
  });

  const noteRow = sumRow + summary.length + 1;
  ws.getCell(noteRow, 1).value = `Total data: ${school.list.length} peserta`;
  ws.mergeCells(noteRow, 1, noteRow, 5);
  ws.getCell(noteRow, 1).font = { italic: true, size: 9, color: { argb: C.gray } };
}

async function buildExcelBuffer(records, activity) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Panitia LP3 XVII 2026';
  wb.created = new Date();

  const schools = new Map();
  let total = 0;
  let hadir = 0;
  for (const r of records) {
    total++;
    const isHadir = r['Status Kehadiran'] === 'HADIR';
    if (isHadir) hadir++;
    const school = r['Pesantren'] || 'TANPA PESANTREN';
    if (!schools.has(school)) schools.set(school, { name: school, list: [], total: 0, hadir: 0 });
    const g = schools.get(school);
    g.list.push(r);
    g.total++;
    if (isHadir) g.hadir++;
  }

  const categories = new Map();
  for (const r of records) {
    const cat = r['Golongan'] || 'TANPA GOLONGAN';
    if (!categories.has(cat)) categories.set(cat, { name: cat, total: 0, hadir: 0 });
    const c = categories.get(cat);
    c.total++;
    if (r['Status Kehadiran'] === 'HADIR') c.hadir++;
  }

  const pct = total > 0 ? ((hadir / total) * 100).toFixed(1) : '0.0';

  addSummarySheet(wb, { activity, schools, categories, total, hadir, belum: total - hadir, pct });

  const sorted = Array.from(schools.values()).sort((a, b) => a.name.localeCompare(b.name));
  const used = new Set(['Rekap LP3 XVII']);
  sorted.forEach((s) => {
    let name = sanitizeSheetName(s.name);
    if (used.has(name)) {
      let i = 2;
      while (used.has(`${name} (${i})`)) i++;
      name = `${name} (${i})`;
    }
    used.add(name);
    addSchoolSheet(wb, { ...s, name: s.name }, activity);
  });

  return wb.xlsx.writeBuffer();
}

async function getSummaryReport(req, res) {
  try {
    const { activity_id } = req.query;
    const db = await getDatabase();

    // 1. Target Activity
    let activity = null;
    if (activity_id) {
      activity = await db.get('SELECT * FROM activities WHERE id = ?', [activity_id]);
    } else {
      activity = await db.get('SELECT * FROM activities WHERE is_active = 1 LIMIT 1');
      if (!activity) {
        activity = await db.get('SELECT * FROM activities ORDER BY date DESC, start_time DESC LIMIT 1');
      }
    }

    const totalParticipants = (await db.get('SELECT COUNT(*) as count FROM participants')).count;

    let activityStats = null;
    if (activity) {
      const attendedCount = (await db.get('SELECT COUNT(*) as count FROM attendance WHERE activity_id = ?', [activity.id])).count;
      activityStats = {
        id: activity.id,
        name: activity.name,
        type: activity.type,
        date: activity.date,
        total_participants: totalParticipants,
        attended: attendedCount,
        unattended: totalParticipants - attendedCount,
        percentage: totalParticipants > 0 ? ((attendedCount / totalParticipants) * 100).toFixed(1) : 0
      };
    }

    // 2. School Statistics (across all or for specific activity)
    let schoolStatsQuery = '';
    if (activity) {
      schoolStatsQuery = `
        SELECT 
          p.school,
          COUNT(DISTINCT p.id) as total_school_participants,
          COUNT(DISTINCT att.participant_id) as attended_count,
          (COUNT(DISTINCT p.id) - COUNT(DISTINCT att.participant_id)) as unattended_count
        FROM participants p
        LEFT JOIN attendance att ON p.id = att.participant_id AND att.activity_id = ${activity.id}
        GROUP BY p.school
        ORDER BY p.school ASC
      `;
    } else {
      schoolStatsQuery = `
        SELECT 
          school,
          COUNT(id) as total_school_participants,
          0 as attended_count,
          COUNT(id) as unattended_count
        FROM participants
        GROUP BY school
        ORDER BY school ASC
      `;
    }
    const schoolStats = await db.all(schoolStatsQuery);
    schoolStats.forEach(s => {
      s.percentage = s.total_school_participants > 0 ? ((s.attended_count / s.total_school_participants) * 100).toFixed(1) : 0;
    });

    // 3. Category Statistics (PENGGALANG / PENEGAK)
    let categoryStatsQuery = '';
    if (activity) {
      categoryStatsQuery = `
        SELECT 
          p.category,
          COUNT(DISTINCT p.id) as total_category_participants,
          COUNT(DISTINCT att.participant_id) as attended_count,
          (COUNT(DISTINCT p.id) - COUNT(DISTINCT att.participant_id)) as unattended_count
        FROM participants p
        LEFT JOIN attendance att ON p.id = att.participant_id AND att.activity_id = ${activity.id}
        GROUP BY p.category
        ORDER BY p.category ASC
      `;
    } else {
      categoryStatsQuery = `
        SELECT 
          category,
          COUNT(id) as total_category_participants,
          0 as attended_count,
          COUNT(id) as unattended_count
        FROM participants
        GROUP BY category
        ORDER BY category ASC
      `;
    }
    const categoryStats = await db.all(categoryStatsQuery);
    categoryStats.forEach(c => {
      c.percentage = c.total_category_participants > 0 ? ((c.attended_count / c.total_category_participants) * 100).toFixed(1) : 0;
    });

    res.json({
      success: true,
      activity: activityStats,
      schools: schoolStats,
      categories: categoryStats
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function exportReport(req, res) {
  try {
    const { activity_id, format } = req.query; // format: 'excel' or 'csv'
    const db = await getDatabase();

    // Target Activity: explicit -> active -> latest
    let activity = null;
    if (activity_id) {
      activity = await db.get('SELECT * FROM activities WHERE id = ?', [activity_id]);
    } else {
      activity = await db.get('SELECT * FROM activities WHERE is_active = 1 LIMIT 1');
      if (!activity) {
        activity = await db.get('SELECT * FROM activities ORDER BY date DESC, start_time DESC LIMIT 1');
      }
    }

    if (!activity) {
      return res.status(404).send('Tidak ada kegiatan untuk diexport.');
    }

    // Rekap lengkap: SEMUA peserta + status kehadiran untuk kegiatan target
    const query = `
      SELECT
        ? AS "Kegiatan",
        ? AS "Jenis Kegiatan",
        p.barcode_id AS "Barcode ID",
        p.name AS "Nama Peserta",
        p.school AS "Pesantren",
        p.category AS "Golongan",
        CASE WHEN att.id IS NOT NULL THEN 'HADIR' ELSE 'BELUM HADIR' END AS "Status Kehadiran",
        CASE WHEN att.id IS NOT NULL THEN to_char(att.scanned_at, 'YYYY-MM-DD HH24:MI:SS') ELSE '' END AS "Waktu Scan"
      FROM participants p
      LEFT JOIN attendance att ON att.participant_id = p.id AND att.activity_id = ?
      ORDER BY p.school ASC, p.name ASC
    `;
    const records = await db.all(query, [activity.name, activity.type, activity.id]);

    if (records.length === 0) {
      return res.status(404).send('Tidak ada data peserta untuk diexport.');
    }

    if (format === 'csv') {
      const worksheet = XLSX.utils.json_to_sheet(records);
      const csvOutput = '\uFEFF' + XLSX.utils.sheet_to_csv(worksheet);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="rekap_absensi_pramuka.csv"`);
      return res.send(csvOutput);
    }

    const buffer = await buildExcelBuffer(records, activity);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Rekap_LP3XVII_${safeFileName(activity.name)}.xlsx"`);
    return res.send(buffer);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  getSummaryReport,
  exportReport
};
