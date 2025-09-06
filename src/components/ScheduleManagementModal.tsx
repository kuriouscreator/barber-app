import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Switch,
  Alert,
  TextInput,
  Animated,
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
  onAddException: (exception: ScheduleException) => void;
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
  const [showExceptionForm, setShowExceptionForm] = useState(false);
  const [editingException, setEditingException] = useState<ScheduleException | null>(null);
  const [exceptionFormData, setExceptionFormData] = useState({
    date: '',
    startTime: '9:00 AM',
    endTime: '5:00 PM',
    isAvailable: true,
    reason: '',
  });
  
  const scrollViewRef = useRef<ScrollView>(null);
  const formAnimation = useRef(new Animated.Value(0)).current;

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

  // Handle form animation and auto-scroll
  useEffect(() => {
    if (showExceptionForm) {
      // Animate form appearance
      Animated.timing(formAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Auto-scroll to form after a short delay
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 350);
    } else {
      // Animate form disappearance
      Animated.timing(formAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [showExceptionForm, formAnimation]);

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
    // Convert 12-hour format to 24-hour for comparison
    const convertTo24Hour = (time12: string) => {
      const [time, period] = time12.split(' ');
      const [hours, minutes] = time.split(':');
      let hour24 = parseInt(hours);
      
      if (period === 'PM' && hour24 !== 12) {
        hour24 += 12;
      } else if (period === 'AM' && hour24 === 12) {
        hour24 = 0;
      }
      
      return `${hour24.toString().padStart(2, '0')}:${minutes}`;
    };

    // Validate that start time is before end time for available days
    const invalidDays = schedule.filter(day => {
      if (!day.isAvailable) return false;
      
      const start24 = convertTo24Hour(day.startTime);
      const end24 = convertTo24Hour(day.endTime);
      
      return start24 >= end24;
    });

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

  const handleAddException = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];
    
    setExceptionFormData({
      date: dateString,
      startTime: '9:00 AM',
      endTime: '5:00 PM',
      isAvailable: true,
      reason: '',
    });
    setEditingException(null);
    setShowExceptionForm(true);
  };

  const handleDateChange = (dateString: string) => {
    setExceptionFormData(prev => ({ ...prev, date: dateString }));
  };

  const showDatePicker = () => {
    Alert.alert(
      'Select Date',
      'Choose a date for this exception',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Today', 
          onPress: () => {
            const today = new Date().toISOString().split('T')[0];
            handleDateChange(today);
          }
        },
        { 
          text: 'Tomorrow', 
          onPress: () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dateString = tomorrow.toISOString().split('T')[0];
            handleDateChange(dateString);
          }
        },
        { 
          text: 'Next Week', 
          onPress: () => {
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            const dateString = nextWeek.toISOString().split('T')[0];
            handleDateChange(dateString);
          }
        },
      ]
    );
  };

  const handleEditException = (exception: ScheduleException) => {
    setExceptionFormData({
      date: exception.date,
      startTime: exception.startTime,
      endTime: exception.endTime,
      isAvailable: exception.isAvailable,
      reason: exception.reason || '',
    });
    setEditingException(exception);
    setShowExceptionForm(true);
  };

  const handleSaveException = () => {
    // Convert 12-hour format to 24-hour for comparison
    const convertTo24Hour = (time12: string) => {
      const [time, period] = time12.split(' ');
      const [hours, minutes] = time.split(':');
      let hour24 = parseInt(hours);
      
      if (period === 'PM' && hour24 !== 12) {
        hour24 += 12;
      } else if (period === 'AM' && hour24 === 12) {
        hour24 = 0;
      }
      
      return `${hour24.toString().padStart(2, '0')}:${minutes}`;
    };

    if (exceptionFormData.isAvailable) {
      const start24 = convertTo24Hour(exceptionFormData.startTime);
      const end24 = convertTo24Hour(exceptionFormData.endTime);
      
      if (start24 >= end24) {
        Alert.alert('Invalid Time', 'Start time must be before end time.');
        return;
      }
    }

    const exception: ScheduleException = {
      id: editingException?.id || Date.now().toString(),
      date: exceptionFormData.date,
      startTime: exceptionFormData.startTime,
      endTime: exceptionFormData.endTime,
      isAvailable: exceptionFormData.isAvailable,
      reason: exceptionFormData.reason.trim() || undefined,
    };

    if (editingException) {
      onEditException(exception);
    } else {
      onAddException(exception);
    }

    setShowExceptionForm(false);
    setEditingException(null);
  };

  const handleCancelException = () => {
    setShowExceptionForm(false);
    setEditingException(null);
  };

  const renderExceptionTimePicker = (field: 'startTime' | 'endTime', currentTime: string) => {
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
                !exceptionFormData.isAvailable && styles.timeSlotDisabled,
              ]}
              onPress={() => setExceptionFormData(prev => ({ ...prev, [field]: time }))}
              disabled={!exceptionFormData.isAvailable}
            >
              <Text style={[
                styles.timeSlotText,
                time === currentTime && styles.timeSlotTextSelected,
                !exceptionFormData.isAvailable && styles.timeSlotTextDisabled,
              ]}>
                {time}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
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

        <ScrollView 
          ref={scrollViewRef}
          style={styles.content} 
          showsVerticalScrollIndicator={false}
        >
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
              onPress={handleAddException}
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
                    onPress={() => handleEditException(exception)}
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

          {/* Inline Exception Form */}
          {showExceptionForm && (
            <Animated.View 
              style={[
                styles.exceptionFormContainer,
                {
                  opacity: formAnimation,
                  transform: [{
                    translateY: formAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  }],
                },
              ]}
            >
              <View style={styles.exceptionFormHeader}>
                <Text style={styles.exceptionFormTitle}>
                  {editingException ? 'Edit Exception' : 'Add Exception'}
                </Text>
                <TouchableOpacity onPress={handleCancelException}>
                  <Ionicons name="close" size={24} color={colors.text.primary} />
                </TouchableOpacity>
              </View>

              <View style={styles.exceptionForm}>
                <TouchableOpacity style={styles.dateDisplay} onPress={showDatePicker}>
                  <Ionicons name="calendar-outline" size={20} color={colors.accent.primary} />
                  <Text style={styles.dateDisplayText}>
                    {exceptionFormData.date ? formatExceptionDate(exceptionFormData.date) : 'Select a date'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={colors.gray[400]} />
                </TouchableOpacity>

                <View style={styles.availabilityToggle}>
                  <Text style={styles.availabilityLabel}>Available on this date</Text>
                  <Switch
                    value={exceptionFormData.isAvailable}
                    onValueChange={(value) => setExceptionFormData(prev => ({ ...prev, isAvailable: value }))}
                    trackColor={{ false: colors.gray[300], true: colors.accent.primary }}
                    thumbColor={colors.white}
                  />
                </View>

                {exceptionFormData.isAvailable && (
                  <View style={styles.exceptionTimePickers}>
                    {renderExceptionTimePicker('startTime', exceptionFormData.startTime)}
                    {renderExceptionTimePicker('endTime', exceptionFormData.endTime)}
                  </View>
                )}

                <View style={styles.reasonInput}>
                  <Text style={styles.reasonLabel}>Reason (Optional)</Text>
                  <TextInput
                    style={styles.reasonTextInput}
                    value={exceptionFormData.reason}
                    onChangeText={(value) => setExceptionFormData(prev => ({ ...prev, reason: value }))}
                    placeholder="e.g., Holiday, Personal appointment, etc."
                    placeholderTextColor={colors.gray[400]}
                    multiline
                    numberOfLines={2}
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.exceptionFormButtons}>
                  <TouchableOpacity
                    style={styles.cancelExceptionButton}
                    onPress={handleCancelException}
                  >
                    <Text style={styles.cancelExceptionButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveExceptionButton}
                    onPress={handleSaveException}
                  >
                    <Text style={styles.saveExceptionButtonText}>
                      {editingException ? 'Update Exception' : 'Add Exception'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          )}
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
  exceptionFormContainer: {
    backgroundColor: colors.white,
    margin: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.accent.primary,
    shadowColor: colors.accent.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  exceptionFormHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomColor: colors.border.light,
    borderBottomWidth: 1,
  },
  exceptionFormTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  exceptionForm: {
    padding: spacing.lg,
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  dateDisplayText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginLeft: spacing.sm,
  },
  availabilityToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  availabilityLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  exceptionTimePickers: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  reasonInput: {
    marginBottom: spacing.lg,
  },
  reasonLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  reasonTextInput: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
    minHeight: 60,
  },
  exceptionFormButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cancelExceptionButton: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  cancelExceptionButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
  },
  saveExceptionButton: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.black,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  saveExceptionButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.white,
  },
});

export default ScheduleManagementModal;
