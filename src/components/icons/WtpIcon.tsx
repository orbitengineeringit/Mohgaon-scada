import React from 'react';

interface WtpIconProps {
  size?: number;
  className?: string;
}

const WtpIcon: React.FC<WtpIconProps> = ({ size = 40, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none" className={className}>
    <defs>
      <linearGradient id="wtpPageTank" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.15" />
        <stop offset="50%" stopColor="hsl(var(--accent))" stopOpacity="0.25" />
        <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.1" />
      </linearGradient>
    </defs>

    {/* Settling Tank */}
    <g>
      <ellipse cx="22" cy="20" rx="16" ry="7" fill="hsl(var(--accent) / 0.1)" stroke="hsl(var(--accent) / 0.4)" strokeWidth="1.2" />
      <path d="M6 20 L6 48 Q6 54 12 54 L32 54 Q38 54 38 48 L38 20" fill="url(#wtpPageTank)" stroke="hsl(var(--accent) / 0.4)" strokeWidth="1.2" />
      {/* Water inside */}
      <rect x="8" y="28" width="28" height="24" rx="2" fill="hsl(var(--accent) / 0.15)">
        <animate attributeName="height" values="24;20;24" dur="4s" repeatCount="indefinite" />
        <animate attributeName="y" values="28;32;28" dur="4s" repeatCount="indefinite" />
      </rect>
      <text x="22" y="44" textAnchor="middle" fill="hsl(var(--accent))" fontSize="7" fontWeight="700" opacity="0.6">S</text>
    </g>

    {/* Filter Tank */}
    <g>
      <ellipse cx="58" cy="14" rx="16" ry="7" fill="hsl(var(--accent) / 0.1)" stroke="hsl(var(--accent) / 0.4)" strokeWidth="1.2" />
      <path d="M42 14 L42 52 Q42 58 48 58 L68 58 Q74 58 74 52 L74 14" fill="url(#wtpPageTank)" stroke="hsl(var(--accent) / 0.4)" strokeWidth="1.2" />
      {/* Water */}
      <rect x="44" y="24" width="28" height="32" rx="2" fill="hsl(152 60% 42% / 0.15)">
        <animate attributeName="height" values="32;26;32" dur="3.5s" repeatCount="indefinite" />
        <animate attributeName="y" values="24;30;24" dur="3.5s" repeatCount="indefinite" />
      </rect>
      <text x="58" y="44" textAnchor="middle" fill="hsl(var(--accent))" fontSize="7" fontWeight="700" opacity="0.6">F</text>
    </g>

    {/* Connecting pipe */}
    <path d="M38 36 L42 32" stroke="hsl(var(--accent) / 0.5)" strokeWidth="3" strokeLinecap="round" />
    {/* Animated flow in pipe */}
    <path d="M38 36 L42 32" stroke="hsl(var(--accent))" strokeWidth="1.5" strokeDasharray="3 3" strokeLinecap="round">
      <animate attributeName="stroke-dashoffset" from="12" to="0" dur="0.8s" repeatCount="indefinite" />
    </path>

    {/* Output pipe */}
    <path d="M58 58 L58 70 L22 70 L22 54" stroke="hsl(var(--accent) / 0.4)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <path d="M58 58 L58 70 L22 70 L22 54" stroke="hsl(var(--accent))" strokeWidth="1" strokeDasharray="4 4" strokeLinecap="round" fill="none">
      <animate attributeName="stroke-dashoffset" from="16" to="0" dur="1s" repeatCount="indefinite" />
    </path>

    {/* Control indicator */}
    <circle cx="40" cy="70" r="4" fill="hsl(var(--accent) / 0.2)" stroke="hsl(var(--accent))" strokeWidth="1">
      <animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite" />
    </circle>
    <circle cx="40" cy="70" r="1.5" fill="hsl(var(--accent))">
      <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />
    </circle>
  </svg>
);

export default WtpIcon;
