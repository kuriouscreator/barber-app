import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { spacing, borderRadius, shadows } from '../theme/spacing';
import { typography } from '../theme/typography';
import { Appointment } from '../types';
import { AppointmentTypeBadge } from './AppointmentTypeBadge';
import { format, parse } from 'date-fns';

interface BarberAppointmentListItemProps {
  appointment: Appointment;
  onPress: () => void;
}

export const BarberAppointmentListItem: React.FC<BarberAppointmentListItemProps> = ({
  appointment,
  onPress,
}) => {
  // Guard against undefined appointment
  if (!appointment) {
    return null;
  }

  // Get customer display name
  const customerName = appointment.appointmentType === 'walk_in'
    ? appointment.customerName || 'Walk-in Customer'
    : appointment.customer?.full_name || 'Unknown Customer';

  // Get customer initials for avatar fallback
  const getInitials = (name: string): string => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Format time to 12-hour format
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

  // Format date
  const formatDate = (date?: string): string => {
    if (!date) return '--';
    try {
      const parsedDate = parse(date, 'yyyy-MM-dd', new Date());
      return format(parsedDate, 'MMM dd');
    } catch {
      return date;
    }
  };

  // Get status badge color
  const getStatusColor = () => {
    switch (appointment.status) {
      case 'completed':
        return colors.accent.success;
      case 'cancelled':
        return colors.accent.error;
      case 'no_show':
        return colors.accent.warning;
      case 'scheduled':
      default:
        return colors.accent.primary;
    }
  };

  // Get status badge text
  const getStatusText = () => {
    switch (appointment.status) {
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'no_show':
        return 'No-show';
      case 'scheduled':
      default:
        return 'Scheduled';
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Left: Customer Avatar */}
      <View style={styles.avatarContainer}>
        {appointment.customer?.avatar_url && appointment.appointmentType !== 'walk_in' ? (
          <Image
            source={{ uri: appointment.customer.avatar_url }}
            style={styles.avatar}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.initials}>{getInitials(customerName)}</Text>
          </View>
        )}
      </View>

      {/* Center: Customer & Service Info */}
      <View style={styles.content}>
        <View style={styles.nameRow}>
          <Text style={styles.customerName} numberOfLines={1}>
            {customerName}
          </Text>
          {appointment.appointmentType && (
            <AppointmentTypeBadge type={appointment.appointmentType} size="small" />
          )}
        </View>
        <Text style={styles.serviceName} numberOfLines={1}>
          {appointment.serviceName || 'Unknown Service'}
        </Text>
        <Text style={styles.meta}>
          {appointment.serviceDuration || 0} min • ${appointment.servicePrice?.toFixed(2) || '0.00'}
        </Text>
      </View>

      {/* Right: Time & Status */}
      <View style={styles.rightSection}>
        {appointment.appointmentTime && (
          <Text style={styles.time}>{formatTime(appointment.appointmentTime)}</Text>
        )}
        {appointment.appointmentDate && (
          <Text style={styles.date}>{formatDate(appointment.appointmentDate)}</Text>
        )}
        {appointment.status && (
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor()}15` }]}>
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusText()}
            </Text>
          </View>
        )}
      </View>

      {/* Chevron */}
      <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  avatarContainer: {
    marginRight: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.accent.primary,
  },
  content: {
    flex: 1,
    marginRight: spacing.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  customerName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    flex: 1,
  },
  serviceName: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  meta: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  },
  rightSection: {
    alignItems: 'flex-end',
    marginRight: spacing.sm,
    minWidth: 80,
  },
  time: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  date: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
});
