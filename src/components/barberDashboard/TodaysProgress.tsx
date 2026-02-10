import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius, shadows } from '../../theme/spacing';
import { DayProgress } from '../../types';

interface TodaysProgressProps {
  dayProgress: DayProgress;
}

const TodaysProgress: React.FC<TodaysProgressProps> = ({ dayProgress }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Today's Progress</Text>

      <View style={styles.progressCards}>
        {/* Completed Card */}
        <View style={styles.progressCard}>
          <View style={[styles.iconContainer, { backgroundColor: `${colors.accent.success}15` }]}>
            <Ionicons name="checkmark-circle" size={24} color={colors.accent.success} />
          </View>
          <Text style={styles.progressNumber}>{dayProgress.completedCount}</Text>
          <Text style={styles.progressLabel}>Completed</Text>
        </View>

        {/* Remaining Card */}
        <View style={styles.progressCard}>
          <View style={[styles.iconContainer, { backgroundColor: `${colors.accent.primary}15` }]}>
            <Ionicons name="time-outline" size={24} color={colors.accent.primary} />
          </View>
          <Text style={styles.progressNumber}>{dayProgress.remainingCount}</Text>
          <Text style={styles.progressLabel}>Remaining</Text>
        </View>

        {/* Canceled Card */}
        <View style={styles.progressCard}>
          <View style={[styles.iconContainer, { backgroundColor: `${colors.accent.error}15` }]}>
            <Ionicons name="close-circle-outline" size={24} color={colors.accent.error} />
          </View>
          <Text style={styles.progressNumber}>{dayProgress.canceledCount}</Text>
          <Text style={styles.progressLabel}>Canceled</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  progressCards: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  progressCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressNumber: {
    fontSize: 24,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  progressLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});

export default TodaysProgress;
