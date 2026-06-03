-- Fix RLS policies: require authenticated users instead of public access

-- ===== alarms =====
DROP POLICY IF EXISTS "Allow public read access on alarms" ON public.alarms;
DROP POLICY IF EXISTS "Allow public insert on alarms" ON public.alarms;
DROP POLICY IF EXISTS "Allow public update on alarms" ON public.alarms;
DROP POLICY IF EXISTS "Allow public delete on alarms" ON public.alarms;

CREATE POLICY "Authenticated read on alarms" ON public.alarms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert on alarms" ON public.alarms FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update on alarms" ON public.alarms FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated delete on alarms" ON public.alarms FOR DELETE TO authenticated USING (true);

-- ===== consumption_data =====
DROP POLICY IF EXISTS "Allow public read on consumption_data" ON public.consumption_data;
DROP POLICY IF EXISTS "Allow public insert on consumption_data" ON public.consumption_data;
DROP POLICY IF EXISTS "Allow public update on consumption_data" ON public.consumption_data;

CREATE POLICY "Authenticated read on consumption_data" ON public.consumption_data FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert on consumption_data" ON public.consumption_data FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update on consumption_data" ON public.consumption_data FOR UPDATE TO authenticated USING (true);

-- ===== data_exports =====
DROP POLICY IF EXISTS "Allow public read on data_exports" ON public.data_exports;
DROP POLICY IF EXISTS "Allow public insert on data_exports" ON public.data_exports;
DROP POLICY IF EXISTS "Allow public update on data_exports" ON public.data_exports;

CREATE POLICY "Authenticated read on data_exports" ON public.data_exports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert on data_exports" ON public.data_exports FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update on data_exports" ON public.data_exports FOR UPDATE TO authenticated USING (true);

-- ===== historian_aggregates =====
DROP POLICY IF EXISTS "Allow public read on historian_aggregates" ON public.historian_aggregates;
DROP POLICY IF EXISTS "Allow public insert on historian_aggregates" ON public.historian_aggregates;

CREATE POLICY "Authenticated read on historian_aggregates" ON public.historian_aggregates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert on historian_aggregates" ON public.historian_aggregates FOR INSERT TO authenticated WITH CHECK (true);

-- ===== historian_logs =====
DROP POLICY IF EXISTS "Allow public read access on historian_logs" ON public.historian_logs;
DROP POLICY IF EXISTS "Allow public insert on historian_logs" ON public.historian_logs;

CREATE POLICY "Authenticated read on historian_logs" ON public.historian_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert on historian_logs" ON public.historian_logs FOR INSERT TO authenticated WITH CHECK (true);

-- ===== mqtt_config (sensitive - contains credentials) =====
DROP POLICY IF EXISTS "Allow public read access on mqtt_config" ON public.mqtt_config;
DROP POLICY IF EXISTS "Allow public insert on mqtt_config" ON public.mqtt_config;
DROP POLICY IF EXISTS "Allow public update on mqtt_config" ON public.mqtt_config;

CREATE POLICY "Authenticated read on mqtt_config" ON public.mqtt_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert on mqtt_config" ON public.mqtt_config FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update on mqtt_config" ON public.mqtt_config FOR UPDATE TO authenticated USING (true);

-- ===== plant_config =====
DROP POLICY IF EXISTS "Allow public read access on plant_config" ON public.plant_config;
DROP POLICY IF EXISTS "Allow public update on plant_config" ON public.plant_config;

CREATE POLICY "Authenticated read on plant_config" ON public.plant_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated update on plant_config" ON public.plant_config FOR UPDATE TO authenticated USING (true);

-- ===== pump_analytics =====
DROP POLICY IF EXISTS "Allow public read on pump_analytics" ON public.pump_analytics;
DROP POLICY IF EXISTS "Allow public insert on pump_analytics" ON public.pump_analytics;
DROP POLICY IF EXISTS "Allow public update on pump_analytics" ON public.pump_analytics;

CREATE POLICY "Authenticated read on pump_analytics" ON public.pump_analytics FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert on pump_analytics" ON public.pump_analytics FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update on pump_analytics" ON public.pump_analytics FOR UPDATE TO authenticated USING (true);

-- ===== tag_config =====
DROP POLICY IF EXISTS "Allow public read access on tag_config" ON public.tag_config;
DROP POLICY IF EXISTS "Allow public insert on tag_config" ON public.tag_config;
DROP POLICY IF EXISTS "Allow public update on tag_config" ON public.tag_config;
DROP POLICY IF EXISTS "Allow public delete on tag_config" ON public.tag_config;

CREATE POLICY "Authenticated read on tag_config" ON public.tag_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert on tag_config" ON public.tag_config FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update on tag_config" ON public.tag_config FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated delete on tag_config" ON public.tag_config FOR DELETE TO authenticated USING (true);