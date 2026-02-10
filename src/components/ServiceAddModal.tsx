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
import { spacing } from '../theme/spacing';
import { cleanScheduler } from '../theme/cleanScheduler';

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
          <Text style={styles.title}>Add Service</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={cleanScheduler.text.subtext} />
          </TouchableOpacity>
        </View>
        <View style={styles.headerDivider} />

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Service Name</Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                value={formData.name}
                onChangeText={(value) => handleInputChange('name', value)}
                placeholder="e.g., Classic Haircut"
                placeholderTextColor={cleanScheduler.text.subtext}
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
                  placeholderTextColor={cleanScheduler.text.subtext}
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
                  placeholderTextColor={cleanScheduler.text.subtext}
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
                placeholderTextColor={cleanScheduler.text.subtext}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
            </View>
          </View>
        </ScrollView>

        <View style={styles.footerDivider} />
        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleClose} activeOpacity={0.7}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.7}>
            <Text style={styles.saveButtonText}>Add Service</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: cleanScheduler.padding,
    paddingVertical: 16,
    backgroundColor: colors.white,
  },
  headerDivider: {
    height: 1,
    backgroundColor: cleanScheduler.card.border,
  },
  title: {
    fontSize: 18,
    fontWeight: typography.fontWeight.semibold,
    color: cleanScheduler.text.heading,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: cleanScheduler.padding,
    paddingTop: cleanScheduler.sectionSpacing,
    paddingBottom: 100,
  },
  form: {},
  inputGroup: {
    marginBottom: cleanScheduler.sectionSpacing,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: typography.fontWeight.semibold,
    color: cleanScheduler.text.heading,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: cleanScheduler.input.radius,
    padding: cleanScheduler.padding,
    fontSize: typography.fontSize.base,
    color: cleanScheduler.text.heading,
    borderWidth: 1,
    borderColor: cleanScheduler.input.border,
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
  footerDivider: {
    height: 1,
    backgroundColor: cleanScheduler.card.border,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: cleanScheduler.padding,
    paddingVertical: 16,
    backgroundColor: colors.white,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: cleanScheduler.secondary.bg,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: typography.fontWeight.semibold,
    color: cleanScheduler.secondary.text,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: cleanScheduler.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});

export default ServiceAddModal;
