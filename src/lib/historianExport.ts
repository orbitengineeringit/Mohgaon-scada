import { format, startOfDay, endOfDay } from 'date-fns';
import ExcelJS from 'exceljs';
import { supabase } from '@/integrations/supabase/client';
import { logError } from '@/lib/errorLogger';

export type ExportInterval = 'all' | '1m' | '30m' | '1h' | '1d';
export type ExportFormat = 'excel' | 'csv';

export const INTERVAL_MS: Record<Exclude<ExportInterval, 'all'>, number> = {
  '1m': 60_000,
  '30m': 30 * 60_000,
  '1h': 60 * 60_000,
  '1d': 24 * 60 * 60_000,
};

export const INTERVAL_LABEL: Record<ExportInterval, string> = {
  'all': 'All data',
  '1m': 'Every 1 minute',
  '30m': 'Every 30 minutes',
  '1h': 'Every 1 hour',
  '1d': 'Every 1 day',
};

// Sensors not installed at Mohgaon plant
export const UNINSTALLED_TAG_IDS = [
  'WTP-Pump3', 'WTP-Pump4', 'WTP-PT3', 'WTP-PT4', 'WTP-CombinedPT1', 'WTP-CombinedPT2', 'WTP-KW', 'INT-KW',
  'OHT1-Flow-OUT', 'OHT1-FCV', 'OHT2-Flow-OUT', 'OHT2-FCV',
  'OHT3-Flow-OUT', 'OHT3-FCV', 'OHT3-EFM1-1', 'OHT3-EFM2-1', 'OHT3-EFM2-2',
  'OHT4-Flow-OUT', 'OHT4-FCV',
];
export const UNINSTALLED_TAGS_FILTER = `("${UNINSTALLED_TAG_IDS.join('","')}")`;

export interface HistorianLog {
  id: string;
  tag_id: string;
  section: string;
  value: number;
  timestamp: string;
  received_at?: string | null;
  tag_config?: {
    label: string;
    unit: string;
  } | null;
}

export interface HistorianLogInternal extends HistorianLog {
  _tBucket: number;
  _secOrder: number;
}

export interface TagConfigMeta {
  label: string;
  unit: string;
  section?: string;
}

export interface TimeSlice {
  start: string;
  end: string;
  label: string;
}

export interface ExportProgressState {
  open: boolean;
  phase: 'preparing' | 'fetching' | 'building' | 'downloading' | 'done';
  sliceCurrent: number;
  sliceTotal: number;
  sliceLabel?: string;
  fetched: number;
  estimatedTotal?: number;
  deduplicatedCount: number;
  buildProgress?: number;
  estSec: number;
  startedAt: number;
  message?: string;
}

export interface ExportOptions {
  startDate: Date;
  endDate: Date;
  plantName: string;
  exportInterval: ExportInterval;
  exportFormat?: ExportFormat;
  sectionFilters: ('intake' | 'oht' | 'wtp')[];
  ohtPrefixes: string[];
  abortSignal?: AbortSignal;
  onProgress?: (progress: ExportProgressState) => void;
}

/** Derive a sub-section label like OHT-1 / OHT-2 / OHT-3 from a tag_id (e.g. "OHT1-LT"). */
export const getDisplaySection = (section: string, tagId: string): string => {
  const sec = section.toLowerCase();
  if (sec === 'oht') {
    const m = tagId.match(/^OHT[-_\s]*([0-9]+)/i);
    if (m) {
      const num = m[1];
      if (num === '1') return 'OHT - 1 Ward No 04 - 300KL';
      if (num === '2') return 'OHT - 2 Ward No 06 500KL';
      if (num === '3') return 'OHT - 3 Ward No 06 200KL';
      if (num === '4') return 'OHT - 4 Ward No 10 200KL';
      return `OHT-${num}`;
    }
    return 'OHT';
  }
  return section.toUpperCase();
};

