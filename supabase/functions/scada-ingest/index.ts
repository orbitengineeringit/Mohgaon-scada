/// <reference path="./deno.d.ts" />
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import mqtt from "npm:mqtt@5.10.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-key",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

type Section = "intake" | "wtp" | "oht";
type Sensor = {
  id: string;
  mqttKey: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  section: Section;
  subsection?: string;
  instrumentType: "pt" | "lt" | "flow" | "totalizer" | "kw" | "ph" | "turbidity" | "chlorine" | "pump" | "combined_pt" | "fcv" | "temperature";
};
type MqttConfig = {
  broker_url: string | null;
  client_id: string | null;
  intake_topic: string | null;
  wtp_topic: string | null;
  oht_topic: string | null;
  oht_topic_2: string | null;
  oht_topic_3: string | null;
  oht_topic_4: string | null;
};
type ParsedMessage = {
  topic: string;
  payload: Record<string, string | number>;
  section: Section | "unknown";
  subsection?: string;
  timestamp: Date;
};

function normalizeSensorValue(sensor: Sensor, value: number): number | null {
  if (!Number.isFinite(value)) return null;
  if (value >= sensor.min && value <= sensor.max) return value;

  const isPercentagePosition = sensor.unit === "%" &&
    (sensor.instrumentType === "lt" || sensor.instrumentType === "fcv");
  if (isPercentagePosition && value >= sensor.min - 2 && value <= sensor.max + 2) {
    return Math.min(sensor.max, Math.max(sensor.min, value));
  }

  return null;
}

const DEFAULT_TOPICS = {
  INTAKE: "mohgaon/intake",
  WTP: "mohgaon/wtp",
  OHT1: "OES/M7g4/Ov1h/8672x4Af",
  OHT2: "OES/M7g4/Ov2h/8672x4Af",
  OHT3: "mohgaon/oht-3",
  OHT4: "OES/M7g4/Ov4h/8672x4Af",
};

const ohtSensors = (n: number): Sensor[] => {
  const prefix = `OHT${n}`;
  const subsection = `OHT-${n}`;
  const isLiveOht3 = n === 3;
  return [
    { id: `${prefix}-PT`, mqttKey: isLiveOht3 ? "PT" : "PT_01", label: "Pressure (PT)", unit: "Bar", min: 0, max: isLiveOht3 ? 16 : 10, section: "oht", subsection, instrumentType: "pt" },
    { id: `${prefix}-LT`, mqttKey: isLiveOht3 ? "LT" : "LEVEL", label: "Level (LT)", unit: "%", min: 0, max: 100, section: "oht", subsection, instrumentType: "lt" },
    { id: `${prefix}-Flow-IN`, mqttKey: isLiveOht3 ? "EFM_FLOW" : "FLOW", label: "Flow Meter (Inlet)", unit: "m³/hr", min: 0, max: 50, section: "oht", subsection, instrumentType: "flow" },
    { id: `${prefix}-Totalizer`, mqttKey: isLiveOht3 ? "EFM_1_2" : "TOTALIZER", label: isLiveOht3 ? "EFM 1 Totalizer 2" : "Totalizer", unit: "m³", min: isLiveOht3 ? -999999 : 0, max: 999999, section: "oht", subsection, instrumentType: "totalizer" },
  ];
};

