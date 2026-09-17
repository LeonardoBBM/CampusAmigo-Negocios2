const express = require("express");
const { ApiError } = require("../lib/api-error");
const validation = require("../lib/validation");
const { createUser } = require("../services/auth-service");

const USER_ROLES = ["admin", "user"];
const userProjection = `
  id,
  name AS nombre,
  email AS correo,
  role AS rol,
  active AS activo,
  created_at AS fecha_registro
`;

function userById(db, id) {
  return db.prepare(`SELECT ${userProjection} FROM users WHERE id = ?`).get(id);
}

function activeValue(value) {
  if (value === true || value === 1 || value === "1") return 1;
  if (value === false || value === 0 || value === "0") return 0;
  throw new ApiError(400, "El campo activo debe ser verdadero o falso.");
}

function mapUserConstraintError(error) {
  if (
    error.code === "ERR_SQLITE_CONSTRAINT_UNIQUE"
    || /UNIQUE constraint failed: users\.email/.test(error.message)
  ) {
    throw new ApiError(409, "Ya existe un usuario con ese correo.");
  }
  throw error;
}

function createUsersRouter({ db, auth }) {
  const router = express.Router();
  router.use((request, response, next) => {
    response.locals.apiRequest = true;
    next();
  });

  router.get("/usuarios", auth.requireAuth, (request, response) => {
    const filters = [];
    const values = [];
    if (request.user.role !== "admin") {
      filters.push("id = ?");
      values.push(request.user.id);
    }
    if (request.query.activos === "1") filters.push("active = 1");
    const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
    const items = db.prepare(`
      SELECT ${userProjection}
      FROM users
      ${where}
      ORDER BY active DESC, name COLLATE NOCASE
    `).all(...values);
    response.json({ items });
  });

  router.post("/usuarios", auth.requireRole("admin"), (request, response) => {
    const role = validation.oneOf(request.body.rol || "user", "rol", USER_ROLES);
    const created = createUser(db, {
      name: validation.requiredText(request.body.nombre, "nombre", { min: 2, max: 100 }),
      email: validation.email(request.body.correo),
      password: validation.password(request.body.contrasena),
      role
    });
    response.status(201).json({ user: userById(db, created.id) });
  });

  router.put("/usuarios/:id", auth.requireRole("admin"), (request, response) => {
    const id = validation.positiveInteger(request.params.id, "id");
    const existing = userById(db, id);
    if (!existing) throw new ApiError(404, "Usuario no encontrado.");

    const name = validation.requiredText(request.body.nombre, "nombre", { min: 2, max: 100 });
    const email = validation.email(request.body.correo);
    const role = validation.oneOf(request.body.rol, "rol", USER_ROLES);
    const active = activeValue(request.body.activo);

    if (id === request.user.id && (!active || role !== "admin")) {
      throw new ApiError(400, "No puedes desactivar tu propia cuenta ni quitarte el rol administrador.");
    }

    if (existing.rol === "admin" && existing.activo && (!active || role !== "admin")) {
      const activeAdmins = db.prepare(`
        SELECT COUNT(*) AS total FROM users WHERE role = 'admin' AND active = 1
      `).get().total;
      if (activeAdmins <= 1) {
        throw new ApiError(400, "Debe permanecer al menos un administrador activo.");
      }
    }

    try {
      db.prepare(`
        UPDATE users
        SET name = ?, email = ?, role = ?, active = ?
        WHERE id = ?
      `).run(name, email, role, active, id);
      response.json({ user: userById(db, id) });
    } catch (error) {
      mapUserConstraintError(error);
    }
  });

  return router;
}

module.exports = { createUsersRouter };
