import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { User } from '../types';
import { updateUserProfile, UserProfile } from '../services/profileService';
import { getUserProfile } from '../services/profileService';
import { ActivityLogger } from '../services/ActivityLogger';

export interface PersonalInformationFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface PersonalInformationFormProps {
  user: User;
  onSaveSuccess: () => void;
  onCancel: () => void;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export const PersonalInformationForm: React.FC<PersonalInformationFormProps> = ({
  user,
  onSaveSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState<PersonalInformationFormData>({
    firstName: '',
    lastName: '',
    email: user.email,
    phone: user.phone || '',
  });

  const [originalData, setOriginalData] = useState<PersonalInformationFormData>({
    firstName: '',
    lastName: '',
    email: user.email,
    phone: user.phone || '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load full name and split into first/last
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const profile = await getUserProfile(user.id);
        if (profile) {
          const nameParts = (profile.full_name || user.name || '').split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';

          const initial = {
            firstName,
            lastName,
            email: profile.email || user.email,
            phone: profile.phone || user.phone || '',
          };

          setFormData(initial);
          setOriginalData(initial);
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
      }
    };

    loadUserProfile();
  }, [user]);

  // Check for changes
  useEffect(() => {
    const changed =
      formData.firstName !== originalData.firstName ||
      formData.lastName !== originalData.lastName ||
      formData.email !== originalData.email ||
      formData.phone !== originalData.phone;

    setHasChanges(changed);
  }, [formData, originalData]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    if (!phone) return true; // Phone is optional
    // Simple validation: 10+ digits
    const digitsOnly = phone.replace(/\D/g, '');
    return digitsOnly.length >= 10;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.phone && !validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    setErrorMessage(null);

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;

      const updates: Partial<UserProfile> = {
        full_name: fullName,
        phone: formData.phone.trim() || undefined,
      };

      console.log('📝 Updating profile for user:', user.id);
      console.log('📝 Updates:', updates);

      // Note: Email is typically not editable after account creation
      // If your app allows email changes, you'd need to handle re-verification

      const result = await updateUserProfile(user.id, updates);

      console.log('📝 Update result:', result);

      if (result) {
        // Log activity for profile update
        await ActivityLogger.logProfileUpdated(
          user.id,
          Object.keys(updates).join(', ')
        );

        // Update the original data to reflect the changes
        setOriginalData(formData);
        setHasChanges(false);

        setIsSaving(false);
        Alert.alert('Success', 'Your information has been updated');
        onSaveSuccess();
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error: any) {
      console.error('Error saving profile:', error);
      setIsSaving(false);
      setErrorMessage(error.message || 'Failed to save changes. Please try again.');
    }
  };

  const isFormValid = hasChanges && Object.keys(errors).length === 0;

  return (
    <View style={styles.container}>
      {/* First Name */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>
          First Name <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[styles.input, errors.firstName && styles.inputError]}
          value={formData.firstName}
          onChangeText={(text) => {
            setFormData({ ...formData, firstName: text });
            if (errors.firstName) {
              setErrors({ ...errors, firstName: undefined });
            }
          }}
          placeholder="Enter your first name"
          placeholderTextColor={colors.gray[400]}
          autoCapitalize="words"
          editable={!isSaving}
        />
        {errors.firstName && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={14} color={colors.red[600]} />
            <Text style={styles.errorText}>{errors.firstName}</Text>
          </View>
        )}
      </View>

      {/* Last Name */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>
          Last Name <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[styles.input, errors.lastName && styles.inputError]}
          value={formData.lastName}
          onChangeText={(text) => {
            setFormData({ ...formData, lastName: text });
            if (errors.lastName) {
              setErrors({ ...errors, lastName: undefined });
            }
          }}
          placeholder="Enter your last name"
          placeholderTextColor={colors.gray[400]}
          autoCapitalize="words"
          editable={!isSaving}
        />
        {errors.lastName && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={14} color={colors.red[600]} />
            <Text style={styles.errorText}>{errors.lastName}</Text>
          </View>
        )}
      </View>

      {/* Email (Read-only) */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Email</Text>
        <View style={[styles.input, styles.readOnlyInput]}>
          <Text style={styles.readOnlyText}>{formData.email}</Text>
        </View>
        <Text style={styles.helperText}>
          Email cannot be changed. Contact support if you need to update it.
        </Text>
      </View>

      {/* Phone Number */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={[styles.input, errors.phone && styles.inputError]}
          value={formData.phone}
          onChangeText={(text) => {
            setFormData({ ...formData, phone: text });
            if (errors.phone) {
              setErrors({ ...errors, phone: undefined });
            }
          }}
          placeholder="Enter your phone number"
          placeholderTextColor={colors.gray[400]}
          keyboardType="phone-pad"
          editable={!isSaving}
        />
        {errors.phone && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={14} color={colors.red[600]} />
            <Text style={styles.errorText}>{errors.phone}</Text>
          </View>
        )}
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
            (!isFormValid || isSaving) && styles.buttonDisabled,
          ]}
          onPress={handleSave}
          disabled={!isFormValid || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.primaryButtonText}>Save Changes</Text>
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
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: 8,
  },
  required: {
    color: colors.red[600],
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.gray[900],
    backgroundColor: colors.white,
  },
  inputError: {
    borderColor: colors.red[600],
  },
  readOnlyInput: {
    backgroundColor: colors.gray[100],
    borderColor: colors.gray[200],
  },
  readOnlyText: {
    fontSize: 16,
    color: colors.gray[600],
  },
  helperText: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 6,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  errorText: {
    fontSize: 12,
    color: colors.red[600],
    marginLeft: 4,
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