const SENSORS: Sensor[] = [
  // === INTAKE sensors (logged first) — Mohgaon plant: RTU Device ID: 02500225110500008735 ===
  // mqttKey values match exact PLC r_data tag names from mohgaon/intake topic
  { id: "INT-PT1", mqttKey: "PT_1", label: "Pressure 1 (PT)", unit: "Bar", min: 0, max: 10, section: "intake", instrumentType: "pt" },
  { id: "INT-PT2", mqttKey: "PT_2", label: "Pressure 2 (PT)", unit: "Bar", min: 0, max: 10, section: "intake", instrumentType: "pt" },
  { id: "INT-CombinedPT", mqttKey: "PT_3", label: "Main Header Pressure", unit: "Bar", min: 0, max: 10, section: "intake", instrumentType: "combined_pt" },
  { id: "INT-LT", mqttKey: "RLT", label: "Level (LT)", unit: "%", min: 0, max: 100, section: "intake", instrumentType: "lt" },
  { id: "INT-Flow", mqttKey: "EFM_FLOW", label: "Flow Meter", unit: "m³/hr", min: 0, max: 200, section: "intake", instrumentType: "flow" },
  { id: "INT-Totalizer", mqttKey: "EFM", label: "Totalizer", unit: "m³", min: 0, max: 999999, section: "intake", instrumentType: "totalizer" },
  { id: "INT-Pump1", mqttKey: "", label: "VT Pump 1", unit: "", min: 0, max: 1, section: "intake", instrumentType: "pump" },
  { id: "INT-Pump2", mqttKey: "", label: "VT Pump 2", unit: "", min: 0, max: 1, section: "intake", instrumentType: "pump" },
  // === WTP sensors (logged second) — Mohgaon plant: 2 HT Pumps, RTU Device ID: 02500225110500007666 ===
  // mqttKey values match exact PLC r_data tag names from mohgaon/wtp topic
  { id: "WTP-LT-BW", mqttKey: "BW_LT", label: "Backwash Level", unit: "%", min: 0, max: 100, section: "wtp", instrumentType: "lt" },
  { id: "WTP-LT-CW", mqttKey: "CWR_LT", label: "Clear Water Level", unit: "%", min: 0, max: 100, section: "wtp", instrumentType: "lt" },
  // HT Pump pressures: PT_1=Pump1, PT_2=Pump2 (NOT VT pumps)
  { id: "WTP-PT1", mqttKey: "PT_1", label: "HT Pump 1 Pressure", unit: "Bar", min: 0, max: 10, section: "wtp", instrumentType: "pt" },
  { id: "WTP-PT2", mqttKey: "PT_2", label: "HT Pump 2 Pressure", unit: "Bar", min: 0, max: 10, section: "wtp", instrumentType: "pt" },
  // Combined Header Pressure — PLC tag PT_3 (direct field reading, NOT a VT pump)
  { id: "WTP-HeaderPT", mqttKey: "PT_3", label: "Combined Header Pressure", unit: "Bar", min: 0, max: 10, section: "wtp", instrumentType: "combined_pt" },
  // Inlet flow/totalizer: RAW_EFM_FLOW = Inlet Flow Meter, RAW_EFM = Inlet Totalizer
  { id: "WTP-Flow-IN", mqttKey: "RAW_EFM_FLOW", label: "Inlet Flow Meter", unit: "m³/hr", min: 0, max: 200, section: "wtp", instrumentType: "flow" },
  { id: "WTP-Totalizer-IN", mqttKey: "RAW_EFM", label: "Inlet Totalizer", unit: "m³", min: 0, max: 999999, section: "wtp", instrumentType: "totalizer" },
  // Outlet flow/totalizer: CLR_EFM_FLOW = Outlet Flow Meter, CLR_EFM = Outlet Totalizer
  { id: "WTP-Flow-OUT", mqttKey: "CLR_EFM_FLOW", label: "Outlet Flow Meter", unit: "m³/hr", min: 0, max: 200, section: "wtp", instrumentType: "flow" },
  { id: "WTP-Totalizer-OUT", mqttKey: "CLR_EFM", label: "Outlet Totalizer", unit: "m³", min: 0, max: 999999, section: "wtp", instrumentType: "totalizer" },
  // Inlet analyzers: RW_PH = Inlet pH, RW_TB = Inlet Turbidity
  { id: "WTP-PH-IN", mqttKey: "RW_PH", label: "Inlet pH", unit: "pH", min: 0, max: 14, section: "wtp", instrumentType: "ph" },
  { id: "WTP-TA-IN", mqttKey: "RW_TB", label: "Inlet Turbidity", unit: "NTU", min: 0, max: 100, section: "wtp", instrumentType: "turbidity" },
  // Outlet analyzers: CWR_TB = Outlet Turbidity
  { id: "WTP-PH", mqttKey: "CWR_PH", label: "Outlet pH", unit: "pH", min: 0, max: 14, section: "wtp", instrumentType: "ph" },
  { id: "WTP-CL", mqttKey: "CWR_CL", label: "Outlet Chlorine", unit: "PPM", min: 0, max: 20, section: "wtp", instrumentType: "chlorine" },
  { id: "WTP-TA", mqttKey: "CWR_TB", label: "Outlet Turbidity", unit: "NTU", min: 0, max: 100, section: "wtp", instrumentType: "turbidity" },
  // Temperature — CWR_TEM = Outlet Temperature
  { id: "WTP-TEM", mqttKey: "CWR_TEM", label: "Outlet Temperature", unit: "°C", min: 0, max: 60, section: "wtp", instrumentType: "temperature" },
  { id: "WTP-Pump1", mqttKey: "", label: "HT Pump 1", unit: "", min: 0, max: 1, section: "wtp", instrumentType: "pump" },
  { id: "WTP-Pump2", mqttKey: "", label: "HT Pump 2", unit: "", min: 0, max: 1, section: "wtp", instrumentType: "pump" },
  // === OHT sensors (logged last, OHT1 → OHT2 → OHT3 → OHT4) ===
  ...ohtSensors(1), ...ohtSensors(2), ...ohtSensors(3), ...ohtSensors(4),
];

