import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StripeProvider } from '@stripe/stripe-react-native';
import { AppProvider, useApp } from './src/context/AppContext';
import { AuthProvider, useAuth } from './src/hooks/useAuth';
import { mockServices, mockSubscriptions, mockBarber } from './src/data/mockData';
import AppNavigator from './src/navigation/AppNavigator';

const AppContent: React.FC = () => {
  const { dispatch } = useApp();
  const { loading } = useAuth();

  useEffect(() => {
    // Initialize mock data (subscriptions will be loaded from database)
    dispatch({ type: 'SET_SERVICES', payload: mockServices });
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
