import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Alert } from 'react-native';
import { useBarberDashboardData } from '../hooks/useBarberDashboardData';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

// Import dashboard components
import TodaysScheduleCard from '../components/barberDashboard/TodaysScheduleCard';
import QuickActionsGrid from '../components/barberDashboard/QuickActionsGrid';
import QueueList from '../components/barberDashboard/QueueList';
import TodaysProgress from '../components/barberDashboard/TodaysProgress';
import NotificationsList from '../components/barberDashboard/NotificationsList';
import SubscriptionInsightsCard from '../components/barberDashboard/SubscriptionInsightsCard';
import QuickSettingsPanel from '../components/barberDashboard/QuickSettingsPanel';

const BarberDashboardScreen: React.FC = () => {
  const {
    loading,
    error,
    stats,
    actions,
    queue,
    dayProgress,
    monthlyProgress,
    notifications,
    insights,
    quickSettings,
    updateQuickSetting,
  } = useBarberDashboardData();

  // Navigation handlers
  const handleViewAllSchedule = () => {
    console.log('Navigate to full schedule');
    // TODO: Navigate to schedule screen
  };

  const handleNotificationPress = (item: any) => {
    console.log('Notification pressed:', item);
    // TODO: Navigate to appropriate screen based on notification type
  };

  // Queue action handlers
  const handlePause = (id: string) => {
    Alert.alert('Pause Appointment', 'Are you sure you want to pause this appointment?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Pause', onPress: () => console.log('Pause appointment:', id) },
    ]);
  };

  const handleComplete = (id: string) => {
    Alert.alert('Complete Appointment', 'Mark this appointment as completed?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Complete', onPress: () => console.log('Complete appointment:', id) },
    ]);
  };

  const handleReschedule = (id: string) => {
    console.log('Reschedule appointment:', id);
    // TODO: Navigate to reschedule screen
  };

  const handleStartEarly = (id: string) => {
    console.log('Start early:', id);
    // TODO: Start appointment early
  };

  const handleEdit = (id: string) => {
    console.log('Edit appointment:', id);
    // TODO: Navigate to edit appointment screen
  };

  const handleDetails = (id: string) => {
    console.log('View details:', id);
    // TODO: Navigate to appointment details screen
  };

  if (loading) {
    // TODO: Add loading component
    return null;
  }

  if (error) {
    // TODO: Add error component
    return null;
  }

	return (
		<SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Today's Schedule */}
        <TodaysScheduleCard 
          stats={stats} 
          onViewAll={handleViewAllSchedule} 
        />

        {/* Quick Actions */}
        <QuickActionsGrid actions={actions} />

        {/* Current Queue */}
        <QueueList
          items={queue}
          onPause={handlePause}
          onComplete={handleComplete}
          onReschedule={handleReschedule}
          onStartEarly={handleStartEarly}
          onEdit={handleEdit}
          onDetails={handleDetails}
        />

        {/* Today's Progress */}
        <TodaysProgress
          completed={dayProgress}
          remaining={dayProgress}
          monthly={monthlyProgress}
        />

        {/* Notifications */}
        <NotificationsList
          items={notifications}
          onPress={handleNotificationPress}
        />

        {/* Subscription Insights */}
        <SubscriptionInsightsCard insights={insights} />

        {/* Quick Settings */}
        <QuickSettingsPanel
          settings={quickSettings}
          onToggle={updateQuickSetting}
        />
			</ScrollView>
		</SafeAreaView>
  );
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
    backgroundColor: colors.background.primary,
	},
	scrollView: {
		flex: 1,
	},
  scrollContent: {
    paddingBottom: spacing.xl,
	},
});

export default BarberDashboardScreen;
