import React from 'react';

interface IntakeIconProps {
  size?: number;
  className?: string;
}

const IntakeIcon: React.FC<IntakeIconProps> = ({ size = 40, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none" className={className}>
    <defs>
      <linearGradient id="intakePageGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="hsl(var(--primary))" />
        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
      </linearGradient>
      <linearGradient id="intakeWater" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.7" />
        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
      </linearGradient>
    </defs>

    {/* Water reservoir base */}
    <rect x="8" y="38" width="64" height="28" rx="6" fill="hsl(var(--primary) / 0.08)" stroke="hsl(var(--primary) / 0.3)" strokeWidth="1.5" />
    
    {/* Animated water inside */}
    <rect x="10" y="44" width="60" height="20" rx="4" fill="url(#intakeWater)">
      <animate attributeName="height" values="20;16;20" dur="3s" repeatCount="indefinite" />
      <animate attributeName="y" values="44;48;44" dur="3s" repeatCount="indefinite" />
    </rect>
    
    {/* Water wave */}
    <path d="M12 48 Q22 44 32 48 Q42 52 52 48 Q62 44 68 48" stroke="hsl(var(--primary))" strokeWidth="1.5" fill="none" opacity="0.5">
      <animate attributeName="d" dur="2s" repeatCount="indefinite"
        values="M12 48 Q22 44 32 48 Q42 52 52 48 Q62 44 68 48;M12 48 Q22 52 32 48 Q42 44 52 48 Q62 52 68 48;M12 48 Q22 44 32 48 Q42 52 52 48 Q62 44 68 48" />
    </path>

    {/* Vertical Pump 1 */}
    <rect x="18" y="12" width="12" height="28" rx="3" fill="url(#intakePageGrad)" />
    <rect x="15" y="20" width="18" height="4" rx="2" fill="hsl(var(--primary))" opacity="0.7" />
    <circle cx="24" cy="30" r="3" fill="hsl(var(--primary-foreground))">
      <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite" />
    </circle>

    {/* Vertical Pump 2 */}
    <rect x="50" y="8" width="12" height="32" rx="3" fill="url(#intakePageGrad)" />
    <rect x="47" y="18" width="18" height="4" rx="2" fill="hsl(var(--primary))" opacity="0.7" />
    <circle cx="56" cy="28" r="3" fill="hsl(var(--primary-foreground))">
      <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite" begin="0.5s" />
    </circle>

    {/* Pipe connections */}
    <path d="M24 40 L24 38 M56 40 L56 38" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" />

    {/* Flow dots */}
    <circle cx="24" cy="36" r="1.5" fill="hsl(var(--primary))">
      <animate attributeName="cy" values="36;42;48" dur="1s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="1;0.5;0" dur="1s" repeatCount="indefinite" />
    </circle>
    <circle cx="56" cy="36" r="1.5" fill="hsl(var(--primary))">
      <animate attributeName="cy" values="36;42;48" dur="1s" repeatCount="indefinite" begin="0.3s" />
      <animate attributeName="opacity" values="1;0.5;0" dur="1s" repeatCount="indefinite" begin="0.3s" />
    </circle>
  </svg>
);

export default IntakeIcon;
