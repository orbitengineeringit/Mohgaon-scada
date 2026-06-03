import React, { useMemo } from 'react';

interface PtGaugeProps {
  value: number;
  min: number;
  max: number;
  unit: string;
  label: string;
  size?: number;
  variant?: 'default' | 'cwph';
}

const PtGauge: React.FC<PtGaugeProps> = ({ value, min, max, unit, label, size = 140, variant = 'default' }) => {
  const isCwph = variant === 'cwph';
  const percentage = useMemo(() => {
    return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  }, [value, min, max]);

  const needleAngle = useMemo(() => {
    return -135 + (percentage / 100) * 270;
  }, [percentage]);

  const getColor = () => {
    if (percentage > 85) return 'hsl(var(--destructive))';
    if (percentage > 65) return 'hsl(var(--warning))';
    return isCwph ? 'hsl(var(--primary))' : 'hsl(var(--success))';
  };

  const r = size / 2 - 8;
  const cx = size / 2;
  const cy = size / 2;
  const needleLen = r - 16;

  const createArc = (startDeg: number, endDeg: number) => {
    const startRad = (startDeg - 90) * Math.PI / 180;
    const endRad = (endDeg - 90) * Math.PI / 180;
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    const largeArc = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  const glowId = `gauge-glow-${label.replace(/\s/g, '')}`;
  const showActiveArc = percentage > 2;

  return (
    <div className="flex flex-col items-center">
      <svg width="100%" height="auto" viewBox={`0 0 ${size} ${size * 0.85}`} style={{ maxWidth: `${size + 60}px` }}>
        <defs>
          <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%" filterUnits="objectBoundingBox">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <radialGradient id={`hub-${glowId}`}>
            <stop offset="0%" stopColor={getColor()} />
            <stop offset="100%" stopColor={getColor()} stopOpacity="0.6" />
          </radialGradient>
        </defs>

        {/* Background arc */}
        <path d={createArc(-135, 135)} fill="none" stroke={isCwph ? 'hsl(var(--muted))' : 'hsl(var(--border))'} strokeWidth={isCwph ? 8 : 6} strokeLinecap="round" />
        {/* Safe zone */}
        <path d={createArc(-135, -135 + 270 * 0.65)} fill="none" stroke={isCwph ? 'hsl(var(--primary) / 0.35)' : 'hsl(var(--success) / 0.3)'} strokeWidth={isCwph ? 8 : 6} strokeLinecap="round" />
        {/* Warning zone */}
        <path d={createArc(-135 + 270 * 0.65, -135 + 270 * 0.85)} fill="none" stroke="hsl(var(--warning) / 0.4)" strokeWidth={isCwph ? 8 : 6} strokeLinecap="round" />
        {/* Danger zone */}
        <path d={createArc(-135 + 270 * 0.85, 135)} fill="none" stroke="hsl(var(--destructive) / 0.4)" strokeWidth={isCwph ? 8 : 6} strokeLinecap="round" />

        {/* Active value arc - only show when percentage is meaningful */}
        {showActiveArc && (
          <path
            d={createArc(-135, -135 + 270 * (percentage / 100))}
            fill="none"
            stroke={getColor()}
            strokeWidth={isCwph ? 9 : 7}
            strokeLinecap="round"
            filter={`url(#${glowId})`}
          />
        )}

        {/* Tick marks with labels */}
        {Array.from({ length: 11 }, (_, i) => i).map(i => {
          const pct = (i / 10) * 100;
          const angle = (-135 + 270 * (pct / 100) - 90) * Math.PI / 180;
          const innerR = r - 10;
          const outerR = r - 4;
          const labelR = r - 18;
          const tickValue = min + (i / 10) * (max - min);
          const isMajor = i % 2 === 0;
          return (
            <g key={i}>
              <line
                x1={cx + (isMajor ? innerR : innerR + 3) * Math.cos(angle)}
                y1={cy + (isMajor ? innerR : innerR + 3) * Math.sin(angle)}
                x2={cx + outerR * Math.cos(angle)}
                y2={cy + outerR * Math.sin(angle)}
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={isMajor ? 1.5 : 0.8}
              />
              {isMajor && (
                <text
                  x={cx + labelR * Math.cos(angle)}
                  y={cy + labelR * Math.sin(angle)}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className={isCwph ? 'fill-foreground' : 'fill-muted-foreground'}
                  style={{ fontSize: isCwph ? '9px' : '7px', fontWeight: isCwph ? 700 : 400 }}
                >
                  {Number.isInteger(tickValue) ? tickValue : tickValue.toFixed(1)}
                </text>
              )}
            </g>
          );
        })}

        {/* Center hub */}
        <circle cx={cx} cy={cy} r={6} fill={`url(#hub-${glowId})`} />
        <circle cx={cx} cy={cy} r={3} fill={getColor()} opacity={0.8} />

        {/* Needle — using transform rotate for smooth CSS transition */}
        <line
          x1={0}
          y1={0}
          x2={0}
          y2={-needleLen}
          stroke={getColor()}
          strokeWidth={2.5}
          strokeLinecap="round"
          style={{
            transform: `translate(${cx}px, ${cy}px) rotate(${needleAngle}deg)`,
            transition: 'transform 1s cubic-bezier(0.4, 0, 0.2, 1)',
            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))',
          }}
        />

        {/* Needle tip dot */}
        {percentage > 1 && (
          <circle
            r={3.5}
            fill={getColor()}
            opacity={0.5}
            style={{
              transform: `translate(${cx}px, ${cy}px) rotate(${needleAngle}deg) translateY(${-needleLen}px)`,
              transition: 'transform 1s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        )}

        {/* Value text */}
        <text x={cx} y={cy + (isCwph ? 42 : 32)} textAnchor="middle" className="fill-foreground font-mono font-bold" style={{ fontSize: isCwph ? '16px' : '12px' }}>
          {value.toFixed(2)}
        </text>
        <text x={cx} y={cy + (isCwph ? 56 : 44)} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: isCwph ? '10px' : '8px' }}>
          {unit}
        </text>
      </svg>
    </div>
  );
};

export default PtGauge;
