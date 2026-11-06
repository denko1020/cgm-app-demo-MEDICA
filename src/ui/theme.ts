import { Platform } from 'react-native';

import { useAppStore } from '@/core/store/appStore';

/**
 * The OHC UI Design System palette (Rev.2026-10), as laid out in @design/DESIGN.md.
 *
 * Two rules shape the names below. Status colours come in pairs: the fill is
 * what the guide defines for icons, markers and charts, and the `*Ink` value is
 * the darkened variant the guide requires once the same meaning has to be
 * carried by text (the fills run 1.9:1 to 3.0:1 on white). And neutrals are
 * tinted towards the brand hue rather than warm, so the greys sit under the
 * blue instead of fighting it.
 */
export const lightColors = {
  background: '#FFFFFF',
  /** surface-card: panels, chips, tiles. */
  card: '#F3F3F5',
  /** gray-100: the quiet track a segmented control or stepper sits in. */
  surfaceAlt: '#F9F9F9',
  /** surface-chart: charts and timelines. */
  chartSurface: '#F8F9FD',
  /** The row a pointer is on, in a list the user is choosing from. */
  selected: '#D9E7FC',
  elevated: '#FFFFFF',
  /** border-subtle: dividers inside a panel. */
  separator: '#E1E1E1',
  /** border-default: the outline of a panel, field or popup. */
  border: '#CDCDCD',
  /** Titles and the logo. Body copy uses `text`. */
  heading: '#000000',
  text: '#333333',
  textSecondary: '#454545',
  /** muted: the lightest grey that still clears 4.5:1 on white and on a card. */
  textTertiary: '#6B6B6B',
  /** Disabled fills and non-text rules. Never put a label in this. */
  gray: '#9A9A9A',
  disabled: '#CDCDCD',

  tint: '#0064F0',
  primary: '#0064F0',
  /** Hover / secondary emphasis. */
  primaryHover: '#3F8CF8',
  /** The blue that stays legible on a light blue ground. */
  primaryDeep: '#013ECC',
  /** CARE LIGHT BLUE: tinted ground for a selected or informational panel. */
  primarySoft: '#CEEAFE',

  red: '#B42323',
  green: '#2E5E1F',
  orange: '#8A5A00',
  redFill: '#FF5B5B',
  greenFill: '#81B86E',
  orangeFill: '#FFAA2A',
  etcFill: '#8B55E9',
  /** Badge grounds: the status fill at a tint the ink above it still clears. */
  redSoft: '#FDECEC',
  greenSoft: '#EAF2E6',
  /** The target band behind the chart line: pale enough to stay behind it. */
  rangeBand: '#EAF2E6',

  /** Live data, battery, link and upload indicators when they are healthy. */
  statusActive: '#0064F0',
  /** Text and icons on a filled accent. */
  onAccent: '#FFFFFF',

  /**
   * Trend dial. These are the dial's own colours from the artwork it was drawn
   * from, kept through the OHC reskin by choice: muted red rising, muted blue
   * falling, warm grey steady. They sit outside the guide's ramp, which is why
   * they stay confined to this one piece of artwork.
   */
  trendRise: '#C0504D',
  trendFall: '#5B8DB8',
  trendFlat: '#8A857C',
  /** The faint chevrons the trend has not reached yet. */
  trendIdle: '#CFCAC1',

  /** Web only: the page behind the phone frame, and the frame's own edge. */
  webBackdrop: '#F3F3F5',
  webFrameBorder: '#CDCDCD',
};

export type Colors = typeof lightColors;

/**
 * The dark palette. The guide specifies a light theme only (DESIGN.md 13.6
 * leaves dark mode open), so these values follow its own method rather than an
 * invention: neutrals keep the brand hue with a trace of chroma, and every
 * accent is the same hue lifted in lightness. Brand #0064F0 reaches only 3.7:1
 * on a near-black ground, so the accent moves to #3D8EFF and the status inks
 * swap places with their fills, which are the legible end here.
 */