const PT_TO_PUMP: Record<string, string> = {
  "INT-PT1": "INT-Pump1", "INT-PT2": "INT-Pump2",
  "WTP-PT1": "WTP-Pump1", "WTP-PT2": "WTP-Pump2",
};

// MQTT key aliases: maps legacy/alternative key names to canonical PLC tags
// Primary keys are the real RTU-published tag names; aliases are for backward compat
const MQTT_KEY_ALIASES: Record<string, string[]> = {
  // Intake tags — canonical: PT_1, PT_2, PT_3, RLT, EFM, EFM_FLOW
  "RLT": ["RLT", "INTAKE_LT", "LEVEL", "Level"],
  "EFM_FLOW": ["EFM_FLOW", "INTAKE_FLOW", "FLOW", "Flow", "INT_FLOW"],
  "EFM": ["EFM", "INTAKE_TOT", "TOTALIZER", "INT_TOT"],
  // WTP levels
  "BW_LT": ["BW_LEVEL", "BW_LT"],
  "CWR_LT": ["CWR_LEVEL", "CWR_LT"],
  // Pressures — canonical RTU tags: PT_1, PT_2, PT_3
  "PT_1": ["PT_1", "CWR_PT1", "PT_01", "INTAKE_PT1"],
  "PT_2": ["PT_2", "CWR_PT2", "PT_02", "INTAKE_PT2"],
  "PT_3": ["PT_3", "PT_03", "INTAKE_PT3", "PT_COM"],
  // Inlet flow/totalizer — canonical: RAW_EFM_FLOW, RAW_EFM
  "RAW_EFM_FLOW": ["RAW_EFM_FLOW", "FLOWMETER", "FLOW", "FLOW_IN"],
  "RAW_EFM": ["RAW_EFM", "TOTALIZER", "TOTALIZER_IN"],
  // Outlet flow/totalizer — canonical: CLR_EFM_FLOW, CLR_EFM
  "CLR_EFM_FLOW": ["CLR_EFM_FLOW", "CWR_FLOW", "FLOW_OUT"],
  "CLR_EFM": ["CLR_EFM", "CWR_TOT", "TOTALIZER_OUT"],
  // Inlet analyzers — canonical: RW_PH, RW_TB
  "RW_PH": ["RW_PH", "RAW_PH"],
  "RW_TB": ["RW_TB", "RAW_TR", "RW_TR"],
  // Outlet analyzers — canonical: CWR_PH, CWR_CL, CWR_TB, CWR_TEM
  "CWR_PH": ["CWR_PH", "PH", "CW_PH"],
  "CWR_CL": ["CWR_CL", "CL"],
  "CWR_TB": ["CWR_TB", "CWR_TR", "TR", "CW_TR"],
  "CWR_TEM": ["CWR_TEM"],
  // OHT keys with prefixed names
  "PT_01": ["PT_01", "PT"],
  "LEVEL": ["LEVEL", "Level", "LT"],
  "FLOW": ["FLOW", "Flow", "FLOW_IN"],
};

