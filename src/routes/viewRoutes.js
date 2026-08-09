const express = require('express');
const router = express.Router();
const { getDatabase } = require('../config/database');

// Dashboard View
router.get('/', async (req, res) => {
  try {
    const db = await getDatabase();
    
    // Active activity
    const activeActivity = await db.get(`
      SELECT a.*, e.name as event_name 
      FROM activities a 
      LEFT JOIN events e ON a.event_id = e.id 
      WHERE a.is_active = 1 
      LIMIT 1
    `);

    const totalParticipants = (await db.get('SELECT COUNT(*) as count FROM participants')).count;
    
    let attendedCount = 0;
    if (activeActivity) {
      attendedCount = (await db.get('SELECT COUNT(*) as count FROM attendance WHERE activity_id = ?', [activeActivity.id])).count;
    }

    const recentScans = await db.all(`
      SELECT att.*, to_char(att.scanned_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD HH24:MI:SS') AS scanned_at_wib, p.name as participant_name, p.school, p.category, p.barcode_id, a.name as activity_name
      FROM attendance att
      JOIN participants p ON att.participant_id = p.id
      JOIN activities a ON att.activity_id = a.id
      ORDER BY att.scanned_at DESC
      LIMIT 6
    `);

    const activities = await db.all('SELECT * FROM activities ORDER BY date DESC, start_time ASC');

    res.render('dashboard', {
      pageTitle: 'Dashboard LP3 XVII | Pramuka Attendance 2026',
      activePage: 'dashboard',
      activeActivity,
      stats: {
        total: totalParticipants,
        attended: attendedCount,
        unattended: totalParticipants - attendedCount,
        percentage: totalParticipants > 0 ? ((attendedCount / totalParticipants) * 100).toFixed(1) : 0
      },
      recentScans,
      activities
    });
  } catch (error) {
    console.error('Error rendering dashboard:', error);
    res.status(500).send('Server Error');
  }
});

// Scanner View
router.get('/scanner', async (req, res) => {
  try {
    const db = await getDatabase();
    const activities = await db.all('SELECT a.*, e.name AS event_name FROM activities a LEFT JOIN events e ON a.event_id = e.id ORDER BY a.is_active DESC, a.date DESC, a.start_time ASC');
    const activeActivity = activities.find(a => a.is_active === 1) || null;

    if (activeActivity) {
      const totalParticipants = (await db.get('SELECT COUNT(*) as count FROM participants')).count;
      const attendedCount = (await db.get('SELECT COUNT(*) as count FROM attendance WHERE activity_id = ?', [activeActivity.id])).count;
      activeActivity.attended_count = attendedCount;
      activeActivity.unattended_count = totalParticipants - attendedCount;
      activeActivity.attendance_percentage = totalParticipants > 0 ? ((attendedCount / totalParticipants) * 100).toFixed(1) : 0;
    }

    res.render('scanner', {
      pageTitle: 'Camera Scanner | LP3 XVII 2026',
      activePage: 'scanner',
      activities,
      activeActivity
    });
  } catch (error) {
    console.error('Error rendering scanner:', error);
    res.status(500).send('Server Error');
  }
});

// Events View
router.get('/events', async (req, res) => {
  try {
    const db = await getDatabase();
    const events = await db.all(`
      SELECT e.*, 
        (SELECT COUNT(*) FROM activities a WHERE a.event_id = e.id) as activity_count
      FROM events e 
      ORDER BY e.created_at DESC
    `);

    res.render('events/index', {
      pageTitle: 'Kelola Event | LP3 XVII 2026',
      activePage: 'events',
      events
    });
  } catch (error) {
    res.status(500).send('Server Error');
  }
});

// Activities View
router.get('/activities', async (req, res) => {
  try {
    const db = await getDatabase();
    const activities = await db.all(`
      SELECT a.*, e.name as event_name,
        (SELECT COUNT(*) FROM attendance att WHERE att.activity_id = a.id) as attendance_count,
        (SELECT COUNT(*) FROM participants) as total_participants
      FROM activities a
      LEFT JOIN events e ON a.event_id = e.id
      ORDER BY a.is_active DESC, a.date DESC, a.start_time ASC
    `);

    const events = await db.all('SELECT * FROM events ORDER BY name ASC');

    res.render('activities/index', {
      pageTitle: 'Kelola Kegiatan & Lomba | LP3 XVII 2026',
      activePage: 'activities',
      activities,
      events
    });
  } catch (error) {
    res.status(500).send('Server Error');
  }
});

