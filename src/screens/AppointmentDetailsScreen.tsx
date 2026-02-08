import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList, Appointment } from '../types';
import { colors } from '../theme/colors';
import { haptics } from '../utils/haptics';

type AppointmentDetailsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'AppointmentDetails'
>;
type AppointmentDetailsScreenRouteProp = RouteProp<
  RootStackParamList,
  'AppointmentDetails'
>;

interface Props {
  navigation: AppointmentDetailsScreenNavigationProp;
  route: AppointmentDetailsScreenRouteProp;
}

const AppointmentDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { appointment } = route.params;

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Format time to 12-hour
  const formatTime = (time24: string) => {
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const handleAddToCalendar = () => {
    haptics.light();
    Alert.alert('Add to Calendar', 'Calendar integration coming soon');
  };

  const handleGetDirections = () => {
    haptics.light();
    Alert.alert('Get Directions', 'Navigate to the venue');
  };

  const handleManageAppointment = () => {
    haptics.light();
    navigation.goBack();
    // TODO: Navigate to manage appointment screen
  };

  const handleVenueDetails = () => {
    haptics.light();
    Alert.alert('Venue Details', 'View venue information');
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Image Section */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.8)']}
            style={styles.gradient}
            locations={[0, 0.5, 1]}
          />

          {/* Top Buttons */}
          <View style={styles.topButtons}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => {
                haptics.light();
                navigation.goBack();
              }}
            >
              <Ionicons name="chevron-back" size={16} color={colors.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => haptics.light()}>
              <Ionicons name="share-outline" size={16} color={colors.white} />
            </TouchableOpacity>
          </View>

          {/* Venue Info */}
          <View style={styles.venueInfo}>
            <View style={styles.topRatedBadge}>
              <Ionicons name="star" size={12} color={colors.white} />
              <Text style={styles.topRatedText}>TOP RATED VENUE</Text>
            </View>
            <Text style={styles.venueName}>
              {appointment.venue?.name || 'Crown & Blade Lounge'}
            </Text>
            <View style={styles.venueMetaRow}>
              <Ionicons name="location" size={12} color={colors.gray[300]} />
              <Text style={styles.venueMeta}>
                Downtown • 4.9 (1.2k reviews)
              </Text>
            </View>
          </View>
        </View>

        {/* Main Content Card */}
        <View style={styles.mainCard}>
          {/* Booking Confirmed Badge */}
          <View style={styles.confirmedSection}>
            <View style={styles.confirmedBadge}>
              <View style={styles.confirmedIcon}>
                <Ionicons name="checkmark" size={10} color={colors.white} />
              </View>
              <Text style={styles.confirmedText}>Booking Confirmed</Text>
            </View>

            {/* Date and Time */}
            <View style={styles.dateTimeSection}>
              <Text style={styles.dateText}>{formatDate(appointment.appointmentDate)}</Text>
              <Text style={styles.timeText}>
                at {formatTime(appointment.appointmentTime)}
              </Text>
              <View style={styles.durationRow}>
                <Ionicons name="time-outline" size={16} color={colors.gray[600]} />
                <Text style={styles.durationText}>
                  {appointment.serviceDuration || 45} min duration
                </Text>
              </View>
            </View>
          </View>

          {/* Action Items */}
          <View style={styles.actionsSection}>
            <TouchableOpacity style={styles.actionItem} onPress={handleAddToCalendar}>
              <View style={[styles.actionIcon, { backgroundColor: colors.gray[100] }]}>
                <Ionicons name="calendar-outline" size={18} color={colors.gray[700]} />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Add to calendar</Text>
                <Text style={styles.actionSubtitle}>Set yourself a reminder</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color={colors.gray[400]} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem} onPress={handleGetDirections}>
              <View style={[styles.actionIcon, { backgroundColor: colors.gray[100] }]}>
                <Ionicons name="navigate-outline" size={18} color={colors.gray[700]} />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Getting there</Text>
                <Text style={styles.actionSubtitle}>
                  {appointment.venue?.address || '7683 Thornton Avenue, Newark, CA'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color={colors.gray[400]} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem} onPress={handleManageAppointment}>
              <View style={[styles.actionIcon, { backgroundColor: '#FFF7ED' }]}>
                <Ionicons name="create-outline" size={18} color={colors.orange[600]} />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Manage appointment</Text>
                <Text style={styles.actionSubtitle}>Reschedule or cancel booking</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color={colors.gray[400]} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem} onPress={handleVenueDetails}>
              <View style={[styles.actionIcon, { backgroundColor: 'colors.gray[100]' }]}>
                <Ionicons name="business-outline" size={18} color={colors.gray[600]} />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Venue details</Text>
                <Text style={styles.actionSubtitle}>
                  {appointment.venue?.name || 'Crown & Blade Lounge'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color={colors.gray[400]} />
            </TouchableOpacity>
          </View>

          {/* Order Summary */}
          <View style={styles.orderSummary}>
            <Text style={styles.orderSummaryTitle}>ORDER SUMMARY</Text>

            <View style={styles.serviceRow}>
              <Image
                source={{
                  uri:
                    appointment.barberAvatar ||
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
                }}
                style={styles.barberAvatar}
              />
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{appointment.serviceName}</Text>
                <Text style={styles.barberName}>
                  with {appointment.barberName || 'Marcus R.'}
                </Text>
              </View>
              <Text style={styles.servicePrice}>${appointment.servicePrice}.00</Text>
            </View>

            <View style={styles.paymentMethodRow}>
              <Text style={styles.paymentLabel}>Payment Method</Text>
              <View style={styles.paymentValue}>
                <Ionicons name="card" size={12} color={colors.gray[600]} />
                <Text style={styles.paymentText}>Visa •••• 4242</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  // Hero Section
  heroSection: {
    height: 320,
    backgroundColor: '#111827',
    position: 'relative',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topButtons: {
    position: 'absolute',
    top: 56,
    left: 24,
    right: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    backdropFilter: 'blur(6px)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  venueInfo: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
  },
  topRatedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(6px)',
    borderRadius: 8,
    paddingHorizontal: 11,
    paddingVertical: 5,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  topRatedText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.25,
    textTransform: 'uppercase',
  },
  venueName: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.white,
    lineHeight: 37.5,
    marginBottom: 8,
  },
  venueMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  venueMeta: {
    fontSize: 14,
    fontWeight: '500',
    color: '#D1D5DB',
  },

  // Main Card
  mainCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 8,
    paddingBottom: 16,
  },

  // Confirmed Section
  confirmedSection: {
    borderBottomWidth: 1,
    borderBottomColor: 'colors.gray[100]',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 25,
    gap: 19,
  },
  confirmedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 9999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  confirmedIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmedText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.black,
  },
  dateTimeSection: {
    gap: 8,
  },
  dateText: {
    fontSize: 30,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 37.5,
  },
  timeText: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.black,
    lineHeight: 37.5,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  durationText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },

  // Actions Section
  actionsSection: {
    padding: 24,
    gap: 24,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTextContainer: {
    flex: 1,
    paddingTop: 4,
    gap: 2,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 24,
  },
  actionSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 20,
  },

  // Order Summary
  orderSummary: {
    marginHorizontal: 24,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 21,
    gap: 16,
  },
  orderSummaryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingBottom: 17,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  barberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 24,
  },
  barberName: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 20,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 24,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 20,
  },
  paymentValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  paymentText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.black,
    lineHeight: 20,
  },
});

export default AppointmentDetailsScreen;
