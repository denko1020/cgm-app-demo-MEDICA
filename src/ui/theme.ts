import { useAppStore } from '@/core/store/appStore';

/**
 * The reskin's light palette. `elevated` is the surface for a control that sits
 * on top of a card (the Home action buttons, the value box): in light it is the
 * page white, in dark it has to be *lighter* than the card, since a shadow
 * alone cannot separate two near-black surfaces.
 */
export const lightColors = {
  background: '#FFFFFF',
  card: '#F7F5F0',
  surfaceAlt: '#EFEAE0',
  elevated: '#FFFFFF',
  separator: '#E8E2D8',
  text: '#201F1C',
  textSecondary: '#79746B',
  textTertiary: '#B7B2A6',
  tint: '#0064F0',
  primary: '#0064F0',
  primarySoft: '#E1EBFE',
  red: '#D0021B',
  green: '#34C759',
  gray: '#ACA79B',
  orange: '#F59E0B',
  greenSoft: '#DCFCE7',
  indigo: '#6366F1',
  violet: '#7C3AED',
  /** Trend indicator: muted red rising, muted blue falling, grey steady — from the design. */
  trendRise: '#C0504D',
  trendFall: '#5B8DB8',
  trendFlat: '#8A857C',
  /** The faint chevrons the trend has not reached yet. */
  trendIdle: '#CFCAC1',
  /** Live data, battery, link and upload indicators when they are healthy. */
  statusActive: '#0064F0',
  /**
   * Text and icons sitting on a filled accent (a primary or destructive button,
   * the selected segment, an active chip). White clears the deep brand blue in
   * light; on the lifted dark accent it only reaches 3.2:1, so dark mode puts
   * near-black on the bright fill instead — the way the platform themes do.
   */
  onAccent: '#FFFFFF',
  /** Web only: the page behind the phone frame, and the frame's own edge. */
  webBackdrop: '#ECE7DE',
  webFrameBorder: '#DAD3C6',
};

export type Colors = typeof lightColors;

/**
 * The dark palette. Greys keep the light theme's warm cast (a touch of yellow)
 * rather than going neutral, so the two themes read as one design.
 *
 * Every hue is lifted, not just inverted: the brand blue #0064F0 reaches only
 * 3.7:1 on a near-black ground, so the accent becomes the same hue at a higher
 * lightness (hsl 215° 100% 62%). The light theme keeps the exact brand value.
 * `contrast-audit` covers the pairs that carry meaning here.
 */
export const darkColors: Colors = {
  background: '#141311',
  card: '#1E1C19',
  surfaceAlt: '#2A2724',
  elevated: '#2E2B27',
  separator: '#39342C',
  text: '#F3F0E9',
  textSecondary: '#A9A49A',
  textTertiary: '#8E887E',
  tint: '#3D8EFF',
  primary: '#3D8EFF',
  primarySoft: '#17233A',
  red: '#FF6B6B',
  green: '#3BD964',
  gray: '#9A948A',
  orange: '#FFB224',
  greenSoft: '#14291B',
  indigo: '#8B90F8',
  violet: '#A78BFA',
  trendRise: '#E08A86',
  trendFall: '#7FB3DC',
  trendFlat: '#A09A90',
  trendIdle: '#3A3730',
  statusActive: '#3D8EFF',
  onAccent: '#10100E',
  webBackdrop: '#0A0A09',
  webFrameBorder: '#2A2724',
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

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };

export const radius = { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 };

export const shadow = {
  card: {
    shadowColor: '#3A3226',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  /** Tighter, more defined lift for the white controls that sit on a card. */
  raised: {
    shadowColor: '#3A3226',
    shadowOpacity: 0.18,
    shadowRadius: 4,
    shadowOffset: { width: 1, height: 2 },
    elevation: 3,
  },
} as const;

export const fonts = {
  largeTitle: { fontSize: 34, fontWeight: '700' as const },
  title: { fontSize: 22, fontWeight: '600' as const },
  body: { fontSize: 17, fontWeight: '400' as const },
  footnote: { fontSize: 13, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '400' as const },
};
