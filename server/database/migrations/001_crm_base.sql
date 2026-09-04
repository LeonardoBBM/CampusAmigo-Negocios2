CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 2 AND 100),
  email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 2 AND 120),
  email TEXT NOT NULL COLLATE NOCASE,
  phone TEXT NOT NULL DEFAULT '',
  company TEXT NOT NULL DEFAULT '',
  registered_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  status TEXT NOT NULL DEFAULT 'activo' CHECK (status IN ('activo', 'inactivo')),
  crm_stage TEXT NOT NULL DEFAULT 'Prospecto'
    CHECK (crm_stage IN ('Prospecto', 'Activo', 'Frecuente', 'Inactivo')),
  deleted_at TEXT
);

CREATE TABLE interactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('llamada', 'correo', 'reunion')),
  description TEXT NOT NULL CHECK (length(trim(description)) BETWEEN 3 AND 2000),
  occurred_at TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (client_id) REFERENCES clients(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX idx_clients_status_stage ON clients(status, crm_stage) WHERE deleted_at IS NULL;
CREATE INDEX idx_clients_name ON clients(name) WHERE deleted_at IS NULL;
CREATE INDEX idx_interactions_client_date ON interactions(client_id, occurred_at DESC);
CREATE INDEX idx_interactions_user_date ON interactions(user_id, occurred_at DESC);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
