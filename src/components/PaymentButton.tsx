import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PaymentService } from '../services/PaymentService';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';

interface PaymentButtonProps {
  amount: number;
  description: string;
  onSuccess: (transactionId: string) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

const PaymentButton: React.FC<PaymentButtonProps> = ({
  amount,
  description,
  onSuccess,
  onError,
  disabled = false,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    if (disabled || isProcessing) return;

    setIsProcessing(true);

    try {
      const result = await PaymentService.processPayment(amount, description);

      if (result.success && result.transactionId) {
        onSuccess(result.transactionId);
      } else {
        const errorMessage = result.error || 'Payment failed';
        Alert.alert('Payment Failed', errorMessage);
        onError?.(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment failed';
      Alert.alert('Payment Error', errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const getButtonText = () => {
    if (isProcessing) {
      return 'Opening Checkout...';
    }
    
    return `Subscribe with Stripe`;
  };

  const getButtonIcon = () => {
    if (isProcessing) {
      return 'hourglass-outline';
    }
    
    return 'card-outline';
  };

  return (
    <TouchableOpacity
      style={[
        styles.paymentButton,
        (disabled || isProcessing) && styles.paymentButtonDisabled,
      ]}
      onPress={handlePayment}
      disabled={disabled || isProcessing}
    >
      <Ionicons 
        name={getButtonIcon() as any} 
        size={20} 
        color={colors.white} 
      />
      <Text style={styles.paymentButtonText}>
        {getButtonText()}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  paymentButton: {
    backgroundColor: colors.black,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  paymentButtonDisabled: {
    opacity: 0.6,
  },
  paymentButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
});

export default PaymentButton;
