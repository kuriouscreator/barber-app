import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types';
import { useApp } from '../context/AppContext';
import { BillingService, Plan } from '../services/billing';
import { billingLinkManager } from '../lib/billingLinking';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';
import PaymentButton from '../components/PaymentButton';

type SubscriptionScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Subscription'>;

interface Props {
  navigation: SubscriptionScreenNavigationProp;
}

const SubscriptionScreen: React.FC<Props> = ({ navigation }) => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const { state, refreshSubscription } = useApp();

  useEffect(() => {
    loadPlans();
    
    // Set up deep link handler for billing success/cancel
    const unsubscribe = billingLinkManager.addHandler({
      onSuccess: (sessionId) => {
        console.log('Subscription activated:', sessionId);
        Alert.alert(
          'Success!',
          'Your subscription has been activated! You can now start booking haircuts.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      },
      onCancel: () => {
        console.log('Subscription cancelled');
        setIsProcessing(false);
      },
    });

    return unsubscribe;
  }, [navigation]);

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

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handlePaymentSuccess = async (transactionId: string) => {
    const selectedPlanData = plans.find(plan => plan.id === selectedPlan);
    if (selectedPlanData) {
      try {
        setIsProcessing(true);
        await BillingService.openNativeCheckout(selectedPlanData.stripe_price_id);
        // Realtime will automatically update the subscription data
        Alert.alert('Success', 'Subscription activated successfully! You can now start booking haircuts.');
        navigation.goBack();
      } catch (error) {
        console.error('Error opening checkout:', error);
        if (error.message === 'Payment was cancelled') {
          // Don't show error for user cancellation
          return;
        }
        Alert.alert('Error', 'Failed to process payment. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    setIsProcessing(false);
  };

  const renderPlanCard = (plan: Plan) => {
    const isSelected = selectedPlan === plan.id;
    
    if (isSelected) {
      return (
        <TouchableOpacity
          key={plan.id}
          onPress={() => handleSelectPlan(plan.id)}
        >
          <LinearGradient 
            start={{x:0, y:0}}
            end={{x:0, y:1}}
            colors={["#000080", "#1D4ED8"]}
            style={styles.planCard}
          >
            <View style={styles.planHeader}>
              <Text style={styles.planNameSelected}>
                {plan.name}
              </Text>
              <Text style={styles.planPriceSelected}>
                per {plan.interval}
              </Text>
            </View>
            
            <Text style={styles.planDescriptionSelected}>
              {plan.cuts_included_per_period} haircut{plan.cuts_included_per_period > 1 ? 's' : ''} included
            </Text>
            
            <View style={styles.planFeatures}>
              <View style={styles.feature}>
                <Ionicons 
                  name="checkmark-circle" 
                  size={16} 
                  color={colors.white} 
                />
                <Text style={styles.featureTextSelected}>
                  {plan.cuts_included_per_period} haircut{plan.cuts_included_per_period > 1 ? 's' : ''} included
                </Text>
              </View>
              <View style={styles.feature}>
                <Ionicons 
                  name="checkmark-circle" 
                  size={16} 
                  color={colors.white} 
                />
                <Text style={styles.featureTextSelected}>
                  Priority booking
                </Text>
              </View>
              <View style={styles.feature}>
                <Ionicons 
                  name="checkmark-circle" 
                  size={16} 
                  color={colors.white} 
                />
                <Text style={styles.featureTextSelected}>
                  Easy check-in
                </Text>
              </View>
            </View>
            
            <View style={styles.selectedIndicator}>
              <Ionicons name="checkmark" size={20} color={colors.white} />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      );
    }
    
    return (
      <TouchableOpacity
        key={plan.id}
        style={styles.planCard}
        onPress={() => handleSelectPlan(plan.id)}
      >
        <View style={styles.planHeader}>
          <Text style={styles.planName}>
            {plan.name}
          </Text>
          <Text style={styles.planPrice}>
            per {plan.interval}
          </Text>
        </View>
        
        <Text style={styles.planDescription}>
          {plan.cuts_included_per_period} haircut{plan.cuts_included_per_period > 1 ? 's' : ''} included
        </Text>
        
        <View style={styles.planFeatures}>
          <View style={styles.feature}>
            <Ionicons 
              name="checkmark-circle" 
              size={16} 
              color={colors.accent.success} 
            />
            <Text style={styles.featureText}>
              {plan.cuts_included_per_period} haircut{plan.cuts_included_per_period > 1 ? 's' : ''} included
            </Text>
          </View>
          <View style={styles.feature}>
            <Ionicons 
              name="checkmark-circle" 
              size={16} 
              color={colors.accent.success} 
            />
            <Text style={styles.featureText}>
              Priority booking
            </Text>
          </View>
          <View style={styles.feature}>
            <Ionicons 
              name="checkmark-circle" 
              size={16} 
              color={colors.accent.success} 
            />
            <Text style={styles.featureText}>
              Easy check-in
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
          <Text style={styles.loadingText}>Loading plans...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Choose Your Plan</Text>
          <Text style={styles.subtitle}>
            Select a subscription that fits your grooming needs
          </Text>
        </View>

        <View style={styles.plansContainer}>
          {plans.map(renderPlanCard)}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            All plans include unlimited booking and easy check-in. 
            Credits reset monthly.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        {selectedPlan && (
          <PaymentButton
            amount={0} // Stripe handles pricing
            description={`${plans.find(plan => plan.id === selectedPlan)?.name} subscription`}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
            disabled={!selectedPlan || isProcessing}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.base,
  },
  plansContainer: {
    marginBottom: spacing['2xl'],
  },
  planCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: colors.border.light,
    position: 'relative',
  },
  selectedPlanCard: {
    backgroundColor: colors.black,
    borderColor: colors.black,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  planName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  selectedPlanName: {
    color: colors.white,
  },
  planNameSelected: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  planPriceSelected: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  planDurationSelected: {
    fontSize: typography.fontSize.sm,
    color: colors.white,
    marginBottom: spacing.sm,
  },
  planDescriptionSelected: {
    fontSize: typography.fontSize.sm,
    color: colors.white,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  featureTextSelected: {
    fontSize: typography.fontSize.sm,
    color: colors.white,
    marginLeft: spacing.xs,
  },
  planPrice: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  selectedPlanPrice: {
    color: colors.white,
  },
  planDuration: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  selectedPlanDuration: {
    color: colors.gray[300],
  },
  planDescription: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.base,
  },
  selectedPlanDescription: {
    color: colors.gray[300],
  },
  planFeatures: {
    gap: spacing.sm,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  selectedFeatureText: {
    color: colors.gray[300],
  },
  selectedIndicator: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.full,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  footerText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.sm,
  },
  buttonContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.white,
    borderTopColor: colors.border.light,
    borderTopWidth: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
});

export default SubscriptionScreen;