/** Sort priority: Intake (0) → WTP (1) → OHT-1 (2) → OHT-2 (3) → OHT-3 (4) … */
export const getSectionOrder = (section: string, tagId: string): number => {
  const sec = section.toLowerCase();
  if (sec === 'intake') return 0;
  if (sec === 'wtp') return 1;
  if (sec === 'oht') {
    const m = tagId.match(/^OHT[-_\s]*([0-9]+)/i);
    const n = m ? parseInt(m[1], 10) : 99;
    return 1 + n;
  }
  return 99;
};

export const getSensorType = (tagId: string, label: string): string => {
  const normalized = (label + ' ' + tagId).toLowerCase();
  if (normalized.includes('pump')) return 'Pump';
  if (normalized.includes('level') || normalized.includes('-lt')) return 'Level';
  if (normalized.includes('pressure') || normalized.includes('-pt')) return 'Pressure';
  if (normalized.includes('totalizer')) return 'Totalizer';
  if (normalized.includes('flow') || normalized.includes('-ft')) return 'Flow';
  if (normalized.includes('ph')) return 'pH';
  if (normalized.includes('turbidity')) return 'Turbidity';
  if (normalized.includes('chlorine')) return 'Chlorine';
  if (normalized.includes('kw') || normalized.includes('energy')) return 'Energy';
  return 'Other';
};

/**
 * Automatically determine optimal time-slice duration based on total date range.
 * - <= 7 days: 1 day per slice (1-7 slices)
 * - <= 31 days: 3 days per slice (~10 slices)
 * - <= 90 days: 5 days per slice (~18 slices)
 * - > 90 days: 7 days per slice (~26 slices for 6 months)
 * This prevents firing hundreds of micro-queries while keeping each query's offset small.
 */
export function getOptimalSliceDays(startDate: Date, endDate: Date): number {
  const diffMs = Math.abs(endOfDay(endDate).getTime() - startOfDay(startDate).getTime());
  const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  if (diffDays <= 7) return 1;
  if (diffDays <= 31) return 3;
  if (diffDays <= 90) return 5;
  return 7;
}

/**
 * Generate non-overlapping time slices for the requested range.
 * Uses index-bounded queries (`gte(start).lt(end)`), keeping offsets within safe limits
 * while reducing HTTP request overhead for long ranges (like 6 months).
 */
export function generateTimeSlices(
  startDate: Date,
  endDate: Date,
  sliceDurationDays?: number
): TimeSlice[] {
  const duration = sliceDurationDays ?? getOptimalSliceDays(startDate, endDate);
  const slices: TimeSlice[] = [];
  const startMs = startOfDay(startDate).getTime();
  const endMs = endOfDay(endDate).getTime();
  const sliceMs = duration * 24 * 60 * 60 * 1000;

  let currentStart = startMs;
  while (currentStart < endMs) {
    const nextStart = currentStart + sliceMs;
    // For the last slice, cover up to the millisecond after endMs so .lt() includes endMs
    const currentEnd = nextStart > endMs ? endMs + 1 : nextStart;

    const sliceStartD = new Date(currentStart);
    const sliceEndD = new Date(Math.min(currentEnd - 1, endMs));
    const label = duration > 1
      ? `${format(sliceStartD, 'd MMM')} – ${format(sliceEndD, 'd MMM yyyy')}`
      : format(sliceStartD, 'd MMM yyyy');

    slices.push({
      start: new Date(currentStart).toISOString(),
      end: new Date(currentEnd).toISOString(),
      label,
    });

    currentStart = nextStart;
  }

  return slices;
}

/** Pre-allocated shared ExcelJS style definitions */
const ROW_FILL_OHT = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFECFDF5' } };
const ROW_FILL_INTAKE = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFEFF6FF' } };
const ROW_FILL_WTP = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFFFFBEB' } };
const ROW_FILL_EVEN = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFF8FAFC' } };
const ROW_FILL_ODD = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFFFFFFF' } };

