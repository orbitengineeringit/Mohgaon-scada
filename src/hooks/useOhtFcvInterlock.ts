import { useEffect, useState, useMemo } from 'react';

/**
 * Historical telemetry sample used to track physical water accumulation in OHT tanks.
 */
interface TelemetrySample {
  time: number;
  level: number;
  tot: number;
}

// Module-level history cache indexed by tank key (e.g. 'oht-1', 'oht-2', 'oht-3', 'oht-4').
// Preserves state across component re-mounts (e.g. toggling between Cards and Process view)
// and prevents artificial wait-times or glitches.
const tankHistoryMap = new Map<string, TelemetrySample[]>();

export interface UseOhtFcvInterlockProps {
  tankKey: string;     // Unique tank identifier (e.g. 'oht-1', 'oht-2', 'oht-3', 'oht-4')
  flowVal: number;     // Inlet flow meter reading in m³/h
  ptVal: number;       // Inlet pressure transmitter reading in Bar
  ltVal: number;       // Tank level percentage (0 - 100%)
  totVal: number;      // Totalizer cumulative volume in m³
}

export interface OhtFcvInterlockResult {
  hasFlow: boolean;              // Flow meter is actively reading (> 0.2 m³/h)
  isPressurized: boolean;        // Pressure transmitter meets threshold (>= 1.5 Bar)
  isLevelRising: boolean;        // Tank level is trending upwards (+0.02% or higher over window)
  isTotIncreasing: boolean;      // Cumulative totalizer is advancing (+0.01 m³ or higher over window)
  isWaterAccumulating: boolean;  // Either Level is rising OR Totalizer is advancing
  isConfirmedInflow: boolean;    // Triple-Interlock confirmed: Flow + Pressure + Water Accumulation
  fcvOpen: boolean;              // Final valve operational state (OPEN / CLOSED)
}

/**
 * Industrial SCADA Triple-Interlock Verification Hook for Automated Flow Control Valves (FCV).
 *
 * Implements a 3-Point Validation rule:
 * 1. Flow Interlock: Fluid velocity is detected in the inlet line (Flow > 0.2 m³/h).
 * 2. Pressure Interlock: Line delivery head is active under pump pressure (PT >= 1.5 Bar).
 * 3. Accumulation Interlock: Water is physically entering and accumulating in the reservoir
 *    (Tank Level is rising OR Totalizer is incrementing).
 *
 * Rejects trapped static pressure (e.g. 10.1 Bar with zero flow), sensor drift, and dry lines.
 */
export const useOhtFcvInterlock = ({
  tankKey,
  flowVal,
  ptVal,
  ltVal,
  totVal,
}: UseOhtFcvInterlockProps): OhtFcvInterlockResult => {
  const [isLevelRising, setIsLevelRising] = useState(false);
  const [isTotIncreasing, setIsTotIncreasing] = useState(false);
  const [isWarmedUp, setIsWarmedUp] = useState(false);

  // 1. Flow Interlock
  const hasFlow = flowVal > 0.2;

  // 2. Pressure Interlock
  const isPressurized = ptVal >= 1.5;

  useEffect(() => {
    // Guard against uninitialized initial state (0 before first telemetry arrives)
    if (ltVal <= 0 && totVal <= 0) return;

    const now = Date.now();
    const sessionKey = `mohgaon_fcv_base_${tankKey}`;

    // Load or initialize history
    let history = tankHistoryMap.get(tankKey);
    if (!history) {
      // Try restoring from sessionStorage for instant responsiveness after page reloads
      try {
        const cached = sessionStorage.getItem(sessionKey);
        if (cached) {
          const parsed = JSON.parse(cached) as TelemetrySample[];
          if (Array.isArray(parsed) && parsed.length > 0 && (now - parsed[parsed.length - 1].time) < 300000) {
            history = parsed;
          }
        }
      } catch {
        // Ignore storage parsing errors
      }
      history = history || [];
    }

    // Append new sample if separated by at least 3 seconds or values changed
    const lastSample = history[history.length - 1];
    if (!lastSample || (now - lastSample.time >= 3000 && (lastSample.level !== ltVal || lastSample.tot !== totVal))) {
      history.push({ time: now, level: ltVal, tot: totVal });
    }

    // Maintain a 3-minute sliding window (180,000 ms), max 30 samples
    const windowMs = 3 * 60 * 1000;
    const pruned = history.filter(s => now - s.time <= windowMs).slice(-30);
    tankHistoryMap.set(tankKey, pruned);

    try {
      sessionStorage.setItem(sessionKey, JSON.stringify(pruned));
    } catch {
      // Ignore storage write errors
    }

    if (pruned.length >= 2) {
      setIsWarmedUp(true);
      const oldest = pruned[0];
      const deltaLevel = ltVal - oldest.level;
      const deltaTot = totVal - oldest.tot;

      // Tank level rise: current level is at least 0.02% higher than oldest sample in window
      setIsLevelRising(deltaLevel >= 0.02);

      // Totalizer rise: cumulative totalizer is at least 0.01 m³ higher than oldest sample
      setIsTotIncreasing(deltaTot >= 0.01);
    }
  }, [tankKey, ltVal, totVal]);

  // 3. Water Accumulation Check
  // - Verified when level is physically trending upwards OR totalizer is actively ticking up
  // - During cold startup (first 10-15s before 2nd packet), if flow is strong (> 1.0 m³/h) and pressurized,
  //   allow seamless warm-up so operators don't see an artificial delay.
  const isWaterAccumulating = isLevelRising || isTotIncreasing || (!isWarmedUp && hasFlow && isPressurized && flowVal > 1.0);

  // Triple-Interlock Confirmation:
  // All three physical checks must be valid simultaneously.
  // When flow stops (flowVal <= 0.2), hasFlow becomes false INSTANTLY, shutting off FCV immediately.
  const isConfirmedInflow = hasFlow && isPressurized && isWaterAccumulating;
  const fcvOpen = isConfirmedInflow;

  return {
    hasFlow,
    isPressurized,
    isLevelRising,
    isTotIncreasing,
    isWaterAccumulating,
    isConfirmedInflow,
    fcvOpen,
  };
};

export default useOhtFcvInterlock;
