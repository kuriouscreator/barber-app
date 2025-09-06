import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, MainTabParamList } from '../types';
import { useApp } from '../context/AppContext';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';

type ProfileScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Profile'>;

interface Props {
  navigation: ProfileScreenNavigationProp;
}

const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { state, logout } = useApp();
  const { user, appointments } = state;
  const isBarber = user?.role === 'barber';

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  const handleManageSubscription = () => {
    // Navigate to the subscription screen using the parent navigator
    const parentNavigation = navigation.getParent();
    if (parentNavigation) {
      parentNavigation.navigate('Subscription');
    }
  };

  const completedAppointments = appointments.filter(apt => apt.status === 'completed');
  const upcomingAppointments = appointments.filter(apt => 
    apt.status === 'scheduled' || apt.status === 'confirmed'
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color={colors.gray[400]} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            {user?.phone && (
              <Text style={styles.userPhone}>{user.phone}</Text>
            )}
          </View>
        </View>

        {/* Subscription Card - Only for customers */}
        {!isBarber && (
          <View style={styles.subscriptionCard}>
            <View style={styles.subscriptionHeader}>
              <Ionicons name="card-outline" size={24} color={colors.accent.primary} />
              <Text style={styles.subscriptionTitle}>Current Plan</Text>
            </View>
            
            {user?.subscription ? (
              <View style={styles.subscriptionInfo}>
                <Text style={styles.subscriptionName}>{user.subscription.name}</Text>
                <Text style={styles.subscriptionDescription}>
                  {user.subscription.description}
                </Text>
                <Text style={styles.subscriptionPrice}>
                  ${user.subscription.price}/{user.subscription.duration}
                </Text>
                <View style={styles.creditsInfo}>
                  <Text style={styles.creditsText}>
                    {user.credits} credit{user.credits === 1 ? '' : 's'} remaining
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.noSubscription}>
                <Text style={styles.noSubscriptionText}>No active subscription</Text>
                <TouchableOpacity 
                  style={styles.subscribeButton}
                  onPress={handleManageSubscription}
                >
                  <Text style={styles.subscribeButtonText}>Get Started</Text>
                </TouchableOpacity>
              </View>
            )}
            
            <TouchableOpacity 
              style={styles.manageButton}
              onPress={handleManageSubscription}
            >
              <Text style={styles.manageButtonText}>Manage Subscription</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.accent.primary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Barber Info Card */}
        {isBarber && (
          <View style={styles.subscriptionCard}>
            <View style={styles.subscriptionHeader}>
              <Ionicons name="business-outline" size={24} color={colors.accent.primary} />
              <Text style={styles.subscriptionTitle}>Barber Profile</Text>
            </View>
            
            <View style={styles.subscriptionInfo}>
              <Text style={styles.subscriptionName}>Marcus Johnson</Text>
              <Text style={styles.subscriptionDescription}>
                Professional Barber & Stylist
              </Text>
              <Text style={styles.subscriptionPrice}>
                Specialties: Classic Cuts, Beard Trimming, Styling
              </Text>
              <View style={styles.creditsInfo}>
                <Text style={styles.creditsText}>
                  Available Monday-Friday 9AM-5PM, Saturday 10AM-3PM
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{completedAppointments.length}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{upcomingAppointments.length}</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {isBarber ? appointments.length : (user?.credits || 0)}
            </Text>
            <Text style={styles.statLabel}>
              {isBarber ? 'Total Services' : 'Credits'}
            </Text>
          </View>
        </View>

        {/* Recent Appointments */}
        {appointments.length > 0 && (
          <View style={styles.appointmentsSection}>
            <Text style={styles.sectionTitle}>Recent Appointments</Text>
            {appointments.slice(0, 3).map((appointment) => (
              <View key={appointment.id} style={styles.appointmentCard}>
                <View style={styles.appointmentInfo}>
                  <Text style={styles.appointmentService}>{appointment.service}</Text>
                  <Text style={styles.appointmentDate}>
                    {formatDate(appointment.date)} at {appointment.time}
                  </Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  appointment.status === 'completed' && styles.statusCompleted,
                  appointment.status === 'confirmed' && styles.statusConfirmed,
                  appointment.status === 'scheduled' && styles.statusScheduled,
                ]}>
                  <Text style={[
                    styles.statusText,
                    appointment.status === 'completed' && styles.statusTextCompleted,
                    appointment.status === 'confirmed' && styles.statusTextConfirmed,
                    appointment.status === 'scheduled' && styles.statusTextScheduled,
                  ]}>
                    {appointment.status}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Settings */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications-outline" size={24} color={colors.text.secondary} />
              <Text style={styles.settingText}>Notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.gray[400]} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="help-circle-outline" size={24} color={colors.text.secondary} />
              <Text style={styles.settingText}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.gray[400]} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="information-circle-outline" size={24} color={colors.text.secondary} />
              <Text style={styles.settingText}>About</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.gray[400]} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
            <View style={styles.settingLeft}>
              <Ionicons name="log-out-outline" size={24} color={colors.accent.error} />
              <Text style={[styles.settingText, styles.logoutText]}>Sign Out</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.gray[400]} />
          </TouchableOpacity>
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
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  userEmail: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  userPhone: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
  },
  subscriptionCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    ...shadows.md,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  subscriptionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginLeft: spacing.sm,
  },
  subscriptionInfo: {
    marginBottom: spacing.lg,
  },
  subscriptionName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subscriptionDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  subscriptionPrice: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.accent.primary,
    marginBottom: spacing.sm,
  },
  creditsInfo: {
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
  },
  creditsText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
  },
  noSubscription: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  noSubscriptionText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  subscribeButton: {
    backgroundColor: colors.accent.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  subscribeButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.lg,
    borderTopColor: colors.border.light,
    borderTopWidth: 1,
  },
  manageButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.accent.primary,
    fontWeight: typography.fontWeight.medium,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    minWidth: 80,
    ...shadows.sm,
  },
  statNumber: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.accent.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    textAlign: 'center',
    flexWrap: 'nowrap',
  },
  appointmentsSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.lg,
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
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.gray[200],
  },
  statusCompleted: {
    backgroundColor: colors.accent.success,
  },
  statusConfirmed: {
    backgroundColor: colors.accent.primary,
  },
  statusScheduled: {
    backgroundColor: colors.accent.warning,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  statusTextCompleted: {
    color: colors.white,
  },
  statusTextConfirmed: {
    color: colors.white,
  },
  statusTextScheduled: {
    color: colors.white,
  },
  settingsSection: {
    marginBottom: spacing.xl,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    marginLeft: spacing.md,
  },
  logoutText: {
    color: colors.accent.error,
  },
});

export default ProfileScreen;
