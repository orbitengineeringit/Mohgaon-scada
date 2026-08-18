/**
 * Capture 10 consecutive real MQTT packets from mohgaon/wtp
 * Records device ID, packet interval, all tag values
 */
const mqtt = require('mqtt');

const BROKER = 'mqtt://mqtt.orbitengineerings.com:1883';
const USERNAME = 'orbit';
const PASSWORD = 'H5WoayaqynLWpgqC';
const TOPIC = 'mohgaon/wtp';
const TARGET_PACKETS = 10;

const client = mqtt.connect(BROKER, {
  clientId: `verify_${Math.random().toString(16).substr(2, 8)}`,
  username: USERNAME, password: PASSWORD,
  clean: true, connectTimeout: 15000, reconnectPeriod: 0, protocolVersion: 4,
});

const packets = [];
let lastTs = null;
const intervals = [];

// Expected PLC tags per canonical mapping
const EXPECTED_TAGS = ['BW_LT','CWR_LT','PT_1','PT_2','PT_3','RW_TB','RW_PH',
  'CWR_PH','CWR_CL','CWR_TB','CWR_TEM','RAW_EFM','RAW_EFM_FLOW','CLR_EFM','CLR_EFM_FLOW'];

const CANONICAL_MAP = {
  BW_LT: 'Backwash Tank Level (WTP-LT-BW)',
  CWR_LT: 'Clear Water Reservoir Level (WTP-LT-CW)',
  PT_1: 'HT Pump 1 Pressure (WTP-PT1)',
  PT_2: 'HT Pump 2 Pressure (WTP-PT2)',
  PT_3: '*** Combined Header Pressure (WTP-HeaderPT) ***',
  RW_TB: 'Raw Water Turbidity (WTP-TA-IN)',
  RW_PH: 'Raw Water pH (WTP-PH-IN)',
  CWR_PH: 'Clear Water pH (WTP-PH)',
  CWR_CL: 'Clear Water Chlorine (WTP-CL)',
  CWR_TB: 'Clear Water Turbidity (WTP-TA)',
  CWR_TEM: 'Temperature (WTP-TEM)',
  RAW_EFM: 'Raw Water Inlet Totalizer (WTP-Totalizer-IN)',
  RAW_EFM_FLOW: 'Raw Water Inlet Flow (WTP-Flow-IN)',
  CLR_EFM: 'Clear Water Outlet Totalizer (WTP-Totalizer-OUT)',
  CLR_EFM_FLOW: 'Clear Water Outlet Flow (WTP-Flow-OUT)',
};

client.on('connect', () => {
  console.log(`[VERIFY] Connected to ${BROKER}`);
  client.subscribe(TOPIC, { qos: 0 });
  console.log(`[VERIFY] Subscribed to ${TOPIC}`);
  console.log(`[VERIFY] Waiting for ${TARGET_PACKETS} real PLC packets...`);
});

client.on('message', (topic, buf) => {
  const now = Date.now();
  if (lastTs) intervals.push(((now - lastTs) / 1000).toFixed(1));
  lastTs = now;

  let parsed;
  try { parsed = JSON.parse(buf.toString()); } catch { return; }
  
  const rData = parsed?.params?.r_data;
  if (!Array.isArray(rData) || rData.length === 0) {
    console.log(`[VERIFY] Packet ${packets.length+1}: No r_data (len=${buf.length}), skipping`);
    return;
  }

  const pkt = {
    n: packets.length + 1,
    ts: new Date(now).toISOString(),
    deviceId: parsed?.params?.id,
    interval: intervals.length ? intervals[intervals.length-1] + 's' : 'first',
    tags: {},
    errTags: [],
  };
  
  for (const item of rData) {
    if (item.err !== undefined && String(item.err) !== '0') {
      pkt.errTags.push(item.name);
    } else if (item.value !== undefined) {
      pkt.tags[item.name] = item.value;
    }
  }

  packets.push(pkt);

  // Print packet summary
  console.log(`\n=== PACKET #${pkt.n} | ${pkt.ts} | interval: ${pkt.interval} ===`);
  console.log(`Device ID: ${pkt.deviceId}`);
  console.log(`Tags (${Object.keys(pkt.tags).length}):`);
  for (const [name, val] of Object.entries(pkt.tags)) {
    const canon = CANONICAL_MAP[name] || name;
    console.log(`  ${name.padEnd(16)} = ${String(val).padEnd(20)} → ${canon}`);
  }
  if (pkt.errTags.length) console.log(`ERR tags (err!=0): ${pkt.errTags.join(', ')}`);

  if (packets.length >= TARGET_PACKETS) {
    printFinalReport();
    client.end(true);
    process.exit(0);
  }
});

client.on('error', err => { console.error(`[VERIFY] ERROR: ${err.message}`); });

setTimeout(() => {
  console.log(`\n[VERIFY] Timeout. Got ${packets.length}/${TARGET_PACKETS} packets.`);
  if (packets.length > 0) printFinalReport();
  client.end(true);
  process.exit(packets.length >= 3 ? 0 : 1);
}, 300000); // 5 minute timeout for 10 packets

function printFinalReport() {
  console.log('\n' + '='.repeat(60));
  console.log('FINAL VERIFICATION REPORT');
  console.log('='.repeat(60));
  console.log(`Total packets captured: ${packets.length}`);
  console.log(`Device ID: ${packets[0]?.deviceId}`);
  const avgInterval = intervals.length ? (intervals.reduce((a,b) => a + parseFloat(b), 0) / intervals.length).toFixed(1) : 'N/A';
  console.log(`Average interval: ${avgInterval}s`);
  console.log(`All intervals: ${intervals.join(', ')} s`);
  
  // Tag coverage check
  const allTagsSeen = new Set();
  packets.forEach(p => Object.keys(p.tags).forEach(k => allTagsSeen.add(k)));
  console.log(`\nTag Coverage (${allTagsSeen.size}/${EXPECTED_TAGS.length}):`);
  EXPECTED_TAGS.forEach(tag => {
    const seen = allTagsSeen.has(tag);
    const vals = packets.filter(p => p.tags[tag] !== undefined).map(p => p.tags[tag]);
    const hasRealData = vals.some(v => parseFloat(v) !== 0);
    console.log(`  ${seen ? '✅' : '❌'} ${tag.padEnd(16)} | ${CANONICAL_MAP[tag]} | vals: ${vals.slice(0,3).join(',')} | hasNonZero: ${hasRealData}`);
  });
  
  console.log(`\nPT_3 CANONICAL MAPPING:`);
  const pt3Vals = packets.filter(p => p.tags['PT_3'] !== undefined).map(p => p.tags['PT_3']);
  console.log(`  PT_3 → WTP-HeaderPT (Combined Header Pressure)`);
  console.log(`  PT_3 values received: [${pt3Vals.join(', ')}]`);
  console.log(`  PT_3 must NOT be treated as HT Pump 3 Pressure`);
}
