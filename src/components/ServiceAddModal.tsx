import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Service } from '../types';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';

interface ServiceAddModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (service: Omit<Service, 'id'>) => void;
}

const ServiceAddModal: React.FC<ServiceAddModalProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    duration: '',
    price: '',
    description: '',
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const resetForm = () => {
    setFormData({
      name: '',
      duration: '',
      price: '',
      description: '',
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Service name is required';
    }

    if (!formData.duration.trim()) {
      newErrors.duration = 'Duration is required';
    } else if (isNaN(Number(formData.duration)) || Number(formData.duration) <= 0) {
      newErrors.duration = 'Duration must be a positive number';
    }

    if (!formData.price.trim()) {
      newErrors.price = 'Price is required';
    } else if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      newErrors.price = 'Price must be a positive number';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const newService: Omit<Service, 'id'> = {
      name: formData.name.trim(),
      duration: Number(formData.duration),
      price: Number(formData.price),
      description: formData.description.trim(),
    };

    onSave(newService);
    resetForm();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Add New Service</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Service Name</Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                value={formData.name}
                onChangeText={(value) => handleInputChange('name', value)}
                placeholder="e.g., Classic Haircut"
                placeholderTextColor={colors.gray[400]}
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Duration (minutes)</Text>
                <TextInput
                  style={[styles.input, errors.duration && styles.inputError]}
                  value={formData.duration}
                  onChangeText={(value) => handleInputChange('duration', value)}
                  placeholder="30"
                  placeholderTextColor={colors.gray[400]}
                  keyboardType="numeric"
                />
                {errors.duration && <Text style={styles.errorText}>{errors.duration}</Text>}
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Price ($)</Text>
                <TextInput
                  style={[styles.input, errors.price && styles.inputError]}
                  value={formData.price}
                  onChangeText={(value) => handleInputChange('price', value)}
                  placeholder="25"
                  placeholderTextColor={colors.gray[400]}
                  keyboardType="numeric"
                />
                {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea, errors.description && styles.inputError]}
                value={formData.description}
                onChangeText={(value) => handleInputChange('description', value)}
                placeholder="Brief description of the service"
                placeholderTextColor={colors.gray[400]}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>Add Service</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderBottomColor: colors.border.light,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: spacing.xs,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  form: {
    padding: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  inputError: {
    borderColor: colors.accent.error,
  },
  textArea: {
    height: 80,
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    color: colors.accent.error,
    marginTop: spacing.xs,
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderTopColor: colors.border.light,
    borderTopWidth: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
  },
  saveButton: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.black,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.white,
  },
});

export default ServiceAddModal;
