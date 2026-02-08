import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { useAuth } from '../hooks/useAuth';
import ActivityLogger, { UserActivity } from '../services/ActivityLogger';
import ActivityCard from './ActivityCard';

interface RecentActivityWidgetProps {
  maxItems?: number;
  showViewAll?: boolean;
}

const RecentActivityWidget: React.FC<RecentActivityWidgetProps> = ({
  maxItems = 5,
  showViewAll = true,
}) => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadActivities();
    }
  }, [user?.id]);

  const loadActivities = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const recentActivities = await ActivityLogger.getRecentActivities(user.id, maxItems);
      setActivities(recentActivities);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewAll = () => {
    navigation.navigate('Activity' as never);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Recent Activity</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.gray[700]} />
        </View>
      </View>
    );
  }

  if (activities.length === 0) {
    return null; // Don't show widget if no activities
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Recent Activity</Text>
        {showViewAll && (
          <TouchableOpacity onPress={handleViewAll} activeOpacity={0.7}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Activity List */}
      <View style={styles.activityList}>
        {activities.map((activity) => (
          <ActivityCard key={activity.id} activity={activity} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },

  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },

  viewAllText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[800],
  },

  activityList: {
    gap: 0, // Gap handled by ActivityCard marginBottom
  },

  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
});

export default RecentActivityWidget;
