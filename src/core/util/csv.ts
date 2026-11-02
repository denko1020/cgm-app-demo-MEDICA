import type { AppEvent, GlucoseReading, GlucoseUnit } from '../types';
import { isScenarioEvent } from '../types';
import { toDisplayUnit } from './format';

const HEADER = [
  'timestamp_iso',
  'timestamp_ms',
  'source',
  'device_id',
  'value_mgdl',
  'value_display',
  'unit',
  'ketone_mmoll',
  'lactate_mmoll',
  'raw_mgdl',
  'trend',
  'uploaded',
  'note',
  'id',
];

function cell(v: string | number | boolean): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Serialises readings and the event timeline together, oldest first, as RFC 4180 CSV.
 * Reading rows keep glucose in mg/dL (value_display follows the chosen unit) and carry
 * ketone and lactate in mmol/L. Event rows leave the value columns empty and name
 * themselves in the note column: source "scenario" for a simulator switch, "event" for
 * a meal, workout, sleep or dose the wearer logged.
 */
export function readingsToCsv(readings: GlucoseReading[], events: AppEvent[], unit: GlucoseUnit): string {
  const blankValues = ['', '', '', '', '', '', '', ''];
  const lines: { ts: number; cells: (string | number | boolean)[] }[] = [
    ...readings.map((r) => ({
      ts: r.timestamp,
      cells: [
        new Date(r.timestamp).toISOString(),
        r.timestamp,
        r.source,
        r.deviceId,
        r.value,
        toDisplayUnit(r.value, unit),
        unit,
        r.ketone ?? '',
        r.lactate ?? '',
        r.raw,
        r.trend,
        r.uploaded,
        '',
        r.id,
      ],
    })),
    ...events.map((e) => ({
      ts: e.timestamp,
      cells: isScenarioEvent(e)
        ? [new Date(e.timestamp).toISOString(), e.timestamp, 'scenario', ...blankValues, `scenario ${e.from} -> ${e.to}`, e.id]
        : [new Date(e.timestamp).toISOString(), e.timestamp, 'event', ...blankValues, e.kind, e.id],
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
