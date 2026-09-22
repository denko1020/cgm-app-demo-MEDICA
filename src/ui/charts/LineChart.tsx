import Svg, { Line, Path, Rect, Text as SvgText } from 'react-native-svg';

import { colors } from '../theme';

export interface LineSeries {
  values: number[];
  color: string;
  width?: number;
  dashed?: boolean;
}

export interface ChartMarker {
  /** Index into the series (x position) */
  index: number;
  color?: string;
  label?: string;
}

interface LineChartProps {
  width: number;
  height: number;
  series: LineSeries[];
  /** Highlighted horizontal band, e.g. the glucose target range */
  band?: { from: number; to: number; color?: string };
  yMin?: number;
  yMax?: number;
  xLabels?: string[];
  yTicks?: number[];
  /** Formats each y tick label, e.g. to append a unit such as "%" */
  yTickFormat?: (tick: number) => string;
  /** Axis title drawn vertically along the left edge */
  yLabel?: string;
  /** Fixed left padding so stacked charts share one x axis */
  padLeft?: number;
  /** Horizontal reference line at y = 0 */
  zeroLine?: boolean;
  /** Shade the area between two series (by index) */
  areaBetween?: { a: number; b: number; color: string; opacity?: number };
  /** Vertical event markers */
  markers?: ChartMarker[];
}

/** Dependency-free multi-series line chart drawn with react-native-svg (works on web and native). */
export function LineChart({
  width,
  height,
  series,
  band,
  yMin,
  yMax,
  xLabels = [],
  yTicks = [],
  yTickFormat,
  yLabel,
  padLeft,
  zeroLine,
  areaBetween,
  markers = [],
}: LineChartProps) {
  const padL = padLeft ?? (yLabel ? 44 : 30);
  const padR = 8;
  const padT = 8;
  const padB = xLabels.length ? 20 : 8;
  const all = series.flatMap((s) => s.values);
  const lo = yMin ?? Math.min(...all, band?.from ?? Infinity);
  const hi = yMax ?? Math.max(...all, band?.to ?? -Infinity);
  const n = Math.max(...series.map((s) => s.values.length), 2);
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;
  const x = (i: number) => padL + (i / (n - 1)) * plotW;
  const y = (v: number) => padT + (1 - (v - lo) / Math.max(1, hi - lo)) * plotH;

  const toPath = (values: number[]) =>
    values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const areaPath = (a: number[], b: number[]) => {
    const len = Math.min(a.length, b.length);
    if (len < 2) return '';
    const fwd = a.slice(0, len).map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`);
    const back = b
      .slice(0, len)
      .map((v, i) => `L${x(i).toFixed(1)},${y(v).toFixed(1)}`)
      .reverse();
    return `${fwd.join(' ')} ${back.join(' ')} Z`;
  };

  return (
    <Svg width={width} height={height}>
      {band ? (
        <Rect x={padL} y={y(band.to)} width={plotW} height={Math.max(0, y(band.from) - y(band.to))} fill={band.color ?? colors.greenSoft} />
      ) : null}
      {areaBetween && series[areaBetween.a] && series[areaBetween.b] ? (
        <Path d={areaPath(series[areaBetween.a].values, series[areaBetween.b].values)} fill={areaBetween.color} fillOpacity={areaBetween.opacity ?? 0.6} />
      ) : null}
      {zeroLine && lo <= 0 && hi >= 0 ? <Line x1={padL} y1={y(0)} x2={padL + plotW} y2={y(0)} stroke={colors.textTertiary} strokeWidth={1} strokeDasharray="2 2" /> : null}
      {yTicks.map((t) => (
        <SvgText key={t} x={padL - 4} y={y(t) + 4} fontSize={9} fill={colors.textSecondary} textAnchor="end">
          {yTickFormat ? yTickFormat(t) : t}
        </SvgText>
      ))}
      {yLabel ? (
        <SvgText x={10} y={padT + plotH / 2} fontSize={9} fill={colors.textSecondary} textAnchor="middle" transform={`rotate(-90 10 ${padT + plotH / 2})`}>
          {yLabel}
        </SvgText>
      ) : null}
      <Line x1={padL} y1={padT} x2={padL} y2={padT + plotH} stroke={colors.separator} strokeWidth={1} />
      <Line x1={padL} y1={padT + plotH} x2={padL + plotW} y2={padT + plotH} stroke={colors.separator} strokeWidth={1} />
      {series.map((s, idx) => (
        <Path
          key={idx}
          d={toPath(s.values)}
          stroke={s.color}
          strokeWidth={s.width ?? 2}
          strokeDasharray={s.dashed ? '4 3' : undefined}
          fill="none"
          strokeLinejoin="round"
        />
      ))}
      {markers.map((m, i) => (
        <Line key={`m${i}`} x1={x(m.index)} y1={padT} x2={x(m.index)} y2={padT + plotH} stroke={m.color ?? colors.orange} strokeWidth={1} strokeDasharray="3 2" />
      ))}
      {markers
        .filter((m) => m.label)
        .map((m, i) => (
          <SvgText key={`ml${i}`} x={Math.min(x(m.index) + 3, padL + plotW - 2)} y={padT + 9} fontSize={8} fill={m.color ?? colors.orange} textAnchor="start">
            {m.label}
          </SvgText>
        ))}
      {xLabels.map((label, i) => (
        <SvgText
          key={`${label}-${i}`}
          x={padL + (i / Math.max(1, xLabels.length - 1)) * plotW}
          y={height - 6}
          fontSize={9}
          fill={colors.textSecondary}
          textAnchor="middle"
        >
          {label}
        </SvgText>
      ))}
    </Svg>
  );
}
