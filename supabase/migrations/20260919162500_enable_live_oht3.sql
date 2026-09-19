-- OHT-3 RTU is now commissioned on its production Mohgaon topic.
-- Keep the runtime DB topic aligned with the frontend and Edge Function maps.
UPDATE public.mqtt_config
SET oht_topic_3 = 'mohgaon/oht-3',
    updated_at = now();
