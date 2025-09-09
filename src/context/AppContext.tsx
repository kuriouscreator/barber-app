import React, { createContext, useContext, useReducer, ReactNode, useEffect, useState, useRef, useCallback } from 'react';
import { User, Subscription, Appointment, Service, Barber, Availability, ScheduleException } from '../types';
import { useAuth } from '../hooks/useAuth';
import { getUserProfile } from '../services/profileService';
import { AppointmentService, CreateAppointmentData } from '../services/AppointmentService';
import { AvailabilityService } from '../services/AvailabilityService';
import { BillingService, UserSubscription } from '../services/billing';
import { supabase } from '../lib/supabase';

interface AppState {
  user: User | null;
  appointments: Appointment[];
  subscriptions: Subscription[];
  userSubscription: UserSubscription | null;
  services: Service[];
  barber: Barber | null;
  isLoading: boolean;
}

type AppAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_APPOINTMENTS'; payload: Appointment[] }
  | { type: 'ADD_APPOINTMENT'; payload: Appointment }
  | { type: 'UPDATE_APPOINTMENT'; payload: Appointment }
  | { type: 'SET_SUBSCRIPTIONS'; payload: Subscription[] }
  | { type: 'SET_USER_SUBSCRIPTION'; payload: UserSubscription | null }
  | { type: 'REFRESH_USER_SUBSCRIPTION' }
  | { type: 'SET_SERVICES'; payload: Service[] }
  | { type: 'ADD_SERVICE'; payload: Service }
  | { type: 'UPDATE_SERVICE'; payload: Service }
  | { type: 'DELETE_SERVICE'; payload: string }
  | { type: 'SET_BARBER'; payload: Barber | null }
  | { type: 'UPDATE_AVAILABILITY'; payload: Availability[] }
  | { type: 'ADD_SCHEDULE_EXCEPTION'; payload: ScheduleException }
  | { type: 'UPDATE_SCHEDULE_EXCEPTION'; payload: ScheduleException }
  | { type: 'DELETE_SCHEDULE_EXCEPTION'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'UPDATE_CREDITS'; payload: number };

