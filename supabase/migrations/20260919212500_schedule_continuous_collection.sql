-- Each invocation listens for 75s, with a new invocation every 60s. The overlap
-- covers normal startup/reconnect time; unique per-tag buckets handle overlap.
SELECT cron.schedule('scada-collector-cron','* * * * *',$job$
  SELECT net.http_post(
    url := 'https://tzuppdqvefvzgyrqstsy.supabase.co/functions/v1/scada-ingest',
    headers := jsonb_build_object('Content-Type','application/json',
      'x-cron-key',(SELECT cron_secret FROM public.gis_config ORDER BY created_at DESC LIMIT 1)),
    body := '{"mode":"collect"}'::jsonb,
    timeout_milliseconds := 10000
  );
$job$);

-- The existing 5-minute job now evaluates alarms/consumption from live cache.
SELECT cron.schedule('scada-ingest-cron','*/5 * * * *',$job$
  SELECT net.http_post(
    url := 'https://tzuppdqvefvzgyrqstsy.supabase.co/functions/v1/scada-ingest',
    headers := jsonb_build_object('Content-Type','application/json',
      'x-cron-key',(SELECT cron_secret FROM public.gis_config ORDER BY created_at DESC LIMIT 1)),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
$job$);

SELECT cron.schedule('gis-sync-cron','3 * * * *',$job$
  SELECT net.http_post(
    url := 'https://tzuppdqvefvzgyrqstsy.supabase.co/functions/v1/gis-sync',
    headers := jsonb_build_object('Content-Type','application/json',
      'x-cron-key',(SELECT cron_secret FROM public.gis_config ORDER BY created_at DESC LIMIT 1)),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
$job$);

-- Correct the obsolete intake topic in the public configuration as well.
UPDATE public.mqtt_config SET intake_topic='mohgaon/intake'
WHERE intake_topic='Orbit/MOHGAON/INTAKE/0000000001';
