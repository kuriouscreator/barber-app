import React from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList, MainTabParamList } from '../types';
import { useApp } from '../context/AppContext';
import { useAuth } from '../hooks/useAuth';
import { colors } from '../theme/colors';

// Screens
import SignInScreen from '../screens/SignInScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import HomeScreen from '../screens/HomeScreen';
import HomeScreenNative from '../screens/HomeScreenNative'; // New native version
import BookScreen from '../screens/BookScreen';
import AppointmentsScreen from '../screens/AppointmentsScreen';
import RewardsScreen from '../screens/RewardsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AdminScreen from '../screens/AdminScreen';
import BarberProfileScreen from '../screens/BarberProfileScreen';
import BarberDashboardScreen from '../screens/BarberDashboardScreen';
import BarberWeeklyScheduleScreen from '../screens/BarberWeeklyScheduleScreen';
import AppointmentDetailsScreen from '../screens/AppointmentDetailsScreen';
import ActivityScreen from '../screens/ActivityScreen';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createStackNavigator();

// Home Stack Navigator (includes Activity screen to keep tab bar visible)
const HomeStackNavigator = () => {
  const { state } = useApp();
  const isBarber = state.user?.role === 'barber';

  return (
    <HomeStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.white,
          borderBottomColor: colors.border.light,
          borderBottomWidth: 1,
        },
        headerTitleStyle: {
          color: colors.text.primary,
          fontSize: 18,
          fontWeight: '600',
        },
        headerTintColor: colors.text.primary,
      }}
    >
      <HomeStack.Screen
        name="HomeMain"
        component={isBarber ? BarberDashboardScreen : HomeScreenNative}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen
        name="Activity"
        component={ActivityScreen}
        options={{
          title: 'Activity',
          headerBackTitle: 'Back',
        }}
      />
    </HomeStack.Navigator>
  );
};

const MainTabNavigator = () => {
  const { state } = useApp();
  const isBarber = state.user?.role === 'barber';

  // Mock notification count for appointments
  const appointmentNotifications = 2;

  const renderTabIcon = (route: any, focused: boolean, color: string) => {
    let iconName: keyof typeof Ionicons.glyphMap;

    if (route.name === 'Home') {
      iconName = focused ? 'home' : 'home-outline';
    } else if (route.name === 'Book') {
      iconName = focused ? 'calendar' : 'calendar-outline';
    } else if (route.name === 'Appointments') {
      // For barbers, this is the Schedule tab
      iconName = isBarber
        ? (focused ? 'calendar' : 'calendar-outline')
        : (focused ? 'calendar-sharp' : 'calendar-outline');
    } else if (route.name === 'Rewards') {
      iconName = focused ? 'gift' : 'gift-outline';
    } else if (route.name === 'Profile') {
      iconName = focused ? 'person' : 'person-outline';
    } else if (route.name === 'Admin') {
      // For barbers, this is the Services tab
      iconName = isBarber
        ? (focused ? 'cut' : 'cut-outline')
        : (focused ? 'settings' : 'settings-outline');
    } else {
      iconName = 'help-outline';
    }

    return (
      <View style={{ position: 'relative' }}>
        <Ionicons name={iconName} size={20} color={color} />
        {route.name === 'Appointments' && appointmentNotifications > 0 && (
          <View style={{
            position: 'absolute',
            top: -2,
            right: -8,
            backgroundColor: colors.accent.error,
            borderRadius: 10,
            width: 20,
            height: 20,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <Text style={{
              color: colors.white,
              fontSize: 10,
              fontWeight: 'bold',
            }}>
              {appointmentNotifications}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => renderTabIcon(route, focused, color),
        tabBarActiveTintColor: colors.black,
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: 'colors.gray[100]',
          borderTopWidth: 1,
          paddingBottom: 30,
          paddingTop: 13,
          height: 100,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
        headerStyle: {
          backgroundColor: colors.white,
          borderBottomColor: colors.border.light,
          borderBottomWidth: 1,
          height: 120,
          paddingTop: 20,
        },
        headerTitleStyle: {
          color: colors.text.primary,
          fontSize: 18,
          fontWeight: '700',
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{ title: 'Home', headerShown: false }}
      />
      {!isBarber && (
        <Tab.Screen 
          name="Book" 
          component={BookScreen} 
          options={{ title: 'Book' }}
        />
      )}
      {!isBarber && (
        <Tab.Screen
          name="Appointments"
          component={AppointmentsScreen}
          options={{ title: 'Appointments' }}
        />
      )}
      {isBarber && (
        <Tab.Screen
          name="Appointments"
          component={BarberWeeklyScheduleScreen}
          options={{ title: 'Schedule' }}
        />
      )}
      {!isBarber && (
        <Tab.Screen
          name="Rewards"
          component={RewardsScreen}
          options={{ title: 'Rewards' }}
        />
      )}
      {isBarber && (
        <Tab.Screen
          name="Admin"
          component={AdminScreen}
          options={{ title: 'Services' }}
        />
      )}
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { state } = useApp();
  const { session } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.white,
            borderBottomColor: colors.border.light,
            borderBottomWidth: 1,
          },
          headerTitleStyle: {
            color: colors.text.primary,
            fontSize: 18,
            fontWeight: '600',
          },
          headerTintColor: colors.text.primary,
        }}
      >
        {session && state.user ? (
          <>
            <Stack.Screen
              name="Main"
              component={MainTabNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Subscription"
              component={SubscriptionScreen}
              options={{ title: 'Choose Subscription' }}
            />
            <Stack.Screen
              name="BarberProfile"
              component={BarberProfileScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="AppointmentDetails"
              component={AppointmentDetailsScreen}
              options={{ headerShown: false }}
            />
          </>
        ) : (
          // Show SignInScreen when not authenticated
          <Stack.Screen 
            name="SignIn" 
            component={SignInScreen} 
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
