const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");

function integerFromEnv(name, fallback, { min, max }) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;

  const value = Number.parseInt(raw, 10);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${name} debe ser un entero entre ${min} y ${max}.`);
  }

  return value;
}

const config = Object.freeze({
  projectRoot,
  host: process.env.HOST || "127.0.0.1",
  port: integerFromEnv("PORT", 3000, { min: 1, max: 65535 }),
  databasePath: path.resolve(
    projectRoot,
    process.env.CAMPUSAMIGO_DB_PATH || "data/campusamigo.sqlite"
  ),
  sessionTtlHours: integerFromEnv("SESSION_TTL_HOURS", 8, { min: 1, max: 168 })
});

module.exports = { config };

