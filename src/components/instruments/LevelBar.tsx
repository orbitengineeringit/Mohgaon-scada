import React, { useMemo } from 'react';

interface LevelBarProps {
  value: number;
  min: number;
  max: number;
  unit: string;
  label: string;
}

const LevelBar: React.FC<LevelBarProps> = ({ value, min, max, unit }) => {
  const percentage = useMemo(() => {
    return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  }, [value, min, max]);

  return (
    <div className="relative w-full h-full min-h-[170px] overflow-hidden rounded-lg" style={{ background: 'hsl(var(--card))' }}>

      {/* ---- Water fills from bottom up ---- */}
      <div
        className="absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-in-out"
        style={{ height: `${percentage}%` }}
      >
        {/* Water body - natural reservoir water green-blue */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to bottom, hsl(200 70% 88% / 0.75), hsl(200 65% 78% / 0.85), hsl(200 60% 70% / 0.9))',
        }} />

        {/* Surface wave animation */}
        <div className="absolute top-0 left-0 right-0 h-3 overflow-hidden">
          <svg width="100%" height="12" viewBox="0 0 200 12" preserveAspectRatio="none" className="absolute top-0">
            <path fill="hsl(200 80% 95% / 0.6)" strokeWidth="0">
              <animate
                attributeName="d"
                dur="4s"
                repeatCount="indefinite"
                values="M0 6 Q25 0 50 6 T100 6 T150 6 T200 6 L200 12 L0 12 Z; M0 6 Q25 12 50 6 T100 6 T150 6 T200 6 L200 12 L0 12 Z; M0 6 Q25 0 50 6 T100 6 T150 6 T200 6 L200 12 L0 12 Z"
              />
            </path>
          </svg>
        </div>

        {/* Light shimmer on water surface */}
        <div className="absolute top-0 left-0 right-0 h-1.5 transition-all duration-1000"
          style={{
            background: 'linear-gradient(90deg, transparent, hsl(200 90% 97% / 0.5), transparent)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 4s linear infinite',
          }}
        />

        {/* Subtle depth lines */}
        <div className="absolute inset-0 opacity-[0.08]" style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 8px, hsl(0 0% 100%) 8px, hsl(0 0% 100%) 9px)',
        }} />
      </div>

      {/* ---- Level Scale on the RIGHT side ---- */}
      <div className="absolute right-2 top-2 bottom-2 w-5 flex flex-col justify-between items-end z-10 pointer-events-none">
        {[100, 75, 50, 25, 0].map((tick) => (
          <div key={tick} className="flex items-center gap-0.5">
            <span className="text-[9px] font-mono font-bold text-foreground/70 drop-shadow-sm">{tick}</span>
            <span className="w-2 h-px bg-foreground/50" />
          </div>
        ))}
      </div>

      {/* Vertical scale line */}
      <div className="absolute right-[7px] top-2 bottom-2 w-px bg-foreground/20 z-10 pointer-events-none" />

      {/* ---- Level Indicator Arrow on the right scale ---- */}
      <div
        className="absolute right-[18px] z-10 pointer-events-none transition-all duration-1000 ease-in-out"
        style={{ bottom: `calc(${percentage}% - 4px)` }}
      >
        <svg width="10" height="8" viewBox="0 0 10 8" className="drop-shadow-md">
          <polygon points="10,4 0,0 0,8" fill="hsl(var(--primary))" />
        </svg>
      </div>

      {/* ---- Digital Value Display (top-left) ---- */}
      <div className="absolute top-2 left-2 bg-card/90 backdrop-blur-sm rounded-lg border border-border/50 px-2.5 py-1.5 z-10 shadow-lg">
        <div className="text-xl sm:text-2xl font-extrabold font-mono text-foreground leading-none tracking-tight">
          {value.toFixed(2)}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[10px] font-mono font-bold text-primary">{percentage.toFixed(0)}%</span>
          <span className="text-[10px] text-muted-foreground font-semibold">{unit}</span>
        </div>
      </div>

      {/* ---- "Empty" label if level is 0 ---- */}
      {percentage === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <span className="text-sm font-mono font-bold text-muted-foreground/50 uppercase tracking-widest">Empty</span>
        </div>
      )}

    </div>
  );
};

export default LevelBar;
