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

/** Satiety index (%): the chart range 40–300 mg/dL mapped linearly onto 0–100 %. */
export const INDEX_GLUCOSE_MIN = 40;
export const INDEX_GLUCOSE_MAX = 300;
export function satietyIndex(mgdl: number): number {
  const pct = ((mgdl - INDEX_GLUCOSE_MIN) / (INDEX_GLUCOSE_MAX - INDEX_GLUCOSE_MIN)) * 100;
  return Math.round(Math.min(100, Math.max(0, pct)));
}

/** Health index (%) = 100 − satiety index, so lower glucose reads as a higher score. */
export function healthIndex(mgdl: number): number {
  return 100 - satietyIndex(mgdl);
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

export function trendArrow(trend: Trend): string {
  switch (trend) {
    case 'up':
      return '↑';
    case 'upSlight':
      return '↗';
    case 'flat':
      return '→';
    case 'downSlight':
      return '↘';
    case 'down':
      return '↓';
    default:
      return '·';
  }
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}
