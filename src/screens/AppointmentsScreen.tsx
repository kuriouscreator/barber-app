import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  FlatList,
} from 'react-native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { MainTabParamList, RootStackParamList, Appointment } from '../types';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { cleanScheduler } from '../theme/cleanScheduler';
import { BUSINESS_INFO } from '../constants/business';
import { useApp } from '../context/AppContext';
import { AppointmentService } from '../services/AppointmentService';
import { EmptyState } from '../components/EmptyState';
import { CustomerAppointmentListItem } from '../components/CustomerAppointmentListItem';
import { AppointmentDetailSheet } from '../components/AppointmentDetailSheet';
import ReviewModal from '../components/ReviewModal';
import { haptics } from '../utils/haptics';

type AppointmentsScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Appointments'> & StackNavigationProp<RootStackParamList>;
type AppointmentsScreenRouteProp = RouteProp<MainTabParamList, 'Appointments'>;

interface Props {
  navigation: AppointmentsScreenNavigationProp;
  route: AppointmentsScreenRouteProp;
}

const AppointmentsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { state, cancelAppointment } = useApp();
  const { user, appointments } = state;
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'canceled'>('upcoming');
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedAppointmentForReview, setSelectedAppointmentForReview] = useState<any>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [detailsAppointment, setDetailsAppointment] = useState<Appointment | null>(null);
  const bottomSheetRef = useRef<any>(null);
  const detailsSheetRef = useRef<any>(null);

  // Update selectedAppointment when appointments array changes
  useEffect(() => {
    if (selectedAppointment) {
      const updatedAppointment = appointments.find(apt => apt.id === selectedAppointment.id);
      if (updatedAppointment && JSON.stringify(updatedAppointment) !== JSON.stringify(selectedAppointment)) {
        console.log('📱 AppointmentsScreen: Updating selected appointment with new data');
        console.log('📅 AppointmentsScreen: Old date:', selectedAppointment.appointmentDate);
        console.log('📅 AppointmentsScreen: New date:', updatedAppointment.appointmentDate);
        setSelectedAppointment(updatedAppointment);
      }
    }
  }, [appointments]);

  // Auto-open bottom sheet when navigated with appointmentId
  useEffect(() => {
    const appointmentId = route.params?.appointmentId;
    if (appointmentId) {
      // Wait a bit for the screen to render
      setTimeout(() => {
        handleAppointmentPress(appointmentId);
      }, 300);

      // Clear the param after opening to prevent re-opening on re-render
      navigation.setParams({ appointmentId: undefined });
    }
  }, [route.params?.appointmentId]);

  // Filter appointments from AppContext
  const upcomingAppointments = appointments.filter(apt => {
    const appointmentDate = apt.appointmentDate || apt.date;
    const appointmentTime = apt.appointmentTime || apt.time;

    if (!appointmentDate || !appointmentTime || apt.status !== 'scheduled') {
      return false;
    }

    // Combine date and time for proper comparison
    const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
    const now = new Date();

    return appointmentDateTime >= now;
  });

  const pastAppointments = appointments.filter(apt => {
    // Completed or no-show are always considered past
    if (apt.status === 'completed' || apt.status === 'no_show') {
      return true;
    }

    const appointmentDate = apt.appointmentDate || apt.date;
    const appointmentTime = apt.appointmentTime || apt.time;

    if (!appointmentDate || !appointmentTime || apt.status !== 'scheduled') {
      return false;
    }

    // Combine date and time for proper comparison
    const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
    const now = new Date();

    return appointmentDateTime < now;
  });

  const canceledAppointments = appointments.filter(apt => {
    return apt.status === 'cancelled';
  });

  const handleAppointmentPress = async (appointmentId: string) => {
    try {
      const appointmentWithVenue = await AppointmentService.getAppointmentWithVenue(appointmentId);
      if (appointmentWithVenue) {
        setSelectedAppointment(appointmentWithVenue);
        bottomSheetRef.current?.snapToIndex(0);
      }
    } catch (error) {
      console.error('Error loading appointment details:', error);
      Alert.alert('Error', 'Failed to load appointment details');
    }
  };

  const handleCloseSheet = () => {
    bottomSheetRef.current?.close();
    setSelectedAppointment(null);
  };

  const handleReschedule = (appointment: Appointment) => {
    // Mock barber info for now
    const barberInfo = { id: appointment.barberId, name: appointment.venue?.name || BUSINESS_INFO.name, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face' };
    navigation.navigate('Book' as any, {
      rescheduleAppointment: {
        id: appointment.id,
        shopName: barberInfo?.name || "Unknown Barber",
        service: appointment.serviceName || 'Unknown Service',
        currentDate: appointment.appointmentDate || '',
        currentTime: appointment.appointmentTime || '',
        location: appointment.venue?.address || 'Downtown Plaza',
        barberAvatar: barberInfo?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      }
    });
  };

  const handleCancel = (appointment: Appointment) => {
    const appointmentId = appointment.id;
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment? Your credit will be restored.',
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelAppointment(appointmentId);
              // AppContext will automatically update the state
              Alert.alert('Success', 'Appointment cancelled and credit restored!');
            } catch (error) {
              console.error('Error cancelling appointment:', error);
              Alert.alert('Error', 'Failed to cancel appointment');
            }
          }
        },
      ]
    );
  };

  const handleRebook = (appointment: Appointment) => {
    // Mock barber info for now
    const barberInfo = { id: appointment.barberId, name: appointment.venue?.name || BUSINESS_INFO.name, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face' };
    navigation.navigate('Book' as any, {
      rebookAppointment: {
        id: appointment.id,
        shopName: barberInfo?.name || "Unknown Barber",
        service: appointment.serviceName || 'Unknown Service',
        currentDate: appointment.appointmentDate || '',
        currentTime: appointment.appointmentTime || '',
        location: appointment.venue?.address || 'Downtown Plaza',
        barberAvatar: barberInfo?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      }
    });
  };

  const handleReview = (appointment: Appointment) => {
    setSelectedAppointmentForReview(appointment);
    setReviewModalVisible(true);
  };

  const handleSubmitReview = async (reviewData: { rating: number; text: string; photos: string[] }) => {
    if (selectedAppointmentForReview) {
      try {
        await AppointmentService.submitReview(
          selectedAppointmentForReview.id, 
          reviewData.rating, 
          reviewData.text, 
          reviewData.photos[0] // Use first photo if available
        );
        
        // Mock barber info for navigation
        const barberInfo = {
          id: selectedAppointmentForReview.barberId,
          name: BUSINESS_INFO.name,
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face'
        };
        
        // Navigate to barber profile
        navigation.navigate('BarberProfile', {
          barberId: selectedAppointmentForReview.barberId,
          barberName: barberInfo.name,
          barberAvatar: barberInfo.avatar,
          barberRating: 4.8,
          barberReviewCount: 0, // Will be updated with real data from ReviewService
        });
        
        // AppContext will automatically update the state
        setReviewModalVisible(false);
        setSelectedAppointmentForReview(null);
      } catch (error) {
        console.error('Error submitting review:', error);
        Alert.alert('Error', 'Failed to submit review. Please try again.');
      }
    }
    setReviewModalVisible(false);
    setSelectedAppointmentForReview(null);
  };

  const handleViewBarberProfile = (appointment: Appointment) => {
    navigation.navigate('BarberProfile', {
      barberId: appointment.barberId,
      barberName: appointment.venue?.name || BUSINESS_INFO.name,
      barberAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      barberRating: appointment.venue?.rating || 4.8,
      barberReviewCount: appointment.venue?.reviewCount || 0,
    });
  };

  const handleViewDetails = (appointment: any) => {
    setDetailsAppointment(appointment);
    detailsSheetRef.current?.open();
  };

  const handleCloseDetailsSheet = () => {
    detailsSheetRef.current?.close();
    setDetailsAppointment(null);
  };

  const currentData =
    activeTab === 'upcoming'
      ? upcomingAppointments
      : activeTab === 'past'
        ? pastAppointments
        : canceledAppointments;

  const renderEmptyState = () => {
    let title = 'No upcoming appointments';
    let subtitle = 'When you book, your appointments will show up here.';
    let icon: 'calendar-outline' | 'time-outline' | 'close-circle-outline' = 'calendar-outline';
    let actionLabel: string | undefined;
    let onAction: (() => void) | undefined;
    if (activeTab === 'past') {
      title = 'No past appointments';
      subtitle = 'Past appointments will appear here.';
      icon = 'time-outline';
    } else if (activeTab === 'canceled') {
      title = 'No canceled appointments';
      subtitle = 'Canceled appointments will appear here.';
      icon = 'close-circle-outline';
    } else {
      actionLabel = 'Book an appointment';
      onAction = () => navigation.navigate('Book');
    }
    return (
      <View style={styles.emptyStateCard}>
        <EmptyState
          icon={icon}
          title={title}
          subtitle={subtitle}
          actionLabel={actionLabel}
          onAction={onAction}
        />
      </View>
    );
  };

  const renderItem = useCallback(
    ({ item }: { item: Appointment }) => (
      <CustomerAppointmentListItem
        appointment={item}
        onPress={() => handleAppointmentPress(item.id)}
      />
    ),
    [handleAppointmentPress]
  );

  const ListSeparator = () => <View style={styles.listSeparator} />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentWrap}>
        {/* Segmented control in card */}
        <View style={styles.segmentCard}>
          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={[styles.segment, activeTab === 'upcoming' && styles.segmentActive]}
              onPress={() => {
                haptics.selection();
                setActiveTab('upcoming');
              }}
            >
              <Text style={[styles.segmentText, activeTab === 'upcoming' && styles.segmentTextActive]}>
                Upcoming ({upcomingAppointments.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segment, activeTab === 'past' && styles.segmentActive]}
              onPress={() => {
                haptics.selection();
                setActiveTab('past');
              }}
            >
              <Text style={[styles.segmentText, activeTab === 'past' && styles.segmentTextActive]}>
                Past ({pastAppointments.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segment, activeTab === 'canceled' && styles.segmentActive]}
              onPress={() => {
                haptics.selection();
                setActiveTab('canceled');
              }}
            >
              <Text style={[styles.segmentText, activeTab === 'canceled' && styles.segmentTextActive]}>
                Canceled ({canceledAppointments.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Appointments list in card */}
        <View style={styles.listCard}>
          <FlatList
            data={currentData}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={ListSeparator}
            ListEmptyComponent={renderEmptyState}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>

      {/* Review Modal */}
      <ReviewModal
        visible={reviewModalVisible}
        onClose={() => {
          setReviewModalVisible(false);
          setSelectedAppointmentForReview(null);
        }}
        onSubmit={handleSubmitReview}
        barberName={selectedAppointmentForReview ? BUSINESS_INFO.name : "Unknown Barber"}
        serviceName={selectedAppointmentForReview?.service || ''}
        appointmentId={selectedAppointmentForReview?.id || ''}
      />

      {/* Appointment Detail Bottom Sheet */}
      <AppointmentDetailSheet
        ref={bottomSheetRef}
        appointment={selectedAppointment}
        userRole="customer"
        onClose={handleCloseSheet}
        onReschedule={handleReschedule}
        onCancel={handleCancel}
        onReview={handleReview}
        onRebook={handleRebook}
        onViewBarberProfile={handleViewBarberProfile}
      />

      {/* Appointment Details Drawer */}
      <AppointmentDetailSheet
        ref={detailsSheetRef}
        appointment={detailsAppointment}
        userRole="customer"
        onClose={handleCloseDetailsSheet}
        onReschedule={(apt) => {
          handleCloseDetailsSheet();
          handleReschedule(apt);
        }}
        onCancel={(apt) => {
          handleCloseDetailsSheet();
          handleCancel(apt);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cleanScheduler.background,
  },
  contentWrap: {
    flex: 1,
    paddingTop: cleanScheduler.sectionSpacing,
    paddingHorizontal: cleanScheduler.padding,
    paddingBottom: spacing.xl * 2,
  },
  segmentCard: {
    backgroundColor: cleanScheduler.card.bg,
    borderRadius: cleanScheduler.card.radius,
    borderWidth: 1,
    borderColor: cleanScheduler.card.border,
    padding: cleanScheduler.padding,
    marginBottom: cleanScheduler.sectionSpacing,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: cleanScheduler.secondary.bg,
    borderRadius: cleanScheduler.input.radius,
    padding: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: cleanScheduler.input.radius,
  },
  segmentActive: {
    backgroundColor: cleanScheduler.card.bg,
    borderWidth: 1,
    borderColor: cleanScheduler.card.border,
  },
  segmentText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: cleanScheduler.text.subtext,
  },
  segmentTextActive: {
    color: cleanScheduler.text.heading,
  },
  listCard: {
    flex: 1,
    backgroundColor: cleanScheduler.card.bg,
    borderRadius: cleanScheduler.card.radius,
    borderWidth: 1,
    borderColor: cleanScheduler.card.border,
    overflow: 'hidden',
    minHeight: 200,
  },
  listContent: {
    paddingVertical: spacing.sm,
    flexGrow: 1,
  },
  listSeparator: {
    height: 1,
    backgroundColor: cleanScheduler.card.border,
    marginHorizontal: cleanScheduler.padding,
  },
  emptyStateCard: {
    padding: cleanScheduler.padding,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
});

export default AppointmentsScreen;



