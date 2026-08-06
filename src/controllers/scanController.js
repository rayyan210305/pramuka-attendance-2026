const { getDatabase } = require('../config/database');
const { formatWIBClock } = require('../utils/time');

async function handleScan(req, res) {
  try {
    const { barcode_id, activity_id } = req.body;

    if (!barcode_id) {
      return res.status(400).json({
        success: false,
        status: 'INVALID_BARCODE',
        message: 'Barcode ID is required'
      });
    }

    const cleanBarcode = barcode_id.trim();
    const db = await getDatabase();

    // 1. Get Target Activity
    let activity = null;
    if (activity_id) {
      activity = await db.get('SELECT * FROM activities WHERE id = ?', [activity_id]);
    } else {
      // Pick currently active activity
      activity = await db.get('SELECT * FROM activities WHERE is_active = 1 LIMIT 1');
    }

    if (!activity) {
      return res.status(400).json({
        success: false,
        status: 'NO_ACTIVE_ACTIVITY',
        message: 'Tidak ada kegiatan aktif. Silakan pilih kegiatan terlebih dahulu.'
      });
    }

    if (activity.status === 'COMPLETED' || activity.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        status: 'ACTIVITY_CLOSED',
        message: `Kegiatan "${activity.name}" sudah ditutup / selesai.`
      });
    }

    // 2. Find Participant by Barcode ID
    const participant = await db.get('SELECT * FROM participants WHERE UPPER(barcode_id) = UPPER(?)', [cleanBarcode]);

    if (!participant) {
      return res.status(404).json({
        success: false,
        status: 'PARTICIPANT_NOT_FOUND',
        message: 'Peserta tidak terdaftar dalam sistem.',
        barcode_id: cleanBarcode
      });
    }

    // 3. Check Existing Attendance
    const existingAttendance = await db.get(
      'SELECT * FROM attendance WHERE participant_id = ? AND activity_id = ?',
      [participant.id, activity.id]
    );

    if (existingAttendance) {
      const formattedTime = formatWIBClock(existingAttendance.scanned_at);

      return res.status(409).json({
        success: false,
        status: 'ALREADY_ATTENDED',
        message: 'Peserta sudah melakukan absensi untuk kegiatan ini.',
        participant: {
          id: participant.id,
          name: participant.name,
          school: participant.school,
          category: participant.category,
          barcode_id: participant.barcode_id
        },
        activity: {
          id: activity.id,
          name: activity.name
        },
        scanned_at: existingAttendance.scanned_at,
        formatted_time: formattedTime
      });
    }

    // 4. Insert Attendance Record
    const scannedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const result = await db.run(`
      INSERT INTO attendance (participant_id, activity_id, scanned_at, status, scanner_source)
      VALUES (?, ?, ?, 'PRESENT', 'CAMERA_BROWSER')
    `, [participant.id, activity.id, scannedAt]);

    const formattedTime = formatWIBClock(scannedAt);

    // 5. Compute Updated Activity Stats
    const stats = await db.get(`
      SELECT 
        (SELECT COUNT(*) FROM participants) as total_participants,
        (SELECT COUNT(*) FROM attendance WHERE activity_id = ?) as attended_count
      FROM activities WHERE id = ?
    `, [activity.id, activity.id]);

    return res.status(200).json({
      success: true,
      status: 'PRESENT',
      message: 'Absensi berhasil dicatat!',
      attendance_id: result.lastID,
      participant: {
        id: participant.id,
        name: participant.name,
        school: participant.school,
        category: participant.category,
        barcode_id: participant.barcode_id
      },
      activity: {
        id: activity.id,
        name: activity.name,
        type: activity.type
      },
      scanned_at: scannedAt,
      formatted_time: formattedTime,
      stats: {
        total: stats.total_participants,
        attended: stats.attended_count,
        unattended: stats.total_participants - stats.attended_count,
        percentage: stats.total_participants > 0 ? ((stats.attended_count / stats.total_participants) * 100).toFixed(1) : 0
      }
    });

  } catch (error) {
    console.error('Scan Error:', error);
    return res.status(500).json({
      success: false,
      status: 'SYSTEM_ERROR',
      message: 'Terjadi kesalahan sistem saat memproses absensi.'
    });
  }
}

module.exports = { handleScan };
