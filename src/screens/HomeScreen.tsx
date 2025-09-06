import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, MainTabParamList } from '../types';
import { useApp } from '../context/AppContext';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';

type HomeScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Home'>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { state } = useApp();
  const { user, appointments } = state;
  const isBarber = user?.role === 'barber';

  const upcomingAppointments = appointments
    .filter(apt => apt.status === 'scheduled' || apt.status === 'confirmed')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 2);

  const todayAppointments = appointments.filter(apt => {
    const today = new Date().toISOString().split('T')[0];
    return apt.date === today;
  });

  const handleBookAppointment = () => {
    if (!isBarber) {
      navigation.navigate('Book');
    }
  };

  const handleViewSubscription = () => {
    // Navigate to the subscription screen using the parent navigator
    const parentNavigation = navigation.getParent();
    if (parentNavigation) {
      parentNavigation.navigate('Subscription');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.name}</Text>
          {isBarber && (
            <Text style={styles.roleBadge}>Barber</Text>
          )}
        </View>

        {/* Credits Card - Only for customers */}
        {!isBarber && (
          <View style={styles.creditsCard}>
            <View style={styles.creditsHeader}>
              <Ionicons name="cut-outline" size={24} color={colors.accent.primary} />
              <Text style={styles.creditsTitle}>Haircut Credits</Text>
            </View>
            <Text style={styles.creditsCount}>{user?.credits || 0}</Text>
            <Text style={styles.creditsSubtext}>
              {user?.credits === 0 
                ? 'No credits remaining' 
                : `${user?.credits} credit${user?.credits === 1 ? '' : 's'} remaining`
              }
            </Text>
            {user?.credits === 0 && (
              <TouchableOpacity 
                style={styles.subscribeButton}
                onPress={handleViewSubscription}
              >
                <Text style={styles.subscribeButtonText}>Get Subscription</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Barber Stats Card */}
        {isBarber && (
          <View style={styles.creditsCard}>
            <View style={styles.creditsHeader}>
              <Ionicons name="stats-chart-outline" size={24} color={colors.accent.primary} />
              <Text style={styles.creditsTitle}>Today's Overview</Text>
            </View>
            <View style={styles.barberStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{todayAppointments.length}</Text>
                <Text style={styles.statLabel}>Appointments</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {appointments.filter(apt => apt.checkInStatus === 'arrived').length}
                </Text>
                <Text style={styles.statLabel}>Check-ins</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {appointments.filter(apt => apt.status === 'completed').length}
                </Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {!isBarber ? (
              <>
                <TouchableOpacity 
                  style={styles.actionCard}
                  onPress={handleBookAppointment}
                >
                  <Ionicons name="calendar-outline" size={32} color={colors.accent.primary} />
                  <Text style={styles.actionTitle}>Book Appointment</Text>
                  <Text style={styles.actionSubtitle}>Schedule your next cut</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.actionCard}
                  onPress={handleViewSubscription}
                >
                  <Ionicons name="card-outline" size={32} color={colors.accent.primary} />
                  <Text style={styles.actionTitle}>Manage Plan</Text>
                  <Text style={styles.actionSubtitle}>View subscription</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity 
                  style={styles.actionCard}
                  onPress={() => navigation.navigate('Admin')}
                >
                  <Ionicons name="checkmark-circle-outline" size={32} color={colors.accent.primary} />
                  <Text style={styles.actionTitle}>Check-ins</Text>
                  <Text style={styles.actionSubtitle}>Approve arrivals</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.actionCard}
                  onPress={() => navigation.navigate('Admin')}
                >
                  <Ionicons name="calendar-outline" size={32} color={colors.accent.primary} />
                  <Text style={styles.actionTitle}>Schedule</Text>
                  <Text style={styles.actionSubtitle}>Manage availability</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Upcoming Appointments */}
        {upcomingAppointments.length > 0 && (
          <View style={styles.appointmentsSection}>
            <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
            {upcomingAppointments.map((appointment) => (
              <View key={appointment.id} style={styles.appointmentCard}>
                <View style={styles.appointmentInfo}>
                  <Text style={styles.appointmentService}>{appointment.service}</Text>
                  <Text style={styles.appointmentDate}>
                    {formatDate(appointment.date)} at {formatTime(appointment.time)}
                  </Text>
                </View>
                <View style={styles.appointmentStatus}>
                  <View style={[
                    styles.statusBadge,
                    appointment.status === 'confirmed' && styles.statusConfirmed,
                    appointment.status === 'scheduled' && styles.statusScheduled,
                  ]}>
                    <Text style={[
                      styles.statusText,
                      appointment.status === 'confirmed' && styles.statusTextConfirmed,
                      appointment.status === 'scheduled' && styles.statusTextScheduled,
                    ]}>
                      {appointment.status}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Barber Info */}
        <View style={styles.barberSection}>
          <Text style={styles.sectionTitle}>Your Barber</Text>
          <View style={styles.barberCard}>
            <View style={styles.barberInfo}>
              <Text style={styles.barberName}>Marcus Johnson</Text>
              <Text style={styles.barberSpecialties}>Classic Cuts • Beard Trimming • Styling</Text>
              <Text style={styles.barberPhone}>(555) 123-4567</Text>
            </View>
            <TouchableOpacity style={styles.contactButton}>
              <Ionicons name="call-outline" size={20} color={colors.white} />
            </TouchableOpacity>
          </View>
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
  welcomeSection: {
    marginBottom: spacing.xl,
  },
  welcomeText: {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
  },
  userName: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  roleBadge: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.accent.primary,
    backgroundColor: colors.gray[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
  creditsCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    ...shadows.md,
  },
  creditsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  creditsTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginLeft: spacing.sm,
  },
  creditsCount: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.accent.primary,
    marginBottom: spacing.xs,
  },
  creditsSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  subscribeButton: {
    backgroundColor: colors.accent.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignSelf: 'flex-start',
  },
  subscribeButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  quickActions: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.sm,
  },
  actionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  actionSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  appointmentsSection: {
    marginBottom: spacing.xl,
  },
  appointmentCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadows.sm,
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentService: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  appointmentDate: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  appointmentStatus: {
    marginLeft: spacing.md,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.gray[200],
  },
  statusConfirmed: {
    backgroundColor: colors.accent.success,
  },
  statusScheduled: {
    backgroundColor: colors.accent.warning,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  statusTextConfirmed: {
    color: colors.white,
  },
  statusTextScheduled: {
    color: colors.white,
  },
  barberSection: {
    marginBottom: spacing.xl,
  },
  barberCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadows.sm,
  },
  barberInfo: {
    flex: 1,
  },
  barberName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  barberSpecialties: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  barberPhone: {
    fontSize: typography.fontSize.sm,
    color: colors.accent.primary,
    fontWeight: typography.fontWeight.medium,
  },
  contactButton: {
    backgroundColor: colors.accent.primary,
    borderRadius: borderRadius.full,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  barberStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.accent.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
});

export default HomeScreen;
