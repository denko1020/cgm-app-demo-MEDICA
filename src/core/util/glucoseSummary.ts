import type { GlucoseReading, TherapySettings } from '../types';

export interface GlucoseSummary {
  count: number;
  mean: number;
  min: number;
  max: number;
  /** Fraction 0..1 of readings inside [targetLow, targetHigh] */
  timeInRange: number;
}

export function summarize(readings: GlucoseReading[], therapy: TherapySettings, sinceMs?: number): GlucoseSummary | null {
  const cutoff = sinceMs ?? 0;
  const cgm = readings.filter((r) => r.source === 'cgm' && r.timestamp >= cutoff);
  if (cgm.length === 0) return null;
  const values = cgm.map((r) => r.value);
  const inRange = values.filter((v) => v >= therapy.targetLow && v <= therapy.targetHigh).length;
  return {
    count: values.length,
    mean: values.reduce((a, b) => a + b, 0) / values.length,
    min: Math.min(...values),
    max: Math.max(...values),
    timeInRange: inRange / values.length,
  };
}
