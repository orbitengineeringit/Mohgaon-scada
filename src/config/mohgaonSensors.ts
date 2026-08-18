/**
 * MOHGAON SCADA - COMPLETE SENSOR CONFIGURATION
 * 
 * MQTT topic paths are loaded securely from the database at runtime.
 * Only topic keys (OHT1, OHT2, OHT3, INTAKE, WTP) are defined here.
 * 
 * OHT (×3): PT, Level, Flow In, Flow Out, Totalizer (computed)
 * Intake: PT1, PT2, CombinedPT, Level, Flow, Totalizer (computed), KW (not installed), Pump1, Pump2 (derived from PT)
 * WTP: PT1-PT4, CombinedPT1, CombinedPT2, LT_BW, LT_CW, Flow_IN, Flow_OUT, Totalizer (computed),
 *       PH_IN, TA_IN (Inlet analyzers - installed), PH, CL, TA, KW (not installed), Pump1-Pump4 (derived from PT)
 */

export type SectionType = 'oht' | 'intake' | 'wtp';

export interface MohgaonSensor {
  id: string;
  mqttKey: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  section: SectionType;
  subsection?: string;
  type: 'analog' | 'digital' | 'totalizer';
  instrumentType: 'pt' | 'lt' | 'flow' | 'totalizer' | 'valve' | 'kw' | 'pump' | 'ph' | 'turbidity' | 'chlorine' | 'fcv' | 'combined_pt' | 'temperature';
  notInstalled?: boolean;
  /** If this is a pump, which PT sensor ID drives its ON/OFF status */
  derivedFromPt?: string;
}

// ==================== OHT SENSORS ====================
// Each OHT has: PT, Level, Flow In, Flow Out, FCV, Totalizer (computed)
const createOhtSensors = (ohtNum: number): MohgaonSensor[] => {
  const prefix = `OHT${ohtNum}`;
  const sub = `OHT-${ohtNum}`;
  return [
    { id: `${prefix}-PT`, mqttKey: `${prefix}_PT`, label: 'Pressure (PT)', unit: 'Bar', min: 0, max: 10, section: 'oht', subsection: sub, type: 'analog', instrumentType: 'pt' },
    { id: `${prefix}-LT`, mqttKey: `${prefix}_LT`, label: 'Level (LT)', unit: '%', min: 0, max: 100, section: 'oht', subsection: sub, type: 'analog', instrumentType: 'lt' },
    { id: `${prefix}-Flow-IN`, mqttKey: `${prefix}_FLOW`, label: 'Flow Meter (Inlet)', unit: 'm³/hr', min: 0, max: 50, section: 'oht', subsection: sub, type: 'analog', instrumentType: 'flow' },
    { id: `${prefix}-Flow-OUT`, mqttKey: `${prefix}_FLOW_OUT`, label: 'Flow Meter (Outlet)', unit: 'm³/hr', min: 0, max: 50, section: 'oht', subsection: sub, type: 'analog', instrumentType: 'flow' },
    { id: `${prefix}-FCV`, mqttKey: `${prefix}_FCV`, label: 'Flow Control Valve', unit: '%', min: 0, max: 100, section: 'oht', subsection: sub, type: 'analog', instrumentType: 'fcv' },
    { id: `${prefix}-Totalizer`, mqttKey: `${prefix}_TOT`, label: 'Totalizer', unit: 'm³', min: 0, max: 999999, section: 'oht', subsection: sub, type: 'totalizer', instrumentType: 'totalizer' },
  ];
};

export const OHT1_SENSORS = createOhtSensors(1);
export const OHT2_SENSORS = createOhtSensors(2);
export const OHT3_SENSORS = createOhtSensors(3);
export const OHT4_SENSORS = createOhtSensors(4);
export const ALL_OHT_SENSORS = [...OHT1_SENSORS, ...OHT2_SENSORS, ...OHT3_SENSORS, ...OHT4_SENSORS];

