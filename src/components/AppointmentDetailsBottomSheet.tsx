import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import RBSheet from 'react-native-raw-bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { haptics } from '../utils/haptics';
import { Appointment } from '../types';

interface AppointmentDetailsBottomSheetProps {
  appointment: Appointment | null;
  onClose?: () => void;
  onReschedule?: (appointment: Appointment) => void;
  onCancel?: (appointment: Appointment) => void;
}

export const AppointmentDetailsBottomSheet = forwardRef<any, AppointmentDetailsBottomSheetProps>(
  ({ appointment, onClose, onReschedule, onCancel }, ref) => {
    const rbSheetRef = useRef<any>(null);

    // Expose open and close methods to parent
    useImperativeHandle(ref, () => ({
      open: () => rbSheetRef.current?.open(),
      close: () => rbSheetRef.current?.close(),
    }));

    const handleClose = () => {
      rbSheetRef.current?.close();
      if (onClose) onClose();
    };

    if (!appointment) return null;

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
      handleClose();
      // Show manage options
      Alert.alert(
        'Manage Appointment',
        'What would you like to do?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Reschedule',
            onPress: () => {
              if (onReschedule) onReschedule(appointment);
            },
          },
          {
            text: 'Cancel Booking',
            style: 'destructive',
            onPress: () => {
              if (onCancel) onCancel(appointment);
            },
          },
        ]
      );
    };

    const handleVenueDetails = () => {
      haptics.light();
      Alert.alert('Venue Details', 'View venue information');
    };

    return (
      <RBSheet
        ref={rbSheetRef}
        height={700}
        closeOnDragDown
        closeOnPressMask
        customStyles={{
          wrapper: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          },
          draggableIcon: {
            backgroundColor: colors.gray[300],
            width: 40,
            height: 5,
          },
          container: {
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingHorizontal: 0,
          },
        }}
      >
        <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
          {/* Header with Venue Image */}
          <View style={styles.heroSection}>
            <LinearGradient
              colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.8)']}
              style={styles.gradient}
              locations={[0, 0.5, 1]}
            />

            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={24} color={colors.white} />
            </TouchableOpacity>

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

          {/* Main Content */}
          <View style={styles.mainContent}>
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
      </RBSheet>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Hero Section
  heroSection: {
    height: 200,
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
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(6px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  venueInfo: {
    position: 'absolute',
    bottom: 16,
    left: 20,
    right: 20,
  },
  topRatedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(6px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 11,
    paddingVertical: 5,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  topRatedText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.25,
  },
  venueName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 4,
  },
  venueMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  venueMeta: {
    fontSize: 12,
    fontWeight: '500',
    color: '#D1D5DB',
  },

  // Main Content
  mainContent: {
    backgroundColor: colors.white,
    paddingBottom: 20,
  },

  // Confirmed Section
  confirmedSection: {
    borderBottomWidth: 1,
    borderBottomColor: 'colors.gray[100]',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    gap: 16,
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
    gap: 4,
  },
  dateText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 32,
  },
  timeText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.black,
    lineHeight: 32,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  durationText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },

  // Actions Section
  actionsSection: {
    padding: 20,
    gap: 20,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTextContainer: {
    flex: 1,
    paddingTop: 2,
    gap: 2,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 20,
  },
  actionSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 18,
  },

  // Order Summary
  orderSummary: {
    marginHorizontal: 20,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: 'colors.gray[100]',
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  orderSummaryTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  barberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.white,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 20,
  },
  barberName: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 18,
  },
  servicePrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 20,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentLabel: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 18,
  },
  paymentValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  paymentText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.black,
    lineHeight: 18,
  },
});

export default AppointmentDetailsBottomSheet;
