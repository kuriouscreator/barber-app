import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface BusinessInfoScreenProps {
  onContinue: (data: {
    shopName: string;
    shopPhone?: string;
    shopAddress?: string;
    shopCity?: string;
    shopState?: string;
    shopZip?: string;
  }) => void;
  onBack?: () => void;
  initialData?: {
    shopName?: string;
    shopPhone?: string;
    shopAddress?: string;
    shopCity?: string;
    shopState?: string;
    shopZip?: string;
  };
  currentStep: number;
  totalSteps: number;
}

const BusinessInfoScreen: React.FC<BusinessInfoScreenProps> = ({
  onContinue,
  onBack,
  initialData,
  currentStep,
  totalSteps,
}) => {
  const [shopName, setShopName] = useState(initialData?.shopName || '');
  const [shopPhone, setShopPhone] = useState(initialData?.shopPhone || '');
  const [shopAddress, setShopAddress] = useState(initialData?.shopAddress || '');
  const [shopCity, setShopCity] = useState(initialData?.shopCity || '');
  const [shopState, setShopState] = useState(initialData?.shopState || '');
  const [shopZip, setShopZip] = useState(initialData?.shopZip || '');

  const handleContinue = () => {
    if (!shopName.trim()) {
      Alert.alert('Shop Name Required', 'Please enter your shop name to continue.');
      return;
    }

    onContinue({
      shopName: shopName.trim(),
      shopPhone: shopPhone.trim() || undefined,
      shopAddress: shopAddress.trim() || undefined,
      shopCity: shopCity.trim() || undefined,
      shopState: shopState.trim() || undefined,
      shopZip: shopZip.trim() || undefined,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          )}
          <View style={styles.progressDots}>
            {Array.from({ length: totalSteps }).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index < currentStep && styles.dotActive,
                ]}
              />
            ))}
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title and Description */}
          <View style={styles.titleContainer}>
            <Ionicons name="storefront" size={48} color={colors.accent.primary} />
            <Text style={styles.title}>Set up your shop</Text>
            <Text style={styles.subtitle}>
              Tell us about your business so customers can find you
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Shop Name (Required) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Shop Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Mike's Barbershop"
                placeholderTextColor={colors.text.tertiary}
                value={shopName}
                onChangeText={setShopName}
                autoCapitalize="words"
                autoComplete="off"
                autoCorrect={false}
              />
            </View>

            {/* Shop Phone (Optional) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Business Phone</Text>
              <TextInput
                style={styles.input}
                placeholder="(555) 123-4567"
                placeholderTextColor={colors.text.tertiary}
                value={shopPhone}
                onChangeText={setShopPhone}
                keyboardType="phone-pad"
                autoComplete="tel"
              />
            </View>

            {/* Address (Optional) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Street Address</Text>
              <TextInput
                style={styles.input}
                placeholder="123 Main Street"
                placeholderTextColor={colors.text.tertiary}
                value={shopAddress}
                onChangeText={setShopAddress}
                autoCapitalize="words"
                autoComplete="street-address"
              />
            </View>

            {/* City, State, ZIP (Optional) */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.flexInput]}>
                <Text style={styles.label}>City</Text>
                <TextInput
                  style={styles.input}
                  placeholder="New York"
                  placeholderTextColor={colors.text.tertiary}
                  value={shopCity}
                  onChangeText={setShopCity}
                  autoCapitalize="words"
                />
              </View>

              <View style={[styles.inputGroup, styles.smallInput]}>
                <Text style={styles.label}>State</Text>
                <TextInput
                  style={styles.input}
                  placeholder="NY"
                  placeholderTextColor={colors.text.tertiary}
                  value={shopState}
                  onChangeText={setShopState}
                  autoCapitalize="characters"
                  maxLength={2}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>ZIP Code</Text>
              <TextInput
                style={styles.input}
                placeholder="10001"
                placeholderTextColor={colors.text.tertiary}
                value={shopZip}
                onChangeText={setShopZip}
                keyboardType="number-pad"
                maxLength={10}
              />
            </View>

            <Text style={styles.helperText}>
              Address details help customers find your location
            </Text>
          </View>
        </ScrollView>

        {/* Footer with Continue Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.continueButton, !shopName.trim() && styles.continueButtonDisabled]}
            onPress={handleContinue}
            disabled={!shopName.trim()}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDots: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gray[300],
  },
  dotActive: {
    backgroundColor: colors.accent.primary,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xl * 1.5,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.md,
  },
  form: {
    gap: spacing.md,
  },
  inputGroup: {
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  required: {
    color: colors.error,
  },
  input: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  flexInput: {
    flex: 1,
  },
  smallInput: {
    width: 80,
  },
  helperText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    lineHeight: 16,
    marginTop: spacing.xs,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  continueButton: {
    flexDirection: 'row',
    backgroundColor: colors.accent.primary,
    paddingVertical: spacing.md + 2,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});

export default BusinessInfoScreen;
