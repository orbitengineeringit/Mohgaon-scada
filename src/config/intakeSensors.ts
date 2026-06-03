/**
 * FIXED INTAKE SENSOR CONFIGURATION
 * 
 * These sensors are permanently fixed and MUST NOT be modified:
 * - INT-001 → PT (Pressure Transmitter) → Bar
 * - INT-002 → LT (Level Transmitter) → Meter
 * - INT-003 → Flow → m³/hr
 * 
 * The incoming MQTT JSON format is:
 * { "PT": "2.099713" }
 * { "LT": "91.500000" }
 * { "Flow": "133.051361" }
 */

export interface FixedIntakeSensor {
  id: string;           // INT-001, INT-002, INT-003
  mqttKey: string;      // PT, LT, Flow (from MQTT JSON)
  label: string;        // Display label
  unit: string;         // Unit of measurement
  min: number;          // Minimum scale value
  max: number;          // Maximum scale value
}

// FIXED SENSOR MAPPING - DO NOT MODIFY
export const INTAKE_SENSORS: readonly FixedIntakeSensor[] = Object.freeze([
  {
    id: 'INT-001',
    mqttKey: 'PT',
    label: 'Pressure (PT)',
    unit: 'Bar',
    min: 0,
    max: 10,
  },
  {
    id: 'INT-002',
    mqttKey: 'LT',
    label: 'Level (LT)',
    unit: 'Meter',
    min: 0,
    max: 100,
  },
  {
    id: 'INT-003',
    mqttKey: 'Flow',
    label: 'Flow',
    unit: 'm³/hr',
    min: 0,
    max: 200,
  },
]) as readonly FixedIntakeSensor[];

// Mapping from MQTT key to sensor ID
export const INTAKE_MQTT_KEY_TO_SENSOR_ID: Readonly<Record<string, string>> = Object.freeze({
  'PT': 'INT-001',
  'LT': 'INT-002',
  'Flow': 'INT-003',
});

// Mapping from sensor ID to MQTT key
export const INTAKE_SENSOR_ID_TO_MQTT_KEY: Readonly<Record<string, string>> = Object.freeze({
  'INT-001': 'PT',
  'INT-002': 'LT',
  'INT-003': 'Flow',
});

// Get sensor by MQTT key
export const getIntakeSensorByMqttKey = (key: string): FixedIntakeSensor | undefined => {
  return INTAKE_SENSORS.find(s => s.mqttKey === key);
};

// Get sensor by ID
export const getIntakeSensorById = (id: string): FixedIntakeSensor | undefined => {
  return INTAKE_SENSORS.find(s => s.id === id);
};

// Valid MQTT keys
export const VALID_INTAKE_MQTT_KEYS: readonly string[] = Object.freeze(['PT', 'LT', 'Flow']);

// Check if a key is valid
export const isValidIntakeMqttKey = (key: string): boolean => {
  return VALID_INTAKE_MQTT_KEYS.includes(key);
};
