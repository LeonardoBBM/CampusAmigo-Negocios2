const { config } = require("./config");
const { createApp } = require("./app");
const { getDatabase, closeDatabase } = require("./database/database");
const { runMigrations } = require("./database/migrate");
const { createSetupToken } = require("./routes/auth");

const db = getDatabase();
const appliedMigrations = runMigrations(db);
const setupToken = createSetupToken(db);
const app = createApp({ db, setupToken });

const server = app.listen(config.port, config.host, () => {
  const migrationMessage = appliedMigrations.length
    ? ` Migraciones aplicadas: ${appliedMigrations.join(", ")}.`
    : "";
  process.stdout.write(
    `CampusAmigo disponible en http://${config.host}:${config.port}.${migrationMessage}\n`
  );
  if (setupToken) {
    process.stdout.write(
      `Configuración inicial pendiente. Token temporal: ${setupToken}\n`
    );
  }
});

function shutdown(signal) {
  process.stdout.write(`Cerrando CampusAmigo (${signal})...\n`);
  server.close(() => {
    closeDatabase();
    process.exit(0);
  });
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
