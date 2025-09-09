import { supabase } from '../lib/supabase';
import { Service } from '../types';

export class ServiceService {
  /**
   * Get all active services from the database
   */
  static async getServices(): Promise<Service[]> {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error fetching services:', error);
        throw error;
      }

      return data?.map(this.mapToService) || [];
    } catch (error) {
      console.error('Error getting services:', error);
      return [];
    }
  }

  /**
   * Get services for a specific barber
   */
  static async getBarberServices(barberId: string): Promise<Service[]> {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('barber_id', barberId)
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error fetching barber services:', error);
        throw error;
      }

      return data?.map(this.mapToService) || [];
    } catch (error) {
      console.error('Error getting barber services:', error);
      return [];
    }
  }

  /**
   * Create a new service
   */
  static async createService(serviceData: {
    barberId: string;
    name: string;
    description?: string;
    duration: number;
    price: number;
  }): Promise<Service> {
    try {
      const { data, error } = await supabase
        .from('services')
        .insert({
          barber_id: serviceData.barberId,
          name: serviceData.name,
          description: serviceData.description,
          duration_minutes: serviceData.duration,
          price: serviceData.price,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      return this.mapToService(data);
    } catch (error) {
      console.error('Error creating service:', error);
      throw error;
    }
  }

  /**
   * Update an existing service
   */
  static async updateService(serviceId: string, updateData: {
    name?: string;
    description?: string;
    duration?: number;
    price?: number;
    isActive?: boolean;
  }): Promise<Service> {
    try {
      const { data, error } = await supabase
        .from('services')
        .update({
          name: updateData.name,
          description: updateData.description,
          duration_minutes: updateData.duration,
          price: updateData.price,
          is_active: updateData.isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', serviceId)
        .select()
        .single();

      if (error) throw error;

      return this.mapToService(data);
    } catch (error) {
      console.error('Error updating service:', error);
      throw error;
    }
  }

  /**
   * Delete a service (soft delete by setting is_active to false)
   */
  static async deleteService(serviceId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('services')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', serviceId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting service:', error);
      throw error;
    }
  }

  /**
   * Map database record to Service type
   */
  private static mapToService(dbRecord: any): Service {
    return {
      id: dbRecord.id,
      name: dbRecord.name,
      duration: dbRecord.duration_minutes,
      price: dbRecord.price,
      description: dbRecord.description || ''
    };
  }
}
