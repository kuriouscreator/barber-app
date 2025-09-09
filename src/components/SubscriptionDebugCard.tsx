import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';

interface SubscriptionDebugCardProps {
  subscription: any;
  schedule: any;
  onRefresh: () => void;
}

const SubscriptionDebugCard: React.FC<SubscriptionDebugCardProps> = ({
  subscription,
  schedule,
  onRefresh,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Debug Info</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Subscription:</Text>
        <Text style={styles.debugText}>
          Plan: {subscription?.plan_name || 'None'}
        </Text>
        <Text style={styles.debugText}>
          Price ID: {subscription?.stripe_price_id || 'None'}
        </Text>
        <Text style={styles.debugText}>
          Status: {subscription?.status || 'None'}
        </Text>
        <Text style={styles.debugText}>
          Cuts: {subscription?.cuts_used || 0} / {subscription?.cuts_included || 0}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Scheduled Changes:</Text>
        <Text style={styles.debugText}>
          Has Scheduled: {schedule?.hasScheduledChange ? 'Yes' : 'No'}
        </Text>
        {schedule?.scheduledPlanName && (
          <>
            <Text style={styles.debugText}>
              Scheduled Plan: {schedule.scheduledPlanName}
            </Text>
            <Text style={styles.debugText}>
              Scheduled Price ID: {schedule.scheduledPriceId}
            </Text>
            <Text style={styles.debugText}>
              Effective Date: {schedule.scheduledEffectiveDate}
            </Text>
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Database Fields:</Text>
        <Text style={styles.debugText}>
          scheduled_plan_name: {subscription?.scheduled_plan_name || 'null'}
        </Text>
        <Text style={styles.debugText}>
          scheduled_price_id: {subscription?.scheduled_price_id || 'null'}
        </Text>
        <Text style={styles.debugText}>
          scheduled_effective_date: {subscription?.scheduled_effective_date || 'null'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  refreshButton: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.button,
  },
  refreshButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  debugText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    fontFamily: 'monospace',
    marginBottom: spacing.xs,
  },
});

export default SubscriptionDebugCard;
