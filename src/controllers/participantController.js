const { getDatabase } = require('../config/database');

async function getAllParticipants(req, res) {
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

    query += ' ORDER BY id DESC';

    const participants = await db.all(query, params);

    // Get list of distinct schools for filter
    const schools = await db.all('SELECT DISTINCT school FROM participants ORDER BY school ASC');

    res.json({
      success: true,
      data: participants,
      schools: schools.map(s => s.school)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getParticipantById(req, res) {
  try {
    const db = await getDatabase();
    const participant = await db.get('SELECT * FROM participants WHERE id = ?', [req.params.id]);

    if (!participant) return res.status(404).json({ success: false, message: 'Participant not found' });

    // Get attendance history
    const history = await db.all(`
      SELECT att.*, a.name as activity_name, a.type as activity_type, a.date as activity_date, e.name as event_name
      FROM attendance att
      JOIN activities a ON att.activity_id = a.id
      JOIN events e ON a.event_id = e.id
      WHERE att.participant_id = ?
      ORDER BY att.scanned_at DESC
    `, [req.params.id]);

    res.json({
      success: true,
      data: {
        ...participant,
        attendance_history: history
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function generateBarcodeId() {
  const db = await getDatabase();
  const maxRow = await db.get('SELECT MAX(id) as max_id FROM participants');
  const nextNum = Number(maxRow && maxRow.max_id ? maxRow.max_id : 0) + 1;
  const year = new Date().getFullYear();
  return `PRM-${year}-${String(nextNum).padStart(4, '0')}`;
}

async function createParticipant(req, res) {
  try {
    let { barcode_id, name, school, category, kode } = req.body;
    if (!name || !school || !category) {
      return res.status(400).json({ success: false, message: 'Name, school, and category are required' });
    }

    if (!barcode_id || barcode_id.trim() === '') {
      barcode_id = await generateBarcodeId();
    }

    const db = await getDatabase();

    // Check duplicate barcode
    const existing = await db.get('SELECT id FROM participants WHERE UPPER(barcode_id) = UPPER(?)', [barcode_id.trim()]);
    if (existing) {
      return res.status(400).json({ success: false, message: `Barcode ID "${barcode_id}" sudah digunakan oleh peserta lain.` });
    }

    const result = await db.run(`
      INSERT INTO participants (barcode_id, name, school, category, kode)
      VALUES (?, ?, ?, ?, ?)
    `, [barcode_id.trim(), name.trim(), school.trim(), category.trim(), (kode || '').trim()]);

    res.status(201).json({
      success: true,
      id: result.lastID,
      barcode_id: barcode_id.trim(),
      message: 'Participant added successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function updateParticipant(req, res) {
  try {
    const { barcode_id, name, school, category } = req.body;
    const db = await getDatabase();

    const existing = await db.get('SELECT id FROM participants WHERE UPPER(barcode_id) = UPPER(?) AND id != ?', [barcode_id.trim(), req.params.id]);
    if (existing) {
      return res.status(400).json({ success: false, message: `Barcode ID "${barcode_id}" sudah digunakan oleh peserta lain.` });
    }

    await db.run(`
      UPDATE participants
      SET barcode_id = ?, name = ?, school = ?, category = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [barcode_id.trim(), name.trim(), school.trim(), category.trim(), req.params.id]);

    res.json({ success: true, message: 'Participant updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function deleteParticipant(req, res) {
  try {
    const db = await getDatabase();
    await db.run('DELETE FROM participants WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Participant deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  getAllParticipants,
  getParticipantById,
  createParticipant,
  updateParticipant,
  deleteParticipant,
  generateBarcodeId
};