const FONT_REGULAR = { name: 'Segoe UI', size: 10, color: { argb: 'FF1F2937' } };
const FONT_SEC_OHT = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF047857' } };
const FONT_SEC_INTAKE = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF1D4ED8' } };
const FONT_SEC_WTP = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFB45309' } };
const FONT_SEC_DEFAULT = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF334155' } };

const FONT_VAL_NUM = { name: 'Consolas', size: 11, bold: true, color: { argb: 'FF111827' } };
const FONT_VAL_ON = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF059669' } };
const FONT_VAL_OFF = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFDC2626' } };
const FONT_UNIT = { name: 'Segoe UI', size: 9, italic: true, color: { argb: 'FF6B7280' } };

const BORDER_HAIR = { bottom: { style: 'hair' as const, color: { argb: 'FFE5E7EB' } } };
const ALIGN_LEFT = { vertical: 'middle' as const, horizontal: 'left' as const };
const ALIGN_RIGHT = { vertical: 'middle' as const, horizontal: 'right' as const };

/** Pre-fetches tag_config lookup table once upfront */
export async function fetchTagConfigMap(): Promise<Map<string, TagConfigMeta>> {
  const map = new Map<string, TagConfigMeta>();
  try {
    const { data, error } = await supabase
      .from('tag_config')
      .select('id, tag_id, label, unit, section');

    if (error) {
      logError('historianExport.fetchTagConfigMap', error);
      return map;
    }

    if (data) {
      for (const item of data) {
        const meta: TagConfigMeta = {
          label: item.label || item.tag_id,
          unit: item.unit || '',
          section: item.section,
        };
        map.set(item.tag_id, meta);
        if (item.id) map.set(item.id, meta);
      }
    }
  } catch (err) {
    logError('historianExport.fetchTagConfigMap', err);
  }
  return map;
}

/**
 * Executes a Supabase query with up to 4 automatic retries and exponential backoff.
 * Attaches the abortSignal to both retry loop and query builder to abort network fetches.
 */
async function fetchPageWithRetry<T>(
  queryFn: (signal?: AbortSignal) => Promise<{ data: T[] | null; error: any }>,
  abortSignal?: AbortSignal,
  maxRetries = 4
): Promise<T[]> {
  let attempt = 0;
  while (attempt < maxRetries) {
    if (abortSignal?.aborted) throw new Error('Export aborted by user');
    try {
      const { data, error } = await queryFn(abortSignal);
      if (error) throw error;
      return data || [];
    } catch (err: any) {
      if (abortSignal?.aborted) throw new Error('Export aborted by user');
      attempt++;
      if (attempt >= maxRetries) {
        throw new Error(`Query failed after ${maxRetries} attempts: ${err?.message || err}`);
      }
      const delay = Math.min(4000, Math.pow(2, attempt) * 400 + Math.random() * 200);
      await new Promise(res => setTimeout(res, delay));
    }
  }
  return [];
}

/**
 * Populate an individual worksheet with title, metadata header, column headers, and data rows.
 * Automatically adapts between rich cell-level styling (for <= 50,000 rows) and
 * high-performance column-level streaming (for > 50,000 rows) to keep RAM usage low.
 */
