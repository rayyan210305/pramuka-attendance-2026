async function syncActivityStatuses(db) {
  const result = await db.run(`
    UPDATE activities
    SET status = 'COMPLETED', updated_at = CURRENT_TIMESTAMP
    WHERE is_active = 0
      AND status IN ('ACTIVE', 'SCHEDULED')
      AND (date + end_time) < (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')
  `);

  if (result.changes > 0) {
    console.log(`🕒 Auto-sync: ${result.changes} kegiatan ditandai COMPLETED sesuai jadwal WIB.`);
  }

  return result.changes;
}

module.exports = { syncActivityStatuses };