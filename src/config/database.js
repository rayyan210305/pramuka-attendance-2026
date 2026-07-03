const { Pool } = require('pg');

let dbInstance = null;

function toPg(sql, params) {
  if (!params || params.length === 0) return { sql, params: [] };
  let index = 0;
  const converted = sql.replace(/\?/g, () => `$${++index}`);
  return { sql: converted, params };
}

function createWrapper(pool) {
  return {
    async exec(sql, params = []) {
      const { sql: q, params: p } = toPg(sql, params);
      await pool.query(q, p);
    },
    async get(sql, params = []) {
      const { sql: q, params: p } = toPg(sql, params);
      const result = await pool.query(q, p);
      return result.rows[0];
    },
    async all(sql, params = []) {
      const { sql: q, params: p } = toPg(sql, params);
      const result = await pool.query(q, p);
      return result.rows;
    },
    async run(sql, params = []) {
      let querySql = sql;
      if (/^\s*INSERT/i.test(querySql) && !/RETURNING/i.test(querySql)) {
        querySql = querySql.trimEnd().replace(/;?\s*$/, '') + ' RETURNING id';
      }
      const { sql: q, params: p } = toPg(querySql, params);
      const result = await pool.query(q, p);
      return {
        lastID: result.rows && result.rows[0] ? result.rows[0].id : undefined,
        changes: result.rowCount
      };
    }
  };
}

async function initSchema(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      description TEXT,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS activities (
      id SERIAL PRIMARY KEY,
      event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      type VARCHAR(30) NOT NULL DEFAULT 'KEGIATAN',
      date DATE NOT NULL,
      start_time TIME,
      end_time TIME,
      location VARCHAR(255) NOT NULL DEFAULT '',
      status VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED',
      is_active INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE activities ADD COLUMN IF NOT EXISTS location VARCHAR(255) NOT NULL DEFAULT '';

    CREATE TABLE IF NOT EXISTS participants (
      id SERIAL PRIMARY KEY,
      barcode_id VARCHAR(100) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      school VARCHAR(255) NOT NULL,
      category VARCHAR(30) NOT NULL DEFAULT 'PENGGALANG',
      kode VARCHAR(50) NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE participants ADD COLUMN IF NOT EXISTS kode VARCHAR(50) NOT NULL DEFAULT '';

    CREATE TABLE IF NOT EXISTS attendance (
      id SERIAL PRIMARY KEY,
      participant_id INTEGER NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
      activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
      scanned_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      status VARCHAR(30) NOT NULL DEFAULT 'PRESENT',
      scanner_source VARCHAR(100) DEFAULT 'CAMERA_BROWSER',
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (participant_id, activity_id)
    );

    CREATE TABLE IF NOT EXISTS app_meta (
      key VARCHAR(100) PRIMARY KEY,
      value TEXT
    );
  `);
}

async function getDatabase() {
  if (dbInstance) {
    return dbInstance;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set.');
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
  });

  await pool.query('SELECT 1');

  dbInstance = createWrapper(pool);
  await initSchema(dbInstance);

  return dbInstance;
}

module.exports = { getDatabase };
