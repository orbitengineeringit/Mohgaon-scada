import mqtt from 'mqtt';

const brokerUrl = 'mqtt://broker.hivemq.com:1883';
const topics = [
  'Orbit/BICHIYA/INTAKE/0000000001',
  'Orbit/BICHIYA/WTP/0000000001',
  'Orbit/BICHIYA/OHT01/0000000001',
  'Orbit/BICHIYA/OHT02/0000000001',
  'Orbit/BICHIYA/OHT03/0000000001'
];

console.log(`Connecting to MQTT broker at ${brokerUrl}...`);
const client = mqtt.connect(brokerUrl);

const lastReceived = {};
const intervals = {};

client.on('connect', () => {
  console.log('Connected to broker. Subscribing to topics:');
  for (const topic of topics) {
    console.log(` - ${topic}`);
    client.subscribe(topic);
    lastReceived[topic] = null;
    intervals[topic] = [];
  }
  console.log('\nListening for messages... (will auto-exit in 20 seconds)\n');
  
  setTimeout(() => {
    console.log('\n--- Final Summary ---');
    for (const topic of topics) {
      const ints = intervals[topic];
      const name = topic.split('/')[2]; // INTAKE, WTP, OHT01 etc
      if (ints.length > 0) {
        const avg = ints.reduce((sum, v) => sum + v, 0) / ints.length;
        console.log(`${name}: Received ${ints.length + 1} messages. Intervals: ${ints.map(v => v.toFixed(1) + 's').join(', ')}. Avg: ${avg.toFixed(1)}s`);
      } else {
        console.log(`${name}: Received ${lastReceived[topic] ? '1' : '0'} message. No interval could be measured.`);
      }
    }
    client.end();
    process.exit(0);
  }, 20000);
});

client.on('message', (topic, payload) => {
  const now = Date.now();
  const name = topic.split('/')[2];
  const payloadStr = payload.toString();
  
  let valueSnippet = payloadStr.substring(0, 100);
  if (payloadStr.length > 100) valueSnippet += '...';

  const prev = lastReceived[topic];
  lastReceived[topic] = now;

  if (prev) {
    const diffSec = (now - prev) / 1000;
    intervals[topic].push(diffSec);
    console.log(`[${new Date().toLocaleTimeString()}] ${name} updated after ${diffSec.toFixed(2)}s. Payload: ${valueSnippet}`);
  } else {
    console.log(`[${new Date().toLocaleTimeString()}] ${name} first message received. Payload: ${valueSnippet}`);
  }
});

client.on('error', (err) => {
  console.error('MQTT Error:', err);
});
