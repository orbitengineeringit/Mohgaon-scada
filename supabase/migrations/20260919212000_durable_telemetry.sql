-- Receive-time provenance is distinct from the five-minute display bucket.
ALTER TABLE public.historian_logs ADD COLUMN IF NOT EXISTS received_at timestamptz;

CREATE TABLE public.telemetry_latest (
  tag_id text PRIMARY KEY,
  section text NOT NULL CHECK (section IN ('intake','wtp','oht')),
  value double precision,
  quality text NOT NULL CHECK (quality IN ('good','fault')),
  received_at timestamptz NOT NULL,
  mqtt_topic text NOT NULL
);
ALTER TABLE public.telemetry_latest ENABLE ROW LEVEL SECURITY;
CREATE POLICY telemetry_authenticated_read ON public.telemetry_latest
  FOR SELECT TO authenticated USING (true);
GRANT SELECT ON public.telemetry_latest TO authenticated;
ALTER PUBLICATION supabase_realtime ADD TABLE public.telemetry_latest;

CREATE TABLE public.telemetry_ingest_runs (
  id uuid PRIMARY KEY,
  started_at timestamptz NOT NULL DEFAULT now(),
  connected_at timestamptz,
  last_message_at timestamptz,
  finished_at timestamptz,
  status text NOT NULL DEFAULT 'starting',
  message_count integer NOT NULL DEFAULT 0,
  saved_count integer NOT NULL DEFAULT 0,
  error_message text
);
ALTER TABLE public.telemetry_ingest_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY telemetry_runs_authenticated_read ON public.telemetry_ingest_runs
  FOR SELECT TO authenticated USING (true);
GRANT SELECT ON public.telemetry_ingest_runs TO authenticated;

-- One transaction per received packet: live cache and history either both
-- commit or both fail. No historian reads are reused as new observations.
-- The current bucket tracks its newest actual observation; closed buckets
-- remain fixed. Overlapping collectors/retries cannot duplicate a bucket.
CREATE OR REPLACE FUNCTION public.ingest_telemetry(readings jsonb)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE saved integer;
BEGIN
  INSERT INTO public.telemetry_latest (tag_id,section,value,quality,received_at,mqtt_topic)
  SELECT r.tag_id,r.section,r.value,r.quality,r.received_at,r.mqtt_topic
  FROM jsonb_to_recordset(readings) AS r(tag_id text,section text,value double precision,quality text,received_at timestamptz,mqtt_topic text)
  JOIN public.tag_config c ON c.tag_id=r.tag_id AND c.section=r.section AND c.is_active
  WHERE r.received_at BETWEEN now()-interval '2 minutes' AND now()+interval '10 seconds'
  ON CONFLICT (tag_id) DO UPDATE SET
    value=excluded.value,quality=excluded.quality,received_at=excluded.received_at,mqtt_topic=excluded.mqtt_topic
  WHERE excluded.received_at > telemetry_latest.received_at;

  INSERT INTO public.historian_logs
    (tag_config_id,tag_id,section,value,timestamp,received_at,source,mqtt_topic,snapshot_key)
  SELECT c.id,r.tag_id,r.section,r.value,
    to_timestamp(floor(extract(epoch FROM r.received_at)/300)*300),r.received_at,
    'backend:5min',r.mqtt_topic,
    r.section||':'||r.tag_id||':'||to_char(to_timestamp(floor(extract(epoch FROM r.received_at)/300)*300) AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
  FROM jsonb_to_recordset(readings) AS r(tag_id text,section text,value double precision,quality text,received_at timestamptz,mqtt_topic text)
  JOIN public.tag_config c ON c.tag_id=r.tag_id AND c.section=r.section AND c.is_active
  WHERE r.quality='good' AND r.value IS NOT NULL
    AND r.received_at BETWEEN now()-interval '2 minutes' AND now()+interval '10 seconds'
  ON CONFLICT (snapshot_key) DO UPDATE SET
    value=excluded.value,received_at=excluded.received_at,mqtt_topic=excluded.mqtt_topic
  WHERE historian_logs.received_at IS NULL OR excluded.received_at > historian_logs.received_at;
  GET DIAGNOSTICS saved = ROW_COUNT;
  RETURN saved;
END $$;
REVOKE ALL ON FUNCTION public.ingest_telemetry(jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ingest_telemetry(jsonb) TO service_role;

SELECT cron.schedule('telemetry-run-cleanup','15 3 * * *',
  $$DELETE FROM public.telemetry_ingest_runs WHERE started_at < now()-interval '7 days'$$);
