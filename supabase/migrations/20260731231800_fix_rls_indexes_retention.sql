-- ============================================================
-- Remediation Migration: Fix RLS Security Gaps & Missing Indexes
-- Addresses findings from Deep SCADA Audit Cycle #1
-- ============================================================

-- 1. Fix CRITICAL RLS vulnerability on mqtt_config
--    Migration 20260720184500 granted full CRUD to all authenticated users,
--    overriding admin-only restrictions. Restore admin-only access.
DROP POLICY IF EXISTS "Allow authenticated select mqtt_config" ON public.mqtt_config;
DROP POLICY IF EXISTS "Allow authenticated insert mqtt_config" ON public.mqtt_config;
DROP POLICY IF EXISTS "Allow authenticated update mqtt_config" ON public.mqtt_config;
DROP POLICY IF EXISTS "Allow authenticated delete mqtt_config" ON public.mqtt_config;

-- Only admins should manage MQTT broker configuration
CREATE POLICY "admins manage mqtt_config" ON public.mqtt_config
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. Fix CRITICAL overly permissive RLS on tag_config and historian_logs
--    Migration 20260613094623 granted INSERT to all authenticated users,
--    bypassing admin-only restrictions and allowing sensor data spoofing.
DROP POLICY IF EXISTS "auth insert tag_config" ON public.tag_config;
DROP POLICY IF EXISTS "auth insert historian_logs" ON public.historian_logs;

-- 3. Add MISSING Performance Indexes for query-heavy operations

-- Alarms: section + date range queries (AlarmsPage filtering)
CREATE INDEX IF NOT EXISTS idx_alarms_section_created
  ON public.alarms (section, created_at DESC);

-- Historian logs: single tag history queries (SensorTrendModal)
CREATE INDEX IF NOT EXISTS idx_historian_logs_tag_timestamp_desc
  ON public.historian_logs (tag_id, timestamp DESC);

-- Historian logs: timestamp + section for HistoryPage date-range queries
CREATE INDEX IF NOT EXISTS idx_historian_logs_timestamp_section
  ON public.historian_logs (timestamp DESC, section);

-- Pump analytics: pump-specific date queries
CREATE INDEX IF NOT EXISTS idx_pump_analytics_pump_date
  ON public.pump_analytics (pump_id, date DESC);

-- Consumption data: date-based queries
CREATE INDEX IF NOT EXISTS idx_consumption_data_date
  ON public.consumption_data (date DESC);

-- Historian aggregates: tag_config + bucket queries
CREATE INDEX IF NOT EXISTS idx_hist_agg_tag_config_bucket
  ON public.historian_aggregates (tag_config_id, bucket_start DESC);

-- 4. Add Automated Retention Cron for historian_logs (365 days)
--    Prevents unbounded table growth on high-volume time-series data.
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'historian-logs-cleanup-cron';

SELECT cron.schedule(
  'historian-logs-cleanup-cron',
  '0 4 * * *',
  $$DELETE FROM public.historian_logs WHERE timestamp < NOW() - INTERVAL '365 days';$$
);
