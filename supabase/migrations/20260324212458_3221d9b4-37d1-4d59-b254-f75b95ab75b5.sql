
-- Reset all alarms to OFF by default, and set sensible default setpoints
UPDATE public.tag_config SET alarm_enabled = false;

-- PT sensors: high 80%, low 10% of max (max=10 Bar)
UPDATE public.tag_config SET high_setpoint = 8, low_setpoint = 1
WHERE tag_id LIKE '%-PT%' AND tag_id NOT LIKE '%-CombinedPT%';

-- Combined PT: same
UPDATE public.tag_config SET high_setpoint = 8, low_setpoint = 1
WHERE tag_id LIKE '%-CombinedPT%';

-- Level sensors (OHT): max=100%
UPDATE public.tag_config SET high_setpoint = 90, low_setpoint = 15
WHERE tag_id LIKE 'OHT%-LT';

-- Level sensors (Intake): max=100%
UPDATE public.tag_config SET high_setpoint = 90, low_setpoint = 15
WHERE tag_id = 'INT-LT';

-- Level sensors (WTP): max=100%
UPDATE public.tag_config SET high_setpoint = 90, low_setpoint = 15
WHERE tag_id LIKE 'WTP-LT%';

-- Flow sensors: high alarm only
UPDATE public.tag_config SET high_setpoint = 45, low_setpoint = NULL
WHERE tag_id LIKE '%-Flow%' AND section = 'oht';

UPDATE public.tag_config SET high_setpoint = 180, low_setpoint = NULL
WHERE tag_id LIKE '%-Flow%' AND section IN ('intake', 'wtp');

-- pH: 6.5-8.5
UPDATE public.tag_config SET high_setpoint = 8.5, low_setpoint = 6.5
WHERE tag_id LIKE 'WTP-PH%';

-- Turbidity inlet: high 50
UPDATE public.tag_config SET high_setpoint = 50, low_setpoint = NULL
WHERE tag_id = 'WTP-TA-IN';

-- Turbidity outlet: high 5
UPDATE public.tag_config SET high_setpoint = 5, low_setpoint = NULL
WHERE tag_id = 'WTP-TA';

-- Chlorine: 0.2-1.0
UPDATE public.tag_config SET high_setpoint = 1.0, low_setpoint = 0.2
WHERE tag_id = 'WTP-CL';
