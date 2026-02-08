import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import RBSheet from 'react-native-raw-bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { haptics } from '../utils/haptics';
import { BillingService, Plan } from '../services/billing';

interface SubscriptionManagementSheetProps {
  currentPlan?: any;
  onUpgrade?: (plan: Plan) => void;
  onCancel?: () => void;
  onClose?: () => void;
}

export const SubscriptionManagementSheet = forwardRef<any, SubscriptionManagementSheetProps>(
  ({ currentPlan, onUpgrade, onCancel, onClose }, ref) => {
    const rbSheetRef = useRef<any>(null);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

    // Load plans when sheet opens
    useEffect(() => {
      loadPlans();
    }, []);

    const loadPlans = async () => {
      try {
        setLoading(true);
        const plansData = await BillingService.getPlans();
        setPlans(plansData);

        // If user has a current plan, select it by matching stripe_price_id
        if (currentPlan?.stripe_price_id) {
          const matchingPlan = plansData.find(p => p.stripe_price_id === currentPlan.stripe_price_id);
          if (matchingPlan) {
            setSelectedPlan(matchingPlan.id);
          } else if (plansData.length > 0) {
            // Fallback to first plan if no match found
            setSelectedPlan(plansData[0].id);
          }
        } else if (plansData.length > 0 && !selectedPlan) {
          // No current plan, default to first plan
          setSelectedPlan(plansData[0].id);
        }
      } catch (error) {
        console.error('Error loading plans:', error);
        Alert.alert('Error', 'Failed to load subscription plans');
      } finally {
        setLoading(false);
      }
    };

    // Expose open and close methods to parent
    useImperativeHandle(ref, () => ({
      open: () => rbSheetRef.current?.open(),
      close: () => rbSheetRef.current?.close(),
    }));

    const handleClose = () => {
      rbSheetRef.current?.close();
      if (onClose) onClose();
    };

    const handleSelectPlan = (planId: string) => {
      haptics.selection();
      setSelectedPlan(planId);
    };

    const handleSubscribe = async () => {
      if (!selectedPlan || isProcessing) return;

      const plan = plans.find(p => p.id === selectedPlan);
      if (!plan) return;

      // Check if user is selecting the same plan they already have
      if (currentPlan?.stripe_price_id === plan.stripe_price_id) {
        Alert.alert('Same Plan', 'You are already subscribed to this plan.');
        return;
      }

      try {
        haptics.light();
        setIsProcessing(true);

        console.log('🔄 handleSubscribe called for plan:', plan.name);
        console.log('📋 Current plan data:', currentPlan);

        // Check if user has an existing subscription
        const hasSubscription = currentPlan?.stripe_subscription_id || currentPlan?.status;

        console.log('🔍 Subscription check:', {
          hasSubscription,
          stripe_subscription_id: currentPlan?.stripe_subscription_id,
          status: currentPlan?.status,
        });

        if (hasSubscription) {
          console.log('✅ User has existing subscription, checking upgrade/downgrade...');
          // Determine if this is an upgrade or downgrade
          const currentPlanData = plans.find(p => p.stripe_price_id === currentPlan.stripe_price_id);
          const isDowngrade = currentPlanData && plan.cuts_included_per_period < currentPlanData.cuts_included_per_period;

          console.log('📊 Plan comparison:', {
            currentPlanName: currentPlanData?.name,
            currentCuts: currentPlanData?.cuts_included_per_period,
            newPlanName: plan.name,
            newCuts: plan.cuts_included_per_period,
            isDowngrade,
          });

          if (isDowngrade) {
            // For downgrades, confirm with user and update without payment
            Alert.alert(
              'Confirm Downgrade',
              'Your plan will be downgraded at the end of your current billing period. You will not be charged.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Confirm',
                  onPress: async () => {
                    try {
                      await BillingService.updateSubscription(plan.stripe_price_id);
                      Alert.alert(
                        'Success!',
                        'Your plan will be downgraded at the end of your current billing period.',
                        [{ text: 'OK', onPress: handleClose }]
                      );
                      if (onUpgrade) {
                        onUpgrade(plan);
                      }
                    } catch (error: any) {
                      console.error('Error downgrading:', error);
                      Alert.alert('Error', error.message || 'Failed to downgrade plan. Please try again.');
                    } finally {
                      setIsProcessing(false);
                    }
                  }
                }
              ]
            );
            return;
          } else {
            // For upgrades, update with proration (requires payment)
            console.log('⬆️ Upgrading subscription immediately...');
            console.log('🔑 Calling BillingService.updateSubscription with price:', plan.stripe_price_id);
            const result = await BillingService.updateSubscription(plan.stripe_price_id);
            console.log('✅ Update subscription result:', result);

            Alert.alert(
              'Success!',
              'Your subscription has been updated! You\'ll see prorated charges on your next invoice.',
              [{ text: 'OK', onPress: handleClose }]
            );
          }
        } else {
          console.log('🆕 No existing subscription, creating new one...');
          // Create new subscription via checkout
          await BillingService.openNativeCheckout(plan.stripe_price_id);

          Alert.alert(
            'Success!',
            'Your subscription has been activated!',
            [{ text: 'OK', onPress: handleClose }]
          );
        }

        if (onUpgrade) {
          onUpgrade(plan);
        }
      } catch (error: any) {
        // Only log and show alert if it's not a user cancellation
        if (error?.message !== 'Payment was cancelled') {
          console.error('❌ Error subscribing:', error);
          console.error('❌ Error details:', JSON.stringify(error, null, 2));
          Alert.alert('Error', error.message || 'Failed to process payment. Please try again.');
        } else {
          console.log('ℹ️ Payment was cancelled by user');
        }
      } finally {
        setIsProcessing(false);
      }
    };

    const handleCancelSubscription = () => {
      haptics.light();
      Alert.alert(
        'Cancel Subscription',
        'Are you sure you want to cancel your subscription? You will lose access to all premium benefits.',
        [
          { text: 'Keep Subscription', style: 'cancel' },
          {
            text: 'Cancel',
            style: 'destructive',
            onPress: () => {
              if (onCancel) onCancel();
              handleClose();
            },
          },
        ]
      );
    };

    const getBillingText = (plan: Plan) => {
      return `Billed ${plan.interval === 'month' ? 'monthly' : 'yearly'}`;
    };

    const getSavingsText = (plan: Plan) => {
      // You could calculate savings here if you have a base plan
      // For now, we'll just highlight the most popular plan
      return null;
    };

    return (
      <RBSheet
        ref={rbSheetRef}
        height={620}
        closeOnDragDown
        closeOnPressMask
        customStyles={{
          wrapper: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          },
          draggableIcon: {
            backgroundColor: colors.gray[300],
            width: 40,
            height: 5,
          },
          container: {
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingHorizontal: 0,
          },
        }}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.gray[600]} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Select plan</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.gray[800]} />
                <Text style={styles.loadingText}>Loading plans...</Text>
              </View>
            ) : (
              <>
                {/* Plan Cards */}
                <View style={styles.plansContainer}>
                  {plans.map((plan) => (
                    <TouchableOpacity
                      key={plan.id}
                      style={[
                        styles.planCard,
                        selectedPlan === plan.id && styles.planCardSelected,
                      ]}
                      onPress={() => handleSelectPlan(plan.id)}
                      activeOpacity={0.7}
                    >
                      {/* Plan Header */}
                      <View style={styles.planHeader}>
                        <Text style={styles.planName}>{plan.name}</Text>
                        <View
                          style={[
                            styles.radioButton,
                            selectedPlan === plan.id && styles.radioButtonSelected,
                          ]}
                        >
                          {selectedPlan === plan.id && (
                            <View style={styles.radioButtonInner} />
                          )}
                        </View>
                      </View>

                      {/* Cuts and Price */}
                      <View style={styles.priceRow}>
                        <Text style={styles.price}>{plan.cuts_included_per_period}</Text>
                        <View style={styles.priceDetails}>
                          <Text style={styles.period}> cuts</Text>
                        </View>
                      </View>

                      {/* Price and Billing Info */}
                      <View style={styles.priceInfoRow}>
                        <Text style={styles.priceAmount}>
                          ${plan.price_amount ? (plan.price_amount / 100).toFixed(2) : '0.00'}
                        </Text>
                        <Text style={styles.billingText}>/{plan.interval}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Proration Info */}
                {selectedPlan && currentPlan?.stripe_price_id && selectedPlan !== plans.find(p => p.stripe_price_id === currentPlan.stripe_price_id)?.id && (() => {
                  const newPlan = plans.find(p => p.id === selectedPlan);
                  const oldPlan = plans.find(p => p.stripe_price_id === currentPlan.stripe_price_id);
                  if (!newPlan || !oldPlan) return null;

                  const isUpgrade = newPlan.cuts_included_per_period > oldPlan.cuts_included_per_period;

                  return (
                    <View style={styles.prorationInfo}>
                      <View style={styles.prorationHeader}>
                        <Ionicons
                          name={isUpgrade ? "arrow-up-circle" : "arrow-down-circle"}
                          size={20}
                          color={isUpgrade ? colors.gray[800] : colors.gray[600]}
                        />
                        <Text style={styles.prorationTitle}>
                          {isUpgrade ? 'Upgrade' : 'Downgrade'} Summary
                        </Text>
                      </View>
                      <View style={styles.prorationDetails}>
                        <View style={styles.prorationRow}>
                          <Text style={styles.prorationLabel}>Current Plan</Text>
                          <Text style={styles.prorationValue}>{oldPlan.name}</Text>
                        </View>
                        <View style={styles.prorationRow}>
                          <Text style={styles.prorationLabel}>New Plan</Text>
                          <Text style={styles.prorationValue}>{newPlan.name}</Text>
                        </View>
                        {isUpgrade && (
                          <>
                            <View style={styles.prorationDivider} />
                            <View style={styles.prorationRow}>
                              <Text style={styles.prorationLabel}>New Price</Text>
                              <Text style={styles.prorationValueBold}>
                                ${newPlan.price_amount ? (newPlan.price_amount / 100).toFixed(2) : '0.00'}/{newPlan.interval}
                              </Text>
                            </View>
                            <Text style={styles.prorationNote}>
                              You'll be charged a prorated amount for the remainder of your billing period.
                            </Text>
                          </>
                        )}
                        {!isUpgrade && (
                          <Text style={styles.prorationNote}>
                            Your plan will change at the end of your current billing period. No charge today.
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })()}

                {/* Subscribe Button */}
                <TouchableOpacity
                  style={[styles.subscribeButton, isProcessing && styles.subscribeButtonDisabled]}
                  onPress={handleSubscribe}
                  activeOpacity={0.8}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <ActivityIndicator color={colors.white} size="small" />
                      <Text style={[styles.subscribeButtonText, { marginLeft: 8 }]}>Processing...</Text>
                    </>
                  ) : (
                    <Text style={styles.subscribeButtonText}>
                      {selectedPlan && currentPlan?.stripe_price_id && selectedPlan === plans.find(p => p.stripe_price_id === currentPlan.stripe_price_id)?.id
                        ? 'Current Plan'
                        : 'Subscribe now'}
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {/* Cancel Subscription Link */}
            {currentPlan && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelSubscription}
              >
                <Text style={styles.cancelButtonText}>Cancel Subscription</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </RBSheet>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  closeButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },

  // Plans Container
  plansContainer: {
    padding: 20,
    gap: 12,
  },

  // Plan Card
  planCard: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 20,
    position: 'relative',
  },
  planCardSelected: {
    borderColor: colors.gray[800],
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
  },
  savingsBadge: {
    position: 'absolute',
    top: -1,
    right: 20,
    backgroundColor: colors.gray[800],
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  savingsText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.5,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[800],
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: colors.gray[800],
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.gray[800],
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  price: {
    fontSize: 36,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 42,
  },
  priceDetails: {
    marginLeft: 4,
    marginTop: 4,
  },
  currency: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  period: {
    fontSize: 16,
    fontWeight: '400',
    color: '#6B7280',
  },
  billingText: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.gray[600],
  },
  priceInfoRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },
  priceAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.gray[900],
  },

  // Proration Info
  prorationInfo: {
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  prorationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  prorationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
  },
  prorationDetails: {
    gap: 8,
  },
  prorationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prorationLabel: {
    fontSize: 14,
    color: colors.gray[600],
  },
  prorationValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[800],
  },
  prorationValueBold: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray[900],
  },
  prorationDivider: {
    height: 1,
    backgroundColor: colors.gray[200],
    marginVertical: 4,
  },
  prorationNote: {
    fontSize: 12,
    color: colors.gray[600],
    marginTop: 8,
    lineHeight: 16,
  },

  // Loading
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },

  // Subscribe Button
  subscribeButton: {
    backgroundColor: colors.gray[800],
    borderRadius: 12,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
    shadowColor: colors.gray[800],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscribeButtonDisabled: {
    opacity: 0.6,
  },
  subscribeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
    textAlign: 'center',
  },

  // Cancel Button
  cancelButton: {
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
    textAlign: 'center',
  },
});

export default SubscriptionManagementSheet;
