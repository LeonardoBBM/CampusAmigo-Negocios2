ALTER TABLE interactions RENAME TO interactions_previous;

CREATE TABLE interactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('llamada', 'correo', 'reunion', 'otro')),
  description TEXT NOT NULL CHECK (length(trim(description)) BETWEEN 3 AND 2000),
  occurred_at TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (client_id) REFERENCES clients(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT
);

INSERT INTO interactions (
  id,
  client_id,
  type,
  description,
  occurred_at,
  user_id,
  created_at
)
SELECT
  id,
  client_id,
  type,
  description,
  occurred_at,
  user_id,
  created_at
FROM interactions_previous;

DROP TABLE interactions_previous;

CREATE INDEX idx_interactions_client_date ON interactions(client_id, occurred_at DESC);
CREATE INDEX idx_interactions_user_date ON interactions(user_id, occurred_at DESC);
CREATE INDEX idx_interactions_type_date ON interactions(type, occurred_at DESC);

CREATE TABLE evaluations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  score INTEGER NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment TEXT NOT NULL DEFAULT '' CHECK (length(comment) <= 2000),
  evaluated_at TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (client_id) REFERENCES clients(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE INDEX idx_evaluations_client_date ON evaluations(client_id, evaluated_at DESC);
CREATE INDEX idx_evaluations_user_date ON evaluations(user_id, evaluated_at DESC);

CREATE TABLE crm_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

INSERT INTO crm_settings (key, value) VALUES ('risk_days', '30');
