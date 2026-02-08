import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList } from '../types';
import { useApp } from '../context/AppContext';
import { BillingService } from '../services/billing';
import { CutTrackingService } from '../services/CutTrackingService';
import { RewardsService } from '../services/RewardsService';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { BUSINESS_INFO } from '../constants/business';
import RecentActivityWidget from '../components/RecentActivityWidget';
import { AppointmentDetailSheet } from '../components/AppointmentDetailSheet';

type HomeScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Home'>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

const HomeScreenNative: React.FC<Props> = ({ navigation }) => {
  const { state, cancelAppointment } = useApp();
  const { user, appointments, userSubscription } = state;
  const isBarber = user?.role === 'barber';
  const detailSheetRef = useRef<any>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);

  const [subscriptionData, setSubscriptionData] = useState({
    planName: 'No Plan',
    cutsRemaining: 0,
    totalCuts: 0,
    renewsOn: '',
    percentUsed: 0,
    points: 0,
  });

  // Update selectedAppointment when appointments array changes
  useEffect(() => {
    if (selectedAppointment) {
      const updatedAppointment = appointments.find(apt => apt.id === selectedAppointment.id);
      if (updatedAppointment && JSON.stringify(updatedAppointment) !== JSON.stringify(selectedAppointment)) {
        console.log('📱 HomeScreen: Updating selected appointment with new data');
        console.log('📅 HomeScreen: Old date:', selectedAppointment.appointmentDate);
        console.log('📅 HomeScreen: New date:', updatedAppointment.appointmentDate);
        setSelectedAppointment(updatedAppointment);
      }
    }
  }, [appointments]);

  // Filter upcoming appointments
  const upcomingAppointments = appointments
    .filter(apt => {
      const appointmentDate = apt.appointmentDate || apt.date;
      return apt.status === 'scheduled' &&
             appointmentDate &&
             new Date(appointmentDate) >= new Date();
    })
    .slice(0, 2); // Show only first 2

  // Filter recent completed appointments for activity feed
  const recentActivity = appointments
    .filter(apt => apt.status === 'completed')
    .sort((a, b) => {
      const dateA = new Date(a.appointmentDate || a.date || '');
      const dateB = new Date(b.appointmentDate || b.date || '');
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 3);

  useEffect(() => {
    if (user?.id && !isBarber) {
      loadSubscriptionData();
    }
  }, [user?.id, userSubscription]);

  const loadSubscriptionData = async () => {
    try {
      if (userSubscription && user?.id) {
        const [cutStatus, pointsBalance] = await Promise.all([
          CutTrackingService.getCutStatus(),
          RewardsService.getPointsBalance(user.id),
        ]);

        const renewsOn = new Date(userSubscription.current_period_end).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });

        const percentUsed = cutStatus.totalCuts > 0
          ? Math.round(((cutStatus.totalCuts - cutStatus.remainingCuts) / cutStatus.totalCuts) * 100)
          : 0;

        setSubscriptionData({
          planName: userSubscription.plan_name,
          cutsRemaining: cutStatus.remainingCuts,
          totalCuts: cutStatus.totalCuts,
          renewsOn,
          percentUsed,
          points: pointsBalance,
        });
      } else {
        setSubscriptionData({
          planName: 'No Active Plan',
          cutsRemaining: 0,
          totalCuts: 0,
          renewsOn: '',
          percentUsed: 0,
          points: 0,
        });
      }
    } catch (error) {
      console.error('Error loading subscription data:', error);
    }
  };

  const formatAppointmentDate = (dateString: string) => {
    // Parse the date string directly to avoid timezone issues
    const [year, monthNum, dayNum] = dateString.split('T')[0].split('-').map(Number);
    const date = new Date(year, monthNum - 1, dayNum);
    return {
      month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      day: date.getDate().toString().padStart(2, '0'),
      dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'short' }),
    };
  };

  const formatActivityDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleViewDetails = (appointment: any) => {
    setSelectedAppointment(appointment);
    detailSheetRef.current?.open();
  };

  const handleReschedule = (appointmentId: string) => {
    const appointment = upcomingAppointments.find(apt => apt.id === appointmentId);
    if (appointment) {
      navigation.navigate('Book' as any, {
        rescheduleAppointment: {
          id: appointmentId,
          shopName: BUSINESS_INFO.name,
          service: appointment.serviceName || 'Unknown Service',
          currentDate: appointment.appointmentDate || '',
          currentTime: appointment.appointmentTime || '',
          location: 'Downtown Plaza',
          barberAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
        }
      });
    }
  };

  const handleCancel = (appointmentId: string) => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment?',
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelAppointment(appointmentId);
              Alert.alert('Success', 'Appointment cancelled!');
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel appointment');
            }
          }
        },
      ]
    );
  };

  if (isBarber) {
    return (
      <View style={styles.container}>
        <Text style={styles.barberMessage}>Barber dashboard coming soon</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header with gradient background */}
        <LinearGradient
          colors={['#0F172A', '#111827', '#0F172A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          {/* Overlay gradient */}
          <LinearGradient
            colors={['rgba(100, 116, 139, 0.2)', 'rgba(100, 116, 139, 0)', 'rgba(71, 85, 105, 0.2)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Blur circles */}
          <View style={[styles.blurCircle, styles.blurCircleTopRight]} />
          <View style={[styles.blurCircle, styles.blurCircleBottomLeft]} />

          {/* Header content */}
          <View style={styles.headerContent}>
            {/* User info and notification */}
            <View style={styles.headerTop}>
              <View style={styles.userInfo}>
                <View style={styles.avatarContainer}>
                  <Image
                    source={{ uri: user?.avatar || 'https://via.placeholder.com/48' }}
                    style={styles.avatar}
                  />
                </View>
                <View>
                  <Text style={styles.welcomeText}>Welcome back,</Text>
                  <Text style={styles.userName}>{user?.name || 'Marcus Johnson'}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.notificationButton}>
                <Ionicons name="notifications-outline" size={18} color="#FFFFFF" />
                <View style={styles.notificationBadge} />
              </TouchableOpacity>
            </View>

            {/* Plan and Points cards */}
            <View style={styles.statsRow}>
              <View style={styles.planCard}>
                <Text style={styles.planLabel}>Current Plan</Text>
                <View style={styles.planInfo}>
                  <Ionicons name="star" size={14} color={colors.gray[800]} />
                  <Text style={styles.planName}>{subscriptionData.planName}</Text>
                </View>
              </View>
              <View style={styles.pointsCard}>
                <Text style={styles.pointsLabel}>Points</Text>
                <Text style={styles.pointsValue}>{subscriptionData.points.toLocaleString()}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Main content */}
        <View style={styles.mainContent}>
          {/* Cuts Remaining Card */}
          <LinearGradient
            colors={[colors.gray[800], '#000000']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cutsCard}
          >
            <View style={[styles.blurCircle, styles.cutsBlurTop]} />
            <View style={[styles.blurCircle, styles.cutsBlurBottom]} />

            <View style={styles.cutsCardContent}>
              <View style={styles.cutsHeader}>
                <View style={styles.cutsHeaderLeft}>
                  <View style={styles.cutsIconCircle}>
                    <Ionicons name="cut" size={18} color="#FFFFFF" />
                  </View>
                  <View>
                    <Text style={styles.cutsHeaderLabel}>CUTS REMAINING</Text>
                    <Text style={styles.cutsHeaderSubtext}>This billing cycle</Text>
                  </View>
                </View>
              </View>

              <View style={styles.cutsNumberContainer}>
                <Text style={styles.cutsNumberLarge}>{subscriptionData.cutsRemaining}</Text>
                <Text style={styles.cutsNumberSmall}>of {subscriptionData.totalCuts}</Text>
              </View>

              <Text style={styles.cutsRemainingText}>cuts left this month</Text>

              {/* Progress bar */}
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${Math.min(100 - subscriptionData.percentUsed, 100)}%` }
                    ]}
                  />
                </View>
              </View>

              <View style={styles.cutsFooter}>
                <Text style={styles.cutsFooterText}>
                  Renews: {subscriptionData.renewsOn}
                </Text>
                <Text style={styles.cutsFooterPercent}>{subscriptionData.percentUsed}% Used</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Book')}
            >
              <View style={[styles.actionIcon, styles.actionIconPurple]}>
                <Ionicons name="calendar" size={18} color={colors.gray[800]} />
              </View>
              <Text style={styles.actionLabel}>Book</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Appointments')}
            >
              <View style={[styles.actionIcon, styles.actionIconGray]}>
                <Ionicons name="time" size={18} color={colors.gray[700]} />
              </View>
              <Text style={styles.actionLabel}>History</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Rewards')}
            >
              <View style={[styles.actionIcon, styles.actionIconGray]}>
                <Ionicons name="gift" size={18} color={colors.gray[700]} />
              </View>
              <Text style={styles.actionLabel}>Rewards</Text>
            </TouchableOpacity>
          </View>

          {/* Upcoming Appointments */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Appointments')}>
                <View style={styles.viewAllButton}>
                  <Text style={styles.viewAllText}>View All</Text>
                  <Ionicons name="chevron-forward" size={12} color={colors.gray[800]} />
                </View>
              </TouchableOpacity>
            </View>

            {upcomingAppointments.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No upcoming appointments</Text>
                <TouchableOpacity
                  style={styles.emptyStateButton}
                  onPress={() => navigation.navigate('Book')}
                >
                  <Text style={styles.emptyStateButtonText}>Book Now</Text>
                </TouchableOpacity>
              </View>
            ) : (
              upcomingAppointments.map((apt, index) => {
                const dateInfo = formatAppointmentDate(apt.appointmentDate || apt.date || '');
                const isNextAppointment = index === 0;

                return (
                  <View key={apt.id} style={styles.appointmentCard}>
                    <View style={styles.appointmentContent}>
                      <View style={[
                        styles.appointmentDateBox,
                        isNextAppointment ? styles.dateBoxPurple : styles.dateBoxGray
                      ]}>
                        <Text style={[
                          styles.dateMonth,
                          isNextAppointment ? styles.datePurpleText : styles.dateGrayText
                        ]}>
                          {dateInfo.month}
                        </Text>
                        <Text style={[
                          styles.dateDay,
                          isNextAppointment ? styles.datePurpleText : styles.dateGrayText
                        ]}>
                          {dateInfo.day}
                        </Text>
                        <Text style={[
                          styles.dateDayOfWeek,
                          isNextAppointment ? styles.datePurpleText : styles.dateGrayText
                        ]}>
                          {dateInfo.dayOfWeek}
                        </Text>
                      </View>

                      <View style={styles.appointmentDetails}>
                        <View style={styles.appointmentHeader}>
                          <View style={styles.appointmentTitleContainer}>
                            <Text style={styles.appointmentTitle} numberOfLines={2}>
                              {apt.serviceName || 'Service'}
                            </Text>
                            <View style={styles.appointmentMetaRow}>
                              <Ionicons name="person-outline" size={12} color="#6B7280" />
                              <Text style={styles.appointmentBarber}>
                                with {apt.barberName || 'Barber'}
                              </Text>
                            </View>
                          </View>
                          <View style={[
                            styles.statusBadge,
                            isNextAppointment ? styles.statusConfirmed : styles.statusPending
                          ]}>
                            <Text style={[
                              styles.statusText,
                              isNextAppointment ? styles.statusConfirmedText : styles.statusPendingText
                            ]}>
                              {isNextAppointment ? 'Confirmed' : 'Pending'}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.appointmentInfo}>
                          <View style={styles.infoItem}>
                            <Ionicons name="time-outline" size={12} color="colors.gray[700]" />
                            <Text style={styles.infoText}>{apt.appointmentTime || apt.time}</Text>
                          </View>
                          <View style={styles.infoItem}>
                            <Ionicons name="hourglass-outline" size={12} color="colors.gray[700]" />
                            <Text style={styles.infoText}>{apt.serviceDuration || 45} min</Text>
                          </View>
                        </View>

                        <View style={styles.appointmentActions}>
                          <TouchableOpacity
                            style={styles.actionButtonPrimary}
                            onPress={() => handleViewDetails(apt)}
                          >
                            <Text style={styles.actionButtonPrimaryText}>
                              View Details
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.actionButtonSecondary}
                            onPress={() => handleReschedule(apt.id)}
                          >
                            <Text style={styles.actionButtonSecondaryText}>
                              Reschedule
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {/* Recent Activity Widget */}
          <View style={styles.section}>
            <RecentActivityWidget maxItems={5} showViewAll={true} />
          </View>
        </View>
      </ScrollView>

      {/* Appointment Detail Sheet */}
      {selectedAppointment && (
        <AppointmentDetailSheet
          ref={detailSheetRef}
          appointment={selectedAppointment}
          onReschedule={() => {
            detailSheetRef.current?.close();
            handleReschedule(selectedAppointment.id);
          }}
          onCancel={() => {
            detailSheetRef.current?.close();
            handleCancel(selectedAppointment.id);
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  barberMessage: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
    color: colors.text.secondary,
  },

  // Header styles
  headerGradient: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingTop: 56,
    paddingBottom: 56,
    paddingHorizontal: 24,
    marginBottom: -24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.25,
    shadowRadius: 50,
    elevation: 10,
  },
  blurCircle: {
    position: 'absolute',
    borderRadius: 9999,
  },
  blurCircleTopRight: {
    width: 256,
    height: 256,
    backgroundColor: colors.gray[100],
    top: -128,
    right: -128,
  },
  blurCircleBottomLeft: {
    width: 192,
    height: 192,
    backgroundColor: colors.gray[100],
    bottom: -96,
    left: -96,
  },
  headerContent: {
    gap: 32,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  welcomeText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  userName: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  planCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 17,
    gap: 4,
  },
  planLabel: {
    fontSize: 12,
    color: '#D1D5DB',
    fontWeight: '500',
  },
  planInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planName: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  pointsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 17,
    gap: 4,
    alignItems: 'center',
    minWidth: 100,
  },
  pointsLabel: {
    fontSize: 12,
    color: '#D1D5DB',
    fontWeight: '500',
  },
  pointsValue: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  // Main content
  mainContent: {
    padding: 20,
    paddingTop: 0,
    gap: 24,
    marginTop: -24,
  },

  // Cuts card
  cutsCard: {
    borderRadius: 24,
    padding: 24,
    shadowColor: 'rgba(100, 116, 139, 0.3)',
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 1,
    shadowRadius: 50,
    elevation: 10,
    overflow: 'hidden',
  },
  cutsBlurTop: {
    width: 128,
    height: 128,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: -64,
    right: -64,
  },
  cutsBlurBottom: {
    width: 96,
    height: 96,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    bottom: -48,
    left: -48,
  },
  cutsCardContent: {
    gap: 8,
  },
  cutsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cutsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cutsIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cutsHeaderLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    letterSpacing: 0.6,
  },
  cutsHeaderSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  cutsNumberContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  cutsNumberLarge: {
    fontSize: 48,
    color: '#FFFFFF',
    fontWeight: '900',
    lineHeight: 48,
  },
  cutsNumberSmall: {
    fontSize: 24,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: 'bold',
    paddingBottom: 4,
  },
  cutsRemainingText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  progressBarContainer: {
    marginTop: 16,
  },
  progressBarBg: {
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
  },
  cutsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  cutsFooterText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  cutsFooterPercent: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 17,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconPurple: {
    backgroundColor: colors.gray[100],
  },
  actionIconGray: {
    backgroundColor: colors.gray[100],
  },
  actionLabel: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },

  // Section
  section: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    color: '#111827',
    fontWeight: 'bold',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    color: colors.gray[800],
    fontWeight: '600',
  },

  // Empty state
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyStateButton: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Appointment card
  appointmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 17,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 12,
  },
  appointmentContent: {
    flexDirection: 'row',
    gap: 16,
  },
  appointmentDateBox: {
    width: 60,
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateBoxPurple: {
    backgroundColor: colors.gray[100],
  },
  dateBoxGray: {
    backgroundColor: colors.gray[100],
  },
  dateMonth: {
    fontSize: 12,
    fontWeight: '600',
  },
  datePurpleText: {
    color: colors.gray[700],
  },
  dateGrayText: {
    color: colors.gray[700],
  },
  dateDay: {
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 32,
  },
  dateDayOfWeek: {
    fontSize: 12,
    fontWeight: '500',
  },
  appointmentDetails: {
    flex: 1,
    gap: 7.5,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  appointmentTitleContainer: {
    flex: 1,
    gap: 3.5,
  },
  appointmentTitle: {
    fontSize: 16,
    color: '#111827',
    fontWeight: 'bold',
    lineHeight: 24,
  },
  appointmentMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  appointmentBarber: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  statusConfirmed: {
    backgroundColor: '#F0FDF4',
  },
  statusPending: {
    backgroundColor: '#FEFCE8',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusConfirmedText: {
    color: '#15803D',
  },
  statusPendingText: {
    color: '#A16207',
  },
  appointmentInfo: {
    flexDirection: 'row',
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 12,
    color: colors.gray[700],
  },
  appointmentActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4.5,
  },
  actionButtonPrimary: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonPrimaryText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  actionButtonSecondary: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonSecondaryText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },

  // Activity
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  activityItem: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
    alignItems: 'flex-start',
  },
  activityDivider: {
    height: 1,
    backgroundColor: colors.gray[100],
  },
  activityIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: {
    flex: 1,
    gap: 4,
  },
  activityTitle: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
  },
  activitySubtitle: {
    fontSize: 12,
    color: colors.gray[700],
  },
  activityDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  reviewButton: {
    alignSelf: 'flex-start',
  },
  reviewButtonText: {
    fontSize: 12,
    color: colors.gray[800],
    fontWeight: '600',
  },
});

export default HomeScreenNative;