/** Check if an MQTT key matches a sensor's expected key, including aliases */
function mqttKeyMatches(sensorMqttKey: string, incomingKey: string): boolean {
  if (!sensorMqttKey) return false;
  // Exact match (case-insensitive)
  if (sensorMqttKey.toUpperCase() === incomingKey.toUpperCase()) return true;
  // Check aliases
  const aliases = MQTT_KEY_ALIASES[sensorMqttKey];
  if (aliases) {
    return aliases.some(a => a.toUpperCase() === incomingKey.toUpperCase());
  }
  return false;
}

// Section ordering for INTAKE → WTP → OHT1 → OHT2 → OHT3 → OHT4
function getSectionSortKey(section: Section, sensorId: string): number {
  if (section === "intake") return 0;
  if (section === "wtp") return 1;
  if (section === "oht") {
    const m = sensorId.match(/OHT(\d+)/i);
    return m ? 1 + parseInt(m[1], 10) : 99;
  }
  return 99;
}

function getDefaultSetpoints(sensor: Sensor): { high: number | null; low: number | null } {
  switch (sensor.instrumentType) {
    case 'pt': // Pressure: high at 80% of max, low at 10% of max
      return { high: sensor.max * 0.8, low: sensor.max * 0.1 };
    case 'lt': // Level: high at 90%, low at 15%
      return { high: sensor.max * 0.9, low: sensor.max * 0.15 };
    case 'flow': // Flow: high at 90% of max, low at 0 (no low alarm)
      return { high: sensor.max * 0.9, low: null };
    case 'ph': // pH: normal range 6.5-8.5
      return { high: 8.5, low: 6.5 };
    case 'turbidity': // Turbidity: high alarm only
      return { high: sensor.section === 'wtp' && (sensor.id.includes('TA-IN') || sensor.id.includes('RAW')) ? 50 : 5, low: null };
    case 'chlorine': // Chlorine: 0.2-1.0 mg/L safe range
      return { high: 1.0, low: 0.2 };
    case 'temperature': // Temperature: water treatment normal range
      return { high: 35, low: 5 };
    case 'combined_pt': // Combined pressure
      return { high: sensor.max * 0.8, low: sensor.max * 0.1 };
    default:
      return { high: null, low: null };
  }
}

function parsePayload(payload: string): Record<string, string | number>[] {
  const results: Record<string, string | number>[] = [];
  try {
    const parsed = JSON.parse(payload);
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      // Handle params.r_data or direct r_data array
      const rData = (parsed as any).params?.r_data || (parsed as any).r_data;
      if (Array.isArray(rData)) {
        rData.forEach((item: any) => {
          if (item && typeof item === "object") {
            // PLC/RTU explicitly reports sensor quality in `err`. Never turn a
            // known bad instrument reading into live or historical data.
            const keyName = item.name ?? item.tag ?? item.key;
            const val = item.value ?? item.val;
            if (keyName !== undefined && val !== undefined) {
              results.push({ [String(keyName)]: item.err !== undefined && String(item.err) !== '0' ? NaN : val });
            }
          }
        });
        if (results.length > 0) return results;
      }

      // Handle legacy single TAG / VALUE pair format
      const keys = Object.keys(parsed);
      const tagKey = keys.find(k => k.toUpperCase() === "TAG");
      const valKey = keys.find(k => k.toUpperCase() === "VALUE");
      if (tagKey && valKey && keys.length <= 3) {
        results.push({ [String((parsed as any)[tagKey])]: (parsed as any)[valKey] });
        return results;
      }

      // Handle direct key-value object map
      Object.entries(parsed).forEach(([key, value]) => {
        if (key === "params" || key === "r_data") return;
        results.push({
          [key]: typeof value === "object" && value !== null && "value" in value ? (value as any).value : value as any
        });
      });
    } else if (Array.isArray(parsed)) {
      parsed.forEach((item: any) => {
        if (item && typeof item === "object") {
          const keyName = item.name ?? item.tag ?? item.key;
          const val = item.value ?? item.val;
          if (keyName !== undefined && val !== undefined) {
            results.push({ [String(keyName)]: item.err !== undefined && String(item.err) !== '0' ? NaN : val });
          } else {
            results.push(item);
          }
        } else {
          results.push(item);
        }
      });
    }
  } catch {
    const matches = payload.match(/\{[^}]+\}/g);
    matches?.forEach(match => {
      try {
        results.push(JSON.parse(match));
      } catch {
        /* ignore */
      }
    });
  }
  return results;
}

