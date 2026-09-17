const express = require("express");
const { ApiError } = require("../lib/api-error");
const validation = require("../lib/validation");

const INTERACTION_TYPES = ["llamada", "correo", "reunion", "otro"];

const interactionProjection = `
  i.id,
  i.client_id AS cliente_id,
  c.name AS cliente_nombre,
  i.type AS tipo,
  i.description AS descripcion,
  i.occurred_at AS fecha,
  i.user_id AS usuario_id,
  u.name AS responsable_nombre
`;

function clientExists(db, id) {
  const client = db.prepare(`
    SELECT id FROM clients WHERE id = ? AND deleted_at IS NULL
  `).get(id);
  if (!client) throw new ApiError(404, "Cliente no encontrado.");
}

function activeUserExists(db, id) {
  const user = db.prepare("SELECT id FROM users WHERE id = ? AND active = 1").get(id);
  if (!user) throw new ApiError(400, "El usuario responsable no está disponible.");
}

function interactionById(db, id) {
  return db.prepare(`
    SELECT ${interactionProjection}
    FROM interactions i
    JOIN clients c ON c.id = i.client_id
    JOIN users u ON u.id = i.user_id
    WHERE i.id = ?
  `).get(id);
}

function dateBounds(query) {
  const from = query.desde
    ? `${validation.dateOnly(query.desde, "desde")}T00:00:00.000Z`
    : null;
  let until = null;
  if (query.hasta) {
    const end = new Date(`${validation.dateOnly(query.hasta, "hasta")}T00:00:00.000Z`);
    end.setUTCDate(end.getUTCDate() + 1);
    until = end.toISOString();
  }
  if (from && until && from >= until) {
    throw new ApiError(400, "La fecha desde debe ser anterior o igual a la fecha hasta.");
  }
  return { from, until };
}

function createInteractionsRouter({ db, auth }) {
  const router = express.Router();

  router.use((request, response, next) => {
    response.locals.apiRequest = true;
    next();
  });

  router.get("/interacciones", auth.requireAuth, (request, response) => {
    const filters = ["c.deleted_at IS NULL"];
    const values = [];
    const { from, until } = dateBounds(request.query);

    if (request.user.role !== "admin" || request.query.mias === "1") {
      filters.push("i.user_id = ?");
      values.push(request.user.id);
    } else if (request.query.usuario_id) {
      filters.push("i.user_id = ?");
      values.push(validation.positiveInteger(request.query.usuario_id, "usuario_id"));
    }

    if (request.query.cliente_id) {
      filters.push("i.client_id = ?");
      values.push(validation.positiveInteger(request.query.cliente_id, "cliente_id"));
    }
    if (request.query.tipo) {
      filters.push("i.type = ?");
      values.push(validation.oneOf(request.query.tipo, "tipo", INTERACTION_TYPES));
    }
    if (request.query.q) {
      const term = validation.requiredText(request.query.q, "búsqueda", { max: 100 });
      filters.push("(c.name LIKE ? ESCAPE '\\' OR i.description LIKE ? ESCAPE '\\')");
      const escaped = `%${term.replace(/[\\%_]/g, character => `\\${character}`)}%`;
      values.push(escaped, escaped);
    }
    if (from) {
      filters.push("i.occurred_at >= ?");
      values.push(from);
    }
    if (until) {
      filters.push("i.occurred_at < ?");
      values.push(until);
    }

    const page = request.query.page
      ? validation.positiveInteger(request.query.page, "page")
      : 1;
    const limit = Math.min(
      request.query.limit ? validation.positiveInteger(request.query.limit, "limit") : 50,
      100
    );
    const where = filters.join(" AND ");
    const total = db.prepare(`
      SELECT COUNT(*) AS total
      FROM interactions i
      JOIN clients c ON c.id = i.client_id
      WHERE ${where}
    `).get(...values).total;
    const items = db.prepare(`
      SELECT ${interactionProjection}
      FROM interactions i
      JOIN clients c ON c.id = i.client_id
      JOIN users u ON u.id = i.user_id
      WHERE ${where}
      ORDER BY i.occurred_at DESC, i.id DESC
      LIMIT ? OFFSET ?
    `).all(...values, limit, (page - 1) * limit);

    response.json({
      items,
      pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) }
    });
  });

  router.get("/clientes/:id/interacciones", auth.requireAuth, (request, response) => {
    const clientId = validation.positiveInteger(request.params.id, "id");
    clientExists(db, clientId);
    const items = db.prepare(`
      SELECT ${interactionProjection}
      FROM interactions i
      JOIN clients c ON c.id = i.client_id
      JOIN users u ON u.id = i.user_id
      WHERE i.client_id = ?
      ORDER BY i.occurred_at DESC, i.id DESC
    `).all(clientId);
    response.json({ items });
  });

  router.post("/interacciones", auth.requireAuth, (request, response) => {
    const clientId = validation.positiveInteger(request.body.cliente_id, "cliente_id");
    clientExists(db, clientId);
    const type = validation.oneOf(request.body.tipo, "tipo", INTERACTION_TYPES);
    const description = validation.requiredText(
      request.body.descripcion,
      "descripción",
      { min: 3, max: 2000 }
    );
    const occurredAt = validation.isoDateTime(request.body.fecha);
    const userId = request.user.role === "admin" && request.body.usuario_id
      ? validation.positiveInteger(request.body.usuario_id, "usuario_id")
      : request.user.id;
    activeUserExists(db, userId);

    const result = db.prepare(`
      INSERT INTO interactions (client_id, type, description, occurred_at, user_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(clientId, type, description, occurredAt, userId);

    const interaction = interactionById(db, result.lastInsertRowid);
    response.location(`/interacciones/${interaction.id}`);
    response.status(201).json({ interaction });
  });

  return router;
}

module.exports = { INTERACTION_TYPES, createInteractionsRouter };
