BEGIN;

CREATE TABLE IF NOT EXISTS github_credentials (
  user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  encrypted_access_token TEXT NOT NULL,
  initialization_vector TEXT NOT NULL,
  authentication_tag TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE webhook_deliveries
  ADD COLUMN IF NOT EXISTS error_message TEXT,
  ADD COLUMN IF NOT EXISTS executed_action_count INTEGER NOT NULL DEFAULT 0;

COMMIT;
