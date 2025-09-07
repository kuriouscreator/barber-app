import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';

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
  onReschedule?: (id: string) => void;
  onCancel?: (id: string) => void;
  onReview?: (id: string) => void;
  onRebook?: (id: string) => void;
  showReviewButton?: boolean;
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
  onReschedule,
  onCancel,
  onReview,
  onRebook,
  showReviewButton = true,
}) => {
  // Function to render star rating
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Ionicons
        key={index}
        name={index < rating ? "star" : "star-outline"}
        size={12}
        color="#FFD700"
        style={{ marginRight: 2 }}
      />
    ));
  };
  return (
    <View style={styles.appointmentCard}>
      {/* Top Row: Image + Info + Date/Time */}
      <View style={styles.appointmentTopRow}>
        <Image source={{ uri: barberPhoto }} style={styles.barberPhoto} />
        <View style={styles.appointmentInfo}>
          <Text style={styles.barberName} numberOfLines={1}>{barberName}</Text>
          <Text style={styles.serviceName}>{service}</Text>
          <View style={styles.appointmentLocation}>
            <Ionicons name="location-outline" size={14} color={colors.text.secondary} />
            <Text style={styles.appointmentLocationText} numberOfLines={2} ellipsizeMode="tail">{location}</Text>
          </View>
          {!isUpcoming && rating && (
            <View style={styles.appointmentRating}>
              {renderStars(rating)}
            </View>
          )}
        </View>
        <View style={styles.appointmentRight}>
          <Text style={styles.appointmentDate}>{date}</Text>
          <Text style={styles.appointmentTime}>{time}</Text>
        </View>
      </View>
      
      {/* Divider */}
      <View style={styles.appointmentDivider} />
      
      {/* Bottom Row: Actions */}
      {isUpcoming ? (
        <View style={styles.appointmentBottomRow}>
          <TouchableOpacity 
            style={styles.rescheduleButton}
            onPress={() => onReschedule?.(id)}
          >
            <Text style={styles.rescheduleButtonText}>Reschedule</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => onCancel?.(id)}
          >
            <LinearGradient 
              start={{x:0, y:0}}
              end={{x:0, y:1}}
              colors={["#000080", "#1D4ED8"]}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : showReviewButton ? (
        <View style={styles.appointmentBottomRow}>
          <TouchableOpacity 
            style={styles.reviewButton}
            onPress={() => onReview?.(id)}
          >
            <Text style={styles.reviewButtonText}>Review</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => onRebook?.(id)}
          >
            <LinearGradient 
              start={{x:0, y:0}}
              end={{x:0, y:1}}
              colors={["#000080", "#1D4ED8"]}
              style={styles.rebookButton}
            >
              <Text style={styles.rebookButtonText}>Rebook</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity 
          onPress={() => onRebook?.(id)}
          style={styles.fullWidthRebookContainer}
        >
          <LinearGradient 
            start={{x:0, y:0}}
            end={{x:0, y:1}}
            colors={["#000080", "#1D4ED8"]}
            style={styles.fullWidthRebookButton}
          >
            <Text style={styles.rebookButtonText}>Rebook</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  appointmentCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 17,
    marginBottom: 16,
    shadowColor: '#0000000D',
    shadowOpacity: 0.1,
    shadowOffset: {
      width: 0,
      height: 1
    },
    shadowRadius: 2,
    elevation: 2,
  },
  appointmentTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 17,
    marginBottom: 12,
  },
  barberPhoto: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  appointmentInfo: {
    flex: 1,
  },
  barberName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  appointmentLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  appointmentLocationText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginLeft: 4,
  },
  appointmentRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  appointmentRight: {
    alignItems: 'flex-end',
  },
  appointmentDate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 2,
  },
  appointmentTime: {
    fontSize: 14,
    color: '#4B5563',
  },
  appointmentDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 17,
    marginVertical: 12,
  },
  appointmentBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 17,
    marginTop: 8,
    gap: 12,
  },
  fullWidthRebookContainer: {
    marginHorizontal: 17,
    marginTop: 8,
  },
  
  // Buttons
  rescheduleButton: {
    backgroundColor: colors.white,
    borderColor: colors.accent.primary,
    borderWidth: 1,
    borderRadius: borderRadius.button,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flex: 1,
  },
  rescheduleButtonText: {
    fontSize: 14,
    color: colors.accent.primary,
    fontWeight: typography.fontWeight.medium,
    textAlign: 'center',
  },
  cancelButton: {
    borderRadius: borderRadius.button,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flex: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    color: colors.white,
    fontWeight: typography.fontWeight.medium,
  },
  reviewButton: {
    backgroundColor: colors.white,
    borderColor: colors.accent.primary,
    borderWidth: 1,
    borderRadius: borderRadius.button,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flex: 1,
  },
  reviewButtonText: {
    fontSize: 14,
    color: colors.accent.primary,
    fontWeight: typography.fontWeight.medium,
    textAlign: 'center',
  },
  rebookButton: {
    borderRadius: borderRadius.button,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flex: 1,
    alignItems: 'center',
  },
  fullWidthRebookButton: {
    borderRadius: borderRadius.button,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  rebookButtonText: {
    fontSize: 14,
    color: colors.white,
    fontWeight: typography.fontWeight.medium,
  },
});

export default AppointmentCard;
