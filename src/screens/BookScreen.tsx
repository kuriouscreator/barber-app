import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { MainTabParamList } from '../types';
import { AvailabilityService } from '../services/AvailabilityService';
import { AppointmentService } from '../services/AppointmentService';
import { CutTrackingService } from '../services/CutTrackingService';
import { supabase } from '../lib/supabase';
import { BUSINESS_INFO } from '../constants/business';

type BookScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Book'>;

interface Props {
  navigation: BookScreenNavigationProp;
  route?: any;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

const BookScreen: React.FC<Props> = ({ navigation, route }) => {
  const { state, bookAppointment, rescheduleAppointment } = useApp();
  const { services, user, userSubscription } = state;

  // Check if this is a reschedule operation
  const rescheduleData = route?.params?.rescheduleAppointment;

  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [specialRequests, setSpecialRequests] = useState<string>('');
  const [remainingCuts, setRemainingCuts] = useState<number>(0);
  const [totalCuts, setTotalCuts] = useState<number>(0);

  // Generate dates for the week
  const [weekDates, setWeekDates] = useState<Date[]>([]);

  // Time slots
  const timeSlots: TimeSlot[] = [
    { time: '9:00 AM', available: false },
    { time: '10:00 AM', available: true },
    { time: '11:00 AM', available: true },
    { time: '12:00 PM', available: true },
    { time: '1:00 PM', available: true },
    { time: '2:00 PM', available: true },
    { time: '2:30 PM', available: true },
    { time: '3:30 PM', available: true },
    { time: '4:00 PM', available: true },
    { time: '5:00 PM', available: true },
    { time: '6:00 PM', available: false },
    { time: '7:00 PM', available: false },
  ];

  useEffect(() => {
    generateWeekDates();
    loadCutStatus();
    loadFavoriteService();
  }, [user?.id]);

  const generateWeekDates = (startDate?: Date) => {
    const dates: Date[] = [];
    const baseDate = startDate || new Date();
    baseDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < 5; i++) {
      const date = new Date(baseDate);
      date.setDate(baseDate.getDate() + i);
      dates.push(date);
    }

    setWeekDates(dates);
    if (!startDate) {
      setSelectedDate(dates[1]); // Default to tomorrow only on initial load
    }
  };

