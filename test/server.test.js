const assert = require("node:assert/strict");
const { once } = require("node:events");
const test = require("node:test");
const { DatabaseSync } = require("node:sqlite");
const { configureDatabase } = require("../server/database/database");
const { runMigrations } = require("../server/database/migrate");
const { createApp } = require("../server/app");

async function withServer(callback, { setupToken = null } = {}) {
  const db = new DatabaseSync(":memory:");
  configureDatabase(db);
  runMigrations(db);

  const app = createApp({ db, setupToken });
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");

  try {
    const address = server.address();
    await callback({ db, baseUrl: `http://127.0.0.1:${address.port}` });
  } finally {
    server.close();
    await once(server, "close");
    db.close();
  }
}

test("las migraciones crean las tablas principales del CRM", () => {
  const db = new DatabaseSync(":memory:");
  configureDatabase(db);
  const applied = runMigrations(db);

  const tables = db.prepare(`
    SELECT name
    FROM sqlite_schema
    WHERE type = 'table'
  `).all().map(row => row.name);

  assert.deepEqual(applied, ["001_crm_base.sql", "002_clients_unique_email.sql"]);
  assert.ok(tables.includes("users"));
  assert.ok(tables.includes("clients"));
  assert.ok(tables.includes("interactions"));
  assert.ok(tables.includes("sessions"));
  db.close();
});

test("el servidor entrega la portada y confirma la conexión SQLite", async () => {
  await withServer(async ({ baseUrl }) => {
    const healthResponse = await fetch(`${baseUrl}/api/salud`);
    const health = await healthResponse.json();

    assert.equal(healthResponse.status, 200);
    assert.deepEqual(health, {
      ok: true,
      service: "campusamigo-crm",
      database: "disponible"
    });

    const homeResponse = await fetch(`${baseUrl}/`);
    const home = await homeResponse.text();

    assert.equal(homeResponse.status, 200);
    assert.match(home, /Tu campus/);
  });
});

test("la configuración inicial crea un administrador y una sesión segura", async () => {
  await withServer(async ({ db, baseUrl }) => {
    const setupResponse = await fetch(`${baseUrl}/api/setup/admin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Setup-Token": "token-de-prueba"
      },
      body: JSON.stringify({
        name: "Administradora Demo",
        email: "admin@campusamigo.test",
        password: "ContrasenaSegura123"
      })
    });
    const setup = await setupResponse.json();
    const cookie = setupResponse.headers.get("set-cookie").split(";", 1)[0];

    assert.equal(setupResponse.status, 201);
    assert.equal(setup.user.role, "admin");
    assert.match(setupResponse.headers.get("set-cookie"), /HttpOnly/);
    assert.match(setupResponse.headers.get("set-cookie"), /SameSite=Lax/);

    const stored = db.prepare(`
      SELECT password_hash, password_salt
      FROM users
      WHERE email = ?
    `).get("admin@campusamigo.test");
    assert.notEqual(stored.password_hash, "ContrasenaSegura123");
    assert.ok(stored.password_salt);

    const meResponse = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Cookie: cookie }
    });
    const me = await meResponse.json();

    assert.equal(meResponse.status, 200);
    assert.equal(me.user.email, "admin@campusamigo.test");
  }, { setupToken: "token-de-prueba" });
});

test("el login rechaza credenciales incorrectas y el logout invalida la sesión", async () => {
  await withServer(async ({ baseUrl }) => {
    await fetch(`${baseUrl}/api/setup/admin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Setup-Token": "otro-token"
      },
      body: JSON.stringify({
        name: "Admin",
        email: "admin@campusamigo.test",
        password: "ContrasenaSegura123"
      })
    });

    const rejected = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@campusamigo.test",
        password: "ClaveEquivocada"
      })
    });
    assert.equal(rejected.status, 401);

    const accepted = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@campusamigo.test",
        password: "ContrasenaSegura123"
      })
    });
    const cookie = accepted.headers.get("set-cookie").split(";", 1)[0];
    assert.equal(accepted.status, 200);

    const logout = await fetch(`${baseUrl}/api/auth/logout`, {
      method: "POST",
      headers: { Cookie: cookie }
    });
    assert.equal(logout.status, 204);

    const me = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Cookie: cookie }
    });
    assert.deepEqual(await me.json(), { user: null });
  }, { setupToken: "otro-token" });
});

test("el CRUD de clientes exige sesión, valida duplicados y usa baja lógica", async () => {
  await withServer(async ({ db, baseUrl }) => {
    const unauthorized = await fetch(`${baseUrl}/clientes`);
    assert.equal(unauthorized.status, 401);

    const setupResponse = await fetch(`${baseUrl}/api/setup/admin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Setup-Token": "token-clientes"
      },
      body: JSON.stringify({
        name: "Admin CRM",
        email: "admin@campusamigo.test",
        password: "ContrasenaSegura123"
      })
    });
    const cookie = setupResponse.headers.get("set-cookie").split(";", 1)[0];

    const createResponse = await fetch(`${baseUrl}/clientes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie
      },
      body: JSON.stringify({
        nombre: "María López",
        correo: "maria@example.com",
        telefono: "4491234567",
        empresa: "Campus Norte",
        estado: "activo",
        etapa_crm: "Prospecto"
      })
    });
    const created = await createResponse.json();
    assert.equal(createResponse.status, 201);
    assert.equal(created.client.nombre, "María López");

    const duplicateResponse = await fetch(`${baseUrl}/clientes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie
      },
      body: JSON.stringify({
        nombre: "Otra persona",
        correo: "maria@example.com"
      })
    });
    assert.equal(duplicateResponse.status, 409);

    const stageResponse = await fetch(`${baseUrl}/clientes/${created.client.id}/etapa`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie
      },
      body: JSON.stringify({ etapa_crm: "Activo" })
    });
    const staged = await stageResponse.json();
    assert.equal(staged.client.etapa_crm, "Activo");

    const listResponse = await fetch(`${baseUrl}/clientes?q=Maria&etapa=Activo`, {
      headers: { Cookie: cookie }
    });
    const list = await listResponse.json();
    assert.equal(list.pagination.total, 1);

    const deleteResponse = await fetch(`${baseUrl}/clientes/${created.client.id}`, {
      method: "DELETE",
      headers: { Cookie: cookie }
    });
    assert.equal(deleteResponse.status, 204);

    const stored = db.prepare(`
      SELECT status, deleted_at
      FROM clients
      WHERE id = ?
    `).get(created.client.id);
    assert.equal(stored.status, "inactivo");
    assert.ok(stored.deleted_at);

    const afterDelete = await fetch(`${baseUrl}/clientes`, {
      headers: { Cookie: cookie }
    });
    assert.equal((await afterDelete.json()).pagination.total, 0);
  }, { setupToken: "token-clientes" });
});
