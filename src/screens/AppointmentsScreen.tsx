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
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MainTabParamList } from '../types';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';
import { useApp } from '../context/AppContext';
import { AppointmentService } from '../services/AppointmentService';
import AppointmentCard from '../components/AppointmentCard';

type AppointmentsScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Appointments'>;

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

  useEffect(() => {
    // Initialize the appointment service
    AppointmentService.initialize();
    
    // Load user's appointments
    if (user?.id) {
      const upcoming = AppointmentService.getUpcomingAppointments(user.id);
      const past = AppointmentService.getPastAppointments(user.id);
      setUpcomingAppointments(upcoming);
      setPastAppointments(past);
    }
  }, [user?.id]);

  const handleReschedule = (appointmentId: string) => {
    const appointment = upcomingAppointments.find(apt => apt.id === appointmentId);
    if (appointment) {
      navigation.navigate('Book', {
        rescheduleAppointment: {
          id: appointmentId,
          shopName: "Mike's Barbershop",
          service: appointment.service,
          currentDate: appointment.date,
          currentTime: appointment.time,
          location: 'Downtown Plaza',
          barberAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
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
            if (user?.id) {
              const success = await AppointmentService.cancelAppointment(appointmentId, user.id);
              if (success) {
                // Refresh appointments
                const upcoming = AppointmentService.getUpcomingAppointments(user.id);
                const past = AppointmentService.getPastAppointments(user.id);
                setUpcomingAppointments(upcoming);
                setPastAppointments(past);
                
                Alert.alert('Success', 'Appointment cancelled and credit restored!');
              } else {
                Alert.alert('Error', 'Failed to cancel appointment');
              }
            }
          }
        },
      ]
    );
  };

  const handleRebook = (appointmentId: string) => {
    const appointment = pastAppointments.find(apt => apt.id === appointmentId);
    if (appointment) {
      navigation.navigate('Book', {
        rebookAppointment: {
          id: appointmentId,
          shopName: "Mike's Barbershop",
          service: appointment.service,
          currentDate: appointment.date,
          currentTime: appointment.time,
          location: 'Downtown Plaza',
          barberAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
        }
      });
    }
  };

  const renderAppointmentCard = (appointment: any, isUpcoming: boolean) => (
    <AppointmentCard
      key={appointment.id}
      id={appointment.id}
      barberName="Mike's Barbershop"
      service={appointment.service}
      date={formatAppointmentDate(appointment.date)}
      time={appointment.time}
      location="Downtown Plaza"
      barberPhoto="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
      isUpcoming={isUpcoming}
      rating={appointment.rating}
      onReschedule={handleReschedule}
      onCancel={handleCancel}
      onReview={(id) => console.log('Review appointment:', id)}
      onRebook={handleRebook}
      showReviewButton={!appointment.rating} // Show review button only if not rated yet
    />
  );

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
    borderColor: '#E5E7EB',
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
    backgroundColor: '#E5E7EB',
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



