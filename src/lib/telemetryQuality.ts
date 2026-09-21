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

/**
 * Industrial SCADA Zero-Cutoff / Deadband Filter:
 * - Floating point underflow (Modbus IEEE 754): numbers with abs < 1e-5 -> 0
 * - Pressure Transmitters (PT): 4-20mA ADC zero-drift / atmospheric residual (< 0.05 Bar) -> 0.0 Bar
 * - Flow Meters: Electromagnetic meter low-flow cutoff / static pipe induction (< 0.15 m³/hr) -> 0.0 m³/hr
 * - Level Transmitters (LT): Empty tank transducer noise (< 0.1%) -> 0.0%
 * - Digital Pumps: value <= 0.5 -> 0
 */
export const applyZeroDeadband = (
  value: number,
  instrumentType?: string
): number => {
  if (!Number.isFinite(value)) return 0;
  if (Math.abs(value) < 1e-5) return 0;

  if (instrumentType === 'pt' || instrumentType === 'combined_pt') {
    if (Math.abs(value) < 0.05) return 0;
  } else if (instrumentType === 'flow') {
    if (Math.abs(value) < 0.15) return 0;
  } else if (instrumentType === 'lt') {
    if (Math.abs(value) < 0.1) return 0;
  } else if (instrumentType === 'pump') {
    return value > 0.5 ? 1 : 0;
  }

  return value;
};

/**
 * Returns true if a sensor value is effectively zero (taking noise/deadband into account).
 */
export const isZeroValue = (
  value: number | null | undefined,
  instrumentType?: string
): boolean => {
  if (value === null || value === undefined || !Number.isFinite(value)) return true;
  return applyZeroDeadband(value, instrumentType) === 0;
};

