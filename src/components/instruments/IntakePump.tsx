import React from 'react';

interface IntakePumpProps {
  isOn: boolean;
  label: string;
  size?: number;
}

/**
 * VT (Vertical Turbine) Pump - with top motor grill/guard
 */
const IntakePump: React.FC<IntakePumpProps> = ({ isOn, label, size = 120 }) => {
  const pBody = 'hsl(220 60% 42%)';
  const pLight = 'hsl(220 55% 52%)';
  const pDark = 'hsl(220 65% 32%)';
  const pVDark = 'hsl(220 70% 22%)';

  // Realistic Proportions matched to Process View
  const px = 50;
  const mW = 60;
  const mH = 54;
  const mt = 20;
  const ct = mt + mH;
  const ch = 12;
  const bt = ct + ch;
  const btW = 42;
  const bmY = bt + 40;
  const bcEnd = bmY + 50;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size * 0.65} height={size * 1.6} viewBox="0 0 100 280" className="drop-shadow-md">
        
        {/* Motor Grill */}
        <rect x={px - mW / 2} y={mt - 6} width={mW} height={8} rx={2} fill={pDark} stroke={pVDark} strokeWidth={1} />
        {Array.from({ length: 9 }, (_, i) => (
          <line key={`g${i}`} x1={px - mW / 2 + 4 + i * 6.5} y1={mt - 5} x2={px - mW / 2 + 4 + i * 6.5} y2={mt}
            stroke={pVDark} strokeWidth={0.8} opacity={0.7} />
        ))}
        <line x1={px - mW / 2 + 2} y1={mt - 3} x2={px + mW / 2 - 2} y2={mt - 3} stroke={pVDark} strokeWidth={0.5} opacity={0.5} />

        {/* Motor Sub-housing */}
        <rect x={px - mW / 2} y={mt} width={mW} height={mH} rx={4} fill={pBody} stroke={pDark} strokeWidth={1.5} />
        {[0.2, 0.4, 0.6, 0.8].map((f, i) => (
          <line key={`v${i}`} x1={px - mW / 2 + 4} y1={mt + mH * f} x2={px + mW / 2 - 4} y2={mt + mH * f}
            stroke={pDark} strokeWidth={0.8} opacity={0.5} />
        ))}

        {/* LED */}
        <circle cx={px - mW / 2 + 10} cy={mt + 12} r={3.5}
          fill={isOn ? '#22c55e' : '#ef4444'}>
          {isOn && <animate attributeName="opacity" values="1;0.4;1" dur="1s" repeatCount="indefinite" />}
        </circle>

        {/* Terminal box */}
        <rect x={px + mW / 2 - 16} y={mt + 8} width={14} height={10} rx={2} fill={pDark} stroke={pVDark} strokeWidth={0.6} />

        {/* Coupling Block */}
        <rect x={px - 16} y={ct} width={32} height={ch} rx={2} fill={pBody} stroke={pDark} strokeWidth={1.2} />
        <rect x={px - 9} y={ct + 2.5} width={18} height={ch - 5} rx={1.5} fill={pLight} stroke={pDark} strokeWidth={0.6} opacity={0.6} />

        {/* Side outlet Flange */}
        <path d={`M ${px + 16} ${ct + 2} L ${px + 34} ${ct - 3} L ${px + 34} ${ct + 19} L ${px + 16} ${ct + 12} Z`} fill={pBody} stroke={pDark} strokeWidth={1} />
        <rect x={px + 34} y={ct - 4} width={4} height={24} rx="1" fill={pLight} stroke={pDark} strokeWidth="1" />

        {/* Upper Flange */}
        <rect x={px - 20} y={bt} width={40} height={6} rx={1.5} fill={pLight} stroke={pDark} strokeWidth={1} />
        {[-12, 0, 12].map(d => <circle key={d} cx={px + d} cy={bt + 3} r={1.8} fill={pVDark} />)}

        {/* Upper Column */}
        <rect x={px - btW / 2 + 3} y={bt + 6} width={btW - 6} height={bmY - bt - 6} rx={1.5} fill={pBody} stroke={pDark} strokeWidth={1.2} />

        {/* Middle Flange */}
        <rect x={px - 18} y={bmY} width={36} height={5} rx={1} fill={pLight} stroke={pDark} strokeWidth={0.8} />

        {/* Lower Column */}
        <rect x={px - btW / 2 + 3} y={bmY + 5} width={btW - 6} height={bcEnd - bmY - 5} rx={1.5} fill={pBody} stroke={pDark} strokeWidth={1.2} />

        {/* Lower Flange */}
        <rect x={px - 18} y={bcEnd} width={36} height={5} rx={1} fill={pLight} stroke={pDark} strokeWidth={0.8} />

        {/* Bowl */}
        <path d={`M${px - 18} ${bcEnd + 5} L${px - 18} ${bcEnd + 26} Q${px - 18} ${bcEnd + 34} ${px - 10} ${bcEnd + 38} L${px + 10} ${bcEnd + 38} Q${px + 18} ${bcEnd + 34} ${px + 18} ${bcEnd + 26} L${px + 18} ${bcEnd + 5} Z`}
          fill={pBody} stroke={pDark} strokeWidth={1.2} />

        {/* Bell Mouth */}
        <path d={`M${px - 10} ${bcEnd + 38} Q${px - 18} ${bcEnd + 44} ${px - 22} ${bcEnd + 50} L${px - 22} ${bcEnd + 58} Q${px - 22} ${bcEnd + 62} ${px - 16} ${bcEnd + 62} L${px + 16} ${bcEnd + 62} Q${px + 22} ${bcEnd + 62} ${px + 22} ${bcEnd + 58} L${px + 22} ${bcEnd + 50} Q${px + 18} ${bcEnd + 44} ${px + 10} ${bcEnd + 38}`}
          fill={pBody} stroke={pDark} strokeWidth={1.2} />

        {/* Realistic Cutaway Impeller */}
        <rect x={px - 14} y={bcEnd + 10} width="28" height="24" rx="2" fill="#0f172a" stroke={pVDark} strokeWidth="1" />
        <g transform={`translate(${px}, ${bcEnd + 22})`}>
          <rect x="-2" y="-12" width="4" height="24" fill="#94a3b8" />
          <rect x="0" y="-12" width="1.5" height="24" fill="#e2e8f0" />
          <g>
            {isOn && <animateTransform attributeName="transform" type="scale" values="1 1; -1 1; 1 1" dur="0.5s" repeatCount="indefinite" />}
            <path d="M -4 -8 L 4 -8 L 7 8 L -7 8 Z" fill="#64748b" stroke="#475569" strokeWidth="0.5" />
            <path d="M 0 -8 L 4 -8 L 7 8 L 0 8 Z" fill="#94a3b8" />
            <path d="M -6 -3 Q -18 5 -13 11 Q -9 11 -7 5 Z" fill="#cbd5e1" stroke="#475569" strokeWidth="0.5" />
            <path d="M 6 -3 Q 18 5 13 11 Q 9 11 7 5 Z" fill="#748398" stroke="#334155" strokeWidth="0.5" />
            <path d="M 0 -6 Q 5 2 2 11 Q -2 11 -2 1 Z" fill="#f8fafc" stroke="#94a3b8" strokeWidth="0.5" />
          </g>
        </g>

        {/* Strainer */}
        <rect x={px - 18} y={bcEnd + 62} width={36} height={16} rx={2.5} fill={pDark} stroke={pVDark} strokeWidth={1} />
        {[bcEnd + 65, bcEnd + 69, bcEnd + 73].map((sy, i) => (
          <line key={`sh${i}`} x1={px - 15} y1={sy} x2={px + 15} y2={sy} stroke={pVDark} strokeWidth={0.6} opacity={0.6} />
        ))}
        {[-10, -5, 0, 5, 10].map((dx, i) => (
          <line key={`sv${i}`} x1={px + dx} y1={bcEnd + 63} x2={px + dx} y2={bcEnd + 77} stroke={pVDark} strokeWidth={0.6} opacity={0.5} />
        ))}

        {/* Water Animations Shifted */}
        {isOn && (
          <g>
            {/* Water shooting OUT from the side outlet pipe */}
            <circle r="2.5" fill="hsl(200 70% 82%)" opacity="0.7">
              <animate attributeName="cx" values="88;94;98;90" dur="1.2s" repeatCount="indefinite" />
              <animate attributeName="cy" values="90;82;72;62" dur="1.2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8;0.6;0.3;0" dur="1.2s" repeatCount="indefinite" />
              <animate attributeName="r" values="3;3.5;2;1" dur="1.2s" repeatCount="indefinite" />
            </circle>
            <circle r="2" fill="hsl(200 70% 85%)" opacity="0.6">
              <animate attributeName="cx" values="88;97;102;95" dur="1s" repeatCount="indefinite" begin="0.3s" />
              <animate attributeName="cy" values="92;80;68;58" dur="1s" repeatCount="indefinite" begin="0.3s" />
              <animate attributeName="opacity" values="0.7;0.5;0.2;0" dur="1s" repeatCount="indefinite" begin="0.3s" />
            </circle>

            <circle cx="90" cy="90" r="5" fill="hsl(200 70% 82%)" opacity="0.15">
              <animate attributeName="r" values="4;8;4" dur="1s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.2;0.05;0.2" dur="1s" repeatCount="indefinite" />
            </circle>

            {/* Suction bubbles at the new strainer */}
            <circle r="1.5" fill="hsl(200 80% 92%)" opacity="0.5">
              <animate attributeName="cx" values="42;45;41" dur="1.5s" repeatCount="indefinite" />
              <animate attributeName="cy" values="264;254;244" dur="1.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;0.3;0" dur="1.5s" repeatCount="indefinite" />
            </circle>
            <circle r="1" fill="hsl(200 80% 92%)" opacity="0.4">
              <animate attributeName="cx" values="55;52;56" dur="1.2s" repeatCount="indefinite" begin="0.4s" />
              <animate attributeName="cy" values="264;250;234" dur="1.2s" repeatCount="indefinite" begin="0.4s" />
              <animate attributeName="opacity" values="0.4;0.2;0" dur="1.2s" repeatCount="indefinite" begin="0.4s" />
            </circle>

            {/* Internal water flow line */}
            <line x1="50" y1="240" x2="50" y2="90" stroke="hsl(200 70% 82%)" strokeWidth="4" strokeLinecap="round" opacity="0.15">
              <animate attributeName="opacity" values="0.08;0.25;0.08" dur="1.5s" repeatCount="indefinite" />
            </line>
          </g>
        )}
      </svg>

      {/* Status label */}
      <div className={`px-2.5 py-0.5 mt-2 rounded-full text-xs font-bold ${
        isOn
          ? 'bg-success/20 text-success shadow-[0_0_8px_hsl(var(--success)/0.3)]'
          : 'bg-destructive/20 text-destructive'
      }`}>
        {label}: {isOn ? 'ON' : 'OFF'}
      </div>
    </div>
  );
};

export default IntakePump;
