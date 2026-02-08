import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Linking, Platform } from 'react-native';
import RBSheet from 'react-native-raw-bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import * as Calendar from 'expo-calendar';
import { format, parse } from 'date-fns';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { componentTokens } from '../theme/components';
import { Appointment } from '../types';
import { ActionListItem } from './native/ActionListItem';
import { triggerHaptic } from '../utils/haptics';

interface AppointmentDetailSheetProps {
  appointment: Appointment | null;
  onClose: () => void;
  onReschedule?: (appointment: Appointment) => void;
  onCancel?: (appointment: Appointment) => void;
  onReview?: (appointment: Appointment) => void;
  onRebook?: (appointment: Appointment) => void;
  onViewBarberProfile?: (appointment: Appointment) => void;
}

export const AppointmentDetailSheet = forwardRef<any, AppointmentDetailSheetProps>(
  ({ appointment, onClose, onReschedule, onCancel, onReview, onRebook, onViewBarberProfile }, ref) => {
    const rbSheetRef = useRef<any>(null);

    // Expose open and close methods to parent
    useImperativeHandle(ref, () => ({
      open: () => rbSheetRef.current?.open(),
      snapToIndex: (index: number) => {
        if (index === 0) rbSheetRef.current?.open();
      },
      close: () => rbSheetRef.current?.close(),
    }));

    if (!appointment) return null;

    const formatAppointmentDate = (date: string): string => {
      const parsedDate = parse(date, 'yyyy-MM-dd', new Date());
      return format(parsedDate, 'EEE, MMM dd, yyyy');
    };

    const formatAppointmentTime = (time: string): string => {
      const [hours, minutes] = time.split(':');
      const parsedTime = new Date();
      parsedTime.setHours(parseInt(hours, 10), parseInt(minutes, 10));
      return format(parsedTime, 'h:mm a');
    };

    const getStatusConfig = () => {
      switch (appointment.status) {
        case 'scheduled':
          return {
            icon: 'checkmark',
            text: 'Booking Confirmed',
            backgroundColor: 'rgba(99,102,241,0.1)',
            textColor: colors.gray[600],
            iconColor: colors.gray[600],
            iconBackgroundColor: colors.gray[600],
          };
        case 'completed':
          return {
            icon: 'checkmark-circle',
            text: 'Completed',
            backgroundColor: 'rgba(34,197,94,0.1)',
            textColor: colors.green[600],
            iconColor: colors.green[600],
            iconBackgroundColor: colors.green[600],
          };
        case 'cancelled':
          return {
            icon: 'close-circle',
            text: 'Cancelled',
            backgroundColor: 'rgba(239,68,68,0.1)',
            textColor: colors.red[500],
            iconColor: colors.red[500],
            iconBackgroundColor: colors.red[500],
          };
        default:
          return {
            icon: 'time',
            text: 'Scheduled',
            backgroundColor: 'rgba(99,102,241,0.1)',
            textColor: colors.gray[600],
            iconColor: colors.gray[600],
            iconBackgroundColor: colors.gray[600],
          };
      }
    };

    const statusConfig = getStatusConfig();

    const handleAddToCalendar = async () => {
      try {
        triggerHaptic('medium');
        const { status } = await Calendar.requestCalendarPermissionsAsync();

        if (status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Calendar access is needed to add appointment reminders.',
            [{ text: 'OK' }]
          );
          return;
        }

        const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
        const defaultCalendar = calendars.find(cal => cal.allowsModifications) || calendars[0];

        if (!defaultCalendar) {
          Alert.alert('Error', 'No calendar available');
          return;
        }

        const appointmentDateTime = parse(
          `${appointment.appointmentDate} ${appointment.appointmentTime}`,
          'yyyy-MM-dd HH:mm',
          new Date()
        );
        const endDateTime = new Date(appointmentDateTime.getTime() + appointment.serviceDuration * 60000);

        const eventId = await Calendar.createEventAsync(defaultCalendar.id, {
          title: `${appointment.serviceName} - ${appointment.venue?.name || 'Barber Appointment'}`,
          startDate: appointmentDateTime,
          endDate: endDateTime,
          location: appointment.location || appointment.venue?.address,
          notes: appointment.specialRequests,
          alarms: [{ relativeOffset: -60 }, { relativeOffset: -1440 }], // 1 hour and 1 day before
        });

        if (eventId) {
          triggerHaptic('success');
          Alert.alert('Success', 'Appointment added to your calendar!');
        }
      } catch (error) {
        console.error('Error adding to calendar:', error);
        Alert.alert('Error', 'Could not add to calendar. Please try again.');
      }
    };

    const handleGetDirections = () => {
      triggerHaptic('light');
      const venue = appointment.venue;
      if (!venue) {
        Alert.alert('Error', 'Location information not available');
        return;
      }

      const address = `${venue.address}, ${venue.city}, ${venue.state} ${venue.zipCode}`;
      const encodedAddress = encodeURIComponent(address);

      const url = Platform.select({
        ios: `maps://app?daddr=${encodedAddress}`,
        android: `google.navigation:q=${encodedAddress}`,
      });

      if (url) {
        Linking.canOpenURL(url).then((supported) => {
          if (supported) {
            Linking.openURL(url);
          } else {
            // Fallback to Google Maps web
            Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`);
          }
        });
      }
    };

    const handleManageAppointment = () => {
      triggerHaptic('medium');
      const isUpcoming = appointment.status === 'scheduled';

      if (isUpcoming) {
        Alert.alert(
          'Manage Appointment',
          'What would you like to do?',
          [
            {
              text: 'Reschedule',
              onPress: () => {
                onClose();
                setTimeout(() => onReschedule?.(appointment), 300);
              },
            },
            {
              text: 'Cancel Booking',
              style: 'destructive',
              onPress: () => {
                Alert.alert(
                  'Cancel Appointment',
                  'Are you sure you want to cancel this appointment?',
                  [
                    { text: 'No', style: 'cancel' },
                    {
                      text: 'Yes, Cancel',
                      style: 'destructive',
                      onPress: () => {
                        onClose();
                        setTimeout(() => onCancel?.(appointment), 300);
                      },
                    },
                  ]
                );
              },
            },
            { text: 'Close', style: 'cancel' },
          ]
        );
      } else if (appointment.status === 'completed') {
        if (appointment.rating) {
          Alert.alert(
            'Rebook Appointment',
            'Book the same service again?',
            [
              {
                text: 'Rebook',
                onPress: () => {
                  onClose();
                  setTimeout(() => onRebook?.(appointment), 300);
                },
              },
              { text: 'Cancel', style: 'cancel' },
            ]
          );
        } else {
          Alert.alert(
            'Manage Appointment',
            'What would you like to do?',
            [
              {
                text: 'Leave a Review',
                onPress: () => {
                  onClose();
                  setTimeout(() => onReview?.(appointment), 300);
                },
              },
              {
                text: 'Rebook',
                onPress: () => {
                  onClose();
                  setTimeout(() => onRebook?.(appointment), 300);
                },
              },
              { text: 'Cancel', style: 'cancel' },
            ]
          );
        }
      }
    };

    const handleVenueDetails = () => {
      triggerHaptic('light');
      if (onViewBarberProfile) {
        onClose();
        setTimeout(() => onViewBarberProfile(appointment), 300);
      }
    };

    const formatPaymentMethod = (method?: string): string => {
      if (!method) return 'Not specified';
      if (method.startsWith('card_')) return `Card •••• ${method.slice(-4)}`;
      return method;
    };

    return (
      <RBSheet
        ref={rbSheetRef}
        height={700}
        openDuration={250}
        closeDuration={200}
        onClose={onClose}
        customStyles={{
          wrapper: {
            backgroundColor: 'rgba(0,0,0,0.5)',
          },
          container: {
            borderTopLeftRadius: componentTokens.bottomSheet.borderRadius,
            borderTopRightRadius: componentTokens.bottomSheet.borderRadius,
            backgroundColor: colors.white,
          },
          draggableIcon: {
            backgroundColor: componentTokens.bottomSheet.handleColor,
            width: componentTokens.bottomSheet.handleWidth,
            height: componentTokens.bottomSheet.handleHeight,
          },
        }}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Content */}
          <View style={styles.mainContent}>
            {/* Date and Time */}
            <View style={[styles.dateTimeContainer, { paddingTop: 32 }]}>
              <Text style={styles.dateText}>{formatAppointmentDate(appointment.appointmentDate)}</Text>
              <Text style={styles.timeText}>at {formatAppointmentTime(appointment.appointmentTime)}</Text>
              <View style={styles.durationRow}>
                <Ionicons name="time-outline" size={16} color={colors.gray[500]} />
                <Text style={styles.durationText}>{appointment.serviceDuration} min duration</Text>
              </View>
            </View>

            {/* Action Items */}
            <View style={styles.actionItems}>
              <ActionListItem
                icon="calendar-outline"
                iconColor={colors.gray[700]}
                iconBackgroundColor={colors.gray[100]}
                title="Add to calendar"
                subtitle="Set yourself a reminder"
                onPress={handleAddToCalendar}
              />
              <ActionListItem
                icon="navigate-outline"
                iconColor={colors.gray[700]}
                iconBackgroundColor={colors.gray[100]}
                title="Getting there"
                subtitle={
                  appointment.venue
                    ? `${appointment.venue.address}, ${appointment.venue.city}, ${appointment.venue.state}`
                    : appointment.location || 'Location not available'
                }
                onPress={handleGetDirections}
              />
              <ActionListItem
                icon="calendar"
                iconColor={colors.orange[600]}
                iconBackgroundColor={colors.orange[50]}
                title="Manage appointment"
                subtitle={
                  appointment.status === 'scheduled'
                    ? 'Reschedule or cancel booking'
                    : appointment.rating
                    ? 'Rebook this appointment'
                    : 'Leave a review or rebook'
                }
                onPress={handleManageAppointment}
              />
            </View>

            {/* Order Summary */}
            <View style={styles.orderSummaryContainer}>
              <View style={styles.orderSummaryCard}>
                <Text style={styles.orderSummaryTitle}>ORDER SUMMARY</Text>

                <View style={styles.serviceRow}>
                  <View style={styles.barberImageContainer}>
                    {appointment.barberAvatar ? (
                      <Image
                        source={{ uri: appointment.barberAvatar }}
                        style={styles.barberImage}
                      />
                    ) : (
                      <View style={[styles.barberImage, styles.barberPlaceholder]}>
                        <Ionicons name="person" size={24} color={colors.gray[400]} />
                      </View>
                    )}
                  </View>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>{appointment.serviceName}</Text>
                    <Text style={styles.barberName}>
                      with {appointment.barberName || 'your barber'}
                    </Text>
                  </View>
                  <View style={styles.priceContainer}>
                    <Text style={styles.cutsUsed}>1 cut</Text>
                  </View>
                </View>

                <View style={styles.subscriptionInfoContainer}>
                  <View style={styles.subscriptionRow}>
                    <View style={styles.subscriptionIconContainer}>
                      <Ionicons name="cut-outline" size={16} color={colors.gray[700]} />
                    </View>
                    <View style={styles.subscriptionTextContainer}>
                      <Text style={styles.subscriptionLabel}>Deducted from plan</Text>
                      <Text style={styles.subscriptionValue}>1 cut used from subscription</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Cancel Button for Upcoming Appointments */}
            {appointment.status === 'scheduled' && (
              <View style={styles.cancelButtonContainer}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    triggerHaptic('medium');
                    Alert.alert(
                      'Cancel Appointment',
                      'Are you sure you want to cancel this appointment?',
                      [
                        { text: 'No', style: 'cancel' },
                        {
                          text: 'Yes, Cancel',
                          style: 'destructive',
                          onPress: () => {
                            onClose();
                            setTimeout(() => onCancel?.(appointment), 300);
                          },
                        },
                      ]
                    );
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close-circle-outline" size={20} color={colors.red[600]} />
                  <Text style={styles.cancelButtonText}>Cancel Appointment</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </RBSheet>
    );
  }
);

AppointmentDetailSheet.displayName = 'AppointmentDetailSheet';

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 40,
  },
  mainContent: {
    backgroundColor: colors.white,
    flex: 1,
  },
  statusBadgeContainer: {
    paddingTop: 32,
    paddingHorizontal: 24,
    paddingBottom: 19.25,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 9999,
  },
  statusIcon: {
    width: 20,
    height: 20,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  dateTimeContainer: {
    paddingHorizontal: 24,
    paddingTop: 0,
    paddingBottom: 25,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
    gap: 8,
  },
  dateText: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.gray[900],
    lineHeight: 37.5,
  },
  timeText: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.gray[600],
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
    color: colors.gray[500],
    lineHeight: 24,
  },
  actionItems: {
    padding: 24,
    gap: 24,
  },
  orderSummaryContainer: {
    paddingHorizontal: 24,
  },
  orderSummaryCard: {
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.gray[100],
    borderRadius: 16,
    padding: 21,
    gap: 16,
  },
  orderSummaryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gray[400],
    letterSpacing: 0.6,
    lineHeight: 16,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingBottom: 17,
  },
  barberImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 9999,
    borderWidth: 2,
    borderColor: colors.white,
    overflow: 'hidden',
  },
  barberImage: {
    width: '100%',
    height: '100%',
    borderRadius: 9999,
  },
  barberPlaceholder: {
    backgroundColor: colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray[900],
    lineHeight: 24,
  },
  barberName: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.gray[500],
    lineHeight: 20,
  },
  priceContainer: {
    justifyContent: 'center',
  },
  cutsUsed: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray[900],
    lineHeight: 24,
  },
  subscriptionInfoContainer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  subscriptionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  subscriptionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscriptionTextContainer: {
    flex: 1,
  },
  subscriptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[900],
    lineHeight: 20,
    marginBottom: 2,
  },
  subscriptionValue: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.gray[500],
    lineHeight: 18,
  },
  cancelButtonContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: colors.red[50],
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.red[600],
    lineHeight: 24,
  },
});
