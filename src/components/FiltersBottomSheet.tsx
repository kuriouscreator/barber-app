import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import RBSheet from 'react-native-raw-bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { spacing, borderRadius } from '../theme/spacing';
import { typography } from '../theme/typography';
import { AppointmentFilters } from '../types';
import { FilterChips, FilterOption } from './FilterChips';

interface FiltersBottomSheetProps {
  activeTab: 'today' | 'upcoming' | 'past';
  initialFilters: AppointmentFilters;
  onApply: (filters: AppointmentFilters) => void;
  onClose: () => void;
}

export const FiltersBottomSheet = forwardRef<any, FiltersBottomSheetProps>(
  ({ activeTab, initialFilters, onApply, onClose }, ref) => {
    const rbSheetRef = useRef<any>(null);
    const [draftFilters, setDraftFilters] = useState<AppointmentFilters>(initialFilters);
    const [showCustomRange, setShowCustomRange] = useState(false);

    // Expose open and close methods
    useImperativeHandle(ref, () => ({
      open: () => {
        setDraftFilters(initialFilters);
        setShowCustomRange(false);
        rbSheetRef.current?.open();
      },
      close: () => rbSheetRef.current?.close(),
    }));

    // Update draft when initial filters change
    useEffect(() => {
      setDraftFilters(initialFilters);
    }, [initialFilters]);

    // Get default filters based on tab
    const getDefaultFilters = (): AppointmentFilters => ({
      dateRange: activeTab === 'today' ? 'today' : 'all',
      appointmentType: 'all',
      status: 'all',
    });

    // Count active filters (non-default)
    const countActiveFilters = (): number => {
      const defaults = getDefaultFilters();
      let count = 0;
      if (draftFilters.dateRange !== defaults.dateRange) count++;
      if (draftFilters.appointmentType !== 'all') count++;
      if (draftFilters.status !== 'all') count++;
      return count;
    };

    // Handle reset
    const handleReset = () => {
      setDraftFilters(getDefaultFilters());
      setShowCustomRange(false);
    };

    // Handle apply
    const handleApply = () => {
      onApply(draftFilters);
      rbSheetRef.current?.close();
    };

    // Date range options based on tab
    const getDateRangeOptions = (): FilterOption[] => {
      if (activeTab === 'today') {
        return [{ key: 'today', label: 'Today' }];
      } else if (activeTab === 'upcoming') {
        return [
          { key: 'all', label: 'All Upcoming' },
          { key: 'week', label: 'This Week' },
        ];
      } else {
        return [
          { key: 'all', label: 'All Past' },
          { key: 'last7', label: 'Last 7 days' },
          { key: 'last30', label: 'Last 30 days' },
          { key: 'last90', label: 'Last 90 days' },
        ];
      }
    };

    // Appointment type options
    const typeOptions: FilterOption[] = [
      { key: 'all', label: 'All' },
      { key: 'walk_in', label: 'Walk-ins' },
      { key: 'booking', label: 'Bookings' },
    ];

    // Status options
    const statusOptions: FilterOption[] = [
      { key: 'all', label: 'All' },
      { key: 'scheduled', label: 'Scheduled' },
      { key: 'completed', label: 'Completed' },
      { key: 'cancelled', label: 'Cancelled' },
      { key: 'no_show', label: 'No-show' },
    ];

    return (
      <RBSheet
        ref={rbSheetRef}
        height={600}
        openDuration={250}
        closeDuration={200}
        onClose={onClose}
        customStyles={{
          wrapper: {
            backgroundColor: 'rgba(0,0,0,0.5)',
          },
          container: {
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
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
          <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Filters</Text>
          <TouchableOpacity onPress={() => rbSheetRef.current?.close()} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Date Range Section */}
          {activeTab !== 'today' && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Date Range</Text>
              <FilterChips
                options={getDateRangeOptions()}
                selectedKey={draftFilters.dateRange || 'all'}
                onSelect={(key) => setDraftFilters({ ...draftFilters, dateRange: key as any })}
              />
            </View>
          )}

          {/* Appointment Type Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Appointment Type</Text>
            <FilterChips
              options={typeOptions}
              selectedKey={draftFilters.appointmentType || 'all'}
              onSelect={(key) => setDraftFilters({ ...draftFilters, appointmentType: key as any })}
            />
          </View>

          {/* Status Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Status</Text>
            <FilterChips
              options={statusOptions}
              selectedKey={draftFilters.status || 'all'}
              onSelect={(key) => setDraftFilters({ ...draftFilters, status: key as any })}
            />
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={handleReset} style={styles.clearAllButton}>
            <Text style={styles.clearAllText}>Clear all</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleApply} style={styles.applyButton}>
            <Text style={styles.applyButtonText}>
              Apply {countActiveFilters() > 0 && `(${countActiveFilters()})`}
            </Text>
          </TouchableOpacity>
        </View>
      </RBSheet>
    );
  }
);

FiltersBottomSheet.displayName = 'FiltersBottomSheet';

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  resetButton: {
    padding: spacing.xs,
  },
  resetText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  sectionLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  clearAllButton: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  clearAllText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  applyButton: {
    flex: 2,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.accent.primary,
  },
  applyButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});
