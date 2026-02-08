import React from 'react';
import { View, Text, StyleSheet, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { VenueDetails } from '../../types';

interface VenueHeaderProps {
  venue: VenueDetails;
}

export const VenueHeader: React.FC<VenueHeaderProps> = ({ venue }) => {
  const formatReviewCount = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={
          venue.imageUrl
            ? { uri: venue.imageUrl }
            : { uri: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&h=600&fit=crop' }
        }
        style={styles.imageBackground}
        imageStyle={styles.image}
      >
        <View style={styles.darkOverlay} />
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.8)']}
          locations={[0, 0.5, 1]}
          style={styles.gradient}
        >
          <View style={styles.content}>
            {venue.isTopRated && (
              <View style={styles.badge}>
                <Ionicons name="star" size={12} color={colors.yellow[500]} />
                <Text style={styles.badgeText}>TOP RATED VENUE</Text>
              </View>
            )}
            <View style={styles.titleContainer}>
              <Text style={styles.venueName}>{venue.name}</Text>
            </View>
            <View style={styles.locationRow}>
              <Ionicons name="location-sharp" size={9} color={colors.gray[300]} />
              <Text style={styles.locationText}>
                {venue.city} • {venue.rating.toFixed(1)} ({formatReviewCount(venue.reviewCount)} reviews)
              </Text>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 320,
    width: '100%',
  },
  imageBackground: {
    flex: 1,
    backgroundColor: colors.gray[900],
  },
  image: {
    opacity: 0.8,
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    paddingHorizontal: 24,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 11,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginTop: 24,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.25,
  },
  titleContainer: {
    marginTop: 12,
  },
  venueName: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.white,
    lineHeight: 37.5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[300],
    lineHeight: 20,
  },
});
