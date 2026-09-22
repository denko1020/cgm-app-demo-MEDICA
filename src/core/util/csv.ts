import type { GlucoseReading, GlucoseUnit, ScenarioEvent } from '../types';
import { toDisplayUnit } from './format';

const HEADER = ['timestamp_iso', 'timestamp_ms', 'source', 'device_id', 'value_mgdl', 'value_display', 'unit', 'raw_mgdl', 'trend', 'uploaded', 'note', 'id'];

function cell(v: string | number | boolean): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Serialises readings and scenario switches in one timeline, oldest first, as RFC 4180 CSV.
 * Reading rows keep values in mg/dL (value_display follows the chosen unit); switch rows
 * carry source "scenario" and the change in the note column, with the value columns empty.
 */
export function readingsToCsv(readings: GlucoseReading[], events: ScenarioEvent[], unit: GlucoseUnit): string {
  const lines: { ts: number; cells: (string | number | boolean)[] }[] = [
    ...readings.map((r) => ({
      ts: r.timestamp,
      cells: [new Date(r.timestamp).toISOString(), r.timestamp, r.source, r.deviceId, r.value, toDisplayUnit(r.value, unit), unit, r.raw, r.trend, r.uploaded, '', r.id],
    })),
    ...events.map((e) => ({
      ts: e.timestamp,
      cells: [new Date(e.timestamp).toISOString(), e.timestamp, 'scenario', '', '', '', '', '', '', '', `scenario ${e.from} -> ${e.to}`, e.id],
    })),
  ];
  lines.sort((a, b) => a.ts - b.ts);
  return [HEADER.join(','), ...lines.map((l) => l.cells.map(cell).join(','))].join('\r\n') + '\r\n';
}

export function csvFilename(now: number): string {
  const d = new Date(now);
  const p = (n: number) => (n < 10 ? `0${n}` : String(n));
  return `cgm-readings-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.csv`;
}
