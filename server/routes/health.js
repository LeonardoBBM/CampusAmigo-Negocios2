const express = require("express");

function createHealthRouter({ db }) {
  const router = express.Router();

  router.get("/salud", (request, response) => {
    const check = db.prepare("SELECT 1 AS ok").get();

    response.json({
      ok: check.ok === 1,
      service: "campusamigo-crm",
      database: "disponible"
    });
  });

  return router;
}

module.exports = { createHealthRouter };

