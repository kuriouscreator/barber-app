import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { BarberStats } from '../../types';

interface TodaysScheduleCardProps {
  stats: BarberStats;
  onViewAll: () => void;
  onAddWalkIn?: () => void;
}

const TodaysScheduleCard: React.FC<TodaysScheduleCardProps> = ({ stats, onViewAll, onAddWalkIn }) => {
  return (
    <LinearGradient
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      colors={['#4C1D95', colors.gray[700]]}
      style={styles.gradientCard}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Today's Schedule</Text>
        <Ionicons name="calendar" size={24} color={colors.white} />
      </View>
      
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.todayAppointments}</Text>
          <Text style={styles.statLabel}>Appointments</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.todayCutsUsed}</Text>
          <Text style={styles.statLabel}>Cuts Used</Text>
        </View>
      </View>
      
      {stats.nextAppt && (
        <View style={styles.nextRow}>
          <Text style={styles.nextText}>
            Next: {stats.nextAppt.timeLabel} - {stats.nextAppt.clientName}
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        {onAddWalkIn && (
          <TouchableOpacity onPress={onAddWalkIn} style={styles.addWalkInButton}>
            <Ionicons name="person-add" size={18} color={colors.accent.primary} />
            <Text style={styles.addWalkInText}>Add Walk-In</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={onViewAll} style={styles.viewAllButtonNew}>
          <Text style={styles.viewAllTextNew}>View All</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.white} />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.white,
    opacity: 0.9,
  },
  nextRow: {
    marginBottom: spacing.md,
  },
  nextText: {
    fontSize: typography.fontSize.base,
    color: colors.white,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  addWalkInButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.white,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  addWalkInText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.accent.primary,
  },
  viewAllButtonNew: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  viewAllTextNew: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  viewAllButton: {
    paddingHorizontal: spacing.sm,
  },
  viewAllText: {
    fontSize: typography.fontSize.sm,
    color: colors.white,
    fontWeight: typography.fontWeight.medium,
  },
});

export default TodaysScheduleCard;
