export const colors = {
  background: '#FFFFFF',
  card: '#F7F5F0',
  surfaceAlt: '#EFEAE0',
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
};

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
} as const;

export const fonts = {
  largeTitle: { fontSize: 34, fontWeight: '700' as const },
  title: { fontSize: 22, fontWeight: '600' as const },
  body: { fontSize: 17, fontWeight: '400' as const },
  footnote: { fontSize: 13, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '400' as const },
};
