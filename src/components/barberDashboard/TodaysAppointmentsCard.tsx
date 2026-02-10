import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { cleanScheduler } from '../../theme/cleanScheduler';
import { BarberStats, DayProgress } from '../../types';

interface TodaysAppointmentsCardProps {
  stats: BarberStats;
  dayProgress: DayProgress;
  onViewAll: () => void;
  onAddWalkIn?: () => void;
}

const TodaysAppointmentsCard: React.FC<TodaysAppointmentsCardProps> = ({ stats, dayProgress, onViewAll, onAddWalkIn }) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Today's Appointments</Text>
        <TouchableOpacity hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="calendar-outline" size={22} color={cleanScheduler.text.subtext} />
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: cleanScheduler.text.heading }]}>{stats.todayAppointments}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: cleanScheduler.status.available }]}>{dayProgress.completedCount}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: cleanScheduler.text.heading }]}>{dayProgress.remainingCount}</Text>
          <Text style={styles.statLabel}>Remaining</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: cleanScheduler.status.unavailable }]}>{dayProgress.canceledCount}</Text>
          <Text style={styles.statLabel}>Canceled</Text>
        </View>
      </View>

      {stats.nextAppt && (
        <View style={styles.nextRow}>
          <Text style={styles.nextText}>
            Next: {stats.nextAppt.timeLabel} - {stats.nextAppt.clientName}
          </Text>
        </View>
      )}

      <View style={styles.actionRow}>
        {onAddWalkIn && (
          <TouchableOpacity onPress={onAddWalkIn} style={styles.primaryButton} activeOpacity={0.7}>
            <Ionicons name="person-add" size={18} color={colors.white} />
            <Text style={styles.primaryButtonText}>Add Walk-In</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={onViewAll} style={styles.secondaryButton} activeOpacity={0.7}>
          <Text style={styles.secondaryButtonText}>View All</Text>
          <Ionicons name="chevron-forward" size={18} color={cleanScheduler.secondary.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: cleanScheduler.card.bg,
    borderRadius: cleanScheduler.card.radius,
    borderWidth: 1,
    borderColor: cleanScheduler.card.border,
    padding: cleanScheduler.padding,
    marginBottom: cleanScheduler.sectionSpacing,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: cleanScheduler.padding,
  },
  title: {
    fontSize: 18,
    fontWeight: typography.fontWeight.bold,
    color: cleanScheduler.text.heading,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: cleanScheduler.padding,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: cleanScheduler.text.subtext,
  },
  nextRow: {
    marginBottom: spacing.md,
  },
  nextText: {
    fontSize: typography.fontSize.base,
    color: cleanScheduler.text.body,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: cleanScheduler.primary,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    minHeight: 44,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: cleanScheduler.secondary.bg,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    minHeight: 44,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: typography.fontWeight.semibold,
    color: cleanScheduler.secondary.text,
  },
});

export default TodaysAppointmentsCard;
