import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import RBSheet from 'react-native-raw-bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { spacing, borderRadius } from '../theme/spacing';
import { typography } from '../theme/typography';

type SortOption = 'soonest' | 'latest' | 'newest' | 'oldest';

interface SortBottomSheetProps {
  activeTab: 'today' | 'upcoming' | 'past';
  initialSort: SortOption;
  onApply: (sort: SortOption) => void;
  onClose: () => void;
}

export const SortBottomSheet = forwardRef<any, SortBottomSheetProps>(
  ({ activeTab, initialSort, onApply, onClose }, ref) => {
    const rbSheetRef = useRef<any>(null);
    const [draftSort, setDraftSort] = useState<SortOption>(initialSort);

    // Expose open and close methods
    useImperativeHandle(ref, () => ({
      open: () => {
        setDraftSort(initialSort);
        rbSheetRef.current?.open();
      },
      close: () => rbSheetRef.current?.close(),
    }));

    // Update draft when initial sort changes
    useEffect(() => {
      setDraftSort(initialSort);
    }, [initialSort]);

    // Handle apply
    const handleApply = () => {
      onApply(draftSort);
      rbSheetRef.current?.close();
    };

    // Get sort options based on tab
    const getSortOptions = (): Array<{ key: SortOption; label: string; description: string }> => {
      if (activeTab === 'past') {
        return [
          { key: 'newest', label: 'Newest first', description: 'Most recent appointments first' },
          { key: 'oldest', label: 'Oldest first', description: 'Oldest appointments first' },
        ];
      } else {
        // For 'today' and 'upcoming'
        return [
          { key: 'soonest', label: 'Soonest first', description: 'Earliest times first' },
          { key: 'latest', label: 'Latest first', description: 'Latest times first' },
        ];
      }
    };

    const sortOptions = getSortOptions();

    return (
      <RBSheet
        ref={rbSheetRef}
        height={350}
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
          <View style={styles.headerSpacer} />
          <Text style={styles.title}>Sort</Text>
          <TouchableOpacity onPress={() => rbSheetRef.current?.close()} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {sortOptions.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={styles.radioItem}
              onPress={() => setDraftSort(option.key)}
              activeOpacity={0.7}
            >
              <View style={styles.radioContent}>
                <View style={styles.radioTextContainer}>
                  <Text style={styles.radioLabel}>{option.label}</Text>
                  <Text style={styles.radioDescription}>{option.description}</Text>
                </View>
                <Ionicons
                  name={draftSort === option.key ? 'radio-button-on' : 'radio-button-off'}
                  size={24}
                  color={draftSort === option.key ? colors.accent.primary : colors.text.tertiary}
                />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={handleApply} style={styles.applyButton}>
            <Text style={styles.applyButtonText}>Apply</Text>
          </TouchableOpacity>
        </View>
      </RBSheet>
    );
  }
);

SortBottomSheet.displayName = 'SortBottomSheet';

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
  headerSpacer: {
    width: 40, // Same width as close button for centering
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
  radioItem: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  radioContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  radioTextContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  radioLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  radioDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  applyButton: {
    width: '100%',
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
