import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cleanScheduler } from '../theme/cleanScheduler';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { Appointment } from '../types';

export interface CustomerAppointmentListItemProps {
  appointment: Appointment;
  onPress: () => void;
}

function formatDisplayDate(dateString: string): string {
  const today = new Date();
  const appointmentDate = new Date(dateString);
  if (appointmentDate.toDateString() === today.toDateString()) return 'Today';
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (appointmentDate.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return appointmentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTime(time?: string): string {
  if (!time) return '--:--';
  try {
    const [hours, minutes] = time.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return time;
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  } catch {
    return time || '--:--';
  }
}

export const CustomerAppointmentListItem: React.FC<CustomerAppointmentListItemProps> = ({
  appointment,
  onPress,
}) => {
  if (!appointment) return null;

  const serviceName = appointment.serviceName || 'Service';
  const barberOrShop = appointment.venue?.name || appointment.barberName || 'Barber';
  const dateStr = appointment.appointmentDate || appointment.date;
  const timeStr = appointment.appointmentTime || appointment.time;
  const dateTimeLabel = dateStr && timeStr
    ? `${formatDisplayDate(dateStr)} · ${formatTime(timeStr)}`
    : dateStr
      ? formatDisplayDate(dateStr)
      : '';

  const getStatusColor = (): string => {
    switch (appointment.status) {
      case 'cancelled':
      case 'no_show':
        return cleanScheduler.status.unavailable;
      case 'completed':
        return cleanScheduler.status.available;
      case 'scheduled':
      default:
        return cleanScheduler.text.subtext;
    }
  };

  const getStatusText = (): string => {
    switch (appointment.status) {
      case 'completed': return 'Completed';
      case 'cancelled': return 'Canceled';
      case 'no_show': return 'No-show';
      case 'scheduled':
      default: return 'Upcoming';
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconCircle}>
        <Ionicons name="cut-outline" size={20} color={cleanScheduler.text.subtext} />
      </View>

      <View style={styles.content}>
        <Text style={styles.serviceName} numberOfLines={1}>
          {serviceName}
        </Text>
        <Text style={styles.barberName} numberOfLines={1}>
          {barberOrShop}
        </Text>
        {dateTimeLabel ? (
          <Text style={styles.dateTime} numberOfLines={1}>
            {dateTimeLabel}
          </Text>
        ) : null}
      </View>

      <View style={styles.rightSection}>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
          <Text style={[styles.statusLabel, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={cleanScheduler.text.subtext} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: cleanScheduler.padding,
    minHeight: 44,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: cleanScheduler.secondary.bg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
    marginRight: spacing.sm,
    minWidth: 0,
  },
  serviceName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: cleanScheduler.text.heading,
    marginBottom: 2,
  },
  barberName: {
    fontSize: typography.fontSize.sm,
    color: cleanScheduler.text.body,
    marginBottom: 2,
  },
  dateTime: {
    fontSize: typography.fontSize.sm,
    color: cleanScheduler.text.subtext,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
});
