import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import RBSheet from 'react-native-raw-bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { CustomerSheet } from '@stripe/stripe-react-native';
import { colors } from '../theme/colors';
import { BUSINESS_INFO } from '../constants/business';
import { haptics } from '../utils/haptics';
import { BillingService } from '../services/billing';

export interface PaymentMethodsSheetRef {
  open: () => void;
  close: () => void;
}

interface PaymentMethodsSheetProps {
  onClose?: () => void;
  onPaymentMethodUpdated?: () => void;
}

interface DefaultPaymentMethod {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

export const PaymentMethodsSheet = forwardRef<PaymentMethodsSheetRef, PaymentMethodsSheetProps>(
  ({ onClose, onPaymentMethodUpdated }, ref) => {
    const rbSheetRef = useRef<any>(null);
    const [loading, setLoading] = useState(false);
    const [defaultPaymentMethod, setDefaultPaymentMethod] = useState<DefaultPaymentMethod | null>(null);
    const [customerSheetReady, setCustomerSheetReady] = useState(false);

    useImperativeHandle(ref, () => ({
      open: async () => {
        rbSheetRef.current?.open();
        await loadPaymentMethodInfo();
      },
      close: () => rbSheetRef.current?.close(),
    }));

    const loadPaymentMethodInfo = async () => {
      try {
        setLoading(true);
        const config = await BillingService.getCustomerSheetConfig();

        if (config.defaultPaymentMethod) {
          setDefaultPaymentMethod(config.defaultPaymentMethod);
        } else {
          setDefaultPaymentMethod(null);
        }

        setCustomerSheetReady(true);
      } catch (error) {
        console.error('Error loading payment method info:', error);
        Alert.alert('Error', 'Failed to load payment information. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    const handleClose = () => {
      rbSheetRef.current?.close();
      if (onClose) onClose();
    };

    const handleManagePaymentMethods = async () => {
      try {
        haptics.light();
        setLoading(true);

        // Get customer sheet configuration
        const config = await BillingService.getCustomerSheetConfig();

        // Initialize CustomerSheet
        const initResult = await CustomerSheet.initialize({
          customerId: config.customerId,
          customerEphemeralKeySecret: config.ephemeralKeySecret,
          setupIntentClientSecret: config.setupIntentClientSecret,
          merchantDisplayName: BUSINESS_INFO.merchantDisplayName,
          returnURL: 'barbercuts://stripe-redirect',
          headerTextForSelectionScreen: 'Manage Payment Methods',
          allowsRemovalOfLastSavedPaymentMethod: false,
        });

        if (initResult.error) {
          console.error('CustomerSheet init error:', initResult.error);
          throw new Error(initResult.error.message);
        }

        setLoading(false);

        // Present the CustomerSheet
        const presentResult = await CustomerSheet.present();

        if (presentResult.error) {
          if (presentResult.error.code !== 'Canceled') {
            console.error('CustomerSheet present error:', presentResult.error);
            Alert.alert('Error', 'Failed to open payment methods. Please try again.');
          }
          return;
        }

        // Handle result
        if (presentResult.paymentOption) {
          haptics.success();
          Alert.alert(
            'Success',
            'Payment method updated successfully!',
            [{ text: 'OK', onPress: () => {
              // Reload payment method info
              loadPaymentMethodInfo();
              if (onPaymentMethodUpdated) {
                onPaymentMethodUpdated();
              }
            }}]
          );
        }

      } catch (error) {
        console.error('Error managing payment methods:', error);
        Alert.alert('Error', 'Failed to manage payment methods. Please try again.');
        setLoading(false);
      }
    };

    const formatCardBrand = (brand: string) => {
      const brandMap: Record<string, string> = {
        'visa': 'Visa',
        'mastercard': 'Mastercard',
        'amex': 'American Express',
        'discover': 'Discover',
        'diners': 'Diners Club',
        'jcb': 'JCB',
        'unionpay': 'UnionPay',
      };
      return brandMap[brand.toLowerCase()] || brand;
    };

    const getCardIcon = (brand: string) => {
      return 'card-outline';
    };

    return (
      <RBSheet
        ref={rbSheetRef}
        height={defaultPaymentMethod ? 400 : 350}
        openDuration={250}
        closeDuration={200}
        customStyles={{
          wrapper: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          },
          draggableIcon: {
            display: 'none',
          },
          container: {
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            backgroundColor: colors.white,
          },
        }}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Payment Methods</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
            >
              <Ionicons name="close" size={24} color={colors.gray[600]} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.gray[700]} />
                <Text style={styles.loadingText}>Loading payment information...</Text>
              </View>
            ) : (
              <>
                {/* Current Payment Method */}
                {defaultPaymentMethod && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Current Default</Text>
                    <View style={styles.paymentMethodCard}>
                      <View style={styles.cardIconContainer}>
                        <Ionicons
                          name={getCardIcon(defaultPaymentMethod.brand)}
                          size={24}
                          color={colors.gray[700]}
                        />
                      </View>
                      <View style={styles.cardInfo}>
                        <Text style={styles.cardBrand}>
                          {formatCardBrand(defaultPaymentMethod.brand)}
                        </Text>
                        <Text style={styles.cardDetails}>
                          •••• {defaultPaymentMethod.last4}
                        </Text>
                      </View>
                      <View style={styles.cardExpiry}>
                        <Text style={styles.expiryLabel}>Expires</Text>
                        <Text style={styles.expiryDate}>
                          {defaultPaymentMethod.expMonth.toString().padStart(2, '0')}/{defaultPaymentMethod.expYear.toString().slice(-2)}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {!defaultPaymentMethod && !loading && (
                  <View style={styles.emptyState}>
                    <View style={styles.emptyIconContainer}>
                      <Ionicons name="card-outline" size={48} color={colors.gray[300]} />
                    </View>
                    <Text style={styles.emptyStateTitle}>No Payment Method</Text>
                    <Text style={styles.emptyStateText}>
                      Tap "Manage Payment Methods" below to add a card
                    </Text>
                  </View>
                )}

                {/* Manage Button */}
                <TouchableOpacity
                  style={[styles.manageButton, loading && styles.manageButtonDisabled]}
                  onPress={handleManagePaymentMethods}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <>
                      <Ionicons name="settings-outline" size={20} color={colors.white} />
                      <Text style={styles.manageButtonText}>Manage Payment Methods</Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Info Text */}
                {defaultPaymentMethod ? (
                  <Text style={styles.infoText}>
                    Add, remove, or change your default payment method. Changes will apply to future billing.
                  </Text>
                ) : (
                  <Text style={styles.infoText}>
                    Your payment method will be securely stored with Stripe and used for future subscription payments.
                  </Text>
                )}
              </>
            )}
          </View>
        </View>
      </RBSheet>
    );
  }
);

PaymentMethodsSheet.displayName = 'PaymentMethodsSheet';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[900],
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingBottom: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.gray[600],
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.gray[200],
    gap: 12,
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  cardBrand: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 2,
  },
  cardDetails: {
    fontSize: 14,
    color: colors.gray[600],
  },
  cardExpiry: {
    alignItems: 'flex-end',
  },
  expiryLabel: {
    fontSize: 11,
    color: colors.gray[500],
    marginBottom: 2,
  },
  expiryDate: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.gray[700],
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 20,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray[800],
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    marginBottom: 12,
  },
  manageButtonDisabled: {
    opacity: 0.6,
  },
  manageButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  infoText: {
    fontSize: 13,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
});

export default PaymentMethodsSheet;