export const darkColors: Colors = {
  background: '#101217',
  card: '#191C22',
  surfaceAlt: '#1F232B',
  chartSurface: '#161920',
  selected: '#1B2D4A',
  elevated: '#232730',
  separator: '#2C313B',
  border: '#3A4150',
  heading: '#FFFFFF',
  text: '#E6E8EC',
  textSecondary: '#B4B9C3',
  textTertiary: '#8F96A3',
  gray: '#6E7682',
  disabled: '#3A4150',

  tint: '#3D8EFF',
  primary: '#3D8EFF',
  primaryHover: '#6BA8FF',
  primaryDeep: '#94C6FD',
  primarySoft: '#17233A',

  red: '#FF8A8A',
  green: '#A8D694',
  orange: '#FFC768',
  redFill: '#FF5B5B',
  greenFill: '#81B86E',
  orangeFill: '#FFAA2A',
  etcFill: '#A77BF0',
  redSoft: '#2C1A1C',
  greenSoft: '#1B2A1C',
  rangeBand: '#1B2A1C',

  statusActive: '#3D8EFF',
  onAccent: '#0B0D11',

  trendRise: '#E08A86',
  trendFall: '#7FB3DC',
  trendFlat: '#A09A90',
  trendIdle: '#3A3730',

  webBackdrop: '#080A0D',
  webFrameBorder: '#2C313B',
};

/** The palette for the theme the user has chosen. Re-renders on a theme switch. */
export function useColors(): Colors {
  return useAppStore((s) => (s.darkMode ? darkColors : lightColors));
}

/**
 * Declares a themed stylesheet once, next to its component, and returns the
 * hook that reads it:
 *
 *     const useStyles = createStyles((c) => StyleSheet.create({ ... c.card ... }));
 *
 * Both palettes are module constants, so the cache holds at most two entries —
 * each stylesheet is built on its theme's first render and reused after that.
 */
export function createStyles<T>(build: (c: Colors) => T): () => T {
  const cache = new Map<Colors, T>();
  return function useThemedStyles(): T {
    const c = useColors();
    let styles = cache.get(c);
    if (!styles) {
      styles = build(c);
      cache.set(c, styles);
    }
    return styles;
  };
}

/** The guide's 4px step. Rhythm comes from varying which step a section uses. */
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

/** One radius per kind of thing, not a size ramp. */
export const radius = { control: 4, popup: 8, card: 12, pill: 999 };

/** Button and field strokes, from the guide. */
export const stroke = { control: 2, field: 1 };

/** The smallest touch target the guide allows. */
export const TOUCH = 44;

/**
 * The chips that float over the top of Home: how far below the safe area they
 * start, and how tall they are. Home reads these to clear its own first row of
 * them, so the gap holds if the chip ever changes size.
 */
export const topChips = { offset: 6, height: 28 };

/**
 * Pretendard is the brand face. The web build loads it from a CDN (see the
 * stylesheet link in public/index.html) and falls back through the platform
 * Korean faces; a native build has no font file bundled yet, so it stays on the
 * system face rather than silently rendering a missing family.
 */
const family = Platform.select({
  web: '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif',
  default: undefined,
});

/** Figures that have to line up column to column, as the guide requires of every table and readout. */
export const tabular = { fontVariant: ['tabular-nums' as const] };

export const fonts = {
  /** h1 */
  largeTitle: { fontFamily: family, fontSize: 32, lineHeight: 40, fontWeight: '700' as const },
  /** h2 */
  title: { fontFamily: family, fontSize: 24, lineHeight: 32, fontWeight: '700' as const },
  /** h3 */
  heading: { fontFamily: family, fontSize: 20, lineHeight: 28, fontWeight: '600' as const },
  body: { fontFamily: family, fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  /** body-sm: tables, secondary descriptions. */
  footnote: { fontFamily: family, fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
  caption: { fontFamily: family, fontSize: 12, lineHeight: 16, fontWeight: '500' as const },
  /** The one display size, for the reading the screen exists to show. */
  readout: { fontFamily: family, fontSize: 44, lineHeight: 50, fontWeight: '800' as const },
};
