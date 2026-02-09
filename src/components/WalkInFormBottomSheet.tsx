import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import RBSheet from 'react-native-raw-bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { spacing, borderRadius } from '../theme/spacing';
import { typography } from '../theme/typography';
import { CreateWalkInAppointmentData } from '../services/AppointmentService';
import { AvailabilityService } from '../services/AvailabilityService';

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

interface WalkInFormBottomSheetProps {
  barberId: string;
  date: string; // YYYY-MM-DD format
  services: Service[];
  onSave: (walkInData: CreateWalkInAppointmentData) => Promise<void>;
}

export const WalkInFormBottomSheet = forwardRef<any, WalkInFormBottomSheetProps>(
  ({ barberId, date, services, onSave }, ref) => {
    const rbSheetRef = useRef<any>(null);

    // Form state
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [selectedTime, setSelectedTime] = useState<string>('');
    const [specialRequests, setSpecialRequests] = useState('');
    const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingSlots, setLoadingSlots] = useState(false);

    // Expose open and close methods to parent
    useImperativeHandle(ref, () => ({
      open: () => {
        resetForm();
        rbSheetRef.current?.open();
      },
      close: () => rbSheetRef.current?.close(),
    }));

    // Load available time slots when service is selected
    useEffect(() => {
      const loadTimeSlots = async () => {
        if (!selectedService || !date) {
          setAvailableTimeSlots([]);
          return;
        }

        setLoadingSlots(true);
        try {
          const slots = await AvailabilityService.getAvailableTimeSlots(
            barberId,
            date,
            selectedService.duration
          );

          // Convert from 24h to 12h format for display
          const formatted = slots.map(slot => formatTo12Hour(slot));
          setAvailableTimeSlots(formatted);

          // Auto-select first available slot if none selected
          if (formatted.length > 0 && !selectedTime) {
            setSelectedTime(formatted[0]);
          }
        } catch (error) {
          console.error('Error loading time slots:', error);
          Alert.alert('Error', 'Failed to load available time slots');
        } finally {
          setLoadingSlots(false);
        }
      };

      loadTimeSlots();
    }, [selectedService, date, barberId]);

    const formatTo12Hour = (time24: string): string => {
      const [hours, minutes] = time24.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    const formatTo24Hour = (time12: string): string => {
      const match = time12.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!match) return time12;

      let hours = parseInt(match[1]);
      const minutes = match[2];
      const period = match[3].toUpperCase();

      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;

      return `${hours.toString().padStart(2, '0')}:${minutes}`;
    };

    const resetForm = () => {
      setCustomerName('');
      setCustomerPhone('');
      setSelectedService(null);
      setSelectedTime('');
      setSpecialRequests('');
      setAvailableTimeSlots([]);
    };

    const validateForm = (): boolean => {
      if (!customerName.trim()) {
        Alert.alert('Required Field', 'Please enter customer name');
        return false;
      }

      if (!selectedService) {
        Alert.alert('Required Field', 'Please select a service');
        return false;
      }

      if (!selectedTime) {
        Alert.alert('Required Field', 'Please select a time slot');
        return false;
      }

      return true;
    };

    const handleSave = async () => {
      if (!validateForm()) return;

      setLoading(true);
      try {
        const walkInData: CreateWalkInAppointmentData = {
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim() || undefined,
          serviceId: selectedService!.id,
          serviceName: selectedService!.name,
          serviceDuration: selectedService!.duration,
          servicePrice: selectedService!.price,
          appointmentDate: date,
          appointmentTime: formatTo24Hour(selectedTime),
          specialRequests: specialRequests.trim() || undefined,
          barberId,
        };

        await onSave(walkInData);
        rbSheetRef.current?.close();
        resetForm();
      } catch (error: any) {
        console.error('Error saving walk-in:', error);
        Alert.alert('Error', error.message || 'Failed to create walk-in appointment');
      } finally {
        setLoading(false);
      }
    };

    const handleCancel = () => {
      rbSheetRef.current?.close();
      resetForm();
    };

    return (
      <RBSheet
        ref={rbSheetRef}
        height={650}
        openDuration={250}
        closeDuration={200}
        customStyles={{
          container: styles.sheetContainer,
          draggableIcon: styles.draggableIcon,
        }}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="person-add" size={24} color={colors.accent.primary} />
              <Text style={styles.headerTitle}>Add Walk-In</Text>
            </View>
            <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            {/* Customer Name */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Customer Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter customer name"
                placeholderTextColor={colors.text.tertiary}
                value={customerName}
                onChangeText={setCustomerName}
                autoCapitalize="words"
              />
            </View>

            {/* Customer Phone */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Phone Number (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="(555) 123-4567"
                placeholderTextColor={colors.text.tertiary}
                value={customerPhone}
                onChangeText={setCustomerPhone}
                keyboardType="phone-pad"
              />
            </View>

            {/* Service Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Service *</Text>
              <View style={styles.serviceList}>
                {services.map((service) => (
                  <TouchableOpacity
                    key={service.id}
                    style={[
                      styles.serviceCard,
                      selectedService?.id === service.id && styles.serviceCardSelected,
                    ]}
                    onPress={() => setSelectedService(service)}
                  >
                    <View style={styles.serviceInfo}>
                      <Text style={[
                        styles.serviceName,
                        selectedService?.id === service.id && styles.serviceNameSelected
                      ]}>
                        {service.name}
                      </Text>
                      <Text style={styles.serviceDetails}>
                        {service.duration} min • ${service.price.toFixed(2)}
                      </Text>
                    </View>
                    {selectedService?.id === service.id && (
                      <Ionicons name="checkmark-circle" size={24} color={colors.accent.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Time Slot Selection */}
            {selectedService && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Time Slot *</Text>
                {loadingSlots ? (
                  <Text style={styles.loadingText}>Loading available times...</Text>
                ) : availableTimeSlots.length === 0 ? (
                  <Text style={styles.emptyText}>No available time slots for this service</Text>
                ) : (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.timeSlotScroll}
                    contentContainerStyle={styles.timeSlotContainer}
                  >
                    {availableTimeSlots.map((slot, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.timeSlot,
                          selectedTime === slot && styles.timeSlotSelected,
                        ]}
                        onPress={() => setSelectedTime(slot)}
                      >
                        <Text style={[
                          styles.timeSlotText,
                          selectedTime === slot && styles.timeSlotTextSelected
                        ]}>
                          {slot}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}

            {/* Special Requests / Notes */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add any special requests or notes..."
                placeholderTextColor={colors.text.tertiary}
                value={specialRequests}
                onChangeText={setSpecialRequests}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Saving...' : 'Add Walk-In'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </RBSheet>
    );
  }
);

const styles = StyleSheet.create({
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: colors.white,
  },
  draggableIcon: {
    backgroundColor: colors.gray[300],
    width: 40,
    height: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  form: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  formGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  textArea: {
    height: 80,
    paddingTop: spacing.sm,
  },
  serviceList: {
    gap: spacing.sm,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.secondary,
    borderWidth: 2,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  serviceCardSelected: {
    borderColor: colors.accent.primary,
    backgroundColor: colors.accent.primaryLight,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  serviceNameSelected: {
    color: colors.accent.primary,
  },
  serviceDetails: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  timeSlotScroll: {
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  timeSlotContainer: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  timeSlot: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
  },
  timeSlotSelected: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  timeSlotText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  timeSlotTextSelected: {
    color: colors.white,
  },
  loadingText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.medium,
    backgroundColor: colors.white,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  saveButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.accent.primary,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});
