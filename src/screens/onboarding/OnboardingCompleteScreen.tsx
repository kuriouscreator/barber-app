import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface OnboardingCompleteScreenProps {
  shopName: string;
  onGetStarted: () => void;
}

const OnboardingCompleteScreen: React.FC<OnboardingCompleteScreenProps> = ({
  shopName,
  onGetStarted,
}) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark" size={64} color={colors.white} />
          </View>
        </View>

        {/* Title and Message */}
        <Text style={styles.title}>You're all set!</Text>
        <Text style={styles.message}>
          {shopName} is ready to accept appointments. Start managing your schedule and grow your business.
        </Text>

        {/* Features List */}
        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <View style={styles.featureIconContainer}>
              <Ionicons name="calendar-outline" size={24} color={colors.accent.primary} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Manage appointments</Text>
              <Text style={styles.featureDescription}>
                View and organize your bookings
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIconContainer}>
              <Ionicons name="time-outline" size={24} color={colors.accent.primary} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Control your schedule</Text>
              <Text style={styles.featureDescription}>
                Set availability and manage exceptions
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIconContainer}>
              <Ionicons name="cut-outline" size={24} color={colors.accent.primary} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Update services</Text>
              <Text style={styles.featureDescription}>
                Add or edit your offerings anytime
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Get Started Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.getStartedButton}
          onPress={onGetStarted}
        >
          <Text style={styles.getStartedButtonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: spacing.xl,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent.primary,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  title: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  message: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl * 1.5,
    paddingHorizontal: spacing.md,
  },
  featuresList: {
    width: '100%',
    gap: spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureContent: {
    flex: 1,
    paddingTop: spacing.xs,
  },
  featureTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs / 2,
  },
  featureDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.background.primary,
  },
  getStartedButton: {
    backgroundColor: colors.accent.primary,
    paddingVertical: spacing.md + 2,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  getStartedButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});

export default OnboardingCompleteScreen;
