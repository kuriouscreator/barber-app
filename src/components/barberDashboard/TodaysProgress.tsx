import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius, shadows } from '../../theme/spacing';
import { DayProgress, MonthlyProgress } from '../../types';

interface TodaysProgressProps {
  completed: DayProgress;
  remaining: DayProgress;
  monthly: MonthlyProgress;
}

const TodaysProgress: React.FC<TodaysProgressProps> = ({ completed, remaining, monthly }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Today's Progress</Text>
      
      <View style={styles.progressCards}>
        <View style={styles.progressCard}>
          <View style={styles.iconContainer}>
            <Ionicons name="checkmark-circle" size={24} color={colors.accent.primary} />
          </View>
          <Text style={styles.progressNumber}>{completed.completedCount}</Text>
          <Text style={styles.progressLabel}>Completed {completed.completedCount} cuts logged</Text>
        </View>
        
        <View style={styles.progressCard}>
          <View style={styles.iconContainer}>
            <Ionicons name="time" size={24} color={colors.text.secondary} />
          </View>
          <Text style={styles.progressNumber}>{remaining.remainingCount}</Text>
          <Text style={styles.progressLabel}>Remaining {remaining.remainingCount} more today</Text>
        </View>
      </View>
      
      <View style={styles.monthlyCard}>
        <View style={styles.monthlyHeader}>
          <Text style={styles.monthlyTitle}>Monthly Cuts Progress</Text>
          <Text style={styles.monthlyPercent}>{monthly.percent}%</Text>
        </View>
        
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressBarFill, 
                { width: `${monthly.percent}%` }
              ]} 
            />
          </View>
        </View>
        
        <View style={styles.monthlyFooter}>
          <Text style={styles.monthlyDoneLabel}>{monthly.doneLabel}</Text>
          <Text style={styles.monthlyRemainingLabel}>{monthly.remainingLabel}</Text>
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
    marginBottom: spacing.md,
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
    backgroundColor: colors.background.secondary,
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
  monthlyCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  monthlyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  monthlyTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  monthlyPercent: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  progressBarContainer: {
    marginBottom: spacing.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.accent.primary,
    borderRadius: borderRadius.full,
  },
  monthlyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  monthlyDoneLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  monthlyRemainingLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
});

export default TodaysProgress;
