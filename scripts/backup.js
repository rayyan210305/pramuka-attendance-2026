// Back up seluruh tabel ke file JSON (dipakai GitHub Actions / manual)
// Penggunaan: node scripts/backup.js [--output path]
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const TABLES = ['events', 'activities', 'participants', 'attendance', 'app_meta'];

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL tidak tersedia.');
    process.exit(1);
  }
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const data = {};
  for (const table of TABLES) {
    const { rows } = await pool.query(`SELECT * FROM ${table}`);
    data[table] = rows;
  }
  await pool.end();

  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}_${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}`;

  const outDir = path.resolve(__dirname, '..', 'backups');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `backup_lp3_${stamp}.json`);
  fs.writeFileSync(outPath, JSON.stringify({
    app: 'pramuka-attendance-2026',
    version: 1,
    exported_at: now.toISOString(),
    data
  }, null, 2));

  console.log(`Backup tersimpan: ${outPath}`);
}

main().catch((err) => {
  console.error('Backup gagal:', err);
  process.exit(1);
});