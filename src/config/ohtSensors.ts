/**
 * FIXED OHT SENSOR CONFIGURATION
 * 
 * These sensors are permanently fixed and MUST NOT be modified:
 * - OHT-001 → PT (Pressure Transmitter) → Bar
 * - OHT-002 → LT (Level Transmitter) → Meter
 * - OHT-003 → Flow → m³/hr
 * 
 * The incoming MQTT JSON format is:
 * { "PT": "2.389490", "LT": "4.420432", "Flow": "0.429992" }
 */

export interface FixedOhtSensor {
  id: string;           // OHT-001, OHT-002, OHT-003
  mqttKey: string;      // PT, LT, Flow (from MQTT JSON)
  label: string;        // Display label
  unit: string;         // Unit of measurement
  min: number;          // Minimum scale value
  max: number;          // Maximum scale value
}

// FIXED SENSOR MAPPING - DO NOT MODIFY
export const OHT_SENSORS: readonly FixedOhtSensor[] = Object.freeze([
  {
    id: 'OHT-001',
    mqttKey: 'PT',
    label: 'Pressure (PT)',
    unit: 'Bar',
    min: 0,
    max: 10,
  },
  {
    id: 'OHT-002',
    mqttKey: 'LT',
    label: 'Level (LT)',
    unit: 'Meter',
    min: 0,
    max: 10,
  },
  {
    id: 'OHT-003',
    mqttKey: 'Flow',
    label: 'Flow',
    unit: 'm³/hr',
    min: 0,
    max: 10,
  },
]) as readonly FixedOhtSensor[];

// Mapping from MQTT key to sensor ID
export const MQTT_KEY_TO_SENSOR_ID: Readonly<Record<string, string>> = Object.freeze({
  'PT': 'OHT-001',
  'LT': 'OHT-002',
  'Flow': 'OHT-003',
});

// Mapping from sensor ID to MQTT key
export const SENSOR_ID_TO_MQTT_KEY: Readonly<Record<string, string>> = Object.freeze({
  'OHT-001': 'PT',
  'OHT-002': 'LT',
  'OHT-003': 'Flow',
});

// Get sensor by MQTT key
export const getSensorByMqttKey = (key: string): FixedOhtSensor | undefined => {
  return OHT_SENSORS.find(s => s.mqttKey === key);
};

// Get sensor by ID
export const getSensorById = (id: string): FixedOhtSensor | undefined => {
  return OHT_SENSORS.find(s => s.id === id);
};

// Valid MQTT keys
export const VALID_MQTT_KEYS: readonly string[] = Object.freeze(['PT', 'LT', 'Flow']);

// Check if a key is valid
export const isValidMqttKey = (key: string): boolean => {
  return VALID_MQTT_KEYS.includes(key);
};
