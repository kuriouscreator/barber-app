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
import { Availability } from '../types';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';

interface ScheduleManagementModalProps {
  visible: boolean;
  availability: Availability[];
  onClose: () => void;
  onSave: (availability: Availability[]) => void;
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
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
  '22:00', '22:30', '23:00', '23:30'
];

const ScheduleManagementModal: React.FC<ScheduleManagementModalProps> = ({
  visible,
  availability,
  onClose,
  onSave,
}) => {
  const [schedule, setSchedule] = useState<Availability[]>([]);

  useEffect(() => {
    if (visible) {
      // Initialize with current availability or default schedule
      const initialSchedule = availability.length > 0 ? availability : DAYS_OF_WEEK.map(day => ({
        dayOfWeek: day.day,
        startTime: '09:00',
        endTime: '17:00',
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

  const getDaySchedule = (dayOfWeek: number) => {
    return schedule.find(day => day.dayOfWeek === dayOfWeek) || {
      dayOfWeek,
      startTime: '09:00',
      endTime: '17:00',
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
});

export default ScheduleManagementModal;
