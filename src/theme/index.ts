import { colors } from './colors';
import { typography } from './typography';
import { spacing, borderRadius, shadows } from './spacing';
import { cleanScheduler } from './cleanScheduler';

export { colors, typography, spacing, borderRadius, shadows, cleanScheduler };

export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  cleanScheduler,
} as const;

export type Theme = typeof theme;
