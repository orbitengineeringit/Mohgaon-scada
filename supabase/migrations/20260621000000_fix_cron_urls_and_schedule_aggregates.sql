-- ============================================================
-- Migration: Fix cron job URLs (old project → new project)
--            + Schedule aggregate-data hourly via pg_cron
-- ============================================================
-- Old project: bnyojzfjxjljewjplhmi (INCORRECT — was failing silently)
-- New project: kpzlcjgopkyyioimihae (CORRECT)
-- ============================================================

-- Step 1: Remove all old cron jobs (they point to the wrong project URL)
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname IN ('scada-ingest-cron', 'gis-sync-cron', 'aggregate-data-cron');

-- Step 2: Re-create scada-ingest-cron with correct new URL (every 5 minutes)
SELECT cron.schedule(
  'scada-ingest-cron',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url       := 'https://kpzlcjgopkyyioimihae.supabase.co/functions/v1/scada-ingest',
    headers   := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-key', (SELECT cron_secret FROM public.gis_config ORDER BY created_at DESC LIMIT 1)
    ),
    body      := '{}'::jsonb
  );
  $$
);

-- Step 3: Re-create gis-sync-cron with correct new URL (every 1 hour)
SELECT cron.schedule(
  'gis-sync-cron',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url       := 'https://kpzlcjgopkyyioimihae.supabase.co/functions/v1/gis-sync',
    headers   := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-key', (SELECT cron_secret FROM public.gis_config ORDER BY created_at DESC LIMIT 1)
    ),
    body      := '{}'::jsonb
  );
  $$
);

-- Step 4: Add aggregate-data-cron (new — runs 2 minutes past each hour to aggregate the just-completed hour)
SELECT cron.schedule(
  'aggregate-data-cron',
  '2 * * * *',
  $$
  SELECT net.http_post(
    url       := 'https://kpzlcjgopkyyioimihae.supabase.co/functions/v1/aggregate-data',
    headers   := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-key', (SELECT cron_secret FROM public.gis_config ORDER BY created_at DESC LIMIT 1)
    ),
    body      := '{}'::jsonb
  );
  $$
);
