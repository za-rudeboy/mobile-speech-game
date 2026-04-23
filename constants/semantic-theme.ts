import { Platform } from 'react-native';

export const AppFonts = {
  heading: 'PlusJakartaSans_700Bold',
  headingSemiBold: 'PlusJakartaSans_600SemiBold',
  body: 'Lexend_400Regular',
  bodySemiBold: 'Lexend_600SemiBold',
  fallback:
    Platform.OS === 'web'
      ? "'Plus Jakarta Sans', 'Lexend', 'Avenir Next', 'Segoe UI', sans-serif"
      : 'System',
} as const;

export const childTheme = {
  background: '#0f141b',
  backgroundStrong: '#090e16',
  surface: '#1b2028',
  surfaceRaised: '#252a33',
  surfaceMuted: '#30353e',
  surfaceBright: '#343942',
  text: '#dee2ee',
  textMuted: '#c0c7d1',
  textSoft: '#8a919b',
  outline: '#404850',
  primary: '#72c0ff',
  primaryStrong: '#4b9bd8',
  onPrimary: '#003351',
  success: '#76ca97',
  successSurface: '#173428',
  danger: '#ffb4ab',
  dangerSurface: '#452126',
  shadow: 'rgba(3, 10, 20, 0.42)',
  radiusSm: 16,
  radiusMd: 24,
  radiusLg: 32,
  radiusPill: 999,
  gutter: 24,
  pagePadding: 24,
  pagePaddingWide: 32,
  gap: 16,
  tapTarget: 64,
} as const;

export const parentTheme = {
  background: '#f4f7fb',
  surface: '#ffffff',
  surfaceMuted: '#eef2f7',
  text: '#18212b',
  textMuted: '#556170',
  textSoft: '#748191',
  outline: '#d8e0ea',
  primary: '#3d7fc2',
  primarySoft: '#d7e8fb',
  onPrimary: '#ffffff',
  success: '#4d8b67',
  danger: '#b45a5a',
  shadow: 'rgba(23, 31, 43, 0.08)',
  radiusSm: 14,
  radiusMd: 20,
  radiusLg: 28,
  radiusPill: 999,
  gutter: 16,
  pagePadding: 16,
  pagePaddingWide: 24,
  gap: 12,
  tapTarget: 52,
} as const;

export const childShadow = {
  ...(Platform.OS === 'web'
    ? {
        boxShadow: `0px 10px 24px ${childTheme.shadow}`,
      }
    : {
        shadowColor: childTheme.shadow,
        shadowOpacity: 1,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 10 },
        elevation: 6,
      }),
} as const;

export const parentShadow = {
  ...(Platform.OS === 'web'
    ? {
        boxShadow: `0px 8px 18px ${parentTheme.shadow}`,
      }
    : {
        shadowColor: parentTheme.shadow,
        shadowOpacity: 1,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },
        elevation: 3,
      }),
} as const;
