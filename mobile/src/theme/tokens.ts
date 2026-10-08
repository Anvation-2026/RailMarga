import { Platform, ViewStyle } from 'react-native';

export const Colors = {
  // Backgrounds & Surfaces (Warm Light Grey + Crisp White Cards)
  bgPrimary: '#F5F5F2', // Warm light grey page background
  bgSecondary: '#EEEEEC',
  bgSurface: '#FFFFFF', // Clean flat white card surface
  bgCard: '#FFFFFF',
  bgHover: '#EBEBE6',
  bgInput: '#FAFAF7',
  bgElevated: '#FFFFFF',
  bgHeaderWash: '#FFFDF5', // Subtle warm yellow wash for header

  // Typography (Near-Black #1A1A1A, Never Pure #000)
  textPrimary: '#1A1A1A',
  textSecondary: '#666660',
  textTertiary: '#888882',
  textMuted: '#9E9E98',
  textWhite: '#FFFFFF',

  // Borders (Flat 1px, No Heavy Outlines)
  border: '#E8E8E3',
  borderLight: '#F0F0EB',
  borderStrong: '#D5D5CE',
  borderInput: '#E0E0DA',
  borderFocus: '#F5B800',

  // Hero Brand Golden Yellow (Quick-Commerce Signature)
  primary: '#F5B800', // Hero golden yellow for CTAs, active chips, selected tabs
  primaryHover: '#E5AA00',
  primaryDark: '#B8860B',
  primaryLight: '#FFF8E1',
  primaryTint: 'rgba(245, 184, 0, 0.12)',
  primaryTintSolid: '#FEF9E6',

  // Backward-compatible Golden Yellow Aliases
  goldPrimary: '#F5B800',
  goldDark: '#B8860B',
  goldLight: '#FFF8E1',
  goldTint: 'rgba(245, 184, 0, 0.12)',
  goldTintMedium: 'rgba(245, 184, 0, 0.22)',
  goldTintSolid: '#FEF9E6',

  // Strict Semantics (Green ONLY for open/active, Red ONLY for alert/blocked)
  success: '#16A34A', // Active / open
  successTint: 'rgba(22, 163, 74, 0.10)',
  successLight: '#EAF7EE',

  error: '#DC2626', // Blocked / alert
  errorTint: 'rgba(220, 38, 38, 0.10)',
  errorLight: '#FEE2E2',

  warning: '#D97706',
  warningTint: 'rgba(217, 119, 6, 0.10)',
  warningLight: '#FEF3C7',

  // Map & Blueprint Accent Colors
  mapBg: '#F5F5F2',
  mapGrid: '#E8E8E3',
  platformTrack: '#73736C',
  platformBadgeBg: '#FEF9E6',
  platformBadgeBorder: '#F5B800',
  platformBadgeText: '#1A1A1A',
  routeActive: '#F5B800' // Golden yellow for active route line
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
  xs: 4,
  sm: 6,
  input: 8, // 8px for search/text inputs
  md: 12, // 12px for cards & tiles
  lg: 16,
  card: 12,
  tile: 12,
  button: 999, // 999px for buttons & chips
  pill: 999
} as const;

export const Typography = {
  fontFamily: Platform.select({
    web: "'Plus Jakarta Sans', 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    default: undefined
  }),
  display: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.textPrimary,
    letterSpacing: -0.4
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
    letterSpacing: -0.3
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
    letterSpacing: -0.1
  },
  body: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: Colors.textPrimary,
    lineHeight: 20
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textPrimary,
    lineHeight: 20
  },
  secondary: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    lineHeight: 18
  },
  tapLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.textPrimary
  },
  meta: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.textSecondary
  },
  caption: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textSecondary
  }
} as const;

const isWeb = Platform.OS === 'web';

export const Shadows = {
  // Almost zero shadows — clean flat 1px borders per quick-commerce style
  none: (isWeb ? { boxShadow: 'none' } : { elevation: 0 }) as ViewStyle,
  card: (isWeb
    ? { boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }
    : {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 3,
        elevation: 1
      }) as ViewStyle,
  floating: (isWeb
    ? { boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)' }
    : {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3
      }) as ViewStyle,
  bottomSheet: (isWeb
    ? { boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.08)' }
    : {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 6
      }) as ViewStyle
};
