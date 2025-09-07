import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';

interface Review {
  id: string;
  customerName: string;
  rating: number;
  text: string;
  photos: string[];
  date: string;
  service: string;
}

interface BarberProfileScreenProps {
  navigation: any;
  route: {
    params: {
      barberId: string;
      barberName: string;
      barberAvatar: string;
      barberRating: number;
      barberReviewCount: number;
    };
  };
}

const BarberProfileScreen: React.FC<BarberProfileScreenProps> = ({ navigation, route }) => {
  const { barberId, barberName, barberAvatar, barberRating, barberReviewCount } = route.params;
  const [activeTab, setActiveTab] = useState<'about' | 'reviews'>('about');
  const [showAllReviews, setShowAllReviews] = useState(false);

  // Mock reviews data
  const mockReviews: Review[] = [
    {
      id: '1',
      customerName: 'John D.',
      rating: 5,
      text: 'Amazing haircut! Mike really knows what he\'s doing. The fade was perfect and he took his time to make sure everything was exactly how I wanted it.',
      photos: ['https://picsum.photos/200/200?random=1'],
      date: '2024-01-10',
      service: 'Haircut & Beard Trim',
    },
    {
      id: '2',
      customerName: 'Sarah M.',
      rating: 5,
      text: 'Best barber in the city! Professional, friendly, and always delivers great results. I\'ve been coming here for months.',
      photos: [],
      date: '2024-01-08',
      service: 'Classic Haircut',
    },
    {
      id: '3',
      customerName: 'Alex R.',
      rating: 4,
      text: 'Great service and attention to detail. The shop is clean and the atmosphere is relaxed. Will definitely be back!',
      photos: ['https://picsum.photos/200/200?random=2', 'https://picsum.photos/200/200?random=3'],
      date: '2024-01-05',
      service: 'Premium Package',
    },
    {
      id: '4',
      customerName: 'David L.',
      rating: 5,
      text: 'Mike is a true professional. He listened to what I wanted and delivered exactly that. The beard trim was perfect!',
      photos: [],
      date: '2024-01-03',
      service: 'Beard Trim',
    },
    {
      id: '5',
      customerName: 'Chris T.',
      rating: 4,
      text: 'Good haircut, friendly service. The wait time was a bit long but worth it for the quality.',
      photos: [],
      date: '2024-01-01',
      service: 'Classic Haircut',
    },
  ];

  const displayedReviews = showAllReviews ? mockReviews : mockReviews.slice(0, 3);

  const renderStars = (rating: number, size: number = 16) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? 'star' : 'star-outline'}
            size={size}
            color={star <= rating ? '#FFD700' : '#D1D5DB'}
          />
        ))}
      </View>
    );
  };

  const renderReview = (review: Review) => (
    <View key={review.id} style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewCustomer}>
          <Text style={styles.customerName}>{review.customerName}</Text>
          <View style={styles.reviewRating}>
            {renderStars(review.rating, 14)}
            <Text style={styles.reviewDate}>{new Date(review.date).toLocaleDateString()}</Text>
          </View>
        </View>
        <Text style={styles.reviewService}>{review.service}</Text>
      </View>
      
      {review.text && (
        <Text style={styles.reviewText}>{review.text}</Text>
      )}
      
      {review.photos.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reviewPhotos}>
          {review.photos.map((photo, index) => (
            <Image key={index} source={{ uri: photo }} style={styles.reviewPhoto} />
          ))}
        </ScrollView>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Barber Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Barber Info Card */}
        <View style={styles.barberInfoCard}>
          <Image source={{ uri: barberAvatar }} style={styles.barberAvatar} />
          <View style={styles.barberDetails}>
            <Text style={styles.barberName}>{barberName}</Text>
            <View style={styles.ratingContainer}>
              {renderStars(barberRating, 20)}
            </View>
            <Text style={styles.ratingText}>{barberRating.toFixed(1)} ({barberReviewCount} reviews)</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'about' && styles.activeTab]}
            onPress={() => setActiveTab('about')}
          >
            <Text style={[styles.tabText, activeTab === 'about' && styles.activeTabText]}>
              About
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'reviews' && styles.activeTab]}
            onPress={() => setActiveTab('reviews')}
          >
            <Text style={[styles.tabText, activeTab === 'reviews' && styles.activeTabText]}>
              Reviews ({barberReviewCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'about' && (
          <View style={styles.aboutContent}>
            <View style={styles.aboutSection}>
              <Text style={styles.sectionTitle}>Experience</Text>
              <Text style={styles.aboutText}>
                {barberName} has been cutting hair for over 8 years and specializes in modern cuts, 
                fades, and beard grooming. He's known for his attention to detail and friendly service.
              </Text>
            </View>
            
            <View style={styles.aboutSection}>
              <Text style={styles.sectionTitle}>Services</Text>
              <View style={styles.servicesList}>
                <Text style={styles.serviceItem}>• Classic Haircut</Text>
                <Text style={styles.serviceItem}>• Beard Trim</Text>
                <Text style={styles.serviceItem}>• Haircut & Beard Trim</Text>
                <Text style={styles.serviceItem}>• Premium Package</Text>
              </View>
            </View>

            <View style={styles.aboutSection}>
              <Text style={styles.sectionTitle}>Availability</Text>
              <Text style={styles.aboutText}>
                Monday - Friday: 9:00 AM - 7:00 PM{'\n'}
                Saturday: 9:00 AM - 5:00 PM{'\n'}
                Sunday: Closed
              </Text>
            </View>
          </View>
        )}

        {activeTab === 'reviews' && (
          <View style={styles.reviewsContent}>
            {displayedReviews.map(renderReview)}
            
            {mockReviews.length > 3 && !showAllReviews && (
              <TouchableOpacity
                style={styles.readMoreButton}
                onPress={() => setShowAllReviews(true)}
              >
                <Text style={styles.readMoreText}>Read More Reviews</Text>
                <Ionicons name="chevron-down" size={16} color={colors.accent.primary} />
              </TouchableOpacity>
            )}
            
            {showAllReviews && mockReviews.length > 3 && (
              <TouchableOpacity
                style={styles.readMoreButton}
                onPress={() => setShowAllReviews(false)}
              >
                <Text style={styles.readMoreText}>Show Less</Text>
                <Ionicons name="chevron-up" size={16} color={colors.accent.primary} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: 60, // Account for iPhone 15 Pro Dynamic Island
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    backgroundColor: colors.white,
    height: 120,
  },
  backButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  barberInfoCard: {
    backgroundColor: colors.background.secondary,
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.md,
  },
  barberAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: spacing.lg,
  },
  barberDetails: {
    flex: 1,
  },
  barberName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  activeTab: {
    backgroundColor: colors.accent.primary,
  },
  tabText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
  },
  activeTabText: {
    color: colors.text.inverse,
  },
  aboutContent: {
    paddingHorizontal: spacing.lg,
  },
  aboutSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  aboutText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  servicesList: {
    gap: spacing.xs,
  },
  serviceItem: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  reviewsContent: {
    paddingHorizontal: spacing.lg,
  },
  reviewCard: {
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  reviewCustomer: {
    flex: 1,
  },
  customerName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  reviewDate: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  reviewService: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    backgroundColor: colors.background.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  reviewText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  reviewPhotos: {
    flexDirection: 'row',
  },
  reviewPhoto: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.sm,
    marginRight: spacing.sm,
  },
  readMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  readMoreText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.accent.primary,
  },
});

export default BarberProfileScreen;
