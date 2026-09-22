-- OHT-2 RTU (Device ID: 02500225110500007237) is now commissioned on topic mohgaon/oht-2.
-- Align runtime DB mqtt_config with frontend and Edge Functions.
UPDATE public.mqtt_config
SET oht_topic_2 = 'mohgaon/oht-2',
    updated_at = now();

-- Ensure tag definitions for OHT-2 are active with proper calibration
INSERT INTO public.tag_config (tag_id, section, label, unit, is_active, alarm_enabled)
VALUES
  ('OHT2-PT', 'oht', 'Pressure (PT)', 'Bar', true, false),
  ('OHT2-LT', 'oht', 'Level (LT)', '%', true, false),
  ('OHT2-Flow-IN', 'oht', 'Flow Meter (Inlet)', 'm³/hr', true, false),
  ('OHT2-Totalizer', 'oht', 'Totalizer', 'm³', true, false)
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
  AND tag_id IN ('OHT2-Flow-OUT', 'OHT2-FCV');
