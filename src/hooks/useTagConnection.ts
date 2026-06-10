import { useEffect, useState } from 'react';
import type { TagData } from '@/contexts/ScadaContext';

/**
 * Single source of truth for sensor ON/OFF state across the whole dashboard.
 *
 * Returns one of:
 *  - 'connected' : MQTT data flowing and value is non-zero.
 *  - 'inactive'  : MQTT data is flowing but value is exactly 0.0.
 *  - 'no-data'   : upstream marked the tag as disconnected (instant flip).
 *  - 'stale'     : status never arrived yet, or last payload is older than
 *                  the dynamic stale timeout without an explicit disconnect flag.
 */
export type ConnectionState = 'connected' | 'no-data' | 'stale' | 'inactive';

export const getTagConnection = (tag?: TagData | null): ConnectionState => {
  if (!tag) return 'stale';
  
  // Instant ZERO/INACTIVE state: if value is exactly 0, show ZERO
  // and bypass stale/disconnect time checks.
  if (tag.value === 0) return 'inactive';

  if (tag.status === 'disconnected') return 'no-data';
  if (tag.status === 'unknown' && !tag.lastDataTime) return 'stale';
  
  if (tag.lastDataTime) {
    const elapsed = Date.now() - new Date(tag.lastDataTime).getTime();
    
    // Dynamic stale timeout based on section:
    // Intake = 8s, OHT = 15s, WTP = 25s
    const timeout = tag.section === 'intake' ? 8000 : tag.section === 'oht' ? 15000 : 25000;
    
    if (elapsed > timeout) return 'stale';
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

/** Convenience boolean: true when sensor is actively communicating (live data flow). */
export const isTagLive = (tag?: TagData | null): boolean => {
  const conn = getTagConnection(tag);
  return conn === 'connected' || conn === 'inactive';
};