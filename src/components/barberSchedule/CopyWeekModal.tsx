import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
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
import { format, parse, addWeeks } from 'date-fns';

interface CopyWeekModalProps {
  sourceWeekStart: string; // YYYY-MM-DD format
  onCopy: (targetWeeks: string[], includeExceptions: boolean) => void;
  onClose: () => void;
}

export const CopyWeekModal = forwardRef<any, CopyWeekModalProps>(
  ({ sourceWeekStart, onCopy, onClose }, ref) => {
    const rbSheetRef = useRef<any>(null);

    // Form state
    const [selectedWeeks, setSelectedWeeks] = useState<string[]>([]);
    const [includeExceptions, setIncludeExceptions] = useState(false);

    // Expose open and close methods
    useImperativeHandle(ref, () => ({
      open: () => {
        resetForm();
        rbSheetRef.current?.open();
      },
      close: () => rbSheetRef.current?.close(),
    }));

    const resetForm = () => {
      setSelectedWeeks([]);
      setIncludeExceptions(false);
    };

    // Generate list of target weeks (next 8 weeks)
    const generateTargetWeeks = () => {
      const weeks: { startDate: string; label: string }[] = [];
      const sourceDate = parse(sourceWeekStart, 'yyyy-MM-dd', new Date());

      for (let i = 1; i <= 8; i++) {
        const weekStart = addWeeks(sourceDate, i);
        const weekEnd = addWeeks(weekStart, 0);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const startDateStr = format(weekStart, 'yyyy-MM-dd');
        const label = `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;

        weeks.push({ startDate: startDateStr, label });
      }

      return weeks;
    };

    const targetWeeks = generateTargetWeeks();

    const toggleWeekSelection = (weekStart: string) => {
      if (selectedWeeks.includes(weekStart)) {
        setSelectedWeeks(selectedWeeks.filter(w => w !== weekStart));
      } else {
        setSelectedWeeks([...selectedWeeks, weekStart]);
      }
    };

    const formatSourceWeekLabel = () => {
      try {
        const weekStart = parse(sourceWeekStart, 'yyyy-MM-dd', new Date());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
      } catch {
        return sourceWeekStart;
      }
    };

    const handleCopy = () => {
      if (selectedWeeks.length === 0) {
        Alert.alert('No Weeks Selected', 'Please select at least one week to copy to.');
        return;
      }

      const weekCount = selectedWeeks.length;
      const weekWord = weekCount === 1 ? 'week' : 'weeks';
      const exceptionText = includeExceptions ? ' (including exceptions)' : '';

      Alert.alert(
        'Confirm Copy',
        `Copy schedule to ${weekCount} ${weekWord}${exceptionText}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Copy',
            onPress: () => {
              onCopy(selectedWeeks, includeExceptions);
              rbSheetRef.current?.close();
            },
          },
        ]
      );
    };

    return (
      <RBSheet
        ref={rbSheetRef}
        height={600}
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
          <Text style={styles.headerTitle}>Copy Week</Text>
          <TouchableOpacity onPress={() => rbSheetRef.current?.close()}>
            <Ionicons name="close" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Source Week */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Source Week</Text>
            <View style={styles.sourceWeekCard}>
              <Ionicons name="calendar" size={20} color={colors.accent.primary} />
              <Text style={styles.sourceWeekText}>{formatSourceWeekLabel()}</Text>
            </View>
            <Text style={styles.helperText}>
              Your current weekly schedule will be copied to the selected weeks below.
            </Text>
          </View>

          {/* Target Weeks */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              Copy To ({selectedWeeks.length} selected)
            </Text>
            <View style={styles.weeksContainer}>
              {targetWeeks.map((week) => {
                const isSelected = selectedWeeks.includes(week.startDate);
                return (
                  <TouchableOpacity
                    key={week.startDate}
                    style={[
                      styles.weekItem,
                      isSelected && styles.weekItemSelected,
                    ]}
                    onPress={() => toggleWeekSelection(week.startDate)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.weekItemContent}>
                      <View
                        style={[
                          styles.checkbox,
                          isSelected && styles.checkboxSelected,
                        ]}
                      >
                        {isSelected && (
                          <Ionicons name="checkmark" size={16} color={colors.white} />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.weekItemText,
                          isSelected && styles.weekItemTextSelected,
                        ]}
                      >
                        {week.label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Include Exceptions Toggle */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => setIncludeExceptions(!includeExceptions)}
              activeOpacity={0.7}
            >
              <View style={styles.toggleLeft}>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={colors.text.primary}
                />
                <View style={styles.toggleTextContainer}>
                  <Text style={styles.toggleLabel}>Include Exceptions</Text>
                  <Text style={styles.toggleHelperText}>
                    Copy holidays and custom hours
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.switch,
                  includeExceptions && styles.switchActive,
                ]}
              >
                <View
                  style={[
                    styles.switchThumb,
                    includeExceptions && styles.switchThumbActive,
                  ]}
                />
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => rbSheetRef.current?.close()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.copyButton,
              selectedWeeks.length === 0 && styles.copyButtonDisabled,
            ]}
            onPress={handleCopy}
            disabled={selectedWeeks.length === 0}
          >
            <Ionicons name="copy-outline" size={18} color={colors.white} />
            <Text style={styles.copyButtonText}>Copy Schedule</Text>
          </TouchableOpacity>
        </View>
      </RBSheet>
    );
  }
);

CopyWeekModal.displayName = 'CopyWeekModal';

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
  sourceWeekCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  sourceWeekText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  helperText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
    lineHeight: 16,
  },
  weeksContainer: {
    gap: spacing.sm,
  },
  weekItem: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border.light,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  weekItemSelected: {
    backgroundColor: colors.accent.primary + '10',
    borderColor: colors.accent.primary,
  },
  weekItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border.default,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  weekItemText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  weekItemTextSelected: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.accent.primary,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  toggleTextContainer: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  toggleHelperText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  switch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.gray[300],
    padding: 2,
    justifyContent: 'center',
  },
  switchActive: {
    backgroundColor: colors.accent.primary,
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  switchThumbActive: {
    transform: [{ translateX: 20 }],
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
  copyButton: {
    flex: 2,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.accent.primary,
  },
  copyButtonDisabled: {
    opacity: 0.5,
  },
  copyButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});
