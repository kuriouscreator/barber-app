import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface DaySchedule {
  dayOfWeek: number;
  dayName: string;
  dayShort: string;
  isAvailable: boolean;
  startTime: string;
  endTime: string;
}

interface ScheduleSetupScreenProps {
  onContinue: (schedule: DaySchedule[]) => void;
  onBack?: () => void;
  initialSchedule?: DaySchedule[];
  currentStep: number;
  totalSteps: number;
}

const DEFAULT_SCHEDULE: DaySchedule[] = [
  { dayOfWeek: 0, dayName: 'Sunday', dayShort: 'Sun', isAvailable: false, startTime: '09:00', endTime: '17:00' },
  { dayOfWeek: 1, dayName: 'Monday', dayShort: 'Mon', isAvailable: true, startTime: '09:00', endTime: '18:00' },
  { dayOfWeek: 2, dayName: 'Tuesday', dayShort: 'Tue', isAvailable: true, startTime: '09:00', endTime: '18:00' },
  { dayOfWeek: 3, dayName: 'Wednesday', dayShort: 'Wed', isAvailable: true, startTime: '09:00', endTime: '18:00' },
  { dayOfWeek: 4, dayName: 'Thursday', dayShort: 'Thu', isAvailable: true, startTime: '09:00', endTime: '18:00' },
  { dayOfWeek: 5, dayName: 'Friday', dayShort: 'Fri', isAvailable: true, startTime: '09:00', endTime: '18:00' },
  { dayOfWeek: 6, dayName: 'Saturday', dayShort: 'Sat', isAvailable: true, startTime: '10:00', endTime: '16:00' },
];

const TIME_SLOTS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
  '22:00',
];

