import { Subscription, Barber, Service } from '../types';

export const mockSubscriptions: Subscription[] = [
  {
    id: '1',
    name: 'Basic',
    price: 29.99,
    credits: 1,
    duration: 'monthly',
    description: '1 haircut per month',
  },
  {
    id: '2',
    name: 'Premium',
    price: 79.99,
    credits: 3,
    duration: 'monthly',
    description: '3 haircuts per month',
  },
  {
    id: '3',
    name: 'Elite',
    price: 149.99,
    credits: 6,
    duration: 'monthly',
    description: '6 haircuts per month',
  },
];

export const mockBarber: Barber = {
  id: '1',
  name: 'Marcus Johnson',
  email: 'marcus@barbershop.com',
  phone: '(555) 123-4567',
  specialties: ['Classic Cuts', 'Beard Trimming', 'Styling'],
  availability: [
    { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isAvailable: true }, // Monday
    { dayOfWeek: 2, startTime: '09:00', endTime: '17:00', isAvailable: true }, // Tuesday
    { dayOfWeek: 3, startTime: '09:00', endTime: '17:00', isAvailable: true }, // Wednesday
    { dayOfWeek: 4, startTime: '09:00', endTime: '17:00', isAvailable: true }, // Thursday
    { dayOfWeek: 5, startTime: '09:00', endTime: '17:00', isAvailable: true }, // Friday
    { dayOfWeek: 6, startTime: '10:00', endTime: '15:00', isAvailable: true }, // Saturday
    { dayOfWeek: 0, startTime: '10:00', endTime: '15:00', isAvailable: false }, // Sunday
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
