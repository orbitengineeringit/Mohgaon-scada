
-- 1. Create enum
CREATE TYPE public.app_role AS ENUM ('admin', 'operator', 'viewer');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Create has_role function (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 4. user_roles policies
CREATE POLICY "Users can view own roles" ON public.user_roles
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles" ON public.user_roles
FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles" ON public.user_roles
FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 5. Drop old permissive policies
DROP POLICY IF EXISTS "Authenticated delete on alarms" ON public.alarms;
DROP POLICY IF EXISTS "Authenticated insert on alarms" ON public.alarms;
DROP POLICY IF EXISTS "Authenticated update on alarms" ON public.alarms;
DROP POLICY IF EXISTS "Authenticated delete on tag_config" ON public.tag_config;
DROP POLICY IF EXISTS "Authenticated insert on tag_config" ON public.tag_config;
DROP POLICY IF EXISTS "Authenticated update on tag_config" ON public.tag_config;
DROP POLICY IF EXISTS "Authenticated read on mqtt_config" ON public.mqtt_config;
DROP POLICY IF EXISTS "Authenticated insert on mqtt_config" ON public.mqtt_config;
DROP POLICY IF EXISTS "Authenticated update on mqtt_config" ON public.mqtt_config;
DROP POLICY IF EXISTS "Authenticated update on plant_config" ON public.plant_config;
DROP POLICY IF EXISTS "Authenticated insert on consumption_data" ON public.consumption_data;
DROP POLICY IF EXISTS "Authenticated update on consumption_data" ON public.consumption_data;
DROP POLICY IF EXISTS "Authenticated insert on historian_logs" ON public.historian_logs;
DROP POLICY IF EXISTS "Authenticated insert on historian_aggregates" ON public.historian_aggregates;
DROP POLICY IF EXISTS "Authenticated insert on pump_analytics" ON public.pump_analytics;
DROP POLICY IF EXISTS "Authenticated update on pump_analytics" ON public.pump_analytics;
DROP POLICY IF EXISTS "Authenticated insert on data_exports" ON public.data_exports;
DROP POLICY IF EXISTS "Authenticated update on data_exports" ON public.data_exports;

-- 6. New role-based policies

-- ALARMS (admin+operator write, admin delete)
CREATE POLICY "Role insert alarms" ON public.alarms FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));
CREATE POLICY "Role update alarms" ON public.alarms FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));
CREATE POLICY "Role delete alarms" ON public.alarms FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- TAG_CONFIG (admin only)
CREATE POLICY "Role insert tag_config" ON public.tag_config FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Role update tag_config" ON public.tag_config FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Role delete tag_config" ON public.tag_config FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- MQTT_CONFIG (admin+operator read, admin write)
CREATE POLICY "Role read mqtt_config" ON public.mqtt_config FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));
CREATE POLICY "Role insert mqtt_config" ON public.mqtt_config FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Role update mqtt_config" ON public.mqtt_config FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- PLANT_CONFIG (admin only update)
CREATE POLICY "Role update plant_config" ON public.plant_config FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- CONSUMPTION_DATA
CREATE POLICY "Role insert consumption_data" ON public.consumption_data FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));
CREATE POLICY "Role update consumption_data" ON public.consumption_data FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- HISTORIAN_LOGS
CREATE POLICY "Role insert historian_logs" ON public.historian_logs FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));

-- HISTORIAN_AGGREGATES
CREATE POLICY "Role insert historian_aggregates" ON public.historian_aggregates FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));

-- PUMP_ANALYTICS
CREATE POLICY "Role insert pump_analytics" ON public.pump_analytics FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));
CREATE POLICY "Role update pump_analytics" ON public.pump_analytics FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));

-- DATA_EXPORTS
CREATE POLICY "Role insert data_exports" ON public.data_exports FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));
CREATE POLICY "Role update data_exports" ON public.data_exports FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 7. Remove plaintext MQTT credentials
ALTER TABLE public.mqtt_config DROP COLUMN IF EXISTS password;
ALTER TABLE public.mqtt_config DROP COLUMN IF EXISTS username;
