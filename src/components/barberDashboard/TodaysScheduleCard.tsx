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
}

const TodaysScheduleCard: React.FC<TodaysScheduleCardProps> = ({ stats, onViewAll }) => {
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
          <TouchableOpacity onPress={onViewAll} style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
      )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nextText: {
    fontSize: typography.fontSize.base,
    color: colors.white,
    flex: 1,
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
