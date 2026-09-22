import { useMemo } from 'react';

import { useStrings } from '@/core/i18n';
import type { GlucoseReading, ScenarioEvent, TherapySettings } from '@/core/types';
import { formatTime, healthIndex } from '@/core/util/format';
import { LineChart, type ChartMarker } from '@/ui/charts/LineChart';
import { colors } from '@/ui/theme';

interface Props {
  width: number;
  /** CGM readings, oldest first (the full history; the panel shows the tail) */
  readings: GlucoseReading[];
  events: ScenarioEvent[];
  therapy: TherapySettings;
  health: boolean;
}

const SHOW = 180;
const PAD_L = 44;

/**
 * The recent glucose trace on one time axis: the target range as a band and
 * scenario switches as vertical markers, so a change in Settings and the
 * response in the curve line up. Follows the Home view mode, showing either
 * mg/dL or the derived health index.
 */
export function GlucoseChart({ width, readings, events, therapy, health }: Props) {
  const t = useStrings();

  const data = useMemo(() => {
    const from = Math.max(0, readings.length - SHOW);
    const tail = readings.slice(from);
    const toView = (v: number) => (health ? healthIndex(v) : v);
    const values = tail.map((r) => toView(r.value));
    const t0 = tail[0]?.timestamp ?? 0;
    const t1 = tail[tail.length - 1]?.timestamp ?? 0;
    const markers: ChartMarker[] = events
      .filter((e) => e.timestamp >= t0 && e.timestamp <= t1)
      .map((e) => {
        let idx = tail.findIndex((r) => r.timestamp >= e.timestamp);
        if (idx < 0) idx = tail.length - 1;
        return { index: idx, color: colors.orange, label: labelFor(e, t) };
      });
    return { tail, values, markers };
  }, [readings, events, health, t]);

  if (data.tail.length < 2) return null;

  const band = health
    ? { from: healthIndex(therapy.targetHigh), to: healthIndex(therapy.targetLow) }
    : { from: therapy.targetLow, to: therapy.targetHigh };

  return (
    <LineChart
      width={width}
      height={180}
      padLeft={PAD_L}
      series={[{ values: data.values, color: colors.primary, width: 3, smooth: true, areaFill: true }]}
      band={band}
      yMin={health ? 0 : 40}
      yMax={health ? 100 : 300}
      yTicks={health ? [25, 50, 75, 100] : [70, 180, 250]}
      yTickFormat={health ? (v) => `${v}%` : undefined}
      yLabel={health ? t.home.healthAxis : 'mg/dL'}
      xLabels={[formatTime(data.tail[0].timestamp), formatTime(data.tail[data.tail.length - 1].timestamp)]}
      markers={data.markers}
    />
  );
}

function labelFor(e: ScenarioEvent, t: ReturnType<typeof useStrings>): string {
  const s = t.settings;
  switch (e.to) {
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