async function populateWorksheet(
  ws: ExcelJS.Worksheet,
  rows: HistorianLog[],
  plantName: string,
  startDate: Date,
  endDate: Date,
  exportInterval: ExportInterval,
  totalRecordsCount: number,
  sheetTitle: string,
  onProgress?: (pct: number) => void
) {
  ws.views = [{ state: 'frozen', ySplit: 4, showGridLines: false }];

  // Column definitions with base styles
  ws.columns = [
    { key: 'ts', width: 22, style: { font: FONT_REGULAR, alignment: ALIGN_LEFT } },
    { key: 'section', width: 20, style: { font: FONT_SEC_DEFAULT, alignment: ALIGN_LEFT } },
    { key: 'sensor', width: 14, style: { font: FONT_REGULAR, alignment: ALIGN_LEFT } },
    { key: 'label', width: 32, style: { font: FONT_REGULAR, alignment: ALIGN_LEFT } },
    { key: 'value', width: 14, style: { alignment: ALIGN_RIGHT } },
    { key: 'unit', width: 10, style: { font: FONT_UNIT, alignment: ALIGN_LEFT } },
    { key: 'received', width: 23, style: { font: FONT_REGULAR, alignment: ALIGN_LEFT } },
  ];

  // Row 1: Title banner
  ws.mergeCells('A1:G1');
  const titleCell = ws.getCell('A1');
  titleCell.value = `💧  ${plantName.toUpperCase()}  —  ${sheetTitle.toUpperCase()}`;
  titleCell.font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0E7490' } };
  ws.getRow(1).height = 38;

  // Row 2: Metadata / info
  ws.mergeCells('A2:G2');
  const infoCell = ws.getCell('A2');
  const startStr = format(startDate, 'd MMM yyyy');
  const endStr = format(endDate, 'd MMM yyyy');
  const genStr = format(new Date(), 'd MMM yyyy HH:mm');
  const recordsStr = exportInterval === 'all'
    ? `📊 Records in sheet: ${rows.length.toLocaleString()}`
    : `📊 Records: ${rows.length.toLocaleString()}  •  Interval: ${INTERVAL_LABEL[exportInterval]}`;
  infoCell.value = `📅 Range: ${startStr}  →  ${endStr}     ${recordsStr}     🕒 Generated: ${genStr}`;
  infoCell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FF1F2937' } };
  infoCell.alignment = { horizontal: 'center', vertical: 'middle' };
  infoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF9C3' } };
  ws.getRow(2).height = 26;

  // Row 3: Spacer
  ws.getRow(3).height = 6;

  // Row 4: Column headers
  const headerRow = ws.getRow(4);
  const headers = ['⏱  Timestamp', '🏭  Section', '🔧  Sensor Type', '🏷  Label / Tag', '📈  Value', '⚠  Unit', 'Received at (IST)'];
  const headerColors = ['FF2563EB', 'FFDC2626', 'FF7C3AED', 'FF059669', 'FFEA580C', 'FFCA8A04', 'FF0891B2'];
  headers.forEach((h, i) => {
    const c = headerRow.getCell(i + 1);
    c.value = h;
    c.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: headerColors[i] } };
    c.alignment = { horizontal: i === 4 ? 'right' : 'left', vertical: 'middle' };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF064E3B' } };
    c.border = {
      top: { style: 'thin', color: { argb: 'FF334155' } },
      bottom: { style: 'medium', color: { argb: 'FF334155' } },
    };
  });
  headerRow.height = 26;
  ws.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4, column: 7 } };

  const total = rows.length;
  const isHighDensity = total > 50_000;

  // Data rows
  for (let idx = 0; idx < total; idx++) {
    const log = rows[idx];
    if (!log) continue;

    const isPump = log.tag_id.includes('Pump');
    const label = log.tag_config?.label || log.tag_id;
    const sensorType = getSensorType(log.tag_id, label);
    const valueOut = isPump ? (Number(log.value) >= 1 ? 'ON' : 'OFF') : Number(log.value);
    const tsStr = format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss');
    const recStr = log.received_at ? format(new Date(log.received_at), 'yyyy-MM-dd HH:mm:ss') : '';
    const displaySec = getDisplaySection(log.section, log.tag_id);

    if (isHighDensity) {
      // High-density fast path: array-based row additions (minimal memory overhead)
      const row = ws.addRow([tsStr, displaySec, sensorType, label, valueOut, log.tag_config?.unit || '', recStr]);
      row.height = 20;
      const cVal = row.getCell(5);
      if (typeof valueOut === 'number') {
        cVal.numFmt = '#,##0.00####';
        cVal.font = FONT_VAL_NUM;
      } else {
        cVal.font = valueOut === 'ON' ? FONT_VAL_ON : FONT_VAL_OFF;
      }
    } else {
      // Standard path: rich individual cell fills and borders
      const row = ws.addRow({
        ts: tsStr,
        section: displaySec,
        sensor: sensorType,
        label,
        value: valueOut,
        unit: log.tag_config?.unit || '',
        received: recStr,
      });

      const sec = log.section.toLowerCase();
      const bgFill = sec === 'oht' ? ROW_FILL_OHT : sec === 'intake' ? ROW_FILL_INTAKE : sec === 'wtp' ? ROW_FILL_WTP : (idx % 2 === 0 ? ROW_FILL_EVEN : ROW_FILL_ODD);
      const secFont = sec === 'oht' ? FONT_SEC_OHT : sec === 'intake' ? FONT_SEC_INTAKE : sec === 'wtp' ? FONT_SEC_WTP : FONT_SEC_DEFAULT;

      const c1 = row.getCell(1); c1.fill = bgFill; c1.font = FONT_REGULAR; c1.alignment = ALIGN_LEFT; c1.border = BORDER_HAIR;
      const c2 = row.getCell(2); c2.fill = bgFill; c2.font = secFont; c2.alignment = ALIGN_LEFT; c2.border = BORDER_HAIR;
      const c3 = row.getCell(3); c3.fill = bgFill; c3.font = secFont; c3.alignment = ALIGN_LEFT; c3.border = BORDER_HAIR;
      const c4 = row.getCell(4); c4.fill = bgFill; c4.font = FONT_REGULAR; c4.alignment = ALIGN_LEFT; c4.border = BORDER_HAIR;
      const c5 = row.getCell(5); c5.fill = bgFill; c5.alignment = ALIGN_RIGHT; c5.border = BORDER_HAIR;
      if (typeof valueOut === 'number') {
        c5.numFmt = '#,##0.00####';
        c5.font = FONT_VAL_NUM;
      } else {
        c5.font = valueOut === 'ON' ? FONT_VAL_ON : FONT_VAL_OFF;
      }
      const c6 = row.getCell(6); c6.fill = bgFill; c6.font = FONT_UNIT; c6.alignment = ALIGN_LEFT; c6.border = BORDER_HAIR;
      const c7 = row.getCell(7); c7.fill = bgFill; c7.font = FONT_REGULAR; c7.alignment = ALIGN_LEFT; c7.border = BORDER_HAIR;
    }

    // Yield every 5,000 rows to keep UI responsive
    if (idx > 0 && idx % 5000 === 0) {
      onProgress?.(Math.round((idx / total) * 100));
      await new Promise(res => setTimeout(res, 0));
    }
  }
}

