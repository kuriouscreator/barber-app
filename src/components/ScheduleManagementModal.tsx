import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Availability, ScheduleException } from '../types';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';

interface ScheduleManagementModalProps {
  visible: boolean;
  availability: Availability[];
  scheduleExceptions: ScheduleException[];
  onClose: () => void;
  onSave: (availability: Availability[]) => void;
  onAddException: (date: string) => void;
  onEditException: (exception: ScheduleException) => void;
}

const DAYS_OF_WEEK = [
  { day: 0, name: 'Sunday', short: 'Sun' },
  { day: 1, name: 'Monday', short: 'Mon' },
  { day: 2, name: 'Tuesday', short: 'Tue' },
  { day: 3, name: 'Wednesday', short: 'Wed' },
  { day: 4, name: 'Thursday', short: 'Thu' },
  { day: 5, name: 'Friday', short: 'Fri' },
  { day: 6, name: 'Saturday', short: 'Sat' },
];

const TIME_SLOTS = [
  '6:00 AM', '6:30 AM', '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM',
  '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM',
  '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
  '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM', '9:00 PM', '9:30 PM',
  '10:00 PM', '10:30 PM', '11:00 PM', '11:30 PM'
];

const ScheduleManagementModal: React.FC<ScheduleManagementModalProps> = ({
  visible,
  availability,
  scheduleExceptions,
  onClose,
  onSave,
  onAddException,
  onEditException,
}) => {
  const [schedule, setSchedule] = useState<Availability[]>([]);

  useEffect(() => {
    if (visible) {
      // Initialize with current availability or default schedule
      const initialSchedule = availability.length > 0 ? availability : DAYS_OF_WEEK.map(day => ({
        dayOfWeek: day.day,
        startTime: '9:00 AM',
        endTime: '5:00 PM',
        isAvailable: day.day >= 1 && day.day <= 5, // Monday to Friday by default
      }));
      setSchedule(initialSchedule);
    }
  }, [visible, availability]);

  const updateDayAvailability = (dayOfWeek: number, isAvailable: boolean) => {
    setSchedule(prev => prev.map(day => 
      day.dayOfWeek === dayOfWeek 
        ? { ...day, isAvailable }
        : day
    ));
  };

  const updateTimeSlot = (dayOfWeek: number, field: 'startTime' | 'endTime', time: string) => {
    setSchedule(prev => prev.map(day => 
      day.dayOfWeek === dayOfWeek 
        ? { ...day, [field]: time }
        : day
    ));
  };

  const handleSave = () => {
    // Validate that start time is before end time for available days
    const invalidDays = schedule.filter(day => 
      day.isAvailable && day.startTime >= day.endTime
    );

    if (invalidDays.length > 0) {
      Alert.alert(
        'Invalid Schedule',
        'Start time must be before end time for all available days.',
        [{ text: 'OK' }]
      );
      return;
    }

    onSave(schedule);
  };

  const formatExceptionDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaySchedule = (dayOfWeek: number) => {
    return schedule.find(day => day.dayOfWeek === dayOfWeek) || {
      dayOfWeek,
      startTime: '9:00 AM',
      endTime: '5:00 PM',
      isAvailable: false,
    };
  };

  const renderTimePicker = (dayOfWeek: number, field: 'startTime' | 'endTime', currentTime: string) => {
    const daySchedule = getDaySchedule(dayOfWeek);
    
    return (
      <View style={styles.timePickerContainer}>
        <Text style={styles.timePickerLabel}>
          {field === 'startTime' ? 'Start' : 'End'}
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
                !daySchedule.isAvailable && styles.timeSlotDisabled,
              ]}
              onPress={() => updateTimeSlot(dayOfWeek, field, time)}
              disabled={!daySchedule.isAvailable}
            >
              <Text style={[
                styles.timeSlotText,
                time === currentTime && styles.timeSlotTextSelected,
                !daySchedule.isAvailable && styles.timeSlotTextDisabled,
              ]}>
                {time}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderDaySchedule = (day: typeof DAYS_OF_WEEK[0]) => {
    const daySchedule = getDaySchedule(day.day);
    
    return (
      <View key={day.day} style={styles.dayContainer}>
        <View style={styles.dayHeader}>
          <View style={styles.dayInfo}>
            <Text style={styles.dayName}>{day.name}</Text>
            <Text style={styles.dayShort}>{day.short}</Text>
          </View>
          <Switch
            value={daySchedule.isAvailable}
            onValueChange={(value) => updateDayAvailability(day.day, value)}
            trackColor={{ false: colors.gray[300], true: colors.accent.primary }}
            thumbColor={colors.white}
          />
        </View>
        
        {daySchedule.isAvailable && (
          <View style={styles.timePickers}>
            {renderTimePicker(day.day, 'startTime', daySchedule.startTime)}
            {renderTimePicker(day.day, 'endTime', daySchedule.endTime)}
          </View>
        )}
        
        {!daySchedule.isAvailable && (
          <View style={styles.unavailableContainer}>
            <Ionicons name="close-circle-outline" size={20} color={colors.gray[400]} />
            <Text style={styles.unavailableText}>Not available</Text>
          </View>
        )}
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
          <Text style={styles.title}>Manage Schedule</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.scheduleContainer}>
            <Text style={styles.sectionTitle}>Weekly Availability</Text>
            <Text style={styles.sectionSubtitle}>
              Set your working hours for each day of the week
            </Text>
            
            {DAYS_OF_WEEK.map(renderDaySchedule)}
          </View>

          {/* Schedule Exceptions Section */}
          <View style={styles.exceptionsContainer}>
            <Text style={styles.sectionTitle}>Schedule Exceptions</Text>
            <Text style={styles.sectionSubtitle}>
              Override your regular schedule for specific dates
            </Text>
            
            <TouchableOpacity
              style={styles.addExceptionButton}
              onPress={() => {
                console.log('Add Exception button pressed');
                // For now, we'll use a simple date picker approach
                // In a real app, you'd want a proper date picker
                const today = new Date();
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                const dateString = tomorrow.toISOString().split('T')[0];
                console.log('Calling onAddException with date:', dateString);
                onAddException(dateString);
              }}
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.accent.primary} />
              <Text style={styles.addExceptionText}>Add Exception</Text>
            </TouchableOpacity>

            {scheduleExceptions.length > 0 ? (
              <View style={styles.exceptionsList}>
                {scheduleExceptions.map((exception) => (
                  <TouchableOpacity
                    key={exception.id}
                    style={styles.exceptionItem}
                    onPress={() => {
                      console.log('Exception item pressed:', exception);
                      onEditException(exception);
                    }}
                  >
                    <View style={styles.exceptionInfo}>
                      <Text style={styles.exceptionDate}>
                        {formatExceptionDate(exception.date)}
                      </Text>
                      {exception.isAvailable ? (
                        <Text style={styles.exceptionTime}>
                          {exception.startTime} - {exception.endTime}
                        </Text>
                      ) : (
                        <Text style={styles.exceptionUnavailable}>Not available</Text>
                      )}
                      {exception.reason && (
                        <Text style={styles.exceptionReason}>{exception.reason}</Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyExceptions}>
                <Ionicons name="calendar-outline" size={32} color={colors.gray[300]} />
                <Text style={styles.emptyExceptionsText}>No exceptions set</Text>
                <Text style={styles.emptyExceptionsSubtext}>
                  Add exceptions for holidays, special hours, or personal time off
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        <View style={styles.footer}>
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
              <Text style={styles.saveButtonText}>Save Schedule</Text>
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
  scheduleContainer: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
  },
  dayContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  dayInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginRight: spacing.sm,
  },
  dayShort: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    backgroundColor: colors.gray[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  timePickers: {
    gap: spacing.md,
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
  exceptionsContainer: {
    padding: spacing.lg,
  },
  addExceptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.accent.primary,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  addExceptionText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.accent.primary,
    marginLeft: spacing.xs,
  },
  exceptionsList: {
    marginTop: spacing.md,
  },
  exceptionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  exceptionInfo: {
    flex: 1,
  },
  exceptionDate: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  exceptionTime: {
    fontSize: typography.fontSize.sm,
    color: colors.accent.primary,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.xs,
  },
  exceptionUnavailable: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[400],
    fontStyle: 'italic',
    marginBottom: spacing.xs,
  },
  exceptionReason: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  emptyExceptions: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  emptyExceptionsText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyExceptionsSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
});

export default ScheduleManagementModal;
