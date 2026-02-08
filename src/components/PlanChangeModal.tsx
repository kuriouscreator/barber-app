import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BillingService, Plan } from '../services/billing';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';

interface PlanChangeModalProps {
  visible: boolean;
  onClose: () => void;
  currentPlan: string;
  onPlanChange: () => void;
}

const PlanChangeModal: React.FC<PlanChangeModalProps> = ({
  visible,
  onClose,
  currentPlan,
  onPlanChange,
}) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      loadPlans();
    }
  }, [visible]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const plansData = await BillingService.getPlans();
      setPlans(plansData);
    } catch (error) {
      console.error('Error loading plans:', error);
      Alert.alert('Error', 'Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = async (plan: Plan) => {
    console.log('🔄 Plan selection started:', plan.name);

    if (plan.name === currentPlan) {
      Alert.alert('Same Plan', 'You are already on this plan');
      return;
    }

    try {
      setSelectedPlan(plan.id);

      // Check if this is a downgrade (fewer cuts)
      const currentPlanData = plans.find(p => p.name === currentPlan);
      const isDowngrade = currentPlanData && plan.cuts_included_per_period < currentPlanData.cuts_included_per_period;

      console.log('📊 Plan change analysis:', {
        currentPlan: currentPlanData?.name,
        currentCuts: currentPlanData?.cuts_included_per_period,
        newPlan: plan.name,
        newCuts: plan.cuts_included_per_period,
        isDowngrade,
        priceId: plan.stripe_price_id,
      });

      if (isDowngrade) {
        console.log('⬇️ Scheduling downgrade...');
        // Use scheduled downgrade for downgrades
        await BillingService.scheduleDowngrade(plan.stripe_price_id);
        Alert.alert(
          'Downgrade Scheduled',
          `Your plan will change to ${plan.name} at the end of your current billing period. You'll keep your current benefits until then.`,
          [{ text: 'OK', onPress: onClose }]
        );
      } else {
        console.log('⬆️ Upgrading subscription immediately...');
        // Use updateSubscription for upgrades (immediate proration)
        const result = await BillingService.updateSubscription(plan.stripe_price_id);
        console.log('✅ Upgrade result:', result);
        Alert.alert(
          'Upgrade Successful',
          'Your plan has been upgraded! You can now enjoy your new benefits.',
          [{ text: 'OK', onPress: onClose }]
        );
      }

      onPlanChange();
    } catch (error) {
      console.error('❌ Error changing plan:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      Alert.alert('Error', `Failed to change plan: ${error.message || 'Please try again.'}`);
    } finally {
      setSelectedPlan(null);
    }
  };

  const renderPlanCard = (plan: Plan) => {
    const isCurrentPlan = plan.name === currentPlan;
    const isSelected = selectedPlan === plan.id;
    const isPopular = plan.name.toLowerCase().includes('premium');

    return (
      <TouchableOpacity
        key={plan.id}
        style={[
          styles.planCard,
          isCurrentPlan && styles.currentPlanCard,
          isPopular && styles.popularCard,
          isSelected && styles.selectedCard,
        ]}
        onPress={() => handlePlanSelect(plan)}
        disabled={isCurrentPlan || isSelected}
      >
        {isCurrentPlan && (
          <View style={styles.currentPlanBadge}>
            <Text style={styles.currentPlanBadgeText}>Current Plan</Text>
          </View>
        )}
        
        {isPopular && !isCurrentPlan && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularBadgeText}>Most Popular</Text>
          </View>
        )}

        <View style={styles.planHeader}>
          <Text style={styles.planName}>{plan.name}</Text>
          <Text style={styles.planInterval}>
            per {plan.interval === 'month' ? 'month' : 'year'}
          </Text>
        </View>

        <View style={styles.planFeatures}>
          <View style={styles.featureRow}>
            <Ionicons name="cut" size={16} color={colors.accent.primary} />
            <Text style={styles.featureText}>
              {plan.cuts_included_per_period} haircut{plan.cuts_included_per_period > 1 ? 's' : ''} included
            </Text>
          </View>
          <View style={styles.featureRow}>
            <Ionicons name="calendar" size={16} color={colors.accent.primary} />
            <Text style={styles.featureText}>
              {plan.interval === 'month' ? 'Monthly' : 'Yearly'} billing
            </Text>
          </View>
          <View style={styles.featureRow}>
            <Ionicons name="refresh" size={16} color={colors.accent.primary} />
            <Text style={styles.featureText}>
              Unused cuts roll over
            </Text>
          </View>
        </View>

        {isSelected ? (
          <View style={styles.loadingButton}>
            <ActivityIndicator color={colors.white} size="small" />
            <Text style={styles.loadingButtonText}>Processing...</Text>
          </View>
        ) : (
          <View style={[
            styles.selectButton,
            isCurrentPlan && styles.currentPlanButton
          ]}>
            <Text style={[
              styles.selectButtonText,
              isCurrentPlan && styles.currentPlanButtonText
            ]}>
              {isCurrentPlan ? 'Current Plan' : 'Select Plan'}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Change Plan</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.subtitle}>
            Choose a plan that fits your needs. Downgrades will take effect at the end of your current billing period.
          </Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.accent.primary} />
              <Text style={styles.loadingText}>Loading plans...</Text>
            </View>
          ) : (
            <View style={styles.plansContainer}>
              {plans.map(renderPlanCard)}
            </View>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              💡 <Text style={styles.footerBold}>Tip:</Text> Downgrades are scheduled for the end of your billing period, so you keep your current benefits until then.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
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
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  closeButton: {
    padding: spacing.sm,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  plansContainer: {
    gap: spacing.lg,
  },
  planCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.md,
    borderWidth: 2,
    borderColor: colors.border.light,
    position: 'relative',
  },
  currentPlanCard: {
    borderColor: colors.accent.success,
    backgroundColor: colors.accent.success + '10',
  },
  popularCard: {
    borderColor: colors.accent.primary,
    transform: [{ scale: 1.02 }],
  },
  selectedCard: {
    borderColor: colors.accent.primary,
  },
  currentPlanBadge: {
    position: 'absolute',
    top: -10,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.accent.success,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.button,
    alignItems: 'center',
  },
  currentPlanBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.accent.primary,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.button,
    alignItems: 'center',
  },
  popularBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  planHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  planInterval: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  planFeatures: {
    marginBottom: spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  featureText: {
    fontSize: 16,
    color: colors.text.primary,
    marginLeft: spacing.sm,
    flex: 1,
  },
  selectButton: {
    backgroundColor: colors.accent.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.button,
    alignItems: 'center',
  },
  currentPlanButton: {
    backgroundColor: colors.accent.success,
  },
  selectButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  currentPlanButtonText: {
    color: colors.white,
  },
  loadingButton: {
    backgroundColor: colors.accent.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.button,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loadingButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  footer: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
  },
  footerText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  footerBold: {
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
});

export default PlanChangeModal;
