import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../theme/colors';
import { useAuth } from '../hooks/useAuth';
import ActivityLogger, { UserActivity } from '../services/ActivityLogger';
import ActivityCard from '../components/ActivityCard';

const ActivityScreen: React.FC = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadActivities();
    }
  }, [user?.id]);

  const loadActivities = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const result = await ActivityLogger.getAllActivities(user.id, 50, 0);
      setActivities(result.activities);
      setTotal(result.total);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadActivities();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.gray[700]} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Activity</Text>
          {total > 0 && (
            <Text style={styles.headerSubtitle}>
              {total} {total === 1 ? 'activity' : 'activities'}
            </Text>
          )}
        </View>

        {/* Activities List */}
        <View style={styles.content}>
          {activities.length > 0 ? (
            <>
              {activities.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No activity yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Your activity will appear here as you use the app
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },

  scrollView: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },

  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 4,
  },

  headerSubtitle: {
    fontSize: 16,
    color: colors.text.secondary,
  },

  content: {
    padding: 20,
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },

  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },

  emptyStateSubtext: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ActivityScreen;
