import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BillingService, Plan } from '../services/billing';
import { billingLinkManager } from '../lib/billingLinking';
import { colors, spacing, borderRadius, shadows } from '../theme';

export default function PlansScreen() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    loadPlans();

    // Set up deep link handler for billing success/cancel
    const unsubscribe = billingLinkManager.addHandler({
      onSuccess: (sessionId) => {
        console.log('Subscription activated:', sessionId);
        // Optionally refresh plans or navigate away
      },
      onCancel: () => {
        console.log('Subscription cancelled');
      },
    });

    return unsubscribe;
  }, []);

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

  const handleSelectPlan = async (plan: Plan) => {
    try {
      setSelectedPlan(plan.id);
      await BillingService.openCheckout(plan.stripe_price_id);
      // The user will be redirected back via deep link
    } catch (error) {
      console.error('Error opening checkout:', error);
      Alert.alert('Error', 'Failed to open checkout. Please try again.');
    } finally {
      setSelectedPlan(null);
    }
  };

  const renderPlanCard = (plan: Plan) => {
    const isSelected = selectedPlan === plan.id;
    const isPopular = plan.name.toLowerCase().includes('premium');

    return (
      <View
        key={plan.id}
        style={[
          styles.planCard,
          isPopular && styles.popularCard,
          isSelected && styles.selectedCard,
        ]}
      >
        {isPopular && (
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
            <Text style={styles.featureIcon}>✂️</Text>
            <Text style={styles.featureText}>
              {plan.cuts_included_per_period} haircuts included
            </Text>
          </View>
          <View style={styles.featureRow}>
            <Text style={styles.featureIcon}>📅</Text>
            <Text style={styles.featureText}>
              {plan.interval === 'month' ? 'Monthly' : 'Yearly'} billing
            </Text>
          </View>
          <View style={styles.featureRow}>
            <Text style={styles.featureIcon}>🔄</Text>
            <Text style={styles.featureText}>
              Unused cuts roll over
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.selectButton,
            isSelected && styles.selectButtonSelected,
          ]}
          onPress={() => handleSelectPlan(plan)}
          disabled={isSelected}
        >
          {isSelected ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Text style={styles.selectButtonText}>Select Plan</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
          <Text style={styles.loadingText}>Loading plans...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Choose Your Plan</Text>
          <Text style={styles.subtitle}>
            Select a subscription plan that fits your needs
          </Text>
        </View>

        <View style={styles.plansContainer}>
          {plans.map(renderPlanCard)}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            All plans include access to our network of professional barbers
            and the ability to book appointments at your convenience.
          </Text>
        </View>
      </ScrollView>
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
  plansContainer: {
    paddingHorizontal: spacing.lg,
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
  popularCard: {
    borderColor: colors.accent.primary,
    transform: [{ scale: 1.02 }],
  },
  selectedCard: {
    borderColor: colors.accent.success,
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
  featureIcon: {
    fontSize: 20,
    marginRight: spacing.md,
    width: 24,
  },
  featureText: {
    fontSize: 16,
    color: colors.text.primary,
    flex: 1,
  },
  selectButton: {
    backgroundColor: colors.accent.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.button,
    alignItems: 'center',
  },
  selectButtonSelected: {
    backgroundColor: colors.accent.success,
  },
  selectButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
