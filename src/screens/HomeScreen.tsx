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
import { BillingService } from '../services/billing';

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
  const { state, cancelAppointment, refreshSubscription } = useApp();
  const { user, appointments, userSubscription } = state;
  const isBarber = user?.role === 'barber';
  const [subscriptionData, setSubscriptionData] = useState({
    planName: 'No Plan',
    price: '',
    cutsRemaining: 0,
    daysLeft: 0,
    renewsOn: '',
  });

  // Filter upcoming appointments from AppContext
  const upcomingAppointments = appointments.filter(apt => {
    const appointmentDate = apt.appointmentDate || apt.date;
    return apt.status === 'scheduled' && 
           appointmentDate && 
           new Date(appointmentDate) >= new Date();
  });

  useEffect(() => {
    // Load subscription data
    if (user?.id && !isBarber) {
      loadSubscriptionData();
    }
  }, [user?.id, userSubscription]);

  const loadSubscriptionData = async () => {
    try {
      console.log('🏠 HomeScreen: Loading subscription data...');
      console.log('🏠 HomeScreen: userSubscription from context:', userSubscription);
      
      if (userSubscription) {
        const cutsRemaining = BillingService.calculateCutsRemaining(userSubscription);
        const daysLeft = BillingService.calculateDaysLeft(userSubscription);
        const renewsOn = new Date(userSubscription.current_period_end).toLocaleDateString();
        
        const subscriptionDisplayData = {
          planName: userSubscription.plan_name,
          price: `per ${userSubscription.stripe_price_id.includes('month') ? 'month' : 'year'}`,
          cutsRemaining,
          daysLeft,
          renewsOn,
        };
        
        console.log('🏠 HomeScreen: Setting subscription data:', subscriptionDisplayData);
        setSubscriptionData(subscriptionDisplayData);
      } else {
        // No subscription - show default state
        console.log('🏠 HomeScreen: No subscription found, showing default state');
        setSubscriptionData({
          planName: 'No Active Plan',
          price: 'Choose a plan',
          cutsRemaining: 0,
          daysLeft: 0,
          renewsOn: '',
        });
      }
    } catch (error) {
      console.error('❌ HomeScreen: Error loading subscription data:', error);
    }
  };


  // Transform appointment data for display
  const displayAppointments = upcomingAppointments.map(apt => ({
    id: apt.id,
    barberId: apt.barberId,
    barberName: "Mike's Barbershop",
    service: apt.serviceName || apt.service || 'Unknown Service',
    date: formatAppointmentDate(apt.appointmentDate || apt.date || ''),
    time: apt.appointmentTime || apt.time || 'Unknown Time',
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

  const handleUpgradePlan = () => {
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
      navigation.navigate('Book' as any, {
        rescheduleAppointment: {
          id: appointmentId,
          shopName: "Mike's Barbershop",
          service: appointment.serviceName || appointment.service || 'Unknown Service',
          currentDate: appointment.appointmentDate || appointment.date || '',
          currentTime: appointment.appointmentTime || appointment.time || '',
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

  const handleViewBarberProfile = (barberId: string, barberName: string, barberAvatar: string, barberRating: number, barberReviewCount: number) => {
    navigation.navigate('BarberProfile', {
      barberId,
      barberName,
      barberAvatar,
      barberRating,
      barberReviewCount,
    });
  };



  // Check if user should see upgrade button (basic or premium plans)
  const shouldShowUpgradeButton = !isBarber && userSubscription && 
    (userSubscription.plan_name.toLowerCase().includes('basic') || 
     userSubscription.plan_name.toLowerCase().includes('premium'));

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>

        {/* Stats Cards - Moved to top */}
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
            <View style={styles.quickActionsRow}>
              <TouchableOpacity onPress={handleBookAppointment} style={styles.quickActionButton}>
                <LinearGradient 
                  start={{x:0, y:0}}
                  end={{x:0, y:1}}
                  colors={["#000080", "#1D4ED8"]}
                  style={styles.bookServiceCard}
                >
                  <View style={styles.bookServiceLeft}>
                    <View style={styles.bookServiceText}>
                      <Text style={styles.bookServiceTitle}>Book Service</Text>
                      <Text style={styles.bookServiceSubtitle}>Schedule your next cut</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.white} />
                </LinearGradient>
              </TouchableOpacity>

              {shouldShowUpgradeButton && (
                <TouchableOpacity onPress={handleUpgradePlan} style={styles.quickActionButton}>
                  <View style={styles.upgradePlanCard}>
                    <View style={styles.upgradePlanLeft}>
                      <View style={styles.upgradePlanText}>
                        <Text style={styles.upgradePlanTitle}>Upgrade Plan</Text>
                        <Text style={styles.upgradePlanSubtitle}>Get more cuts</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
                  </View>
                </TouchableOpacity>
              )}
            </View>
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
              onViewBarberProfile={handleViewBarberProfile}
              barberId={appointment.barberId || "1"}
              barberRating={4.8}
              barberReviewCount={0} // Will be updated with real data from ReviewService
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
  


  // Quick actions styles
  quickActionsSection: {
    marginBottom: spacing.xl,
  },
  quickActionsContent: {
    marginTop: 16,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    height: 80,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  bookServiceCard: {
    borderRadius: 16,
    padding: 17,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '100%',
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
    // Removed marginLeft since we removed the icon
  },
  bookServiceTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  bookServiceSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.white,
    opacity: 0.9,
  },
  upgradePlanCard: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.border.light,
    borderRadius: 16,
    borderWidth: 1,
    padding: 17,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '100%',
    shadowColor: '#0000000D',
    shadowOpacity: 0.1,
    shadowOffset: {
      width: 0,
      height: 1
    },
    shadowRadius: 2,
    elevation: 2,
  },
  upgradePlanLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  upgradePlanText: {
    // Removed marginLeft since we removed the icon
  },
  upgradePlanTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  upgradePlanSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },

  // Appointments styles
  appointmentsSection: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
