import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { User, Subscription, Appointment } from '../types';

interface AppState {
  user: User | null;
  appointments: Appointment[];
  subscriptions: Subscription[];
  isLoading: boolean;
}

type AppAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_APPOINTMENTS'; payload: Appointment[] }
  | { type: 'ADD_APPOINTMENT'; payload: Appointment }
  | { type: 'UPDATE_APPOINTMENT'; payload: Appointment }
  | { type: 'SET_SUBSCRIPTIONS'; payload: Subscription[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'UPDATE_CREDITS'; payload: number };

const initialState: AppState = {
  user: null,
  appointments: [],
  subscriptions: [],
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
  bookAppointment: (appointment: Appointment) => void;
  updateAppointment: (appointment: Appointment) => void;
  checkIn: (appointmentId: string) => void;
  approveCheckIn: (appointmentId: string) => void;
  rejectCheckIn: (appointmentId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const login = (user: User) => {
    dispatch({ type: 'SET_USER', payload: user });
  };

  const logout = () => {
    dispatch({ type: 'SET_USER', payload: null });
    dispatch({ type: 'SET_APPOINTMENTS', payload: [] });
  };

  const bookAppointment = (appointment: Appointment) => {
    dispatch({ type: 'ADD_APPOINTMENT', payload: appointment });
  };

  const updateAppointment = (appointment: Appointment) => {
    dispatch({ type: 'UPDATE_APPOINTMENT', payload: appointment });
  };

  const checkIn = (appointmentId: string) => {
    const appointment = state.appointments.find(apt => apt.id === appointmentId);
    if (appointment) {
      const updatedAppointment = { ...appointment, checkInStatus: 'arrived' as const };
      dispatch({ type: 'UPDATE_APPOINTMENT', payload: updatedAppointment });
    }
  };

  const approveCheckIn = (appointmentId: string) => {
    const appointment = state.appointments.find(apt => apt.id === appointmentId);
    if (appointment && state.user) {
      const updatedAppointment = { ...appointment, checkInStatus: 'approved' as const };
      dispatch({ type: 'UPDATE_APPOINTMENT', payload: updatedAppointment });
      dispatch({ type: 'UPDATE_CREDITS', payload: state.user.credits - 1 });
    }
  };

  const rejectCheckIn = (appointmentId: string) => {
    const appointment = state.appointments.find(apt => apt.id === appointmentId);
    if (appointment) {
      const updatedAppointment = { ...appointment, checkInStatus: 'rejected' as const };
      dispatch({ type: 'UPDATE_APPOINTMENT', payload: updatedAppointment });
    }
  };

  const value: AppContextType = {
    state,
    dispatch,
    login,
    logout,
    bookAppointment,
    updateAppointment,
    checkIn,
    approveCheckIn,
    rejectCheckIn,
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
