-- Email del creador (único y estable). Ejecutar tras 001 si aún no existe la columna.
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS created_by_email text;

CREATE INDEX IF NOT EXISTS tickets_created_by_email_norm_idx ON tickets (lower(trim(created_by_email)));

UPDATE tickets t
SET created_by_email = lower(trim(u.email))
FROM users u
WHERE t.created_by_user_id = u.id
  AND (t.created_by_email IS NULL OR trim(t.created_by_email) = '');

UPDATE tickets t
SET created_by_email = lower(trim(u.email))
FROM users u
WHERE t.created_by_user_id IS NULL
  AND (t.created_by_email IS NULL OR trim(t.created_by_email) = '')
  AND lower(trim(t.created_by)) = lower(trim(u.name));
