/**
 * Haptic feedback utilities
 * Provides consistent tactile feedback across the app
 * Uses Expo's built-in haptics for compatibility with Expo Go
 */

import * as Haptics from 'expo-haptics';

/**
 * Haptic feedback types
 */
export type HapticType =
  | 'selection'
  | 'impactLight'
  | 'impactMedium'
  | 'impactHeavy'
  | 'success'
  | 'warning'
  | 'error';

/**
 * Trigger haptic feedback
 * @param type - The type of haptic feedback to trigger
 */
export const triggerHaptic = async (type: HapticType = 'selection'): Promise<void> => {
  try {
    switch (type) {
      case 'selection':
        await Haptics.selectionAsync();
        break;
      case 'impactLight':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'impactMedium':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'impactHeavy':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'success':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'warning':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'error':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      default:
        await Haptics.selectionAsync();
    }
  } catch (error) {
    // Silently fail if haptics are not available
    console.debug('Haptic feedback not available:', error);
  }
};

/**
 * Specialized haptic feedback functions for common interactions
 */
export const haptics = {
  /**
   * Light haptic for UI element selection (tabs, buttons)
   */
  selection: () => triggerHaptic('selection'),

  /**
   * Light impact for button presses
   */
  light: () => triggerHaptic('impactLight'),

  /**
   * Medium impact for confirmations
   */
  medium: () => triggerHaptic('impactMedium'),

  /**
   * Heavy impact for important actions
   */
  heavy: () => triggerHaptic('impactHeavy'),

  /**
   * Success haptic for positive actions
   */
  success: () => triggerHaptic('success'),

  /**
   * Warning haptic for caution actions
   */
  warning: () => triggerHaptic('warning'),

  /**
   * Error haptic for errors or destructive actions
   */
  error: () => triggerHaptic('error'),
} as const;
