-- Comptes utilisateurs (auth serveur, partagés entre appareils)

CREATE TABLE IF NOT EXISTS app_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('citizen', 'cabinet', 'admin')),
    public_profile TEXT NOT NULL CHECK (
        public_profile IN ('citizen', 'student', 'enterprise', 'jurist')
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS app_users_email_lower_idx ON app_users (lower(email));

DROP TRIGGER IF EXISTS app_users_updated_at ON app_users;
CREATE TRIGGER app_users_updated_at
    BEFORE UPDATE ON app_users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

GRANT ALL PRIVILEGES ON TABLE app_users TO nyatefe;
