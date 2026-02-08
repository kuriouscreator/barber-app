import { Platform } from 'react-native';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  '4xl': 96,
} as const;

export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  button: 9999, // Full pill for buttons
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
} as const;

/**
 * Platform-specific shadow styles
 * iOS uses shadowColor, shadowOffset, shadowOpacity, shadowRadius
 * Android uses elevation
 */
export const shadows = {
  none: Platform.select({
    ios: {},
    android: { elevation: 0 },
  }),
  sm: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    android: {
      elevation: 1,
    },
  }),
  md: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    android: {
      elevation: 3,
    },
  }),
  lg: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    android: {
      elevation: 5,
    },
  }),
  xl: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: 0.2,
      shadowRadius: 12,
    },
    android: {
      elevation: 8,
    },
  }),
} as const;

export type SpacingKey = keyof typeof spacing;
export type BorderRadiusKey = keyof typeof borderRadius;
export type ShadowKey = keyof typeof shadows;
