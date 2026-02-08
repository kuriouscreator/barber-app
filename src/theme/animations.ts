/**
 * Animation tokens for consistent animations across the app
 * Provides duration and timing configurations for native-feeling animations
 */

export const animations = {
  /**
   * Animation durations in milliseconds
   */
  durations: {
    fast: 200,
    normal: 300,
    slow: 500,
    verySlow: 800,
  },

  /**
   * Easing functions for different animation types
   * Values are cubic-bezier parameters: [x1, y1, x2, y2]
   */
  easings: {
    // Standard Material Design easings
    easeInOut: [0.4, 0.0, 0.2, 1] as const,
    easeOut: [0.0, 0.0, 0.2, 1] as const,
    easeIn: [0.4, 0.0, 1, 1] as const,

    // Custom easings for specific use cases
    sharp: [0.4, 0.0, 0.6, 1] as const, // Quick, decisive movements
    gentle: [0.25, 0.1, 0.25, 1] as const, // Smooth, gentle transitions
  },

  /**
   * Spring configurations for react-native-reanimated
   */
  springs: {
    // Bouncy spring for playful interactions
    bouncy: {
      damping: 10,
      stiffness: 100,
      mass: 0.5,
    },

    // Standard spring for most interactions
    standard: {
      damping: 15,
      stiffness: 150,
      mass: 1,
    },

    // Snappy spring for quick, responsive interactions
    snappy: {
      damping: 20,
      stiffness: 300,
      mass: 0.5,
    },

    // Gentle spring for subtle animations
    gentle: {
      damping: 25,
      stiffness: 120,
      mass: 1.2,
    },
  },

  /**
   * Layout animation presets
   */
  layout: {
    // Smooth entry/exit animations
    duration: 300,
    type: 'spring' as const,
    springDamping: 0.7,
  },
} as const;

export type AnimationDuration = keyof typeof animations.durations;
export type AnimationEasing = keyof typeof animations.easings;
export type AnimationSpring = keyof typeof animations.springs;
