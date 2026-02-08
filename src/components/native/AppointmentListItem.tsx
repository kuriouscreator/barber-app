/**
 * AppointmentListItem - Modular appointment display component
 * Designed for list views on HomeScreen with a native feel
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeCard } from './NativeCard';
import { NativeButton } from './NativeButton';
import { NativeStatusBadge } from './NativeStatusBadge';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { BadgeVariant } from '../../theme/components';

export interface AppointmentListItemProps {
  id: string;
  service: string;
  date: string;
  time: string;
  status?: BadgeVariant;
  serviceDuration?: number;
  specialRequests?: string;
  onPress?: () => void;
  compact?: boolean;
  style?: ViewStyle;
}

// Utility function to convert 24hr time to 12hr format
const formatTimeTo12Hour = (time24: string): string => {
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${hour12}:${minutes} ${ampm}`;
};

// Format date to be more readable
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Check if it's today
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }

  // Check if it's tomorrow
  if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  }

  // Otherwise, return formatted date
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
};

export const AppointmentListItem: React.FC<AppointmentListItemProps> = ({
  id,
  service,
  date,
  time,
  status = 'scheduled',
  serviceDuration,
  specialRequests,
  onPress,
  compact = false,
  style,
}) => {
  return (
    <NativeCard
      variant="elevated"
      onPress={onPress}
      style={[styles.card, compact && styles.cardCompact, style]}
    >
      <View style={styles.container}>
        {/* Left: Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="calendar" size={20} color={colors.accent.primary} />
          </View>
        </View>

        {/* Center: Content */}
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.service} numberOfLines={1}>
              {service}
            </Text>
            {status && !compact && (
              <NativeStatusBadge status={status} size="sm" />
            )}
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={14} color={colors.text.secondary} />
            <Text style={styles.metaText}>
              {formatDate(date)} at {formatTimeTo12Hour(time)}
            </Text>
            {serviceDuration && (
              <>
                <Text style={styles.metaDot}>•</Text>
                <Text style={styles.metaText}>{serviceDuration} min</Text>
              </>
            )}
          </View>

          {specialRequests && !compact && (
            <View style={styles.noteRow}>
              <Ionicons
                name="information-circle-outline"
                size={14}
                color={colors.text.tertiary}
              />
              <Text style={styles.noteText} numberOfLines={2}>
                {specialRequests}
              </Text>
            </View>
          )}
        </View>

        {/* Right: Chevron */}
        {onPress && (
          <View style={styles.chevronContainer}>
            <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
          </View>
        )}
      </View>
    </NativeCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  cardCompact: {
    marginBottom: spacing.sm,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    marginRight: spacing.md,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  service: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  metaDot: {
    fontSize: 14,
    color: colors.text.tertiary,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    marginTop: spacing.xs,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: colors.text.tertiary,
    fontStyle: 'italic',
  },
  chevronContainer: {
    marginLeft: spacing.sm,
    justifyContent: 'center',
  },
});
