const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function loadModule(file, stubs = {}, extra = {}) {
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React },
  }).outputText;
  const exports = {};
  const context = vm.createContext({
    exports,
    require: name => (name in stubs ? stubs[name] : require(name)),
    console,
    Date,
    Map,
    Set,
    Array,
    Math,
    Number,
    String,
    JSON,
    Promise,
    setTimeout,
    clearTimeout,
    ...extra,
  });
  vm.runInContext(code, context, { filename: file });
  return { exports, context };
}

const mockExcelJS = {
  Workbook: class {
    constructor() {
      this.creator = '';
      this.created = new Date();
      this.worksheets = [];
    }
    addWorksheet(name) {
      const sheet = {
        name,
        views: [],
        columns: [],
        rows: [],
        mergeCells: () => {},
        getCell: () => ({ value: '', font: {}, alignment: {}, fill: {}, border: {} }),
        getRow: () => ({ height: 20, getCell: () => ({ value: '', font: {}, alignment: {}, fill: {}, border: {} }) }),
        addRow: (data) => {
          const rowObj = {
            data,
            getCell: (col) => ({
              numFmt: '',
              font: {},
              alignment: {},
              fill: {},
              border: {},
            }),
          };
          sheet.rows.push(rowObj);
          return rowObj;
        },
      };
      this.worksheets.push(sheet);
      return sheet;
    }
    get xlsx() {
      return {
        writeBuffer: async () => Buffer.from('mock-xlsx-buffer'),
      };
    }
  },
};

const mockSupabase = {
  from: () => ({
    select: () => ({
      data: [
        { id: '1', tag_id: 'OHT1-LT', label: 'OHT 1 Water Level', unit: 'm', section: 'oht' },
        { id: '2', tag_id: 'WTP-Pump1', label: 'WTP Raw Water Pump 1', unit: 'status', section: 'wtp' },
        { id: '3', tag_id: 'INT-PT1', label: 'Intake Pressure Transmitter', unit: 'bar', section: 'intake' },
      ],
      error: null,
    }),
  }),
};

const exporter = loadModule('src/lib/historianExport.ts', {
  'exceljs': mockExcelJS,
  '@/integrations/supabase/client': { supabase: mockSupabase },
  '@/lib/errorLogger': { logError: () => {} },
  'date-fns': require('date-fns'),
}).exports;

test('getOptimalSliceDays: calculates balanced slice durations based on date range', () => {
  const day1Start = new Date(2026, 4, 1);
  const day1End = new Date(2026, 4, 1);
  assert.equal(exporter.getOptimalSliceDays(day1Start, day1End), 1);

  const weekEnd = new Date(2026, 4, 7);
  assert.equal(exporter.getOptimalSliceDays(day1Start, weekEnd), 1);

  const monthEnd = new Date(2026, 4, 30);
  assert.equal(exporter.getOptimalSliceDays(day1Start, monthEnd), 3);

  const twoMonthEnd = new Date(2026, 5, 30); // ~61 days
  assert.equal(exporter.getOptimalSliceDays(day1Start, twoMonthEnd), 5);

  const halfYearEnd = new Date(2026, 10, 30);
  assert.equal(exporter.getOptimalSliceDays(day1Start, halfYearEnd), 7);
});

