const { randomBytes, timingSafeEqual } = require("node:crypto");
const express = require("express");
const { config } = require("../config");
const { ApiError } = require("../lib/api-error");
const validation = require("../lib/validation");
const {
  createSession,
  createUser,
  findUserForLogin,
  publicUser,
  removeSession,
  verifyPassword
} = require("../services/auth-service");
const {
  expiredSessionCookie,
  sessionCookie
} = require("../middleware/auth");

function safeTokenEquals(provided, expected) {
  if (typeof provided !== "string" || typeof expected !== "string") return false;
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

function createSetupToken(db) {
  const users = db.prepare("SELECT COUNT(*) AS total FROM users").get().total;
  return users === 0 ? randomBytes(24).toString("base64url") : null;
}

function createAuthRouter({ db, auth, setupToken = null }) {
  const router = express.Router();
  let activeSetupToken = setupToken;

  router.get("/setup/status", (request, response) => {
    const total = db.prepare("SELECT COUNT(*) AS total FROM users").get().total;
    response.json({ needsSetup: total === 0 });
  });

  router.post("/setup/admin", (request, response, next) => {
    const total = db.prepare("SELECT COUNT(*) AS total FROM users").get().total;
    if (total > 0) return next(new ApiError(409, "La configuración inicial ya fue completada."));

    const providedToken = request.get("X-Setup-Token");
    if (!activeSetupToken || !safeTokenEquals(providedToken, activeSetupToken)) {
      return next(new ApiError(403, "Token de configuración inválido."));
    }

    const user = createUser(db, {
      name: validation.requiredText(request.body.name, "nombre", { min: 2, max: 100 }),
      email: validation.email(request.body.email),
      password: validation.password(request.body.password),
      role: "admin"
    });
    const session = createSession(db, user.id, config.sessionTtlHours);
    activeSetupToken = null;

    response.set(
      "Set-Cookie",
      sessionCookie(session.token, config.sessionTtlHours, request.secure)
    );
    return response.status(201).json({ user: publicUser(user) });
  });

  router.post("/auth/login", (request, response, next) => {
    const email = validation.email(request.body.email);
    const password = validation.password(request.body.password);
    const user = findUserForLogin(db, email);

    if (!user || !user.active || !verifyPassword(
      password,
      user.password_salt,
      user.password_hash
    )) {
      return next(new ApiError(401, "Correo o contraseña incorrectos."));
    }

    const session = createSession(db, user.id, config.sessionTtlHours);
    response.set(
      "Set-Cookie",
      sessionCookie(session.token, config.sessionTtlHours, request.secure)
    );
    return response.json({ user: publicUser(user) });
  });

  router.post("/auth/logout", (request, response) => {
    removeSession(db, request.sessionToken);
    response.set("Set-Cookie", expiredSessionCookie(request.secure));
    response.status(204).end();
  });

  router.get("/auth/me", (request, response) => {
    response.json({ user: request.user });
  });

  return router;
}

module.exports = {
  createAuthRouter,
  createSetupToken
};
