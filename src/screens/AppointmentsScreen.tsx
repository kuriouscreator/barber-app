import React, { useState, useEffect } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MainTabParamList, RootStackParamList } from '../types';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';
import { useApp } from '../context/AppContext';
import { AppointmentService } from '../services/AppointmentService';
import AppointmentCard from '../components/AppointmentCard';
import ReviewModal from '../components/ReviewModal';

type AppointmentsScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Appointments'> & StackNavigationProp<RootStackParamList>;

interface Props {
  navigation: AppointmentsScreenNavigationProp;
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

const AppointmentsScreen: React.FC<Props> = ({ navigation }) => {
  const { state } = useApp();
  const { user } = state;
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [pastAppointments, setPastAppointments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedAppointmentForReview, setSelectedAppointmentForReview] = useState<any>(null);

  const loadAppointments = async () => {
    if (!user?.id) {
      // Clear appointments if no user
      setUpcomingAppointments([]);
      setPastAppointments([]);
      return;
    }
    
    try {
      const upcoming = await AppointmentService.getUpcomingAppointments();
      const past = await AppointmentService.getPastAppointments();
      setUpcomingAppointments(upcoming);
      setPastAppointments(past);
    } catch (error) {
      console.error('Error loading appointments:', error);
      // Clear appointments on error
      setUpcomingAppointments([]);
      setPastAppointments([]);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [user?.id]);

  const handleReschedule = (appointmentId: string) => {
    const appointment = upcomingAppointments.find(apt => apt.id === appointmentId);
    if (appointment) {
      // Mock barber info for now
      const barberInfo = { id: appointment.barberId, name: 'Mike\'s Barbershop', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face' };
      navigation.navigate('Book', {
        rescheduleAppointment: {
          id: appointmentId,
          shopName: barberInfo?.name || "Unknown Barber",
          service: appointment.serviceName || appointment.service,
          currentDate: appointment.appointmentDate || appointment.date,
          currentTime: appointment.appointmentTime || appointment.time,
          location: 'Downtown Plaza',
          barberAvatar: barberInfo?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
        }
      });
    }
  };

  const handleCancel = (appointmentId: string) => {
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
              await AppointmentService.cancelAppointment(appointmentId);
              // Refresh appointments
              await loadAppointments();
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

  const handleRebook = (appointmentId: string) => {
    const appointment = pastAppointments.find(apt => apt.id === appointmentId);
    if (appointment) {
      // Mock barber info for now
      const barberInfo = { id: appointment.barberId, name: 'Mike\'s Barbershop', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face' };
      navigation.navigate('Book', {
        rebookAppointment: {
          id: appointmentId,
          shopName: barberInfo?.name || "Unknown Barber",
          service: appointment.serviceName || appointment.service,
          currentDate: appointment.appointmentDate || appointment.date,
          currentTime: appointment.appointmentTime || appointment.time,
          location: 'Downtown Plaza',
          barberAvatar: barberInfo?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
        }
      });
    }
  };

  const handleReview = (appointmentId: string) => {
    const appointment = pastAppointments.find(apt => apt.id === appointmentId);
    if (appointment) {
      setSelectedAppointmentForReview(appointment);
      setReviewModalVisible(true);
    }
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
          name: 'Mike\'s Barbershop', 
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face' 
        };
        
        // Navigate to barber profile
        navigation.navigate('BarberProfile', {
          barberId: selectedAppointmentForReview.barberId,
          barberName: barberInfo.name,
          barberAvatar: barberInfo.avatar,
          barberRating: 4.8,
          barberReviewCount: 127,
        });
        
        // Refresh appointments to show the updated review
        await loadAppointments();
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

  const handleViewBarberProfile = (barberId: string, barberName: string, barberAvatar: string, barberRating: number, barberReviewCount: number) => {
    navigation.navigate('BarberProfile', {
      barberId,
      barberName,
      barberAvatar,
      barberRating,
      barberReviewCount,
    });
  };

  const renderAppointmentCard = (appointment: any, isUpcoming: boolean) => {
    // Mock barber info and stats for now
    const barberInfo = { id: appointment.barberId, name: 'Mike\'s Barbershop', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face' };
    const barberStats = { rating: 4.8, reviewCount: 127 };
    
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
        onReschedule={handleReschedule}
        onCancel={handleCancel}
        onReview={handleReview}
        onRebook={handleRebook}
        onViewBarberProfile={handleViewBarberProfile}
        showReviewButton={!appointment.rating} // Show review button only if not rated yet
        barberId={appointment.barberId}
        barberRating={barberStats.rating}
        barberReviewCount={barberStats.reviewCount}
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
            onPress={() => setActiveTab('upcoming')}
          >
            <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
              Upcoming ({upcomingAppointments.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'past' && styles.activeTab]}
            onPress={() => setActiveTab('past')}
          >
            <Text style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>
              Past ({pastAppointments.length})
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
        ) : (
          pastAppointments.length > 0 ? (
            pastAppointments.map(appointment => renderAppointmentCard(appointment, false))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No past appointments</Text>
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
        barberName={selectedAppointmentForReview ? "Mike's Barbershop" : "Unknown Barber"}
        serviceName={selectedAppointmentForReview?.service || ''}
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
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: colors.accent.primary,
  },
  tabText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
  },
  activeTabText: {
    color: colors.white,
  },

  // Appointment Cards
  appointmentCard: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.border.light,
    borderRadius: 16,
    borderWidth: 1,
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
    color: '#4B5563',
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
    borderColor: colors.accent.primary,
    borderWidth: 1,
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
    borderColor: colors.accent.primary,
    borderWidth: 1,
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



