export const Colors = {
  // Backgrounds
  bgPrimary: '#FFFFFF',
  bgSecondary: '#F8F8F6',
  bgSurface: '#F3F3F0',
  bgHover: '#EEEEEC',

  // Typography
  textPrimary: '#171717',
  textSecondary: '#5F6368',
  textTertiary: '#80868B',
  textMuted: '#9AA0A6',
  textWhite: '#FFFFFF',

  // Borders & Dividers
  border: '#E5E5E0',
  borderLight: '#EEEEEC',
  borderStrong: '#D1D1CB',

  // Professional Gold Yellow Brand & Accent Palette
  goldPrimary: '#D4A017', // Rich Professional Gold Yellow
  goldDark: '#A17409',    // Deep Burnished Gold for high-contrast text & borders
  goldLight: '#FDE68A',   // Luminous Warm Golden Yellow for glowing accents
  goldTint: 'rgba(212, 160, 23, 0.08)',
  goldTintMedium: 'rgba(212, 160, 23, 0.16)',
  goldTintSolid: '#FEF9C3', // Warm Ivory-Gold surface for selected states

  // Charcoal & Neutrals
  charcoalPrimary: '#171717',
  charcoalSurface: '#202124',
  charcoalMuted: '#3C4043',

  // Semantic Colors
  success: '#16803C',
  successTint: 'rgba(22, 128, 60, 0.08)',
  successLight: '#E6F4EA',

  warning: '#B77900',
  warningTint: 'rgba(183, 121, 0, 0.08)',
  warningLight: '#FEF7E0',

  error: '#C62828',
  errorTint: 'rgba(198, 40, 40, 0.08)',
  errorLight: '#FCE8E6',

  info: '#2563EB',
  infoTint: 'rgba(37, 99, 235, 0.08)',
  infoLight: '#E8F0FE',

  // Map & Platform colors
  mapBg: '#F8F8F6',
  mapGrid: '#EBEBE6',
  platformTrack: '#80868B',
  platformBadgeBg: '#FEF9C3',
  platformBadgeBorder: '#D4A017',
  platformBadgeText: '#171717'
} as const;

export const Spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 48
} as const;

export const Radii = {
  sm: 8,
  md: 12,
  lg: 16,
  hero: 20,
  button: 12,
  pill: 999
} as const;

export const Typography = {
  display: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
    letterSpacing: -0.5
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
    letterSpacing: -0.3
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.textPrimary,
    letterSpacing: -0.2
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    color: Colors.textPrimary,
    lineHeight: 22
  },
  bodyMedium: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textPrimary,
    lineHeight: 22
  },
  secondary: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    lineHeight: 18
  },
  caption: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    letterSpacing: 0.2
  }
} as const;

export const Shadows = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2
  },
  floating: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 16,
    elevation: 4
  },
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1
  }
} as const;
