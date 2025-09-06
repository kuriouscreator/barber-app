import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types';
import { useApp } from '../context/AppContext';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';

type CheckInScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CheckIn'>;
type CheckInScreenRouteProp = RouteProp<RootStackParamList, 'CheckIn'>;

interface Props {
  navigation: CheckInScreenNavigationProp;
  route: CheckInScreenRouteProp;
}

const CheckInScreen: React.FC<Props> = ({ navigation, route }) => {
  const { appointmentId } = route.params;
  const { state, checkIn } = useApp();
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  const appointment = state.appointments.find(apt => apt.id === appointmentId);

  if (!appointment) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.accent.error} />
          <Text style={styles.errorTitle}>Appointment Not Found</Text>
          <Text style={styles.errorText}>
            The appointment you're looking for could not be found.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleCheckIn = () => {
    Alert.alert(
      'Check In',
      'Are you sure you want to check in for your appointment? The barber will be notified.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Check In', 
          onPress: () => {
            setIsCheckingIn(true);
            setTimeout(() => {
              checkIn(appointmentId);
              setIsCheckingIn(false);
              Alert.alert(
                'Checked In!',
                'You have successfully checked in. The barber will approve your check-in shortly.',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
            }, 1000);
          }
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return colors.accent.success;
      case 'arrived':
        return colors.accent.warning;
      case 'rejected':
        return colors.accent.error;
      default:
        return colors.gray[400];
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'arrived':
        return 'Waiting for Approval';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Not Checked In';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Appointment Details */}
        <View style={styles.appointmentCard}>
          <View style={styles.appointmentHeader}>
            <Ionicons name="calendar-outline" size={32} color={colors.accent.primary} />
            <Text style={styles.appointmentTitle}>Appointment Details</Text>
          </View>
          
          <View style={styles.appointmentInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Service</Text>
              <Text style={styles.infoValue}>{appointment.service}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date</Text>
              <Text style={styles.infoValue}>{formatDate(appointment.date)}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Time</Text>
              <Text style={styles.infoValue}>{formatTime(appointment.time)}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status</Text>
              <View style={styles.statusContainer}>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: getStatusColor(appointment.checkInStatus) }
                ]} />
                <Text style={styles.statusText}>
                  {getStatusText(appointment.checkInStatus)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Check-in Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>Check-in Instructions</Text>
          <View style={styles.instructionItem}>
            <Ionicons name="location-outline" size={20} color={colors.accent.primary} />
            <Text style={styles.instructionText}>
              Make sure you're at the barbershop location
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Ionicons name="time-outline" size={20} color={colors.accent.primary} />
            <Text style={styles.instructionText}>
              Check in when you arrive for your appointment
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Ionicons name="checkmark-circle-outline" size={20} color={colors.accent.primary} />
            <Text style={styles.instructionText}>
              Wait for barber approval before your service begins
            </Text>
          </View>
        </View>

        {/* Check-in Button */}
        {appointment.checkInStatus === 'pending' && (
          <TouchableOpacity
            style={[
              styles.checkInButton,
              isCheckingIn && styles.checkInButtonDisabled,
            ]}
            onPress={handleCheckIn}
            disabled={isCheckingIn}
          >
            <Ionicons 
              name={isCheckingIn ? "hourglass-outline" : "checkmark-circle-outline"} 
              size={24} 
              color={colors.white} 
            />
            <Text style={styles.checkInButtonText}>
              {isCheckingIn ? 'Checking In...' : 'I\'ve Arrived'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Status Messages */}
        {appointment.checkInStatus === 'arrived' && (
          <View style={styles.statusMessage}>
            <Ionicons name="time-outline" size={24} color={colors.accent.warning} />
            <Text style={styles.statusMessageText}>
              You're checked in! Waiting for barber approval.
            </Text>
          </View>
        )}

        {appointment.checkInStatus === 'approved' && (
          <View style={styles.statusMessage}>
            <Ionicons name="checkmark-circle-outline" size={24} color={colors.accent.success} />
            <Text style={styles.statusMessageText}>
              Check-in approved! Your service will begin shortly.
            </Text>
          </View>
        )}

        {appointment.checkInStatus === 'rejected' && (
          <View style={styles.statusMessage}>
            <Ionicons name="close-circle-outline" size={24} color={colors.accent.error} />
            <Text style={styles.statusMessageText}>
              Check-in was rejected. Please speak with the barber.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  backButton: {
    backgroundColor: colors.black,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  appointmentCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  appointmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  appointmentTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginLeft: spacing.sm,
  },
  appointmentInfo: {
    gap: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  infoValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  statusText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  instructionsCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  instructionsTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  instructionText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginLeft: spacing.sm,
    flex: 1,
  },
  checkInButton: {
    backgroundColor: colors.accent.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  checkInButtonDisabled: {
    opacity: 0.6,
  },
  checkInButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginLeft: spacing.sm,
  },
  statusMessage: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: colors.accent.warning,
    ...shadows.sm,
  },
  statusMessageText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    marginLeft: spacing.sm,
    flex: 1,
  },
});

export default CheckInScreen;
