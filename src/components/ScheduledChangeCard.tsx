import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';

interface ScheduledChangeCardProps {
  scheduledPlanName: string;
  scheduledEffectiveDate: string;
  onCancel: () => void;
  loading?: boolean;
}

const ScheduledChangeCard: React.FC<ScheduledChangeCardProps> = ({
  scheduledPlanName,
  scheduledEffectiveDate,
  onCancel,
  loading = false,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Scheduled Change',
      'Are you sure you want to cancel your scheduled plan change?',
      [
        { text: 'Keep Scheduled', style: 'cancel' },
        { 
          text: 'Cancel Change', 
          style: 'destructive',
          onPress: onCancel
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="time-outline" size={24} color={colors.accent.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Plan Change Scheduled</Text>
          <Text style={styles.subtitle}>Your plan will change automatically</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.changeInfo}>
          <Text style={styles.changeLabel}>Changing to:</Text>
          <Text style={styles.planName}>{scheduledPlanName}</Text>
        </View>

        <View style={styles.changeInfo}>
          <Text style={styles.changeLabel}>Effective date:</Text>
          <Text style={styles.effectiveDate}>{formatDate(scheduledEffectiveDate)}</Text>
        </View>

        <View style={styles.noteContainer}>
          <Ionicons name="information-circle-outline" size={16} color={colors.text.secondary} />
          <Text style={styles.note}>
            You'll keep your current plan benefits until the change takes effect.
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.cancelButton, loading && styles.cancelButtonDisabled]}
        onPress={handleCancel}
        disabled={loading}
      >
        <Ionicons 
          name="close-circle-outline" 
          size={20} 
          color={loading ? colors.text.tertiary : colors.accent.error} 
        />
        <Text style={[styles.cancelButtonText, loading && styles.cancelButtonTextDisabled]}>
          {loading ? 'Canceling...' : 'Cancel Change'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.accent.primary,
    ...shadows.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  content: {
    marginBottom: spacing.lg,
  },
  changeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  changeLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
  },
  planName: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.bold,
  },
  effectiveDate: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
  },
  note: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginLeft: spacing.sm,
    flex: 1,
    lineHeight: 16,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.button,
    borderWidth: 1,
    borderColor: colors.accent.error,
  },
  cancelButtonDisabled: {
    borderColor: colors.border.light,
  },
  cancelButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.accent.error,
    fontWeight: typography.fontWeight.medium,
    marginLeft: spacing.xs,
  },
  cancelButtonTextDisabled: {
    color: colors.text.tertiary,
  },
});

export default ScheduledChangeCard;
