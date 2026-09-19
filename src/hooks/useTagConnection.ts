import { useEffect, useState } from 'react';
import type { TagData } from '@/contexts/ScadaContext';
import { TELEMETRY_LIVE_MS, TELEMETRY_OFFLINE_MS, telemetryAgeMs } from '@/lib/telemetryQuality';

/**
 * Single source of truth for sensor status indicator state across the dashboard.
 *
 * Returns one of:
 *  - 'connected' : Active communication (value is non-zero).
 *  - 'inactive'  : Active communication (value is exactly 0.0).
 *  - 'no-data'   : Disconnected / Timeout (no data received).
 */
export type ConnectionState = 'connected' | 'no-data' | 'inactive' | 'stale' | 'fault';

export const getTagConnection = (tag?: TagData | null): ConnectionState => {
  if (!tag) return 'no-data';

  const elapsed = telemetryAgeMs(tag);
  if (elapsed === null || elapsed > TELEMETRY_OFFLINE_MS || tag.status === 'disconnected') return 'no-data';
  if (tag.status === 'fault') return 'fault';
  if (elapsed > TELEMETRY_LIVE_MS) return 'stale';
  
  // When live telemetry is arriving within timeout, determine active state:
  // - Pumps: value=0 means pump is OFF (normal operation) — show 'connected' so pump card handles ON/OFF display
  // - All other sensors: value=0 while connected = ZERO reading — show 'inactive' (blue ZERO badge)
  if (tag.instrumentType === 'pump') return 'connected';
  return tag.value === 0 ? 'inactive' : 'connected';
};

export const useTagConnection = (tag?: TagData | null): ConnectionState => {
  const [, tick] = useState(0);

  // Re-evaluate every second so that offline/disconnected transition is computed live
  useEffect(() => {
    const id = setInterval(() => tick(t => (t + 1) % 1_000_000), 1000);
    return () => clearInterval(id);
  }, []);

  return getTagConnection(tag);
};

/** Convenience boolean: true when sensor is actively communicating (live data flow). */
export const isTagLive = (tag?: TagData | null): boolean => {
  const conn = getTagConnection(tag);
  return conn === 'connected' || conn === 'inactive';
};
