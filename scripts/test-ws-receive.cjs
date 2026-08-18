/**
 * Test MQTT over WebSocket (port 8080) - same path browser uses
 * Node.js + mqtt.js library test
 */
const mqtt = require('mqtt');

const BROKER_WS = 'ws://mqtt.orbitengineerings.com:8080';
const USERNAME = 'orbit';
const PASSWORD = 'H5WoayaqynLWpgqC';
const TOPIC = 'mohgaon/wtp';

console.log(`[WS-Test] Connecting to broker via WebSocket: ${BROKER_WS}`);
console.log(`[WS-Test] Username: ${USERNAME}`);
console.log(`[WS-Test] Topic: ${TOPIC}`);
console.log(`[WS-Test] Timestamp: ${new Date().toISOString()}`);
console.log('---');

const client = mqtt.connect(BROKER_WS, {
  clientId: `ws_test_${Math.random().toString(16).substr(2, 8)}`,
  username: USERNAME,
  password: PASSWORD,
  clean: true,
  connectTimeout: 15000,
  reconnectPeriod: 0, // Don't reconnect - just test once
  protocolVersion: 4, // MQTT 3.1.1
});

let messageCount = 0;
const startTime = Date.now();
const WAIT_TIMEOUT_MS = 90000; // Wait 90 seconds for messages

client.on('connect', (connack) => {
  console.log(`[WS-Test] ✅ CONNECTED via WebSocket! CONNACK return code: ${connack.returnCode}`);
  console.log(`[WS-Test] Connected at: ${new Date().toISOString()}`);
  
  client.subscribe(TOPIC, { qos: 0 }, (err, granted) => {
    if (err) {
      console.error(`[WS-Test] ❌ Subscribe error: ${err.message}`);
    } else {
      console.log(`[WS-Test] ✅ Subscribed to: ${granted.map(g => `${g.topic} (QoS:${g.qos})`).join(', ')}`);
      console.log(`[WS-Test] Waiting up to ${WAIT_TIMEOUT_MS/1000}s for messages on "${TOPIC}"...`);
    }
  });
});

client.on('message', (topic, payload) => {
  messageCount++;
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n[WS-Test] 📨 MESSAGE #${messageCount} received at +${elapsed}s`);
  console.log(`  Topic: ${topic}`);
  console.log(`  Payload Length: ${payload.length} bytes`);
  console.log(`  Payload (first 500 chars): ${payload.toString().substring(0, 500)}`);
  
  if (messageCount >= 3) {
    console.log('\n[WS-Test] ✅ Received 3 messages. WebSocket path is WORKING!');
    client.end(true);
    process.exit(0);
  }
});

client.on('error', (err) => {
  console.error(`[WS-Test] ❌ ERROR: ${err.message}`);
  console.error(`  Error code: ${err.code}`);
});

client.on('close', () => {
  console.log(`[WS-Test] Connection closed. Total messages received: ${messageCount}`);
});

client.on('offline', () => {
  console.log(`[WS-Test] ⚠️  Client went offline`);
});

// Timeout after WAIT_TIMEOUT_MS
setTimeout(() => {
  console.log(`\n[WS-Test] ⏰ Timeout after ${WAIT_TIMEOUT_MS/1000}s. Messages received: ${messageCount}`);
  if (messageCount === 0) {
    console.log('[WS-Test] ❌ FAIL: No messages received via WebSocket port 8080!');
    console.log('[WS-Test] This confirms: Broker IS publishing on native TCP 1883 but NOT forwarding to WebSocket 8080');
  }
  client.end(true);
  process.exit(messageCount > 0 ? 0 : 1);
}, WAIT_TIMEOUT_MS);
