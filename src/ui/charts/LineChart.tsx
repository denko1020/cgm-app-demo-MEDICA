import Svg, { Defs, Line, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';

import { colors } from '../theme';

export interface LineSeries {
  values: number[];
  color: string;
  width?: number;
  dashed?: boolean;
  /** Catmull-Rom smoothing instead of straight segments between points */
  smooth?: boolean;
  /** Fill the area under this series with a fade-to-transparent gradient */
  areaFill?: boolean;
  /** Colour each point-to-point segment by its value instead of a flat `color` (e.g. red when low) */
  colorForValue?: (value: number) => string;
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

  /** Catmull-Rom through the points, converted to cubic Bézier segments. */
  const toSmoothPath = (values: number[]) => {
    if (values.length < 3) return toPath(values);
    const pts = values.map((v, i) => [x(i), y(v)] as const);
    let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i += 1) {
      const p0 = pts[i - 1] ?? pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] ?? p2;
      const c1x = p1[0] + (p2[0] - p0[0]) / 6;
      const c1y = p1[1] + (p2[1] - p0[1]) / 6;
      const c2x = p2[0] - (p3[0] - p1[0]) / 6;
      const c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    return d;
  };
  /** One tiny straight segment per point pair, each stroked by its own value-based colour. */
  const toColoredSegments = (values: number[], colorForValue: (value: number) => string) => {
    const segments: { d: string; color: string }[] = [];
    for (let i = 0; i < values.length - 1; i += 1) {
      const v0 = values[i];
      const v1 = values[i + 1];
      segments.push({
        d: `M${x(i).toFixed(1)},${y(v0).toFixed(1)} L${x(i + 1).toFixed(1)},${y(v1).toFixed(1)}`,
        color: colorForValue((v0 + v1) / 2),
      });
    }
    return segments;
  };
  const areaUnderPath = (values: number[], linePath: string) => {
    const baseY = padT + plotH;
    return `${linePath} L${x(values.length - 1).toFixed(1)},${baseY.toFixed(1)} L${x(0).toFixed(1)},${baseY.toFixed(1)} Z`;
  };
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
      <Defs>
        {series.map((s, idx) =>
          s.areaFill ? (
            <LinearGradient key={`grad${idx}`} id={`chartArea${idx}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={s.color} stopOpacity={0.28} />
              <Stop offset="1" stopColor={s.color} stopOpacity={0} />
            </LinearGradient>
          ) : null,
        )}
      </Defs>
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
      {series.map((s, idx) => {
        if (!s.areaFill) return null;
        const linePath = s.smooth ? toSmoothPath(s.values) : toPath(s.values);
        return (
          <Path key={`area${idx}`} d={areaUnderPath(s.values, linePath)} stroke="none" fill={`url(#chartArea${idx})`} />
        );
      })}
      {series.map((s, idx) => {
        if (s.colorForValue) {
          return toColoredSegments(s.values, s.colorForValue).map((seg, i) => (
            <Path key={`seg-${idx}-${i}`} d={seg.d} stroke={seg.color} strokeWidth={s.width ?? 2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          ));
        }
        const linePath = s.smooth ? toSmoothPath(s.values) : toPath(s.values);
        return (
          <Path
            key={idx}
            d={linePath}
            stroke={s.color}
            strokeWidth={s.width ?? 2}
            strokeDasharray={s.dashed ? '4 3' : undefined}
            fill="none"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        );
      })}
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
