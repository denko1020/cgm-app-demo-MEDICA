import type { Analyte, GlucoseReading, GlucoseUnit, TherapySettings, Trend } from '../types';
import { toDisplayUnit } from './format';

/** Reading status against the analyte's reference range. */
export type AnalyteStatus = 'low' | 'inRange' | 'high';

/**
 * Everything the Home card, the chart and the Readings list need to show one
 * analyte, in one place so the three never disagree about a range or a unit.
 */
export interface AnalyteSpec {
  /** Bottom of the reference range; 0 for the analytes where only a high value matters */
  low: number;
  /** Top of the reference range */
  high: number;
  yMin: number;
  yMax: number;
  yTicks: number[];
  decimals: number;
  unit: string;
}

/** mmol/L for both of the non-glucose electrodes. */
const MMOL = 'mmol/L';

/**
 * Reference ranges. Glucose follows the wearer's own therapy targets; ketone
 * and lactate use the usual clinical bands (ketone normal below 0.6 mmol/L,
 * resting lactate up to about 2.2 mmol/L), where only the upper bound is a
 * finding — so their lower bound is 0 and nothing ever reads as "Low".
 */
export function analyteSpec(analyte: Analyte, therapy: TherapySettings, glucoseUnit: GlucoseUnit): AnalyteSpec {
  switch (analyte) {
    case 'ketone':
      return { low: 0, high: 0.6, yMin: 0, yMax: 3, yTicks: [0.6, 1.5, 3], decimals: 2, unit: MMOL };
    case 'lactate':
      return { low: 0, high: 2.2, yMin: 0, yMax: 8, yTicks: [2.2, 5, 8], decimals: 1, unit: MMOL };
    default:
      return {
        low: therapy.targetLow,
        high: therapy.targetHigh,
        yMin: 40,
        yMax: 300,
        yTicks: [70, 180, 250],
        decimals: 0,
        unit: glucoseUnit,
      };
  }
}

/**
 * The analyte's value on a reading, in its own unit. Readings stored before the
 * sensor reported ketone and lactate have none, so those come back undefined.
 */
export function analyteValue(reading: GlucoseReading, analyte: Analyte): number | undefined {
  switch (analyte) {
    case 'ketone':
      return reading.ketone;
    case 'lactate':
      return reading.lactate;
    default:
      return reading.value;
  }
}

/** Formats a value for display, converting glucose into the wearer's chosen unit. */
export function formatAnalyte(value: number, analyte: Analyte, glucoseUnit: GlucoseUnit): string {
  if (analyte === 'glucose') return toDisplayUnit(value, glucoseUnit);
  return value.toFixed(analyte === 'ketone' ? 2 : 1);
}

export function analyteStatus(value: number, spec: AnalyteSpec): AnalyteStatus {
  if (value < spec.low) return 'low';
  if (value > spec.high) return 'high';
  return 'inRange';
}

/** Readings looked back over to work out which way a value is heading. */
const TREND_SPAN = 3;

/** Span of the glucose axis (40-300 mg/dL); the rate ladder below is calibrated against it. */
export const GLUCOSE_AXIS_RANGE = 260;

/**
 * Per-reading change separating the three rates, as a fraction of the analyte's
 * own axis. On the glucose axis they come out as 1, 2.5 and 4.5 mg/dL per
 * reading. The floor clears the sensor noise — sd 2.5 averaged over TREND_SPAN
 * readings is about 1.4 — while the ceiling sits under the steepest part of a
 * post-prandial excursion, so the fastest state is actually reachable.
 */
const SLIGHT_PER_RANGE = 1 / GLUCOSE_AXIS_RANGE;
const MODERATE_PER_RANGE = 2.5 / GLUCOSE_AXIS_RANGE;
const STEEP_PER_RANGE = 4.5 / GLUCOSE_AXIS_RANGE;

/**
 * Turns an averaged per-reading change into one of the seven trend states.
 * `range` is the span of the analyte's axis, so the same ladder reads correctly
 * for mg/dL and for the two mmol/L electrodes.
 */
export function classifyTrend(perReading: number, range: number): Trend {
  if (perReading > range * STEEP_PER_RANGE) return 'up';
  if (perReading > range * MODERATE_PER_RANGE) return 'upModerate';
  if (perReading > range * SLIGHT_PER_RANGE) return 'upSlight';
  if (perReading < -range * STEEP_PER_RANGE) return 'down';
  if (perReading < -range * MODERATE_PER_RANGE) return 'downModerate';
  if (perReading < -range * SLIGHT_PER_RANGE) return 'downSlight';
  return 'flat';
}

/**
 * Which way the analyte on display is heading, over the last few readings.
 * The value stored on a reading is the glucose trend, so ketone and lactate
 * need their own, measured on their own scale.
 */
export function analyteTrend(readings: GlucoseReading[], analyte: Analyte, spec: AnalyteSpec): Trend {
  const series = readings.filter((r) => analyteValue(r, analyte) !== undefined);
  if (series.length < 2) return 'unknown';
  const latest = analyteValue(series[series.length - 1], analyte) as number;
  const span = Math.min(TREND_SPAN, series.length - 1);
  const ref = analyteValue(series[series.length - 1 - span], analyte) as number;
  return classifyTrend((latest - ref) / span, spec.yMax - spec.yMin);
}