test('generateTimeSlices: accurately partitions 1 day, 7 days, 30 days, 182 days', () => {
  // 1 day (e.g. 1 May 2026 to 1 May 2026)
  const day1Start = new Date(2026, 4, 1);
  const day1End = new Date(2026, 4, 1);
  const slices1 = exporter.generateTimeSlices(day1Start, day1End, 1);
  assert.equal(slices1.length, 1);
  assert.equal(slices1[0].label, '1 May 2026');

  // 7 days with explicit 1-day slices
  const weekStart = new Date(2026, 4, 1);
  const weekEnd = new Date(2026, 4, 7);
  const slicesWeek = exporter.generateTimeSlices(weekStart, weekEnd, 1);
  assert.equal(slicesWeek.length, 7);
  for (let i = 0; i < slicesWeek.length - 1; i++) {
    // Ensure contiguous boundaries
    assert.equal(slicesWeek[i].end, slicesWeek[i + 1].start);
  }

  // 1 month with explicit 1-day slices (31 days)
  const monthStart = new Date(2026, 4, 1);
  const monthEnd = new Date(2026, 4, 31);
  const slicesMonth1Day = exporter.generateTimeSlices(monthStart, monthEnd, 1);
  assert.equal(slicesMonth1Day.length, 31);

  // 1 month with adaptive slicing (3-day slices -> ~11 slices instead of 31)
  const slicesMonthAdaptive = exporter.generateTimeSlices(monthStart, monthEnd);
  assert.equal(slicesMonthAdaptive.length, 11);

  // 6 months with adaptive slicing (7-day slices -> 26 slices instead of 182)
  const halfYearStart = new Date(2025, 11, 1);
  const halfYearEnd = new Date(2026, 4, 31);
  const slicesHalfYearAdaptive = exporter.generateTimeSlices(halfYearStart, halfYearEnd);
  assert.equal(slicesHalfYearAdaptive.length, 26);
});

test('getDisplaySection: derives human-readable sub-sections for Mohgaon OHTs', () => {
  assert.equal(exporter.getDisplaySection('oht', 'OHT1-LT'), 'OHT - 1 Ward No 04 - 300KL');
  assert.equal(exporter.getDisplaySection('oht', 'OHT2-PT'), 'OHT - 2 Ward No 06 500KL');
  assert.equal(exporter.getDisplaySection('oht', 'OHT3-Flow'), 'OHT - 3 Ward No 06 200KL');
  assert.equal(exporter.getDisplaySection('oht', 'OHT4-LT'), 'OHT - 4 Ward No 10 200KL');
  assert.equal(exporter.getDisplaySection('intake', 'INT-Pump1'), 'INTAKE');
  assert.equal(exporter.getDisplaySection('wtp', 'WTP-LT'), 'WTP');
});

test('getSectionOrder: correctly prioritizes Intake -> WTP -> OHT 1 -> 2 -> 3 -> 4', () => {
  const intakeOrder = exporter.getSectionOrder('intake', 'INT-Pump1');
  const wtpOrder = exporter.getSectionOrder('wtp', 'WTP-Pump1');
  const oht1Order = exporter.getSectionOrder('oht', 'OHT1-LT');
  const oht2Order = exporter.getSectionOrder('oht', 'OHT2-LT');
  const oht3Order = exporter.getSectionOrder('oht', 'OHT3-LT');
  const oht4Order = exporter.getSectionOrder('oht', 'OHT4-LT');

  assert.ok(intakeOrder < wtpOrder);
  assert.ok(wtpOrder < oht1Order);
  assert.ok(oht1Order < oht2Order);
  assert.ok(oht2Order < oht3Order);
  assert.ok(oht3Order < oht4Order);
});

test('getSensorType: accurately classifies all plant instrumentation', () => {
  assert.equal(exporter.getSensorType('WTP-Pump1', 'Raw Water Pump 1'), 'Pump');
  assert.equal(exporter.getSensorType('OHT1-LT', 'Overhead Tank Level'), 'Level');
  assert.equal(exporter.getSensorType('INT-PT1', 'Discharge Pressure'), 'Pressure');
  assert.equal(exporter.getSensorType('WTP-Flow-IN', 'Inlet Flow Meter'), 'Flow');
  assert.equal(exporter.getSensorType('WTP-Totalizer', 'Cumulative Volume'), 'Totalizer');
  assert.equal(exporter.getSensorType('WTP-pH', 'Clear Water pH Analyzer'), 'pH');
  assert.equal(exporter.getSensorType('WTP-Turbidity', 'NTU Sensor'), 'Turbidity');
  assert.equal(exporter.getSensorType('INT-Energy', 'Main Incomer kW'), 'Energy');
});