// ==================== INTAKE SENSORS ====================
// PT1, PT2, CombinedPT, Level, Flow, Totalizer (computed), KW (not installed), 2 VT Pumps (derived from PT)
export const INTAKE_SENSORS: MohgaonSensor[] = [
  { id: 'INT-PT1', mqttKey: 'INTAKE_PT1', label: 'Pressure 1 (PT)', unit: 'Bar', min: 0, max: 10, section: 'intake', type: 'analog', instrumentType: 'pt' },
  { id: 'INT-PT2', mqttKey: 'INTAKE_PT2', label: 'Pressure 2 (PT)', unit: 'Bar', min: 0, max: 10, section: 'intake', type: 'analog', instrumentType: 'pt' },
  { id: 'INT-CombinedPT', mqttKey: 'INTAKE_PT3', label: 'Combined Pressure (P1+P2)', unit: 'Bar', min: 0, max: 10, section: 'intake', type: 'analog', instrumentType: 'combined_pt' },
  { id: 'INT-LT', mqttKey: 'INTAKE_LT', label: 'Level (LT)', unit: 'Meter', min: 0, max: 7, section: 'intake', type: 'analog', instrumentType: 'lt' },
  { id: 'INT-Flow', mqttKey: 'INTAKE_FLOW', label: 'Flow Meter', unit: 'm³/hr', min: 0, max: 200, section: 'intake', type: 'analog', instrumentType: 'flow' },
  { id: 'INT-Totalizer', mqttKey: 'INTAKE_TOT', label: 'Totalizer', unit: 'm³', min: 0, max: 999999, section: 'intake', type: 'totalizer', instrumentType: 'totalizer' },
  { id: 'INT-KW', mqttKey: 'KW', label: 'Energy Meter', unit: 'kW', min: 0, max: 100, section: 'intake', type: 'analog', instrumentType: 'kw', notInstalled: true },
  { id: 'INT-Pump1', mqttKey: '', label: 'VT Pump 1', unit: '', min: 0, max: 1, section: 'intake', type: 'digital', instrumentType: 'pump', derivedFromPt: 'INT-PT1' },
  { id: 'INT-Pump2', mqttKey: '', label: 'VT Pump 2', unit: '', min: 0, max: 1, section: 'intake', type: 'digital', instrumentType: 'pump', derivedFromPt: 'INT-PT2' },
];

