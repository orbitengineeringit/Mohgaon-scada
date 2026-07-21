-- Fix cron job to point to the CORRECT current project: tzuppdqvefvzgyrqstsy
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname IN ('scada-ingest-cron', 'gis-sync-cron', 'aggregate-data-cron');

-- scada-ingest: every 5 minutes → saves all sensor snapshots to historian_logs
SELECT cron.schedule(
  'scada-ingest-cron',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url     := 'https://tzuppdqvefvzgyrqstsy.supabase.co/functions/v1/scada-ingest',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-key', (SELECT cron_secret FROM public.gis_config ORDER BY created_at DESC LIMIT 1)
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- aggregate-data: hourly at HH:02 → aggregates historian_logs into historian_aggregates
SELECT cron.schedule(
  'aggregate-data-cron',
  '2 * * * *',
  $$
  SELECT net.http_post(
    url     := 'https://tzuppdqvefvzgyrqstsy.supabase.co/functions/v1/aggregate-data',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-key', (SELECT cron_secret FROM public.gis_config ORDER BY created_at DESC LIMIT 1)
    ),
    body    := '{}'::jsonb
  );
  $$
);
