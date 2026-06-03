import React from 'react';

interface OhtIconProps {
  size?: number;
  className?: string;
}

const OhtIcon: React.FC<OhtIconProps> = ({ size = 40, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none" className={className}>
    <defs>
      <linearGradient id="ohtPageTank" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity="0.15" />
        <stop offset="50%" stopColor="hsl(var(--success))" stopOpacity="0.3" />
        <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity="0.1" />
      </linearGradient>
    </defs>

    {/* Back tank (smaller, faded) */}
    <g opacity="0.35" transform="translate(10, 8) scale(0.6)">
      <path d="M20 50 L25 20 L55 20 L60 50 Z" fill="hsl(var(--success) / 0.15)" stroke="hsl(var(--success) / 0.4)" strokeWidth="1.5" />
      <ellipse cx="40" cy="15" rx="22" ry="8" fill="hsl(var(--success) / 0.1)" stroke="hsl(var(--success) / 0.4)" strokeWidth="1.5" />
      <path d="M18 15 L18 30 Q18 34 22 34 L58 34 Q62 34 62 30 L62 15" fill="url(#ohtPageTank)" stroke="hsl(var(--success) / 0.4)" strokeWidth="1.5" />
    </g>

    {/* Main elevated tank */}
    <g>
      {/* Support legs */}
      <line x1="22" y1="52" x2="18" y2="72" stroke="hsl(var(--success) / 0.4)" strokeWidth="2" strokeLinecap="round" />
      <line x1="40" y1="52" x2="40" y2="72" stroke="hsl(var(--success) / 0.4)" strokeWidth="2" strokeLinecap="round" />
      <line x1="58" y1="52" x2="62" y2="72" stroke="hsl(var(--success) / 0.4)" strokeWidth="2" strokeLinecap="round" />
      
      {/* Cross bracing */}
      <line x1="22" y1="60" x2="40" y2="55" stroke="hsl(var(--success) / 0.2)" strokeWidth="1" />
      <line x1="40" y1="55" x2="58" y2="62" stroke="hsl(var(--success) / 0.2)" strokeWidth="1" />

      {/* Tank body */}
      <ellipse cx="40" cy="28" rx="26" ry="10" fill="hsl(var(--success) / 0.08)" stroke="hsl(var(--success) / 0.4)" strokeWidth="1.5" />
      <path d="M14 28 L14 48 Q14 54 20 54 L60 54 Q66 54 66 48 L66 28" fill="url(#ohtPageTank)" stroke="hsl(var(--success) / 0.4)" strokeWidth="1.5" />
      <ellipse cx="40" cy="48" rx="26" ry="8" fill="hsl(var(--success) / 0.05)" stroke="hsl(var(--success) / 0.3)" strokeWidth="1" />

      {/* Water level inside */}
      <rect x="16" y="34" width="48" height="16" rx="3" fill="hsl(var(--success) / 0.2)">
        <animate attributeName="height" values="16;12;18;16" dur="5s" repeatCount="indefinite" />
        <animate attributeName="y" values="34;38;32;34" dur="5s" repeatCount="indefinite" />
      </rect>

      {/* Water wave */}
      <path d="M18 38 Q28 35 40 38 Q52 41 62 37" stroke="hsl(var(--success))" strokeWidth="1" fill="none" opacity="0.4">
        <animate attributeName="d" dur="2.5s" repeatCount="indefinite"
          values="M18 38 Q28 35 40 38 Q52 41 62 37;M18 37 Q28 40 40 37 Q52 34 62 38;M18 38 Q28 35 40 38 Q52 41 62 37" />
      </path>

      {/* Level indicator bar */}
      <rect x="37" y="30" width="6" height="18" rx="3" fill="hsl(var(--background))" stroke="hsl(var(--success) / 0.4)" strokeWidth="1" />
      <rect x="38.5" y="36" width="3" height="10" rx="1.5" fill="hsl(var(--success))">
        <animate attributeName="height" values="10;6;12;10" dur="5s" repeatCount="indefinite" />
        <animate attributeName="y" values="36;40;34;36" dur="5s" repeatCount="indefinite" />
      </rect>

      {/* Blinking status light */}
      <circle cx="40" cy="24" r="2" fill="hsl(var(--success))">
        <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
      </circle>
    </g>

    {/* x6 badge */}
    <g>
      <rect x="58" y="10" width="18" height="12" rx="4" fill="hsl(var(--success) / 0.15)" stroke="hsl(var(--success) / 0.4)" strokeWidth="1" />
      <text x="67" y="19" textAnchor="middle" fill="hsl(var(--success))" fontSize="8" fontWeight="800">×6</text>
    </g>
  </svg>
);

export default OhtIcon;
