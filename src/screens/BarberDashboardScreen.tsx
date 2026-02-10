import React, { useRef, useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useBarberDashboardData } from '../hooks/useBarberDashboardData';
import { useAuth } from '../hooks/useAuth';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { cleanScheduler } from '../theme/cleanScheduler';
import { Appointment, NotificationItem, Service } from '../types';
import { AppointmentService, CreateWalkInAppointmentData } from '../services/AppointmentService';
import { ServiceService } from '../services/ServiceService';

// Import dashboard components
import TodaysAppointmentsCard from '../components/barberDashboard/TodaysAppointmentsCard';
import QueueList from '../components/barberDashboard/QueueList';
import NotificationsList from '../components/barberDashboard/NotificationsList';
import { AppointmentDetailSheet } from '../components/AppointmentDetailSheet';
import { WalkInFormBottomSheet } from '../components/WalkInFormBottomSheet';

const BarberDashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const {
    loading,
    error,
    stats,
    actions,
    queue,
    dayProgress,
    notifications,
    notificationsLoading,
    notificationsHasMore,
    notificationsLoadingMore,
    loadMoreNotifications,
    markNotificationAsRead,
    refreshData,
  } = useBarberDashboardData();

  // Bottom sheet state and refs
  const detailsSheetRef = useRef<any>(null);
  const walkInFormRef = useRef<any>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [services, setServices] = useState<Service[]>([]);

  // Load barber services on mount
  useEffect(() => {
    const loadServices = async () => {
      if (user?.id) {
        try {
          const barberServices = await ServiceService.getBarberServices(user.id);
          setServices(barberServices);
        } catch (error) {
          console.error('Error loading services:', error);
        }
      }
    };

    loadServices();
  }, [user?.id]);

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = (): string => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Navigation handlers
  const handleViewAllSchedule = () => {
    navigation.navigate('BarberAppointments');
  };

  const handleNotificationPress = async (item: NotificationItem) => {
    if (item.read_at == null && markNotificationAsRead) {
      await markNotificationAsRead(item.id);
    }
    if (item.entity_type === 'appointment' && item.entity_id) {
      await handleDetails(item.entity_id);
    } else if (item.entity_type === 'subscription' || item.entity_type === 'customer') {
      // No customer/subscription detail screen yet; just marked as read
      navigation.navigate('BarberAppointments');
    }
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

  const handleDetails = async (id: string) => {
    try {
      const appointmentWithVenue = await AppointmentService.getAppointmentWithVenue(id);
      if (appointmentWithVenue) {
        setSelectedAppointment(appointmentWithVenue);
        detailsSheetRef.current?.open();
      }
    } catch (error) {
      console.error('Error loading appointment details:', error);
      Alert.alert('Error', 'Failed to load appointment details');
    }
  };

  const handleCloseDetailsSheet = () => {
    detailsSheetRef.current?.close();
    setSelectedAppointment(null);
  };

  const handleStatusUpdated = async () => {
    console.log('🔄 Dashboard: Status updated, refreshing data...');
    if (refreshData) {
      await refreshData();
    }
  };

  // Walk-in handlers
  const handleAddWalkIn = () => {
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to add walk-ins');
      return;
    }

    if (services.length === 0) {
      Alert.alert('No Services', 'Please add services before creating walk-in appointments');
      return;
    }

    walkInFormRef.current?.open();
  };

  const handleSaveWalkIn = async (walkInData: CreateWalkInAppointmentData) => {
    try {
      await AppointmentService.createWalkInAppointment(walkInData);
      Alert.alert('Success', 'Walk-in appointment created successfully');

      // Refresh dashboard data to show new walk-in
      if (refreshData) {
        await refreshData();
      }
    } catch (error: any) {
      console.error('Error creating walk-in:', error);
      throw error; // Let the form handle the error display
    }
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
        {/* Today's Appointments */}
        <TodaysAppointmentsCard
          stats={stats}
          dayProgress={dayProgress}
          onViewAll={handleViewAllSchedule}
          onAddWalkIn={handleAddWalkIn}
        />

        {/* Current Queue */}
        <QueueList
          items={queue}
          onPause={handlePause}
          onComplete={handleComplete}
          onReschedule={handleReschedule}
          onStartEarly={handleStartEarly}
          onDetails={handleDetails}
        />

        {/* Notifications */}
        <NotificationsList
          items={notifications}
          onPress={handleNotificationPress}
          loading={notificationsLoading}
          hasMore={notificationsHasMore}
          loadingMore={notificationsLoadingMore}
          onLoadMore={loadMoreNotifications}
        />
			</ScrollView>

      {/* Appointment Detail Bottom Sheet */}
      <AppointmentDetailSheet
        ref={detailsSheetRef}
        appointment={selectedAppointment}
        userRole="barber"
        onClose={handleCloseDetailsSheet}
        onStatusUpdated={handleStatusUpdated}
      />

      {/* Walk-In Form Bottom Sheet */}
      {user?.id && (
        <WalkInFormBottomSheet
          ref={walkInFormRef}
          barberId={user.id}
          date={getTodayDate()}
          services={services}
          onSave={handleSaveWalkIn}
        />
      )}
		</SafeAreaView>
  );
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: cleanScheduler.background,
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		paddingHorizontal: cleanScheduler.padding,
		paddingTop: cleanScheduler.sectionSpacing,
		paddingBottom: spacing.xl,
	},
});

export default BarberDashboardScreen;
