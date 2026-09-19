import type { TagData } from '@/contexts/ScadaContext';

/**
 * The RTUs normally publish about every 20 seconds, but cellular delivery can
 * pause for several minutes. Keep communication quality separate from the
 * sensor value so a network delay never turns an old value into "live" data.
 */
export const TELEMETRY_LIVE_MS = 5 * 60 * 1000;
export const TELEMETRY_OFFLINE_MS = 15 * 60 * 1000;

type EngineeringRange = Pick<TagData, 'min' | 'max'> &
  Partial<Pick<TagData, 'unit' | 'instrumentType'>>;

/**
 * Percentage transmitters can report a small calibrated over/under-range at
 * the physical end stops (for example 100.886% for a full tank). Accept only
 * that narrow 2% saturation band and clamp it to the real 0..100% endpoint.
 * Larger excursions remain invalid sensor readings.
 */
export const normalizeTelemetryValue = (
  value: number,
  range: EngineeringRange,
): number | null => {
  if (!Number.isFinite(value)) return null;
  if (value >= range.min && value <= range.max) return value;

  const isPercentagePosition = range.unit === '%' &&
    (range.instrumentType === 'lt' || range.instrumentType === 'fcv');
  if (isPercentagePosition && value >= range.min - 2 && value <= range.max + 2) {
    return Math.min(range.max, Math.max(range.min, value));
  }

  return null;
};

export const isValueWithinEngineeringRange = (
  value: number,
  range: EngineeringRange,
): boolean => normalizeTelemetryValue(value, range) !== null;

export const telemetryAgeMs = (tag?: TagData | null, now = Date.now()): number | null => {
  if (!tag?.lastDataTime) return null;
  const receivedAt = new Date(tag.lastDataTime).getTime();
  if (!Number.isFinite(receivedAt)) return null;
  return Math.max(0, now - receivedAt);
};
