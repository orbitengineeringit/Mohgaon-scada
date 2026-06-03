
-- Enable pg_cron and pg_net for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Add export emails config to plant_config
ALTER TABLE plant_config ADD COLUMN IF NOT EXISTS export_emails text[] DEFAULT ARRAY[]::text[];

-- Create data_exports tracking table
CREATE TABLE IF NOT EXISTS data_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  file_path text,
  record_count integer DEFAULT 0,
  email_sent boolean DEFAULT false,
  downloaded boolean DEFAULT false,
  cleanup_done boolean DEFAULT false,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE data_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on data_exports" ON data_exports FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert on data_exports" ON data_exports FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update on data_exports" ON data_exports FOR UPDATE TO public USING (true);

-- Add unique constraint for historian_aggregates upsert
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'historian_aggregates_unique_bucket'
  ) THEN
    ALTER TABLE historian_aggregates ADD CONSTRAINT historian_aggregates_unique_bucket
      UNIQUE (tag_config_id, bucket_start, bucket_size);
  END IF;
END $$;
