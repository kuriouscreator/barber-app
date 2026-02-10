import { supabase } from '../lib/supabase';
import { Appointment } from '../types';
import { BillingService } from './billing';
import { ActivityLogger } from './ActivityLogger';

export interface CreateAppointmentData {
  serviceId: string;
  serviceName: string;
  serviceDuration: number;
  servicePrice: number;
  appointmentDate: string; // YYYY-MM-DD format
  appointmentTime: string; // HH:MM format
  specialRequests?: string;
  location?: string;
  paymentMethod?: string;
  creditsUsed?: number;
}

export interface UpdateAppointmentData {
  status?: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  rating?: number;
  reviewText?: string;
  reviewPhotoUrl?: string;
  specialRequests?: string;
}

export interface CreateWalkInAppointmentData {
  customerName: string; // Required for walk-ins
  customerPhone?: string; // Optional phone number
  serviceId: string;
  serviceName: string;
  serviceDuration: number;
  servicePrice: number;
  appointmentDate: string; // YYYY-MM-DD format
  appointmentTime: string; // HH:MM format
  specialRequests?: string;
  barberId: string;
}

export class AppointmentService {
  /**
   * Get local date string in YYYY-MM-DD format without timezone conversion
   */
  private static getLocalDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Get all appointments for the current user
   */
  static async getUserAppointments(): Promise<Appointment[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('appointment_summary')
        .select('*')
        .eq('user_id', user.id)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (error) throw error;

      return data?.map(this.mapToAppointment) || [];
    } catch (error) {
      console.error('Error fetching user appointments:', error);
      return [];
    }
  }

  /**
   * Create a new appointment
   */
  static async createAppointment(appointmentData: CreateAppointmentData): Promise<Appointment> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if user can book an appointment (has remaining cuts)
      const { data: canBook, error: canBookError } = await supabase
        .rpc('can_user_book_appointment', { p_user_id: user.id });

      if (canBookError) {
        console.error('Error checking if user can book:', canBookError);
        throw new Error('Failed to validate booking eligibility');
      }

      if (!canBook) {
        // Get remaining cuts for better error message
        const { data: remainingCuts } = await supabase
          .rpc('get_user_remaining_cuts', { p_user_id: user.id });
        
        throw new Error(`Cannot book appointment: You have ${remainingCuts || 0} cuts remaining. Please upgrade your plan or cancel an existing appointment.`);
      }

      // Find the barber profile (there should only be one in this single-barber app)
      console.log('Looking for barber profile...');
      
      const { data: barberResults, error: barberError } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'barber')
        .limit(1);
      
      let barberData: { id: string } | null = null;
      
      if (barberError) {
        console.error('Error fetching barber profile:', barberError);
        throw new Error('Failed to find barber profile');
      } else if (barberResults && barberResults.length > 0) {
        console.log('Found barber profile:', barberResults[0]);
        barberData = barberResults[0];
      } else {
        console.error('No barber profile found');
        throw new Error('No barber available for booking');
      }

      // Verify the service exists and get its details
      const { data: serviceData, error: serviceError } = await supabase
        .from('services')
        .select('*')
        .eq('id', appointmentData.serviceId)
        .eq('is_active', true)
        .single();

      if (serviceError || !serviceData) {
        console.error('Error fetching service:', serviceError);
        throw new Error('Service not found or inactive');
      }

      // Ensure service details match what was passed in
      const serviceName = appointmentData.serviceName || serviceData.name;
      const serviceDuration = appointmentData.serviceDuration || serviceData.duration_minutes;
      const servicePrice = appointmentData.servicePrice || serviceData.price;

      console.log('Creating appointment with service:', {
        serviceId: appointmentData.serviceId,
        serviceName,
        serviceDuration,
        servicePrice,
        cutsUsed: 1
      });

      const { data, error } = await supabase
        .from('appointments')
        .insert({
          user_id: user.id,
          barber_id: barberData.id,
          service_id: appointmentData.serviceId,
          service_name: serviceName,
          service_duration: serviceDuration,
          service_price: servicePrice,
          appointment_date: appointmentData.appointmentDate,
          appointment_time: appointmentData.appointmentTime,
          special_requests: appointmentData.specialRequests,
          location: appointmentData.location || '123 Main St, San Francisco, CA',
          payment_method: appointmentData.paymentMethod || 'Credit Card',
          credits_used: appointmentData.creditsUsed || 1,
          cuts_used: 1, // Each appointment uses 1 cut
          status: 'scheduled'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating appointment:', error);
        throw error;
      }

      console.log('Appointment created successfully:', data.id);

      // Log activity for appointment confirmed
      try {
        const formattedDate = new Date(appointmentData.appointmentDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        });

        await ActivityLogger.logAppointmentConfirmed(
          user.id,
          data.id,
          formattedDate
        );
      } catch (activityError) {
        console.warn('Failed to log appointment confirmed activity:', activityError);
        // Don't fail the appointment creation if activity logging fails
      }

      return this.mapToAppointment(data);
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  }

  /**
   * Create a walk-in appointment (barber-side only)
   * Walk-ins don't require a user account and don't affect subscription cuts
   */
  static async createWalkInAppointment(
    walkInData: CreateWalkInAppointmentData
  ): Promise<Appointment> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Verify the authenticated user is a barber
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        console.error('Error fetching user profile:', profileError);
        throw new Error('Failed to verify user role');
      }

      if (profile.role !== 'barber') {
        throw new Error('Only barbers can create walk-in appointments');
      }

      // Verify the service exists
      const { data: serviceData, error: serviceError } = await supabase
        .from('services')
        .select('*')
        .eq('id', walkInData.serviceId)
        .eq('is_active', true)
        .single();

      if (serviceError || !serviceData) {
        console.error('Error fetching service:', serviceError);
        throw new Error('Service not found or inactive');
      }

      console.log('Creating walk-in appointment:', {
        customerName: walkInData.customerName,
        service: walkInData.serviceName,
        date: walkInData.appointmentDate,
        time: walkInData.appointmentTime
      });

      // Create the walk-in appointment
      const { data, error } = await supabase
        .from('appointments')
        .insert({
          barber_id: walkInData.barberId,
          user_id: null, // Walk-ins don't have user accounts
          appointment_type: 'walk_in',
          customer_name: walkInData.customerName,
          customer_phone: walkInData.customerPhone || null,
          service_id: walkInData.serviceId,
          service_name: walkInData.serviceName,
          service_duration: walkInData.serviceDuration,
          service_price: walkInData.servicePrice,
          appointment_date: walkInData.appointmentDate,
          appointment_time: walkInData.appointmentTime,
          special_requests: walkInData.specialRequests || null,
          location: '123 Main St, San Francisco, CA',
          payment_method: 'Cash',
          credits_used: 0, // Walk-ins don't use subscription credits
          cuts_used: 0, // Walk-ins don't count against subscription cuts
          status: 'scheduled'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating walk-in appointment:', error);
        throw error;
      }

      console.log('Walk-in appointment created successfully:', data.id);

      return this.mapToAppointment(data);
    } catch (error) {
      console.error('Error creating walk-in appointment:', error);
      throw error;
    }
  }

  /**
   * Update an existing appointment
   */
  static async updateAppointment(
    appointmentId: string,
    updateData: UpdateAppointmentData
  ): Promise<Appointment> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', appointmentId)
        .eq('user_id', user.id) // Ensure user can only update their own appointments
        .select()
        .single();

      if (error) throw error;

      return this.mapToAppointment(data);
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }
  }

  /**
   * Cancel an appointment
   */
  static async cancelAppointment(appointmentId: string): Promise<{ appointment: Appointment; cutsRestored: boolean }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Use the database function to handle cancellation and cut restoration
      const { data: cutsRestored, error: cancelError } = await supabase
        .rpc('handle_appointment_cancellation', { 
          p_appointment_id: appointmentId, 
          p_user_id: user.id 
        });

      if (cancelError) {
        console.error('Error cancelling appointment:', cancelError);
        throw new Error('Failed to cancel appointment');
      }

      // Get the updated appointment
      const { data: appointment, error: fetchError } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', appointmentId)
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        console.error('Error fetching cancelled appointment:', fetchError);
        throw new Error('Failed to fetch cancelled appointment');
      }

      // Log activity for appointment cancelled
      try {
        const formattedDate = new Date(appointment.appointment_date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        });

        await ActivityLogger.logAppointmentCancelled(
          user.id,
          appointmentId,
          formattedDate
        );
      } catch (activityError) {
        console.warn('Failed to log appointment cancelled activity:', activityError);
        // Don't fail the cancellation if activity logging fails
      }

      return {
        appointment: this.mapToAppointment(appointment),
        cutsRestored: cutsRestored || false
      };
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      throw error;
    }
  }

  /**
   * Complete an appointment and track cuts usage
   */
  static async completeAppointment(appointmentId: string): Promise<Appointment> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // First, check if appointment exists and is scheduled
      const { data: appointmentData, error: fetchError } = await supabase
        .from('appointments')
        .select('status')
        .eq('id', appointmentId)
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      if (appointmentData.status !== 'scheduled') {
        throw new Error('Appointment is not in scheduled status');
      }

      // Update appointment status to completed
      const { data, error } = await supabase
        .from('appointments')
        .update({
          status: 'completed'
        })
        .eq('id', appointmentId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      // Track cuts usage for subscription billing
      try {
        await BillingService.addCutUsage(appointmentId);
        console.log('Cut usage tracked successfully');
      } catch (billingError) {
        console.warn('Failed to track cut usage:', billingError);
        // Don't fail the appointment completion if billing tracking fails
      }

      // Log activity for appointment completed
      try {
        // Get barber name from appointment data
        const { data: barberData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', data.barber_id)
          .single();

        await ActivityLogger.logAppointmentCompleted(
          user.id,
          appointmentId,
          barberData?.full_name || 'Your barber',
          data.service_name
        );
      } catch (activityError) {
        console.warn('Failed to log appointment completed activity:', activityError);
        // Don't fail the completion if activity logging fails
      }

      return this.mapToAppointment(data);
    } catch (error) {
      console.error('Error completing appointment:', error);
      throw error;
    }
  }

  /**
   * Submit a review for an appointment
   */
  static async submitReview(
    appointmentId: string,
    rating: number,
    reviewText?: string,
    reviewPhotoUrl?: string
  ): Promise<Appointment> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // First, check the appointment status
      const { data: appointmentData, error: fetchError } = await supabase
        .from('appointments')
        .select('status')
        .eq('id', appointmentId)
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      // Prevent reviews for canceled appointments
      if (appointmentData.status === 'cancelled') {
        throw new Error('Cannot submit review for a canceled appointment');
      }

      // Update appointment with review and mark as completed
      const { data, error } = await supabase
        .from('appointments')
        .update({
          rating,
          review_text: reviewText,
          review_photo_url: reviewPhotoUrl,
          status: 'completed' // Mark as completed when review is submitted
        })
        .eq('id', appointmentId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      // Track cuts usage for subscription billing
      try {
        await BillingService.addCutUsage(appointmentId);
        console.log('Cut usage tracked successfully');
      } catch (billingError) {
        console.warn('Failed to track cut usage:', billingError);
        // Don't fail the review submission if billing tracking fails
      }

      // Log activity for appointment completed (if it wasn't already completed)
      if (appointmentData.status !== 'completed') {
        try {
          // Get barber name from appointment data
          const { data: barberData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', data.barber_id)
            .single();

          await ActivityLogger.logAppointmentCompleted(
            user.id,
            appointmentId,
            barberData?.full_name || 'Your barber',
            data.service_name
          );
        } catch (activityError) {
          console.warn('Failed to log appointment completed activity:', activityError);
          // Don't fail the review submission if activity logging fails
        }
      }

      return this.mapToAppointment(data);
    } catch (error) {
      console.error('Error submitting review:', error);
      throw error;
    }
  }

  /**
   * Get upcoming appointments for the current user
   */
  static async getUpcomingAppointments(): Promise<Appointment[]> {
    try {
      const today = this.getLocalDateString(new Date());

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('appointment_summary')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'scheduled')
        .gte('appointment_date', today)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (error) throw error;

      return data?.map(this.mapToAppointment) || [];
    } catch (error) {
      console.error('Error fetching upcoming appointments:', error);
      return [];
    }
  }

  /**
   * Get past appointments for the current user
   */
  static async getPastAppointments(): Promise<Appointment[]> {
    try {
      const today = this.getLocalDateString(new Date());

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('appointment_summary')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['completed', 'cancelled', 'no_show'])
        .lt('appointment_date', today)
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: false });

      if (error) throw error;

      return data?.map(this.mapToAppointment) || [];
    } catch (error) {
      console.error('Error fetching past appointments:', error);
      return [];
    }
  }

  /**
   * Get user's remaining cuts
   */
  static async getRemainingCuts(): Promise<number> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: remainingCuts, error } = await supabase
        .rpc('get_user_remaining_cuts', { p_user_id: user.id });

      if (error) {
        console.error('Error getting remaining cuts:', error);
        return 0;
      }

      return remainingCuts || 0;
    } catch (error) {
      console.error('Error getting remaining cuts:', error);
      return 0;
    }
  }

  /**
   * Check if user can book an appointment
   */
  static async canBookAppointment(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: canBook, error } = await supabase
        .rpc('can_user_book_appointment', { p_user_id: user.id });

      if (error) {
        console.error('Error checking if user can book:', error);
        return false;
      }

      return canBook || false;
    } catch (error) {
      console.error('Error checking if user can book:', error);
      return false;
    }
  }

  /**
   * Reschedule an existing appointment
   */
  static async rescheduleAppointment(
    appointmentId: string, 
    newAppointmentData: CreateAppointmentData
  ): Promise<Appointment> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      console.log('Rescheduling appointment:', appointmentId, 'to:', newAppointmentData);

      // Find the barber profile (there should only be one in this single-barber app)
      const { data: barberResults, error: barberError } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'barber')
        .limit(1);
      
      let barberData: { id: string } | null = null;
      
      if (barberError) {
        console.error('Error fetching barber profile:', barberError);
        throw new Error('Failed to find barber profile');
      } else if (barberResults && barberResults.length > 0) {
        console.log('Found barber profile:', barberResults[0]);
        barberData = barberResults[0];
      } else {
        console.error('No barber profile found');
        throw new Error('No barber available for booking');
      }

      // Verify the service exists and get its details
      const { data: serviceData, error: serviceError } = await supabase
        .from('services')
        .select('*')
        .eq('id', newAppointmentData.serviceId)
        .eq('is_active', true)
        .single();

      if (serviceError || !serviceData) {
        console.error('Error fetching service:', serviceError);
        throw new Error('Service not found or inactive');
      }

      // Ensure service details match what was passed in
      const serviceName = newAppointmentData.serviceName || serviceData.name;
      const serviceDuration = newAppointmentData.serviceDuration || serviceData.duration_minutes;
      const servicePrice = newAppointmentData.servicePrice || serviceData.price;

      console.log('Updating appointment with new details:', {
        appointmentId,
        serviceName,
        serviceDuration,
        servicePrice,
        newDate: newAppointmentData.appointmentDate,
        newTime: newAppointmentData.appointmentTime
      });

      // Update the existing appointment with new details
      const { data, error } = await supabase
        .from('appointments')
        .update({
          service_id: newAppointmentData.serviceId,
          service_name: serviceName,
          service_duration: serviceDuration,
          service_price: servicePrice,
          appointment_date: newAppointmentData.appointmentDate,
          appointment_time: newAppointmentData.appointmentTime,
          special_requests: newAppointmentData.specialRequests,
          location: newAppointmentData.location || '123 Main St, San Francisco, CA',
          payment_method: newAppointmentData.paymentMethod || 'Credit Card',
          credits_used: newAppointmentData.creditsUsed || 1,
          cuts_used: 1, // Each appointment uses 1 cut
          status: 'scheduled',
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating appointment:', error);
        throw error;
      }

      console.log('Appointment rescheduled successfully:', data.id);
      return this.mapToAppointment(data);
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      throw error;
    }
  }

  /**
   * Get appointment with venue details
   */
  static async getAppointmentWithVenue(appointmentId: string): Promise<Appointment | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get appointment data
      // Use OR condition to allow both customers (user_id) and barbers (barber_id) to view
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', appointmentId)
        .or(`user_id.eq.${user.id},barber_id.eq.${user.id}`)
        .single();

      if (appointmentError || !appointment) {
        console.error('Error fetching appointment:', appointmentError);
        return null;
      }

      const mapped = this.mapToAppointment(appointment);

      // Try to get barber info separately
      try {
        const { data: barber } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .eq('id', appointment.barber_id)
          .single();

        if (barber) {
          mapped.barberName = barber.full_name;
          mapped.barberAvatar = barber.avatar_url;
        }
      } catch (barberError) {
        console.log('Could not fetch barber details:', barberError);
        // Continue without barber details
      }

      // Mock venue data for now - you can replace this with actual venue data from database
      mapped.venue = {
        id: '1',
        name: 'Crown & Blade Lounge',
        address: appointment.location || '7683 Thornton Avenue',
        city: 'Newark',
        state: 'CA',
        zipCode: '94560',
        rating: 4.9,
        reviewCount: 1200,
        imageUrl: undefined, // Can be fetched from database
        isTopRated: true,
      };

      return mapped;
    } catch (error) {
      console.error('Error fetching appointment with venue:', error);
      return null;
    }
  }

  /**
   * Map database record to Appointment type
   */
  /**
   * Get today's appointments for a specific barber
   */
  static async getBarberTodaysAppointments(barberId: string): Promise<any[]> {
    try {
      const today = this.getLocalDateString(new Date());

      // Fetch appointments
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .eq('barber_id', barberId)
        .eq('appointment_date', today)
        .order('appointment_time', { ascending: true });

      if (appointmentsError) throw appointmentsError;
      if (!appointments || appointments.length === 0) return [];

      console.log('🔍 AppointmentService: Raw appointments:', appointments.length);
      console.log('🔍 AppointmentService: First appointment user_id:', appointments[0]?.user_id);

      // Extract unique user IDs, filtering out null values (walk-ins don't have user_id)
      const userIds = [...new Set(appointments.map(apt => apt.user_id).filter(id => id !== null))];
      console.log('🔍 AppointmentService: User IDs to fetch:', userIds);

      // Fetch customer profiles only if there are user IDs to fetch
      let profiles: any[] = [];
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, email')
          .in('id', userIds);

        if (profilesError) throw profilesError;
        profiles = profilesData || [];
      }

      console.log('🔍 AppointmentService: Profiles fetched:', profiles?.length);
      console.log('🔍 AppointmentService: Profiles data:', profiles);

      // Create a map of profiles for quick lookup
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      console.log('🔍 AppointmentService: ProfileMap size:', profileMap.size);

      // Merge appointments with customer data and map to Appointment objects
      const merged = appointments.map(apt =>
        this.mapToAppointment({
          ...apt,
          customer: profileMap.get(apt.user_id) || null,
        })
      );

      console.log('🔍 AppointmentService: First merged appointment customer:', merged[0]?.customer);
      return merged;
    } catch (error) {
      console.error('Error fetching barber today appointments:', error);
      return [];
    }
  }

  /**
   * Get the next upcoming appointment for a barber
   */
  static async getBarberNextAppointment(barberId: string): Promise<any | null> {
    try {
      const now = new Date();
      const today = this.getLocalDateString(now);
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .select('*')
        .eq('barber_id', barberId)
        .eq('status', 'scheduled')
        .or(`appointment_date.gt.${today},and(appointment_date.eq.${today},appointment_time.gte.${currentTime})`)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true })
        .limit(1)
        .single();

      if (appointmentError && appointmentError.code !== 'PGRST116') throw appointmentError;
      if (!appointment) return null;

      // Fetch customer profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, email')
        .eq('id', appointment.user_id)
        .single();

      if (profileError) console.error('Error fetching customer profile:', profileError);

      return {
        ...appointment,
        customer: profile || null,
      };
    } catch (error) {
      console.error('Error fetching barber next appointment:', error);
      return null;
    }
  }

  /**
   * Get appointments for a barber within a date range
   */
  static async getBarberAppointmentsByDateRange(
    barberId: string,
    startDate: string,
    endDate: string
  ): Promise<any[]> {
    try {
      // Fetch appointments
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .eq('barber_id', barberId)
        .gte('appointment_date', startDate)
        .lte('appointment_date', endDate)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (appointmentsError) throw appointmentsError;
      if (!appointments || appointments.length === 0) return [];

      // Extract unique user IDs
      const userIds = [...new Set(appointments.map(apt => apt.user_id))];

      // Fetch customer profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, email')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Create a map of profiles for quick lookup
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Merge appointments with customer data
      return appointments.map(apt => ({
        ...apt,
        customer: profileMap.get(apt.user_id) || null,
      }));
    } catch (error) {
      console.error('Error fetching barber appointments by date range:', error);
      return [];
    }
  }

  /**
   * Get barber appointments with flexible filtering for appointments screen
   */
  static async getBarberAppointments(
    barberId: string,
    filter: 'today' | 'upcoming' | 'past',
    dateRange?: { start: string; end: string }
  ): Promise<any[]> {
    try {
      const today = this.getLocalDateString(new Date());
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      let query = supabase
        .from('appointments')
        .select('*')
        .eq('barber_id', barberId);

      // Apply filter logic
      if (filter === 'today') {
        query = query
          .eq('appointment_date', today)
          .eq('status', 'scheduled');
      } else if (filter === 'upcoming') {
        // Get upcoming appointments (future dates OR today but later time)
        if (dateRange) {
          query = query
            .gte('appointment_date', dateRange.start)
            .lte('appointment_date', dateRange.end);
        } else {
          query = query.gte('appointment_date', today);
        }
        query = query.eq('status', 'scheduled');
      } else if (filter === 'past') {
        // Get past appointments (past dates OR completed/cancelled/no-show)
        if (dateRange) {
          query = query
            .gte('appointment_date', dateRange.start)
            .lte('appointment_date', dateRange.end);
        } else {
          // Default to last 90 days
          const ninetyDaysAgo = new Date();
          ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
          const startDate = this.getLocalDateString(ninetyDaysAgo);
          query = query.gte('appointment_date', startDate);
        }
        // Include past scheduled appointments or any completed/cancelled/no-show
        query = query.or(`appointment_date.lt.${today},status.in.(completed,cancelled,no_show)`);
      }

      // Sort order
      if (filter === 'past') {
        query = query
          .order('appointment_date', { ascending: false })
          .order('appointment_time', { ascending: false });
      } else {
        query = query
          .order('appointment_date', { ascending: true })
          .order('appointment_time', { ascending: true });
      }

      const { data: appointments, error: appointmentsError } = await query;

      if (appointmentsError) throw appointmentsError;
      if (!appointments || appointments.length === 0) return [];

      console.log(`🔍 AppointmentService: Fetched ${appointments.length} ${filter} appointments`);

      // Extract unique user IDs, filtering out nulls (walk-ins)
      const userIds = [...new Set(appointments.map(apt => apt.user_id).filter(id => id !== null))];

      // Fetch customer profiles only if there are user IDs
      let profiles: any[] = [];
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, email')
          .in('id', userIds);

        if (profilesError) throw profilesError;
        profiles = profilesData || [];
      }

      // Create a map of profiles for quick lookup
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Merge appointments with customer data and map to Appointment objects
      const merged = appointments.map(apt =>
        this.mapToAppointment({
          ...apt,
          customer: profileMap.get(apt.user_id) || null,
        })
      );

      return merged;
    } catch (error) {
      console.error(`Error fetching barber ${filter} appointments:`, error);
      return [];
    }
  }

  /**
   * Update appointment status (barber action)
   */
  static async updateAppointmentStatus(
    appointmentId: string,
    status: 'completed' | 'cancelled' | 'no_show'
  ): Promise<Appointment> {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase
        .from('appointments')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId)
        .eq('barber_id', session.session.user.id) // Ensure barber owns appointment
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Appointment not found or unauthorized');

      console.log(`✅ Appointment ${appointmentId} status updated to: ${status}`);
      return this.mapToAppointment(data);
    } catch (error) {
      console.error('Error updating appointment status:', error);
      throw error;
    }
  }

  private static mapToAppointment(dbRecord: any): Appointment {
    return {
      id: dbRecord.id,
      serviceId: dbRecord.service_id,
      serviceName: dbRecord.service_name,
      serviceDuration: dbRecord.service_duration,
      servicePrice: dbRecord.service_price,
      appointmentDate: dbRecord.appointment_date,
      appointmentTime: dbRecord.appointment_time,
      status: dbRecord.status,
      specialRequests: dbRecord.special_requests,
      location: dbRecord.location,
      paymentMethod: dbRecord.payment_method,
      creditsUsed: dbRecord.credits_used,
      rating: dbRecord.rating,
      reviewText: dbRecord.review_text,
      reviewPhotoUrl: dbRecord.review_photo_url,
      barberId: dbRecord.barber_id,
      appointmentType: dbRecord.appointment_type || 'booking',
      customerName: dbRecord.customer_name,
      customerPhone: dbRecord.customer_phone,
      createdAt: dbRecord.created_at,
      updatedAt: dbRecord.updated_at
    };
  }
}