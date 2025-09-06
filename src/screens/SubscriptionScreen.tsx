import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types';
import { useApp } from '../context/AppContext';
import { mockSubscriptions } from '../data/mockData';
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
  const { state, dispatch } = useApp();

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handlePaymentSuccess = (transactionId: string) => {
    const selectedSubscription = mockSubscriptions.find(plan => plan.id === selectedPlan);
    if (selectedSubscription && state.user) {
      // Update user with subscription and credits
      const updatedUser = {
        ...state.user,
        subscription: selectedSubscription,
        credits: selectedSubscription.credits,
      };
      dispatch({ type: 'SET_USER', payload: updatedUser });
      dispatch({ type: 'SET_SUBSCRIPTIONS', payload: mockSubscriptions });
      
      Alert.alert(
        'Success!',
        `You've successfully subscribed to the ${selectedSubscription.name} plan!`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
  };

  const renderPlanCard = (plan: typeof mockSubscriptions[0]) => {
    const isSelected = selectedPlan === plan.id;
    
    return (
      <TouchableOpacity
        key={plan.id}
        style={[
          styles.planCard,
          isSelected && styles.selectedPlanCard,
        ]}
        onPress={() => handleSelectPlan(plan.id)}
      >
        <View style={styles.planHeader}>
          <Text style={[
            styles.planName,
            isSelected && styles.selectedPlanName,
          ]}>
            {plan.name}
          </Text>
          <Text style={[
            styles.planPrice,
            isSelected && styles.selectedPlanPrice,
          ]}>
            ${plan.price}
          </Text>
        </View>
        
        <Text style={[
          styles.planDuration,
          isSelected && styles.selectedPlanDuration,
        ]}>
          per {plan.duration}
        </Text>
        
        <Text style={[
          styles.planDescription,
          isSelected && styles.selectedPlanDescription,
        ]}>
          {plan.description}
        </Text>
        
        <View style={styles.planFeatures}>
          <View style={styles.feature}>
            <Ionicons 
              name="checkmark-circle" 
              size={16} 
              color={isSelected ? colors.white : colors.accent.success} 
            />
            <Text style={[
              styles.featureText,
              isSelected && styles.selectedFeatureText,
            ]}>
              {plan.credits} haircut{plan.credits > 1 ? 's' : ''} included
            </Text>
          </View>
          <View style={styles.feature}>
            <Ionicons 
              name="checkmark-circle" 
              size={16} 
              color={isSelected ? colors.white : colors.accent.success} 
            />
            <Text style={[
              styles.featureText,
              isSelected && styles.selectedFeatureText,
            ]}>
              Priority booking
            </Text>
          </View>
          <View style={styles.feature}>
            <Ionicons 
              name="checkmark-circle" 
              size={16} 
              color={isSelected ? colors.white : colors.accent.success} 
            />
            <Text style={[
              styles.featureText,
              isSelected && styles.selectedFeatureText,
            ]}>
              Easy check-in
            </Text>
          </View>
        </View>
        
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Ionicons name="checkmark" size={20} color={colors.black} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

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
          {mockSubscriptions.map(renderPlanCard)}
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
            amount={mockSubscriptions.find(plan => plan.id === selectedPlan)?.price || 0}
            description={`${mockSubscriptions.find(plan => plan.id === selectedPlan)?.name} subscription`}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
            disabled={!selectedPlan}
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
});

export default SubscriptionScreen;
