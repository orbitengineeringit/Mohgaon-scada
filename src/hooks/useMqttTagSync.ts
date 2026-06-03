import { useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { MqttMessage } from '@/contexts/MqttContext';
import type { TagData } from '@/contexts/ScadaContext';
import { toast } from 'sonner';
import { useAlarm } from '@/contexts/AlarmContext';
import { logError, logDebug, logWarn, logInfo } from '@/lib/errorLogger';
import {
  ALL_OHT_SENSORS, INTAKE_SENSORS, WTP_SENSORS, ALL_SENSORS,
  VALID_OHT_KEYS, VALID_INTAKE_KEYS, VALID_WTP_KEYS,
  BuaBicchiyaSensor, PT_TO_PUMP_MAP,
} from '@/config/buaBicchiyaSensors';

interface TagUpdate {
  tagId: string;
  value: number;
  section: 'oht' | 'intake' | 'wtp';
  topic: string;
}

const DISCONNECT_TIMEOUT_MS = 10000;

export const useMqttTagSync = (
  intakeTags: TagData[],
  ohtTags: TagData[],
  wtpTags: TagData[],
  setIntakeTags: React.Dispatch<React.SetStateAction<TagData[]>>,
  setOhtTags: React.Dispatch<React.SetStateAction<TagData[]>>,
  setWtpTags: React.Dispatch<React.SetStateAction<TagData[]>>
) => {
  const pendingLogs = useRef<TagUpdate[]>([]);
  const flushInterval = useRef<NodeJS.Timeout | null>(null);
  const disconnectCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const { addAlarm } = useAlarm();
  const tagConfigCache = useRef<Map<string, string>>(new Map());
  const lastCacheRefresh = useRef<number>(0);
  const CACHE_TTL = 30000;

  useEffect(() => {
    disconnectCheckInterval.current = setInterval(() => {
      const now = new Date();
      const checkTags = (setter: React.Dispatch<React.SetStateAction<TagData[]>>) => {
        setter(prev => prev.map(tag => {
          if (tag.source === 'mqtt' && tag.lastDataTime) {
            const elapsed = now.getTime() - tag.lastDataTime.getTime();
            if (elapsed > DISCONNECT_TIMEOUT_MS && tag.status !== 'disconnected') {
              return { ...tag, status: 'disconnected' as const };
            }
          }
          return tag;
        }));
      };
      checkTags(setIntakeTags);
      checkTags(setOhtTags);
      checkTags(setWtpTags);
    }, 5000);
    return () => { if (disconnectCheckInterval.current) clearInterval(disconnectCheckInterval.current); };
  }, [addAlarm, setIntakeTags, setOhtTags, setWtpTags]);

  const ensureTagConfigExists = useCallback(async (section: 'oht' | 'intake' | 'wtp', tagId: string) => {
    const key = `${section}-${tagId}`;
    if (tagConfigCache.current.has(key)) return;
    try {
      const { data: existing } = await supabase.from('tag_config').select('id')
        .eq('section', section).eq('tag_id', tagId).limit(1).maybeSingle();
      if (existing?.id) { tagConfigCache.current.set(key, existing.id); return; }
      const sensor = ALL_SENSORS.find(s => s.id === tagId && s.section === section);
      const { data: created } = await supabase.from('tag_config').insert({
        section, tag_id: tagId, label: sensor?.label || '', unit: sensor?.unit || '',
        is_active: true, activated_at: new Date().toISOString(),
        high_setpoint: null, low_setpoint: null, alarm_enabled: true, alarm_emails: [],
      }).select('id').single();
      if (created?.id) tagConfigCache.current.set(key, created.id);
    } catch (error) { logError('TagSync.ensureTagConfigExists', error); }
  }, []);

  const refreshTagConfigCache = useCallback(async () => {
    try {
      const { data: tagConfigs } = await supabase.from('tag_config').select('id, tag_id, section');
      if (tagConfigs) {
        tagConfigCache.current.clear();
        tagConfigs.forEach(tc => tagConfigCache.current.set(`${tc.section}-${tc.tag_id}`, tc.id));
        lastCacheRefresh.current = Date.now();
      }
    } catch (error) { logError('TagSync.refreshCache', error); }
  }, []);

  const startBatchWriter = useCallback(() => {
    if (flushInterval.current) return () => {};
    refreshTagConfigCache();
    flushInterval.current = setInterval(async () => {
      if (pendingLogs.current.length === 0) return;
      if (Date.now() - lastCacheRefresh.current > CACHE_TTL) await refreshTagConfigCache();
      const logsToWrite = [...pendingLogs.current];
      pendingLogs.current = [];
      try {
        const uncached = logsToWrite.filter(l => !tagConfigCache.current.has(`${l.section}-${l.tagId}`));
        if (uncached.length > 0) {
          await Promise.all(uncached.map(l => ensureTagConfigExists(l.section as any, l.tagId)));
        }
        const logsToInsert = logsToWrite
          .filter(log => tagConfigCache.current.has(`${log.section}-${log.tagId}`))
          .map(log => ({
            tag_config_id: tagConfigCache.current.get(`${log.section}-${log.tagId}`)!,
            tag_id: log.tagId, section: log.section, value: log.value,
            timestamp: new Date().toISOString(), source: 'mqtt', mqtt_topic: log.topic,
          }));
        if (logsToInsert.length > 0) {
          const { error } = await supabase.from('historian_logs').insert(logsToInsert);
          if (error) { logError('TagSync.batchWrite', error); pendingLogs.current.push(...logsToWrite); }
        }
      } catch (error) { logError('TagSync.batchWrite', error); pendingLogs.current.push(...logsToWrite); }
    }, 10000);
    return () => { if (flushInterval.current) { clearInterval(flushInterval.current); flushInterval.current = null; } };
  }, [ensureTagConfigExists, refreshTagConfigCache]);

  const processMqttMessage = useCallback(async (message: MqttMessage) => {
    const { payload, section, subsection, topic } = message;
    if (section === 'unknown') return;

    let sensors: BuaBicchiyaSensor[];
    let setter: React.Dispatch<React.SetStateAction<TagData[]>>;
    let tags: TagData[];
    let validKeys: string[];

    if (section === 'oht') {
      sensors = ALL_OHT_SENSORS.filter(s => !subsection || s.subsection === subsection);
      setter = setOhtTags;
      tags = ohtTags;
      validKeys = VALID_OHT_KEYS;
    } else if (section === 'intake') {
      sensors = INTAKE_SENSORS;
      setter = setIntakeTags;
      tags = intakeTags;
      validKeys = VALID_INTAKE_KEYS;
    } else if (section === 'wtp') {
      sensors = WTP_SENSORS;
      setter = setWtpTags;
      tags = wtpTags;
      validKeys = VALID_WTP_KEYS;
    } else return;

    for (const [mqttKey, rawValue] of Object.entries(payload)) {
      if (!validKeys.includes(mqttKey)) continue;

      const value = typeof rawValue === 'string' ? parseFloat(rawValue) : rawValue;
      if (isNaN(value)) continue;

      const sensor = sensors.find(s => s.mqttKey === mqttKey);
      if (!sensor) continue;

      const sensorId = sensor.id;
      const existingTag = tags.find(t => t.id === sensorId);

      let displayValue = value;
      let shouldLog = true;

      // Non-pump analog instruments
      if (value < 0) { displayValue = 0; shouldLog = false; }
      if (value === 0) { displayValue = 0; shouldLog = false; }
      // PT overflow protection
      if (sensor.instrumentType === 'pt' && value > 1e30) { displayValue = 0; shouldLog = false; }

      // Alarm check for analog sensors
      if (existingTag && sensor.type === 'analog') {
        const highThreshold = existingTag.highSetpoint ?? existingTag.max;
        const lowThreshold = existingTag.lowSetpoint ?? existingTag.min;
        const alarmEnabled = existingTag.alarmEnabled !== false;
        if (alarmEnabled && (displayValue > highThreshold || displayValue < lowThreshold)) {
          const type = displayValue > highThreshold ? 'High' : 'Low';
          const threshold = type === 'High' ? highThreshold : lowThreshold;
          const msg = `Alarm: ${existingTag.label} ${type} (${displayValue.toFixed(2)} ${existingTag.unit}) - Threshold: ${threshold}`;
          addAlarm({
            tagId: sensorId, tagConfigId: existingTag.dbId, label: existingTag.label,
            value: displayValue, unit: existingTag.unit, type, message: msg,
            section: section as 'intake' | 'oht',
            highSetpoint: existingTag.highSetpoint, lowSetpoint: existingTag.lowSetpoint,
          });
        }
      }

      // Update the sensor tag value and its derived pump status atomically in a single state change
      setter(prev => {
        const pumpId = PT_TO_PUMP_MAP[sensorId];
        const pumpValue = sensor.instrumentType === 'pt' ? (displayValue > 1.5 ? 1 : 0) : null;

        return prev.map(t => {
          if (t.id === sensorId) {
            return {
              ...t, value: displayValue, timestamp: new Date(), source: 'mqtt' as const,
              mqttTopic: topic, isActive: true, lastDataTime: new Date(), status: 'connected' as const
            };
          }
          if (pumpId && t.id === pumpId) {
            return {
              ...t, value: pumpValue!, timestamp: new Date(), source: 'mqtt' as const,
              mqttTopic: topic, isActive: true, lastDataTime: new Date(), status: 'connected' as const
            };
          }
          return t;
        });
      });

      if (shouldLog) {
        pendingLogs.current.push({
          tagId: sensorId, value: displayValue,
          section: section as 'oht' | 'intake' | 'wtp',
          topic,
        });
      }
    }
  }, [intakeTags, ohtTags, wtpTags, setIntakeTags, setOhtTags, setWtpTags, addAlarm]);

  return { processMqttMessage, startBatchWriter };
};
