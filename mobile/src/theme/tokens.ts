export const Colors = {
  // Backgrounds - Modern Clean Slate
  bgPrimary: '#F8FAFC',
  bgSecondary: '#F1F5F9',
  bgSurface: '#FFFFFF',
  bgHover: '#E2E8F0',
  bgElevated: '#FFFFFF',

  // Typography
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#64748B',
  textMuted: '#94A3B8',
  textWhite: '#FFFFFF',

  // Borders & Dividers
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  borderStrong: '#CBD5E1',

  // Transit Primary Brand (Deep Royal Sapphire & Slate Navy)
  brandNavy: '#0F172A',
  brandNavyLight: '#1E293B',
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primaryLight: '#EFF6FF',
  primaryTint: 'rgba(37, 99, 235, 0.08)',
  primaryTintSolid: '#EFF6FF',

  // Backward compatibility aliases mapped to sleek royal indigo
  goldPrimary: '#2563EB',
  goldDark: '#1D4ED8',
  goldLight: '#93C5FD',
  goldTint: 'rgba(37, 99, 235, 0.08)',
  goldTintMedium: 'rgba(37, 99, 235, 0.16)',
  goldTintSolid: '#EFF6FF',

  // Charcoal & Neutrals
  charcoalPrimary: '#0F172A',
  charcoalSurface: '#1E293B',
  charcoalMuted: '#334155',

  // Semantic Colors
  success: '#059669',
  successTint: 'rgba(5, 150, 105, 0.08)',
  successLight: '#ECFDF5',

  warning: '#D97706',
  warningTint: 'rgba(217, 119, 6, 0.08)',
  warningLight: '#FFFBEB',

  error: '#DC2626',
  errorTint: 'rgba(220, 38, 38, 0.08)',
  errorLight: '#FEF2F2',

  info: '#2563EB',
  infoTint: 'rgba(37, 99, 235, 0.08)',
  infoLight: '#EFF6FF',

  // Map & Platform colors
  mapBg: '#F8FAFC',
  mapGrid: '#E2E8F0',
  platformTrack: '#64748B',
  platformBadgeBg: '#EFF6FF',
  platformBadgeBorder: '#2563EB',
  platformBadgeText: '#0F172A'
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
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  hero: 24,
  button: 10,
  pill: 999
} as const;

export const Typography = {
  display: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.textPrimary,
    letterSpacing: -0.6
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
    letterSpacing: -0.4
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
    letterSpacing: -0.2
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
  caption: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    letterSpacing: 0.3
  }
} as const;

import { Platform, ViewStyle } from 'react-native';

const isWeb = Platform.OS === 'web';

export const Shadows = {
  card: (isWeb
    ? { boxShadow: '0 2px 10px rgba(15, 23, 42, 0.05)' }
    : {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2
      }) as ViewStyle,
  floating: (isWeb
    ? { boxShadow: '0 6px 20px rgba(15, 23, 42, 0.08)' }
    : {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 4
      }) as ViewStyle,
  sm: (isWeb
    ? { boxShadow: '0 1px 4px rgba(15, 23, 42, 0.04)' }
    : {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1
      }) as ViewStyle
};
