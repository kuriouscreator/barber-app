import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { borderRadius } from '../../theme/index';
import { formatWeekRange } from '../../utils/dateUtils';

interface WeekNavigatorProps {
  startDateISO: string;
  endDateISO: string;
  isCurrentWeek: boolean;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onGoToToday: () => void;
}

const WeekNavigator: React.FC<WeekNavigatorProps> = ({
  startDateISO,
  endDateISO,
  isCurrentWeek,
  onPrevWeek,
  onNextWeek,
  onGoToToday,
}) => {
  const weekRange = formatWeekRange(startDateISO, endDateISO);
  const labelSecondary = isCurrentWeek ? 'Current Week' : 'Selected Week';

  return (
    <View style={styles.container}>
      <View style={styles.navigationRow}>
        <TouchableOpacity onPress={onPrevWeek} style={styles.navButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        
        <View style={styles.dateContainer}>
          <Text style={styles.dateRange}>{weekRange}</Text>
          <Text style={styles.dateLabel}>{labelSecondary}</Text>
        </View>
        
        <TouchableOpacity onPress={onNextWeek} style={styles.navButton}>
          <Ionicons name="chevron-forward" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity 
        onPress={onGoToToday} 
        style={[
          styles.todayButton,
          isCurrentWeek && styles.todayButtonDisabled
        ]}
        disabled={isCurrentWeek}
      >
        <Text style={[
          styles.todayButtonText,
          isCurrentWeek && styles.todayButtonTextDisabled
        ]}>
          Go to Today
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderColor: colors.border.light,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
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
  navigationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  navButton: {
    padding: spacing.sm,
  },
  dateContainer: {
    flex: 1,
    alignItems: 'center',
  },
  dateRange: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  dateLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 2,
  },
  todayButton: {
    backgroundColor: colors.accent.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  todayButtonDisabled: {
    backgroundColor: colors.gray[300],
  },
  todayButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  todayButtonTextDisabled: {
    color: colors.gray[500],
  },
});

export default WeekNavigator;
