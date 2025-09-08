import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius, shadows } from '../../theme/spacing';
import { QueueItem } from '../../types';

interface QueueListProps {
  items: QueueItem[];
  onPause: (id: string) => void;
  onComplete: (id: string) => void;
  onReschedule: (id: string) => void;
  onStartEarly: (id: string) => void;
  onEdit: (id: string) => void;
  onDetails: (id: string) => void;
}

const QueueList: React.FC<QueueListProps> = ({
  items,
  onPause,
  onComplete,
  onReschedule,
  onStartEarly,
  onEdit,
  onDetails,
}) => {
  const getStatusColor = (state: QueueItem['state']) => {
    switch (state) {
      case 'IN_PROGRESS':
        return colors.accent.success;
      case 'NEXT_UP':
        return colors.accent.warning;
      case 'SCHEDULED':
        return colors.text.secondary;
      default:
        return colors.text.secondary;
    }
  };

  const getStatusText = (state: QueueItem['state']) => {
    switch (state) {
      case 'IN_PROGRESS':
        return 'IN PROGRESS';
      case 'NEXT_UP':
        return 'NEXT UP';
      case 'SCHEDULED':
        return 'SCHEDULED';
      default:
        return 'SCHEDULED';
    }
  };

  const renderActionButtons = (item: QueueItem) => {
    switch (item.state) {
      case 'IN_PROGRESS':
        return (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.pauseButton]}
              onPress={() => onPause(item.id)}
            >
              <Text style={styles.pauseButtonText}>Pause</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.completeButton]}
              onPress={() => onComplete(item.id)}
            >
              <Text style={styles.completeButtonText}>Complete</Text>
            </TouchableOpacity>
          </View>
        );
      case 'NEXT_UP':
        return (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() => onReschedule(item.id)}
            >
              <Text style={styles.secondaryButtonText}>Reschedule</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={() => onStartEarly(item.id)}
            >
              <Text style={styles.primaryButtonText}>Start Early</Text>
            </TouchableOpacity>
          </View>
        );
      case 'SCHEDULED':
        return (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() => onEdit(item.id)}
            >
              <Text style={styles.secondaryButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() => onDetails(item.id)}
            >
              <Text style={styles.secondaryButtonText}>Details</Text>
            </TouchableOpacity>
          </View>
        );
      default:
        return null;
    }
  };

  const renderQueueItem = ({ item }: { item: QueueItem }) => (
    <View style={[
      styles.queueCard,
      item.state === 'IN_PROGRESS' && styles.inProgressCard
    ]}>
      <View style={styles.clientInfo}>
        <Image
          source={{ uri: item.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face' }}
          style={styles.avatar}
        />
        <View style={styles.clientDetails}>
          <Text style={styles.clientName}>{item.clientName}</Text>
          <Text style={styles.serviceName}>
            {item.serviceName}
            {item.subService && ` + ${item.subService}`}
          </Text>
          <Text style={styles.estimateLabel}>{item.estimateLabel}</Text>
        </View>
      </View>
      
      <View style={styles.statusSection}>
        <Text style={[styles.statusText, { color: getStatusColor(item.state) }]}>
          {getStatusText(item.state)}
        </Text>
        <Text style={styles.timeLabel}>
          {item.startTimeLabel || item.nextTimeLabel}
        </Text>
        {renderActionButtons(item)}
      </View>
    </View>
  );

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.sectionTitle}>Current Queue</Text>
          <View style={styles.statusChip}>
            <Text style={styles.statusChipText}>On Time</Text>
          </View>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No clients in queue</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Current Queue</Text>
        <View style={styles.statusChip}>
          <Text style={styles.statusChipText}>On Time</Text>
        </View>
      </View>
      <FlatList
        data={items}
        renderItem={renderQueueItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  statusChip: {
    backgroundColor: colors.accent.success,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  statusChipText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.white,
  },
  queueCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadows.sm,
  },
  inProgressCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.accent.success,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: spacing.sm,
  },
  clientDetails: {
    flex: 1,
  },
  clientName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  serviceName: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  estimateLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  statusSection: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  timeLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  actionButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    minWidth: 60,
    alignItems: 'center',
  },
  pauseButton: {
    backgroundColor: colors.accent.warning,
  },
  pauseButtonText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  completeButton: {
    backgroundColor: colors.accent.success,
  },
  completeButtonText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.white,
  },
  primaryButton: {
    backgroundColor: colors.accent.primary,
  },
  primaryButtonText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.white,
  },
  secondaryButton: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  secondaryButtonText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  emptyState: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
});

export default QueueList;
