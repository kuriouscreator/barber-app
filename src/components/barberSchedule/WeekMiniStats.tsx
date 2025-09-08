import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { borderRadius } from '../../theme/index';

interface MiniStat {
  value: number;
  caption: string;
  icon: string;
}

interface WeekMiniStatsProps {
  availableSlots: MiniStat;
  booked: MiniStat;
}

const WeekMiniStats: React.FC<WeekMiniStatsProps> = ({
  availableSlots,
  booked,
}) => {
  const StatCard: React.FC<{ title: string; stat: MiniStat; color: string }> = ({
    title,
    stat,
    color,
  }) => (
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        <Text style={styles.statTitle}>{title}</Text>
        <Ionicons name={stat.icon as any} size={16} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{stat.value}</Text>
      <Text style={styles.statCaption}>{stat.caption}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatCard
        title="Available Slots"
        stat={availableSlots}
        color="#10B981"
      />
      <StatCard
        title="Booked"
        stat={booked}
        color="#3B82F6"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.md,
    marginHorizontal: 0, // Remove margin since parent now handles horizontal spacing
    marginVertical: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#0000000D',
    shadowOpacity: 0.1,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowRadius: 2,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  statValue: {
    fontSize: 24,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  statCaption: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
});

export default WeekMiniStats;
