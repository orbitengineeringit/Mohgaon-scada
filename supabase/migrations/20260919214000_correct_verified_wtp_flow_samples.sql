-- Site confirms PLC flow unit is m³/hr. Preserve original rows before fixing
-- only today's exact values verified against supplied/raw MQTT packets.
-- Older/unknown readings are deliberately not guessed from their magnitude.
CREATE TABLE public.telemetry_corrections (
  historian_id uuid PRIMARY KEY,
  original_value double precision NOT NULL,
  corrected_value double precision NOT NULL,
  reason text NOT NULL,
  corrected_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.telemetry_corrections ENABLE ROW LEVEL SECURITY;

INSERT INTO public.telemetry_corrections (historian_id,original_value,corrected_value,reason)
SELECT id,value,value*1000,'WTP PLC m³/hr confirmed by site; remove erroneous /1000 conversion, verified 19 Sep raw packet'
FROM public.historian_logs
WHERE timestamp >= '2026-09-19T00:00:00+05:30' AND timestamp < '2026-09-20T00:00:00+05:30'
  AND source='backend:5min'
  AND ((tag_id='WTP-Flow-IN' AND abs(value-0.0000999606)<0.000000000001)
    OR (tag_id='WTP-Flow-OUT' AND abs(value-0.0000996094)<0.000000000001))
ON CONFLICT DO NOTHING;

UPDATE public.historian_logs h SET value=c.corrected_value
FROM public.telemetry_corrections c
WHERE h.id=c.historian_id AND h.value=c.original_value;

-- Recompute the affected hourly summaries from corrected rows.
UPDATE public.historian_aggregates a SET
  avg_value=s.avg_value,min_value=s.min_value,max_value=s.max_value,sample_count=s.samples
FROM (
  SELECT tag_config_id,date_trunc('hour',timestamp) bucket,
    round(avg(value)::numeric,4) avg_value,round(min(value)::numeric,4) min_value,
    round(max(value)::numeric,4) max_value,count(*) samples
  FROM public.historian_logs
  WHERE tag_id IN ('WTP-Flow-IN','WTP-Flow-OUT')
    AND timestamp >= '2026-09-19T00:00:00+05:30' AND timestamp < '2026-09-20T00:00:00+05:30'
  GROUP BY tag_config_id,date_trunc('hour',timestamp)
) s WHERE a.tag_config_id=s.tag_config_id AND a.bucket_start=s.bucket AND a.bucket_size='1h';
