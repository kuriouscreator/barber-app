import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StripeProvider } from '@stripe/stripe-react-native';
import { AppProvider, useApp } from './src/context/AppContext';
import { AuthProvider, useAuth } from './src/hooks/useAuth';
import { mockServices, mockSubscriptions, mockBarber } from './src/data/mockData';
import { ServiceService } from './src/services/ServiceService';
import AppNavigator from './src/navigation/AppNavigator';

const AppContent: React.FC = () => {
  const { dispatch } = useApp();
  const { loading } = useAuth();

  useEffect(() => {
    // Load real services from database
    const loadServices = async () => {
      try {
        const services = await ServiceService.getServices();
        if (services.length > 0) {
          dispatch({ type: 'SET_SERVICES', payload: services });
        } else {
          // Fallback to mock services if no real services exist
          console.log('No services found in database, using mock services');
          dispatch({ type: 'SET_SERVICES', payload: mockServices });
        }
      } catch (error) {
        console.error('Error loading services, using mock services:', error);
        dispatch({ type: 'SET_SERVICES', payload: mockServices });
      }
    };

    loadServices();
    dispatch({ type: 'SET_BARBER', payload: mockBarber });
    // Note: Subscriptions are now loaded from Stripe/database via SubscriptionScreen
  }, [dispatch]);

  if (loading) {
    return null; // Or a loading screen
  }

  return (
    <>
      <AppNavigator />
      <StatusBar style="dark" />
    </>
  );
};

export default function App() {
  return (
    <StripeProvider
      publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''}
      merchantIdentifier="merchant.com.barbercuts"
      urlScheme="barbercuts"
    >
      <AuthProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </AuthProvider>
    </StripeProvider>
  );
}
