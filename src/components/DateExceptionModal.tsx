import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScheduleException } from '../types';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';

interface DateExceptionModalProps {
  visible: boolean;
  selectedDate: string | null;
  existingException: ScheduleException | null;
  onClose: () => void;
  onSave: (exception: ScheduleException) => void;
  onDelete: (exceptionId: string) => void;
}

const TIME_SLOTS = [
  '6:00 AM', '6:30 AM', '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM',
  '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM',
  '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
  '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM', '9:00 PM', '9:30 PM',
  '10:00 PM', '10:30 PM', '11:00 PM', '11:30 PM'
];

const DateExceptionModal: React.FC<DateExceptionModalProps> = ({
  visible,
  selectedDate,
  existingException,
  onClose,
  onSave,
  onDelete,
}) => {
  console.log('DateExceptionModal rendered with:', { visible, selectedDate, existingException });
  const [formData, setFormData] = useState({
    startTime: '9:00 AM',
    endTime: '5:00 PM',
    isAvailable: true,
    reason: '',
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (visible && selectedDate) {
      if (existingException) {
        setFormData({
          startTime: existingException.startTime,
          endTime: existingException.endTime,
          isAvailable: existingException.isAvailable,
          reason: existingException.reason || '',
        });
      } else {
        setFormData({
          startTime: '9:00 AM',
          endTime: '5:00 PM',
          isAvailable: true,
          reason: '',
        });
      }
      setErrors({});
    }
  }, [visible, selectedDate, existingException]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (formData.isAvailable) {
      if (formData.startTime >= formData.endTime) {
        newErrors.time = 'Start time must be before end time';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm() || !selectedDate) return;

    const exception: ScheduleException = {
      id: existingException?.id || Date.now().toString(),
      date: selectedDate,
      startTime: formData.startTime,
      endTime: formData.endTime,
      isAvailable: formData.isAvailable,
      reason: formData.reason.trim() || undefined,
    };

    onSave(exception);
  };

  const handleDelete = () => {
    if (!existingException) return;

    Alert.alert(
      'Delete Exception',
      `Are you sure you want to delete the schedule exception for ${formatDate(selectedDate!)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete(existingException.id);
            onClose();
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const updateTimeSlot = (field: 'startTime' | 'endTime', time: string) => {
    setFormData(prev => ({ ...prev, [field]: time }));
    // Clear error when user changes time
    if (errors.time) {
      setErrors(prev => ({ ...prev, time: '' }));
    }
  };

  const renderTimePicker = (field: 'startTime' | 'endTime', currentTime: string) => {
    return (
      <View style={styles.timePickerContainer}>
        <Text style={styles.timePickerLabel}>
          {field === 'startTime' ? 'Start Time' : 'End Time'}
        </Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.timePicker}
        >
          {TIME_SLOTS.map((time) => (
            <TouchableOpacity
              key={time}
              style={[
                styles.timeSlot,
                time === currentTime && styles.timeSlotSelected,
                !formData.isAvailable && styles.timeSlotDisabled,
              ]}
              onPress={() => updateTimeSlot(field, time)}
              disabled={!formData.isAvailable}
            >
              <Text style={[
                styles.timeSlotText,
                time === currentTime && styles.timeSlotTextSelected,
                !formData.isAvailable && styles.timeSlotTextDisabled,
              ]}>
                {time}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>
            {existingException ? 'Edit Exception' : 'Add Exception'}
          </Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            <View style={styles.dateContainer}>
              <Ionicons name="calendar-outline" size={24} color={colors.accent.primary} />
              <Text style={styles.dateText}>
                {selectedDate ? formatDate(selectedDate) : 'Select a date'}
              </Text>
            </View>

            <View style={styles.availabilityContainer}>
              <View style={styles.availabilityHeader}>
                <Text style={styles.availabilityLabel}>Available on this date</Text>
                <Switch
                  value={formData.isAvailable}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, isAvailable: value }))}
                  trackColor={{ false: colors.gray[300], true: colors.accent.primary }}
                  thumbColor={colors.white}
                />
              </View>
              
              {!formData.isAvailable && (
                <View style={styles.unavailableContainer}>
                  <Ionicons name="close-circle-outline" size={20} color={colors.gray[400]} />
                  <Text style={styles.unavailableText}>Not available on this date</Text>
                </View>
              )}
            </View>

            {formData.isAvailable && (
              <View style={styles.timePickers}>
                {renderTimePicker('startTime', formData.startTime)}
                {renderTimePicker('endTime', formData.endTime)}
                {errors.time && <Text style={styles.errorText}>{errors.time}</Text>}
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Reason (Optional)</Text>
              <TextInput
                style={styles.input}
                value={formData.reason}
                onChangeText={(value) => setFormData(prev => ({ ...prev, reason: value }))}
                placeholder="e.g., Holiday, Personal appointment, etc."
                placeholderTextColor={colors.gray[400]}
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          {existingException && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={20} color={colors.accent.error} />
              <Text style={styles.deleteButtonText}>Delete Exception</Text>
            </TouchableOpacity>
          )}

          <View style={styles.buttonContainer}>
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
              <Text style={styles.saveButtonText}>
                {existingException ? 'Update Exception' : 'Add Exception'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...colors.gray[100] && { borderWidth: 1, borderColor: colors.gray[100] },
  },
  dateText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginLeft: spacing.md,
  },
  availabilityContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  availabilityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  availabilityLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  unavailableContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  unavailableText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[400],
    marginLeft: spacing.sm,
  },
  timePickers: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  timePickerContainer: {
    marginBottom: spacing.sm,
  },
  timePickerLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  timePicker: {
    maxHeight: 50,
  },
  timeSlot: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  timeSlotSelected: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  timeSlotDisabled: {
    backgroundColor: colors.gray[50],
    borderColor: colors.gray[200],
  },
  timeSlotText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
  },
  timeSlotTextSelected: {
    color: colors.white,
    fontWeight: typography.fontWeight.medium,
  },
  timeSlotTextDisabled: {
    color: colors.gray[400],
  },
  inputGroup: {
    marginBottom: spacing.lg,
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
    minHeight: 60,
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

export default DateExceptionModal;
