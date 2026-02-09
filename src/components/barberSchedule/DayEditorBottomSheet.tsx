import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import RBSheet from 'react-native-raw-bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export interface DayEditorSheetRef {
  open: (dayData: DayEditData) => void;
  close: () => void;
}

export interface DayEditData {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  dayLabel: string;  // "Monday", "Tuesday", etc.
  startTime: string; // "09:00" (24h format)
  endTime: string;   // "17:00" (24h format)
  isAvailable: boolean;
}

interface DayEditorBottomSheetProps {
  onSave: (data: DayEditData) => Promise<void>;
}

const TIME_SLOTS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
  '22:00', '22:30', '23:00', '23:30',
];

// Helper to format time for display (24h to 12h)
const formatTimeDisplay = (time24: string): string => {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

export const DayEditorBottomSheet = forwardRef<DayEditorSheetRef, DayEditorBottomSheetProps>(
  ({ onSave }, ref) => {
    const rbSheetRef = useRef<any>(null);
    const [editData, setEditData] = useState<DayEditData | null>(null);
    const [saving, setSaving] = useState(false);
    const [showStartTimePicker, setShowStartTimePicker] = useState(false);
    const [showEndTimePicker, setShowEndTimePicker] = useState(false);

    useImperativeHandle(ref, () => ({
      open: (dayData: DayEditData) => {
        setEditData(dayData);
        rbSheetRef.current?.open();
      },
      close: () => rbSheetRef.current?.close(),
    }));

    const handleSave = async () => {
      if (!editData) return;

      // Validation
      if (editData.isAvailable) {
        const startMinutes = parseInt(editData.startTime.split(':')[0]) * 60 + parseInt(editData.startTime.split(':')[1]);
        const endMinutes = parseInt(editData.endTime.split(':')[0]) * 60 + parseInt(editData.endTime.split(':')[1]);

        if (endMinutes <= startMinutes) {
          Alert.alert('Invalid Time', 'End time must be after start time');
          return;
        }

        if (endMinutes - startMinutes < 60) {
          Alert.alert('Invalid Duration', 'Minimum shift duration is 1 hour');
          return;
        }
      }

      setSaving(true);
      try {
        await onSave(editData);
        rbSheetRef.current?.close();
      } catch (error) {
        Alert.alert('Error', 'Failed to save schedule. Please try again.');
      } finally {
        setSaving(false);
      }
    };

    const handleCancel = () => {
      rbSheetRef.current?.close();
    };

    if (!editData) return null;

    return (
      <RBSheet
        ref={rbSheetRef}
        height={600}
        openDuration={250}
        closeDuration={200}
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
            display: 'none',
          },
        }}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Edit {editData.dayLabel}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleCancel}
              disabled={saving}
            >
              <Ionicons name="close" size={24} color={colors.gray[600]} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Available Toggle */}
            <View style={styles.section}>
              <View style={styles.row}>
                <View style={styles.labelContainer}>
                  <Text style={styles.label}>Available</Text>
                  <Text style={styles.labelDescription}>
                    Turn off for days off
                  </Text>
                </View>
                <Switch
                  value={editData.isAvailable}
                  onValueChange={(value) =>
                    setEditData({ ...editData, isAvailable: value })
                  }
                  trackColor={{ false: colors.gray[300], true: colors.accent.primary }}
                  thumbColor={colors.white}
                />
              </View>
            </View>

            {/* Time Selection (only if available) */}
            {editData.isAvailable && (
              <>
                {/* Start Time */}
                <View style={styles.section}>
                  <Text style={styles.label}>Start Time</Text>
                  <TouchableOpacity
                    style={styles.timeButton}
                    onPress={() => {
                      setShowStartTimePicker(!showStartTimePicker);
                      setShowEndTimePicker(false);
                    }}
                  >
                    <Text style={styles.timeButtonText}>
                      {formatTimeDisplay(editData.startTime)}
                    </Text>
                    <Ionicons
                      name={showStartTimePicker ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={colors.gray[600]}
                    />
                  </TouchableOpacity>

                  {showStartTimePicker && (
                    <ScrollView style={styles.timePicker} nestedScrollEnabled>
                      {TIME_SLOTS.map((time) => (
                        <TouchableOpacity
                          key={time}
                          style={[
                            styles.timeOption,
                            editData.startTime === time && styles.timeOptionSelected,
                          ]}
                          onPress={() => {
                            setEditData({ ...editData, startTime: time });
                            setShowStartTimePicker(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.timeOptionText,
                              editData.startTime === time &&
                                styles.timeOptionTextSelected,
                            ]}
                          >
                            {formatTimeDisplay(time)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </View>

                {/* End Time */}
                <View style={styles.section}>
                  <Text style={styles.label}>End Time</Text>
                  <TouchableOpacity
                    style={styles.timeButton}
                    onPress={() => {
                      setShowEndTimePicker(!showEndTimePicker);
                      setShowStartTimePicker(false);
                    }}
                  >
                    <Text style={styles.timeButtonText}>
                      {formatTimeDisplay(editData.endTime)}
                    </Text>
                    <Ionicons
                      name={showEndTimePicker ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={colors.gray[600]}
                    />
                  </TouchableOpacity>

                  {showEndTimePicker && (
                    <ScrollView style={styles.timePicker} nestedScrollEnabled>
                      {TIME_SLOTS.map((time) => (
                        <TouchableOpacity
                          key={time}
                          style={[
                            styles.timeOption,
                            editData.endTime === time && styles.timeOptionSelected,
                          ]}
                          onPress={() => {
                            setEditData({ ...editData, endTime: time });
                            setShowEndTimePicker(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.timeOptionText,
                              editData.endTime === time && styles.timeOptionTextSelected,
                            ]}
                          >
                            {formatTimeDisplay(time)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </View>

                {/* Info Note */}
                <View style={styles.infoBox}>
                  <Ionicons name="information-circle" size={20} color={colors.accent.primary} />
                  <Text style={styles.infoText}>
                    Minimum shift duration is 1 hour. Appointments are scheduled in 30-minute slots.
                  </Text>
                </View>
              </>
            )}
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
              disabled={saving}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveButtonText}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </RBSheet>
    );
  }
);

DayEditorBottomSheet.displayName = 'DayEditorBottomSheet';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: 600,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    backgroundColor: colors.white,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[900],
  },
  closeButton: {
    padding: spacing.xs,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelContainer: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  labelDescription: {
    fontSize: 14,
    color: colors.gray[600],
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.gray[50],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray[300],
  },
  timeButtonText: {
    fontSize: 16,
    color: colors.gray[900],
    fontWeight: '500',
  },
  timePicker: {
    maxHeight: 200,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    backgroundColor: colors.white,
  },
  timeOption: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  timeOptionSelected: {
    backgroundColor: colors.accent.primary + '10',
  },
  timeOptionText: {
    fontSize: 16,
    color: colors.gray[700],
  },
  timeOptionTextSelected: {
    color: colors.accent.primary,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.accent.primary + '10',
    padding: spacing.md,
    borderRadius: 8,
    marginTop: spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.gray[700],
    marginLeft: spacing.sm,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    backgroundColor: colors.white,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: colors.gray[100],
    marginRight: spacing.md,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[700],
  },
  saveButton: {
    backgroundColor: colors.accent.primary,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});
