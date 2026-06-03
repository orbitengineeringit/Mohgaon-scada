import React, { useMemo } from 'react';

interface KwBarProps {
  value: number;
  max: number;
  unit: string;
}

/**
 * Energy Meter - realistic SCADA design matching reference image
 * LCD display showing reading, meter body with indicator lights
 */
const KwBar: React.FC<KwBarProps> = ({ value, max, unit }) => {
  const percentage = useMemo(() => Math.min(100, Math.max(0, (value / max) * 100)), [value, max]);

  const getStatusColor = () => {
    if (percentage > 80) return 'hsl(var(--destructive))';
    if (percentage > 60) return 'hsl(var(--warning))';
    return 'hsl(var(--success))';
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="100%" height="auto" viewBox="0 0 90 110" className="drop-shadow-md max-w-[180px]">
        {/* Outer casing */}
        <rect x="5" y="2" width="80" height="106" rx="5"
          fill="hsl(var(--secondary))" stroke="hsl(var(--border))" strokeWidth="1.5" />
        {/* Inner panel */}
        <rect x="10" y="7" width="70" height="96" rx="3"
          fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1" />

        {/* Corner screws */}
        {[[12, 9], [72, 9], [12, 97], [72, 97]].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="3" fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="0.5" />
        ))}

        {/* LCD Display area */}
        <rect x="16" y="16" width="58" height="24" rx="2"
          fill="hsl(var(--secondary))" stroke="hsl(var(--border))" strokeWidth="0.8" />
        {/* LCD background glow */}
        <rect x="18" y="18" width="54" height="20" rx="1"
          fill="hsl(142 71% 45% / 0.1)" />
        {/* LCD reading */}
        <text x="45" y="33" textAnchor="middle" 
          className="fill-foreground" 
          style={{ fontSize: '13px', fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", fontWeight: 700 }}>
          {value.toFixed(1)}
        </text>
        <text x="45" y="23" textAnchor="middle"
          className="fill-muted-foreground"
          style={{ fontSize: '6px', fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
          {unit}
        </text>

        {/* Indicator lights row */}
        <g>
          {[24, 33, 42, 51, 60].map((x, i) => (
            <circle key={i} cx={x} cy="48" r="2.5"
              fill={i < Math.ceil(percentage / 20) ? getStatusColor() : 'hsl(var(--muted))'}
              className={i < Math.ceil(percentage / 20) && percentage > 0 ? 'animate-pulse-subtle' : ''}
            />
          ))}
        </g>
        {/* Label dots */}
        <circle cx="30" cy="56" r="2" fill="hsl(var(--destructive) / 0.6)" />
        <circle cx="38" cy="56" r="2" fill="hsl(var(--warning) / 0.6)" />
        <circle cx="46" cy="56" r="2" fill="hsl(var(--success) / 0.6)" />

        {/* Rotary dial */}
        <circle cx="62" cy="56" r="6" fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="0.8" />
        <circle cx="62" cy="56" r="2" fill="hsl(var(--muted-foreground))" />

        {/* Load bar */}
        <rect x="18" y="68" width="54" height="5" rx="2" fill="hsl(var(--secondary))" stroke="hsl(var(--border))" strokeWidth="0.5" />
        <rect x="18" y="68" width={54 * percentage / 100} height="5" rx="2"
          fill={getStatusColor()}
          className="transition-all duration-500 ease-out" />

        {/* Bottom terminal block */}
        <rect x="14" y="80" width="62" height="18" rx="2"
          fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="0.8" opacity="0.6" />
        {/* Terminal screws */}
        {[26, 38, 50, 62].map((x, i) => (
          <g key={i}>
            <rect x={x - 4} y={82} width="8" height="10" rx="1"
              fill="hsl(var(--muted-foreground) / 0.3)" stroke="hsl(var(--border))" strokeWidth="0.4" />
            <circle cx={x} cy={87} r="2" fill="hsl(var(--muted-foreground) / 0.4)" />
          </g>
        ))}
      </svg>
    </div>
  );
};

export default KwBar;
