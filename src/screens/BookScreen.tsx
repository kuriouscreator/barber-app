import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { mockServices, mockBarber } from '../data/mockData';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';

const BookScreen: React.FC = () => {
  const { state, bookAppointment } = useApp();
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Generate available dates (next 14 days)
  const generateAvailableDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayOfWeek = date.getDay();
      
      // Check if barber is available on this day
      const availability = mockBarber.availability.find(avail => avail.dayOfWeek === dayOfWeek);
      if (availability && availability.isAvailable) {
        dates.push({
          date: date.toISOString().split('T')[0],
          dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
          dayNumber: date.getDate(),
          month: date.toLocaleDateString('en-US', { month: 'short' }),
        });
      }
    }
    
    return dates;
  };

  // Generate available times for selected date
  const generateAvailableTimes = () => {
    if (!selectedDate) return [];
    
    const date = new Date(selectedDate);
    const dayOfWeek = date.getDay();
    const availability = mockBarber.availability.find(avail => avail.dayOfWeek === dayOfWeek);
    
    if (!availability) return [];
    
    const times = [];
    const startHour = parseInt(availability.startTime.split(':')[0]);
    const endHour = parseInt(availability.endTime.split(':')[0]);
    
    for (let hour = startHour; hour < endHour; hour++) {
      times.push(`${hour.toString().padStart(2, '0')}:00`);
      times.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    
    return times;
  };

  const availableDates = generateAvailableDates();
  const availableTimes = generateAvailableTimes();

  const handleBook = () => {
    if (!selectedService || !selectedDate || !selectedTime) {
      Alert.alert('Error', 'Please select a service, date, and time');
      return;
    }

    if (state.user && state.user.credits === 0) {
      Alert.alert('No Credits', 'You need to purchase a subscription to book appointments');
      return;
    }

    const service = mockServices.find(s => s.id === selectedService);
    if (!service) return;

    const newAppointment = {
      id: Date.now().toString(),
      userId: state.user?.id || '1',
      barberId: mockBarber.id,
      date: selectedDate,
      time: selectedTime,
      service: service.name,
      status: 'scheduled' as const,
      checkInStatus: 'pending' as const,
    };

    bookAppointment(newAppointment);
    
    Alert.alert(
      'Appointment Booked!',
      `Your ${service.name} is scheduled for ${new Date(selectedDate).toLocaleDateString()} at ${selectedTime}`,
      [{ text: 'OK', onPress: () => {
        setSelectedService(null);
        setSelectedDate(null);
        setSelectedTime(null);
      }}]
    );
  };

  const renderServiceCard = (service: typeof mockServices[0]) => {
    const isSelected = selectedService === service.id;
    
    return (
      <TouchableOpacity
        key={service.id}
        style={[styles.serviceCard, isSelected && styles.selectedServiceCard]}
        onPress={() => setSelectedService(service.id)}
      >
        <View style={styles.serviceInfo}>
          <Text style={[styles.serviceName, isSelected && styles.selectedServiceName]}>
            {service.name}
          </Text>
          <Text style={[styles.serviceDescription, isSelected && styles.selectedServiceDescription]}>
            {service.description}
          </Text>
          <Text style={[styles.serviceDuration, isSelected && styles.selectedServiceDuration]}>
            {service.duration} minutes
          </Text>
        </View>
        <Text style={[styles.servicePrice, isSelected && styles.selectedServicePrice]}>
          ${service.price}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderDateCard = (dateInfo: any) => {
    const isSelected = selectedDate === dateInfo.date;
    
    return (
      <TouchableOpacity
        key={dateInfo.date}
        style={[styles.dateCard, isSelected && styles.selectedDateCard]}
        onPress={() => {
          setSelectedDate(dateInfo.date);
          setSelectedTime(null); // Reset time when date changes
        }}
      >
        <Text style={[styles.dayName, isSelected && styles.selectedDayName]}>
          {dateInfo.dayName}
        </Text>
        <Text style={[styles.dayNumber, isSelected && styles.selectedDayNumber]}>
          {dateInfo.dayNumber}
        </Text>
        <Text style={[styles.month, isSelected && styles.selectedMonth]}>
          {dateInfo.month}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderTimeSlot = (time: string) => {
    const isSelected = selectedTime === time;
    
    return (
      <TouchableOpacity
        key={time}
        style={[styles.timeSlot, isSelected && styles.selectedTimeSlot]}
        onPress={() => setSelectedTime(time)}
      >
        <Text style={[styles.timeText, isSelected && styles.selectedTimeText]}>
          {time}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Service Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Service</Text>
          {mockServices.map(renderServiceCard)}
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.datesContainer}>
            {availableDates.map(renderDateCard)}
          </ScrollView>
        </View>

        {/* Time Selection */}
        {selectedDate && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Times</Text>
            <View style={styles.timesContainer}>
              {availableTimes.map(renderTimeSlot)}
            </View>
          </View>
        )}

        {/* Booking Summary */}
        {selectedService && selectedDate && selectedTime && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Booking Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Service:</Text>
              <Text style={styles.summaryValue}>
                {mockServices.find(s => s.id === selectedService)?.name}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Date:</Text>
              <Text style={styles.summaryValue}>
                {new Date(selectedDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Time:</Text>
              <Text style={styles.summaryValue}>{selectedTime}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Barber:</Text>
              <Text style={styles.summaryValue}>{mockBarber.name}</Text>
            </View>
          </View>
        )}

        {/* Book Button */}
        <TouchableOpacity
          style={[
            styles.bookButton,
            (!selectedService || !selectedDate || !selectedTime) && styles.bookButtonDisabled,
          ]}
          onPress={handleBook}
          disabled={!selectedService || !selectedDate || !selectedTime}
        >
          <Text style={styles.bookButtonText}>Book Appointment</Text>
        </TouchableOpacity>
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
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  serviceCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  selectedServiceCard: {
    borderColor: colors.black,
    backgroundColor: colors.black,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  selectedServiceName: {
    color: colors.white,
  },
  serviceDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  selectedServiceDescription: {
    color: colors.gray[300],
  },
  serviceDuration: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  },
  selectedServiceDuration: {
    color: colors.gray[400],
  },
  servicePrice: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.accent.primary,
  },
  selectedServicePrice: {
    color: colors.white,
  },
  datesContainer: {
    marginBottom: spacing.md,
  },
  dateCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginRight: spacing.md,
    alignItems: 'center',
    minWidth: 80,
    borderWidth: 2,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  selectedDateCard: {
    borderColor: colors.black,
    backgroundColor: colors.black,
  },
  dayName: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  selectedDayName: {
    color: colors.gray[300],
  },
  dayNumber: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  selectedDayNumber: {
    color: colors.white,
  },
  month: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  },
  selectedMonth: {
    color: colors.gray[400],
  },
  timesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  timeSlot: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.medium,
    ...shadows.sm,
  },
  selectedTimeSlot: {
    backgroundColor: colors.black,
    borderColor: colors.black,
  },
  timeText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  selectedTimeText: {
    color: colors.white,
  },
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    ...shadows.md,
  },
  summaryTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  summaryValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  bookButton: {
    backgroundColor: colors.black,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  bookButtonDisabled: {
    opacity: 0.6,
  },
  bookButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
});

export default BookScreen;
