import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius, shadows } from '../../theme/spacing';
import { SubscriptionInsights } from '../../types';

interface SubscriptionInsightsCardProps {
  insights: SubscriptionInsights;
}

const SubscriptionInsightsCard: React.FC<SubscriptionInsightsCardProps> = ({ insights }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Subscription Insights</Text>
        <Ionicons name="bar-chart" size={20} color={colors.text.secondary} />
      </View>
      
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Active Subscriptions</Text>
        </View>
        
        <View style={styles.plansRow}>
          {insights.plans.map((plan, index) => (
            <View key={index} style={styles.planChip}>
              <Text style={styles.planLabel}>{plan.label}</Text>
              <Text style={styles.planCount}>{plan.count}</Text>
            </View>
          ))}
        </View>
        
        {insights.reminderNote && (
          <View style={styles.reminderRow}>
            <Ionicons name="bulb" size={16} color={colors.accent.primary} />
            <Text style={styles.reminderText}>{insights.reminderNote}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  cardHeader: {
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  plansRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  planChip: {
    alignItems: 'center',
  },
  planLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  planCount: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  reminderText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    marginLeft: spacing.xs,
    flex: 1,
  },
});

export default SubscriptionInsightsCard;
