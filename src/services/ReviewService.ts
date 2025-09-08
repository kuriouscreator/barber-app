import { supabase } from '../lib/supabase';

export interface BarberReview {
  id: string;
  appointmentId: string;
  customerName: string;
  barberId: string;
  rating: number;
  reviewText: string;
  reviewPhotoUrl?: string;
  serviceName: string;
  appointmentDate: string;
  createdAt: string;
}

export class ReviewService {
  /**
   * Get all reviews for a specific barber
   */
  static async getBarberReviews(barberId: string): Promise<BarberReview[]> {
    try {
      // Skip if barberId is not a valid UUID (like "1")
      if (!barberId || barberId === "1" || barberId.length < 10) {
        console.log('Invalid barber ID, returning empty reviews:', barberId);
        return [];
      }

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          rating,
          review_text,
          review_photo_url,
          service_name,
          appointment_date,
          created_at,
          user_id,
          barber_id
        `)
        .eq('barber_id', barberId)
        .not('rating', 'is', null)
        .not('review_text', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user names separately since the foreign key relationship isn't working
      const userIds = [...new Set(data.map((appointment: any) => appointment.user_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      if (profilesError) {
        console.warn('Error fetching user profiles:', profilesError);
      }

      const profileMap = new Map();
      if (profiles) {
        profiles.forEach((profile: any) => {
          profileMap.set(profile.id, profile.full_name);
        });
      }

      return data.map((appointment: any) => ({
        id: appointment.id,
        appointmentId: appointment.id,
        customerName: profileMap.get(appointment.user_id) || 'Anonymous',
        barberId: barberId,
        rating: appointment.rating,
        reviewText: appointment.review_text,
        reviewPhotoUrl: appointment.review_photo_url,
        serviceName: appointment.service_name,
        appointmentDate: appointment.appointment_date,
        createdAt: appointment.created_at,
      }));
    } catch (error) {
      console.error('Error fetching barber reviews:', error);
      throw error;
    }
  }

  /**
   * Get barber statistics (average rating, total reviews)
   */
  static async getBarberStats(barberId: string): Promise<{
    averageRating: number;
    totalReviews: number;
  }> {
    try {
      // Skip if barberId is not a valid UUID (like "1")
      if (!barberId || barberId === "1" || barberId.length < 10) {
        console.log('Invalid barber ID, returning default stats:', barberId);
        return { averageRating: 0, totalReviews: 0 };
      }

      const { data, error } = await supabase
        .from('appointments')
        .select('rating')
        .eq('barber_id', barberId)
        .not('rating', 'is', null);

      if (error) throw error;

      const reviews = data || [];
      const totalReviews = reviews.length;
      const averageRating = totalReviews > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
        : 0;

      return {
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        totalReviews,
      };
    } catch (error) {
      console.error('Error fetching barber stats:', error);
      throw error;
    }
  }
}
