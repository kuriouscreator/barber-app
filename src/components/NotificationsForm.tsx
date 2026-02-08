import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { User } from '../types';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  NotificationPreferences,
} from '../services/profileService';

interface NotificationsFormProps {
  user: User;
  onSaveSuccess: () => void;
  onCancel: () => void;
}

export const NotificationsForm: React.FC<NotificationsFormProps> = ({
  user,
  onSaveSuccess,
  onCancel,
}) => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    notify_push: true,
    notify_email: true,
    notify_sms: false,
  });

  const [originalPreferences, setOriginalPreferences] = useState<NotificationPreferences>({
    notify_push: true,
    notify_email: true,
    notify_sms: false,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load notification preferences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        setIsLoading(true);
        const prefs = await getNotificationPreferences(user.id);
        if (prefs) {
          setPreferences(prefs);
          setOriginalPreferences(prefs);
        }
      } catch (error) {
        console.error('Error loading notification preferences:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, [user.id]);

  // Check for changes
  useEffect(() => {
    const changed =
      preferences.notify_push !== originalPreferences.notify_push ||
      preferences.notify_email !== originalPreferences.notify_email ||
      preferences.notify_sms !== originalPreferences.notify_sms;

    setHasChanges(changed);
  }, [preferences, originalPreferences]);

  const handleToggle = (key: keyof NotificationPreferences, value: boolean) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
    setErrorMessage(null);
  };

  const validatePreferences = (): string | null => {
    // Check if SMS is enabled but no phone number
    if (preferences.notify_sms && !user.phone) {
      return 'Please add a phone number to your profile before enabling SMS notifications.';
    }

    // Check if Email is enabled but no email
    if (preferences.notify_email && !user.email) {
      return 'Email address is required to enable email notifications.';
    }

    return null;
  };

  const handleSave = async () => {
    setErrorMessage(null);

    // Validate
    const validationError = validatePreferences();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSaving(true);

    try {
      const result = await updateNotificationPreferences(user.id, preferences);

      if (result) {
        setIsSaving(false);
        Alert.alert('Success', 'Your notification preferences have been updated');
        onSaveSuccess();
      } else {
        throw new Error('Failed to update preferences');
      }
    } catch (error: any) {
      console.error('Error saving preferences:', error);
      setIsSaving(false);
      setErrorMessage(error.message || 'Failed to save changes. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.gray[700]} />
        <Text style={styles.loadingText}>Loading preferences...</Text>
      </View>
    );
  }

  const hasPhone = !!user.phone;
  const hasEmail = !!user.email;

  return (
    <View style={styles.container}>
      <Text style={styles.description}>
        Choose how you'd like to receive appointment reminders and updates.
      </Text>

      {/* Push Notifications */}
      <View style={styles.preferenceItem}>
        <View style={styles.preferenceHeader}>
          <View style={styles.iconContainer}>
            <Ionicons name="notifications" size={24} color={colors.gray[700]} />
          </View>
          <View style={styles.preferenceContent}>
            <Text style={styles.preferenceTitle}>Push Notifications</Text>
            <Text style={styles.preferenceSubtitle}>
              Appointment reminders and updates
            </Text>
          </View>
          <Switch
            value={preferences.notify_push}
            onValueChange={(value) => handleToggle('notify_push', value)}
            trackColor={{ false: colors.background.secondary, true: colors.accent.primary }}
            thumbColor={colors.white}
            disabled={isSaving}
          />
        </View>
      </View>

      {/* Email Notifications */}
      <View style={styles.preferenceItem}>
        <View style={styles.preferenceHeader}>
          <View style={styles.iconContainer}>
            <Ionicons name="mail" size={24} color={colors.gray[700]} />
          </View>
          <View style={styles.preferenceContent}>
            <Text style={styles.preferenceTitle}>Email Notifications</Text>
            <Text style={styles.preferenceSubtitle}>
              Appointment confirmations and receipts
            </Text>
            {!hasEmail && (
              <Text style={styles.warningText}>
                Email address required
              </Text>
            )}
          </View>
          <Switch
            value={preferences.notify_email && hasEmail}
            onValueChange={(value) => handleToggle('notify_email', value)}
            trackColor={{ false: colors.background.secondary, true: colors.accent.primary }}
            thumbColor={colors.white}
            disabled={isSaving || !hasEmail}
          />
        </View>
      </View>

      {/* SMS Notifications */}
      <View style={styles.preferenceItem}>
        <View style={styles.preferenceHeader}>
          <View style={styles.iconContainer}>
            <Ionicons name="chatbubble" size={24} color={colors.gray[700]} />
          </View>
          <View style={styles.preferenceContent}>
            <Text style={styles.preferenceTitle}>SMS Notifications</Text>
            <Text style={styles.preferenceSubtitle}>
              Text messages for time-sensitive updates
            </Text>
            {!hasPhone && (
              <Text style={styles.warningText}>
                Add a phone number to enable SMS
              </Text>
            )}
          </View>
          <Switch
            value={preferences.notify_sms && hasPhone}
            onValueChange={(value) => handleToggle('notify_sms', value)}
            trackColor={{ false: colors.background.secondary, true: colors.accent.primary }}
            thumbColor={colors.white}
            disabled={isSaving || !hasPhone}
          />
        </View>
      </View>

      {/* Error Message */}
      {errorMessage && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={20} color={colors.red[600]} />
          <Text style={styles.errorBannerText}>{errorMessage}</Text>
        </View>
      )}

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            styles.primaryButton,
            (!hasChanges || isSaving) && styles.buttonDisabled,
          ]}
          onPress={handleSave}
          disabled={!hasChanges || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.primaryButtonText}>Save Preferences</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={onCancel}
          disabled={isSaving}
        >
          <Text style={styles.secondaryButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.gray[600],
  },
  description: {
    fontSize: 14,
    color: colors.gray[600],
    marginBottom: 24,
    lineHeight: 20,
  },
  preferenceItem: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  preferenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  preferenceContent: {
    flex: 1,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 4,
  },
  preferenceSubtitle: {
    fontSize: 14,
    color: colors.gray[600],
    lineHeight: 18,
  },
  warningText: {
    fontSize: 12,
    color: colors.orange[600],
    marginTop: 4,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.red[50],
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorBannerText: {
    fontSize: 14,
    color: colors.red[700],
    marginLeft: 8,
    flex: 1,
  },
  buttonContainer: {
    marginTop: 10,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: colors.black,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  secondaryButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[300],
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[700],
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