  const handlePreviousWeek = () => {
    const newStartDate = new Date(weekDates[0]);
    newStartDate.setDate(newStartDate.getDate() - 5);

    // Don't allow going before today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (newStartDate < today) {
      generateWeekDates(today);
    } else {
      generateWeekDates(newStartDate);
    }
  };

  const handleNextWeek = () => {
    const newStartDate = new Date(weekDates[0]);
    newStartDate.setDate(newStartDate.getDate() + 5);
    generateWeekDates(newStartDate);
  };

  const loadCutStatus = async () => {
    try {
      const cutStatus = await CutTrackingService.getCutStatus();
      setRemainingCuts(cutStatus.remainingCuts);
      setTotalCuts(cutStatus.totalCuts);
    } catch (error) {
      console.error('Error loading cut status:', error);
    }
  };

  const loadFavoriteService = async () => {
    try {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from('favorite_services')
        .select('service_id')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "no rows returned", which is fine (no favorite set)
        console.error('Error loading favorite service:', error);
        return;
      }

      if (data?.service_id) {
        setSelectedService(data.service_id);
      }
    } catch (error) {
      console.error('Error loading favorite service:', error);
    }
  };

  const formatDate = (date: Date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return {
      day: days[date.getDay()],
      date: date.getDate(),
    };
  };

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getSelectedService = () => {
    return services.find(s => s.id === selectedService);
  };

  const handleConfirmBooking = async () => {
    if (!selectedService || !selectedDate || !selectedTime) {
      Alert.alert('Missing Information', 'Please select a service, date, and time.');
      return;
    }

    // Only check remaining cuts for new bookings, not reschedules
    if (!rescheduleData && remainingCuts <= 0) {
      Alert.alert('No Cuts Remaining', 'You have no cuts remaining in your plan. Please upgrade your membership.');
      return;
    }

    try {
      const service = getSelectedService();
      if (!service) return;

      const appointmentData = {
        serviceId: service.id,
        serviceName: service.name,
        serviceDuration: service.duration,
        servicePrice: service.price,
        appointmentDate: selectedDate.toISOString().split('T')[0],
        appointmentTime: selectedTime,
        specialRequests: specialRequests || undefined,
        barberId: '1', // Default barber
      };

      if (rescheduleData) {
        // Rescheduling an existing appointment
        console.log('Rescheduling appointment:', rescheduleData.id);
        await rescheduleAppointment(rescheduleData.id, appointmentData);

        Alert.alert(
          'Appointment Rescheduled!',
          `Your appointment has been rescheduled to ${selectedDate.toLocaleDateString()} at ${selectedTime}.`,
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Appointments'),
            },
          ]
        );
      } else {
        // Creating a new appointment
        await bookAppointment(appointmentData);

        Alert.alert(
          'Booking Confirmed!',
          `Your appointment for ${service.name} on ${selectedDate.toLocaleDateString()} at ${selectedTime} has been confirmed.`,
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Appointments'),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error with appointment:', error);
      Alert.alert('Error', rescheduleData ? 'Failed to reschedule appointment.' : 'Failed to book appointment.');
    }
  };

  const service = getSelectedService();
  const planName = userSubscription?.plan_name || 'Pro';

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Section */}
        <LinearGradient
          colors={['#0F172A', '#0F172A']}
          style={styles.header}
        >
          <LinearGradient
            colors={['rgba(51, 65, 85, 0.4)', '#0F172A']}
            style={StyleSheet.absoluteFill}
          />

          {/* Venue Info */}
          <View style={styles.venueInfo}>
            <Text style={styles.venueName}>{BUSINESS_INFO.name}</Text>

            <View style={styles.venueMetaRow}>
              <View style={styles.venueMetaItem}>
                <Ionicons name="location" size={12} color="#D1D5DB" />
                <Text style={styles.venueMetaText}>Downtown</Text>
              </View>
              <View style={styles.metaDot} />
              <View style={styles.venueMetaItem}>
                <Ionicons name="star" size={12} color="#FCD34D" />
                <Text style={styles.venueRating}>4.9</Text>
                <Text style={styles.venueReviews}>(1.2k reviews)</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Membership Status Card */}
          <View style={styles.membershipCard}>
            <View style={styles.membershipLeft}>
              <View style={styles.membershipIcon}>
                <Ionicons name="shield-checkmark" size={16} color={colors.black} />
              </View>
              <View>
                <Text style={styles.membershipLabel}>MEMBERSHIP: {planName.toUpperCase()}</Text>
                <Text style={styles.membershipValue}>{remainingCuts} cuts left this month</Text>
              </View>
            </View>
          </View>

          {/* Service Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Service</Text>
            <View style={styles.serviceList}>
              {services.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[
                    styles.serviceCard,
                    selectedService === s.id && styles.serviceCardSelected
                  ]}
                  onPress={() => setSelectedService(s.id)}
                >
                  <View style={styles.serviceCardHeader}>
                    <Text style={styles.serviceTitle}>{s.name}</Text>
                    <View style={[
                      styles.radioButton,
                      selectedService === s.id && styles.radioButtonSelected
                    ]}>
                      {selectedService === s.id && <View style={styles.radioButtonInner} />}
                    </View>
                  </View>
                  <Text style={styles.serviceDescription}>{s.description}</Text>
                  <View style={styles.serviceFooter}>
                    <View style={styles.serviceDuration}>
                      <Ionicons name="time-outline" size={12} color="colors.gray[700]" />
                      <Text style={styles.serviceDurationText}>{s.duration} min</Text>
                    </View>
                    <Text style={[
                      styles.servicePrice,
                      selectedService === s.id && styles.servicePriceSelected
                    ]}>
                      ${s.price.toFixed(2)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Date & Time Picker */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Date & Time</Text>

            {/* Date Picker */}
            <View style={styles.datePicker}>
              <View style={styles.datePickerHeader}>
                <Text style={styles.monthLabel}>{formatMonth(selectedDate)}</Text>
                <View style={styles.monthNavButtons}>
                  <TouchableOpacity style={styles.monthNavButton} onPress={handlePreviousWeek}>
                    <Ionicons name="chevron-back" size={12} color={colors.gray[700]} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.monthNavButton} onPress={handleNextWeek}>
                    <Ionicons name="chevron-forward" size={12} color={colors.gray[700]} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.dateScroller}>
                {weekDates.map((date, index) => {
                  const formatted = formatDate(date);
                  const isSelected = selectedDate.toDateString() === date.toDateString();

                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dateButton,
                        isSelected && styles.dateButtonSelected
                      ]}
                      onPress={() => setSelectedDate(date)}
                    >
                      <Text style={[
                        styles.dateDayLabel,
                        isSelected && styles.dateDayLabelSelected
                      ]}>
                        {formatted.day}
                      </Text>
                      <Text style={[
                        styles.dateDateLabel,
                        isSelected && styles.dateDateLabelSelected
                      ]}>
                        {formatted.date}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Time Slots */}
            <View style={styles.timeSlotGrid}>
              {timeSlots.map((slot, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.timeSlotButton,
                    !slot.available && styles.timeSlotButtonDisabled,
                    selectedTime === slot.time && styles.timeSlotButtonSelected
                  ]}
                  onPress={() => slot.available && setSelectedTime(slot.time)}
                  disabled={!slot.available}
                >
                  <Text style={[
                    styles.timeSlotText,
                    !slot.available && styles.timeSlotTextDisabled,
                    selectedTime === slot.time && styles.timeSlotTextSelected
                  ]}>
                    {slot.time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Special Requests */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Special Requests</Text>
            <View style={styles.textareaCard}>
              <TextInput
                style={styles.textarea}
                placeholder="Add any special requests or preferences for your barber..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                value={specialRequests}
                onChangeText={setSpecialRequests}
                maxLength={200}
              />
              <View style={styles.textareaFooter}>
                <Text style={styles.textareaLabel}>Optional</Text>
                <Text style={styles.textareaCount}>{specialRequests.length}/200</Text>
              </View>
            </View>
          </View>

          {/* Booking Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Booking Summary</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryItems}>
                {/* Barber */}
                <View style={styles.summaryItem}>
                  <View style={styles.summaryIcon}>
                    <Ionicons name="person" size={12} color={colors.black} />
                  </View>
                  <View style={styles.summaryDetails}>
                    <Text style={styles.summaryLabel}>Barber</Text>
                    <Text style={styles.summaryValue}>Marcus R.</Text>
                  </View>
                </View>

                {/* Service */}
                {service && (
                  <View style={styles.summaryItem}>
                    <View style={styles.summaryIcon}>
                      <Ionicons name="cut" size={12} color={colors.black} />
                    </View>
                    <View style={styles.summaryDetails}>
                      <Text style={styles.summaryLabel}>Service</Text>
                      <Text style={styles.summaryValue}>{service.name}</Text>
                      <Text style={styles.summarySubtext}>{service.duration} minutes</Text>
                    </View>
                  </View>
                )}

                {/* Date & Time */}
                {selectedDate && selectedTime && (
                  <View style={styles.summaryItem}>
                    <View style={styles.summaryIcon}>
                      <Ionicons name="calendar" size={12} color={colors.black} />
                    </View>
                    <View style={styles.summaryDetails}>
                      <Text style={styles.summaryLabel}>Date & Time</Text>
                      <Text style={styles.summaryValue}>
                        {selectedDate.toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </Text>
                      <Text style={styles.summarySubtext}>
                        {selectedTime} - {/* Calculate end time */}
                        {service && selectedTime && (() => {
                          const [time, period] = selectedTime.split(' ');
                          const [hours, minutes] = time.split(':');
                          let totalMinutes = parseInt(hours) * 60 + parseInt(minutes);
                          if (period === 'PM' && hours !== '12') totalMinutes += 12 * 60;
                          if (period === 'AM' && hours === '12') totalMinutes -= 12 * 60;

                          totalMinutes += service.duration;

                          const endHours = Math.floor(totalMinutes / 60) % 24;
                          const endMins = totalMinutes % 60;
                          const endPeriod = endHours >= 12 ? 'PM' : 'AM';
                          const displayHours = endHours > 12 ? endHours - 12 : endHours === 0 ? 12 : endHours;

                          return `${displayHours}:${endMins.toString().padStart(2, '0')} ${endPeriod}`;
                        })()}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Price Section */}
              <View style={styles.priceSection}>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Service Price</Text>
                  <Text style={styles.priceValue}>
                    ${service?.price.toFixed(2) || '0.00'}
                  </Text>
                </View>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Membership Discount</Text>
                  <Text style={styles.priceDiscount}>
                    -${service?.price.toFixed(2) || '0.00'}
                  </Text>
                </View>
                <View style={styles.priceDivider} />
                <View style={styles.priceTotalRow}>
                  <Text style={styles.priceTotalLabel}>Total</Text>
                  <Text style={styles.priceTotalValue}>$0.00</Text>
                </View>
                <View style={styles.membershipNote}>
                  <Ionicons name="shield-checkmark" size={12} color="#6B7280" />
                  <Text style={styles.membershipNoteText}>Covered by {planName} Membership</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Confirm Button */}
          <View style={styles.confirmSection}>
            <TouchableOpacity
              style={[
                styles.confirmButton,
                (!selectedService || !selectedTime) && styles.confirmButtonDisabled
              ]}
              onPress={handleConfirmBooking}
              disabled={!selectedService || !selectedTime}
            >
              <Text style={styles.confirmButtonText}>
                {rescheduleData ? 'Confirm Reschedule' : 'Confirm Booking'}
              </Text>
              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.cancellationNote}>
              Free cancellation until 2 hours before
            </Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },

  // Header
  header: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingBottom: 24,
    marginBottom: -24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 25,
    elevation: 10,
    overflow: 'hidden',
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 16,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  venueInfo: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
  },
  topRatedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  topRatedText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#E5E7EB',
    letterSpacing: 0.5,
  },
  venueName: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#FFFFFF',
    lineHeight: 37.5,
    marginBottom: 16,
  },
  venueMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  venueMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  venueMetaText: {
    fontSize: 14,
    color: '#D1D5DB',
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#6B7280',
  },
  venueRating: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  venueReviews: {
    fontSize: 12,
    color: '#9CA3AF',
  },

  // Main Content
  mainContent: {
    padding: 20,
    paddingTop: 40,
    gap: 24,
  },

  // Membership Card
  membershipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 17,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  membershipLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  membershipIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  membershipLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#9CA3AF',
    letterSpacing: 0.3,
  },
  membershipValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  detailsButton: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  detailsButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.black,
  },

  // Section
  section: {
    gap: 16,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },

  // Service Cards
  serviceList: {
    gap: 12,
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 18,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  serviceCardSelected: {
    borderWidth: 2,
  },
  serviceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    backgroundColor: colors.black,
  },
  radioButtonInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  serviceDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  serviceDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  serviceDurationText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'colors.gray[700]',
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  servicePriceSelected: {
    color: colors.black,
  },

  // Date Picker
  datePicker: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 9,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
  },
  monthLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  monthNavButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  monthNavButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'colors.gray[100]',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateScroller: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  dateButton: {
    width: 48,
    height: 64,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateButtonSelected: {
    backgroundColor: colors.black,
    shadowColor: colors.gray[300],
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 5,
  },
  dateDayLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#9CA3AF',
    textTransform: 'uppercase',
  },
  dateDayLabelSelected: {
    color: '#FFFFFF',
  },
  dateDateLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#9CA3AF',
  },
  dateDateLabelSelected: {
    color: '#FFFFFF',
  },

  // Time Slots
  timeSlotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeSlotButton: {
    width: '30%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 11,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  timeSlotButtonSelected: {
    backgroundColor: colors.gray[100],
    borderWidth: 2,
  },
  timeSlotButtonDisabled: {
    backgroundColor: '#F9FAFB',
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  timeSlotTextSelected: {
    color: colors.black,
    fontWeight: 'bold',
  },
  timeSlotTextDisabled: {
    color: '#9CA3AF',
  },

  // Textarea
  textareaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 17,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  textarea: {
    fontSize: 14,
    color: '#111827',
    minHeight: 96,
    textAlignVertical: 'top',
  },
  textareaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    paddingTop: 13,
  },
  textareaLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  textareaCount: {
    fontSize: 12,
    color: '#9CA3AF',
  },

  // Summary Card
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryItems: {
    padding: 16,
    gap: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryDetails: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  summarySubtext: {
    fontSize: 12,
    color: '#6B7280',
  },
  priceSection: {
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    padding: 16,
    gap: 4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 14,
    color: 'colors.gray[700]',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  priceDiscount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#16A34A',
  },
  priceDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 9,
  },
  priceTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  priceTotalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.black,
  },
  membershipNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3.5,
  },
  membershipNoteText: {
    fontSize: 12,
    color: '#6B7280',
  },

  // Confirm Button
  confirmSection: {
    gap: 12,
  },
  confirmButton: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#E5E7EB',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 1,
    shadowRadius: 25,
    elevation: 10,
  },
  confirmButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  cancellationNote: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

export default BookScreen;
