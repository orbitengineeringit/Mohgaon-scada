-- Alter mqtt_config table to add oht_topic_4
ALTER TABLE public.mqtt_config ADD COLUMN IF NOT EXISTS oht_topic_4 TEXT NOT NULL DEFAULT 'Orbit/MOHGAON/OHT04/0000000001';

-- Update existing config row to default for oht_topic_4 if null
UPDATE public.mqtt_config SET oht_topic_4 = 'Orbit/MOHGAON/OHT04/0000000001' WHERE oht_topic_4 IS NULL;

-- Alter gis_config table to add oht4_device_id
ALTER TABLE public.gis_config ADD COLUMN IF NOT EXISTS oht4_device_id TEXT NOT NULL DEFAULT 'MOH_OHT_004';

-- Update existing config row to default for oht4_device_id if null
UPDATE public.gis_config SET oht4_device_id = 'MOH_OHT_004' WHERE oht4_device_id IS NULL;
