import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Service } from '../types';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';

interface ServiceEditModalProps {
  visible: boolean;
  service: Service | null;
  onClose: () => void;
  onSave: (service: Service) => void;
  onDelete: (serviceId: string) => void;
}

const ServiceEditModal: React.FC<ServiceEditModalProps> = ({
  visible,
  service,
  onClose,
  onSave,
  onDelete,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    duration: '',
    price: '',
    description: '',
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name,
        duration: service.duration.toString(),
        price: service.price.toString(),
        description: service.description,
      });
    } else {
      setFormData({
        name: '',
        duration: '',
        price: '',
        description: '',
      });
    }
    setErrors({});
  }, [service, visible]);

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
    if (!validateForm() || !service) return;

    const updatedService: Service = {
      ...service,
      name: formData.name.trim(),
      duration: Number(formData.duration),
      price: Number(formData.price),
      description: formData.description.trim(),
    };

    onSave(updatedService);
  };

  const handleDelete = () => {
    if (!service) return;

    Alert.alert(
      'Delete Service',
      `Are you sure you want to delete "${service.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete(service.id);
            onClose();
          },
        },
      ]
    );
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
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Service</Text>
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
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={20} color={colors.accent.error} />
            <Text style={styles.deleteButtonText}>Delete Service</Text>
          </TouchableOpacity>

          <View style={styles.saveButtonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
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
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.accent.error,
  },
  deleteButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.accent.error,
    marginLeft: spacing.xs,
  },
  saveButtonContainer: {
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

export default ServiceEditModal;
