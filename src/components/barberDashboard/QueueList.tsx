import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { cleanScheduler } from '../../theme/cleanScheduler';
import { QueueItem } from '../../types';
import { AppointmentTypeBadge } from '../AppointmentTypeBadge';

interface QueueListProps {
  items: QueueItem[];
  onPause: (id: string) => void;
  onComplete: (id: string) => void;
  onReschedule: (id: string) => void;
  onStartEarly: (id: string) => void;
  onDetails: (id: string) => void;
}

const QueueList: React.FC<QueueListProps> = ({
  items,
  onPause,
  onComplete,
  onReschedule,
  onStartEarly,
  onDetails,
}) => {
  const getStatusColor = (state: QueueItem['state']) => {
    switch (state) {
      case 'IN_PROGRESS':
        return cleanScheduler.status.available;
      case 'NEXT_UP':
        return cleanScheduler.status.warning;
      case 'SCHEDULED':
        return cleanScheduler.text.body;
      default:
        return cleanScheduler.text.body;
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
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() => onPause(item.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.secondaryButtonText}>Pause</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={() => onComplete(item.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.primaryButtonText}>Complete</Text>
            </TouchableOpacity>
          </View>
        );
      case 'NEXT_UP':
        return (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() => onReschedule(item.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.secondaryButtonText}>Reschedule</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={() => onStartEarly(item.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.primaryButtonText}>Start Early</Text>
            </TouchableOpacity>
          </View>
        );
      case 'SCHEDULED':
        return (
          <TouchableOpacity
            style={styles.viewDetailsButton}
            onPress={() => onDetails(item.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.viewDetailsButtonText}>View Details</Text>
          </TouchableOpacity>
        );
      default:
        return null;
    }
  };

  const ListSeparator = () => <View style={styles.rowDivider} />;

  const renderQueueItem = ({ item }: { item: QueueItem }) => (
    <View style={[styles.queueRow, item.state === 'IN_PROGRESS' && styles.inProgressRow]}>
      <View style={styles.clientInfo}>
        <Image
          source={{ uri: item.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face' }}
          style={styles.avatar}
        />
        <View style={styles.clientDetails}>
          <View style={styles.nameRow}>
            <Text style={styles.clientName}>{item.clientName}</Text>
            {item.appointmentType && (
              <AppointmentTypeBadge type={item.appointmentType} size="small" />
            )}
          </View>
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

  const cardContent =
    items.length === 0 ? (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>No clients in queue</Text>
      </View>
    ) : (
      <FlatList
        data={items}
        renderItem={renderQueueItem}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={ListSeparator}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
        contentContainerStyle={styles.listContent}
      />
    );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Current Queue</Text>
        <View style={styles.onTimeIndicator}>
          <View style={styles.onTimeDot} />
          <Text style={styles.onTimeText}>On Time</Text>
        </View>
      </View>
      <View style={styles.card}>{cardContent}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: cleanScheduler.sectionSpacing,
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
    color: cleanScheduler.text.heading,
  },
  onTimeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onTimeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: cleanScheduler.status.available,
  },
  onTimeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: cleanScheduler.status.available,
  },
  card: {
    backgroundColor: cleanScheduler.card.bg,
    borderRadius: cleanScheduler.card.radius,
    borderWidth: 1,
    borderColor: cleanScheduler.card.border,
    overflow: 'hidden',
  },
  listContent: {
    paddingVertical: spacing.xs,
  },
  rowDivider: {
    height: 1,
    backgroundColor: cleanScheduler.card.border,
    marginHorizontal: cleanScheduler.padding,
  },
  queueRow: {
    padding: cleanScheduler.padding,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44,
  },
  inProgressRow: {
    borderLeftWidth: 4,
    borderLeftColor: cleanScheduler.status.available,
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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  clientName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: cleanScheduler.text.heading,
  },
  serviceName: {
    fontSize: typography.fontSize.sm,
    color: cleanScheduler.text.body,
    marginBottom: spacing.xs,
  },
  estimateLabel: {
    fontSize: typography.fontSize.xs,
    color: cleanScheduler.text.subtext,
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
    color: cleanScheduler.text.subtext,
    marginBottom: spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  actionButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 60,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: cleanScheduler.primary,
  },
  primaryButtonText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  secondaryButton: {
    backgroundColor: cleanScheduler.secondary.bg,
    borderWidth: 1,
    borderColor: cleanScheduler.card.border,
  },
  secondaryButtonText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: cleanScheduler.secondary.text,
  },
  emptyState: {
    paddingVertical: 24,
    paddingHorizontal: cleanScheduler.padding,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: typography.fontSize.base,
    color: cleanScheduler.text.subtext,
  },
  viewDetailsButton: {
    backgroundColor: cleanScheduler.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
    minHeight: 36,
  },
  viewDetailsButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
});

export default QueueList;
