import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { borderRadius } from '../../theme/index';

interface WeekStatsCardProps {
  hoursTotalLabel: string;
  hoursValue: string;
  metaLeft: string;
  metaRight: string;
}

const WeekStatsCard: React.FC<WeekStatsCardProps> = ({
  hoursTotalLabel,
  hoursValue,
  metaLeft,
  metaRight,
}) => {
  return (
    <LinearGradient
      colors={[colors.gray[700], '#3B82F6']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <Text style={styles.label}>{hoursTotalLabel}</Text>
          <Text style={styles.value}>{hoursValue}</Text>
          <Text style={styles.meta}>{metaLeft}</Text>
        </View>
        
        <View style={styles.rightSection}>
          <View style={styles.iconContainer}>
            <Ionicons name="time" size={24} color={colors.white} />
          </View>
          <Text style={styles.metaRight}>{metaRight}</Text>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
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
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  leftSection: {
    flex: 1,
  },
  label: {
    fontSize: typography.fontSize.sm,
    color: colors.white,
    opacity: 0.9,
  },
  value: {
    fontSize: 32,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    marginTop: spacing.xs,
  },
  meta: {
    fontSize: typography.fontSize.sm,
    color: colors.white,
    opacity: 0.8,
    marginTop: spacing.xs,
  },
  rightSection: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  metaRight: {
    fontSize: typography.fontSize.sm,
    color: colors.white,
    opacity: 0.8,
    textAlign: 'center',
  },
});

export default WeekStatsCard;
