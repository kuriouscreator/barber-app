import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';

interface AppointmentTypeBadgeProps {
  type: 'booking' | 'walk_in';
  size?: 'small' | 'medium';
}

export const AppointmentTypeBadge: React.FC<AppointmentTypeBadgeProps> = ({
  type,
  size = 'small',
}) => {
  const isWalkIn = type === 'walk_in';

  const badgeStyles = size === 'small' ? styles.badgeSmall : styles.badgeMedium;
  const textStyles = size === 'small' ? styles.textSmall : styles.textMedium;
  const iconSize = size === 'small' ? 12 : 16;

  return (
    <View
      style={[
        styles.badge,
        badgeStyles,
        isWalkIn ? styles.walkInBadge : styles.bookingBadge,
      ]}
    >
      <Ionicons
        name={isWalkIn ? 'walk' : 'calendar'}
        size={iconSize}
        color={isWalkIn ? colors.accent.warning : colors.accent.primary}
      />
      <Text
        style={[
          styles.text,
          textStyles,
          isWalkIn ? styles.walkInText : styles.bookingText,
        ]}
      >
        {isWalkIn ? 'Walk-In' : 'Booking'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  badgeMedium: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  walkInBadge: {
    backgroundColor: colors.accent.warningLight,
    borderWidth: 1,
    borderColor: colors.accent.warning,
  },
  bookingBadge: {
    backgroundColor: colors.accent.primaryLight,
    borderWidth: 1,
    borderColor: colors.accent.primary,
  },
  text: {
    fontWeight: typography.fontWeight.semibold,
  },
  textSmall: {
    fontSize: 10,
  },
  textMedium: {
    fontSize: 12,
  },
  walkInText: {
    color: colors.accent.warning,
  },
  bookingText: {
    color: colors.accent.primary,
  },
});
