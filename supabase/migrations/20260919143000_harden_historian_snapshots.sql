-- Future 5-minute backend snapshots receive a deterministic idempotency key.
-- Existing history is intentionally left untouched; NULL keys can coexist.
ALTER TABLE public.historian_logs
  ADD COLUMN IF NOT EXISTS snapshot_key text;

CREATE UNIQUE INDEX IF NOT EXISTS historian_logs_snapshot_key_uidx
  ON public.historian_logs (snapshot_key);

COMMENT ON COLUMN public.historian_logs.snapshot_key IS
  'Idempotency key for server-owned 5-minute snapshots: section:tag_id:bucket_timestamp';