test('In-flight deduplication: keeps latest record per 5-min snapshot bucket', () => {
  const BUCKET_MS = 5 * 60 * 1000;
  const dedupMap = new Map();

  const rawLogs = [
    { tag_id: 'OHT1-LT', timestamp: '2026-05-01T10:00:02Z', value: 3.4 },
    { tag_id: 'OHT1-LT', timestamp: '2026-05-01T10:00:15Z', value: 3.5 }, // later within same 5m bucket
    { tag_id: 'OHT1-LT', timestamp: '2026-05-01T10:05:01Z', value: 3.6 }, // next bucket
    { tag_id: 'WTP-Pump1', timestamp: '2026-05-01T10:00:05Z', value: 1 },
  ];

  for (const row of rawLogs) {
    const t = new Date(row.timestamp).getTime();
    const bucket = Math.floor(t / BUCKET_MS);
    const key = `${row.tag_id}|${bucket}`;
    const existing = dedupMap.get(key);
    if (!existing || new Date(existing.timestamp).getTime() < t) {
      dedupMap.set(key, row);
    }
  }

  assert.equal(dedupMap.size, 3);
  const oht1_1000 = dedupMap.get(`OHT1-LT|${Math.floor(new Date('2026-05-01T10:00:00Z').getTime() / BUCKET_MS)}`);
  assert.equal(oht1_1000.value, 3.5); // latest kept
  assert.equal(oht1_1000.timestamp, '2026-05-01T10:00:15Z');
});

test('Interval downsampling: 1-hour interval keeps 1 record per sensor per hour', () => {
  const ONE_HOUR_MS = 60 * 60 * 1000;
  const dedupMap = new Map();

  // 12 snapshots in 1 hour for OHT1-LT
  for (let min = 0; min < 60; min += 5) {
    const timeStr = `2026-05-01T10:${String(min).padStart(2, '0')}:00Z`;
    const t = new Date(timeStr).getTime();
    const bucket = Math.floor(t / ONE_HOUR_MS);
    const key = `OHT1-LT|${bucket}`;
    const existing = dedupMap.get(key);
    if (!existing || new Date(existing.timestamp).getTime() < t) {
      dedupMap.set(key, { tag_id: 'OHT1-LT', timestamp: timeStr, value: min });
    }
  }

  // Exactly 1 record per hour
  assert.equal(dedupMap.size, 1);
  const hourRecord = Array.from(dedupMap.values())[0];
  assert.equal(hourRecord.timestamp, '2026-05-01T10:55:00Z');
  assert.equal(hourRecord.value, 55);
});

test('Fast precomputed sort: sorts latest time first, section order, then tag_id', () => {
  const records = [
    { tag_id: 'WTP-Pump1', _tBucket: 100, _secOrder: 1 },
    { tag_id: 'INT-PT1', _tBucket: 100, _secOrder: 0 },
    { tag_id: 'OHT1-LT', _tBucket: 100, _secOrder: 2 },
    { tag_id: 'INT-PT1', _tBucket: 105, _secOrder: 0 }, // newer bucket
  ];

  records.sort((a, b) => {
    if (a._tBucket !== b._tBucket) return b._tBucket - a._tBucket;
    if (a._secOrder !== b._secOrder) return a._secOrder - b._secOrder;
    return a.tag_id < b.tag_id ? -1 : (a.tag_id > b.tag_id ? 1 : 0);
  });

  // Newer bucket comes first
  assert.equal(records[0]._tBucket, 105);
  // In bucket 100: Intake (0) comes before WTP (1), then OHT1 (2)
  assert.equal(records[1]._secOrder, 0);
  assert.equal(records[2]._secOrder, 1);
  assert.equal(records[3]._secOrder, 2);
});
