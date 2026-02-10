import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { spacing, borderRadius } from '../theme/spacing';
import { typography } from '../theme/typography';
import { cleanScheduler } from '../theme/cleanScheduler';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  debounceMs?: number;
  onFilterPress?: () => void;
  filterCount?: number;
  variant?: 'default' | 'cleanScheduler';
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search...',
  value,
  onChangeText,
  debounceMs = 300,
  onFilterPress,
  filterCount = 0,
  variant = 'default',
}) => {
  const isClean = variant === 'cleanScheduler';
  const [localValue, setLocalValue] = useState(value);

  // Debounce the search
  useEffect(() => {
    const timer = setTimeout(() => {
      onChangeText(localValue);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, debounceMs]);

  // Sync with external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleClear = () => {
    setLocalValue('');
    onChangeText('');
  };

  return (
    <View style={[styles.container, isClean && styles.containerClean]}>
      <Ionicons
        name="search"
        size={20}
        color={isClean ? cleanScheduler.text.subtext : colors.text.secondary}
        style={styles.searchIcon}
      />
      <TextInput
        style={[styles.input, isClean && styles.inputClean]}
        placeholder={placeholder}
        placeholderTextColor={isClean ? cleanScheduler.text.subtext : colors.text.tertiary}
        value={localValue}
        onChangeText={setLocalValue}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="never"
      />
      {onFilterPress && (
        <TouchableOpacity onPress={onFilterPress} style={styles.filterButton}>
          <Ionicons name="funnel-outline" size={20} color={isClean ? cleanScheduler.text.heading : colors.text.primary} />
          {filterCount > 0 && (
            <View style={[styles.filterBadge, isClean && styles.filterBadgeClean]}>
              <Text style={styles.filterBadgeText}>{filterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      )}
      {localValue.length > 0 && (
        <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
          <Ionicons name="close-circle" size={20} color={isClean ? cleanScheduler.text.subtext : colors.text.secondary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
  },
  containerClean: {
    backgroundColor: cleanScheduler.card.bg,
    borderRadius: cleanScheduler.input.radius,
    borderWidth: 1,
    borderColor: cleanScheduler.input.border,
    paddingHorizontal: cleanScheduler.padding,
    marginHorizontal: 0,
    marginVertical: 0,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    paddingVertical: 0,
  },
  inputClean: {
    color: cleanScheduler.text.heading,
  },
  filterButton: {
    marginLeft: spacing.sm,
    padding: spacing.xs,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: cleanScheduler.primary,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeClean: {},
  filterBadgeText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  clearButton: {
    marginLeft: spacing.sm,
    padding: spacing.xs,
  },
});
