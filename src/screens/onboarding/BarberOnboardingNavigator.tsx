import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import BusinessInfoScreen from './BusinessInfoScreen';
import ServicesSetupScreen from './ServicesSetupScreen';
import ScheduleSetupScreen from './ScheduleSetupScreen';
import OnboardingCompleteScreen from './OnboardingCompleteScreen';
import { Service } from '../../types';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import { AvailabilityService } from '../../services/AvailabilityService';

interface BusinessInfo {
  shopName: string;
  shopPhone?: string;
  shopAddress?: string;
  shopCity?: string;
  shopState?: string;
  shopZip?: string;
}

interface DaySchedule {
  dayOfWeek: number;
  dayName: string;
  dayShort: string;
  isAvailable: boolean;
  startTime: string;
  endTime: string;
}

interface BarberOnboardingNavigatorProps {
  onComplete: () => void;
}

const TOTAL_STEPS = 3;

const BarberOnboardingNavigator: React.FC<BarberOnboardingNavigatorProps> = ({
  onComplete,
}) => {
  const { state } = useApp();
  const [currentStep, setCurrentStep] = useState(1);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);

  // Step 1: Business Info
  const handleBusinessInfoContinue = async (data: BusinessInfo) => {
    setBusinessInfo(data);

    // Save business info to profile immediately
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          shop_name: data.shopName,
          shop_phone: data.shopPhone,
          shop_address: data.shopAddress,
          shop_city: data.shopCity,
          shop_state: data.shopState,
          shop_zip: data.shopZip,
          onboarding_step: 1,
        })
        .eq('id', state.user?.id);

      if (error) throw error;

      setCurrentStep(2);
    } catch (error) {
      console.error('Error saving business info:', error);
      Alert.alert('Error', 'Failed to save business information. Please try again.');
    }
  };

  // Step 2: Services Setup
  const handleServicesSetupContinue = async (servicesData: Service[]) => {
    setServices(servicesData);

    // Save services to database immediately
    try {
      // Delete existing services first (in case of retry)
      await supabase
        .from('services')
        .delete()
        .eq('barber_id', state.user?.id);

      // Insert new services (let database generate UUIDs)
      const servicesToInsert = servicesData.map(service => ({
        barber_id: state.user?.id,
        name: service.name,
        description: service.description || null,
        duration_minutes: service.duration,
        price: service.price,
        is_active: true,
      }));

      const { error: insertError } = await supabase
        .from('services')
        .insert(servicesToInsert);

      if (insertError) throw insertError;

      // Update onboarding step
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ onboarding_step: 2 })
        .eq('id', state.user?.id);

      if (updateError) throw updateError;

      setCurrentStep(3);
    } catch (error) {
      console.error('Error saving services:', error);
      Alert.alert('Error', 'Failed to save services. Please try again.');
    }
  };

  // Step 3: Schedule Setup
  const handleScheduleSetupContinue = async (scheduleData: DaySchedule[]) => {
    setSchedule(scheduleData);

    // Save schedule to database and complete onboarding
    try {
      // Delete existing availability first (in case of retry)
      await supabase
        .from('barber_availability')
        .delete()
        .eq('barber_id', state.user?.id);

      // Insert new availability for each day
      const availabilityToInsert = scheduleData.map(day => ({
        barber_id: state.user?.id,
        day_of_week: day.dayOfWeek,
        start_time: day.startTime,
        end_time: day.endTime,
        is_available: day.isAvailable,
      }));

      const { error: insertError } = await supabase
        .from('barber_availability')
        .insert(availabilityToInsert);

      if (insertError) throw insertError;

      // Mark onboarding as complete
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          onboarding_step: 3,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq('id', state.user?.id);

      if (updateError) throw updateError;

      setCurrentStep(4); // Show completion screen
    } catch (error) {
      console.error('Error saving schedule:', error);
      Alert.alert('Error', 'Failed to save schedule. Please try again.');
    }
  };

  // Back navigation
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Completion
  const handleGetStarted = () => {
    onComplete();
  };

  return (
    <View style={styles.container}>
      {currentStep === 1 && (
        <BusinessInfoScreen
          onContinue={handleBusinessInfoContinue}
          initialData={businessInfo || undefined}
          currentStep={1}
          totalSteps={TOTAL_STEPS}
        />
      )}

      {currentStep === 2 && (
        <ServicesSetupScreen
          onContinue={handleServicesSetupContinue}
          onBack={handleBack}
          initialServices={services}
          currentStep={2}
          totalSteps={TOTAL_STEPS}
        />
      )}

      {currentStep === 3 && (
        <ScheduleSetupScreen
          onContinue={handleScheduleSetupContinue}
          onBack={handleBack}
          initialSchedule={schedule.length > 0 ? schedule : undefined}
          currentStep={3}
          totalSteps={TOTAL_STEPS}
        />
      )}

      {currentStep === 4 && (
        <OnboardingCompleteScreen
          shopName={businessInfo?.shopName || 'Your shop'}
          onGetStarted={handleGetStarted}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default BarberOnboardingNavigator;
