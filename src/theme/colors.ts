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
  
  // Accent colors
  accent: {
    primary: '#000080', // Navy blue (gradient start)
    primaryLight: '#1D4ED8', // Blue (gradient end)
    secondary: '#6366F1', // Indigo
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
