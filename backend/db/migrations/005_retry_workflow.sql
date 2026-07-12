BEGIN;

CREATE TABLE IF NOT EXISTS workflow_definitions (
  workflow_id BIGSERIAL PRIMARY KEY,
  workflow_key TEXT NOT NULL UNIQUE,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  cron_expression TEXT NOT NULL,
  retry_count INTEGER NOT NULL CHECK (retry_count >= 0),
  lookback_minutes INTEGER NOT NULL CHECK (lookback_minutes > 0),
  stale_running_minutes INTEGER NOT NULL CHECK (stale_running_minutes > 0),
  batch_size INTEGER NOT NULL CHECK (batch_size > 0),
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workflow_jobs (
  job_id BIGSERIAL PRIMARY KEY,
  workflow_id BIGINT NOT NULL REFERENCES workflow_definitions(workflow_id) ON DELETE CASCADE,
  delivery_id BIGINT NOT NULL UNIQUE REFERENCES webhook_deliveries(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'unprocessed'
    CHECK (status IN ('unprocessed', 'running', 'success', 'failed')),
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  max_retry_count INTEGER NOT NULL CHECK (max_retry_count >= 0),
  available_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  locked_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_workflow_jobs_claim
  ON workflow_jobs (workflow_id, status, available_at, created_at);

CREATE INDEX IF NOT EXISTS idx_workflow_jobs_stale_running
  ON workflow_jobs (workflow_id, locked_at)
  WHERE status = 'running';

COMMIT;
