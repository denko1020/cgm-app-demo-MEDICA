import { useMemo } from 'react';

import { useStrings } from '@/core/i18n';
import type { Analyte, AppEvent, GlucoseReading, GlucoseUnit, TherapySettings } from '@/core/types';
import { isScenarioEvent } from '@/core/types';
import { analyteSpec, analyteValue } from '@/core/util/analyte';
import { formatTime } from '@/core/util/format';
import { LineChart, type ChartMarker } from '@/ui/charts/LineChart';
import { EVENT_COLOR } from '@/ui/eventStyle';
import { colors } from '@/ui/theme';

interface Props {
  width: number;
  /** CGM readings, oldest first (the full history; the panel shows the tail) */
  readings: GlucoseReading[];
  events: AppEvent[];
  therapy: TherapySettings;
  /** Which measured value to plot */
  analyte: Analyte;
  unit: GlucoseUnit;
}

const SHOW = 180;
const PAD_L = 44;

/**
 * The recent trace for one analyte on a single time axis: its reference range
 * as a band, and every logged event — meals above all — as a labelled vertical
 * marker, so an event and the response in the curve line up.
 */
export function AnalyteChart({ width, readings, events, therapy, analyte, unit }: Props) {
  const t = useStrings();
  const spec = analyteSpec(analyte, therapy, unit);

  const data = useMemo(() => {
    const from = Math.max(0, readings.length - SHOW);
    // Readings stored before the sensor reported ketone and lactate have none;
    // drop them rather than plotting a gap at zero.
    const tail = readings.slice(from).filter((r) => analyteValue(r, analyte) !== undefined);
    const values = tail.map((r) => analyteValue(r, analyte) as number);
    const t0 = tail[0]?.timestamp ?? 0;
    const t1 = tail[tail.length - 1]?.timestamp ?? 0;
    const markers: ChartMarker[] = events
      .filter((e) => e.timestamp >= t0 && e.timestamp <= t1)
      .map((e) => {
        let index = tail.findIndex((r) => r.timestamp >= e.timestamp);
        if (index < 0) index = tail.length - 1;
        if (isScenarioEvent(e)) return { index, color: colors.orange, label: scenarioLabel(e.to, t) };
        return { index, color: EVENT_COLOR[e.kind], label: t.events[e.kind] };
      });
    return { tail, values, markers };
  }, [readings, events, analyte, t]);

  if (data.tail.length < 2) return null;

  // Above the reference range reads red. Glucose also flags the approach to a
  // hypo: below target is red, and within 5% above it orange.
  const nearLowCutoff = spec.low * 1.05;
  const colorForValue =
    analyte === 'glucose'
      ? (v: number) => (v < spec.low ? colors.red : v < nearLowCutoff ? colors.orange : colors.primary)
      : (v: number) => (v > spec.high ? colors.red : colors.primary);

  return (
    <LineChart
      width={width}
      height={180}
      padLeft={PAD_L}
      series={[{ values: data.values, color: colors.primary, width: 3, smooth: true, areaFill: true, colorForValue }]}
      band={{ from: spec.low, to: spec.high }}
      yMin={spec.yMin}
      yMax={spec.yMax}
      yTicks={spec.yTicks}
      yLabel={spec.unit}
      xLabels={[formatTime(data.tail[0].timestamp), formatTime(data.tail[data.tail.length - 1].timestamp)]}
      markers={data.markers}
    />
  );
}

function scenarioLabel(to: string, t: ReturnType<typeof useStrings>): string {
  const s = t.settings;
  switch (to) {
    case 'meal':
      return s.scenarioMeal;
    case 'hypo':
      return s.scenarioHypo;
    case 'hyper':
      return s.scenarioHyper;
    default:
      return s.scenarioNormal;
  }
}
