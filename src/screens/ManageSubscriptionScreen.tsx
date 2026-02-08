import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BillingService } from '../services/billing';
import { useSubscription } from '../hooks/useSubscription';
import { useSubscriptionSchedule } from '../hooks/useSubscriptionSchedule';
import ScheduledChangeCard from '../components/ScheduledChangeCard';
import SubscriptionDebugCard from '../components/SubscriptionDebugCard';
import PlanChangeModal from '../components/PlanChangeModal';
import { colors, spacing, borderRadius, shadows } from '../theme';

export default function ManageSubscriptionScreen() {
  const { subscription, cutsRemaining, daysLeft, loading, error, refresh, isActive, statusText } = useSubscription();
  const { schedule, loading: scheduleLoading, scheduleDowngrade, cancelScheduledDowngrade, refreshSchedule } = useSubscriptionSchedule();
  const [isManaging, setIsManaging] = useState(false);
  const [showPlanChangeModal, setShowPlanChangeModal] = useState(false);

  const handleManageSubscription = async () => {
    try {
      setIsManaging(true);
      await BillingService.openBillingPortal();
      // Refresh subscription data when user returns
      setTimeout(() => {
        refresh();
      }, 1000);
    } catch (error) {
      console.error('Error opening billing portal:', error);
      Alert.alert('Error', 'Failed to open billing portal. Please try again.');
    } finally {
      setIsManaging(false);
    }
  };

  const handleSelectNewPlan = () => {
    setShowPlanChangeModal(true);
  };

  const handlePlanChange = async () => {
    // Refresh both subscription and schedule data after plan change
    await Promise.all([refresh(), refreshSchedule()]);
  };

  const handleCancelScheduledChange = async () => {
    try {
      if (schedule?.scheduleDetails?.id) {
        await cancelScheduledDowngrade(schedule.scheduleDetails.id);
        // Refresh both the schedule and subscription data
        await Promise.all([refreshSchedule(), refresh()]);
        Alert.alert('Success', 'Scheduled change has been canceled');
      }
    } catch (error) {
      console.error('Error canceling scheduled change:', error);
      Alert.alert('Error', 'Failed to cancel scheduled change. Please try again.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
          <Text style={styles.loadingText}>Loading subscription...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error loading subscription</Text>
          <Text style={styles.errorSubtext}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!subscription) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>No Active Subscription</Text>
            <Text style={styles.subtitle}>
              Choose a plan to start booking haircuts
            </Text>
          </View>

          <View style={styles.noSubscriptionCard}>
            <Text style={styles.noSubscriptionIcon}>💇‍♂️</Text>
            <Text style={styles.noSubscriptionTitle}>Get Started</Text>
            <Text style={styles.noSubscriptionText}>
              Select a subscription plan to start booking haircuts with our professional barbers.
            </Text>
            <TouchableOpacity style={styles.selectPlanButton} onPress={handleSelectNewPlan}>
              <Text style={styles.selectPlanButtonText}>Choose a Plan</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Manage Subscription</Text>
          <Text style={styles.subtitle}>
            View and manage your subscription details
          </Text>
        </View>

        {/* Debug Card - Remove this after testing */}
        <SubscriptionDebugCard
          subscription={subscription}
          schedule={schedule}
          onRefresh={() => {
            refresh();
            refreshSchedule();
          }}
        />

        {/* Scheduled Change Card */}
        {schedule?.hasScheduledChange && schedule.scheduledPlanName && schedule.scheduledEffectiveDate && (
          <ScheduledChangeCard
            scheduledPlanName={schedule.scheduledPlanName}
            scheduledEffectiveDate={schedule.scheduledEffectiveDate}
            onCancel={handleCancelScheduledChange}
            loading={scheduleLoading}
          />
        )}

        <View style={styles.subscriptionCard}>
          <View style={styles.planHeader}>
            <Text style={styles.planName}>{subscription.plan_name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: isActive ? colors.accent.success : colors.accent.error }]}>
              <Text style={styles.statusText}>{statusText}</Text>
            </View>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{cutsRemaining}</Text>
              <Text style={styles.statLabel}>Cuts Remaining</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{daysLeft}</Text>
              <Text style={styles.statLabel}>Days Left</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{subscription.cuts_included}</Text>
              <Text style={styles.statLabel}>Total Cuts</Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${(subscription.cuts_used / subscription.cuts_included) * 100}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {subscription.cuts_used} of {subscription.cuts_included} cuts used
            </Text>
          </View>

          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Current Period</Text>
              <Text style={styles.detailValue}>
                {new Date(subscription.current_period_start).toLocaleDateString()} - {' '}
                {new Date(subscription.current_period_end).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Next Billing</Text>
              <Text style={styles.detailValue}>
                {new Date(subscription.current_period_end).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.changePlanButton} onPress={handleSelectNewPlan}>
            <Text style={styles.changePlanButtonText}>Change Plan</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.manageButton}
            onPress={handleManageSubscription}
            disabled={isManaging}
          >
            {isManaging ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={styles.manageButtonText}>Billing Portal</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>About Your Subscription</Text>
          <Text style={styles.infoText}>
            • Unused cuts roll over to the next billing period{'\n'}
            • You can upgrade or downgrade your plan at any time{'\n'}
            • Cancel anytime with no cancellation fees{'\n'}
            • All plans include access to our network of professional barbers
          </Text>
        </View>
      </ScrollView>

      {/* Plan Change Modal */}
      <PlanChangeModal
        visible={showPlanChangeModal}
        onClose={() => setShowPlanChangeModal(false)}
        currentPlan={subscription?.plan_name || ''}
        onPlanChange={handlePlanChange}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.accent.error,
    marginBottom: spacing.sm,
  },
  errorSubtext: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.accent.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.button,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  subscriptionCard: {
    backgroundColor: colors.white,
    margin: spacing.lg,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.md,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  statusBadge: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.button,
  },
  statusText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.accent.primary,
  },
  statLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border.light,
    marginHorizontal: spacing.md,
  },
  progressContainer: {
    marginBottom: spacing.lg,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent.primary,
  },
  progressText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  detailsContainer: {
    marginBottom: spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  detailValue: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '500',
  },
  actionsContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  manageButton: {
    backgroundColor: colors.accent.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.button,
    alignItems: 'center',
  },
  manageButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  changePlanButton: {
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.button,
    alignItems: 'center',
    borderWidth: 2,
  },
  changePlanButtonText: {
    color: colors.accent.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  noSubscriptionCard: {
    backgroundColor: colors.white,
    margin: spacing.lg,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.md,
  },
  noSubscriptionIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  noSubscriptionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  noSubscriptionText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  selectPlanButton: {
    backgroundColor: colors.accent.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.button,
  },
  selectPlanButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    padding: spacing.lg,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  infoText: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
});
