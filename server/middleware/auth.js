const { ApiError } = require("../lib/api-error");
const { publicUser, removeSession, tokenHash } = require("../services/auth-service");

const SESSION_COOKIE = "campusamigo_session";

function parseCookies(header = "") {
  return Object.fromEntries(
    header.split(";")
      .map(part => part.trim())
      .filter(Boolean)
      .map(part => {
        const separator = part.indexOf("=");
        if (separator < 0) return [part, ""];
        return [part.slice(0, separator), decodeURIComponent(part.slice(separator + 1))];
      })
  );
}

function sessionCookie(token, ttlHours, secure) {
  const attributes = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "HttpOnly",
    "Path=/",
    "SameSite=Lax",
    `Max-Age=${ttlHours * 60 * 60}`
  ];
  if (secure) attributes.push("Secure");
  return attributes.join("; ");
}

function expiredSessionCookie(secure) {
  const attributes = [
    `${SESSION_COOKIE}=`,
    "HttpOnly",
    "Path=/",
    "SameSite=Lax",
    "Max-Age=0"
  ];
  if (secure) attributes.push("Secure");
  return attributes.join("; ");
}

function createAuthMiddleware({ db }) {
  function optionalAuth(request, response, next) {
    const token = parseCookies(request.headers.cookie)[SESSION_COOKIE];
    request.sessionToken = token || null;
    request.user = null;

    if (!token) return next();

    const row = db.prepare(`
      SELECT u.id, u.name, u.email, u.role
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ?
        AND s.expires_at > ?
        AND u.active = 1
    `).get(tokenHash(token), new Date().toISOString());

    if (!row) {
      removeSession(db, token);
      response.set("Set-Cookie", expiredSessionCookie(request.secure));
      return next();
    }

    request.user = publicUser(row);
    return next();
  }

  function requireAuth(request, response, next) {
    if (!request.user) {
      return next(new ApiError(401, "Necesitas iniciar sesión."));
    }
    return next();
  }

  function requireRole(...roles) {
    return function roleMiddleware(request, response, next) {
      if (!request.user) return next(new ApiError(401, "Necesitas iniciar sesión."));
      if (!roles.includes(request.user.role)) {
        return next(new ApiError(403, "No tienes permiso para realizar esta acción."));
      }
      return next();
    };
  }

  return {
    optionalAuth,
    requireAuth,
    requireRole
  };
}

module.exports = {
  SESSION_COOKIE,
  createAuthMiddleware,
  expiredSessionCookie,
  parseCookies,
  sessionCookie
};