// ==================== WTP SENSORS ====================
// mqttKey values match exact PLC r_data tag names published by RTU (Device ID: 02500225110500007666)
export const WTP_SENSORS: MohgaonSensor[] = [
  // Levels
  { id: 'WTP-LT-BW', mqttKey: 'BW_LT', label: 'Backwash Level', unit: '%', min: 0, max: 100, section: 'wtp', type: 'analog', instrumentType: 'lt' },
  { id: 'WTP-LT-CW', mqttKey: 'CWR_LT', label: 'Clear Water Level', unit: '%', min: 0, max: 100, section: 'wtp', type: 'analog', instrumentType: 'lt' },
  // Pressures — PT_1 & PT_2: HT Pump pressures; PT_3: Combined Header Pressure (direct PLC tag, NOT a VT pump)
  { id: 'WTP-PT1', mqttKey: 'PT_1', label: 'HT Pump 1 Pressure', unit: 'Bar', min: 0, max: 10, section: 'wtp', type: 'analog', instrumentType: 'pt' },
  { id: 'WTP-PT2', mqttKey: 'PT_2', label: 'HT Pump 2 Pressure', unit: 'Bar', min: 0, max: 10, section: 'wtp', type: 'analog', instrumentType: 'pt' },
  // Combined Header Pressure — PLC tag PT_3 (installed, direct field reading — NOT a pump pressure)
  { id: 'WTP-HeaderPT', mqttKey: 'PT_3', label: 'Combined Header Pressure', unit: 'Bar', min: 0, max: 10, section: 'wtp', type: 'analog', instrumentType: 'combined_pt' },
  // HT Pump 3/4 — not installed at Mohgaon site
  { id: 'WTP-CombinedPT1', mqttKey: 'CWR_PT3_EXCLUDED', label: 'Combined Pressure (P1+P2)', unit: 'Bar', min: 0, max: 10, section: 'wtp', type: 'analog', instrumentType: 'combined_pt', notInstalled: true },
  { id: 'WTP-PT3', mqttKey: 'CWR_PT_04', label: 'HT Pump 3 PT (N/I)', unit: 'Bar', min: 0, max: 10, section: 'wtp', type: 'analog', instrumentType: 'pt', notInstalled: true },
  { id: 'WTP-PT4', mqttKey: 'CWR_PT_05', label: 'HT Pump 4 PT (N/I)', unit: 'Bar', min: 0, max: 10, section: 'wtp', type: 'analog', instrumentType: 'pt', notInstalled: true },
  { id: 'WTP-CombinedPT2', mqttKey: 'CWR_PT_06', label: 'Combined Pressure (P3+P4)', unit: 'Bar', min: 0, max: 10, section: 'wtp', type: 'analog', instrumentType: 'combined_pt', notInstalled: true },
  // Raw water / inlet — canonical PLC tags: RAW_EFM_FLOW = Inlet Flow Meter, RAW_EFM = Inlet Totalizer
  { id: 'WTP-Flow-IN', mqttKey: 'RAW_EFM_FLOW', label: 'Inlet Flow Meter', unit: 'm³/hr', min: 0, max: 200, section: 'wtp', subsection: 'raw-water', type: 'analog', instrumentType: 'flow' },
  { id: 'WTP-Totalizer-IN', mqttKey: 'RAW_EFM', label: 'Inlet Totalizer', unit: 'm³', min: 0, max: 999999, section: 'wtp', subsection: 'raw-water', type: 'totalizer', instrumentType: 'totalizer' },
  // Outlet — canonical PLC tags: CLR_EFM_FLOW = Outlet Flow Meter, CLR_EFM = Outlet Totalizer
  { id: 'WTP-Flow-OUT', mqttKey: 'CLR_EFM_FLOW', label: 'Outlet Flow Meter', unit: 'm³/hr', min: 0, max: 200, section: 'wtp', subsection: 'outlet', type: 'analog', instrumentType: 'flow' },
  { id: 'WTP-Totalizer-OUT', mqttKey: 'CLR_EFM', label: 'Outlet Totalizer', unit: 'm³', min: 0, max: 999999, section: 'wtp', subsection: 'outlet', type: 'totalizer', instrumentType: 'totalizer' },
  // Inlet analyzers (installed) — RW_PH = Inlet pH, RW_TB = Inlet Turbidity
  { id: 'WTP-PH-IN', mqttKey: 'RW_PH', label: 'Inlet pH', unit: 'pH', min: 0, max: 14, section: 'wtp', subsection: 'raw-water', type: 'analog', instrumentType: 'ph' },
  { id: 'WTP-TA-IN', mqttKey: 'RW_TB', label: 'Inlet Turbidity', unit: 'NTU', min: 0, max: 100, section: 'wtp', subsection: 'raw-water', type: 'analog', instrumentType: 'turbidity' },
  // Outlet analyzers — CWR_TB = Outlet Turbidity
  { id: 'WTP-PH', mqttKey: 'CWR_PH', label: 'Outlet pH', unit: 'pH', min: 0, max: 14, section: 'wtp', subsection: 'outlet', type: 'analog', instrumentType: 'ph' },
  { id: 'WTP-CL', mqttKey: 'CWR_CL', label: 'Outlet Chlorine', unit: 'PPM', min: 0, max: 20, section: 'wtp', subsection: 'outlet', type: 'analog', instrumentType: 'chlorine' },
  { id: 'WTP-TA', mqttKey: 'CWR_TB', label: 'Outlet Turbidity', unit: 'NTU', min: 0, max: 100, section: 'wtp', subsection: 'outlet', type: 'analog', instrumentType: 'turbidity' },
  // Temperature — CWR_TEM = Outlet Temperature
  { id: 'WTP-TEM', mqttKey: 'CWR_TEM', label: 'Outlet Temperature', unit: '°C', min: 0, max: 60, section: 'wtp', subsection: 'outlet', type: 'analog', instrumentType: 'temperature' },
  // Energy Meter (MFM) - Not Installed
  { id: 'WTP-KW', mqttKey: 'KW', label: 'Energy Meter (MFM)', unit: 'kW', min: 0, max: 100, section: 'wtp', type: 'analog', instrumentType: 'kw', notInstalled: true },
  // HT Pumps — Pump 1 & 2 derived from PT_1/PT_2 status; Pump 3 & 4 not installed
  { id: 'WTP-Pump1', mqttKey: '', label: 'HT Pump 1', unit: '', min: 0, max: 1, section: 'wtp', type: 'digital', instrumentType: 'pump', derivedFromPt: 'WTP-PT1' },
  { id: 'WTP-Pump2', mqttKey: '', label: 'HT Pump 2', unit: '', min: 0, max: 1, section: 'wtp', type: 'digital', instrumentType: 'pump', derivedFromPt: 'WTP-PT2' },
  { id: 'WTP-Pump3', mqttKey: '', label: 'HT Pump 3 (N/I)', unit: '', min: 0, max: 1, section: 'wtp', type: 'digital', instrumentType: 'pump', derivedFromPt: 'WTP-PT3', notInstalled: true },
  { id: 'WTP-Pump4', mqttKey: '', label: 'HT Pump 4 (N/I)', unit: '', min: 0, max: 1, section: 'wtp', type: 'digital', instrumentType: 'pump', derivedFromPt: 'WTP-PT4', notInstalled: true },
];

