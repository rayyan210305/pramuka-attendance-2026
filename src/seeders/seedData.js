const { getDatabase } = require('../config/database');

async function seed() {
  const db = await getDatabase();

  console.log('🌱 Seeding database for LP3 Putra XVII 2026...');

  // Only seed once: if the marker exists, the database is managed manually
  const seededMeta = await db.get(`SELECT value FROM app_meta WHERE key = 'seeded'`);
  if (seededMeta) {
    // Rebrand idempotent: pastikan nama event & kegiatan memakai "LP3 Putra XVII"
    await db.run(`
      UPDATE events
      SET name = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = (SELECT id FROM events ORDER BY id ASC LIMIT 1)
    `, ['LP3 Putra XVII 2026']);
    await db.run(`
      UPDATE activities
      SET name = REPLACE(name, 'LP3 XVII', 'LP3 Putra XVII'),
          updated_at = CURRENT_TIMESTAMP
      WHERE name LIKE '%LP3 XVII%'
    `);
    console.log('Database already seeded (skipped).');
    return;
  }

  // Check if events exist
  const existingEvent = await db.get('SELECT id FROM events LIMIT 1');
  if (existingEvent) {
    // Update existing event name if needed
    await db.run(`
      UPDATE events 
      SET name = ?, 
          description = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      'LP3 Putra XVII 2026',
      'Lomba Perkemahan Pramuka Pesantren Ke-XVII • Pesantren Modern Al Zahrah - Bireuen',
      existingEvent.id
    ]);
    await db.exec(`INSERT INTO app_meta (key, value) VALUES ('seeded', '1') ON CONFLICT (key) DO NOTHING`);
    console.log('Database already seeded. Event updated to LP3 Putra XVII 2026.');
    return;
  }

  // 1. Insert Event
  const resultEvent = await db.run(`
    INSERT INTO events (name, description, start_date, end_date, status)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT (name) DO NOTHING
  `, [
    'LP3 Putra XVII 2026',
    'Lomba Perkemahan Pramuka Pesantren Ke-XVII • Pesantren Modern Al Zahrah - Bireuen, Aceh',
    '2026-08-05',
    '2026-08-07',
    'ACTIVE'
  ]);
  let eventId = resultEvent.lastID;
  if (!eventId) {
    const eventRow = await db.get('SELECT id FROM events WHERE name = ?', ['LP3 Putra XVII 2026']);
    eventId = eventRow.id;
  }

  // 2. Insert Activities
  const activities = [
    {
      name: 'Upacara Pembukaan LP3 Putra XVII',
      description: 'Upacara Pembukaan Perkemahan Pramuka Pesantren Ke-XVII',
      type: 'KEGIATAN',
      date: '2026-08-05',
      start_time: '08:00',
      end_time: '09:00',
      status: 'COMPLETED',
      is_active: 0
    },
    {
      name: 'Materi Kepramukaan & GPP',
      description: 'Wawasan Kepramukaan Pesantren & Sako GPP Aceh',
      type: 'KEGIATAN',
      date: '2026-08-05',
      start_time: '09:15',
      end_time: '10:30',
      status: 'COMPLETED',
      is_active: 0
    },
    {
      name: 'Lomba Pionering LP3 Putra XVII',
      description: 'Perlombaan pembuatan menara pandang & jembatan kreasi',
      type: 'LOMBA',
      date: '2026-08-05',
      start_time: '10:30',
      end_time: '12:00',
      status: 'ACTIVE',
      is_active: 1
    },
    {
      name: 'Lomba Semaphore & Sandi',
      description: 'Kompetisi kecepatan & ketepatan penerjemahan semaphore',
      type: 'LOMBA',
      date: '2026-08-05',
      start_time: '13:30',
      end_time: '15:00',
      status: 'SCHEDULED',
      is_active: 0
    },
    {
      name: 'Malam Keakraban & Api Unggun',
      description: 'Pentas seni santri perkemahan & api unggun LP3 Putra XVII',
      type: 'EVENT',
      date: '2026-08-05',
      start_time: '19:30',
      end_time: '21:30',
      status: 'SCHEDULED',
      is_active: 0
    },
    {
      name: 'Penutupan & Pengumuman Juara',
      description: 'Upacara penutupan & penganugerahan juara umum LP3 Putra XVII',
      type: 'KEGIATAN',
      date: '2026-08-06',
      start_time: '15:00',
      end_time: '16:30',
      status: 'SCHEDULED',
      is_active: 0
    }
  ];

  const activityIds = [];
  for (const act of activities) {
    const res = await db.run(`
      INSERT INTO activities (event_id, name, description, type, date, start_time, end_time, status, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [eventId, act.name, act.description, act.type, act.date, act.start_time, act.end_time, act.status, act.is_active]);
    activityIds.push(res.lastID);
  }

  // 3. Insert Participants
  const sampleParticipants = [
    { barcode_id: 'PRM-2026-0001', name: 'Ahmad Fauzi', school: 'Pesantren Al Zahrah Bireuen', category: 'PENEGAK' },
    { barcode_id: 'PRM-2026-0002', name: 'Siti Rahmawati', school: 'Pesantren Al Zahrah Bireuen', category: 'PENEGAK' },
    { barcode_id: 'PRM-2026-0003', name: 'Budi Santoso', school: 'MA Darul Ulum Banda Aceh', category: 'PENGGALANG' },
    { barcode_id: 'PRM-2026-0004', name: 'Dewi Lestari', school: 'MA Darul Ulum Banda Aceh', category: 'PENGGALANG' },
    { barcode_id: 'PRM-2026-0005', name: 'Miftahul Rizki', school: 'Dayah Jeumala Ahrai', category: 'PENEGAK' },
    { barcode_id: 'PRM-2026-0006', name: 'Andi Wijaya', school: 'Dayah Jeumala Ahrai', category: 'PENEGAK' },
    { barcode_id: 'PRM-2026-0007', name: 'Nurul Hidayah', school: 'Pesantren Insan Qurani', category: 'PENGGALANG' },
    { barcode_id: 'PRM-2026-0008', name: 'Rizky Pratama', school: 'Pesantren Insan Qurani', category: 'PENGGALANG' },
    { barcode_id: 'PRM-2026-0009', name: 'Fajar Kurniawan', school: 'MAS Oemar Diyan', category: 'PENEGAK' },
    { barcode_id: 'PRM-2026-0010', name: 'Annisa Putri', school: 'MAS Oemar Diyan', category: 'PENEGAK' }
  ];

  const participantIds = [];
  for (const p of sampleParticipants) {
    const res = await db.run(`
      INSERT INTO participants (barcode_id, name, school, category)
      VALUES (?, ?, ?, ?)
      ON CONFLICT (barcode_id) DO NOTHING
    `, [p.barcode_id, p.name, p.school, p.category]);
    let pid = res.lastID;
    if (!pid) {
      const row = await db.get('SELECT id FROM participants WHERE barcode_id = ?', [p.barcode_id]);
      pid = row.id;
    }
    participantIds.push(pid);
  }

  // 4. Insert Attendance records for completed activities
  for (let i = 0; i < 8; i++) {
    await db.run(`
      INSERT INTO attendance (participant_id, activity_id, scanned_at, status)
      VALUES (?, ?, ?, 'PRESENT')
      ON CONFLICT (participant_id, activity_id) DO NOTHING
    `, [participantIds[i], activityIds[0], '2026-08-05 08:05:' + (10 + i)]);
  }

  for (let i = 0; i < 6; i++) {
    await db.run(`
      INSERT INTO attendance (participant_id, activity_id, scanned_at, status)
      VALUES (?, ?, ?, 'PRESENT')
      ON CONFLICT (participant_id, activity_id) DO NOTHING
    `, [participantIds[i], activityIds[1], '2026-08-05 09:20:' + (12 + i)]);
  }

  for (let i = 0; i < 3; i++) {
    await db.run(`
      INSERT INTO attendance (participant_id, activity_id, scanned_at, status)
      VALUES (?, ?, ?, 'PRESENT')
      ON CONFLICT (participant_id, activity_id) DO NOTHING
    `, [participantIds[i], activityIds[2], '2026-08-05 10:35:' + (15 + i)]);
  }

  await db.exec(`INSERT INTO app_meta (key, value) VALUES ('seeded', '1') ON CONFLICT (key) DO NOTHING`);

  console.log('✅ LP3 Putra XVII Seeding completed successfully!');
}

module.exports = { seed };