function topicSetup(cfg: MqttConfig | null) {
  const topics = {
    INTAKE: Deno.env.get("MQTT_TOPIC_INTAKE") || cfg?.intake_topic || DEFAULT_TOPICS.INTAKE,
    WTP: Deno.env.get("MQTT_TOPIC_WTP") || cfg?.wtp_topic || DEFAULT_TOPICS.WTP,
    OHT1: Deno.env.get("MQTT_TOPIC_OHT1") || cfg?.oht_topic || DEFAULT_TOPICS.OHT1,
    OHT2: Deno.env.get("MQTT_TOPIC_OHT2") || cfg?.oht_topic_2 || DEFAULT_TOPICS.OHT2,
    OHT3: Deno.env.get("MQTT_TOPIC_OHT3") || cfg?.oht_topic_3 || DEFAULT_TOPICS.OHT3,
    OHT4: Deno.env.get("MQTT_TOPIC_OHT4") || cfg?.oht_topic_4 || DEFAULT_TOPICS.OHT4,
  };
  const topicToSection = new Map<string, { section: Section; subsection?: string }>([
    [topics.INTAKE, { section: "intake" }],
    [topics.WTP, { section: "wtp" }],
    [topics.OHT1, { section: "oht", subsection: "OHT-1" }],
    [topics.OHT2, { section: "oht", subsection: "OHT-2" }],
    [topics.OHT3, { section: "oht", subsection: "OHT-3" }],
    [topics.OHT4, { section: "oht", subsection: "OHT-4" }],
  ]);
  // Subscribe to the commissioned paths as well as configured legacy aliases.
  for (const [key, path] of Object.entries(DEFAULT_TOPICS)) {
    topicToSection.set(path, key === 'INTAKE' ? { section: 'intake' } : key === 'WTP'
      ? { section: 'wtp' } : { section: 'oht', subsection: `OHT-${key.slice(3)}` });
  }
  return { topics: [...topicToSection.keys()].filter(Boolean), topicToSection };
}

function normalizeBrokerUrl(url: string | null | undefined): string {
  let raw = Deno.env.get("MQTT_BACKEND_URL") || url || "mqtt://mqtt.orbitengineerings.com:1883";
  if (raw.includes("mqtt.orbitengineerings.com") && /^wss?:/.test(raw)) {
    return "mqtt://mqtt.orbitengineerings.com:1883";
  }
  if (raw.includes("broker.hivemq.com")) {
    raw = "mqtt://mqtt.orbitengineerings.com:1883";
  }
  return raw;
}

