/**
 * NativeStatusBadge - Status indicator component
 * Displays appointment status with color-coded backgrounds and icons
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { componentTokens, BadgeVariant } from '../../theme/components';

export interface NativeStatusBadgeProps {
  /** Status type */
  status: BadgeVariant;

  /** Badge size */
  size?: 'sm' | 'md';

  /** Show icon */
  showIcon?: boolean;

  /** Custom style overrides */
  style?: ViewStyle;
}

const statusConfig: Record<
  BadgeVariant,
  {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
  }
> = {
  scheduled: {
    label: 'Scheduled',
    icon: 'calendar',
  },
  completed: {
    label: 'Completed',
    icon: 'checkmark-circle',
  },
  cancelled: {
    label: 'Cancelled',
    icon: 'close-circle',
  },
  'no-show': {
    label: 'No Show',
    icon: 'alert-circle',
  },
  pending: {
    label: 'Pending',
    icon: 'time',
  },
};

export const NativeStatusBadge: React.FC<NativeStatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = false,
  style,
}) => {
  const config = statusConfig[status];
  const variantStyle = componentTokens.badge.variants[status];
  const isSm = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: variantStyle.backgroundColor,
          paddingHorizontal: isSm ? 6 : componentTokens.badge.paddingHorizontal,
          paddingVertical: isSm ? 2 : componentTokens.badge.paddingVertical,
          borderRadius: componentTokens.badge.borderRadius,
        },
        style,
      ]}
    >
      {showIcon && (
        <Ionicons
          name={config.icon}
          size={isSm ? 10 : 12}
          color={variantStyle.color}
          style={styles.icon}
        />
      )}
      <Text
        style={[
          styles.text,
          {
            color: variantStyle.color,
            fontSize: isSm ? 10 : componentTokens.badge.fontSize,
          },
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    minHeight: componentTokens.badge.height,
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontWeight: '600',
  },
});
