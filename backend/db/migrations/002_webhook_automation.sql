BEGIN;

CREATE TABLE IF NOT EXISTS automation_rules (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  repository_id BIGINT NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  action_type TEXT NOT NULL DEFAULT 'record_event',
  configuration JSONB NOT NULL DEFAULT '{}'::JSONB,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, repository_id, event_name, action_type)
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id BIGSERIAL PRIMARY KEY,
  delivery_id TEXT NOT NULL UNIQUE,
  repository_id BIGINT REFERENCES repositories(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  action_name TEXT,
  payload JSONB NOT NULL,
  status TEXT NOT NULL,
  matched_rule_count INTEGER NOT NULL DEFAULT 0,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_automation_rules_repository_event
  ON automation_rules (repository_id, event_name)
  WHERE enabled = TRUE;

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_repository_received
  ON webhook_deliveries (repository_id, received_at DESC);

COMMIT;
