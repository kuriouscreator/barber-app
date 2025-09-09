import { Subscription, Barber, Service, User } from '../types';

export const mockSubscriptions: Subscription[] = [
  {
    id: '1',
    name: 'Basic',
    price: 45,
    credits: 1,
    duration: 'monthly',
    description: '1 haircut per month',
  },
  {
    id: '2',
    name: 'Premium',
    price: 80,
    credits: 2,
    duration: 'monthly',
    description: '2 haircuts per month',
  },
  {
    id: '3',
    name: 'VIP',
    price: 120,
    credits: 4,
    duration: 'monthly',
    description: '4 haircuts per month',
  },
];

export const mockBarber: Barber = {
  id: '1',
  name: 'Marcus Johnson',
  email: 'marcus@barbershop.com',
  phone: '(555) 123-4567',
  specialties: ['Classic Cuts', 'Beard Trimming', 'Styling'],
  availability: [
    { dayOfWeek: 1, startTime: '9:00 AM', endTime: '5:00 PM', isAvailable: true }, // Monday
    { dayOfWeek: 2, startTime: '9:00 AM', endTime: '5:00 PM', isAvailable: true }, // Tuesday
    { dayOfWeek: 3, startTime: '9:00 AM', endTime: '5:00 PM', isAvailable: true }, // Wednesday
    { dayOfWeek: 4, startTime: '9:00 AM', endTime: '5:00 PM', isAvailable: true }, // Thursday
    { dayOfWeek: 5, startTime: '9:00 AM', endTime: '5:00 PM', isAvailable: true }, // Friday
    { dayOfWeek: 6, startTime: '10:00 AM', endTime: '3:00 PM', isAvailable: true }, // Saturday
    { dayOfWeek: 0, startTime: '10:00 AM', endTime: '3:00 PM', isAvailable: false }, // Sunday
  ],
  scheduleExceptions: [
    // Example: Christmas Day - not available
    {
      id: '1',
      date: '2024-12-25',
      startTime: '12:00 AM',
      endTime: '12:00 AM',
      isAvailable: false,
      reason: 'Christmas Day - Closed',
    },
    // Example: New Year's Eve - early closing
    {
      id: '2',
      date: '2024-12-31',
      startTime: '9:00 AM',
      endTime: '2:00 PM',
      isAvailable: true,
      reason: 'New Year\'s Eve - Early closing',
    },
  ],
};

export const mockServices: Service[] = [
  {
    id: '1',
    name: 'Classic Haircut',
    duration: 30,
    price: 25,
    description: 'Traditional men\'s haircut with styling',
  },
  {
    id: '2',
    name: 'Beard Trim',
    duration: 20,
    price: 15,
    description: 'Professional beard trimming and shaping',
  },
  {
    id: '3',
    name: 'Haircut + Beard',
    duration: 45,
    price: 35,
    description: 'Complete grooming package',
  },
  {
    id: '4',
    name: 'Styling',
    duration: 15,
    price: 10,
    description: 'Hair styling and finishing',
  },
];

// Demo accounts for testing
export const demoUsers: { [key: string]: User } = {
  customer: {
    id: 'customer-1',
    name: 'John Doe',
    email: 'customer@demo.com',
    phone: '+1 (555) 123-4567',
    role: 'customer',
    credits: 3,
    subscription: {
      id: '2',
      name: 'Premium',
      price: 79.99,
      credits: 3,
      duration: 'monthly',
      description: '3 haircuts per month',
    },
  },
  barber: {
    id: 'barber-1',
    name: 'Marcus Johnson',
    email: 'barber@demo.com',
    phone: '+1 (555) 987-6543',
    role: 'barber',
    credits: 0, // Barbers don't need credits
  },
};
