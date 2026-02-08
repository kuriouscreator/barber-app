import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { UserActivity } from '../services/ActivityLogger';

interface ActivityCardProps {
  activity: UserActivity;
}

const ActivityCard: React.FC<ActivityCardProps> = ({ activity }) => {
  // Get icon color based on icon type
  const getIconColor = (iconType: string): string => {
    const iconColors: Record<string, string> = {
      'checkmark-circle': colors.accent.success,
      'gift': colors.gray[700],
      'calendar': colors.gray[700],
      'sparkles': colors.orange[600],
      'trending-up': colors.gray[800],
      'people': colors.accent.success,
      'close-circle': colors.red[500],
      'alert-circle': colors.red[500],
      'card': colors.accent.success,
      'time': colors.gray[500],
    };
    return iconColors[iconType] || colors.gray[600];
  };

  // Get background color for icon circle
  const getIconBackground = (iconType: string): string => {
    const backgrounds: Record<string, string> = {
      'checkmark-circle': '#E8F5E9', // Light green
      'gift': colors.gray[100], // Light gray
      'calendar': colors.gray[100], // Light gray
      'sparkles': '#FFF3E0', // Light orange
      'trending-up': colors.gray[200], // Light gray
      'people': '#E8F5E9', // Light green
      'close-circle': '#FFEBEE', // Light red
      'alert-circle': '#FFEBEE', // Light red
      'card': '#E8F5E9', // Light green
      'time': '#F5F5F5', // Light gray
    };
    return backgrounds[iconType] || '#F5F5F5';
  };

  // Get badge background color
  const getBadgeBackground = (badgeColor?: string): string => {
    const backgrounds: Record<string, string> = {
      purple: colors.gray[200],
      blue: colors.gray[200],
      orange: '#FFF3E0',
      green: '#E8F5E9',
      red: '#FFEBEE',
      gray: '#F5F5F5',
    };
    return backgrounds[badgeColor || 'gray'] || '#F5F5F5';
  };

  // Get badge text color
  const getBadgeTextColor = (badgeColor?: string): string => {
    const textColors: Record<string, string> = {
      purple: colors.gray[800],
      blue: colors.gray[800],
      orange: '#FF9800',
      green: '#4CAF50',
      red: '#F44336',
      gray: '#757575',
    };
    return textColors[badgeColor || 'gray'] || '#757575';
  };

  // Format activity date
  const formatActivityDate = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();

    // Check if today
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    // Check if yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    if (isToday) {
      return `Today at ${timeStr}`;
    } else if (isYesterday) {
      return `Yesterday at ${timeStr}`;
    } else {
      const dateStr = date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
      return `${dateStr} • ${timeStr}`;
    }
  };

  return (
    <View style={styles.card}>
      {/* Icon Circle */}
      <View
        style={[
          styles.iconCircle,
          { backgroundColor: getIconBackground(activity.icon_type) },
        ]}
      >
        <Ionicons
          name={activity.icon_type as any}
          size={24}
          color={getIconColor(activity.icon_type)}
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Header with title and badge */}
        <View style={styles.header}>
          <Text style={styles.title}>{activity.title}</Text>
          {activity.badge_text && (
            <View
              style={[
                styles.badge,
                { backgroundColor: getBadgeBackground(activity.badge_color) },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: getBadgeTextColor(activity.badge_color) },
                ]}
              >
                {activity.badge_text}
              </Text>
            </View>
          )}
        </View>

        {/* Description */}
        <Text style={styles.description}>{activity.description}</Text>

        {/* Timestamp */}
        <Text style={styles.timestamp}>{formatActivityDate(activity.created_at)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 16,
    padding: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },

  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },

  content: {
    flex: 1,
    gap: 4,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },

  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
  },

  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginLeft: 8,
  },

  badgeText: {
    fontSize: 13,
    fontWeight: '500',
  },

  description: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },

  timestamp: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 2,
  },
});

export default ActivityCard;
