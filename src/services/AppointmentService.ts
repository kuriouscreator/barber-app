import { Alert } from 'react-native';
import { Appointment, User, Review } from '../types';

export class AppointmentService {
  // Mock data storage - in a real app, this would be API calls
  private static appointments: Appointment[] = [];
  private static users: { [key: string]: User } = {};
  private static barbers: { [key: string]: any } = {
    'barber-1': {
      id: 'barber-1',
      name: "Mike's Barbershop",
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    }
  };

  // Initialize with mock data
  static initialize() {
    // Mock appointments with credit tracking
    this.appointments = [
      // Upcoming appointments
      {
        id: '1',
        userId: 'customer-1',
        barberId: 'barber-1',
        date: '2024-12-30',
        time: '2:30 PM',
        service: 'Classic Haircut',
        status: 'scheduled',
        creditUsed: true, // This appointment used a credit
      },
      {
        id: '2',
        userId: 'customer-1',
        barberId: 'barber-1',
        date: '2025-01-13',
        time: '10:00 AM',
        service: 'Beard Trim',
        status: 'scheduled',
        creditUsed: true, // This appointment used a credit
      },
      // Past appointments
      {
        id: '3',
        userId: 'customer-1',
        barberId: 'barber-1',
        date: '2024-12-28',
        time: '2:30 PM',
        service: 'Classic Haircut',
        status: 'completed',
        creditUsed: true,
        rating: null, // Not reviewed yet
      },
      {
        id: '4',
        userId: 'customer-1',
        barberId: 'barber-1',
        date: '2024-12-15',
        time: '11:00 AM',
        service: 'Beard Trim + Haircut',
        status: 'completed',
        creditUsed: true,
        rating: 4, // Reviewed with 4 stars
      },
      {
        id: '5',
        userId: 'customer-1',
        barberId: 'barber-1',
        date: '2024-12-01',
        time: '3:15 PM',
        service: 'Fade Cut',
        status: 'completed',
        creditUsed: true,
        rating: 5, // Reviewed with 5 stars
      },
      {
        id: '6',
        userId: 'customer-1',
        barberId: 'barber-1',
        date: '2024-11-20',
        time: '1:45 PM',
        service: 'Classic Haircut',
        status: 'completed',
        creditUsed: true,
        rating: null, // Not reviewed yet
      },
      {
        id: '7',
        userId: 'customer-1',
        barberId: 'barber-1',
        date: '2024-11-05',
        time: '10:30 AM',
        service: 'Beard Trim',
        status: 'completed',
        creditUsed: true,
      },
      {
        id: '8',
        userId: 'customer-1',
        barberId: 'barber-1',
        date: '2024-10-22',
        time: '4:00 PM',
        service: 'Haircut + Styling',
        status: 'completed',
        creditUsed: true,
      },
      {
        id: '9',
        userId: 'customer-1',
        barberId: 'barber-1',
        date: '2024-10-08',
        time: '2:15 PM',
        service: 'Classic Haircut',
        status: 'completed',
        creditUsed: true,
      },
      {
        id: '10',
        userId: 'customer-1',
        barberId: 'barber-1',
        date: '2024-09-25',
        time: '11:45 AM',
        service: 'Beard Trim + Haircut',
        status: 'completed',
        creditUsed: true,
      },
      {
        id: '11',
        userId: 'customer-1',
        barberId: 'barber-1',
        date: '2024-09-10',
        time: '3:30 PM',
        service: 'Fade Cut',
        status: 'completed',
        creditUsed: true,
      },
      {
        id: '12',
        userId: 'customer-1',
        barberId: 'barber-1',
        date: '2024-08-28',
        time: '1:00 PM',
        service: 'Classic Haircut',
        status: 'completed',
        creditUsed: true,
      },
    ];

    // Mock user data
    this.users = {
      'customer-1': {
        id: 'customer-1',
        name: 'John Doe',
        email: 'customer@demo.com',
        phone: '+1 (555) 123-4567',
        role: 'customer',
        credits: 1, // User has 1 credit remaining (3 total - 2 used)
        subscription: {
          id: '2',
          name: 'Premium',
          price: 79.99,
          credits: 3,
          duration: 'monthly',
          description: '3 haircuts per month',
        },
      },
    };
  }

