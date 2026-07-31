-- ============================================================
-- Migration: Disable KW energy meter tags (not installed)
--            Enable WTP inlet analyzers (WTP-PH-IN, WTP-TA-IN)
--            Enable WTP backwash level sensor (WTP-LT-BW)
--            Set appropriate alarm setpoints for newly enabled sensors
-- Applied: 2026-07-31
-- ============================================================

-- Soft-disable Energy Meter tags (preserve all historical data)
UPDATE public.tag_config SET is_active = false
  WHERE tag_id IN ('WTP-KW', 'INT-KW');

-- Enable Inlet pH Analyzer (instrument now installed)
UPDATE public.tag_config
  SET is_active = true,
      alarm_enabled = true,
      high_setpoint = 8.5,
      low_setpoint = 6.5
  WHERE tag_id = 'WTP-PH-IN';

-- Enable Inlet Turbidity Analyzer (instrument now installed)
UPDATE public.tag_config
  SET is_active = true,
      alarm_enabled = true,
      high_setpoint = 50,
      low_setpoint = NULL
  WHERE tag_id = 'WTP-TA-IN';

-- Enable Backwash Level Sensor (instrument now installed)
UPDATE public.tag_config
  SET is_active = true,
      alarm_enabled = true,
      high_setpoint = 90,
      low_setpoint = 15
  WHERE tag_id = 'WTP-LT-BW';
