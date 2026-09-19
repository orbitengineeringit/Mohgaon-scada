-- WTP uses independent inlet and outlet totalizers. Preserve the existing
-- totalizer configuration and its history as the outlet totalizer, then add
-- the inlet totalizer as a separate tag.

-- This deployment may already contain the OUT row (created by a live function
-- deployment). Create/normalise it first, relink all legacy history, and only
-- then remove the obsolete configuration row. No historian measurements are
-- deleted by this migration.
INSERT INTO public.tag_config (
  section, tag_id, label, unit, is_active, activated_at,
  high_setpoint, low_setpoint, alarm_enabled
)
VALUES (
  'wtp', 'WTP-Totalizer-OUT', 'Totalizer (Outlet)', 'm³', true, now(),
  NULL, NULL, false
)
ON CONFLICT (tag_id, section) DO UPDATE
SET label = EXCLUDED.label,
    unit = EXCLUDED.unit,
    is_active = true;

DO $$
DECLARE
  outlet_config_id uuid;
BEGIN
  SELECT id INTO outlet_config_id
  FROM public.tag_config
  WHERE section = 'wtp' AND tag_id = 'WTP-Totalizer-OUT'
  LIMIT 1;

  UPDATE public.historian_logs
  SET tag_id = 'WTP-Totalizer-OUT',
      tag_config_id = outlet_config_id
  WHERE section = 'wtp'
    AND tag_id = 'WTP-Totalizer';

  DELETE FROM public.tag_config
  WHERE section = 'wtp'
    AND tag_id = 'WTP-Totalizer';
END $$;

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