/**
 * Generates and downloads a CSV export file.
 * Highly scalable, consumes minimal RAM even for 1,000,000+ rows.
 */
export function generateCsvDownload(
  rows: HistorianLog[],
  plantName: string,
  startDate: Date,
  endDate: Date,
  exportInterval: ExportInterval
) {
  const chunks: string[] = [];
  chunks.push('Timestamp,Section,Sensor Type,Label,Value,Unit,Received at (IST)\n');

  for (const log of rows) {
    if (!log) continue;
    const isPump = log.tag_id.includes('Pump');
    const label = log.tag_config?.label || log.tag_id;
    const sensorType = getSensorType(log.tag_id, label);
    const valueOut = isPump ? (Number(log.value) >= 1 ? 'ON' : 'OFF') : Number(log.value);
    const ts = format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss');
    const rec = log.received_at ? format(new Date(log.received_at), 'yyyy-MM-dd HH:mm:ss') : '';
    const sec = getDisplaySection(log.section, log.tag_id).replace(/"/g, '""');
    const safeLabel = label.replace(/"/g, '""');
    const unit = (log.tag_config?.unit || '').replace(/"/g, '""');

    chunks.push(`"${ts}","${sec}","${sensorType}","${safeLabel}",${valueOut},"${unit}","${rec}"\n`);
  }

  const blob = new Blob(chunks, { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  const intervalSuffix = exportInterval === 'all' ? '' : `_${exportInterval}`;
  const fileStart = format(startDate, 'd MMM yyyy');
  const fileEnd = format(endDate, 'd MMM yyyy');
  const safePlant = (plantName || 'SCADA').replace(/[\\/:*?"<>|]/g, '');
  link.download = `${safePlant} Scada History ${fileStart} to ${fileEnd}${intervalSuffix}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(link.href), 60_000);
}

/**
 * Main export orchestrator function.
 * 1. Generates adaptive time slices (1-7 days depending on range size)
 * 2. Pre-fetches tag_config lookup table once upfront
 * 3. Concurrent worker pool fetches index-bounded slices with automatic retries and abort signal
 * 4. In-flight deduplication & interval downsampling with precomputed sort keys
 * 5. High-speed O(1) comparator sort
 * 6. Automatic worksheet partitioning for > 300k rows (ensures Excel sheet limits are never breached)
 * 7. Clean file delivery via Excel or CSV
 */
export async function exportHistorianData(options: ExportOptions): Promise<{ totalExported: number }> {
  const {
    startDate,
    endDate,
    plantName,
    exportInterval,
    exportFormat = 'excel',
    sectionFilters,
    ohtPrefixes,
    abortSignal,
    onProgress,
  } = options;

  const startedAt = Date.now();
  const slices = generateTimeSlices(startDate, endDate);
  const totalSlices = slices.length;

  onProgress?.({
    open: true,
    phase: 'preparing',
    sliceCurrent: 0,
    sliceTotal: totalSlices,
    fetched: 0,
    deduplicatedCount: 0,
    estSec: Math.max(3, Math.ceil(totalSlices * 0.4)),
    startedAt,
    message: `Partitioned range into ${totalSlices} time slices. Loading tag metadata…`,
  });

  // Step 1: Pre-fetch tag_config lookup table
  const tagConfigMap = await fetchTagConfigMap();

  if (abortSignal?.aborted) throw new Error('Export aborted by user');

  // Step 2: Set up in-flight deduplication Map
  const DEDUP_BUCKET_MS = exportInterval === 'all' ? 5 * 60 * 1000 : INTERVAL_MS[exportInterval];
  const dedupMap = new Map<string, HistorianLogInternal>();
  let totalRawFetched = 0;
  let completedSlices = 0;

  const useOhtFilter = ohtPrefixes.length > 0 && sectionFilters.includes('oht') && !sectionFilters.includes('intake') && !sectionFilters.includes('wtp');
  const ohtOr = useOhtFilter ? ohtPrefixes.map(p => `tag_id.like.${p}%`).join(',') : null;

  // Step 3: Concurrent time-sliced fetcher (up to 3 parallel slices)
  const CONCURRENCY = Math.min(3, Math.max(1, totalSlices));
  let nextSliceIdx = 0;

  const worker = async () => {
    while (nextSliceIdx < totalSlices) {
      if (abortSignal?.aborted) throw new Error('Export aborted by user');
      const sliceIdx = nextSliceIdx++;
      const slice = slices[sliceIdx];

      let page = 0;
      let hasMore = true;
      const PAGE_SIZE = 1000;

      while (hasMore) {
        if (abortSignal?.aborted) throw new Error('Export aborted by user');
        const from = page * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const pageRows = await fetchPageWithRetry<any>(
          async (signal) => {
            let q = supabase
              .from('historian_logs')
              .select('id, tag_id, section, value, timestamp, received_at')
              .gte('timestamp', slice.start)
              .lt('timestamp', slice.end)
              .not('tag_id', 'in', UNINSTALLED_TAGS_FILTER)
              .or('source.like.%5min%,source.is.null')
              .order('timestamp', { ascending: false })
              .order('tag_id', { ascending: true })
              .range(from, to);

            if (signal) q = q.abortSignal(signal);
            if (sectionFilters.length > 0) q = q.in('section', sectionFilters);
            if (ohtOr) q = q.or(ohtOr);
            return await q;
          },
          abortSignal
        );

        if (pageRows.length > 0) {
          totalRawFetched += pageRows.length;

          // In-flight deduplication & downsampling with precomputed sort keys
          for (const row of pageRows) {
            const t = new Date(row.timestamp).getTime();
            const bucket = Math.floor(t / DEDUP_BUCKET_MS);
            const key = `${row.tag_id}|${bucket}`;
            const existing = dedupMap.get(key);

            if (!existing || new Date(existing.timestamp).getTime() < t) {
              const meta = tagConfigMap.get(row.tag_id);
              dedupMap.set(key, {
                id: row.id,
                tag_id: row.tag_id,
                section: row.section,
                value: row.value,
                timestamp: row.timestamp,
                received_at: row.received_at,
                tag_config: meta ? { label: meta.label, unit: meta.unit } : null,
                _tBucket: bucket,
                _secOrder: getSectionOrder(row.section, row.tag_id),
              });
            }
          }

          if (pageRows.length < PAGE_SIZE) {
            hasMore = false;
          } else {
            page++;
          }
        } else {
          hasMore = false;
        }

        // Live page-level progress feedback
        const elapsed = (Date.now() - startedAt) / 1000;
        const progressSlice = completedSlices + (hasMore ? 0.5 : 1);
        const rate = progressSlice / Math.max(0.1, elapsed);
        const estRemainSec = Math.max(0, Math.ceil((totalSlices - progressSlice) / Math.max(0.1, rate)));

        onProgress?.({
          open: true,
          phase: 'fetching',
          sliceCurrent: Math.min(totalSlices, completedSlices + 1),
          sliceTotal: totalSlices,
          sliceLabel: slice.label,
          fetched: totalRawFetched,
          deduplicatedCount: dedupMap.size,
          estSec: estRemainSec,
          startedAt,
          message: `Gathering records for ${slice.label} (${dedupMap.size.toLocaleString()} records processed)…`,
        });
      }

      completedSlices++;
      const elapsed = (Date.now() - startedAt) / 1000;
      const rate = completedSlices / Math.max(0.1, elapsed);
      const estRemainSec = Math.max(0, Math.ceil((totalSlices - completedSlices) / Math.max(0.1, rate)));

      onProgress?.({
        open: true,
        phase: 'fetching',
        sliceCurrent: completedSlices,
        sliceTotal: totalSlices,
        sliceLabel: slice.label,
        fetched: totalRawFetched,
        deduplicatedCount: dedupMap.size,
        estSec: estRemainSec,
        startedAt,
        message: `Completed slice ${completedSlices} of ${totalSlices} (${slice.label})…`,
      });
    }
  };

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  if (abortSignal?.aborted) throw new Error('Export aborted by user');

  const processed = Array.from(dedupMap.values());
  const totalCount = processed.length;

  if (totalCount === 0) {
    onProgress?.({
      open: false,
      phase: 'done',
      sliceCurrent: totalSlices,
      sliceTotal: totalSlices,
      fetched: 0,
      deduplicatedCount: 0,
      estSec: 0,
      startedAt,
    });
    return { totalExported: 0 };
  }

  // Step 4: Ultra-fast sort using precomputed keys:
  // 1. Time bucket descending (latest first)
  // 2. Section priority ascending (Intake -> WTP -> OHT-1..4)
  // 3. Tag ID alphabetical ascending
  processed.sort((a, b) => {
    if (a._tBucket !== b._tBucket) return b._tBucket - a._tBucket;
    if (a._secOrder !== b._secOrder) return a._secOrder - b._secOrder;
    return a.tag_id < b.tag_id ? -1 : (a.tag_id > b.tag_id ? 1 : 0);
  });

  // Step 5: Deliver file according to requested format
  if (exportFormat === 'csv') {
    onProgress?.({
      open: true,
      phase: 'downloading',
      sliceCurrent: totalSlices,
      sliceTotal: totalSlices,
      fetched: totalRawFetched,
      deduplicatedCount: totalCount,
      estSec: 1,
      startedAt,
      message: 'Generating CSV download…',
    });
    generateCsvDownload(processed, plantName, startDate, endDate, exportInterval);
  } else {
    // Excel export
    onProgress?.({
      open: true,
      phase: 'building',
      sliceCurrent: totalSlices,
      sliceTotal: totalSlices,
      fetched: totalRawFetched,
      deduplicatedCount: totalCount,
      buildProgress: 5,
      estSec: Math.max(2, Math.ceil(totalCount / 20000)),
      startedAt,
      message: 'Constructing Excel workbook…',
    });

    const wb = new ExcelJS.Workbook();
    wb.creator = plantName;
    wb.created = new Date();

    // Excel worksheet partition strategy:
    // <= 300,000 rows: single worksheet 'Historical Records'
    // > 300,000 rows: partition across monthly worksheets to stay safely within memory & Excel limits
    if (totalCount <= 300_000) {
      const ws = wb.addWorksheet('Historical Records');
      await populateWorksheet(
        ws,
        processed,
        plantName,
        startDate,
        endDate,
        exportInterval,
        totalCount,
        'Historical Records',
        (pct) => {
          onProgress?.({
            open: true,
            phase: 'building',
            sliceCurrent: totalSlices,
            sliceTotal: totalSlices,
            fetched: totalRawFetched,
            deduplicatedCount: totalCount,
            buildProgress: Math.min(95, Math.max(5, pct)),
            estSec: 2,
            startedAt,
            message: `Populating spreadsheet rows (${pct}%)…`,
          });
        }
      );
    } else {
      // Partition by month
      const monthMap = new Map<string, HistorianLog[]>();
      for (const log of processed) {
        const mKey = format(new Date(log.timestamp), 'MMM yyyy');
        let arr = monthMap.get(mKey);
        if (!arr) {
          arr = [];
          monthMap.set(mKey, arr);
        }
        arr.push(log);
      }

      let monthIdx = 0;
      const totalMonths = monthMap.size;
      for (const [monthLabel, monthRows] of monthMap.entries()) {
        monthIdx++;
        // Keep worksheet name valid (<= 31 chars in Excel)
        const safeSheetName = monthLabel.substring(0, 31);
        const ws = wb.addWorksheet(safeSheetName);
        await populateWorksheet(
          ws,
          monthRows,
          plantName,
          startDate,
          endDate,
          exportInterval,
          totalCount,
          `${monthLabel} Records`,
          (pct) => {
            const overallPct = Math.round(((monthIdx - 1) / totalMonths) * 100 + (pct / totalMonths));
            onProgress?.({
              open: true,
              phase: 'building',
              sliceCurrent: totalSlices,
              sliceTotal: totalSlices,
              fetched: totalRawFetched,
              deduplicatedCount: totalCount,
              buildProgress: Math.min(95, Math.max(5, overallPct)),
              estSec: 2,
              startedAt,
              message: `Building sheet ${monthIdx}/${totalMonths} (${monthLabel})…`,
            });
          }
        );
      }
    }

    onProgress?.({
      open: true,
      phase: 'downloading',
      sliceCurrent: totalSlices,
      sliceTotal: totalSlices,
      fetched: totalRawFetched,
      deduplicatedCount: totalCount,
      buildProgress: 98,
      estSec: 1,
      startedAt,
      message: 'Compressing and starting download…',
    });

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const intervalSuffix = exportInterval === 'all' ? '' : `_${exportInterval}`;
    const fileStart = format(startDate, 'd MMM yyyy');
    const fileEnd = format(endDate, 'd MMM yyyy');
    const safePlant = (plantName || 'SCADA').replace(/[\\/:*?"<>|]/g, '');
    link.download = `${safePlant} Scada History ${fileStart} to ${fileEnd}${intervalSuffix}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(link.href), 60_000);
  }

  onProgress?.({
    open: true,
    phase: 'done',
    sliceCurrent: totalSlices,
    sliceTotal: totalSlices,
    fetched: totalRawFetched,
    deduplicatedCount: totalCount,
    buildProgress: 100,
    estSec: 0,
    startedAt,
    message: 'Export complete!',
  });

  return { totalExported: totalCount };
}