const ScheduleSetupScreen: React.FC<ScheduleSetupScreenProps> = ({
  onContinue,
  onBack,
  initialSchedule,
  currentStep,
  totalSteps,
}) => {
  const [schedule, setSchedule] = useState<DaySchedule[]>(
    initialSchedule || DEFAULT_SCHEDULE
  );
  const [editingDay, setEditingDay] = useState<number | null>(null);

  const toggleDayAvailability = (dayOfWeek: number) => {
    setSchedule(schedule.map(day =>
      day.dayOfWeek === dayOfWeek ? { ...day, isAvailable: !day.isAvailable } : day
    ));
  };

  const updateDayTime = (dayOfWeek: number, field: 'startTime' | 'endTime', value: string) => {
    setSchedule(schedule.map(day =>
      day.dayOfWeek === dayOfWeek ? { ...day, [field]: value } : day
    ));
  };

  const handleContinue = () => {
    const hasAtLeastOneAvailableDay = schedule.some(day => day.isAvailable);

    if (!hasAtLeastOneAvailableDay) {
      Alert.alert(
        'Set your availability',
        'You need to be available at least one day per week.'
      );
      return;
    }

    // Validate that start time is before end time for available days
    const invalidDays = schedule.filter(day =>
      day.isAvailable && day.startTime >= day.endTime
    );

    if (invalidDays.length > 0) {
      Alert.alert(
        'Invalid time range',
        `Please ensure start time is before end time for ${invalidDays[0].dayName}.`
      );
      return;
    }

    onContinue(schedule);
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const renderDayRow = (day: DaySchedule) => {
    const isEditing = editingDay === day.dayOfWeek;

    return (
      <View key={day.dayOfWeek} style={styles.dayRow}>
        <View style={styles.dayHeader}>
          <TouchableOpacity
            style={styles.dayToggle}
            onPress={() => toggleDayAvailability(day.dayOfWeek)}
          >
            <View style={[styles.checkbox, day.isAvailable && styles.checkboxChecked]}>
              {day.isAvailable && (
                <Ionicons name="checkmark" size={16} color={colors.white} />
              )}
            </View>
            <View style={styles.dayInfo}>
              <Text style={[styles.dayName, !day.isAvailable && styles.dayNameDisabled]}>
                {day.dayName}
              </Text>
              {day.isAvailable ? (
                <Text style={styles.dayTime}>
                  {formatTime(day.startTime)} - {formatTime(day.endTime)}
                </Text>
              ) : (
                <Text style={styles.dayClosed}>Closed</Text>
              )}
            </View>
          </TouchableOpacity>

          {day.isAvailable && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setEditingDay(isEditing ? null : day.dayOfWeek)}
            >
              <Ionicons
                name={isEditing ? 'checkmark' : 'create-outline'}
                size={20}
                color={colors.accent.primary}
              />
            </TouchableOpacity>
          )}
        </View>

        {isEditing && day.isAvailable && (
          <View style={styles.timePickerContainer}>
            <View style={styles.timePicker}>
              <Text style={styles.timeLabel}>Start</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.timeSlots}>
                  {TIME_SLOTS.map(time => (
                    <TouchableOpacity
                      key={`start-${time}`}
                      style={[
                        styles.timeSlot,
                        day.startTime === time && styles.timeSlotSelected,
                      ]}
                      onPress={() => updateDayTime(day.dayOfWeek, 'startTime', time)}
                    >
                      <Text
                        style={[
                          styles.timeSlotText,
                          day.startTime === time && styles.timeSlotTextSelected,
                        ]}
                      >
                        {formatTime(time)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.timePicker}>
              <Text style={styles.timeLabel}>End</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.timeSlots}>
                  {TIME_SLOTS.map(time => (
                    <TouchableOpacity
                      key={`end-${time}`}
                      style={[
                        styles.timeSlot,
                        day.endTime === time && styles.timeSlotSelected,
                      ]}
                      onPress={() => updateDayTime(day.dayOfWeek, 'endTime', time)}
                    >
                      <Text
                        style={[
                          styles.timeSlotText,
                          day.endTime === time && styles.timeSlotTextSelected,
                        ]}
                      >
                        {formatTime(time)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        )}
        <View style={styles.progressDots}>
          {Array.from({ length: totalSteps }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index < currentStep && styles.dotActive,
              ]}
            />
          ))}
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={styles.titleContainer}>
          <Ionicons name="calendar" size={48} color={colors.accent.primary} />
          <Text style={styles.title}>Set your availability</Text>
          <Text style={styles.subtitle}>
            Choose your working hours for each day of the week
          </Text>
        </View>

        {/* Schedule */}
        <View style={styles.scheduleContainer}>
          {schedule.map(renderDayRow)}
        </View>

        <Text style={styles.helperText}>
          You can update your schedule anytime from the Schedule tab
        </Text>
      </ScrollView>

      {/* Footer with Continue Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !schedule.some(d => d.isAvailable) && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!schedule.some(d => d.isAvailable)}
        >
          <Text style={styles.continueButtonText}>Finish Setup</Text>
          <Ionicons name="checkmark" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDots: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gray[300],
  },
  dotActive: {
    backgroundColor: colors.accent.primary,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.md,
  },
  scheduleContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  dayRow: {
    marginBottom: spacing.md,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayToggle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border.default,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  dayInfo: {
    flex: 1,
  },
  dayName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  dayNameDisabled: {
    color: colors.text.tertiary,
  },
  dayTime: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  dayClosed: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  editButton: {
    padding: spacing.sm,
  },
  timePickerContainer: {
    marginTop: spacing.md,
    marginLeft: spacing.lg + spacing.sm + 24, // Align with day name
    gap: spacing.md,
  },
  timePicker: {
    gap: spacing.xs,
  },
  timeLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeSlots: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  timeSlot: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  timeSlotSelected: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  timeSlotText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.primary,
  },
  timeSlotTextSelected: {
    color: colors.white,
    fontWeight: typography.fontWeight.semibold,
  },
  helperText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 16,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  continueButton: {
    flexDirection: 'row',
    backgroundColor: colors.accent.primary,
    paddingVertical: spacing.md + 2,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});

export default ScheduleSetupScreen;
