-- Ejecutar una vez en Postgres (Railway / local) tras desplegar código que usa esta columna.
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS created_by_user_id integer REFERENCES users(id);
CREATE INDEX IF NOT EXISTS tickets_created_by_user_id_idx ON tickets(created_by_user_id);

UPDATE tickets t
SET created_by_user_id = u.id
FROM users u
WHERE t.created_by_user_id IS NULL
  AND lower(trim(t.created_by)) = lower(trim(u.name));