async function collectSnapshot(
  cfg: MqttConfig | null, captureWindowMs: number,
  onMessage?: (message: ParsedMessage) => Promise<void>,
  onConnected?: () => Promise<void>,
): Promise<ParsedMessage[]> {
  const brokerUrl = normalizeBrokerUrl(cfg?.broker_url);
  const { topics, topicToSection } = topicSetup(cfg);
  const messages: ParsedMessage[] = [];

  return await new Promise((resolve, reject) => {
    const client = mqtt.connect(brokerUrl, {
      clientId: `${cfg?.client_id || "mohgaon-backend"}-${crypto.randomUUID().slice(0, 8)}`,
      username: Deno.env.get("MQTT_USERNAME") || "",
      password: Deno.env.get("MQTT_PASSWORD") || "",
      protocolVersion: 4,
      clean: true,
      connectTimeout: 10_000,
      reconnectPeriod: onMessage ? 2000 : 0,
      keepalive: 15,
    });
    let settled = false;
    let writes = Promise.resolve();
    let writeError: Error | undefined;

    const finish = (err?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try { client.end(true); } catch { /* ignore */ }
      writes.then(() => {
        if (writeError) reject(writeError);
        else if (err && messages.length === 0) reject(err);
        else resolve(messages);
      });
    };
    const timer = setTimeout(() => finish(), captureWindowMs);

    client.on("connect", () => {
      console.log(`Connected to MQTT broker at ${brokerUrl}, subscribing to: ${topics.join(", ")}`);
      client.subscribe(topics, { qos: 0 }, (err: Error | null) => { if (err) finish(err); });
      if (onConnected) writes = writes.then(onConnected).catch(err => { writeError = err; });
    });
    client.on("message", (topic: string, payload: Buffer, packet: { retain?: boolean }) => {
      // Retained packets have no trustworthy acquisition timestamp in these RTUs.
      if (settled || packet.retain) return;
      const mapped = topicToSection.get(topic) || { section: "unknown" as const };
      const combined: Record<string, string | number> = {};
      parsePayload(payload.toString()).forEach(part => Object.assign(combined, part));
      if (Object.keys(combined).length > 0) {
        const message = { topic, payload: combined, timestamp: new Date(), ...mapped };
        messages.push(message);
        if (onMessage) writes = writes.then(() => onMessage(message)).catch(err => { writeError = err; });
      }
    });
    client.on("error", (err: Error) => {
      console.error('MQTT transport:', err.message);
      if (!onMessage) finish(err);
    });
    client.on("close", () => { if (!onMessage && !settled && messages.length > 0) finish(); });
  });
}

function mapReadings(msg: ParsedMessage) {
  if (msg.section === 'unknown') return [];
  const sensors = SENSORS.filter(s => s.section === msg.section && (!s.subsection || s.subsection === msg.subsection) && s.mqttKey);
  const rows = new Map<string, {tag_id: string; section: Section; value: number | null; quality: string; received_at: string; mqtt_topic: string}>();
  for (const [key, raw] of Object.entries(msg.payload)) {
    const sensor = sensors.find(s => mqttKeyMatches(s.mqttKey, key));
    if (!sensor) continue;
    let value = raw === '' || raw === null || typeof raw === 'boolean' ? NaN : Number(raw);
    // WTP flow is already m³/hr; do not apply a litres-to-m³ conversion.
    const normalized = normalizeSensorValue(sensor, value);
    rows.set(sensor.id, {tag_id:sensor.id, section:sensor.section, value:normalized,
      quality:normalized === null ? 'fault' : 'good', received_at:msg.timestamp.toISOString(), mqtt_topic:msg.topic});
    const pump = PT_TO_PUMP[sensor.id];
    if (pump) rows.set(pump, {tag_id:pump,section:sensor.section,value:normalized === null ? null : normalized > 1.5 ? 1 : 0,
      quality:normalized === null ? 'fault' : 'good',received_at:msg.timestamp.toISOString(),mqtt_topic:msg.topic});
  }
  return [...rows.values()];
}

