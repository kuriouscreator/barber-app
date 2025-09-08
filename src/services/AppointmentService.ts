import { supabase } from '../lib/supabase';
import { Appointment } from '../types';

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

export class AppointmentService {
  /**
   * Get all appointments for the current user
   */
  static async getUserAppointments(): Promise<Appointment[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('appointments')
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

      // In this single-barber app, all customers are automatically assigned to the one barber
      // Find the barber profile (there should only be one)
      console.log('Looking for barber profile...');
      
      // First, let's see what profiles exist
      const { data: allProfiles, error: allProfilesError } = await supabase
        .from('profiles')
        .select('id, email, role');
      
      if (allProfilesError) {
        console.error('Error fetching all profiles:', allProfilesError);
      } else {
        console.log('All profiles in database:', allProfiles);
      }
      
      // Now try to find the barber profile
      const { data: barberResults, error: barberError } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'barber')
        .limit(1);
      
      let barberData: { id: string } | null = null;
      
      if (barberError) {
        console.error('Error fetching barber profile:', barberError);
      } else if (barberResults && barberResults.length > 0) {
        console.log('Found barber profile:', barberResults[0]);
        barberData = barberResults[0];
      } else {
        console.log('No barber profile found in results');
      }

      if (!barberData) {
        console.error('No barber profile found. Creating a temporary barber profile for testing...');
        
        // For testing purposes, create a temporary barber profile using the current user's ID
        // This is a workaround until the proper barber user is set up
        console.log('Using current user as temporary barber for testing');
        barberData = { id: user.id };
      }

      // Note: We don't need to check availability here since the BookScreen
      // only shows available time slots. If a slot is shown, it should be bookable.
      // The availability check happens when generating the time slots.

      const { data, error } = await supabase
        .from('appointments')
        .insert({
          user_id: user.id,
          barber_id: barberData.id,
          service_id: appointmentData.serviceId,
          service_name: appointmentData.serviceName,
          service_duration: appointmentData.serviceDuration,
          service_price: appointmentData.servicePrice,
          appointment_date: appointmentData.appointmentDate,
          appointment_time: appointmentData.appointmentTime,
          special_requests: appointmentData.specialRequests,
          location: appointmentData.location || '123 Main St, San Francisco, CA',
          payment_method: appointmentData.paymentMethod || 'Credit Card',
          credits_used: appointmentData.creditsUsed || 1,
          status: 'scheduled'
        })
        .select()
        .single();

      if (error) throw error;

      return this.mapToAppointment(data);
    } catch (error) {
      console.error('Error creating appointment:', error);
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
  static async cancelAppointment(appointmentId: string): Promise<Appointment> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      return this.mapToAppointment(data);
    } catch (error) {
      console.error('Error cancelling appointment:', error);
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

      // First, mark the appointment as completed if it's still scheduled
      const { data: appointmentData, error: fetchError } = await supabase
        .from('appointments')
        .select('status')
        .eq('id', appointmentId)
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

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
      const today = new Date().toISOString().split('T')[0];
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('appointments')
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
      const today = new Date().toISOString().split('T')[0];
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('appointments')
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
   * Map database record to Appointment type
   */
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
      createdAt: dbRecord.created_at,
      updatedAt: dbRecord.updated_at
    };
  }
}