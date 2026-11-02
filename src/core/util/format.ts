import type { GlucoseUnit, Trend } from '../types';

let counter = 0;
export function newId(): string {
  counter += 1;
  return `${Date.now().toString(36)}-${counter.toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function toDisplayUnit(mgdl: number, unit: GlucoseUnit): string {
  if (unit === 'mmol/L') return (mgdl / 18.016).toFixed(1);
  return String(Math.round(mgdl));
}

export function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function formatDateTime(ts: number): string {
  const d = new Date(ts);
  const month = d.toLocaleString('en-US', { month: 'short' });
  return `${month} ${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function daysBetween(fromTs: number, toTs: number): number {
  return (toTs - fromTs) / 86_400_000;
}

/** The familiar CGM notation: doubled arrows for the fastest moves. */
export function trendArrow(trend: Trend): string {
  switch (trend) {
    case 'up':
      return '⇈';
    case 'upModerate':
      return '↑';
    case 'upSlight':
      return '↗';
    case 'flat':
      return '→';
    case 'downSlight':
      return '↘';
    case 'downModerate':
      return '↓';
    case 'down':
      return '⇊';
    default:
      return '·';
  }
}

/** Date stamp for the Live Data panel, e.g. "2026-11-02 (Mon)". */
export function formatDateLabel(ts: number, locale: string): string {
  const d = new Date(ts);
  const weekday = d.toLocaleDateString(locale, { weekday: 'short' });
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} (${weekday})`;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}
