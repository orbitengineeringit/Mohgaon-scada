-- Security Hardening for mqtt_config table

-- Ensure RLS is enabled on public.mqtt_config
ALTER TABLE public.mqtt_config ENABLE ROW LEVEL SECURITY;

-- Drop existing public read or overly permissive policies on mqtt_config
DROP POLICY IF EXISTS "Allow public read access on mqtt_config" ON public.mqtt_config;
DROP POLICY IF EXISTS "Allow public read on mqtt_config" ON public.mqtt_config;
DROP POLICY IF EXISTS "Allow public select on mqtt_config" ON public.mqtt_config;
DROP POLICY IF EXISTS "auth all mqtt_config" ON public.mqtt_config;
DROP POLICY IF EXISTS "admins manage mqtt_config" ON public.mqtt_config;
DROP POLICY IF EXISTS "Allow authenticated select mqtt_config" ON public.mqtt_config;
DROP POLICY IF EXISTS "Allow authenticated insert mqtt_config" ON public.mqtt_config;
DROP POLICY IF EXISTS "Allow authenticated update mqtt_config" ON public.mqtt_config;
DROP POLICY IF EXISTS "Allow authenticated delete mqtt_config" ON public.mqtt_config;

-- Restrict SELECT, INSERT, UPDATE, DELETE policies to authenticated users only
CREATE POLICY "Allow authenticated select mqtt_config"
ON public.mqtt_config FOR SELECT TO authenticated
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated insert mqtt_config"
ON public.mqtt_config FOR INSERT TO authenticated
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update mqtt_config"
ON public.mqtt_config FOR UPDATE TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete mqtt_config"
ON public.mqtt_config FOR DELETE TO authenticated
USING (auth.role() = 'authenticated');

-- Remove public defaults on topic columns
ALTER TABLE public.mqtt_config ALTER COLUMN oht_topic DROP DEFAULT;
ALTER TABLE public.mqtt_config ALTER COLUMN intake_topic DROP DEFAULT;
ALTER TABLE public.mqtt_config ALTER COLUMN wtp_topic DROP DEFAULT;
ALTER TABLE public.mqtt_config ALTER COLUMN oht_topic_2 DROP DEFAULT;
ALTER TABLE public.mqtt_config ALTER COLUMN oht_topic_3 DROP DEFAULT;
ALTER TABLE public.mqtt_config ALTER COLUMN oht_topic_4 DROP DEFAULT;
