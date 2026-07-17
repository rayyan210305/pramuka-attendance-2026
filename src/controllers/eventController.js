const { getDatabase } = require('../config/database');

async function getAllEvents(req, res) {
  try {
    const db = await getDatabase();
    const events = await db.all(`
      SELECT e.*, 
        (SELECT COUNT(*) FROM activities a WHERE a.event_id = e.id) as activity_count
      FROM events e 
      ORDER BY e.created_at DESC
    `);
    res.json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getEventById(req, res) {
  try {
    const db = await getDatabase();
    const event = await db.get('SELECT * FROM events WHERE id = ?', [req.params.id]);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const activities = await db.all('SELECT * FROM activities WHERE event_id = ? ORDER BY date ASC, start_time ASC', [req.params.id]);
    res.json({ success: true, data: { ...event, activities } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function createEvent(req, res) {
  try {
    const { name, description, start_date, end_date, status } = req.body;
    if (!name || !start_date || !end_date) {
      return res.status(400).json({ success: false, message: 'Name, start date, and end date are required' });
    }

    const db = await getDatabase();
    const result = await db.run(`
      INSERT INTO events (name, description, start_date, end_date, status)
      VALUES (?, ?, ?, ?, ?)
    `, [name, description || '', start_date, end_date, status || 'ACTIVE']);

    res.status(201).json({ success: true, id: result.lastID, message: 'Event created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function updateEvent(req, res) {
  try {
    const { name, description, start_date, end_date, status } = req.body;
    const db = await getDatabase();
    await db.run(`
      UPDATE events 
      SET name = ?, description = ?, start_date = ?, end_date = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name, description, start_date, end_date, status, req.params.id]);

    res.json({ success: true, message: 'Event updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function deleteEvent(req, res) {
  try {
    const db = await getDatabase();
    await db.run('DELETE FROM events WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent
};
