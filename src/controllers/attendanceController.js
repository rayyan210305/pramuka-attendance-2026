const { getDatabase } = require('../config/database');

async function getAllAttendance(req, res) {
  try {
    const { activity_id, school, category, search } = req.query;
    const db = await getDatabase();

    let query = `
      SELECT att.*, 
             p.name as participant_name, p.school, p.category, p.barcode_id,
             a.name as activity_name, a.type as activity_type, a.date as activity_date,
             e.name as event_name
      FROM attendance att
      JOIN participants p ON att.participant_id = p.id
      JOIN activities a ON att.activity_id = a.id
      JOIN events e ON a.event_id = e.id
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
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function deleteAttendance(req, res) {
  try {
    const db = await getDatabase();
    await db.run('DELETE FROM attendance WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Attendance record deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  getAllAttendance,
  deleteAttendance
};