  // Get user's upcoming appointments
  static getUpcomingAppointments(userId: string): Appointment[] {
    return this.appointments.filter(
      apt => apt.userId === userId && 
      (apt.status === 'scheduled' || apt.status === 'confirmed')
    );
  }

  // Get user's past appointments
  static getPastAppointments(userId: string): Appointment[] {
    return this.appointments.filter(
      apt => apt.userId === userId && 
      (apt.status === 'completed' || apt.status === 'cancelled')
    );
  }

  // Cancel an appointment and restore credit if applicable
  static cancelAppointment(appointmentId: string, userId: string): Promise<boolean> {
    return new Promise((resolve) => {
      const appointment = this.appointments.find(apt => apt.id === appointmentId);
      const user = this.users[userId];

      if (!appointment || !user) {
        resolve(false);
        return;
      }

      // Update appointment status
      appointment.status = 'cancelled';

      // Restore credit if one was used
      if (appointment.creditUsed && user.subscription && user.credits < user.subscription.credits) {
        user.credits += 1;
        console.log(`Credit restored! User now has ${user.credits} credits.`);
      }

      resolve(true);
    });
  }

  // Get user data
  static getUser(userId: string): User | undefined {
    return this.users[userId];
  }

  // Update user data
  static updateUser(userId: string, userData: Partial<User>): void {
    if (this.users[userId]) {
      this.users[userId] = { ...this.users[userId], ...userData };
    }
  }

  // Book a new appointment (deduct credit)
  static bookAppointment(appointment: Omit<Appointment, 'id' | 'status'>): Promise<string> {
    return new Promise((resolve) => {
      const user = this.users[appointment.userId];
      
      if (!user || user.credits <= 0) {
        resolve('');
        return;
      }

      // Create new appointment
      const newAppointment: Appointment = {
        ...appointment,
        id: Date.now().toString(),
        status: 'scheduled',
        creditUsed: true, // Mark that this appointment used a credit
      };

      this.appointments.push(newAppointment);

      // Deduct credit
      user.credits -= 1;

      resolve(newAppointment.id);
    });
  }

  // Submit a review for an appointment
  static submitReview(appointmentId: string, reviewData: {
    rating: number;
    text: string;
    photos: string[];
  }): boolean {
    const appointment = this.appointments.find(apt => apt.id === appointmentId);
    if (!appointment) {
      console.error('Appointment not found:', appointmentId);
      return false;
    }

    if (appointment.status !== 'completed') {
      console.error('Can only review completed appointments');
      return false;
    }

    const user = this.users[appointment.userId];
    if (!user) {
      console.error('User not found:', appointment.userId);
      return false;
    }

    const review: Review = {
      id: `review-${Date.now()}`,
      appointmentId: appointment.id,
      customerId: appointment.userId,
      customerName: user.name,
      barberId: appointment.barberId,
      rating: reviewData.rating,
      text: reviewData.text,
      photos: reviewData.photos,
      date: new Date().toISOString().split('T')[0],
      service: appointment.service,
    };

    // Update appointment with review
    appointment.review = review;
    appointment.rating = reviewData.rating;

    console.log('Review submitted:', review);
    return true;
  }

  // Get reviews for a specific barber
  static getBarberReviews(barberId: string): Review[] {
    return this.appointments
      .filter(apt => apt.barberId === barberId && apt.review)
      .map(apt => apt.review!)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // Get barber rating and review count
  static getBarberStats(barberId: string): { rating: number; reviewCount: number } {
    const reviews = this.getBarberReviews(barberId);
    if (reviews.length === 0) {
      return { rating: 0, reviewCount: 0 };
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    return {
      rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
      reviewCount: reviews.length,
    };
  }

  // Get barber information by ID
  static getBarberInfo(barberId: string): { id: string; name: string; avatar: string } | null {
    return this.barbers[barberId] || null;
  }
}