async function runCollector(supabase: ReturnType<typeof createClient>, cfg: MqttConfig | null, runId: string) {
  let messages = 0, saved = 0;
  try {
    // Only insert missing definitions; preserve operator alarm configuration.
    const { error: configError } = await supabase.from('tag_config').upsert(SENSORS.map(s => ({
      tag_id:s.id,section:s.section,label:s.label,unit:s.unit,is_active:true,alarm_enabled:true,
    })), {onConflict:'section,tag_id',ignoreDuplicates:true});
    if (configError) throw configError;
    await collectSnapshot(cfg, 75000, async message => {
      const readings = mapReadings(message);
      if (!readings.length) return;
      let lastError;
      for (let attempt = 0; attempt < 3; attempt++) {
        const {data,error} = await supabase.rpc('ingest_telemetry',{readings});
        if (!error) { saved += Number(data || 0); lastError = undefined; break; }
        lastError = error;
        await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
      }
      if (lastError) throw lastError;
      messages++;
      const {error} = await supabase.from('telemetry_ingest_runs').update({
        status:'receiving',last_message_at:message.timestamp.toISOString(),message_count:messages,saved_count:saved,
      }).eq('id',runId);
      if (error) throw error;
    }, async () => {
      const {error} = await supabase.from('telemetry_ingest_runs').update({status:'connected',connected_at:new Date().toISOString()}).eq('id',runId);
      if (error) throw error;
    });
    const {error} = await supabase.from('telemetry_ingest_runs').update({
      status:messages ? 'completed' : 'no_data',finished_at:new Date().toISOString(),message_count:messages,saved_count:saved,
    }).eq('id',runId);
    if (error) throw error;
  } catch (err) {
    const message = err instanceof Error ? err.message : JSON.stringify(err);
    console.error('Collector failed:', message);
    await supabase.from('telemetry_ingest_runs').update({status:'failed',finished_at:new Date().toISOString(),error_message:message}).eq('id',runId);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const started = Date.now();
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  try {
    let mode: "snapshot" | "live" | "collect" = "snapshot";
    if (req.method === "POST") {
      try {
        const body = await req.json();
        if (body?.mode === "live") mode = "live";
        if (body?.mode === "collect") mode = "collect";
      } catch {
        // pg_cron sends an empty body; that is the normal persistent snapshot.
      }
    }

    const { data: cfgRow } = await supabase.from("gis_config").select("cron_secret").order("created_at", { ascending: false }).limit(1).maybeSingle();
    const apiKey = req.headers.get("apikey");
    const authHeader = req.headers.get("Authorization");
    const cronKey = req.headers.get("x-cron-key");
    const isCron = !!cronKey && cronKey === cfgRow?.cron_secret;
    const token = authHeader?.replace(/^Bearer\s+/i, '') || '';
    const {data: authData} = !isCron && token ? await supabase.auth.getUser(token) : {data:{user:null}};
    const isAuthorized = isCron || (mode === 'live' && !!authData.user);

    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: mqttCfg } = await supabase.from("mqtt_config").select("*").limit(1).maybeSingle();
    if (mode === 'collect') {
      const runId = crypto.randomUUID();
      const {error} = await supabase.from('telemetry_ingest_runs').insert({id:runId});
      if (error) throw error;
      // Respond before pg_net's deadline. The worker explicitly owns the job.
      EdgeRuntime.waitUntil(runCollector(supabase, mqttCfg as MqttConfig | null, runId));
      return new Response(JSON.stringify({accepted:true,run_id:runId}), {status:202,headers:{...corsHeaders,'Content-Type':'application/json'}});
    }
    if (mode === 'live') {
      const {data,error} = await supabase.from('telemetry_latest').select('*');
      if (error) throw error;
      const telemetry = Object.fromEntries((data || []).map(row => [row.tag_id,{
        value:row.value,timestamp:row.received_at,quality:row.quality,section:row.section,
      }]));
      return new Response(JSON.stringify({success:true,mode,saved_count:0,telemetry}), {headers:{...corsHeaders,'Content-Type':'application/json'}});
    }
    // Scheduled alarm/consumption processing reads the durable collector cache.
    // It never opens a second sampling window or writes a cached value as new history.
    const { data: latestRows, error: latestError } = await supabase.from('telemetry_latest')
      .select('*').eq('quality','good').gte('received_at',new Date(Date.now()-5*60*1000).toISOString());
    if (latestError) throw latestError;
    const byTag = new Map<string, {sensor:Sensor;value:number;topic:string;at:string;receivedAt:string}>();
    for (const row of latestRows || []) {
      const sensor = SENSORS.find(s => s.id === row.tag_id);
      if (sensor && row.value !== null) byTag.set(sensor.id,{
        sensor,value:row.value,topic:row.mqtt_topic,at:row.received_at,receivedAt:row.received_at,
      });
    }
    if (!byTag.size) return new Response(JSON.stringify({success:true,saved_count:0,message:'No recent telemetry'}),
      {headers:{...corsHeaders,'Content-Type':'application/json'}});

    const tagRows = Array.from(byTag.values()).map(({ sensor }) => ({
      section: sensor.section, tag_id: sensor.id, label: sensor.label, unit: sensor.unit,
      is_active: true, activated_at: new Date().toISOString(), alarm_enabled: true,
    }));
    const uniqueTagRows = Array.from(new Map(tagRows.map(r => [`${r.section}-${r.tag_id}`, r])).values());
    if (uniqueTagRows.length > 0) {
      // FIX 1a: ignoreDuplicates:true → safely inserts NEW tags without overwriting
      // user-configured alarm_enabled / setpoints on existing tags.
      await supabase.from("tag_config").upsert(uniqueTagRows, { onConflict: "section,tag_id", ignoreDuplicates: true });

      // FIX 1b: Separately patch label + unit so stale DB values (e.g. "METER" → "%")
      // are always corrected to match the current sensor definition, without touching
      // alarm_enabled, high_setpoint, low_setpoint, or other user-controlled columns.
      await Promise.all(uniqueTagRows.map(row =>
        supabase.from("tag_config")
          .update({ label: row.label, unit: row.unit })
          .eq("section", row.section)
          .eq("tag_id", row.tag_id)
      ));
    }

    const { data: configs, error: cfgErr } = await supabase
      .from("tag_config")
      .select("id,section,tag_id,high_setpoint,low_setpoint,alarm_enabled")
      .in("tag_id", uniqueTagRows.map(r => r.tag_id));
    if (cfgErr) throw new Error(`tag_config lookup failed: ${cfgErr.message}`);
    // Backend Alarm Detection & Debounce (bulk query)
    const alarmsToInsert: any[] = [];
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    // Single bulk query: fetch all recent alarms to deduplicate in-memory
    const { data: recentAlarms } = await supabase
      .from("alarms")
      .select("tag_id, alarm_type")
      .gte("created_at", tenMinutesAgo);
    const recentAlarmSet = new Set(
      (recentAlarms || []).map((a: any) => `${a.tag_id}-${a.alarm_type}`)
    );

    for (const entry of Array.from(byTag.values())) {
      const { sensor, value, topic, at } = entry;
      if (sensor.instrumentType === "pump" || sensor.instrumentType === "totalizer") continue;

      const cfg = configs?.find((c: any) => c.tag_id === sensor.id && c.section === sensor.section);
      const dbId = cfg?.id;
      const alarmEnabled = cfg ? cfg.alarm_enabled !== false : true;

      if (!alarmEnabled) continue;

      const defaults = getDefaultSetpoints(sensor);
      const highThreshold = cfg?.high_setpoint != null ? Number(cfg.high_setpoint) : (defaults.high ?? null);
      const lowThreshold = cfg?.low_setpoint != null ? Number(cfg.low_setpoint) : (defaults.low ?? null);

      let alarmType: "High" | "Low" | null = null;
      if (highThreshold !== null && value > highThreshold) {
        alarmType = "High";
      } else if (lowThreshold !== null && value < lowThreshold) {
        alarmType = "Low";
      }

      if (alarmType && !recentAlarmSet.has(`${sensor.id}-${alarmType}`)) {
        const thresholdVal = alarmType === "High" ? highThreshold : lowThreshold;
        alarmsToInsert.push({
          tag_id: sensor.id,
          tag_config_id: dbId || null,
          label: sensor.label,
          value,
          unit: sensor.unit,
          alarm_type: alarmType,
          message: `Alarm: ${sensor.label} ${alarmType} (${value.toFixed(2)} ${sensor.unit}) - Threshold: ${thresholdVal}`,
          section: sensor.section,
          source: "backend:5min",
          acknowledged: false,
          email_sent: false,
        });
      }
    }

    if (alarmsToInsert.length > 0) {
      const { error: alarmErr } = await supabase.from("alarms").insert(alarmsToInsert);
      if (alarmErr) console.error("Failed to insert backend alarms:", alarmErr.message);
    }

    const { error: rpcErr } = await supabase.rpc("refresh_consumption_from_historian", {
      _from: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      _to: new Date().toISOString(),
    });
    if (rpcErr) console.warn("Consumption refresh failed:", rpcErr.message);

    return new Response(JSON.stringify({
      success: true,
      mode,
      saved_count: 0,
      checked_tags: byTag.size,
      duration_ms: Date.now() - started,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("scada-ingest failed", err);
    return new Response(JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err), duration_ms: Date.now() - started }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
