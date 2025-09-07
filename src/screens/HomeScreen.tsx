import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, MainTabParamList } from '../types';
import { useApp } from '../context/AppContext';
import { AppointmentService } from '../services/AppointmentService';
import { colors } from '../theme/colors';
import AppointmentCard from '../components/AppointmentCard';
import { typography } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';

const { width } = Dimensions.get('window');

type HomeScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Home'>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { state } = useApp();
  const { user, appointments } = state;
  const isBarber = user?.role === 'barber';
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [userCredits, setUserCredits] = useState(2);

  useEffect(() => {
    // Initialize the appointment service
    AppointmentService.initialize();
    
    // Load user's appointments and credits
    if (user?.id) {
      const appointments = AppointmentService.getUpcomingAppointments(user.id);
      const userData = AppointmentService.getUser(user.id);
      setUpcomingAppointments(appointments);
      setUserCredits(userData?.credits || 2);
    }
  }, [user?.id]);

  // Mock data for the new design
  const subscriptionData = {
    planName: 'Premium Plan',
    price: '$79/month',
    cutsRemaining: userCredits,
    daysLeft: 15,
    renewsOn: 'Jan 15, 2025',
  };

  // Transform appointment data for display
  const displayAppointments = upcomingAppointments.map(apt => ({
    id: apt.id,
    barberName: "Mike's Barbershop",
    service: apt.service,
    date: apt.date === '2024-12-30' ? 'Today' : 'Jan 13',
    time: apt.time,
    location: 'Downtown Plaza',
    barberPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
  }));


  const handleBookAppointment = () => {
    if (!isBarber) {
      navigation.navigate('Book');
    }
  };

  const handleViewSubscription = () => {
    const parentNavigation = navigation.getParent();
    if (parentNavigation) {
      parentNavigation.navigate('Subscription');
    }
  };

  const handleViewAllAppointments = () => {
    // Navigate to appointments tab
    navigation.navigate('Appointments' as any);
  };

  const handleReschedule = (appointmentId: string) => {
    // Find the appointment to reschedule
    const appointment = upcomingAppointments.find(apt => apt.id === appointmentId);
    if (appointment) {
      // Navigate to Book screen with appointment details for rescheduling
      navigation.navigate('Book', {
        rescheduleAppointment: {
          id: appointmentId,
          shopName: appointment.barberName,
          service: appointment.service,
          currentDate: appointment.date,
          currentTime: appointment.time,
          location: appointment.location,
          barberAvatar: appointment.barberPhoto,
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
                // Refresh appointments and credits
                const appointments = AppointmentService.getUpcomingAppointments(user.id);
                const userData = AppointmentService.getUser(user.id);
                setUpcomingAppointments(appointments);
                setUserCredits(userData?.credits || 0);
                
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



  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>

        {/* Subscription Card */}
        {!isBarber && (
          <TouchableOpacity onPress={handleViewSubscription} style={styles.subscriptionCard}>
            <View style={styles.subscriptionContent}>
              <View style={styles.subscriptionHeader}>
                <Text style={styles.subscriptionPlanName}>{subscriptionData.planName}</Text>
                <Text style={styles.subscriptionPrice}>{subscriptionData.price}</Text>
              </View>
              
            </View>
            
            <View style={styles.subscriptionChevron}>
              <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
            </View>
          </TouchableOpacity>
        )}

        {/* Stats Cards */}
        {!isBarber && (
          <View style={styles.statsSection}>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statCardNumber}>{subscriptionData.cutsRemaining}</Text>
                <Text style={styles.statCardLabel}>Cuts Remaining</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statCardNumber}>{subscriptionData.daysLeft}</Text>
                <Text style={styles.statCardLabel}>Days Left</Text>
              </View>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsContent}>
            <TouchableOpacity onPress={handleBookAppointment}>
            <LinearGradient 
              start={{x:0, y:0}}
              end={{x:0, y:1}}
              colors={["#000080", "#1D4ED8"]}
              style={styles.bookServiceCard}
            >
              <View style={styles.bookServiceLeft}>
                <Ionicons name="add-circle" size={24} color={colors.white} />
                <View style={styles.bookServiceText}>
                  <Text style={styles.bookServiceTitle}>Book Service</Text>
                  <Text style={styles.bookServiceSubtitle}>Schedule your next cut</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.white} />
            </LinearGradient>
          </TouchableOpacity>
          </View>
        </View>

        {/* Upcoming Appointments */}
        <View style={styles.appointmentsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
            <TouchableOpacity onPress={handleViewAllAppointments}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {displayAppointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              id={appointment.id}
              barberName={appointment.barberName}
              service={appointment.service}
              date={appointment.date}
              time={appointment.time}
              location={appointment.location}
              barberPhoto={appointment.barberPhoto}
              isUpcoming={true}
              onReschedule={handleReschedule}
              onCancel={handleCancel}
            />
          ))}
        </View>
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
  

  // Subscription card styles
  subscriptionCard: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.border.light,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 17,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#0000000D',
    shadowOpacity: 0.1,
    shadowOffset: {
      width: 0,
      height: 1
    },
    shadowRadius: 2,
    elevation: 2,
  },
  subscriptionContent: {
    flex: 1,
    justifyContent: 'center',
  },
  subscriptionHeader: {
    marginHorizontal: 17,
  },
  subscriptionPlanName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  subscriptionPrice: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 1,
    marginRight: 52,
  },
  subscriptionChevron: {
    marginRight: 17,
  },
  subscriptionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
  },

  // Quick actions styles
  quickActionsSection: {
    marginBottom: spacing.xl,
  },
  quickActionsContent: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  bookServiceCard: {
    borderRadius: 16,
    padding: 17,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#0000000D',
    shadowOpacity: 0.1,
    shadowOffset: {
      width: 0,
      height: 1
    },
    shadowRadius: 2,
    elevation: 2,
  },
  bookServiceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bookServiceText: {
    marginLeft: spacing.sm,
  },
  bookServiceTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  bookServiceSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.white,
    opacity: 0.9,
  },

  // Appointments styles
  appointmentsSection: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  viewAllText: {
    fontSize: typography.fontSize.sm,
    color: colors.accent.primary,
    fontWeight: typography.fontWeight.medium,
  },
  appointmentCard: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.border.light,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 17,
    marginBottom: 12,
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
    marginBottom: 12,
    marginHorizontal: 17,
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
    color: '#111827',
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
  },
  appointmentDateTime: {
    alignItems: 'flex-end',
  },
  appointmentDate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
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
  appointmentLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  appointmentLocationText: {
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 4,
  },
  appointmentActions: {
    flexDirection: 'row',
  },
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
    color: colors.accent.primary,
    fontSize: 14,
    fontWeight: typography.fontWeight.medium,
    textAlign: 'center',
  },
  cancelButton: {
    borderRadius: borderRadius.button,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flex: 1,
  },
  cancelButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: typography.fontWeight.medium,
    textAlign: 'center',
  },

  // Stats cards styles
  statsSection: {
    marginBottom: spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderColor: colors.border.light,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#0000000D',
    shadowOpacity: 0.1,
    shadowOffset: {
      width: 0,
      height: 1
    },
    shadowRadius: 2,
    elevation: 2,
  },
  statCardNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  statCardLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },

});

export default HomeScreen;
