-- Database Migration: Re-schedule GIS Sync via pg_cron to point to the CORRECT current project: tzuppdqvefvzgyrqstsy
-- The GIS cron was accidentally dropped and not rescheduled in a previous migration.

SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'gis-sync-cron';

-- gis-sync: every 1 hour → pushes data to GIS system
SELECT cron.schedule(
  'gis-sync-cron',
  '0 * * * *',
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
