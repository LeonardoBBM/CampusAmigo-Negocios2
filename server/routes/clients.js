const express = require("express");
const { ApiError } = require("../lib/api-error");
const validation = require("../lib/validation");

const CLIENT_STATUSES = ["activo", "inactivo"];
const CRM_STAGES = ["Prospecto", "Activo", "Frecuente", "Inactivo"];

const clientProjection = `
  id,
  name AS nombre,
  email AS correo,
  phone AS telefono,
  company AS empresa,
  registered_at AS fecha_registro,
  status AS estado,
  crm_stage AS etapa_crm
`;

function clientInput(body) {
  return {
    nombre: validation.requiredText(body.nombre, "nombre", { min: 2, max: 120 }),
    correo: validation.email(body.correo),
    telefono: validation.optionalText(body.telefono, "teléfono", { max: 30 }),
    empresa: validation.optionalText(body.empresa, "empresa", { max: 120 }),
    estado: validation.oneOf(body.estado || "activo", "estado", CLIENT_STATUSES),
    etapaCrm: validation.oneOf(
      body.etapa_crm || "Prospecto",
      "etapa_crm",
      CRM_STAGES
    )
  };
}

function clientById(db, id) {
  return db.prepare(`
    SELECT ${clientProjection}
    FROM clients
    WHERE id = ? AND deleted_at IS NULL
  `).get(id);
}

function existingClient(db, id) {
  const client = clientById(db, id);
  if (!client) throw new ApiError(404, "Cliente no encontrado.");
  return client;
}

function mapConstraintError(error) {
  if (
    error.errcode === 2067
    || error.code === "ERR_SQLITE_CONSTRAINT_UNIQUE"
    || /UNIQUE constraint failed: clients\.email/.test(error.message)
  ) {
    throw new ApiError(409, "Ya existe un cliente con ese correo.");
  }
  throw error;
}

function createClientsRouter({ db, auth }) {
  const router = express.Router();

  router.use((request, response, next) => {
    response.locals.apiRequest = true;
    next();
  });

  router.get("/clientes", auth.requireAuth, (request, response) => {
    const filters = ["deleted_at IS NULL"];
    const values = [];

    if (request.query.q) {
      const term = validation.requiredText(request.query.q, "búsqueda", { max: 100 });
      filters.push(`(
        name LIKE ? ESCAPE '\\'
        OR email LIKE ? ESCAPE '\\'
        OR phone LIKE ? ESCAPE '\\'
        OR company LIKE ? ESCAPE '\\'
      )`);
      const escaped = term.replace(/[\\%_]/g, character => `\\${character}`);
      values.push(...Array(4).fill(`%${escaped}%`));
    }

    if (request.query.estado) {
      filters.push("status = ?");
      values.push(validation.oneOf(request.query.estado, "estado", CLIENT_STATUSES));
    }

    if (request.query.etapa) {
      filters.push("crm_stage = ?");
      values.push(validation.oneOf(request.query.etapa, "etapa", CRM_STAGES));
    }

    const page = request.query.page
      ? validation.positiveInteger(request.query.page, "page")
      : 1;
    const requestedLimit = request.query.limit
      ? validation.positiveInteger(request.query.limit, "limit")
      : 20;
    const limit = Math.min(requestedLimit, 100);
    const offset = (page - 1) * limit;
    const where = filters.join(" AND ");

    const total = db.prepare(`
      SELECT COUNT(*) AS total
      FROM clients
      WHERE ${where}
    `).get(...values).total;

    const items = db.prepare(`
      SELECT ${clientProjection}
      FROM clients
      WHERE ${where}
      ORDER BY registered_at DESC, id DESC
      LIMIT ? OFFSET ?
    `).all(...values, limit, offset);

    response.json({
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit))
      }
    });
  });

  router.get("/clientes/:id", auth.requireAuth, (request, response) => {
    const id = validation.positiveInteger(request.params.id, "id");
    response.json({ client: existingClient(db, id) });
  });

  router.post("/clientes", auth.requireRole("admin"), (request, response) => {
    const input = clientInput(request.body);

    try {
      const result = db.prepare(`
        INSERT INTO clients (name, email, phone, company, status, crm_stage)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        input.nombre,
        input.correo,
        input.telefono,
        input.empresa,
        input.estado,
        input.etapaCrm
      );
      const client = clientById(db, result.lastInsertRowid);
      response.location(`/clientes/${client.id}`);
      response.status(201).json({ client });
    } catch (error) {
      mapConstraintError(error);
    }
  });

  router.put("/clientes/:id", auth.requireRole("admin"), (request, response) => {
    const id = validation.positiveInteger(request.params.id, "id");
    existingClient(db, id);
    const input = clientInput(request.body);

    try {
      db.prepare(`
        UPDATE clients
        SET name = ?, email = ?, phone = ?, company = ?, status = ?, crm_stage = ?
        WHERE id = ? AND deleted_at IS NULL
      `).run(
        input.nombre,
        input.correo,
        input.telefono,
        input.empresa,
        input.estado,
        input.etapaCrm,
        id
      );
      response.json({ client: clientById(db, id) });
    } catch (error) {
      mapConstraintError(error);
    }
  });

  router.put("/clientes/:id/etapa", auth.requireAuth, (request, response) => {
    const id = validation.positiveInteger(request.params.id, "id");
    existingClient(db, id);
    const stage = validation.oneOf(request.body.etapa_crm, "etapa_crm", CRM_STAGES);

    db.prepare(`
      UPDATE clients
      SET crm_stage = ?
      WHERE id = ? AND deleted_at IS NULL
    `).run(stage, id);

    response.json({ client: clientById(db, id) });
  });

  router.delete("/clientes/:id", auth.requireRole("admin"), (request, response) => {
    const id = validation.positiveInteger(request.params.id, "id");
    existingClient(db, id);

    db.prepare(`
      UPDATE clients
      SET deleted_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), status = 'inactivo'
      WHERE id = ? AND deleted_at IS NULL
    `).run(id);

    response.status(204).end();
  });

  return router;
}

module.exports = {
  CLIENT_STATUSES,
  CRM_STAGES,
  createClientsRouter
};
