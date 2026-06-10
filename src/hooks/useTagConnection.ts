import { useEffect, useState } from 'react';
import type { TagData } from '@/contexts/ScadaContext';

/**
 * Single source of truth for sensor ON/OFF state across the whole dashboard.
 *
 * Returns one of:
 *  - 'connected' : MQTT data flowing (zero values count as connected).
 *  - 'no-data'   : upstream marked the tag as disconnected (instant flip).
 *  - 'stale'     : status never arrived yet, or last payload is older than
 *                  STALE_MS without an explicit disconnect flag.
 *
 * The rule is locked here: ON/OFF is derived from `tag.status` only —
 * the numeric value (including 0) never influences the indicator.
 */
export type ConnectionState = 'connected' | 'no-data' | 'stale';

// Upstream `useMqttTagSync` flips status to 'disconnected' after 3s of silence
// and re-checks every 1s. We mark anything older than 5s without an explicit
// disconnect as STALE so the UI can warn even when the upstream check is late.
const STALE_MS = 5000;

export const getTagConnection = (tag?: TagData | null): ConnectionState => {
  if (!tag) return 'stale';
  if (tag.status === 'disconnected') return 'no-data';
  if (tag.status === 'unknown' && !tag.lastDataTime) return 'stale';
  if (tag.lastDataTime) {
    const elapsed = Date.now() - new Date(tag.lastDataTime).getTime();
    if (elapsed > STALE_MS) return 'stale';
  }
  return 'connected';
};

export const useTagConnection = (tag?: TagData | null): ConnectionState => {
  const [, tick] = useState(0);

  // Re-evaluate every second so 'stale' kicks in even when no new prop arrives.
  useEffect(() => {
    const id = setInterval(() => tick(t => (t + 1) % 1_000_000), 1000);
    return () => clearInterval(id);
  }, []);

  return getTagConnection(tag);
};

/** Convenience boolean: true when sensor is actively receiving data. */
export const isTagLive = (tag?: TagData | null): boolean =>
  getTagConnection(tag) === 'connected';