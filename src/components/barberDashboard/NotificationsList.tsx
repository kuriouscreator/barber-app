import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius, shadows } from '../../theme/spacing';
import { NotificationItem } from '../../types';

interface NotificationsListProps {
  items: NotificationItem[];
  onPress: (item: NotificationItem) => void;
}

const NotificationsList: React.FC<NotificationsListProps> = ({ items, onPress }) => {
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

  const getIconColor = (type?: string) => {
    switch (type) {
      case 'info':
        return colors.accent.primary;
      case 'warning':
        return colors.text.secondary;
      case 'review':
        return colors.text.secondary;
      default:
        return colors.text.secondary;
    }
  };

  const getCtaColor = (ctaLabel?: string) => {
    switch (ctaLabel) {
      case 'View':
      case 'Read':
        return colors.accent.primary;
      case 'Fix':
        return colors.text.secondary;
      default:
        return colors.accent.primary;
    }
  };

  const renderNotificationItem = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity
      style={styles.notificationCard}
      onPress={() => onPress(item)}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}: ${item.subtitle}`}
    >
      <View style={styles.iconContainer}>
        <Ionicons 
          name={getIcon(item.type) as any} 
          size={20} 
          color={getIconColor(item.type)} 
        />
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>
      </View>
      
      {item.ctaLabel && (
        <Text style={[styles.ctaText, { color: getCtaColor(item.ctaLabel) }]}>
          {item.ctaLabel}
        </Text>
      )}
    </TouchableOpacity>
  );

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>All caught up</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Notifications</Text>
      <FlatList
        data={items}
        renderItem={renderNotificationItem}
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
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  notificationCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  ctaText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
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

export default NotificationsList;
