import React from 'react';

interface WtpPumpProps {
  isOn: boolean;
  label: string;
  size?: number;
}

/**
 * HT (Horizontal) Centrifugal Pump - with realistic rotor blades and rear fan grill
 */
const WtpPump: React.FC<WtpPumpProps> = ({ isOn, label, size = 120 }) => {
  const body = 'hsl(210 70% 42%)';
  const light = 'hsl(210 60% 52%)';
  const dark = 'hsl(210 75% 30%)';
  const veryDark = 'hsl(210 80% 22%)';

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size * 1.5} height={size * 1.05} viewBox="0 0 155 105" className="drop-shadow-md">

        {/* ═══ Outlet Pipe (top) ═══ */}
        <rect x="24" y="0" width="14" height="16" rx="2" fill={body} stroke={dark} strokeWidth="1" />
        <rect x="19" y="0" width="24" height="5" rx="1.5" fill={light} stroke={dark} strokeWidth="0.8" />
        <circle cx="23" cy="2.5" r="1.5" fill={veryDark} />
        <circle cx="39" cy="2.5" r="1.5" fill={veryDark} />

        {/* ═══ Volute Casing ═══ */}
        <path d="M8 50 C8 22 18 14 32 14 C50 14 58 26 58 50 C58 72 46 76 32 76 C14 76 8 68 8 50 Z"
          fill={body} stroke={dark} strokeWidth="1.5" />
        <circle cx="33" cy="46" r="18" fill={light} stroke={dark} strokeWidth="0.8" opacity="0.6" />
        <path d="M33 28 C45 28 51 36 51 46 C51 56 45 62 33 62" fill="none" stroke={dark} strokeWidth="0.5" opacity="0.4" />

        {/* ═══ Impeller (realistic curved blades) ═══ */}
        <g className={isOn ? 'animate-spin-slow' : ''} style={{ transformOrigin: '33px 46px' }}>
          {/* 6 curved impeller blades */}
          <path d="M33 46 C31 42 28 36 25 32" fill="none" stroke="hsl(0 0% 85%)" strokeWidth="3" strokeLinecap="round" />
          <path d="M33 46 C35 42 38 36 41 32" fill="none" stroke="hsl(0 0% 85%)" strokeWidth="3" strokeLinecap="round" />
          <path d="M33 46 C31 50 28 56 25 60" fill="none" stroke="hsl(0 0% 85%)" strokeWidth="3" strokeLinecap="round" />
          <path d="M33 46 C35 50 38 56 41 60" fill="none" stroke="hsl(0 0% 85%)" strokeWidth="3" strokeLinecap="round" />
          <path d="M33 46 C29 45 23 44 19 44" fill="none" stroke="hsl(0 0% 85%)" strokeWidth="3" strokeLinecap="round" />
          <path d="M33 46 C37 47 43 48 47 48" fill="none" stroke="hsl(0 0% 85%)" strokeWidth="3" strokeLinecap="round" />
          {/* Hub */}
          <circle cx="33" cy="46" r="5" fill="hsl(0 0% 82%)" stroke="hsl(0 0% 65%)" strokeWidth="1" />
          <circle cx="33" cy="46" r="2" fill="hsl(0 0% 70%)" />
        </g>

        {/* ═══ Inlet Pipe (left) ═══ */}
        <rect x="0" y="40" width="10" height="13" rx="2" fill={body} stroke={dark} strokeWidth="1" />
        <ellipse cx="2" cy="46.5" rx="3" ry="10" fill={light} stroke={dark} strokeWidth="0.8" />
        <circle cx="2" cy="39" r="1.2" fill={veryDark} />
        <circle cx="2" cy="54" r="1.2" fill={veryDark} />

        {/* ═══ Volute bolts ═══ */}
        <circle cx="33" cy="46" r="12" fill="none" stroke={dark} strokeWidth="1" opacity="0.5" />
        {[0, 60, 120, 180, 240, 300].map(angle => {
          const r = 21;
          const x = 33 + r * Math.cos((angle * Math.PI) / 180);
          const y = 46 + r * Math.sin((angle * Math.PI) / 180);
          return <circle key={angle} cx={x} cy={y} r="1.5" fill={veryDark} />;
        })}

        {/* ═══ Shaft / Coupling Guard ═══ */}
        <rect x="58" y="41" width="14" height="11" rx="2"
          fill="hsl(220 10% 60%)" stroke={dark} strokeWidth="0.8" />
        <rect x="60" y="39" width="10" height="15" rx="3"
          fill="none" stroke={dark} strokeWidth="0.6" strokeDasharray="2 1.5" />

        {/* ═══ Motor Body ═══ */}
        <rect x="72" y="26" width="55" height="40" rx="4"
          fill={body} stroke={dark} strokeWidth="1.5" />
        {/* Motor cooling fins */}
        {[30, 34, 38, 42, 46, 50, 54, 58, 62].map(y => (
          <line key={y} x1="76" y1={y} x2="123" y2={y}
            stroke={dark} strokeWidth="0.5" opacity="0.4" />
        ))}
        {/* Motor nameplate */}
        <rect x="82" y="32" width="22" height="11" rx="1"
          fill="hsl(220 10% 70%)" stroke={dark} strokeWidth="0.4" />
        <line x1="85" y1="35" x2="101" y2="35" stroke={dark} strokeWidth="0.3" opacity="0.5" />
        <line x1="85" y1="38" x2="97" y2="38" stroke={dark} strokeWidth="0.3" opacity="0.5" />
        {/* Motor terminal box */}
        <rect x="104" y="24" width="16" height="12" rx="2"
          fill={dark} stroke={veryDark} strokeWidth="0.8" />
        <circle cx="109" cy="29" r="2.2" fill="hsl(220 10% 45%)" />
        <circle cx="116" cy="29" r="2.2" fill="hsl(220 10% 45%)" />

        {/* Status LED */}
        <circle cx="118" cy="46" r="3.5"
          fill={isOn ? '#22c55e' : '#ef4444'}
          className={isOn ? 'animate-pulse' : ''} />

        {/* Motor end cap */}
        <rect x="127" y="30" width="7" height="32" rx="2"
          fill={light} stroke={dark} strokeWidth="0.8" />

        {/* ═══ Rear Fan Guard / Grill ═══ */}
        <rect x="134" y="28" width="8" height="36" rx="3"
          fill="none" stroke={dark} strokeWidth="1" />
        {/* Grill horizontal bars */}
        {[32, 36, 40, 44, 48, 52, 56, 60].map(y => (
          <line key={`fg${y}`} x1="135" y1={y} x2="141" y2={y}
            stroke={dark} strokeWidth="0.6" opacity="0.5" />
        ))}
        {/* Fan guard circle */}
        <circle cx="138" cy="46" r="12" fill="none" stroke={dark} strokeWidth="0.8" opacity="0.4" />
        <circle cx="138" cy="46" r="8" fill="none" stroke={dark} strokeWidth="0.5" opacity="0.3" />
        
        {/* Fan blades visible through guard */}
        <g className={isOn ? 'animate-spin-slow' : ''} style={{ transformOrigin: '138px 46px' }}>
          <line x1="138" y1="46" x2="138" y2="36" stroke={dark} strokeWidth="2" strokeLinecap="round" opacity="0.7" />
          <line x1="138" y1="46" x2="129" y2="51" stroke={dark} strokeWidth="2" strokeLinecap="round" opacity="0.7" />
          <line x1="138" y1="46" x2="147" y2="51" stroke={dark} strokeWidth="2" strokeLinecap="round" opacity="0.7" />
          <line x1="138" y1="46" x2="131" y2="39" stroke={dark} strokeWidth="2" strokeLinecap="round" opacity="0.7" />
          <line x1="138" y1="46" x2="145" y2="39" stroke={dark} strokeWidth="2" strokeLinecap="round" opacity="0.7" />
        </g>
        <circle cx="138" cy="46" r="2.5" fill={light} stroke={dark} strokeWidth="0.5" />

        {/* ═══ Water Flow Animations (only when ON) ═══ */}
        {isOn && (
          <g>
            {/* --- Water entering from LEFT inlet pipe --- */}
            <circle r="1.5" fill="hsl(199 89% 55%)" opacity="0.6">
              <animate attributeName="cx" values="-2;3;8" dur="0.8s" repeatCount="indefinite" />
              <animate attributeName="cy" values="46;46.5;46" dur="0.8s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.7;0.4;0" dur="0.8s" repeatCount="indefinite" />
            </circle>
            <circle r="1" fill="hsl(199 89% 60%)" opacity="0.5">
              <animate attributeName="cx" values="-2;4;10" dur="0.7s" repeatCount="indefinite" begin="0.3s" />
              <animate attributeName="cy" values="47;46;47" dur="0.7s" repeatCount="indefinite" begin="0.3s" />
              <animate attributeName="opacity" values="0.6;0.3;0" dur="0.7s" repeatCount="indefinite" begin="0.3s" />
            </circle>

            {/* --- Water swirling inside the volute casing --- */}
            <circle r="1.2" fill="hsl(199 89% 55%)" opacity="0.3">
              <animate attributeName="cx" values="20;33;46;33;20" dur="1.5s" repeatCount="indefinite" />
              <animate attributeName="cy" values="46;32;46;60;46" dur="1.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.35;0.2;0.35;0.2;0.35" dur="1.5s" repeatCount="indefinite" />
            </circle>
            <circle r="1" fill="hsl(199 89% 60%)" opacity="0.25">
              <animate attributeName="cx" values="46;33;20;33;46" dur="1.5s" repeatCount="indefinite" begin="0.5s" />
              <animate attributeName="cy" values="46;60;46;32;46" dur="1.5s" repeatCount="indefinite" begin="0.5s" />
              <animate attributeName="opacity" values="0.3;0.15;0.3;0.15;0.3" dur="1.5s" repeatCount="indefinite" begin="0.5s" />
            </circle>

            {/* --- Water shooting UP from the outlet pipe (top) --- */}
            <circle r="2" fill="hsl(199 89% 55%)" opacity="0.7">
              <animate attributeName="cx" values="31;30;32" dur="1s" repeatCount="indefinite" />
              <animate attributeName="cy" values="14;6;-4" dur="1s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8;0.4;0" dur="1s" repeatCount="indefinite" />
              <animate attributeName="r" values="2;2.5;1" dur="1s" repeatCount="indefinite" />
            </circle>
            <circle r="1.5" fill="hsl(199 89% 60%)" opacity="0.6">
              <animate attributeName="cx" values="30;32;29" dur="0.8s" repeatCount="indefinite" begin="0.35s" />
              <animate attributeName="cy" values="14;4;-6" dur="0.8s" repeatCount="indefinite" begin="0.35s" />
              <animate attributeName="opacity" values="0.6;0.3;0" dur="0.8s" repeatCount="indefinite" begin="0.35s" />
            </circle>
            <circle r="1" fill="hsl(199 89% 65%)" opacity="0.5">
              <animate attributeName="cx" values="32;31;33" dur="1.2s" repeatCount="indefinite" begin="0.6s" />
              <animate attributeName="cy" values="14;2;-8" dur="1.2s" repeatCount="indefinite" begin="0.6s" />
              <animate attributeName="opacity" values="0.5;0.2;0" dur="1.2s" repeatCount="indefinite" begin="0.6s" />
            </circle>

            {/* --- Spray mist at the outlet --- */}
            <circle cx="31" cy="0" r="4" fill="hsl(199 89% 55%)" opacity="0.1">
              <animate attributeName="r" values="3;7;3" dur="1.2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.15;0.03;0.15" dur="1.2s" repeatCount="indefinite" />
            </circle>

            {/* --- Subtle glow inside volute showing water presence --- */}
            <circle cx="33" cy="46" r="16" fill="hsl(199 89% 50%)" opacity="0.06">
              <animate attributeName="opacity" values="0.04;0.1;0.04" dur="2s" repeatCount="indefinite" />
            </circle>
          </g>
        )}

        {/* ═══ Base ═══ */}
        <rect x="5" y="76" width="55" height="5" rx="1" fill={dark} stroke={veryDark} strokeWidth="0.5" />
        <rect x="70" y="66" width="58" height="5" rx="1" fill={dark} stroke={veryDark} strokeWidth="0.5" />
        <rect x="2" y="81" width="145" height="5" rx="1"
          fill="hsl(220 10% 50%)" stroke={dark} strokeWidth="0.5" />
        {[14, 44, 84, 126].map(x => (
          <circle key={x} cx={x} cy="83.5" r="2.2" fill={veryDark} stroke={veryDark} strokeWidth="0.3" />
        ))}
        <line x1="0" y1="87" x2="155" y2="87" stroke="hsl(var(--border))" strokeWidth="1" />
      </svg>

      {/* Status label */}
      <div className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
        isOn
          ? 'bg-success/20 text-success shadow-[0_0_8px_hsl(var(--success)/0.3)]'
          : 'bg-destructive/20 text-destructive'
      }`}>
        {label}: {isOn ? 'ON' : 'OFF'}
      </div>
    </div>
  );
};

export default WtpPump;
