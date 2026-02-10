import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import RBSheet from 'react-native-raw-bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { ScheduleException } from '../../services/AvailabilityService';
import { format, parse } from 'date-fns';

interface ScheduleExceptionModalProps {
  barberId: string;
  exception?: ScheduleException | null;
  onSave: (exception: Omit<ScheduleException, 'id' | 'barberId' | 'createdAt' | 'updatedAt'> & { id?: string }) => void;
  onClose: () => void;
}

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00',
];

export const ScheduleExceptionModal = forwardRef<any, ScheduleExceptionModalProps>(
  ({ barberId, exception, onSave, onClose }, ref) => {
    const rbSheetRef = useRef<any>(null);

    // Form state
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [exceptionType, setExceptionType] = useState<'closed' | 'custom'>('closed');
    const [startTime, setStartTime] = useState<string>('09:00');
    const [endTime, setEndTime] = useState<string>('17:00');
    const [reason, setReason] = useState<string>('');

    // Expose open and close methods
    useImperativeHandle(ref, () => ({
      open: () => {
        resetForm();
        rbSheetRef.current?.open();
      },
      close: () => rbSheetRef.current?.close(),
    }));

    // Initialize form when exception changes
    useEffect(() => {
      if (exception) {
        setSelectedDate(exception.date);
        setExceptionType(exception.isAvailable ? 'custom' : 'closed');
        setStartTime(exception.startTime || '09:00');
        setEndTime(exception.endTime || '17:00');
        setReason(exception.reason || '');
      }
    }, [exception]);

    const resetForm = () => {
      setSelectedDate('');
      setExceptionType('closed');
      setStartTime('09:00');
      setEndTime('17:00');
      setReason('');
    };

    const formatDateDisplay = (dateString: string): string => {
      if (!dateString) return 'Select date';
      try {
        const date = parse(dateString, 'yyyy-MM-dd', new Date());
        return format(date, 'EEEE, MMM d, yyyy');
      } catch {
        return dateString;
      }
    };

    const handleDateSelection = () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      const formatISO = (date: Date) => {
        return date.toISOString().split('T')[0];
      };

      Alert.alert('Select Date', '', [
        {
          text: 'Tomorrow',
          onPress: () => setSelectedDate(formatISO(tomorrow)),
        },
        {
          text: 'Next Week',
          onPress: () => setSelectedDate(formatISO(nextWeek)),
        },
        {
          text: 'Custom',
          onPress: () => {
            // For now, use a simple date string input
            // In production, use a proper date picker library
            Alert.prompt('Enter Date', 'Format: YYYY-MM-DD', (text) => {
              if (text && /^\d{4}-\d{2}-\d{2}$/.test(text)) {
                setSelectedDate(text);
              }
            });
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]);
    };

    const handleSave = () => {
      // Validation
      if (!selectedDate) {
        Alert.alert('Error', 'Please select a date');
        return;
      }

      if (exceptionType === 'custom') {
        if (startTime >= endTime) {
          Alert.alert('Error', 'Start time must be before end time');
          return;
        }
      }

      // Check if date is in the past
      const selectedDateObj = new Date(selectedDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDateObj < today) {
        Alert.alert('Error', 'Cannot create exception for past dates');
        return;
      }

      const exceptionData = {
        id: exception?.id,
        date: selectedDate,
        isAvailable: exceptionType === 'custom',
        startTime: exceptionType === 'custom' ? startTime : undefined,
        endTime: exceptionType === 'custom' ? endTime : undefined,
        reason: reason.trim() || undefined,
      };

      onSave(exceptionData);
      rbSheetRef.current?.close();
    };

    return (
      <RBSheet
        ref={rbSheetRef}
        height={650}
        openDuration={250}
        closeDuration={200}
        onClose={onClose}
        customStyles={{
          wrapper: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          },
          container: {
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            backgroundColor: colors.white,
          },
          draggableIcon: {
            backgroundColor: colors.gray[300],
            width: 40,
            height: 4,
          },
        }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {exception ? 'Edit Exception' : 'Add Exception'}
          </Text>
          <TouchableOpacity onPress={() => rbSheetRef.current?.close()}>
            <Ionicons name="close" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Date Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Date</Text>
            <TouchableOpacity style={styles.dateButton} onPress={handleDateSelection}>
              <Text style={styles.dateButtonText}>{formatDateDisplay(selectedDate)}</Text>
              <Ionicons name="calendar-outline" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Exception Type */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Type</Text>
            <View style={styles.typeButtons}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  exceptionType === 'closed' && styles.typeButtonActive,
                ]}
                onPress={() => setExceptionType('closed')}
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={exceptionType === 'closed' ? colors.white : colors.text.secondary}
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    exceptionType === 'closed' && styles.typeButtonTextActive,
                  ]}
                >
                  Closed
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeButton,
                  exceptionType === 'custom' && styles.typeButtonActive,
                ]}
                onPress={() => setExceptionType('custom')}
              >
                <Ionicons
                  name="time-outline"
                  size={20}
                  color={exceptionType === 'custom' ? colors.white : colors.text.secondary}
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    exceptionType === 'custom' && styles.typeButtonTextActive,
                  ]}
                >
                  Custom Hours
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Time Pickers (only for custom hours) */}
          {exceptionType === 'custom' && (
            <>
              {/* Start Time */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Start Time</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeSlots}>
                  {TIME_SLOTS.map((slot) => (
                    <TouchableOpacity
                      key={`start-${slot}`}
                      style={[
                        styles.timeSlot,
                        startTime === slot && styles.timeSlotSelected,
                      ]}
                      onPress={() => setStartTime(slot)}
                    >
                      <Text
                        style={[
                          styles.timeSlotText,
                          startTime === slot && styles.timeSlotTextSelected,
                        ]}
                      >
                        {slot}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* End Time */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>End Time</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeSlots}>
                  {TIME_SLOTS.map((slot) => (
                    <TouchableOpacity
                      key={`end-${slot}`}
                      style={[
                        styles.timeSlot,
                        endTime === slot && styles.timeSlotSelected,
                      ]}
                      onPress={() => setEndTime(slot)}
                    >
                      <Text
                        style={[
                          styles.timeSlotText,
                          endTime === slot && styles.timeSlotTextSelected,
                        ]}
                      >
                        {slot}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </>
          )}

          {/* Reason */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Reason (Optional)</Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="Holiday, Vacation, etc."
              placeholderTextColor={colors.text.tertiary}
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={2}
            />
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => rbSheetRef.current?.close()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </RBSheet>
    );
  }
);

ScheduleExceptionModal.displayName = 'ScheduleExceptionModal';

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  content: {
    flex: 1,
    paddingTop: spacing.md,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  dateButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  typeButtonActive: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  typeButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
  },
  typeButtonTextActive: {
    color: colors.white,
  },
  timeSlots: {
    flexDirection: 'row',
  },
  timeSlot: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.xs,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  timeSlotSelected: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  timeSlotText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
  },
  timeSlotTextSelected: {
    color: colors.white,
    fontWeight: typography.fontWeight.semibold,
  },
  reasonInput: {
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.secondary,
  },
  cancelButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  saveButton: {
    flex: 2,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.accent.primary,
  },
  saveButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});
