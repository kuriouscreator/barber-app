import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
                ${plan.price}
              </Text>
            </View>
            
            <Text style={styles.planDurationSelected}>
              per {plan.duration}
            </Text>
            
            <Text style={styles.planDescriptionSelected}>
              {plan.description}
            </Text>
            
            <View style={styles.planFeatures}>
              <View style={styles.feature}>
                <Ionicons 
                  name="checkmark-circle" 
                  size={16} 
                  color={colors.white} 
                />
                <Text style={styles.featureTextSelected}>
                  {plan.credits} haircut{plan.credits > 1 ? 's' : ''} included
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
            ${plan.price}
          </Text>
        </View>
        
        <Text style={styles.planDuration}>
          per {plan.duration}
        </Text>
        
        <Text style={styles.planDescription}>
          {plan.description}
        </Text>
        
        <View style={styles.planFeatures}>
          <View style={styles.feature}>
            <Ionicons 
              name="checkmark-circle" 
              size={16} 
              color={colors.accent.success} 
            />
            <Text style={styles.featureText}>
              {plan.credits} haircut{plan.credits > 1 ? 's' : ''} included
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
});

export default SubscriptionScreen;
