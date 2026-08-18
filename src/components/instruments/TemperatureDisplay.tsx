import React, { useMemo } from 'react';

interface TemperatureDisplayProps {
  value: number;
  unit?: string;
  min?: number;
  max?: number;
  label?: string;
}

/**
 * Classic Glass Thermometer Temperature Display
 */
const TemperatureDisplay: React.FC<TemperatureDisplayProps> = ({
  value,
  unit = '°C',
  min = 0,
  max = 60,
}) => {
  const percentage = useMemo(() => {
    return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  }, [value, min, max]);

  const getColor = () => {
    if (percentage > 80) return '#ef4444'; // Hot - Red
    if (percentage > 60) return '#f97316'; // Warm - Orange
    if (percentage > 30) return '#22c55e'; // Normal - Green
    return '#38bdf8';                      // Cool - Sky Blue
  };

  const color = getColor();
  const bulbR = 15;
  const stemW = 12;
  const stemH = 95;
  const stemX = 50 - stemW / 2;
  const stemY = 16;
  const bulbCy = stemY + stemH + bulbR - 2;
  const fillH = (percentage / 100) * stemH;
  const fillY = stemY + stemH - fillH;

  return (
    <div className="flex flex-col items-center gap-1 select-none">
      <svg width="100" height="175" viewBox="0 0 100 175" className="overflow-visible">
        <defs>
          <linearGradient id="therm-fill-grad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={color} stopOpacity="0.8" />
          </linearGradient>
          <filter id="therm-glow-filter" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <clipPath id="therm-stem-clip">
            <rect x={stemX + 1} y={stemY} width={stemW - 2} height={stemH} rx={4} />
          </clipPath>
        </defs>

        {/* Stem outer background track */}
        <rect x={stemX} y={stemY} width={stemW} height={stemH} rx={stemW / 2}
          fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1.5" />

        {/* Tick marks on right */}
        {[0, 20, 40, 60].map((temp) => {
          const p = (temp - min) / (max - min);
          const tickY = stemY + stemH - p * stemH;
          return (
            <g key={temp}>
              <line x1={stemX + stemW + 2} y1={tickY} x2={stemX + stemW + 8} y2={tickY}
                stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" />
              <text x={stemX + stemW + 11} y={tickY + 3.5} textAnchor="start"
                fill="hsl(var(--muted-foreground))"
                style={{ fontSize: "8.5px", fontFamily: "ui-monospace, monospace", fontWeight: 700 }}>
                {temp}
              </text>
            </g>
          );
        })}

        {/* Minor ticks */}
        {[10, 30, 50].map((temp) => {
          const p = (temp - min) / (max - min);
          const tickY = stemY + stemH - p * stemH;
          return (
            <line key={temp} x1={stemX + stemW + 2} y1={tickY} x2={stemX + stemW + 5} y2={tickY}
              stroke="hsl(var(--muted-foreground))" strokeWidth="1" opacity="0.6" />
          );
        })}

        {/* Mercury stem liquid fill */}
        <g clipPath="url(#therm-stem-clip)">
          <rect x={stemX + 1} y={fillY} width={stemW - 2} height={fillH + bulbR}
            rx={3} fill="url(#therm-fill-grad)"
            filter="url(#therm-glow-filter)"
            style={{ transition: "y 1s cubic-bezier(0.4,0,0.2,1), height 1s cubic-bezier(0.4,0,0.2,1)" }}
          />
        </g>

        {/* Stem glass outline */}
        <rect x={stemX} y={stemY} width={stemW} height={stemH} rx={stemW / 2}
          fill="none" stroke="hsl(var(--border))" strokeWidth="1.5" />

        {/* Bulb at bottom */}
        <circle cx={50} cy={bulbCy} r={bulbR}
          fill={color} filter="url(#therm-glow-filter)" opacity="0.95"
          style={{ transition: "fill 0.8s ease" }} />
        <circle cx={50} cy={bulbCy} r={bulbR}
          fill="none" stroke="hsl(var(--border))" strokeWidth="2" />
        {/* Bulb glass reflection */}
        <circle cx={46} cy={bulbCy - 4} r={3.5} fill="white" opacity="0.4" />

        {/* Digital Readout */}
        <text x={50} y={156} textAnchor="middle"
          className="font-mono font-extrabold"
          style={{ fontSize: "17px", fill: color }}>
          {value.toFixed(1)}
        </text>
        <text x={50} y={169} textAnchor="middle"
          fill="hsl(var(--muted-foreground))"
          style={{ fontSize: "10px", fontWeight: 700 }}>
          {unit}
        </text>
      </svg>
    </div>
  );
};

export default TemperatureDisplay;