const initialState: AppState = {
  user: null,
  appointments: [],
  subscriptions: [],
  userSubscription: null,
  services: [],
  barber: null,
  isLoading: false,
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_APPOINTMENTS':
      return { ...state, appointments: action.payload };
    case 'ADD_APPOINTMENT':
      return { ...state, appointments: [...state.appointments, action.payload] };
    case 'UPDATE_APPOINTMENT':
      return {
        ...state,
        appointments: state.appointments.map(apt =>
          apt.id === action.payload.id ? action.payload : apt
        ),
      };
    case 'SET_SUBSCRIPTIONS':
      return { ...state, subscriptions: action.payload };
    case 'SET_USER_SUBSCRIPTION':
      return { ...state, userSubscription: action.payload };
    case 'REFRESH_USER_SUBSCRIPTION':
      // This will be handled by the effect, just return current state
      return state;
    case 'SET_SERVICES':
      return { ...state, services: action.payload };
    case 'ADD_SERVICE':
      return { ...state, services: [...state.services, action.payload] };
    case 'UPDATE_SERVICE':
      return {
        ...state,
        services: state.services.map(service =>
          service.id === action.payload.id ? action.payload : service
        ),
      };
    case 'DELETE_SERVICE':
      return {
        ...state,
        services: state.services.filter(service => service.id !== action.payload),
      };
    case 'SET_BARBER':
      return { ...state, barber: action.payload };
    case 'UPDATE_AVAILABILITY':
      return {
        ...state,
        barber: state.barber ? { ...state.barber, availability: action.payload } : null,
      };
    case 'ADD_SCHEDULE_EXCEPTION':
      return {
        ...state,
        barber: state.barber ? { 
          ...state.barber, 
          scheduleExceptions: [...state.barber.scheduleExceptions, action.payload] 
        } : null,
      };
    case 'UPDATE_SCHEDULE_EXCEPTION':
      return {
        ...state,
        barber: state.barber ? {
          ...state.barber,
          scheduleExceptions: state.barber.scheduleExceptions.map(exception =>
            exception.id === action.payload.id ? action.payload : exception
          ),
        } : null,
      };
    case 'DELETE_SCHEDULE_EXCEPTION':
      return {
        ...state,
        barber: state.barber ? {
          ...state.barber,
          scheduleExceptions: state.barber.scheduleExceptions.filter(exception => exception.id !== action.payload),
        } : null,
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'UPDATE_CREDITS':
      return {
        ...state,
        user: state.user ? { ...state.user, credits: action.payload } : null,
      };
    default:
      return state;
  }
};

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  login: (user: User) => void;
  logout: () => void;
  bookAppointment: (appointmentData: CreateAppointmentData) => Promise<Appointment>;
  cancelAppointment: (appointmentId: string) => Promise<Appointment>;
  updateAppointment: (appointmentId: string, updateData: any) => Promise<Appointment>;
  addService: (service: Service) => void;
  updateService: (service: Service) => void;
  deleteService: (serviceId: string) => void;
  updateAvailability: (availability: Availability[]) => void;
  addScheduleException: (exception: ScheduleException) => void;
  updateScheduleException: (exception: ScheduleException) => void;
  deleteScheduleException: (exceptionId: string) => void;
  getAvailabilityForDate: (date: string) => { startTime: string; endTime: string; isAvailable: boolean } | null;
  syncUser: () => Promise<void>;
  loadUserSubscription: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { user: authUser, signOut } = useAuth();
  const lastSyncedUserIdRef = useRef<string | null>(null);

  // Simple effect to sync user when authUser changes
  useEffect(() => {
    const syncUser = async () => {
      if (authUser && lastSyncedUserIdRef.current !== authUser.id) {
        try {
          // Fetch user profile to get role and other details
          const profile = await getUserProfile(authUser.id);
          
          // Convert Supabase user to our User type
          const user: User = {
            id: authUser.id,
            name: profile?.full_name || authUser.email?.split('@')[0] || 'User',
            email: authUser.email || '',
            role: profile?.role || 'customer', // Use profile role or default to customer
            avatar: profile?.avatar_url || authUser.user_metadata?.avatar_url || null,
            phone: profile?.phone || authUser.user_metadata?.phone || null,
            memberSince: new Date(authUser.created_at).toISOString().split('T')[0],
            location: 'San Francisco, CA', // Default location
            credits: 4, // Default credits
          };
          dispatch({ type: 'SET_USER', payload: user });
          
          // Load user's appointments from Supabase
          const appointments = await AppointmentService.getUserAppointments();
          dispatch({ type: 'SET_APPOINTMENTS', payload: appointments });
          
          // Load user's subscription
          await loadUserSubscription();
          
          lastSyncedUserIdRef.current = authUser.id;
        } catch (error) {
          console.error('Error syncing user:', error);
          // Fallback to basic user data
          const user: User = {
            id: authUser.id,
            name: authUser.email?.split('@')[0] || 'User',
            email: authUser.email || '',
            role: 'customer',
            avatar: authUser.user_metadata?.avatar_url || null,
            phone: authUser.user_metadata?.phone || null,
            memberSince: new Date(authUser.created_at).toISOString().split('T')[0],
            location: 'San Francisco, CA',
            credits: 4, // Default credits
          };
          dispatch({ type: 'SET_USER', payload: user });
          lastSyncedUserIdRef.current = authUser.id;
        }
      } else if (!authUser && state.user) {
        // Clear user if no auth user and we had a user before
        dispatch({ type: 'SET_USER', payload: null });
        dispatch({ type: 'SET_APPOINTMENTS', payload: [] });
        dispatch({ type: 'SET_USER_SUBSCRIPTION', payload: null });
        lastSyncedUserIdRef.current = null;
      }
    };

    syncUser();
  }, [authUser?.id]);

  // Handle subscription refresh
  useEffect(() => {
    if (state.user && !state.userSubscription) {
      loadUserSubscription();
    }
  }, [state.user]);

  // Set up Realtime subscription for user_subscriptions table
  useEffect(() => {
    if (!state.user) return;

    const channel = supabase
      .channel('user_subscriptions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_subscriptions',
          filter: `user_id=eq.${state.user.id}`,
        },
        (payload) => {
          console.log('🔔 Subscription change detected:', payload);
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            // Refresh subscription data when webhook updates the database
            console.log('🔄 Refreshing subscription due to INSERT/UPDATE');
            loadUserSubscription();
          } else if (payload.eventType === 'DELETE') {
            // Clear subscription if deleted
            console.log('🗑️ Clearing subscription due to DELETE event');
            dispatch({ type: 'SET_USER_SUBSCRIPTION', payload: null });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [state.user?.id]);


  const login = (user: User) => {
    // This is now handled by Supabase auth, but keeping for compatibility
    dispatch({ type: 'SET_USER', payload: user });
  };

  const logout = async () => {
    try {
      // Clear local state immediately
      dispatch({ type: 'SET_USER', payload: null });
      dispatch({ type: 'SET_APPOINTMENTS', payload: [] });
      dispatch({ type: 'SET_USER_SUBSCRIPTION', payload: null });
      lastSyncedUserIdRef.current = null;
      
      // Then sign out from Supabase
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
      // Even if signOut fails, we've already cleared local state
    }
  };

  const bookAppointment = async (appointmentData: CreateAppointmentData) => {
    try {
      const appointment = await AppointmentService.createAppointment(appointmentData);
      dispatch({ type: 'ADD_APPOINTMENT', payload: appointment });
      return appointment;
    } catch (error) {
      console.error('Error booking appointment:', error);
      throw error;
    }
  };

  const cancelAppointment = async (appointmentId: string) => {
    try {
      const appointment = await AppointmentService.cancelAppointment(appointmentId);
      dispatch({ type: 'UPDATE_APPOINTMENT', payload: appointment });
      
      // Clear availability cache so that the freed time slot becomes available immediately
      AvailabilityService.clearCache();
      
      return appointment;
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      throw error;
    }
  };

  const updateAppointment = async (appointmentId: string, updateData: any) => {
    try {
      const appointment = await AppointmentService.updateAppointment(appointmentId, updateData);
      dispatch({ type: 'UPDATE_APPOINTMENT', payload: appointment });
      return appointment;
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }
  };


  const addService = (service: Service) => {
    dispatch({ type: 'ADD_SERVICE', payload: service });
  };

  const updateService = (service: Service) => {
    dispatch({ type: 'UPDATE_SERVICE', payload: service });
  };

  const deleteService = (serviceId: string) => {
    dispatch({ type: 'DELETE_SERVICE', payload: serviceId });
  };

  const updateAvailability = (availability: Availability[]) => {
    dispatch({ type: 'UPDATE_AVAILABILITY', payload: availability });
  };

  const addScheduleException = (exception: ScheduleException) => {
    dispatch({ type: 'ADD_SCHEDULE_EXCEPTION', payload: exception });
  };

  const updateScheduleException = (exception: ScheduleException) => {
    dispatch({ type: 'UPDATE_SCHEDULE_EXCEPTION', payload: exception });
  };

  const deleteScheduleException = (exceptionId: string) => {
    dispatch({ type: 'DELETE_SCHEDULE_EXCEPTION', payload: exceptionId });
  };

  const getAvailabilityForDate = (date: string) => {
    if (!state.barber) return null;

    // First check for schedule exceptions (they take priority)
    const exception = state.barber.scheduleExceptions.find(ex => ex.date === date);
    if (exception) {
      return {
        startTime: exception.startTime,
        endTime: exception.endTime,
        isAvailable: exception.isAvailable,
      };
    }

    // If no exception, use recurring weekly schedule
    const dayOfWeek = new Date(date).getDay();
    const weeklyAvailability = state.barber.availability.find(av => av.dayOfWeek === dayOfWeek);
    
    if (weeklyAvailability) {
      return {
        startTime: weeklyAvailability.startTime,
        endTime: weeklyAvailability.endTime,
        isAvailable: weeklyAvailability.isAvailable,
      };
    }

    return null;
  };

  const loadUserSubscription = async () => {
    try {
      console.log('🔄 Loading user subscription...');
      console.log('👤 Current user in context:', state.user?.id, state.user?.email);
      const subscription = await BillingService.getSubscription();
      console.log('📊 Subscription loaded:', subscription);
      
      if (subscription) {
        console.log('📋 Plan details:', {
          planName: subscription.plan_name,
          priceId: subscription.stripe_price_id,
          status: subscription.status,
          scheduledPlan: subscription.scheduled_plan_name,
          scheduledPriceId: subscription.scheduled_price_id,
          scheduledDate: subscription.scheduled_effective_date
        });
      }
      
      dispatch({ type: 'SET_USER_SUBSCRIPTION', payload: subscription });
    } catch (error) {
      console.error('❌ Error loading user subscription:', error);
    }
  };

  const refreshSubscription = async () => {
    await loadUserSubscription();
  };

  const value: AppContextType = {
    state,
    dispatch,
    login,
    logout,
    bookAppointment,
    cancelAppointment,
    updateAppointment,
    addService,
    updateService,
    deleteService,
    updateAvailability,
    addScheduleException,
    updateScheduleException,
    deleteScheduleException,
    getAvailabilityForDate,
    syncUser: async () => {}, // Dummy function since we're not exposing the real one
    loadUserSubscription,
    refreshSubscription,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
