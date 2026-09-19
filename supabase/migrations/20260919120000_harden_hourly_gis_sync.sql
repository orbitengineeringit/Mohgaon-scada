-- Keep exactly one server-side MPGARUD sync. The Edge Function independently
-- omits Intake/WTP/OHT stations whose latest historian snapshot is stale.
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'gis-sync-cron';

SELECT cron.schedule(
  'gis-sync-cron',
  -- Run after the HH:00 five-minute MQTT snapshot has had time to finish.
  '3 * * * *',
  $$
  SELECT net.http_post(
    url     := 'https://tzuppdqvefvzgyrqstsy.supabase.co/functions/v1/gis-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-key', (SELECT cron_secret FROM public.gis_config ORDER BY created_at DESC LIMIT 1)
    ),
    body    := '{}'::jsonb
  );
  $$
);

UPDATE public.gis_config
SET auto_sync_enabled = true,
    sync_interval_seconds = 3600,
    updated_at = now();