// Participants View
router.get('/participants', async (req, res) => {
  try {
    const { search, school, category } = req.query;
    const db = await getDatabase();

    let query = 'SELECT * FROM participants WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (name LIKE ? OR barcode_id LIKE ? OR school LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    if (school) {
      query += ' AND school = ?';
      params.push(school);
    }

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY school ASC, id ASC';

    const participants = await db.all(query, params);
    const schoolsRows = await db.all('SELECT DISTINCT school FROM participants ORDER BY school ASC');

    const groupMap = new Map();
    participants.forEach(p => {
      if (!groupMap.has(p.school)) groupMap.set(p.school, []);
      groupMap.get(p.school).push(p);
    });

    const groups = [...groupMap.entries()].map(([name, list]) => ({
      name,
      total: list.length,
      penggalang: list.filter(x => x.category === 'PENGGALANG').length,
      penegak: list.filter(x => x.category === 'PENEGAK').length,
      participants: list
    }));

    res.render('participants/index', {
      pageTitle: 'Data Peserta | LP3 XVII 2026',
      activePage: 'participants',
      groups,
      schools: schoolsRows.map(s => s.school),
      filters: { search, school, category }
    });
  } catch (error) {
    res.status(500).send('Server Error');
  }
});

// Printable Batch Barcodes & QR Codes View
router.get('/participants/barcodes', async (req, res) => {
  try {
    const { school } = req.query;
    const db = await getDatabase();
    let participants;
    if (school) {
      participants = await db.all('SELECT * FROM participants WHERE school = ? ORDER BY id ASC', [school]);
    } else {
      participants = await db.all('SELECT * FROM participants ORDER BY id ASC');
    }

    res.render('participants/barcodes', {
      pageTitle: 'Cetak Batch Barcode & QR Code Peserta | LP3 XVII 2026',
      activePage: 'participants',
      participants,
      school: school || ''
    });
  } catch (error) {
    res.status(500).send('Server Error');
  }
});

// Attendance History View
router.get('/attendance', async (req, res) => {
  try {
    const { activity_id, school, category, search } = req.query;
    const db = await getDatabase();

    let query = `
      SELECT att.*, 
             p.name as participant_name, p.school, p.category, p.barcode_id,
             a.name as activity_name, a.type as activity_type, a.date as activity_date
      FROM attendance att
      JOIN participants p ON att.participant_id = p.id
      JOIN activities a ON att.activity_id = a.id
      WHERE 1=1
    `;
    const params = [];

    if (activity_id) {
      query += ' AND att.activity_id = ?';
      params.push(activity_id);
    }

    if (school) {
      query += ' AND p.school = ?';
      params.push(school);
    }

    if (category) {
      query += ' AND p.category = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (p.name LIKE ? OR p.barcode_id LIKE ? OR p.school LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    query += ' ORDER BY att.scanned_at DESC';

    const records = await db.all(query, params);
    const activities = await db.all('SELECT * FROM activities ORDER BY date DESC, name ASC');
    const schools = await db.all('SELECT DISTINCT school FROM participants ORDER BY school ASC');

    res.render('attendance/history', {
      pageTitle: 'Histori Absensi | LP3 XVII 2026',
      activePage: 'attendance',
      records,
      activities,
      schools: schools.map(s => s.school),
      filters: { activity_id, school, category, search }
    });
  } catch (error) {
    res.status(500).send('Server Error');
  }
});

// Reports View
router.get('/reports', async (req, res) => {
  try {
    const db = await getDatabase();
    const activities = await db.all('SELECT * FROM activities ORDER BY date DESC, start_time ASC');
    
    res.render('reports/index', {
      pageTitle: 'Laporan & Rekap | LP3 XVII 2026',
      activePage: 'reports',
      activities
    });
  } catch (error) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;
