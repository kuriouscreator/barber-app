import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, Platform } from 'react-native';
import RBSheet from 'react-native-raw-bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Calendar from 'expo-calendar';
import { format, parse } from 'date-fns';
import { colors } from '../theme/colors';
import { cleanScheduler } from '../theme/cleanScheduler';
import { Appointment, UserRole } from '../types';
import { ActionListItem } from './native/ActionListItem';
import { triggerHaptic } from '../utils/haptics';
import { AppointmentService } from '../services/AppointmentService';

interface AppointmentDetailSheetProps {
  appointment: Appointment | null;
  userRole?: UserRole;
  onClose: () => void;
  onReschedule?: (appointment: Appointment) => void;
  onCancel?: (appointment: Appointment) => void;
  onReview?: (appointment: Appointment) => void;
  onRebook?: (appointment: Appointment) => void;
  onViewBarberProfile?: (appointment: Appointment) => void;
  onStatusUpdated?: () => void; // Callback when status is updated by barber
}

export const AppointmentDetailSheet = forwardRef<any, AppointmentDetailSheetProps>(
  ({ appointment, userRole, onClose, onReschedule, onCancel, onReview, onRebook, onViewBarberProfile, onStatusUpdated }, ref) => {
    const rbSheetRef = useRef<any>(null);
    const insets = useSafeAreaInsets();

    // Expose open and close methods to parent
    useImperativeHandle(ref, () => ({
      open: () => rbSheetRef.current?.open(),
      snapToIndex: (index: number) => {
        if (index === 0) rbSheetRef.current?.open();
      },
      close: () => rbSheetRef.current?.close(),
    }));

    if (!appointment) return null;

    // Determine viewing context
    const isBarberView = userRole === 'barber';
    const isWalkIn = appointment.appointmentType === 'walk_in';

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

      if (isUpcoming && isBarberView) {
        Alert.alert(
          'Manage Appointment',
          'What would you like to do?',
          [
            { text: 'Mark Complete', onPress: () => handleMarkComplete() },
            { text: 'Mark No-show', onPress: () => handleMarkNoShow() },
            {
              text: 'Cancel Appointment',
              style: 'destructive',
              onPress: () => handleCancelAppointment(),
            },
            { text: 'Close', style: 'cancel' },
          ]
        );
        return;
      }

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

    // Barber-specific status update handlers
    const handleMarkComplete = async () => {
      triggerHaptic('medium');
      Alert.alert(
        'Mark as Completed',
        'Mark this appointment as completed?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Complete',
            onPress: async () => {
              try {
                await AppointmentService.updateAppointmentStatus(appointment.id, 'completed');
                triggerHaptic('success');
                Alert.alert('Success', 'Appointment marked as completed');
                onClose();
                if (onStatusUpdated) {
                  setTimeout(() => onStatusUpdated(), 300);
                }
              } catch (error: any) {
                console.error('Error updating appointment status:', error);
                Alert.alert('Error', error.message || 'Failed to update appointment');
              }
            },
          },
        ]
      );
    };

    const handleMarkNoShow = async () => {
      triggerHaptic('medium');
      Alert.alert(
        'Mark as No-show',
        'Mark this customer as a no-show? This cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm',
            style: 'destructive',
            onPress: async () => {
              try {
                await AppointmentService.updateAppointmentStatus(appointment.id, 'no_show');
                triggerHaptic('success');
                Alert.alert('Updated', 'Appointment marked as no-show');
                onClose();
                if (onStatusUpdated) {
                  setTimeout(() => onStatusUpdated(), 300);
                }
              } catch (error: any) {
                console.error('Error updating appointment status:', error);
                Alert.alert('Error', error.message || 'Failed to update appointment');
              }
            },
          },
        ]
      );
    };

    const handleCancelAppointment = async () => {
      triggerHaptic('medium');
      Alert.alert(
        'Cancel Appointment',
        'Are you sure you want to cancel this appointment?',
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Yes, Cancel',
            style: 'destructive',
            onPress: async () => {
              try {
                if (onCancel) {
                  // Use existing cancel handler if provided
                  onClose();
                  setTimeout(() => onCancel(appointment), 300);
                } else if (isBarberView) {
                  // Barber direct cancel
                  await AppointmentService.updateAppointmentStatus(appointment.id, 'cancelled');
                  triggerHaptic('success');
                  Alert.alert('Cancelled', 'Appointment has been cancelled');
                  onClose();
                  if (onStatusUpdated) {
                    setTimeout(() => onStatusUpdated(), 300);
                  }
                }
              } catch (error: any) {
                console.error('Error cancelling appointment:', error);
                Alert.alert('Error', error.message || 'Failed to cancel appointment');
              }
            },
          },
        ]
      );
    };

    const formatPaymentMethod = (method?: string): string => {
      if (!method) return 'Not specified';
      if (method.startsWith('card_')) return `Card •••• ${method.slice(-4)}`;
      return method;
    };

    const primaryButtonLabel = appointment.status === 'scheduled' ? 'Manage' : 'View';

    return (
      <RBSheet
        ref={rbSheetRef}
        height={700}
        openDuration={250}
        closeDuration={200}
        onClose={onClose}
        customStyles={{
          wrapper: { backgroundColor: 'rgba(0,0,0,0.5)' },
          container: {
            borderTopLeftRadius: cleanScheduler.sheet.radius,
            borderTopRightRadius: cleanScheduler.sheet.radius,
            backgroundColor: colors.white,
          },
          draggableIcon: { display: 'none' },
        }}
      >
        <View style={styles.sheetInner}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Appointment details</Text>
            <TouchableOpacity onPress={() => rbSheetRef.current?.close()} style={styles.sheetCloseBtn}>
              <Ionicons name="close" size={24} color={cleanScheduler.text.subtext} />
            </TouchableOpacity>
          </View>
          <View style={styles.sheetHeaderDivider} />

          {/* Body */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Hero */}
            <View style={styles.heroSection}>
              {isWalkIn && (
                <View style={styles.walkInTag}>
                  <Text style={styles.walkInTagText}>Walk-in</Text>
                </View>
              )}
              <Text style={styles.heroDate}>{formatAppointmentDate(appointment.appointmentDate)} at {formatAppointmentTime(appointment.appointmentTime)}</Text>
              <View style={styles.durationRow}>
                <Ionicons name="time-outline" size={16} color={cleanScheduler.text.subtext} />
                <Text style={styles.durationText}>{appointment.serviceDuration} min duration</Text>
              </View>
            </View>

            {/* Customer actions (calendar, directions) - customer only */}
            {!isBarberView && (
              <View style={styles.actionItems}>
                <ActionListItem
                  icon="calendar-outline"
                  iconColor={cleanScheduler.text.body}
                  iconBackgroundColor={cleanScheduler.secondary.bg}
                  title="Add to calendar"
                  subtitle="Set yourself a reminder"
                  onPress={handleAddToCalendar}
                />
                <ActionListItem
                  icon="navigate-outline"
                  iconColor={cleanScheduler.text.body}
                  iconBackgroundColor={cleanScheduler.secondary.bg}
                  title="Getting there"
                  subtitle={
                    appointment.venue
                      ? `${appointment.venue.address}, ${appointment.venue.city}, ${appointment.venue.state}`
                      : appointment.location || 'Location not available'
                  }
                  onPress={handleGetDirections}
                />
              </View>
            )}

            {/* Summary card */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Service</Text>
                <Text style={styles.summaryValue}>{appointment.serviceName}</Text>
                <Text style={styles.summaryPrice}>
                  {isWalkIn ? `$${appointment.servicePrice?.toFixed(2) || '0.00'}` : '1 cut'}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Customer</Text>
                <View style={styles.summaryValueBlock}>
                  <Text style={styles.summaryValue}>
                    {isWalkIn ? (appointment.customerName || 'Walk-in Customer') : (appointment.customer?.full_name || 'Customer')}
                  </Text>
                  {(isWalkIn ? appointment.customerPhone : appointment.customer?.email) && (
                    <Text style={styles.summarySubtext}>
                      {isWalkIn ? appointment.customerPhone : appointment.customer?.email}
                    </Text>
                  )}
                </View>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Payment</Text>
                <View style={styles.infoBox}>
                  <Text style={styles.infoBoxText}>
                    {isWalkIn ? 'Cash payment • Not from subscription' : formatPaymentMethod(appointment.paymentMethod) + ' • 1 cut used from subscription'}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.sheetFooterDivider} />
          <View style={[styles.sheetFooter, { paddingBottom: 16 + insets.bottom }]}>
            <TouchableOpacity style={styles.footerCancelButton} onPress={() => rbSheetRef.current?.close()}>
              <Text style={styles.footerCancelText}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.footerPrimaryButton} onPress={handleManageAppointment}>
              <Text style={styles.footerPrimaryText}>{primaryButtonLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </RBSheet>
    );
  }
);

