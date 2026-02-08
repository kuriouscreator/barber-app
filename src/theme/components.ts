/**
 * Component-specific design tokens
 * Provides consistent sizing, spacing, and styling for native components
 */

export const componentTokens = {
  /**
   * Card component tokens
   */
  card: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
    minHeight: 100,

    // Variants
    variants: {
      default: {
        backgroundColor: '#FFFFFF',
        borderWidth: 0,
      },
      elevated: {
        backgroundColor: '#FFFFFF',
        borderWidth: 0,
      },
      outlined: {
        backgroundColor: 'transparent',
        borderWidth: 1,
      },
      stat: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        alignItems: 'center' as const,
      },
      action: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        minHeight: 80,
      },
    },
  },

  /**
   * Button component tokens
   */
  button: {
    borderRadius: 9999, // Fully rounded pill shape

    // Size variants
    sizes: {
      sm: {
        height: 36,
        paddingHorizontal: 16,
        fontSize: 14,
      },
      md: {
        height: 48,
        paddingHorizontal: 24,
        fontSize: 16,
      },
      lg: {
        height: 56,
        paddingHorizontal: 32,
        fontSize: 18,
      },
    },

    // Icon sizing
    iconSizes: {
      sm: 16,
      md: 20,
      lg: 24,
    },

    // Icon spacing
    iconSpacing: 8,

    // Minimum tap target (accessibility)
    minTapTarget: 44,
  },

  /**
   * Chip/Pill component tokens
   */
  chip: {
    borderRadius: 9999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    height: 36,
    gap: 6, // Space between icon and text
  },

  /**
   * Badge component tokens
   */
  badge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
    minWidth: 20,
    height: 20,

    // Status variants
    variants: {
      scheduled: {
        backgroundColor: '#3B82F6', // Blue
        color: '#FFFFFF',
      },
      completed: {
        backgroundColor: '#10B981', // Green
        color: '#FFFFFF',
      },
      cancelled: {
        backgroundColor: '#EF4444', // Red
        color: '#FFFFFF',
      },
      'no-show': {
        backgroundColor: '#6B7280', // Gray
        color: '#FFFFFF',
      },
      pending: {
        backgroundColor: '#F59E0B', // Amber
        color: '#FFFFFF',
      },
    },
  },

  /**
   * Avatar component tokens
   */
  avatar: {
    sizes: {
      sm: 32,
      md: 48,
      lg: 64,
      xl: 96,
    },
    borderRadius: 9999,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  /**
   * List item component tokens
   */
  listItem: {
    height: 72,
    padding: 16,
    gap: 12,
    borderRadius: 12,
  },

  /**
   * Input/Form component tokens
   */
  input: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
  },

  /**
   * Bottom sheet tokens
   */
  bottomSheet: {
    borderRadius: 24, // Top corners only
    handleHeight: 4,
    handleWidth: 40,
    handleColor: '#E5E7EB',
    paddingHorizontal: 20,
    paddingTop: 12,
  },

  /**
   * Tab bar tokens
   */
  tabBar: {
    height: 84, // Includes safe area
    paddingBottom: 34, // Safe area
    paddingTop: 8,
    iconSize: 24,
    fontSize: 12,
    gap: 4, // Between icon and label
  },

  /**
   * Header tokens
   */
  header: {
    height: 120,
    paddingHorizontal: 20,
    paddingTop: 60, // Includes status bar
    titleFontSize: 32,
    iconSize: 24,
  },
} as const;

export type CardVariant = keyof typeof componentTokens.card.variants;
export type ButtonSize = keyof typeof componentTokens.button.sizes;
export type BadgeVariant = keyof typeof componentTokens.badge.variants;
export type AvatarSize = keyof typeof componentTokens.avatar.sizes;
