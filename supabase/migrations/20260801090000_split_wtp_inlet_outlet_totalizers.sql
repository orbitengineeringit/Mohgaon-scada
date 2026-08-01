-- WTP uses independent inlet and outlet totalizers. Preserve the existing
-- totalizer configuration and its history as the outlet totalizer, then add
-- the inlet totalizer as a separate tag.

UPDATE public.tag_config
SET tag_id = 'WTP-Totalizer-OUT',
    label = 'Totalizer (Outlet)'
WHERE section = 'wtp'
  AND tag_id = 'WTP-Totalizer';

UPDATE public.historian_logs
SET tag_id = 'WTP-Totalizer-OUT'
WHERE section = 'wtp'
  AND tag_id = 'WTP-Totalizer';

INSERT INTO public.tag_config (
  section, tag_id, label, unit, is_active, activated_at,
  high_setpoint, low_setpoint, alarm_enabled
)
VALUES (
  'wtp', 'WTP-Totalizer-IN', 'Totalizer (Inlet)', 'm³', true, now(),
  NULL, NULL, false
)
ON CONFLICT (tag_id, section) DO UPDATE
SET label = EXCLUDED.label,
    unit = EXCLUDED.unit,
    is_active = true;
