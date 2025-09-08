import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  Switch,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { mockServices, mockBarber } from '../data/mockData';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';
import { MainTabParamList, RescheduleAppointment } from '../types';
import { AvailabilityService } from '../services/AvailabilityService';
import { supabase } from '../lib/supabase';
import { useFocusEffect } from '@react-navigation/native';

type BookScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Book'>;

interface Props {
  navigation: BookScreenNavigationProp;
  route?: {
    params?: {
      rescheduleAppointment?: RescheduleAppointment;
      rebookAppointment?: RescheduleAppointment;
    };
  };
}

const BookScreen: React.FC<Props> = ({ navigation, route }) => {
  const { state, bookAppointment } = useApp();
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [specialRequests, setSpecialRequests] = useState<string>('');
  const [selectedRequestTags, setSelectedRequestTags] = useState<string[]>([]);
  const [smsReminder, setSmsReminder] = useState<boolean>(true);
  const [emailConfirmation, setEmailConfirmation] = useState<boolean>(true);

  // Refs for auto-scrolling
  const scrollViewRef = useRef<ScrollView>(null);
  const serviceSectionRef = useRef<View>(null);
  const dateSectionRef = useRef<View>(null);
  const timeSectionRef = useRef<View>(null);
  const specialRequestsSectionRef = useRef<View>(null);
  const summarySectionRef = useRef<View>(null);

  // Helper function to scroll to a section
  const scrollToSection = (sectionRef: React.RefObject<View | null>, delay: number = 300) => {
    setTimeout(() => {
      sectionRef.current?.measureLayout(
        scrollViewRef.current as any,
        (x, y) => {
          scrollViewRef.current?.scrollTo({ y: y - 20, animated: true });
        },
        () => {}
      );
    }, delay);
  };

  // Reset form to initial state
  const resetForm = () => {
    setSelectedService(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setAvailableTimes([]);
    setSpecialRequests('');
    setSelectedRequestTags([]);
    setSmsReminder(true);
    setEmailConfirmation(true);
    
    // Scroll back to top
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }, 100);
  };

  // Handle reschedule and rebook parameters
  const rescheduleAppointment = route?.params?.rescheduleAppointment;
  const rebookAppointment = route?.params?.rebookAppointment;
  const isRescheduling = !!rescheduleAppointment;
  const isRebooking = !!rebookAppointment;
  const appointmentData = rescheduleAppointment || rebookAppointment;

  // Pre-fill form for rescheduling or rebooking, or reset for new booking
  useEffect(() => {
    if (appointmentData) {
      // Find matching service
      const matchingService = mockServices.find(service => 
        service.name.toLowerCase().includes(appointmentData.service.toLowerCase()) ||
        appointmentData.service.toLowerCase().includes(service.name.toLowerCase())
      );
      
      if (matchingService) {
        setSelectedService(matchingService.id);
      }
      
      // For rebooking, don't pre-fill date/time (user needs to select new ones)
      // For rescheduling, set current date/time for reference
      if (isRescheduling) {
        setSelectedDate(appointmentData.currentDate);
        setSelectedTime(appointmentData.currentTime);
      }
    } else {
      // Reset form for new booking
      resetForm();
    }
  }, [appointmentData, isRescheduling]);

  // Reset time selection when date or service changes
  useEffect(() => {
    const loadAvailableTimes = async () => {
      if (selectedDate && selectedService) {
        setSelectedTime(null);
        const times = await generateAvailableTimes();
        setAvailableTimes(times);
        console.log(`Date changed to ${selectedDate}, generated ${times.length} time slots`);
      } else {
        setAvailableTimes([]);
      }
    };
    
    loadAvailableTimes();
  }, [selectedDate, selectedService]);

  // Refresh available times when screen is focused (e.g., after cancellation)
  useFocusEffect(
    React.useCallback(() => {
      const refreshAvailableTimes = async () => {
        if (selectedDate && selectedService) {
          const times = await generateAvailableTimes();
          setAvailableTimes(times);
          console.log(`Screen focused - refreshed ${times.length} time slots for ${selectedDate}`);
        }
      };
      
      refreshAvailableTimes();
    }, [selectedDate, selectedService])
  );

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

  // Helper function to convert 12-hour time to 24-hour format
  const convertTo24Hour = (time12h: string) => {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    
    if (modifier === 'AM' && hours === '12') {
      hours = '00';
    } else if (modifier === 'PM' && hours !== '12') {
      hours = (parseInt(hours, 10) + 12).toString();
    }
    
    return parseInt(hours, 10);
  };

  // Generate available times for selected date using real availability service
  const generateAvailableTimes = async () => {
    if (!selectedDate || !selectedService) return [];
    
    try {
      // Get the actual barber ID from the database
      const { data: barberResults, error: barberError } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'barber')
        .limit(1);
      
      if (barberError) {
        console.error('Error fetching barber profile:', barberError);
        return [];
      }
      
      if (!barberResults || barberResults.length === 0) {
        console.error('No barber profile found');
        return [];
      }
      
      const barberId = barberResults[0].id;
      console.log('Using barber ID:', barberId);
      
      // Get service duration
      const service = mockServices.find(s => s.id === selectedService);
      const serviceDuration = service?.duration || 30;
      
      // Get available time slots from the availability service
      const availableSlots = await AvailabilityService.getAvailableTimeSlots(
        barberId,
        selectedDate,
        serviceDuration
      );
      
      // Convert 24-hour format to 12-hour format for display
      const displayTimes = availableSlots.map(time24 => {
        const [hours, minutes] = time24.split(':');
        const hour = parseInt(hours, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        return `${hour12}:${minutes} ${ampm}`;
      });
      
      return displayTimes;
    } catch (error) {
      console.error('Error generating available times:', error);
      return [];
    }
  };

  const availableDates = generateAvailableDates();

  // Quick-tag options for special requests
  const requestTags = [
    'Fade on sides',
    'Keep length on top', 
    'Trim eyebrows',
    'Wash & style',
    'Beard trim',
    'Mustache styling'
  ];

  // Mock barber info for the new design
  const barberInfo = {
    name: "Mike's Barbershop",
    location: "Downtown Plaza • 0.3 mi away",
    rating: 4.9,
    reviewCount: 0, // Will be updated with real data from ReviewService
    isOpen: true,
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face'
  };

  // Group times into Morning, Afternoon, Evening
  const groupTimesByPeriod = (times: string[]) => {
    const morning = times.filter(time => {
      const [timePart, period] = time.split(' ');
      const hour = parseInt(timePart.split(':')[0]);
      if (period === 'AM') {
        return hour >= 9 && hour < 12;
      }
      return false;
    });
    
    const afternoon = times.filter(time => {
      const [timePart, period] = time.split(' ');
      const hour = parseInt(timePart.split(':')[0]);
      if (period === 'PM') {
        return hour === 12 || (hour >= 1 && hour <= 4); // 12 PM to 4 PM (12, 1, 2, 3, 4)
      }
      return false;
    });
    
    const evening = times.filter(time => {
      const [timePart, period] = time.split(' ');
      const hour = parseInt(timePart.split(':')[0]);
      if (period === 'PM') {
        return hour >= 5 && hour < 12; // 5 PM to 11 PM
      }
      return false;
    });
    
    return { morning, afternoon, evening };
  };

  // Handle request tag selection
  const toggleRequestTag = (tag: string) => {
    setSelectedRequestTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // Debug logging
  console.log('BookScreen render:', {
    selectedDate,
    availableTimesCount: availableTimes.length,
    availableTimes: availableTimes.slice(0, 5), // Log first 5 times
    specialRequests: specialRequests,
    selectedRequestTags: selectedRequestTags,
    hasSpecialRequests: specialRequests.trim() || selectedRequestTags.length > 0,
  });

  const handleBook = async () => {
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

    // Convert 12-hour format to 24-hour format for database storage
    const convertTo24Hour = (time12Hour: string): string => {
      const [time, period] = time12Hour.split(' ');
      const [hours, minutes] = time.split(':');
      let hour24 = parseInt(hours, 10);
      
      if (period === 'PM' && hour24 !== 12) {
        hour24 += 12;
      } else if (period === 'AM' && hour24 === 12) {
        hour24 = 0;
      }
      
      return `${hour24.toString().padStart(2, '0')}:${minutes}:00`;
    };

    const appointmentData = {
      serviceId: service.id,
      serviceName: service.name,
      serviceDuration: service.duration,
      servicePrice: service.price,
      appointmentDate: selectedDate,
      appointmentTime: convertTo24Hour(selectedTime),
      specialRequests: specialRequests,
      location: '123 Main St, San Francisco, CA',
      paymentMethod: 'Credit Card',
      creditsUsed: 1,
    };

    try {
      await bookAppointment(appointmentData);
    } catch (error) {
      console.error('Error booking appointment:', error);
      Alert.alert('Error', 'Failed to book appointment. Please try again.');
      return;
    }
    
    Alert.alert(
      'Appointment Booked!',
      `Your ${service.name} is scheduled for ${new Date(selectedDate).toLocaleDateString()} at ${selectedTime}`,
      [{ text: 'OK', onPress: () => {
        resetForm();
        // Navigate to Appointments tab
        navigation.navigate('Appointments');
      }}]
    );
  };

  const renderServiceCard = (service: typeof mockServices[0]) => {
    const isSelected = selectedService === service.id;
    const isPopular = service.id === '3'; // Premium Package is popular
    
    if (isSelected) {
      return (
        <TouchableOpacity
          key={service.id}
          onPress={() => {
            setSelectedService(service.id);
            scrollToSection(dateSectionRef);
          }}
        >
          <LinearGradient 
            start={{x:0, y:0}}
            end={{x:0, y:1}}
            colors={["#000080", "#1D4ED8"]}
            style={styles.serviceCard}
          >
            <View style={styles.serviceIcon}>
              <Ionicons 
                name={service.id === '1' ? 'cut' : service.id === '2' ? 'person' : service.id === '3' ? 'star' : 'cut'} 
                size={24} 
                color={colors.white} 
              />
            </View>
            <View style={styles.serviceInfo}>
              <View style={styles.serviceHeader}>
                <Text style={styles.serviceNameSelected}>
                  {service.name}
                </Text>
                {isPopular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>Popular</Text>
                  </View>
                )}
              </View>
              <Text style={styles.serviceDescriptionSelected}>
                {service.description}
              </Text>
              <Text style={styles.serviceDurationSelected}>
                ${service.price} • {service.duration} min
              </Text>
            </View>
            <View style={styles.serviceRight}>
              <Ionicons name="checkmark-circle" size={24} color={colors.white} />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      );
    }
    
    return (
      <TouchableOpacity
        key={service.id}
        style={styles.serviceCard}
        onPress={() => {
          setSelectedService(service.id);
          scrollToSection(dateSectionRef);
        }}
      >
        <View style={styles.serviceIcon}>
          <Ionicons 
            name={service.id === '1' ? 'cut' : service.id === '2' ? 'person' : service.id === '3' ? 'star' : 'cut'} 
            size={24} 
            color={colors.accent.primary} 
          />
        </View>
        <View style={styles.serviceInfo}>
          <View style={styles.serviceHeader}>
            <Text style={styles.serviceName}>
              {service.name}
            </Text>
            {isPopular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularBadgeText}>Popular</Text>
              </View>
            )}
          </View>
          <Text style={styles.serviceDescription}>
            {service.description}
          </Text>
          <Text style={styles.serviceDuration}>
            ${service.price} • {service.duration} min
          </Text>
        </View>
        <View style={styles.serviceRight}>
          <View style={styles.radioButton} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderDateCard = (dateInfo: any) => {
    const isSelected = selectedDate === dateInfo.date;
    const isToday = dateInfo.date === new Date().toISOString().split('T')[0];
    const isTomorrow = dateInfo.date === new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    if (isSelected) {
      return (
        <TouchableOpacity
          key={dateInfo.date}
          onPress={() => {
            setSelectedDate(dateInfo.date);
            setSelectedTime(null); // Reset time when date changes
            scrollToSection(timeSectionRef);
          }}
        >
          <LinearGradient 
            start={{x:0, y:0}}
            end={{x:0, y:1}}
            colors={["#000080", "#1D4ED8"]}
            style={styles.datePill}
          >
            <Text style={styles.datePillTextSelected}>
              {isToday ? 'Today' : isTomorrow ? 'Tomorrow' : dateInfo.dayName}
            </Text>
            <Text style={styles.datePillDateSelected}>
              {dateInfo.month} {dateInfo.dayNumber}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      );
    }
    
    return (
      <TouchableOpacity
        key={dateInfo.date}
        style={[
          styles.datePill, 
          isToday && !isSelected && styles.todayPill,
          isTomorrow && !isSelected && styles.tomorrowPill
        ]}
        onPress={() => {
          setSelectedDate(dateInfo.date);
          setSelectedTime(null); // Reset time when date changes
          scrollToSection(timeSectionRef);
        }}
      >
        <Text style={[
          styles.datePillText,
          isToday && !isSelected && styles.todayPillText,
          isTomorrow && !isSelected && styles.tomorrowPillText
        ]}>
          {isToday ? 'Today' : isTomorrow ? 'Tomorrow' : dateInfo.dayName}
        </Text>
        <Text style={[
          styles.datePillDate,
          isToday && !isSelected && styles.todayPillDate,
          isTomorrow && !isSelected && styles.tomorrowPillDate
        ]}>
          {dateInfo.month} {dateInfo.dayNumber}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderTimeSlot = (time: string) => {
    const isSelected = selectedTime === time;
    
    if (isSelected) {
      return (
        <TouchableOpacity
          key={time}
          onPress={() => {
            setSelectedTime(time);
            scrollToSection(specialRequestsSectionRef);
          }}
        >
          <LinearGradient 
            start={{x:0, y:0}}
            end={{x:0, y:1}}
            colors={["#000080", "#1D4ED8"]}
            style={styles.timeChip}
          >
            <Text style={styles.timeChipTextSelected}>
              {time}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      );
    }
    
    return (
      <TouchableOpacity
        key={time}
        style={styles.timeChip}
        onPress={() => {
          setSelectedTime(time);
          scrollToSection(specialRequestsSectionRef);
        }}
      >
        <Text style={styles.timeChipText}>
          {time}
        </Text>
      </TouchableOpacity>
    );
  };

  const groupedTimes = groupTimesByPeriod(availableTimes);
  const selectedServiceData = mockServices.find(s => s.id === selectedService);

  return (
    <View style={styles.container}>
      <ScrollView ref={scrollViewRef} style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Barber Info Card */}
          <View style={styles.barberInfoCard}>
            <Image 
              source={{ uri: (isRescheduling || isRebooking) ? appointmentData?.barberAvatar : barberInfo.photo }} 
              style={styles.barberPhoto} 
            />
            <View style={styles.barberInfo}>
              <Text style={styles.barberName}>
                {(isRescheduling || isRebooking) ? appointmentData?.shopName : barberInfo.name}
              </Text>
              <Text style={styles.barberLocation}>
                {(isRescheduling || isRebooking) ? appointmentData?.location : barberInfo.location}
              </Text>
              <View style={styles.barberRating}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.ratingText}>{barberInfo.rating} ({barberInfo.reviewCount} reviews)</Text>
                <Text style={styles.openStatus}>Open now</Text>
              </View>
            </View>
          </View>

          {/* Service Selection */}
          <View ref={serviceSectionRef} style={styles.section}>
            <Text style={styles.sectionTitle}>Select Service</Text>
            {mockServices.map(renderServiceCard)}
          </View>

          {/* Date Selection */}
          <View ref={dateSectionRef} style={styles.section}>
            <Text style={styles.sectionTitle}>Select Date</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.datesContainer}>
              {availableDates.map(renderDateCard)}
            </ScrollView>
          </View>

          {/* Time Selection */}
          {selectedDate && (
            <View ref={timeSectionRef} style={styles.section}>
              {availableTimes.length > 0 ? (
                <View>
                  {groupedTimes.morning.length > 0 && (
                    <View style={styles.timeGroup}>
                      <Text style={styles.timeGroupTitle}>Morning</Text>
                      <View style={styles.timesContainer}>
                        {groupedTimes.morning.map(renderTimeSlot)}
                      </View>
                    </View>
                  )}
                  {groupedTimes.afternoon.length > 0 && (
                    <View style={styles.timeGroup}>
                      <Text style={styles.timeGroupTitle}>Afternoon</Text>
                      <View style={styles.timesContainer}>
                        {groupedTimes.afternoon.map(renderTimeSlot)}
                      </View>
                    </View>
                  )}
                  {groupedTimes.evening.length > 0 && (
                    <View style={styles.timeGroup}>
                      <Text style={styles.timeGroupTitle}>Evening</Text>
                      <View style={styles.timesContainer}>
                        {groupedTimes.evening.map(renderTimeSlot)}
                      </View>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.emptyStateContainer}>
                  <Ionicons name="time-outline" size={48} color={colors.gray[400]} />
                  <Text style={styles.emptyStateText}>No times available for this date</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Please select a different date or contact the barber for availability
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Special Requests */}
          <View ref={specialRequestsSectionRef} style={styles.section}>
            <Text style={styles.sectionTitle}>Special Requests</Text>
            <TextInput
              style={styles.requestsInput}
              placeholder="Any specific requests or preferences for your haircut?"
              value={specialRequests}
              onChangeText={setSpecialRequests}
              multiline
              numberOfLines={3}
            />
            <View style={styles.requestTagsContainer}>
              {requestTags.map(tag => (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.requestTag,
                    selectedRequestTags.includes(tag) && styles.selectedRequestTag
                  ]}
                  onPress={() => toggleRequestTag(tag)}
                >
                  <Text style={[
                    styles.requestTagText,
                    selectedRequestTags.includes(tag) && styles.selectedRequestTagText
                  ]}>
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Booking Summary */}
          {selectedService && selectedDate && selectedTime && (
            <View ref={summarySectionRef} style={styles.summaryCard}>
              {/* Header Row with Title and Price */}
              <View style={styles.summaryHeaderRow}>
                <Text style={styles.summaryTitle}>
                  {isRescheduling ? 'Reschedule Summary' : isRebooking ? 'Rebook Summary' : 'Booking Summary'}
                </Text>
                <Text style={styles.summaryPrice}>${selectedServiceData?.price}</Text>
              </View>
              
              {/* Service Row with Name and Duration */}
              <View style={styles.summaryServiceRow}>
                <Text style={styles.summaryServiceText}>
                  {selectedServiceData?.name} • {selectedServiceData?.duration} minutes
                </Text>
              </View>
              
              {/* Date & Time Row */}
              <View style={styles.summaryDateTimeRow}>
                <Text style={styles.summaryDateTime}>
                  {new Date(selectedDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                  })} at {selectedTime}
                </Text>
              </View>
              
              {/* Special Requests Row */}
              {(specialRequests.trim() || selectedRequestTags.length > 0) && (
                <>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summarySpecialRequestsRow}>
                    <Text style={styles.summarySpecialRequestsLabel}>Special Requests</Text>
                    <View style={styles.summarySpecialRequestsContent}>
                      {specialRequests.trim() && (
                        <Text style={styles.summarySpecialRequestsText}>{specialRequests}</Text>
                      )}
                      {selectedRequestTags.length > 0 && (
                        <View style={styles.summaryRequestTags}>
                          {selectedRequestTags.map(tag => (
                            <View key={tag} style={styles.summaryRequestTag}>
                              <Text style={styles.summaryRequestTagText}>{tag}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>
                </>
              )}
              
              {/* Payment Method Row */}
              <View style={styles.summaryPaymentRow}>
                <View style={styles.summaryPayment}>
                  <Ionicons name="star" size={16} color="#FFD700" />
                  <Text style={styles.summaryPaymentText}>Using subscription credit</Text>
                </View>
                <Text style={styles.freeText}>Free</Text>
              </View>
            </View>
          )}

          {/* Reminders */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reminders</Text>
            
            <View style={styles.reminderRow}>
              <View style={styles.reminderLeft}>
                <Text style={styles.reminderTitle}>SMS Reminder</Text>
                <Text style={styles.reminderSubtitle}>Get notified 30 minutes before</Text>
              </View>
              <Switch
                value={smsReminder}
                onValueChange={setSmsReminder}
                trackColor={{ false: colors.gray[300], true: colors.accent.primary }}
                thumbColor={colors.white}
              />
            </View>

            <View style={styles.reminderRow}>
              <View style={styles.reminderLeft}>
                <Text style={styles.reminderTitle}>Email Confirmation</Text>
                <Text style={styles.reminderSubtitle}>Receive booking details via email</Text>
              </View>
              <Switch
                value={emailConfirmation}
                onValueChange={setEmailConfirmation}
                trackColor={{ false: colors.gray[300], true: colors.accent.primary }}
                thumbColor={colors.white}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <Text style={styles.footerLabel}>Total</Text>
          <Text style={styles.footerTotal}>Free with subscription</Text>
        </View>
        <View style={styles.footerRight}>
          <Text style={styles.footerLabel}>Credits remaining</Text>
          <Text style={styles.footerCredits}>{state.user?.credits || 0} of 4</Text>
        </View>
      </View>

      {/* Confirm Button */}
      <TouchableOpacity
        onPress={handleBook}
        disabled={!selectedService || !selectedDate || !selectedTime}
      >
        <LinearGradient 
          start={{x:0, y:0}}
          end={{x:0, y:1}}
          colors={(!selectedService || !selectedDate || !selectedTime) ? ["#CBD5E1", "#94A3B8"] : ["#000080", "#1D4ED8"]}
          style={styles.confirmButton}
        >
          <Text style={styles.confirmButtonText}>
            {isRescheduling ? 'Confirm Reschedule' : isRebooking ? 'Confirm Rebook' : 'Confirm Booking'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingTop: 20,
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
  
  // Barber Info Card
  barberInfoCard: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.border.light,
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    flexDirection: 'row',
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
  barberPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: spacing.md,
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
  barberLocation: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  barberRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    marginLeft: spacing.xs,
    marginRight: spacing.md,
  },
  openStatus: {
    fontSize: typography.fontSize.sm,
    color: colors.accent.success,
    fontWeight: typography.fontWeight.medium,
  },

  // Service Cards
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.border.light,
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
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
  selectedServiceCard: {
    borderColor: colors.accent.primary,
    backgroundColor: colors.accent.primary,
  },
  serviceIcon: {
    marginRight: spacing.md,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  serviceName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginRight: spacing.sm,
  },
  selectedServiceName: {
    color: colors.white,
  },
  serviceNameSelected: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
    marginRight: spacing.sm,
  },
  serviceDescriptionSelected: {
    fontSize: typography.fontSize.sm,
    color: colors.white,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  serviceDurationSelected: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.white,
  },
  popularBadge: {
    backgroundColor: '#FFD700',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  popularBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  serviceDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  selectedServiceDescription: {
    color: colors.white,
    opacity: 0.9,
  },
  serviceDuration: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
  },
  selectedServiceDuration: {
    color: colors.white,
  },
  serviceRight: {
    marginLeft: spacing.md,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border.medium,
  },

  // Date Pills
  datesContainer: {
    marginBottom: spacing.md,
  },
  datePill: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.border.light,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginRight: spacing.sm,
    alignItems: 'center',
    minWidth: 80,
    shadowColor: '#0000000D',
    shadowOpacity: 0.1,
    shadowOffset: {
      width: 0,
      height: 1
    },
    shadowRadius: 2,
    elevation: 2,
  },
  selectedDatePill: {
    backgroundColor: colors.accent.primary,
  },
  todayPill: {
    backgroundColor: colors.gray[200],
  },
  tomorrowPill: {
    backgroundColor: colors.gray[200],
  },
  datePillText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  selectedDatePillText: {
    color: colors.white,
  },
  todayPillText: {
    color: colors.text.primary,
  },
  tomorrowPillText: {
    color: colors.text.primary,
  },
  datePillDate: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  selectedDatePillDate: {
    color: colors.white,
  },
  datePillTextSelected: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  datePillDateSelected: {
    fontSize: typography.fontSize.xs,
    color: colors.white,
  },
  todayPillDate: {
    color: colors.text.secondary,
  },
  tomorrowPillDate: {
    color: colors.text.secondary,
  },

  // Time Groups and Chips
  timeGroup: {
    marginBottom: spacing.lg,
  },
  timeGroupTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  timesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  timeChip: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.border.light,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    shadowColor: '#0000000D',
    shadowOpacity: 0.1,
    shadowOffset: {
      width: 0,
      height: 1
    },
    shadowRadius: 2,
    elevation: 2,
  },
  timeChipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  timeChipTextSelected: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.white,
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  emptyStateText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Booking Summary
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.border.light,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 17,
    marginBottom: spacing.xl,
    shadowColor: '#0000000D',
    shadowOpacity: 0.1,
    shadowOffset: {
      width: 0,
      height: 1
    },
    shadowRadius: 2,
    elevation: 2,
  },
  summaryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginHorizontal: 17,
  },
  summaryTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  summaryServiceRow: {
    marginBottom: 12,
    marginHorizontal: 17,
  },
  summaryServiceText: {
    fontSize: 14,
    fontWeight: typography.fontWeight.normal,
    color: colors.text.primary,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginHorizontal: 17,
    marginVertical: 12,
  },
  summaryDateTimeRow: {
    marginBottom: 12,
    marginHorizontal: 17,
  },
  summaryDateTime: {
    fontSize: 14,
    fontWeight: typography.fontWeight.normal,
    color: colors.text.primary,
  },
  summaryPaymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 17,
    marginTop: 24,
  },
  summaryPayment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryPaymentText: {
    fontSize: 14,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
  },
  summarySpecialRequestsRow: {
    marginHorizontal: 17,
  },
  summarySpecialRequestsLabel: {
    fontSize: 14,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  summarySpecialRequestsContent: {
    gap: 8,
  },
  summarySpecialRequestsText: {
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 20,
  },
  summaryRequestTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  summaryRequestTag: {
    backgroundColor: colors.gray[100],
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  summaryRequestTagText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  summaryLeft: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  summaryValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  summaryDuration: {
    fontSize: 16,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
  },
  summaryPrice: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  changeLink: {
    fontSize: typography.fontSize.sm,
    color: colors.accent.primary,
    fontWeight: typography.fontWeight.medium,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  freeText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.accent.success,
  },

  // Special Requests
  requestsInput: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.border.light,
    borderRadius: borderRadius.button,
    borderWidth: 1,
    padding: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    textAlignVertical: 'top',
    marginBottom: spacing.md,
    minHeight: 80,
    shadowColor: '#0000000D',
    shadowOpacity: 0.1,
    shadowOffset: {
      width: 0,
      height: 1
    },
    shadowRadius: 2,
    elevation: 2,
  },
  requestTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  requestTag: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.border.light,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    shadowColor: '#0000000D',
    shadowOpacity: 0.1,
    shadowOffset: {
      width: 0,
      height: 1
    },
    shadowRadius: 2,
    elevation: 2,
  },
  selectedRequestTag: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  requestTagText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
  },
  selectedRequestTagText: {
    color: colors.white,
  },

  // Reminders
  reminderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  reminderLeft: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  reminderSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  footerLeft: {
    flex: 1,
  },
  footerRight: {
    alignItems: 'flex-end',
  },
  footerLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  footerTotal: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  footerCredits: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },

  // Confirm Button
  confirmButton: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.button,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: colors.gray[300],
  },
  confirmButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
});

export default BookScreen;
