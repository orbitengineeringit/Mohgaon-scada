-- Every Mohgaon OHT has exactly four commissioned SCADA instruments:
-- inlet PT, level, inlet flow and totalizer. Preserve old historian rows for
-- audit, but retire incorrect/uncommissioned tag definitions and alarms.
UPDATE public.tag_config
SET is_active = false,
    alarm_enabled = false,
    updated_at = now()
WHERE section = 'oht'
  AND tag_id IN (
    'OHT1-Flow-OUT', 'OHT1-FCV',
    'OHT2-Flow-OUT', 'OHT2-FCV',
    'OHT3-Flow-OUT', 'OHT3-FCV', 'OHT3-EFM1-1', 'OHT3-EFM2-1', 'OHT3-EFM2-2',
    'OHT4-Flow-OUT', 'OHT4-FCV'
  );
