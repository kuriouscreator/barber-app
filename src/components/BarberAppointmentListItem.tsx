import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cleanScheduler } from '../theme/cleanScheduler';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { Appointment } from '../types';
import { format, parse } from 'date-fns';

interface BarberAppointmentListItemProps {
  appointment: Appointment;
  onPress: () => void;
}

export const BarberAppointmentListItem: React.FC<BarberAppointmentListItemProps> = ({
  appointment,
  onPress,
}) => {
  if (!appointment) return null;

  const customerName = appointment.appointmentType === 'walk_in'
    ? appointment.customerName || 'Walk-in Customer'
    : appointment.customer?.full_name || 'Unknown Customer';

  const getInitials = (name: string): string => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const formatTime = (time?: string): string => {
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
  };

  const formatDate = (date?: string): string => {
    if (!date) return '--';
    try {
      const parsedDate = parse(date, 'yyyy-MM-dd', new Date());
      return format(parsedDate, 'MMM dd');
    } catch {
      return date;
    }
  };

  const isWalkIn = appointment.appointmentType === 'walk_in';
  const badgeBg = isWalkIn ? cleanScheduler.status.warning : cleanScheduler.status.available;
  const badgeLabel = isWalkIn ? 'W-I' : getInitials(customerName);

  const getStatusDotColor = (): string => {
    switch (appointment.status) {
      case 'completed':
        return cleanScheduler.status.available;
      case 'cancelled':
      case 'no_show':
        return cleanScheduler.status.unavailable;
      case 'scheduled':
      default:
        return cleanScheduler.status.available;
    }
  };

  const getStatusText = (): string => {
    switch (appointment.status) {
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      case 'no_show': return 'No-show';
      case 'scheduled':
      default: return 'Scheduled';
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.badge, { backgroundColor: badgeBg }]}>
        <Text style={styles.badgeText}>{badgeLabel}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.customerName} numberOfLines={1}>
          {customerName}
        </Text>
        <Text style={styles.serviceName} numberOfLines={1}>
          {appointment.serviceName || 'Unknown Service'}
        </Text>
        <Text style={styles.meta}>
          {appointment.serviceDuration || 0} min • ${appointment.servicePrice?.toFixed(2) || '0.00'}
        </Text>
      </View>

      <View style={styles.rightSection}>
        {appointment.appointmentTime && (
          <Text style={styles.time}>{formatTime(appointment.appointmentTime)}</Text>
        )}
        {appointment.appointmentDate && (
          <Text style={styles.date}>{formatDate(appointment.appointmentDate)}</Text>
        )}
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: getStatusDotColor() }]} />
          <Text style={[styles.statusLabel, { color: getStatusDotColor() }]}>
            {getStatusText()}
          </Text>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={20} color={cleanScheduler.text.subtext} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: cleanScheduler.padding,
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  content: {
    flex: 1,
    marginRight: spacing.sm,
  },
  customerName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: cleanScheduler.text.heading,
    marginBottom: 2,
  },
  serviceName: {
    fontSize: typography.fontSize.sm,
    color: cleanScheduler.text.body,
    marginBottom: 2,
  },
  meta: {
    fontSize: typography.fontSize.sm,
    color: cleanScheduler.text.subtext,
  },
  rightSection: {
    alignItems: 'flex-end',
    marginRight: spacing.sm,
    minWidth: 72,
  },
  time: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: cleanScheduler.text.heading,
    marginBottom: 2,
  },
  date: {
    fontSize: typography.fontSize.xs,
    color: cleanScheduler.text.subtext,
    marginBottom: spacing.xs,
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