AppointmentDetailSheet.displayName = 'AppointmentDetailSheet';

const styles = StyleSheet.create({
  sheetInner: {
    flex: 1,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: cleanScheduler.padding,
    paddingVertical: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: cleanScheduler.text.heading,
  },
  sheetCloseBtn: {
    padding: 4,
  },
  sheetHeaderDivider: {
    height: 1,
    backgroundColor: cleanScheduler.card.border,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: cleanScheduler.padding,
    paddingTop: cleanScheduler.sectionSpacing,
    paddingBottom: 100,
  },
  heroSection: {
    marginBottom: cleanScheduler.sectionSpacing,
  },
  walkInTag: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(243,156,18,0.15)',
    borderWidth: 1,
    borderColor: cleanScheduler.status.warning,
    marginBottom: 8,
  },
  walkInTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: cleanScheduler.status.warning,
  },
  heroDate: {
    fontSize: 18,
    fontWeight: '600',
    color: cleanScheduler.text.heading,
    lineHeight: 24,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  durationText: {
    fontSize: 14,
    fontWeight: '500',
    color: cleanScheduler.text.subtext,
    lineHeight: 20,
  },
  actionItems: {
    gap: 12,
    marginBottom: cleanScheduler.sectionSpacing,
  },
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: cleanScheduler.card.radius,
    borderWidth: 1,
    borderColor: cleanScheduler.card.border,
    padding: cleanScheduler.padding,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: cleanScheduler.text.subtext,
    minWidth: 72,
  },
  summaryValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: cleanScheduler.text.heading,
  },
  summaryValueBlock: {
    flex: 1,
  },
  summarySubtext: {
    fontSize: 12,
    color: cleanScheduler.text.subtext,
    marginTop: 2,
  },
  summaryPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: cleanScheduler.text.heading,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: cleanScheduler.card.border,
    marginVertical: 12,
  },
  infoBox: {
    flex: 1,
    backgroundColor: cleanScheduler.secondary.bg,
    borderRadius: 8,
    padding: 12,
  },
  infoBoxText: {
    fontSize: 13,
    color: cleanScheduler.text.body,
  },
  sheetFooterDivider: {
    height: 1,
    backgroundColor: cleanScheduler.card.border,
  },
  sheetFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: cleanScheduler.padding,
    paddingTop: 16,
  },
  footerCancelButton: {
    flex: 1,
    backgroundColor: cleanScheduler.secondary.bg,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: cleanScheduler.text.heading,
  },
  footerPrimaryButton: {
    flex: 1,
    backgroundColor: cleanScheduler.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});
