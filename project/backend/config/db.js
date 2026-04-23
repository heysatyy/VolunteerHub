// config/db.js — Hybrid Database Configuration
// Uses PostgreSQL for Production (Render) and SQLite for Local Development

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const isProduction = process.env.NODE_ENV === 'production' || !!process.env.DATABASE_URL;
let dbPool = null; // For PostgreSQL
let sqliteDb = null; // For SQLite
let SQL = null;
const DB_PATH = path.join(__dirname, '..', 'volunteerhub.db');

let _lastInsertId = 0;

// ── PostgreSQL Logic ──────────────────────────────────────
async function initPostgres() {
  dbPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Required for Render/Neon
  });
  console.log('✅ Connected to PostgreSQL');
}

// ── SQLite Logic (sql.js) ──────────────────────────────────
function saveSqlite() {
  if (!sqliteDb) return;
  const data = sqliteDb.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

async function initSqlite() {
  const initSql = require('sql.js');
  SQL = await initSql();
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    sqliteDb = new SQL.Database(fileBuffer);
    console.log('✅ SQLite DB loaded from file:', DB_PATH);
  } else {
    sqliteDb = new SQL.Database();
    console.log('✅ SQLite DB created fresh');
    // Initial tables will be created by the server if needed
  }
}

// ── Unified Interface ─────────────────────────────────────

async function initDb() {
  if (isProduction) {
    await initPostgres();
    await createTables();
    await seedData();
  } else {
    await initSqlite();
    // For SQLite, if it's fresh, we create tables (logic moved here for clarity)
    const tableCheck = sqliteDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").getAsObject();
    if (!tableCheck.name) {
      console.log('📦 Initializing SQLite tables...');
      await createTables();
      await seedData();
      saveSqlite();
    }
  }
}

async function createTables() {
  const isPg = isProduction;
  const autoInc = isPg ? 'SERIAL' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
  const now = isPg ? 'CURRENT_TIMESTAMP' : "(datetime('now'))";
  const pk = isPg ? 'PRIMARY KEY' : '';

  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id         ${isPg ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
      name       TEXT NOT NULL,
      email      TEXT UNIQUE NOT NULL,
      phone      TEXT,
      password   TEXT NOT NULL,
      role       TEXT DEFAULT 'volunteer',
      is_active  INTEGER DEFAULT 1,
      created_at TEXT DEFAULT ${now}
    )`,
    `CREATE TABLE IF NOT EXISTS volunteers (
      id              ${isPg ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
      user_id         INTEGER NOT NULL,
      dob             TEXT,
      address         TEXT,
      skills          TEXT,
      availability    TEXT DEFAULT 'flexible',
      emergency_name  TEXT,
      emergency_phone TEXT,
      status          TEXT DEFAULT 'pending',
      total_hours     INTEGER DEFAULT 0,
      created_at      TEXT DEFAULT ${now}
    )`,
    `CREATE TABLE IF NOT EXISTS events (
      id             ${isPg ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
      title          TEXT NOT NULL,
      description    TEXT,
      event_date     TEXT NOT NULL,
      start_time     TEXT,
      end_time       TEXT,
      location       TEXT,
      max_volunteers INTEGER DEFAULT 50,
      status         TEXT DEFAULT 'upcoming',
      created_by     INTEGER,
      created_at     TEXT DEFAULT ${now}
    )`,
    `CREATE TABLE IF NOT EXISTS event_assignments (
      id           ${isPg ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
      event_id     INTEGER NOT NULL,
      volunteer_id INTEGER NOT NULL,
      status       TEXT DEFAULT 'assigned',
      hours_logged REAL DEFAULT 0,
      assigned_at  TEXT DEFAULT ${now},
      UNIQUE(event_id, volunteer_id)
    )`,
    `CREATE TABLE IF NOT EXISTS donors (
      id           ${isPg ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
      name         TEXT NOT NULL,
      email        TEXT,
      phone        TEXT,
      address      TEXT,
      is_anonymous INTEGER DEFAULT 0,
      created_at   TEXT DEFAULT ${now}
    )`,
    `CREATE TABLE IF NOT EXISTS donations (
      id             ${isPg ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
      donor_id       INTEGER,
      amount         REAL NOT NULL,
      payment_method TEXT NOT NULL,
      category       TEXT DEFAULT 'general',
      transaction_id TEXT,
      receipt_number TEXT UNIQUE,
      status         TEXT DEFAULT 'pending',
      notes          TEXT,
      donated_at     TEXT DEFAULT ${now},
      recorded_by    INTEGER
    )`,
    `CREATE TABLE IF NOT EXISTS notifications (
      id         ${isPg ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
      user_id    INTEGER NOT NULL,
      title      TEXT NOT NULL,
      message    TEXT,
      type       TEXT DEFAULT 'system',
      is_read    INTEGER DEFAULT 0,
      created_at TEXT DEFAULT ${now}
    )`,
    `CREATE TABLE IF NOT EXISTS fund_allocations (
      id            ${isPg ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
      category      TEXT NOT NULL DEFAULT 'general',
      description   TEXT NOT NULL,
      amount        REAL NOT NULL,
      allocated_by  INTEGER,
      allocated_at  TEXT DEFAULT ${now}
    )`
  ];

  for (const sql of tables) {
    await run(sql);
  }
  console.log('✅ Tables checked/created');
}

async function seedData() {
  const userCount = await get('SELECT COUNT(*) as count FROM users');
  if (parseInt(userCount.count) > 0) return; // Already seeded

  console.log('🌱 Seeding initial data...');
  const bcrypt = require('bcryptjs');
  const hashed = bcrypt.hashSync('password', 10);

  await run(`INSERT INTO users (name, email, phone, password, role) VALUES (?,?,?,?,?)`,
    ['Admin User', 'admin@volunteerhub.org', '9000000001', hashed, 'admin']);
  
  // Add other seed data if needed...
  console.log('✅ Seeding complete');
}

async function run(sql, params = []) {
  // Convert SQLite placeholders (?) to PostgreSQL placeholders ($1, $2, ...)
  let pgSql = sql;
  if (isProduction) {
    let count = 1;
    pgSql = sql.replace(/\?/g, () => `$${count++}`);
    // Replace AUTOINCREMENT with SERIAL in CREATE TABLE (only if running migrations)
    pgSql = pgSql.replace(/AUTOINCREMENT/g, ''); 
  }

  if (isProduction) {
    const res = await dbPool.query(pgSql, params);
    // In PG, we usually use RETURNING id, but for simplicity:
    const lastRow = await dbPool.query('SELECT lastval() as id').catch(() => ({ rows: [{ id: 0 }] }));
    _lastInsertId = lastRow.rows[0]?.id || 0;
  } else {
    sqliteDb.run(sql, params);
    const row = sqliteDb.prepare('SELECT last_insert_rowid() AS id').getAsObject();
    _lastInsertId = row.id;
    saveSqlite();
  }
}

async function all(sql, params = []) {
  let pgSql = sql;
  if (isProduction) {
    let count = 1;
    pgSql = sql.replace(/\?/g, () => `$${count++}`);
    const res = await dbPool.query(pgSql, params);
    return res.rows;
  } else {
    const stmt = sqliteDb.prepare(sql);
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
  }
}

async function get(sql, params = []) {
  const rows = await all(sql, params);
  return rows[0] || null;
}

function lastInsertRowId() {
  return _lastInsertId;
}

function saveDb() {
  if (!isProduction) saveSqlite();
}

module.exports = { initDb, run, all, get, lastInsertRowId, saveDb };

