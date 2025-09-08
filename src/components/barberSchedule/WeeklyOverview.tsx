import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { borderRadius } from '../../theme/index';
import { DayRowData } from '../../types';

interface WeeklyOverviewProps {
  days: DayRowData[];
  legend: { availableColor: string; unavailableColor: string };
  onPressDay: (dayKey: string) => void;
  loading?: boolean;
}

interface DayRowProps {
  dayKey: string;
  dayLabel: string;
  timeLabel: string;
  meta: string;
  statusDot: 'green'|'yellow'|'blue'|'red';
  onPress: () => void;
}

const DayRow: React.FC<DayRowProps> = ({
  dayKey,
  dayLabel,
  timeLabel,
  meta,
  statusDot,
  onPress,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'green': return '#10B981';
      case 'yellow': return '#F59E0B';
      case 'blue': return '#3B82F6';
      case 'red': return '#EF4444';
      default: return colors.text.secondary;
    }
  };

  const getDayBadgeColor = (dayKey: string) => {
    switch (dayKey) {
      case 'mon': return '#10B981';
      case 'tue': return '#10B981';
      case 'wed': return '#F59E0B';
      case 'thu': return '#10B981';
      case 'fri': return '#10B981';
      case 'sat': return '#3B82F6';
      case 'sun': return '#EF4444';
      default: return colors.text.secondary;
    }
  };

  return (
    <TouchableOpacity style={styles.dayRow} onPress={onPress}>
      <View style={[styles.dayBadge, { backgroundColor: getDayBadgeColor(dayKey) }]}>
        <Text style={styles.dayBadgeText}>{dayKey.toUpperCase()}</Text>
      </View>
      
      <View style={styles.dayContent}>
        <Text style={styles.dayLabel}>{dayLabel}</Text>
        <Text style={[styles.timeLabel, { color: getDayBadgeColor(dayKey) }]}>{timeLabel}</Text>
        <Text style={styles.meta}>{meta}</Text>
      </View>
      
      <View style={styles.dayActions}>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor(statusDot) }]} />
        <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
      </View>
    </TouchableOpacity>
  );
};

const WeeklyOverview: React.FC<WeeklyOverviewProps> = ({
  days,
  legend,
  onPressDay,
  loading = false,
}) => {
  const renderDayRow = ({ item }: { item: DayRowData }) => (
    <DayRow
      dayKey={item.key}
      dayLabel={item.dayLabel}
      timeLabel={item.timeLabel}
      meta={item.meta}
      statusDot={item.status === 'available' ? 'green' : 
                 item.status === 'partial' ? 'yellow' :
                 item.status === 'weekend' ? 'blue' : 'red'}
      onPress={() => onPressDay(item.key)}
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Weekly Overview</Text>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: legend.availableColor }]} />
            <Text style={styles.legendText}>Available</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: legend.unavailableColor }]} />
            <Text style={styles.legendText}>Unavailable</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.daysContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading schedule...</Text>
          </View>
        ) : (
          <FlatList
            data={days}
            renderItem={renderDayRow}
            keyExtractor={(item) => item.key}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderColor: colors.border.light,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    marginHorizontal: 0, // Remove margin since parent now handles horizontal spacing
    marginVertical: spacing.md,
    shadowColor: '#0000000D',
    shadowOpacity: 0.1,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  legend: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  daysContainer: {
    padding: spacing.lg,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  dayBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  dayBadgeText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  dayContent: {
    flex: 1,
  },
  dayLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  timeLabel: {
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
  meta: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  dayActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border.light,
    marginVertical: spacing.sm,
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
});

export default WeeklyOverview;
