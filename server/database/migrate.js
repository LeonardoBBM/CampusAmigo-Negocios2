const fs = require("node:fs");
const path = require("node:path");
const { getDatabase, closeDatabase } = require("./database");

const migrationsDirectory = path.join(__dirname, "migrations");

function ensureMigrationsTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    )
  `);
}

function migrationFiles() {
  return fs.readdirSync(migrationsDirectory)
    .filter(file => file.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b));
}

function runMigrations(db = getDatabase()) {
  ensureMigrationsTable(db);

  const alreadyApplied = db.prepare("SELECT 1 FROM schema_migrations WHERE name = ?");
  const recordMigration = db.prepare("INSERT INTO schema_migrations (name) VALUES (?)");
  const applied = [];

  for (const file of migrationFiles()) {
    if (alreadyApplied.get(file)) continue;

    const sql = fs.readFileSync(path.join(migrationsDirectory, file), "utf8");
    db.exec("BEGIN IMMEDIATE");

    try {
      db.exec(sql);
      recordMigration.run(file);
      db.exec("COMMIT");
      applied.push(file);
    } catch (error) {
      db.exec("ROLLBACK");
      throw new Error(`No se pudo aplicar la migración ${file}: ${error.message}`, {
        cause: error
      });
    }
  }

  db.exec("PRAGMA optimize");
  return applied;
}

if (require.main === module) {
  try {
    const applied = runMigrations();
    const message = applied.length
      ? `Migraciones aplicadas: ${applied.join(", ")}`
      : "La base de datos ya está actualizada.";
    process.stdout.write(`${message}\n`);
  } finally {
    closeDatabase();
  }
}

module.exports = { runMigrations };

