import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MainTabParamList, RootStackParamList, Appointment } from '../types';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';
import { BUSINESS_INFO } from '../constants/business';
import { useApp } from '../context/AppContext';
import { AppointmentService } from '../services/AppointmentService';
import AppointmentCard from '../components/AppointmentCard';
import { AppointmentDetailSheet } from '../components/AppointmentDetailSheet';
import ReviewModal from '../components/ReviewModal';
import { haptics } from '../utils/haptics';

type AppointmentsScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Appointments'> & StackNavigationProp<RootStackParamList>;
type AppointmentsScreenRouteProp = RouteProp<MainTabParamList, 'Appointments'>;

interface Props {
  navigation: AppointmentsScreenNavigationProp;
  route: AppointmentsScreenRouteProp;
}

// Helper function to format appointment dates
const formatAppointmentDate = (dateString: string): string => {
  const today = new Date();
  const appointmentDate = new Date(dateString);
  
  // Check if it's today
  if (appointmentDate.toDateString() === today.toDateString()) {
    return 'Today';
  }
  
  // Check if it's tomorrow
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (appointmentDate.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  }
  
  // Format as "Dec 28" or "Jan 13"
  return appointmentDate.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
};

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
    return apt.status === 'scheduled' && 
           appointmentDate && 
           new Date(appointmentDate) >= new Date();
  });
  
  const pastAppointments = appointments.filter(apt => {
    const appointmentDate = apt.appointmentDate || apt.date;
    return apt.status === 'completed' || 
           apt.status === 'no_show' ||
           (apt.status === 'scheduled' && appointmentDate && new Date(appointmentDate) < new Date());
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
    // Open the appointment details bottom sheet
    setDetailsAppointment(appointment);
    detailsSheetRef.current?.open();
  };

  const handleCloseDetailsSheet = () => {
    detailsSheetRef.current?.close();
    setDetailsAppointment(null);
  };

  const renderAppointmentCard = (appointment: any, isUpcoming: boolean, isCanceled: boolean = false) => {
    // Mock barber info for now
    const barberInfo = { id: appointment.barberId, name: BUSINESS_INFO.name, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face' };

    return (
      <AppointmentCard
        key={appointment.id}
        id={appointment.id}
        barberName={barberInfo?.name || "Unknown Barber"}
        service={appointment.serviceName || appointment.service}
        date={formatAppointmentDate(appointment.appointmentDate || appointment.date)}
        time={appointment.appointmentTime || appointment.time}
        location="Downtown Plaza"
        barberPhoto={barberInfo?.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"}
        isUpcoming={isUpcoming}
        rating={appointment.rating}
        status={appointment.status}
        serviceDuration={appointment.serviceDuration}
        specialRequests={appointment.specialRequests}
        appointmentDate={appointment.appointmentDate || appointment.date}
        onPress={handleAppointmentPress}
        onReschedule={() => handleReschedule(appointment)}
        onCancel={() => handleCancel(appointment)}
        onRebook={() => handleRebook(appointment)}
        onViewDetails={() => handleViewDetails(appointment)}
        onGetDirections={() => {
          // Handle get directions
          Alert.alert('Directions', 'Navigate to the venue');
        }}
        barberId={appointment.barberId}
        barberRating={4.8}
        barberReviewCount={0}
      />
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        
        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
            onPress={() => {
              haptics.selection();
              setActiveTab('upcoming');
            }}
          >
            <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
              Upcoming ({upcomingAppointments.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'past' && styles.activeTab]}
            onPress={() => {
              haptics.selection();
              setActiveTab('past');
            }}
          >
            <Text style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>
              Past ({pastAppointments.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'canceled' && styles.activeTab]}
            onPress={() => {
              haptics.selection();
              setActiveTab('canceled');
            }}
          >
            <Text style={[styles.tabText, activeTab === 'canceled' && styles.activeTabText]}>
              Canceled ({canceledAppointments.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Appointments List */}
        {activeTab === 'upcoming' ? (
          upcomingAppointments.length > 0 ? (
            upcomingAppointments.map(appointment => renderAppointmentCard(appointment, true))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No upcoming appointments</Text>
            </View>
          )
        ) : activeTab === 'past' ? (
          pastAppointments.length > 0 ? (
            pastAppointments.map(appointment => renderAppointmentCard(appointment, false))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No past appointments</Text>
            </View>
          )
        ) : (
          canceledAppointments.length > 0 ? (
            canceledAppointments.map(appointment => renderAppointmentCard(appointment, false, true))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No canceled appointments</Text>
            </View>
          )
        )}
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  content: {
    padding: spacing.lg,
  },
  
  // Tab Selector
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'colors.gray[100]',
    borderRadius: 12,
    padding: 4,
    marginBottom: spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  activeTabText: {
    color: '#111827',
  },

  // Appointment Cards
  appointmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 17,
    marginBottom: 16,
    shadowColor: '#0000000D',
    shadowOpacity: 0.1,
    shadowOffset: {
      width: 0,
      height: 1
    },
    shadowRadius: 2,
    elevation: 2,
  },
  appointmentTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 17,
    marginBottom: 12,
  },
  barberPhoto: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  appointmentInfo: {
    flex: 1,
  },
  barberName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  appointmentLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  appointmentLocationText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginLeft: 4,
  },
  appointmentRight: {
    alignItems: 'flex-end',
  },
  appointmentDate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 2,
  },
  appointmentTime: {
    fontSize: 14,
    color: 'colors.gray[700]',
  },
  appointmentDivider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginHorizontal: 17,
    marginVertical: 12,
  },
  appointmentBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 17,
    marginTop: 8,
    gap: 12,
  },
  
  // Buttons
  rescheduleButton: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.button,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flex: 1,
  },
  rescheduleButtonText: {
    fontSize: 14,
    color: colors.accent.primary,
    fontWeight: typography.fontWeight.medium,
    textAlign: 'center',
  },
  cancelButton: {
    borderRadius: borderRadius.button,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flex: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    color: colors.white,
    fontWeight: typography.fontWeight.medium,
  },
  reviewButton: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.button,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flex: 1,
  },
  reviewButtonText: {
    fontSize: 14,
    color: colors.accent.primary,
    fontWeight: typography.fontWeight.medium,
    textAlign: 'center',
  },
  rebookButton: {
    borderRadius: borderRadius.button,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flex: 1,
    alignItems: 'center',
  },
  rebookButtonText: {
    fontSize: 14,
    color: colors.white,
    fontWeight: typography.fontWeight.medium,
  },

  // Empty State
  emptyState: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.sm,
  },
  emptyStateText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});

export default AppointmentsScreen;



