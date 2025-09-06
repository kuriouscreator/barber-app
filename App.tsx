import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppProvider, useApp } from './src/context/AppContext';
import { mockServices, mockSubscriptions, mockBarber } from './src/data/mockData';
import AppNavigator from './src/navigation/AppNavigator';

const AppContent: React.FC = () => {
  const { dispatch } = useApp();

  useEffect(() => {
    // Initialize mock data
    dispatch({ type: 'SET_SERVICES', payload: mockServices });
    dispatch({ type: 'SET_SUBSCRIPTIONS', payload: mockSubscriptions });
    dispatch({ type: 'SET_BARBER', payload: mockBarber });
  }, [dispatch]);

  return (
    <>
      <AppNavigator />
      <StatusBar style="dark" />
    </>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
