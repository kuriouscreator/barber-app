export const colors = {
  // Primary colors
  black: '#000000',
  white: '#FFFFFF',
  
  // Cool-toned grays
  gray: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },

  // Extended color palette
  green: {
    600: '#16A34A',
  },
  red: {
    50: '#FEF2F2',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
  },
  orange: {
    50: '#FFF7ED',
    600: '#EA580C',
  },
  yellow: {
    500: '#EAB308',
  },

  // Accent colors
  accent: {
    primary: '#000000', // Black (gradient start)
    primaryLight: '#334155', // Dark gray (gradient end)
    secondary: '#475569', // Medium gray
    success: '#10B981', // Emerald
    warning: '#F59E0B', // Amber
    error: '#EF4444', // Red
  },
  
  // Background colors
  background: {
    primary: '#FFFFFF',
    secondary: '#F8FAFC',
    tertiary: '#F1F5F9',
  },
  
  // Text colors
  text: {
    primary: '#0F172A',
    secondary: '#475569',
    tertiary: '#64748B',
    inverse: '#FFFFFF',
  },
  
  // Border colors
  border: {
    light: '#D1D5DB',
    medium: '#CBD5E1',
    dark: '#94A3B8',
  },
} as const;

export type ColorKey = keyof typeof colors;