// ==================== ALL SENSORS ====================
export const ALL_SENSORS = [...ALL_OHT_SENSORS, ...INTAKE_SENSORS, ...WTP_SENSORS];

// ==================== PT → PUMP DERIVATION MAP ====================
// When PT > 0, corresponding pump is ON
export const PT_TO_PUMP_MAP: Record<string, string> = {};
ALL_SENSORS.filter(s => s.derivedFromPt).forEach(pump => {
  PT_TO_PUMP_MAP[pump.derivedFromPt!] = pump.id;
});

// ==================== MQTT TOPICS ====================
export const MQTT_TOPIC_KEYS = ['OHT1','OHT2','OHT3','OHT4','INTAKE','WTP'] as const;

const getEnv = (key: string): string | undefined => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
};

// Default topics for Mohgaon plant per station Topic Map
export const DEFAULT_MQTT_TOPICS: Record<string, string> = {
  INTAKE: getEnv('VITE_MQTT_TOPIC_INTAKE') || getEnv('NEXT_PUBLIC_MQTT_TOPIC_INTAKE') || 'OES/M7g4/Nk3a/8672x4Af',
  WTP:    getEnv('VITE_MQTT_TOPIC_WTP') || getEnv('NEXT_PUBLIC_MQTT_TOPIC_WTP') || 'mohgaon/wtp',
  OHT1:   getEnv('VITE_MQTT_TOPIC_OHT1') || getEnv('NEXT_PUBLIC_MQTT_TOPIC_OHT1') || 'OES/M7g4/Ov1h/8672x4Af',
  OHT2:   getEnv('VITE_MQTT_TOPIC_OHT2') || getEnv('NEXT_PUBLIC_MQTT_TOPIC_OHT2') || 'OES/M7g4/Ov2h/8672x4Af',
  OHT3:   getEnv('VITE_MQTT_TOPIC_OHT3') || getEnv('NEXT_PUBLIC_MQTT_TOPIC_OHT3') || 'OES/M7g4/Ov3h/8672x4Af',
  OHT4:   getEnv('VITE_MQTT_TOPIC_OHT4') || getEnv('NEXT_PUBLIC_MQTT_TOPIC_OHT4') || 'OES/M7g4/Ov4h/8672x4Af',
};

// Mutable map — initialized with station defaults
export const MQTT_TOPICS: Record<string, string> = { ...DEFAULT_MQTT_TOPICS };

// Built dynamically when topics are loaded from DB or Vault
export const TOPIC_TO_SECTION: Record<string, { section: SectionType; subsection?: string }> = {};

export const ALL_MQTT_TOPICS: string[] = [];

/** Called by MqttContext after loading topics from database or Vault */
export const setTopicsFromDb = (topics: Record<string, string>) => {
  if (!topics) return;
  for (const [key, val] of Object.entries(topics)) {
    if (val) MQTT_TOPICS[key] = val;
    else if (DEFAULT_MQTT_TOPICS[key]) MQTT_TOPICS[key] = DEFAULT_MQTT_TOPICS[key];
  }
  for (const k in TOPIC_TO_SECTION) delete TOPIC_TO_SECTION[k];
  const sectionMap: Record<string, { section: SectionType; subsection?: string }> = {
    OHT1: { section: 'oht', subsection: 'OHT-1' },
    OHT2: { section: 'oht', subsection: 'OHT-2' },
    OHT3: { section: 'oht', subsection: 'OHT-3' },
    OHT4: { section: 'oht', subsection: 'OHT-4' },
    INTAKE: { section: 'intake' },
    WTP: { section: 'wtp' },
  };
  for (const [key, topic] of Object.entries(MQTT_TOPICS)) {
    if (topic && sectionMap[key]) {
      TOPIC_TO_SECTION[topic] = sectionMap[key];
    }
  }
  ALL_MQTT_TOPICS.length = 0;
  ALL_MQTT_TOPICS.push(...Object.values(MQTT_TOPICS).filter(Boolean));
};

