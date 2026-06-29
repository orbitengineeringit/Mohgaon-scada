CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: tag_section; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tag_section AS ENUM (
    'intake',
    'oht'
);


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: alarms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alarms (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tag_id text NOT NULL,
    tag_config_id uuid,
    label text NOT NULL,
    value numeric NOT NULL,
    unit text DEFAULT ''::text NOT NULL,
    alarm_type text NOT NULL,
    message text NOT NULL,
    section text NOT NULL,
    acknowledged boolean DEFAULT false NOT NULL,
    acknowledged_at timestamp with time zone,
    email_sent boolean DEFAULT false NOT NULL,
    email_sent_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT alarms_alarm_type_check CHECK ((alarm_type = ANY (ARRAY['High'::text, 'Low'::text, 'Disconnect'::text]))),
    CONSTRAINT alarms_section_check CHECK ((section = ANY (ARRAY['intake'::text, 'oht'::text])))
);


--
-- Name: historian_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.historian_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tag_config_id uuid NOT NULL,
    tag_id text NOT NULL,
    section public.tag_section NOT NULL,
    value numeric NOT NULL,
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    source text DEFAULT 'simulated'::text NOT NULL,
    mqtt_topic text
);


--
-- Name: mqtt_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mqtt_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    broker_url text DEFAULT 'ws://localhost:9001'::text NOT NULL,
    username text,
    password text,
    client_id text,
    oht_topic text DEFAULT 'Orbit/OHT0000000001'::text NOT NULL,
    intake_topic text DEFAULT 'Orbit/INT0000000001'::text NOT NULL,
    auto_connect boolean DEFAULT false NOT NULL,
    is_connected boolean DEFAULT false NOT NULL,
    last_connected_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: plant_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.plant_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    plant_name text DEFAULT 'Water Treatment Plant'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: tag_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tag_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tag_id text NOT NULL,
    section public.tag_section NOT NULL,
    label text NOT NULL,
    unit text DEFAULT ''::text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    activated_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    high_setpoint numeric,
    low_setpoint numeric,
    alarm_email text,
    alarm_enabled boolean DEFAULT true NOT NULL,
    alarm_emails text[] DEFAULT ARRAY[]::text[]
);


--
-- Name: alarms alarms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alarms
    ADD CONSTRAINT alarms_pkey PRIMARY KEY (id);


--
-- Name: historian_logs historian_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historian_logs
    ADD CONSTRAINT historian_logs_pkey PRIMARY KEY (id);


--
-- Name: mqtt_config mqtt_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mqtt_config
    ADD CONSTRAINT mqtt_config_pkey PRIMARY KEY (id);


--
-- Name: plant_config plant_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plant_config
    ADD CONSTRAINT plant_config_pkey PRIMARY KEY (id);


--
-- Name: tag_config tag_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tag_config
    ADD CONSTRAINT tag_config_pkey PRIMARY KEY (id);


--
-- Name: tag_config tag_config_tag_id_section_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tag_config
    ADD CONSTRAINT tag_config_tag_id_section_key UNIQUE (tag_id, section);


--
-- Name: idx_alarms_acknowledged; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_alarms_acknowledged ON public.alarms USING btree (acknowledged);


--
-- Name: idx_alarms_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_alarms_created_at ON public.alarms USING btree (created_at DESC);


--
-- Name: idx_alarms_tag_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_alarms_tag_id ON public.alarms USING btree (tag_id);


--
-- Name: idx_historian_logs_config; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_historian_logs_config ON public.historian_logs USING btree (tag_config_id);


--
-- Name: idx_historian_logs_tag_section; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_historian_logs_tag_section ON public.historian_logs USING btree (tag_id, section);


--
-- Name: idx_historian_logs_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_historian_logs_timestamp ON public.historian_logs USING btree ("timestamp" DESC);


--
-- Name: mqtt_config update_mqtt_config_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_mqtt_config_updated_at BEFORE UPDATE ON public.mqtt_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: plant_config update_plant_config_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_plant_config_updated_at BEFORE UPDATE ON public.plant_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: tag_config update_tag_config_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_tag_config_updated_at BEFORE UPDATE ON public.tag_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: alarms alarms_tag_config_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alarms
    ADD CONSTRAINT alarms_tag_config_id_fkey FOREIGN KEY (tag_config_id) REFERENCES public.tag_config(id);


--
-- Name: historian_logs historian_logs_tag_config_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historian_logs
    ADD CONSTRAINT historian_logs_tag_config_id_fkey FOREIGN KEY (tag_config_id) REFERENCES public.tag_config(id) ON DELETE CASCADE;


--
-- Name: alarms Allow public delete on alarms; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete on alarms" ON public.alarms FOR DELETE USING (true);


--
-- Name: tag_config Allow public delete on tag_config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete on tag_config" ON public.tag_config FOR DELETE USING (true);


--
-- Name: alarms Allow public insert on alarms; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert on alarms" ON public.alarms FOR INSERT WITH CHECK (true);


--
-- Name: historian_logs Allow public insert on historian_logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert on historian_logs" ON public.historian_logs FOR INSERT WITH CHECK (true);


--
-- Name: mqtt_config Allow public insert on mqtt_config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert on mqtt_config" ON public.mqtt_config FOR INSERT WITH CHECK (true);


--
-- Name: tag_config Allow public insert on tag_config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert on tag_config" ON public.tag_config FOR INSERT WITH CHECK (true);


--
-- Name: alarms Allow public read access on alarms; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access on alarms" ON public.alarms FOR SELECT USING (true);


--
-- Name: historian_logs Allow public read access on historian_logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access on historian_logs" ON public.historian_logs FOR SELECT USING (true);


--
-- Name: mqtt_config Allow public read access on mqtt_config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access on mqtt_config" ON public.mqtt_config FOR SELECT USING (true);


--
-- Name: plant_config Allow public read access on plant_config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access on plant_config" ON public.plant_config FOR SELECT USING (true);


--
-- Name: tag_config Allow public read access on tag_config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access on tag_config" ON public.tag_config FOR SELECT USING (true);


--
-- Name: alarms Allow public update on alarms; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update on alarms" ON public.alarms FOR UPDATE USING (true);


--
-- Name: mqtt_config Allow public update on mqtt_config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update on mqtt_config" ON public.mqtt_config FOR UPDATE USING (true);


--
-- Name: plant_config Allow public update on plant_config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update on plant_config" ON public.plant_config FOR UPDATE USING (true);


--
-- Name: tag_config Allow public update on tag_config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update on tag_config" ON public.tag_config FOR UPDATE USING (true);


--
-- Name: alarms; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.alarms ENABLE ROW LEVEL SECURITY;

--
-- Name: historian_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.historian_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: mqtt_config; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.mqtt_config ENABLE ROW LEVEL SECURITY;

--
-- Name: plant_config; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.plant_config ENABLE ROW LEVEL SECURITY;

--
-- Name: tag_config; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tag_config ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;