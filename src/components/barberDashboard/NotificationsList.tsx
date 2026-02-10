import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { cleanScheduler } from '../../theme/cleanScheduler';
import { NotificationItem } from '../../types';

interface NotificationsListProps {
  items: NotificationItem[];
  onPress: (item: NotificationItem) => void;
  loading?: boolean;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}

const NotificationsList: React.FC<NotificationsListProps> = ({
  items,
  onPress,
  loading = false,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
}) => {
  const getIcon = (type?: string) => {
    switch (type) {
      case 'info':
        return 'calendar';
      case 'warning':
        return 'warning';
      case 'review':
        return 'star';
      default:
        return 'information-circle';
    }
  };

  const isUnread = (item: NotificationItem) => item.read_at == null;

  const renderNotificationItem = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity
      style={[styles.row, isUnread(item) && styles.rowUnread]}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}: ${item.subtitle}`}
    >
      <View style={styles.iconContainer}>
        <Ionicons
          name={getIcon(item.type) as any}
          size={20}
          color={cleanScheduler.text.heading}
        />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, isUnread(item) && styles.titleUnread]}>{item.title}</Text>
        <Text style={styles.subtitle} numberOfLines={1}>{item.subtitle}</Text>
      </View>
      <View style={styles.ctaBlock}>
        {item.ctaLabel && (
          <Text style={styles.ctaText}>{item.ctaLabel}</Text>
        )}
        <Ionicons name="chevron-forward" size={18} color={cleanScheduler.text.subtext} />
      </View>
    </TouchableOpacity>
  );

  const ListSeparator = () => <View style={styles.rowDivider} />;

  const cardContent = loading ? (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>Loading…</Text>
    </View>
  ) : items.length === 0 ? (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>No notifications yet</Text>
    </View>
  ) : (
    <>
      <FlatList
        data={items}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={ListSeparator}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
        contentContainerStyle={styles.listContent}
      />
      {hasMore && onLoadMore && (
        <TouchableOpacity
          style={styles.loadMoreButton}
          onPress={onLoadMore}
          disabled={loadingMore}
          activeOpacity={0.7}
        >
          <Text style={styles.loadMoreText}>
            {loadingMore ? 'Loading…' : 'Load more'}
          </Text>
        </TouchableOpacity>
      )}
    </>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Notifications</Text>
      <View style={styles.card}>{cardContent}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: cleanScheduler.sectionSpacing,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: cleanScheduler.text.heading,
    marginBottom: spacing.md,
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: cleanScheduler.padding,
    minHeight: 44,
  },
  rowUnread: {
    backgroundColor: 'rgba(46, 204, 113, 0.04)',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: cleanScheduler.secondary.bg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: cleanScheduler.text.heading,
    marginBottom: spacing.xs,
  },
  titleUnread: {
    fontWeight: typography.fontWeight.bold,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: cleanScheduler.text.subtext,
  },
  ctaBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ctaText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: cleanScheduler.text.heading,
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
  loadMoreButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: cleanScheduler.padding,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: cleanScheduler.card.border,
  },
  loadMoreText: {
    fontSize: typography.fontSize.sm,
    color: cleanScheduler.text.subtext,
    fontWeight: typography.fontWeight.medium,
  },
});

export default NotificationsList;
