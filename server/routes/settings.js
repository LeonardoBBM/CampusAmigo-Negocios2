const express = require("express");
const validation = require("../lib/validation");

function readSettings(db) {
  const riskDays = db.prepare(`
    SELECT value FROM crm_settings WHERE key = 'risk_days'
  `).get();
  return { dias_riesgo: Number.parseInt(riskDays?.value || "30", 10) };
}

function createSettingsRouter({ db, auth }) {
  const router = express.Router();
  router.use((request, response, next) => {
    response.locals.apiRequest = true;
    next();
  });

  router.get("/configuracion", auth.requireAuth, (request, response) => {
    response.json({ settings: readSettings(db) });
  });

  router.put("/configuracion", auth.requireRole("admin"), (request, response) => {
    const riskDays = validation.integerInRange(request.body.dias_riesgo, "días de riesgo", {
      min: 1,
      max: 365
    });
    db.prepare(`
      INSERT INTO crm_settings (key, value, updated_at)
      VALUES ('risk_days', ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = excluded.updated_at
    `).run(String(riskDays));
    response.json({ settings: readSettings(db) });
  });

  return router;
}

module.exports = { createSettingsRouter, readSettings };
