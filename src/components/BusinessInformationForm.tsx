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
import { updateUserProfile } from '../services/profileService';

interface BusinessInformationFormProps {
  user: User;
  onSaveSuccess: () => void;
  onCancel: () => void;
}

interface FormData {
  shopName: string;
  shopPhone: string;
  shopAddress: string;
  shopCity: string;
  shopState: string;
  shopZip: string;
}

interface FormErrors {
  shopName?: string;
}

export const BusinessInformationForm: React.FC<BusinessInformationFormProps> = ({
  user,
  onSaveSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState<FormData>({
    shopName: user.shopName || '',
    shopPhone: user.shopPhone || '',
    shopAddress: user.shopAddress || '',
    shopCity: user.shopCity || '',
    shopState: user.shopState || '',
    shopZip: user.shopZip || '',
  });

  const [originalData, setOriginalData] = useState<FormData>({
    shopName: user.shopName || '',
    shopPhone: user.shopPhone || '',
    shopAddress: user.shopAddress || '',
    shopCity: user.shopCity || '',
    shopState: user.shopState || '',
    shopZip: user.shopZip || '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setFormData({
      shopName: user.shopName || '',
      shopPhone: user.shopPhone || '',
      shopAddress: user.shopAddress || '',
      shopCity: user.shopCity || '',
      shopState: user.shopState || '',
      shopZip: user.shopZip || '',
    });
    setOriginalData({
      shopName: user.shopName || '',
      shopPhone: user.shopPhone || '',
      shopAddress: user.shopAddress || '',
      shopCity: user.shopCity || '',
      shopState: user.shopState || '',
      shopZip: user.shopZip || '',
    });
  }, [user.id, user.shopName, user.shopPhone, user.shopAddress, user.shopCity, user.shopState, user.shopZip]);

  const hasChanges =
    formData.shopName !== originalData.shopName ||
    formData.shopPhone !== originalData.shopPhone ||
    formData.shopAddress !== originalData.shopAddress ||
    formData.shopCity !== originalData.shopCity ||
    formData.shopState !== originalData.shopState ||
    formData.shopZip !== originalData.shopZip;

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.shopName.trim()) {
      newErrors.shopName = 'Shop name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    setErrorMessage(null);
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const result = await updateUserProfile(user.id, {
        shop_name: formData.shopName.trim() || undefined,
        shop_phone: formData.shopPhone.trim() || undefined,
        shop_address: formData.shopAddress.trim() || undefined,
        shop_city: formData.shopCity.trim() || undefined,
        shop_state: formData.shopState.trim() || undefined,
        shop_zip: formData.shopZip.trim() || undefined,
      });

      if (result) {
        setOriginalData(formData);
        setIsSaving(false);
        Alert.alert('Success', 'Business information has been updated');
        onSaveSuccess();
      } else {
        throw new Error('Failed to update business information');
      }
    } catch (error: any) {
      console.error('Error saving business info:', error);
      setIsSaving(false);
      setErrorMessage(error.message || 'Failed to save changes. Please try again.');
    }
  };

  const isFormValid = hasChanges && Object.keys(errors).length === 0;

  return (
    <View style={styles.container}>
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>
          Shop Name <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[styles.input, errors.shopName && styles.inputError]}
          value={formData.shopName}
          onChangeText={(text) => {
            setFormData({ ...formData, shopName: text });
            if (errors.shopName) setErrors({ ...errors, shopName: undefined });
          }}
          placeholder="e.g. Prestige Cuts"
          placeholderTextColor={colors.gray[400]}
          autoCapitalize="words"
          editable={!isSaving}
        />
        {errors.shopName && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={14} color={colors.red[600]} />
            <Text style={styles.errorText}>{errors.shopName}</Text>
          </View>
        )}
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Business Phone</Text>
        <TextInput
          style={styles.input}
          value={formData.shopPhone}
          onChangeText={(text) => setFormData({ ...formData, shopPhone: text })}
          placeholder="(555) 123-4567"
          placeholderTextColor={colors.gray[400]}
          keyboardType="phone-pad"
          editable={!isSaving}
        />
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Street Address</Text>
        <TextInput
          style={styles.input}
          value={formData.shopAddress}
          onChangeText={(text) => setFormData({ ...formData, shopAddress: text })}
          placeholder="123 Main Street"
          placeholderTextColor={colors.gray[400]}
          autoCapitalize="words"
          editable={!isSaving}
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.fieldContainer, styles.flexInput]}>
          <Text style={styles.label}>City</Text>
          <TextInput
            style={styles.input}
            value={formData.shopCity}
            onChangeText={(text) => setFormData({ ...formData, shopCity: text })}
            placeholder="Decatur"
            placeholderTextColor={colors.gray[400]}
            autoCapitalize="words"
            editable={!isSaving}
          />
        </View>
        <View style={[styles.fieldContainer, styles.smallInput]}>
          <Text style={styles.label}>State</Text>
          <TextInput
            style={styles.input}
            value={formData.shopState}
            onChangeText={(text) => setFormData({ ...formData, shopState: text })}
            placeholder="GA"
            placeholderTextColor={colors.gray[400]}
            autoCapitalize="characters"
            maxLength={2}
            editable={!isSaving}
          />
        </View>
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>ZIP Code</Text>
        <TextInput
          style={styles.input}
          value={formData.shopZip}
          onChangeText={(text) => setFormData({ ...formData, shopZip: text })}
          placeholder="30082"
          placeholderTextColor={colors.gray[400]}
          keyboardType="number-pad"
          maxLength={10}
          editable={!isSaving}
        />
      </View>

      {errorMessage && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={20} color={colors.red[600]} />
          <Text style={styles.errorBannerText}>{errorMessage}</Text>
        </View>
      )}

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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flexInput: {
    flex: 1,
  },
  smallInput: {
    width: 80,
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
