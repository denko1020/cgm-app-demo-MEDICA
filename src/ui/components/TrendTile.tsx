import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import type { Trend } from '@/core/types';
import { type Colors, useColors } from '@/ui/theme';

interface Props {
  trend: Trend;
  /** Width of the dial in points. The chevrons stack above and below it, so the
   *  rendered height is about twice this. */
  size?: number;
}

/**
 * Artwork box, in the proportions measured off the design: the ring is 96 across
 * and the chevrons fill the 44 above and below it, for 189 in total.
 */
const VB_W = 96;
const VB_H = 189;
const CX = VB_W / 2;
const CY = 94;
/** Centre-line radius; the ring is stroked RING_STROKE wide around it. */
const R = 43;
const RING_STROKE = 10;
const CHEVRON_STROKE = 8;

/**
 * The arc bands above the ring, innermost first. `base` is where the arc's ends
 * sit and `apex` its peak, both on the centre line. Mirrored under the ring.
 *
 * On the centre line the two strokes clear each other by 7. Both sit further
 * out than the artwork they came from, which opens a gap of 5 for the tip
 * beyond them without pushing it off the box.
 */
const ARCS = [
  { w: 62, base: 44, apex: 33 },
  { w: 43, base: 25, apex: 18 },
];

/** One tip plus the arcs: how many bands stack on each side of the ring. */
const BANDS = ARCS.length + 1;

/**
 * Clock position of the needle for each state, as an SVG rotation where 0 points
 * straight up: 12 o'clock is the fastest rise, 6 o'clock the fastest fall.
 * `null` draws the steady dots instead.
 */
const ANGLE: Record<Trend, number | null> = {
  up: 0,
  upModerate: 30,
  upSlight: 60,
  flat: null,
  downSlight: 120,
  downModerate: 150,
  down: 180,
  unknown: null,
};

/** How many chevrons light up on the side the value is moving towards. */
const LIT: Record<Trend, number> = {
  up: 3,
  upModerate: 2,
  upSlight: 1,
  flat: 0,
  downSlight: 1,
  downModerate: 2,
  down: 3,
  unknown: 0,
};

const BAND_INDEXES = Array.from({ length: BANDS }, (_, i) => i);

const RISING: Trend[] = ['up', 'upModerate', 'upSlight'];
const FALLING: Trend[] = ['down', 'downModerate', 'downSlight'];

/**
 * The triangle that stands in for the outermost band, in viewBox units: base at
 * TIP_BASE, point on the artwork's edge. Its gap to the arc below reads as part
 * of the same stack, so keep it under the 7 between the arcs — wider and the
 * tip looks detached from the dial.
 */
const TIP_W = 24;
const TIP_BASE = 9;

function tintFor(trend: Trend, c: Colors): string {
  if (RISING.includes(trend)) return c.trendRise;
  if (FALLING.includes(trend)) return c.trendFall;
  return c.trendFlat;
}

/**
 * Mixes a hex colour towards white (positive) or black (negative) by `amount`,
 * 0 to 1. The dial's relief is built from one tint rather than from a second
 * palette entry, so a change of trend colour carries the shading with it.
 */
function shade(hex: string, amount: number): string {
  const target = amount >= 0 ? 255 : 0;
  const k = Math.abs(amount);
  const n = parseInt(hex.slice(1), 16);
  const mix = (channel: number) => Math.round(channel + (target - channel) * k);
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

/**
 * A compass needle pointing straight up through the ring; rotated for the other
 * states. It stops just inside the ring's inner edge (56 to 132) so that the
 * head never touches the ring once rotated.
 */
const NEEDLE = `M${CX} 59 L${CX + 20} 94 L${CX + 5} 89 L${CX} 129 L${CX - 5} 89 L${CX - 20} 94 Z`;

/**
 * The trend dial from the design: a ringed needle with chevrons above and below.
 * The needle's clock position carries the rate of change and its colour the
 * direction, while the number of lit chevrons repeats the rate — so the state
 * stays legible without relying on colour alone.
 */
export function TrendTile({ trend, size = 56 }: Props) {
  const c = useColors();
  const tint = tintFor(trend, c);
  const angle = ANGLE[trend];
  const lit = LIT[trend];
  const rising = RISING.includes(trend);
  // The relief is a light top and a darker underside on every mark, plus one
  // soft shadow behind the ring. Kept to a few per cent of lightness: enough to
  // round the dial, not enough to read as a glossy button. The gradient ids
  // carry the state so two dials on one screen never share a definition.
  const uid = `td${angle ?? 'f'}${tint.slice(1)}`;

  /** One band. `below` mirrors it onto the underside of the ring. */
  const chevron = (index: number, below: boolean) => {
    const isLit = index < lit && below !== rising;
    const fill = isLit ? `url(#${uid}mark)` : `url(#${uid}idle)`;

    // The outermost band is a small triangle pointing outwards, not an arc.
    if (index === ARCS.length) {
      const baseY = below ? VB_H - TIP_BASE : TIP_BASE;
      const tipY = below ? VB_H : 0;
      return (
        <Path
          key={`${below ? 'd' : 'u'}${index}`}
          d={`M${CX - TIP_W / 2} ${baseY} L${CX + TIP_W / 2} ${baseY} L${CX} ${tipY} Z`}
          fill={fill}
        />
      );
    }

    // A quadratic peaks halfway to its control point, so aim the control twice as far.
    const { w, base, apex } = ARCS[index];
    const y = below ? VB_H - base : base;
    const control = below ? VB_H - (2 * apex - base) : 2 * apex - base;
    const x0 = CX - w / 2;
    return (
      <Path
        key={`${below ? 'd' : 'u'}${index}`}
        d={`M${x0} ${y} Q${CX} ${control} ${x0 + w} ${y}`}
        stroke={fill}
        strokeWidth={CHEVRON_STROKE}
        strokeLinecap="round"
        fill="none"
      />
    );
  };

  return (
    <Svg width={size} height={(size * VB_H) / VB_W} viewBox={`0 0 ${VB_W} ${VB_H}`}>
      <Defs>
        <LinearGradient id={`${uid}ring`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={shade(tint, 0.3)} />
          <Stop offset="0.55" stopColor={tint} />
          <Stop offset="1" stopColor={shade(tint, -0.22)} />
        </LinearGradient>
        <LinearGradient id={`${uid}mark`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={shade(tint, 0.22)} />
          <Stop offset="1" stopColor={shade(tint, -0.16)} />
        </LinearGradient>
        <LinearGradient id={`${uid}idle`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={shade(c.trendIdle, 0.25)} />
          <Stop offset="1" stopColor={shade(c.trendIdle, -0.12)} />
        </LinearGradient>
      </Defs>
      {BAND_INDEXES.map((i) => chevron(i, false))}
      <Circle cx={CX} cy={CY + 2} r={R} stroke={shade(tint, -0.45)} strokeOpacity={0.22} strokeWidth={RING_STROKE} fill="none" />
      <Circle cx={CX} cy={CY} r={R} stroke={`url(#${uid}ring)`} strokeWidth={RING_STROKE} fill="none" />
      {angle === null ? (
        [-22, 0, 22].map((dx) => <Circle key={dx} cx={CX + dx} cy={CY} r={8} fill={`url(#${uid}mark)`} />)
      ) : (
        <Path d={NEEDLE} fill={`url(#${uid}mark)`} transform={`rotate(${angle} ${CX} ${CY})`} />
      )}
      {BAND_INDEXES.map((i) => chevron(i, true))}
    </Svg>
  );
}
