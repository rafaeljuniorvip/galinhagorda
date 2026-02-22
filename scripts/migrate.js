const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST || 'postgres16',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'galinhagorda',
});

async function migrate() {
  const client = await pool.connect();
  try {
    // Ensure migrations table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get executed migrations
    const { rows: executed } = await client.query('SELECT name FROM _migrations ORDER BY id');
    const executedNames = new Set(executed.map(r => r.name));

    // Get migration files
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    let ran = 0;
    for (const file of files) {
      if (executedNames.has(file)) {
        console.log(`[MIGRATE] Skip (already executed): ${file}`);
        continue;
      }

      console.log(`[MIGRATE] Running: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`[MIGRATE] OK: ${file}`);
        ran++;
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`[MIGRATE] FAILED: ${file}`, err.message);
        throw err;
      }
    }

    console.log(`[MIGRATE] Done. ${ran} migration(s) executed.`);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(err => {
  console.error('[MIGRATE] Fatal error:', err);
  process.exit(1);
});
