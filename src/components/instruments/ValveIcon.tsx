import React from 'react';

interface ValveIconProps {
  isOpen: boolean;
  size?: number;
}

const ValveIcon: React.FC<ValveIconProps> = ({ isOpen, size = 60 }) => {
  const statusColor = isOpen ? 'var(--success)' : 'var(--destructive)';

  return (
    <div className="flex flex-col items-center justify-center gap-2 w-full">
      <svg width="100%" height="auto" viewBox="0 0 48 48" className="transition-all duration-500" style={{ maxWidth: `${size + 40}px` }}>
        <defs>
          <filter id="valve-glow">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Pipe left */}
        <rect x="0" y="18" width="14" height="12" rx="2" fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="1" />
        <rect x="2" y="20" width="10" height="8" rx="1" fill="hsl(var(--muted) / 0.5)" />

        {/* Pipe right */}
        <rect x="34" y="18" width="14" height="12" rx="2" fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="1" />
        <rect x="36" y="20" width="10" height="8" rx="1" fill="hsl(var(--muted) / 0.5)" />

        {/* Valve body */}
        <g className="transition-transform duration-700 ease-out" style={{ transformOrigin: '24px 24px', transform: `rotate(${isOpen ? 0 : 90}deg)` }}>
          <rect x="14" y="14" width="20" height="20" rx="4"
            fill={isOpen ? `hsl(${statusColor} / 0.15)` : `hsl(${statusColor} / 0.15)`}
            stroke={`hsl(${statusColor})`}
            strokeWidth="2"
            filter="url(#valve-glow)"
          />
          {/* Flow passage or block indicator */}
          {isOpen ? (
            <rect x="18" y="21" width="12" height="6" rx="2" fill={`hsl(${statusColor} / 0.4)`} />
          ) : (
            <>
              <line x1="18" y1="18" x2="30" y2="30" stroke={`hsl(${statusColor})`} strokeWidth="2.5" strokeLinecap="round" />
              <line x1="30" y1="18" x2="18" y2="30" stroke={`hsl(${statusColor})`} strokeWidth="2.5" strokeLinecap="round" />
            </>
          )}
        </g>

        {/* Handle stem */}
        <rect x="22" y="4" width="4" height="12" rx="1.5" fill="hsl(var(--muted-foreground))" />
        {/* Handle wheel */}
        <circle cx="24" cy="4" r="4" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="2" />
      </svg>
      <span className={`text-xs font-bold uppercase tracking-wider ${isOpen ? 'text-success' : 'text-destructive'}`}>
        {isOpen ? '● OPEN' : '● CLOSED'}
      </span>
    </div>
  );
};

export default ValveIcon;
