-- Historique de chat par compte (partagé entre appareils)

CREATE TABLE IF NOT EXISTS chat_conversations (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    updated_at_ms BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS chat_conversations_user_updated_idx
    ON chat_conversations (user_id, updated_at_ms DESC);

CREATE TABLE IF NOT EXISTS chat_turns (
    id UUID PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    position INT NOT NULL,
    question TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('ok', 'error')),
    answer JSONB,
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS chat_turns_conversation_position_idx
    ON chat_turns (conversation_id, position);

DROP TRIGGER IF EXISTS chat_conversations_updated_at ON chat_conversations;
CREATE TRIGGER chat_conversations_updated_at
    BEFORE UPDATE ON chat_conversations
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

GRANT ALL PRIVILEGES ON TABLE chat_conversations TO nyatefe;
GRANT ALL PRIVILEGES ON TABLE chat_turns TO nyatefe;
