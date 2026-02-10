import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { cleanScheduler } from '../theme/cleanScheduler';

const DEFAULT_COLORS = ['#0F172A', '#1E293B'] as const;
const DEFAULT_START = { x: 0, y: 0 };
const DEFAULT_END = { x: 1, y: 1 };

export interface DarkHeroHeaderProps {
  children: React.ReactNode;
  /** Gradient colors. Default: dark slate. */
  colors?: readonly [string, string, ...string[]];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  /** Optional style for the outer wrapper (clipped to rounded bottom). */
  style?: ViewStyle;
  /** Optional style for the inner gradient (padding only; no radius). */
  contentStyle?: ViewStyle;
}

/**
 * Dark hero header with rounded bottom corners. Use for Profile, Rewards, etc.
 * The wrapper clips the gradient via overflow: hidden and heroBottomRadius.
 * Any background or gradient inside the hero must be a child of this clipped
 * wrapper; do not rely on radius on the inner gradient alone.
 */
export function DarkHeroHeader({
  children,
  colors = DEFAULT_COLORS,
  start = DEFAULT_START,
  end = DEFAULT_END,
  style,
  contentStyle,
}: DarkHeroHeaderProps) {
  return (
    <View style={[styles.wrapper, style]}>
      <LinearGradient
        colors={colors as [string, string, ...string[]]}
        start={start}
        end={end}
        style={[styles.inner, contentStyle]}
      >
        {children}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderBottomLeftRadius: cleanScheduler.heroBottomRadius,
    borderBottomRightRadius: cleanScheduler.heroBottomRadius,
    overflow: 'hidden',
  },
  inner: {
    // No radius here; wrapper provides the clip.
    paddingTop: 56,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
});

/** Theme type for style helper (minimal shape). */
type ThemeLike = { cleanScheduler: { heroBottomRadius: number; padding?: number } };

/**
 * Returns shared styles for a dark hero header so screens can use the same
 * layout without using the component. Inner style has padding only (no radius).
 */
export function getDarkHeroHeaderStyles(theme: ThemeLike) {
  const radius = theme.cleanScheduler.heroBottomRadius;
  return {
    wrapper: {
      borderBottomLeftRadius: radius,
      borderBottomRightRadius: radius,
      overflow: 'hidden' as const,
    },
    inner: {
      paddingTop: 56,
      paddingBottom: 40,
      paddingHorizontal: theme.cleanScheduler.padding ?? 24,
    },
  };
}
