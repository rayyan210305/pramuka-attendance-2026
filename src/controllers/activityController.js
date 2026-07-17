const { getDatabase } = require('../config/database');

async function getAllActivities(req, res) {
  try {
    const db = await getDatabase();
    const activities = await db.all(`
      SELECT a.*, e.name as event_name,
        (SELECT COUNT(*) FROM attendance att WHERE att.activity_id = a.id) as attendance_count,
        (SELECT COUNT(*) FROM participants) as total_participants
      FROM activities a
      LEFT JOIN events e ON a.event_id = e.id
      ORDER BY a.date DESC, a.start_time ASC
    `);
    res.json({ success: true, data: activities });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getActivityById(req, res) {
  try {
    const db = await getDatabase();
    const activity = await db.get(`
      SELECT a.*, e.name as event_name 
      FROM activities a
      LEFT JOIN events e ON a.event_id = e.id
      WHERE a.id = ?
    `, [req.params.id]);

    if (!activity) return res.status(404).json({ success: false, message: 'Activity not found' });

    const totalParticipants = (await db.get('SELECT COUNT(*) as count FROM participants')).count;
    const attendanceList = await db.all(`
      SELECT att.*, p.name as participant_name, p.school, p.category, p.barcode_id
      FROM attendance att
      JOIN participants p ON att.participant_id = p.id
      WHERE att.activity_id = ?
      ORDER BY att.scanned_at DESC
    `, [req.params.id]);

    res.json({
      success: true,
      data: {
        ...activity,
        total_participants: totalParticipants,
        attended_count: attendanceList.length,
        unattended_count: totalParticipants - attendanceList.length,
        attendance_percentage: totalParticipants > 0 ? ((attendanceList.length / totalParticipants) * 100).toFixed(1) : 0,
        attendances: attendanceList
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getActiveActivity(req, res) {
  try {
    const db = await getDatabase();
    const activity = await db.get(`
      SELECT a.*, e.name as event_name 
      FROM activities a
      LEFT JOIN events e ON a.event_id = e.id
      WHERE a.is_active = 1
      LIMIT 1
    `);

    if (!activity) {
      return res.json({ success: true, data: null, message: 'No active activity selected' });
    }

    const totalParticipants = (await db.get('SELECT COUNT(*) as count FROM participants')).count;
    const attendedCount = (await db.get('SELECT COUNT(*) as count FROM attendance WHERE activity_id = ?', [activity.id])).count;

    res.json({
      success: true,
      data: {
        ...activity,
        total_participants: totalParticipants,
        attended_count: attendedCount,
        unattended_count: totalParticipants - attendedCount,
        attendance_percentage: totalParticipants > 0 ? ((attendedCount / totalParticipants) * 100).toFixed(1) : 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function createActivity(req, res) {
  try {
    const { event_id, name, description, type, date, start_time, end_time, status, location } = req.body;
    if (!event_id || !name || !date) {
      return res.status(400).json({ success: false, message: 'Event ID, name, and date are required' });
    }

    const db = await getDatabase();
    const result = await db.run(`
      INSERT INTO activities (event_id, name, description, type, date, start_time, end_time, location, status, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `, [event_id, name, description || '', type || 'KEGIATAN', date, start_time || '08:00', end_time || '10:00', location || '', status || 'SCHEDULED']);

    res.status(201).json({ success: true, id: result.lastID, message: 'Activity created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function updateActivity(req, res) {
  try {
    const { event_id, name, description, type, date, start_time, end_time, status, location } = req.body;
    const db = await getDatabase();
    await db.run(`
      UPDATE activities
      SET event_id = ?, name = ?, description = ?, type = ?, date = ?, start_time = ?, end_time = ?, location = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [event_id, name, description, type, date, start_time, end_time, location || '', status, req.params.id]);

    res.json({ success: true, message: 'Activity updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function setActiveActivity(req, res) {
  try {
    const { id } = req.params;
    const db = await getDatabase();

    // Check if activity exists
    const act = await db.get('SELECT * FROM activities WHERE id = ?', [id]);
    if (!act) return res.status(404).json({ success: false, message: 'Activity not found' });

    // Set all is_active to 0
    await db.run('UPDATE activities SET is_active = 0');

    // Set selected activity is_active = 1 and status = ACTIVE
    await db.run("UPDATE activities SET is_active = 1, status = 'ACTIVE' WHERE id = ?", [id]);

    res.json({ success: true, message: `Activity "${act.name}" set as active!` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function deleteActivity(req, res) {
  try {
    const db = await getDatabase();
    await db.run('DELETE FROM activities WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Activity deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  getAllActivities,
  getActivityById,
  getActiveActivity,
  createActivity,
  updateActivity,
  setActiveActivity,
  deleteActivity
};
