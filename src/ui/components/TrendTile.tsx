import Svg, { Circle, Path } from 'react-native-svg';

import type { Trend } from '@/core/types';
import { colors } from '@/ui/theme';

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
 * Chevron bands above the ring, innermost first. `base` is where the arc's ends
 * sit and `apex` its peak, both on the centre line. Mirrored below the ring.
 */
const WAVES = [
  { w: 71, base: 39, apex: 28 },
  { w: 50, base: 20, apex: 13 },
  { w: 36, base: 5, apex: 3 },
];

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

const RISING: Trend[] = ['up', 'upModerate', 'upSlight'];
const FALLING: Trend[] = ['down', 'downModerate', 'downSlight'];

/** Width of the outermost chevron's replacement tip, in viewBox units. */
const TIP_W = 18;

function tintFor(trend: Trend): string {
  if (RISING.includes(trend)) return colors.trendRise;
  if (FALLING.includes(trend)) return colors.trendFall;
  return colors.trendFlat;
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
  const tint = tintFor(trend);
  const angle = ANGLE[trend];
  const lit = LIT[trend];
  const rising = RISING.includes(trend);

  /** Straight up (12 o'clock) or straight down (6 o'clock): the two exact-clock states. */
  const pointingClock = trend === 'up' || trend === 'down';

  /** One chevron. `below` mirrors the band onto the underside of the ring. */
  const chevron = (index: number, below: boolean) => {
    const { w, base, apex } = WAVES[index];
    const isLit = index < lit && below !== rising;
    const fill = isLit ? tint : colors.trendIdle;

    // At 12/6 o'clock, the outermost band becomes a small triangle whose
    // point touches the artwork's edge instead of a curved chevron.
    if (index === WAVES.length - 1 && pointingClock) {
      const baseY = below ? VB_H - base : base;
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
      {WAVES.map((_, i) => chevron(i, false))}
      <Circle cx={CX} cy={CY} r={R} stroke={tint} strokeWidth={RING_STROKE} fill="none" />
      {angle === null ? (
        [-22, 0, 22].map((dx) => <Circle key={dx} cx={CX + dx} cy={CY} r={8} fill={tint} />)
      ) : (
        <Path d={NEEDLE} fill={tint} transform={`rotate(${angle} ${CX} ${CY})`} />
      )}
      {WAVES.map((_, i) => chevron(i, true))}
    </Svg>
  );
}
