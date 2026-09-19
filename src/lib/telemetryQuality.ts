import type { TagData } from '@/contexts/ScadaContext';

/**
 * The RTUs normally publish about every 20 seconds, but cellular delivery can
 * pause for several minutes. Keep communication quality separate from the
 * sensor value so a network delay never turns an old value into "live" data.
 */
export const TELEMETRY_LIVE_MS = 2 * 60 * 1000;
export const TELEMETRY_OFFLINE_MS = 10 * 60 * 1000;

export const isValueWithinEngineeringRange = (
  value: number,
  range: Pick<TagData, 'min' | 'max'>,
): boolean => Number.isFinite(value) && value >= range.min && value <= range.max;

export const telemetryAgeMs = (tag?: TagData | null, now = Date.now()): number | null => {
  if (!tag?.lastDataTime) return null;
  const receivedAt = new Date(tag.lastDataTime).getTime();
  if (!Number.isFinite(receivedAt)) return null;
  return Math.max(0, now - receivedAt);
};
