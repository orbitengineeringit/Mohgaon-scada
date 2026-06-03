
-- Add 'wtp' to the tag_section enum
ALTER TYPE public.tag_section ADD VALUE IF NOT EXISTS 'wtp';

-- Add columns for new sensor types (totalizer, valve, kw, pump status)
-- These will be stored in historian_logs and tag_config as regular tags

-- Create pre-aggregated table for fast historical queries
CREATE TABLE IF NOT EXISTS public.historian_aggregates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tag_config_id UUID NOT NULL REFERENCES public.tag_config(id),
  tag_id TEXT NOT NULL,
  section TEXT NOT NULL,
  bucket_start TIMESTAMP WITH TIME ZONE NOT NULL,
  bucket_size TEXT NOT NULL DEFAULT '1h',
  avg_value NUMERIC NOT NULL,
  min_value NUMERIC NOT NULL,
  max_value NUMERIC NOT NULL,
  sample_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.historian_aggregates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on historian_aggregates"
ON public.historian_aggregates FOR SELECT USING (true);

CREATE POLICY "Allow public insert on historian_aggregates"
ON public.historian_aggregates FOR INSERT WITH CHECK (true);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_historian_agg_tag_bucket 
ON public.historian_aggregates (tag_id, section, bucket_start DESC);

CREATE INDEX IF NOT EXISTS idx_historian_agg_section_bucket
ON public.historian_aggregates (section, bucket_start DESC);

-- Add index on historian_logs for faster time-series queries
CREATE INDEX IF NOT EXISTS idx_historian_logs_tag_time 
ON public.historian_logs (tag_id, section, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_historian_logs_section_time
ON public.historian_logs (section, timestamp DESC);

-- Create pump_analytics table for runtime and start count tracking
CREATE TABLE IF NOT EXISTS public.pump_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pump_id TEXT NOT NULL,
  section TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  runtime_seconds NUMERIC NOT NULL DEFAULT 0,
  start_count INTEGER NOT NULL DEFAULT 0,
  total_runtime_seconds NUMERIC NOT NULL DEFAULT 0,
  total_start_count INTEGER NOT NULL DEFAULT 0,
  last_state_change TIMESTAMP WITH TIME ZONE,
  current_state BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(pump_id, section, date)
);

ALTER TABLE public.pump_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on pump_analytics"
ON public.pump_analytics FOR SELECT USING (true);

CREATE POLICY "Allow public insert on pump_analytics"
ON public.pump_analytics FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on pump_analytics"
ON public.pump_analytics FOR UPDATE USING (true);

-- Create consumption table for flow/totalizer analytics
CREATE TABLE IF NOT EXISTS public.consumption_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  hour INTEGER,
  daily_consumption NUMERIC NOT NULL DEFAULT 0,
  hourly_consumption NUMERIC NOT NULL DEFAULT 0,
  totalizer_start NUMERIC,
  totalizer_end NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(section, date, hour)
);

ALTER TABLE public.consumption_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on consumption_data"
ON public.consumption_data FOR SELECT USING (true);

CREATE POLICY "Allow public insert on consumption_data"
ON public.consumption_data FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on consumption_data"
ON public.consumption_data FOR UPDATE USING (true);

-- Update mqtt_config to support WTP topic and multiple OHT topics
ALTER TABLE public.mqtt_config ADD COLUMN IF NOT EXISTS wtp_topic TEXT NOT NULL DEFAULT 'Orbit/BuaBicchiya/WTP0000000001';
ALTER TABLE public.mqtt_config ADD COLUMN IF NOT EXISTS oht_topic_2 TEXT NOT NULL DEFAULT 'Orbit/BuaBicchiya/OHT0000000002';
ALTER TABLE public.mqtt_config ADD COLUMN IF NOT EXISTS oht_topic_3 TEXT NOT NULL DEFAULT 'Orbit/BuaBicchiya/OHT0000000003';

-- Update default topics for BuaBicchiya
UPDATE public.mqtt_config SET 
  oht_topic = 'Orbit/BuaBicchiya/OHT0000000001',
  oht_topic_2 = 'Orbit/BuaBicchiya/OHT0000000002',
  oht_topic_3 = 'Orbit/BuaBicchiya/OHT0000000003',
  intake_topic = 'Orbit/BuaBicchiya/INTAKE0000001',
  wtp_topic = 'Orbit/BuaBicchiya/WTP0000000001'
WHERE TRUE;

-- Update plant name
UPDATE public.plant_config SET plant_name = 'Bua Bicchiya SCADA' WHERE TRUE;

-- Enable realtime for pump_analytics
ALTER PUBLICATION supabase_realtime ADD TABLE public.pump_analytics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.consumption_data;
