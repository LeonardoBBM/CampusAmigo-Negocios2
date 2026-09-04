CREATE UNIQUE INDEX idx_clients_email_active
ON clients(email)
WHERE deleted_at IS NULL;

