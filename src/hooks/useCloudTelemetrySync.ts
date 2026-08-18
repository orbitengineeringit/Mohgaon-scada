import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TagData } from '@/contexts/ScadaContext';
import { PT_TO_PUMP_MAP } from '@/config/mohgaonSensors';
import { logError, logInfo } from '@/lib/errorLogger';

interface CloudSyncProps {
  intakeTags: TagData[];
  ohtTags: TagData[];
  wtpTags: TagData[];
  setIntakeTags: React.Dispatch<React.SetStateAction<TagData[]>>;
  setOhtTags: React.Dispatch<React.SetStateAction<TagData[]>>;
  setWtpTags: React.Dispatch<React.SetStateAction<TagData[]>>;
  isMqttConnected: boolean;
}

export const useCloudTelemetrySync = ({
  intakeTags,
  ohtTags,
  wtpTags,
  setIntakeTags,
  setOhtTags,
  setWtpTags,
  isMqttConnected,
}: CloudSyncProps) => {
  const [isCloudActive, setIsCloudActive] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const isSyncingRef = useRef(false);

  const applyTelemetryData = useCallback((telemetry: Record<string, { value: number; timestamp?: string } | number>) => {
    const now = new Date();

    const updateTags = (setter: React.Dispatch<React.SetStateAction<TagData[]>>) => {
      setter(prev => prev.map(tag => {
        const rawEntry = telemetry[tag.id];
        if (rawEntry === undefined) return tag;

        const val = typeof rawEntry === 'object' && rawEntry !== null ? rawEntry.value : rawEntry;
        if (typeof val !== 'number' || isNaN(val)) return tag;

        return {
          ...tag,
          value: val,
          status: 'connected' as const,
          source: 'mqtt' as const,
          isActive: true,
          lastDataTime: now,
          timestamp: now,
        };
      }));
    };

    updateTags(setIntakeTags);
    updateTags(setOhtTags);
    updateTags(setWtpTags);

    // Update derived pump states (Only if PT sensor actually received valid data)
    const applyPumps = (setter: React.Dispatch<React.SetStateAction<TagData[]>>) => {
      setter(prev => {
        return prev.map(tag => {
          if (tag.instrumentType === 'pump') {
            const ptTag = prev.find(t => PT_TO_PUMP_MAP[t.id] === tag.id);
            if (ptTag && ptTag.status === 'connected' && ptTag.lastDataTime && ptTag.value !== null) {
              const isRunning = ptTag.value > 1.5 ? 1 : 0;
              return {
                ...tag,
                value: isRunning,
                status: 'connected' as const,
                source: 'mqtt' as const,
                isActive: true,
                lastDataTime: ptTag.lastDataTime,
                timestamp: now,
              };
            } else {
              // If PT sensor has not received data, pump is OFF and disconnected
              return {
                ...tag,
                value: 0,
                status: 'disconnected' as const,
                isActive: false,
              };
            }
          }
          return tag;
        });
      });
    };

    applyPumps(setIntakeTags);
    applyPumps(setWtpTags);

    setIsCloudActive(true);
    setLastSyncAt(now);
  }, [setIntakeTags, setOhtTags, setWtpTags]);

  const syncLatestFromCloud = useCallback(async () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;

    try {
      // Step 1: Fast query from historian_logs for immediate display
      const { data: logs, error: logErr } = await supabase
        .from('historian_logs')
        .select('tag_id, value, timestamp, section')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (!logErr && logs && logs.length > 0) {
        const latestMap: Record<string, { value: number; timestamp: string }> = {};
        logs.forEach(l => {
          if (l.tag_id && l.value !== null && !latestMap[l.tag_id]) {
            latestMap[l.tag_id] = { value: l.value, timestamp: l.timestamp };
          }
        });
        if (Object.keys(latestMap).length > 0) {
          applyTelemetryData(latestMap);
        }
      }

      // Step 2: Trigger scada-ingest edge function to pull fresh live broker snapshot
      const { data: ingestData, error: ingestErr } = await supabase.functions.invoke('scada-ingest');
      if (!ingestErr && ingestData?.telemetry) {
        applyTelemetryData(ingestData.telemetry);
        logInfo('CloudTelemetry', `Synced ${Object.keys(ingestData.telemetry).length} live tags via Cloud Ingest`);
      }
    } catch (err) {
      logError('useCloudTelemetrySync', err);
    } finally {
      isSyncingRef.current = false;
    }
  }, [applyTelemetryData]);

  // Initial and periodic sync when MQTT is disconnected
  useEffect(() => {
    if (isMqttConnected) {
      setIsCloudActive(false);
      return;
    }

    // Run initial sync immediately
    syncLatestFromCloud();

    // Poll every 30 seconds for live updates
    const interval = setInterval(() => {
      if (!isMqttConnected) {
        syncLatestFromCloud();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isMqttConnected, syncLatestFromCloud]);

  return {
    isCloudActive,
    lastSyncAt,
    syncLatestFromCloud,
  };
};
