require('dotenv').config();
const { getDatabase } = require('./src/config/database');
const { seed } = require('./src/seeders/seedData');

async function testSystem() {
  console.log('🧪 Running Verification Tests for Pramuka Attendance System 2026...\n');

  // 1. Initialize & Seed DB
  const db = await getDatabase();
  await seed();

  // 2. Verify Events
  const events = await db.all('SELECT * FROM events');
  console.log(`✅ Events Count: ${events.length}`);
  if (events.length === 0) throw new Error('No events found');

  // 3. Verify Activities
  const activities = await db.all('SELECT * FROM activities');
  console.log(`✅ Activities Count: ${activities.length}`);
  const activeActivity = await db.get('SELECT * FROM activities WHERE is_active = 1');
  console.log(`✅ Active Activity: "${activeActivity ? activeActivity.name : 'None'}"`);

  // 4. Verify Participants
  const participants = await db.all('SELECT * FROM participants');
  console.log(`✅ Participants Count: ${participants.length}`);

  // 5. Test Unique Constraint Rule: UNIQUE(participant_id, activity_id)
  console.log('\n🔒 Testing Business Rule: One Participant + One Activity = Unique Attendance Record');
  
  const testParticipant = participants[0]; // Ahmad Fauzi (PRM-2026-0001)
  const testActivity = activeActivity;

  // Clear existing test attendance if any
  await db.run('DELETE FROM attendance WHERE participant_id = ? AND activity_id = ?', [testParticipant.id, testActivity.id]);

  // Insert First Attendance Record
  const scannedAt = new Date().toISOString();
  await db.run(`
    INSERT INTO attendance (participant_id, activity_id, scanned_at, status)
    VALUES (?, ?, ?, 'PRESENT')
  `, [testParticipant.id, testActivity.id, scannedAt]);
  console.log(`  1st Scan for (${testParticipant.name} + ${testActivity.name}) -> SUCCESS`);

  // Attempt Duplicate Insert
  let duplicatePrevented = false;
  try {
    await db.run(`
      INSERT INTO attendance (participant_id, activity_id, scanned_at, status)
      VALUES (?, ?, ?, 'PRESENT')
    `, [testParticipant.id, testActivity.id, scannedAt]);
  } catch (err) {
    const msg = String(err.message || '').toLowerCase();
    if (msg.includes('unique')) {
      duplicatePrevented = true;
    }
  }

  if (duplicatePrevented) {
    console.log(`  2nd Duplicate Scan for (${testParticipant.name} + ${testActivity.name}) -> REJECTED BY DATABASE CONSTRAINT (Pass!)`);
  } else {
    throw new Error('UNIQUE CONSTRAINT FAILED TO PREVENT DUPLICATE ATTENDANCE!');
  }

  console.log('\n🎉 ALL VERIFICATION TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
}

testSystem().catch(err => {
  console.error('❌ System Verification Failed:', err);
  process.exit(1);
});
