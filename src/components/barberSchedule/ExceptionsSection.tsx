import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { borderRadius } from '../../theme/index';
import { ExceptionItem } from '../../types';

interface ExceptionsSectionProps {
  items: ExceptionItem[];
  onAddException: () => void;
  onEditException: (id: string) => void;
  onDeleteException: (id: string) => void;
}

interface ExceptionRowProps {
  icon: 'holiday'|'clock';
  title: string;
  dateLabel: string;
  description: string;
  onMore: () => void;
}

const ExceptionRow: React.FC<ExceptionRowProps> = ({
  icon,
  title,
  dateLabel,
  description,
  onMore,
}) => {
  const getIconName = (iconType: string) => {
    return iconType === 'holiday' ? 'calendar' : 'time';
  };

  const getIconColor = (iconType: string) => {
    return iconType === 'holiday' ? '#F59E0B' : '#3B82F6';
  };

  return (
    <View style={styles.exceptionRow}>
      <View style={[styles.iconBadge, { backgroundColor: getIconColor(icon) }]}>
        <Ionicons name={getIconName(icon)} size={20} color={colors.white} />
      </View>
      
      <View style={styles.exceptionContent}>
        <Text style={styles.exceptionTitle}>{title}</Text>
        <Text style={styles.exceptionDate}>{dateLabel}</Text>
        <Text style={styles.exceptionDescription}>{description}</Text>
      </View>
      
      <TouchableOpacity onPress={onMore} style={styles.moreButton}>
        <Ionicons name="ellipsis-vertical" size={20} color={colors.text.secondary} />
      </TouchableOpacity>
    </View>
  );
};

const ExceptionsSection: React.FC<ExceptionsSectionProps> = ({
  items,
  onAddException,
  onEditException,
  onDeleteException,
}) => {
  const renderExceptionRow = ({ item }: { item: ExceptionItem }) => (
    <ExceptionRow
      icon={item.icon}
      title={item.title}
      dateLabel={item.dateLabel}
      description={item.description}
      onMore={() => {
        Alert.alert(
          item.title,
          'Choose an action',
          [
            {
              text: 'Edit',
              onPress: () => onEditException(item.id),
            },
            {
              text: 'Delete',
              onPress: () => {
                Alert.alert(
                  'Delete Exception',
                  'Are you sure you want to delete this exception?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () => onDeleteException(item.id),
                    },
                  ]
                );
              },
              style: 'destructive',
            },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
      }}
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Exceptions & Holidays</Text>
        <TouchableOpacity onPress={onAddException}>
          <Text style={styles.addButton}>+ Add Exception</Text>
        </TouchableOpacity>
      </View>
      
      {items.length > 0 ? (
        <View style={styles.exceptionsContainer}>
          <FlatList
            data={items}
            renderItem={renderExceptionRow}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No exceptions scheduled</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderColor: colors.border.light,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    marginHorizontal: 0, // Remove margin since parent now handles horizontal spacing
    marginVertical: spacing.md,
    shadowColor: '#0000000D',
    shadowOpacity: 0.1,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  addButton: {
    fontSize: typography.fontSize.sm,
    color: colors.accent.primary,
    fontWeight: typography.fontWeight.medium,
  },
  exceptionsContainer: {
    padding: spacing.lg,
  },
  exceptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  exceptionContent: {
    flex: 1,
  },
  exceptionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  exceptionDate: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  exceptionDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  moreButton: {
    padding: spacing.sm,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border.light,
    marginVertical: spacing.sm,
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
});

export default ExceptionsSection;
