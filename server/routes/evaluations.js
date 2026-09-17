const express = require("express");
const { ApiError } = require("../lib/api-error");
const validation = require("../lib/validation");

const evaluationProjection = `
  e.id,
  e.client_id AS cliente_id,
  c.name AS cliente_nombre,
  e.score AS calificacion,
  e.comment AS comentario,
  e.evaluated_at AS fecha,
  e.user_id AS usuario_id,
  u.name AS responsable_nombre
`;

function clientExists(db, id) {
  const client = db.prepare(`
    SELECT id FROM clients WHERE id = ? AND deleted_at IS NULL
  `).get(id);
  if (!client) throw new ApiError(404, "Cliente no encontrado.");
}

function evaluationById(db, id) {
  return db.prepare(`
    SELECT ${evaluationProjection}
    FROM evaluations e
    JOIN clients c ON c.id = e.client_id
    JOIN users u ON u.id = e.user_id
    WHERE e.id = ?
  `).get(id);
}

function createEvaluationsRouter({ db, auth }) {
  const router = express.Router();
  router.use((request, response, next) => {
    response.locals.apiRequest = true;
    next();
  });

  router.get("/evaluaciones", auth.requireAuth, (request, response) => {
    const filters = ["c.deleted_at IS NULL"];
    const values = [];
    if (request.user.role !== "admin" || request.query.mias === "1") {
      filters.push("e.user_id = ?");
      values.push(request.user.id);
    }
    if (request.query.cliente_id) {
      filters.push("e.client_id = ?");
      values.push(validation.positiveInteger(request.query.cliente_id, "cliente_id"));
    }
    const items = db.prepare(`
      SELECT ${evaluationProjection}
      FROM evaluations e
      JOIN clients c ON c.id = e.client_id
      JOIN users u ON u.id = e.user_id
      WHERE ${filters.join(" AND ")}
      ORDER BY e.evaluated_at DESC, e.id DESC
      LIMIT 100
    `).all(...values);
    response.json({ items });
  });

  router.get("/clientes/:id/evaluaciones", auth.requireAuth, (request, response) => {
    const clientId = validation.positiveInteger(request.params.id, "id");
    clientExists(db, clientId);
    const items = db.prepare(`
      SELECT ${evaluationProjection}
      FROM evaluations e
      JOIN clients c ON c.id = e.client_id
      JOIN users u ON u.id = e.user_id
      WHERE e.client_id = ?
      ORDER BY e.evaluated_at DESC, e.id DESC
    `).all(clientId);
    response.json({ items });
  });

  router.post("/evaluaciones", auth.requireAuth, (request, response) => {
    const clientId = validation.positiveInteger(request.body.cliente_id, "cliente_id");
    clientExists(db, clientId);
    const score = validation.integerInRange(request.body.calificacion, "calificación", {
      min: 1,
      max: 5
    });
    const comment = validation.optionalText(request.body.comentario, "comentario", { max: 2000 });
    const evaluatedAt = validation.isoDateTime(request.body.fecha);
    const result = db.prepare(`
      INSERT INTO evaluations (client_id, score, comment, evaluated_at, user_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(clientId, score, comment, evaluatedAt, request.user.id);
    response.status(201).json({ evaluation: evaluationById(db, result.lastInsertRowid) });
  });

  return router;
}

module.exports = { createEvaluationsRouter };
