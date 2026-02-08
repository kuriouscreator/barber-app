import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';
import { haptics } from '../utils/haptics';

// Utility function to convert 24hr time to 12hr format
const formatTimeTo12Hour = (time24: string): string => {
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${hour12}:${minutes} ${ampm}`;
};

// Helper to format date for the date box
const formatDateBox = (dateString: string) => {
  // Parse the date string directly to avoid timezone issues
  // Expected format: YYYY-MM-DD
  const [year, monthNum, dayNum] = dateString.split('T')[0].split('-').map(Number);

  // Create date object using local timezone (year, monthIndex, day)
  const date = new Date(year, monthNum - 1, dayNum);

  const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const day = date.getDate().toString().padStart(2, '0');
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
  return { month, day, weekday };
};

export interface AppointmentCardProps {
  id: string;
  barberName: string;
  service: string;
  date: string;
  time: string;
  location: string;
  barberPhoto: string;
  isUpcoming?: boolean;
  rating?: number | null;
  specialRequests?: string;
  serviceDuration?: number;
  status?: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  onPress?: (id: string) => void;
  onReschedule?: () => void;
  onCancel?: () => void;
  onConfirm?: () => void;
  onGetDirections?: () => void;
  onRebook?: () => void;
  onViewDetails?: () => void;
  barberId?: string;
  barberRating?: number;
  barberReviewCount?: number;
  appointmentDate?: string; // Full date string for date box formatting
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  id,
  barberName,
  service,
  date,
  time,
  location,
  barberPhoto,
  isUpcoming = true,
  rating = null,
  specialRequests,
  serviceDuration,
  status,
  onPress,
  onReschedule,
  onCancel,
  onConfirm,
  onGetDirections,
  onRebook,
  onViewDetails,
  barberId,
  barberRating = 4.8,
  barberReviewCount = 0,
  appointmentDate,
}) => {
  const getStatusBadge = () => {
    if (!status) return null;

    const statusConfig = {
      scheduled: { text: 'Confirmed', color: '#15803D', bgColor: '#F0FDF4' },
      completed: { text: 'Completed', color: '#15803D', bgColor: '#F0FDF4' },
      cancelled: { text: 'Cancelled', color: '#DC2626', bgColor: '#FEF2F2' },
      no_show: { text: 'No Show', color: colors.gray[600], bgColor: 'rgba(107,114,128,0.1)' },
    };

    const config = statusConfig[status];
    if (!config) return null;

    return (
      <View style={[styles.statusBadge, { backgroundColor: config.bgColor }]}>
        <Text style={[styles.statusBadgeText, { color: config.color }]}>{config.text}</Text>
      </View>
    );
  };

  // Format the date box
  const dateBoxData = appointmentDate ? formatDateBox(appointmentDate) : null;

  // Determine date box styling based on status
  const getDateBoxStyle = () => {
    if (status === 'scheduled') {
      return { box: styles.dateBoxConfirmed, text: styles.dateBoxTextConfirmed };
    } else if (status === 'cancelled') {
      return { box: styles.dateBoxCancelled, text: styles.dateBoxTextCancelled };
    } else {
      return { box: styles.dateBoxPending, text: styles.dateBoxTextPending };
    }
  };

  const dateBoxStyle = getDateBoxStyle();

  // Render appropriate buttons based on status
  const renderActionButtons = () => {
    if (status === 'scheduled') {
      // Upcoming appointments: View Details + Reschedule
      return (
        <>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => {
              haptics.light();
              if (onViewDetails) {
                onViewDetails();
              } else if (onPress) {
                onPress(id);
              }
            }}
          >
            <Text style={styles.primaryButtonText}>View Details</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => {
              haptics.light();
              if (onReschedule) onReschedule();
            }}
          >
            <Text style={styles.secondaryButtonText}>Reschedule</Text>
          </TouchableOpacity>
        </>
      );
    } else if (status === 'completed') {
      // Past appointments: View Details + Rebook
      return (
        <>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => {
              haptics.light();
              if (onViewDetails) {
                onViewDetails();
              } else if (onPress) {
                onPress(id);
              }
            }}
          >
            <Text style={styles.primaryButtonText}>View Details</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => {
              haptics.light();
              if (onRebook) onRebook();
            }}
          >
            <Text style={styles.secondaryButtonText}>Rebook</Text>
          </TouchableOpacity>
        </>
      );
    } else if (status === 'cancelled') {
      // Canceled appointments: Just Rebook button
      return (
        <TouchableOpacity
          style={[styles.primaryButton, { flex: 1 }]}
          onPress={() => {
            haptics.light();
            if (onRebook) onRebook();
          }}
        >
          <Text style={styles.primaryButtonText}>Rebook</Text>
        </TouchableOpacity>
      );
    }
    return null;
  };

  return (
    <View style={styles.appointmentCard}>
      <View style={styles.cardContent}>
        {/* Date Box on the Left */}
        {dateBoxData && (
          <View style={[styles.dateBox, dateBoxStyle.box]}>
            <Text style={[styles.dateBoxMonth, dateBoxStyle.text]}>
              {dateBoxData.month}
            </Text>
            <Text style={[styles.dateBoxDay, dateBoxStyle.text]}>
              {dateBoxData.day}
            </Text>
            <Text style={[styles.dateBoxWeekday, dateBoxStyle.text]}>
              {dateBoxData.weekday}
            </Text>
          </View>
        )}

        {/* Service Info */}
        <View style={styles.serviceInfo}>
          {/* Title and Status Badge */}
          <View style={styles.titleRow}>
            <View style={styles.serviceTitleContainer}>
              <Text style={styles.serviceTitle}>{service}</Text>
            </View>
            {getStatusBadge()}
          </View>

          {/* Time and Duration Icons */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={12} color={colors.gray[600]} />
              <Text style={styles.metaText}>{formatTimeTo12Hour(time)}</Text>
            </View>
            {serviceDuration && (
              <View style={styles.metaItem}>
                <Ionicons name="timer-outline" size={12} color={colors.gray[600]} />
                <Text style={styles.metaText}>{serviceDuration} min</Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {renderActionButtons()}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  appointmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 17,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    gap: 16,
  },

  // Date Box
  dateBox: {
    minWidth: 60,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateBoxConfirmed: {
    backgroundColor: 'rgba(51, 65, 85, 0.1)',
  },
  dateBoxPending: {
    backgroundColor: 'colors.gray[100]',
  },
  dateBoxCancelled: {
    backgroundColor: '#FEF2F2',
  },
  dateBoxMonth: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dateBoxDay: {
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 32,
  },
  dateBoxWeekday: {
    fontSize: 12,
    fontWeight: '500',
  },
  dateBoxTextConfirmed: {
    color: colors.gray[800],
  },
  dateBoxTextPending: {
    color: 'colors.gray[700]',
  },
  dateBoxTextCancelled: {
    color: '#DC2626',
  },

  // Service Info
  serviceInfo: {
    flex: 1,
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  serviceTitleContainer: {
    flex: 1,
    paddingRight: 8,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 24,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Meta Row (Time and Duration)
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: 'colors.gray[700]',
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 4,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: 'colors.gray[100]',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
});

export default AppointmentCard;
