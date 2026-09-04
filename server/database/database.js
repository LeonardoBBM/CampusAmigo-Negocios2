const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");
const { config } = require("../config");

let database;

function configureDatabase(db) {
  db.exec("PRAGMA foreign_keys = ON");
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA busy_timeout = 5000");
}

function getDatabase() {
  if (database) return database;

  fs.mkdirSync(path.dirname(config.databasePath), { recursive: true });
  database = new DatabaseSync(config.databasePath, { timeout: 5000 });
  configureDatabase(database);
  return database;
}

function closeDatabase() {
  if (!database) return;
  database.close();
  database = undefined;
}

module.exports = {
  configureDatabase,
  getDatabase,
  closeDatabase
};

