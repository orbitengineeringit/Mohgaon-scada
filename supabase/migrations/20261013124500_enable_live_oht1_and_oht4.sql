-- Enable live OHT-1 (Device ID: 02500225110500009028) and OHT-4 RTU commissioning on Mohgaon broker
-- Align runtime DB mqtt_config with production RTU topics
UPDATE public.mqtt_config
SET oht_topic = 'mohgaon/oht-1',
    oht_topic_4 = 'mohgaon/oht-4',
    updated_at = now();

-- Ensure tag definitions for OHT-1 and OHT-4 are active
INSERT INTO public.tag_config (tag_id, section, label, unit, is_active, alarm_enabled)
VALUES
  ('OHT1-PT', 'oht', 'Pressure (PT)', 'Bar', true, false),
  ('OHT1-LT', 'oht', 'Level (LT)', '%', true, false),
  ('OHT1-Flow-IN', 'oht', 'Flow Meter (Inlet)', 'm³/hr', true, false),
  ('OHT1-Totalizer', 'oht', 'Totalizer', 'm³', true, false),
  ('OHT4-PT', 'oht', 'Pressure (PT)', 'Bar', true, false),
  ('OHT4-LT', 'oht', 'Level (LT)', '%', true, false),
  ('OHT4-Flow-IN', 'oht', 'Flow Meter (Inlet)', 'm³/hr', true, false),
  ('OHT4-Totalizer', 'oht', 'Totalizer', 'm³', true, false)
ON CONFLICT (section, tag_id)
DO UPDATE SET
  label = EXCLUDED.label,
  unit = EXCLUDED.unit,
  is_active = true,
  updated_at = now();

-- Ensure uncommissioned tags remain inactive
UPDATE public.tag_config
SET is_active = false,
    alarm_enabled = false,
    updated_at = now()
WHERE section = 'oht'
  AND tag_id IN ('OHT1-Flow-OUT', 'OHT1-FCV', 'OHT4-Flow-OUT', 'OHT4-FCV');