// Initialize TOPIC_TO_SECTION immediately with default topics
setTopicsFromDb(DEFAULT_MQTT_TOPICS);

// Get sensors for a specific subsection
export const getSensorsForSubsection = (subsection: string): MohgaonSensor[] => {
  return ALL_SENSORS.filter(s => s.subsection === subsection);
};

// Get sensors for a section
export const getSensorsForSection = (section: SectionType): MohgaonSensor[] => {
  return ALL_SENSORS.filter(s => s.section === section);
};

// Get analog sensors only (for trends)
export const getAnalogSensors = (section: SectionType, subsection?: string): MohgaonSensor[] => {
  return ALL_SENSORS.filter(s => 
    s.section === section && 
    s.type === 'analog' && 
    (!subsection || s.subsection === subsection)
  );
};

// Get pump sensors
export const getPumpSensors = (section: SectionType): MohgaonSensor[] => {
  return ALL_SENSORS.filter(s => s.section === section && s.instrumentType === 'pump');
};

// Valid MQTT keys per section (supports canonical names + legacy aliases)
export const VALID_OHT_KEYS = [
  'OHT1_LT', 'OHT1_FLOW', 'OHT1_FLOW_OUT', 'OHT1_TOT', 'OHT1_PT', 'OHT1_FCV',
  'OHT2_LT', 'OHT2_FLOW', 'OHT2_FLOW_OUT', 'OHT2_TOT', 'OHT2_PT', 'OHT2_FCV',
  'OHT3_LT', 'OHT3_FLOW', 'OHT3_FLOW_OUT', 'OHT3_TOT', 'OHT3_PT', 'OHT3_FCV',
  'OHT4_LT', 'OHT4_FLOW', 'OHT4_FLOW_OUT', 'OHT4_TOT', 'OHT4_PT', 'OHT4_FCV',
  'PT', 'PT_01', 'LEVEL', 'Level', 'FLOW', 'Flow', 'FLOW_IN', 'FLOW_OUT', 'FCV', 'TOTALIZER'
];

export const VALID_INTAKE_KEYS = [
  'INTAKE_LT', 'INTAKE_FLOW', 'INTAKE_TOT', 'INTAKE_PT1', 'INTAKE_PT2', 'INTAKE_PT3',
  'PT', 'PT_01', 'PT_02', 'PT_03', 'PT_COM', 'LEVEL', 'Level', 'FLOW', 'Flow', 'TOTALIZER', 'KW'
];

export const VALID_WTP_KEYS = [
  // === Canonical PLC r_data tag names (primary — exact RTU output) ===
  'BW_LT', 'CWR_LT',
  'PT_1', 'PT_2', 'PT_3',
  'RW_PH', 'RW_TB',
  'RAW_EFM_FLOW', 'RAW_EFM',
  'CWR_PH', 'CWR_CL', 'CWR_TB', 'CWR_TEM',
  'CLR_EFM', 'CLR_EFM_FLOW',
  // === Legacy/alias keys (backward compatibility with older firmware or manual tests) ===
  'RAW_PH', 'RAW_TR', 'FLOWMETER', 'TOTALIZER',
  'CWR_TR', 'CWR_FLOW', 'CWR_TOT', 'CWR_PT1', 'CWR_PT2',
  'CW_TR', 'CWR_LEVEL', 'BW_LEVEL',
  'PT', 'PT_01', 'PT_02', 'PT_03', 'CWR_PT_04', 'CWR_PT_05', 'CWR_PT_06',
  'FLOW', 'Flow', 'FLOW_IN', 'FLOW_OUT', 'PH', 'CL', 'TR', 'CW_PH', 'CW_CL', 'TOTALIZER_IN', 'TOTALIZER_OUT', 'KW'
];
