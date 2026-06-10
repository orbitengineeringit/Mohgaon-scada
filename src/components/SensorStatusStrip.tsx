import React, { useMemo } from 'react';
import { TagData } from '@/contexts/ScadaContext';
import { getTagConnection } from '@/hooks/useTagConnection';

interface SensorStatusStripProps {
  tags: TagData[];
  sensorIds: string[];
  /** Optional label override per sensor id */
  labels?: Record<string, string>;
}

/**
 * Compact horizontal strip showing ON/OFF/ZERO status for each listed sensor.
 */
const SensorStatusStrip: React.FC<SensorStatusStripProps> = ({ tags, sensorIds, labels }) => {
  const items = useMemo(() => sensorIds.map(id => {
    const tag = tags.find(t => t.id === id);
    const connection = getTagConnection(tag);
    return { id, tag, connection, label: labels?.[id] ?? tag?.label ?? id };
  }), [tags, sensorIds, labels]);

  const activeCount = items.filter(i => i.connection === 'connected' || i.connection === 'inactive').length;

  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1.5 px-2.5 py-2 rounded-lg bg-card/60 border border-border/60 backdrop-blur-sm mb-2">
      <div className="flex items-center gap-1.5 mr-1 shrink-0">
        <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground tracking-wider uppercase">
          Sensors
        </span>
        <span className="text-[9px] font-mono font-semibold text-muted-foreground/80 bg-muted/40 px-1.5 py-0.5 rounded">
          {activeCount}/{items.length}
        </span>
      </div>
      {items.map(({ id, connection, label }) => {
        let titleText = '';
        let badgeClass = '';
        let dotClass = '';
        let statusTextClass = '';
        let statusLabel = '';

        if (connection === 'connected') {
          titleText = `${label} — Receiving MQTT data`;
          badgeClass = 'bg-success/10 text-success border-success/30';
          dotClass = 'bg-success pulse-live';
          statusTextClass = 'bg-success/20 text-success';
          statusLabel = 'ON';
        } else if (connection === 'inactive') {
          titleText = `${label} — Active (Zero value)`;
          badgeClass = 'bg-sky-500/10 text-sky-500 border-sky-500/30';
          dotClass = 'bg-sky-500';
          statusTextClass = 'bg-sky-500/20 text-sky-500';
          statusLabel = 'ZERO';
        } else {
          titleText = `${label} — No data`;
          badgeClass = 'bg-destructive/10 text-destructive border-destructive/30';
          dotClass = 'bg-destructive animate-pulse';
          statusTextClass = 'bg-destructive/20 text-destructive';
          statusLabel = 'OFF';
        }

        return (
          <span
            key={id}
            title={titleText}
            className={`inline-flex items-center gap-1.5 pl-1.5 pr-0.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-mono font-semibold border whitespace-nowrap ${badgeClass}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} />
            <span className="leading-none">{id}</span>
            <span className={`leading-none text-[8px] sm:text-[9px] font-bold px-1 py-0.5 rounded ${statusTextClass}`}>
              {statusLabel}
            </span>
          </span>
        );
      })}
    </div>
  );
};

export default SensorStatusStrip;