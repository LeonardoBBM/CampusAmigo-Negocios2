const {
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual
} = require("node:crypto");
const { ApiError } = require("../lib/api-error");

const PASSWORD_KEY_LENGTH = 64;

function passwordRecord(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, PASSWORD_KEY_LENGTH).toString("hex");
  return { hash, salt };
}

function verifyPassword(password, salt, expectedHash) {
  try {
    const calculated = scryptSync(password, salt, PASSWORD_KEY_LENGTH);
    const expected = Buffer.from(expectedHash, "hex");
    return calculated.length === expected.length && timingSafeEqual(calculated, expected);
  } catch {
    return false;
  }
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };
}

function createUser(db, { name, email, password, role = "user" }) {
  const { hash, salt } = passwordRecord(password);

  try {
    const result = db.prepare(`
      INSERT INTO users (name, email, password_hash, password_salt, role)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, email, hash, salt, role);

    return db.prepare(`
      SELECT id, name, email, role
      FROM users
      WHERE id = ?
    `).get(result.lastInsertRowid);
  } catch (error) {
    if (error.code === "ERR_SQLITE_CONSTRAINT_UNIQUE") {
      throw new ApiError(409, "Ya existe un usuario con ese correo.");
    }
    throw error;
  }
}

function findUserForLogin(db, email) {
  return db.prepare(`
    SELECT id, name, email, password_hash, password_salt, role, active
    FROM users
    WHERE email = ?
  `).get(email);
}

function tokenHash(token) {
  return createHash("sha256").update(token).digest("hex");
}

function createSession(db, userId, ttlHours) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString();

  db.prepare(`
    INSERT INTO sessions (token_hash, user_id, expires_at)
    VALUES (?, ?, ?)
  `).run(tokenHash(token), userId, expiresAt);

  return { token, expiresAt };
}

function removeSession(db, token) {
  if (!token) return;
  db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(tokenHash(token));
}

module.exports = {
  createSession,
  createUser,
  findUserForLogin,
  publicUser,
  removeSession,
  tokenHash,
  verifyPassword
};

