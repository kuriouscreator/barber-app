import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  Switch,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList, MainTabParamList } from '../types';
import { useApp } from '../context/AppContext';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';

type ProfileScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Profile'>;

interface Props {
  navigation?: ProfileScreenNavigationProp;
}

const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { state, logout } = useApp();
  const { user, appointments } = state;
  const isBarber = user?.role === 'barber';

  // New state for preferences
  const [appointmentReminders, setAppointmentReminders] = useState<boolean>(true);
  const [marketingEmails, setMarketingEmails] = useState<boolean>(false);
  const [autoRebook, setAutoRebook] = useState<boolean>(true);

  // Mock data for the new design
  const profileData = {
    name: 'Alex Johnson',
    memberSince: 'December 2023',
    location: 'New York, NY',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    subscription: {
      planName: 'Premium Plan',
      price: '$79/month',
      cutsRemaining: 2,
      daysLeft: 15,
      renewsOn: 'Jan 15, 2025',
    },
    usage: {
      used: 2,
      total: 4,
      cuts: [
        { service: 'Classic Haircut', date: 'Dec 28, 2024', status: 'Used' },
        { service: 'Beard Trim + Cut', date: 'Dec 15, 2024', status: 'Used' },
      ]
    },
    upcomingAppointments: [
      {
        id: '1',
        shopName: "Mike's Barbershop",
        service: 'Classic Haircut',
        date: 'Today',
        time: '2:30 PM',
        location: 'Downtown Plaza',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
        isToday: true,
      },
        {
          id: '2',
          shopName: "Mike's Barbershop",
          service: 'Beard Trim + Haircut',
          date: 'Jan 10',
          time: '11:00 AM',
          location: 'Downtown Plaza',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
          isToday: false,
        },
    ],
    pastAppointments: [
        {
          id: '3',
          shopName: "Mike's Barbershop",
          service: 'Classic Haircut',
          date: 'Dec 28, 2024',
          time: '2:30 PM',
          location: 'Downtown Plaza',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
          rating: null, // Not reviewed yet
          isReviewed: false,
        },
        {
          id: '4',
          shopName: "Mike's Barbershop",
          service: 'Beard Trim + Haircut',
          date: 'Dec 15, 2024',
          time: '11:00 AM',
          location: 'Downtown Plaza',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
          rating: 4,
          isReviewed: true,
        },
        {
          id: '5',
          shopName: "Mike's Barbershop",
          service: 'Fade Cut',
          date: 'Dec 1, 2024',
          time: '3:15 PM',
          location: 'Downtown Plaza',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
          rating: 5,
          isReviewed: true,
        },
    ],
    paymentMethod: {
      brand: 'Visa',
      last4: '4532',
      expires: '12/26',
    },
  };

  // Helper functions
  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  const handleManageSubscription = () => {
    if (navigation) {
      const parentNavigation = navigation.getParent();
      if (parentNavigation) {
        parentNavigation.navigate('Subscription');
      }
    }
  };

  const handleUpgradePlan = () => {
    console.log('Upgrade plan');
  };

  const handlePausePlan = () => {
    Alert.alert(
      'Pause Plan',
      'Are you sure you want to pause your subscription?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Pause', style: 'destructive', onPress: () => console.log('Pause plan') },
      ]
    );
  };


  const handleUpdatePayment = () => {
    console.log('Update payment method');
  };

  const handleEditProfile = () => {
    console.log('Edit profile');
  };

  const handleReferFriends = () => {
    console.log('Refer friends');
  };

  const handleSupport = () => {
    console.log('Support');
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Ionicons
        key={index}
        name={index < rating ? 'star' : 'star-outline'}
        size={16}
        color="#FFD700"
      />
    ));
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Profile Card */}
          <View style={styles.profileCard}>
            <Image source={{ uri: profileData.avatar }} style={styles.avatar} />
            <Text style={styles.profileName}>{profileData.name}</Text>
            <Text style={styles.memberSince}>Member since {profileData.memberSince}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={16} color={colors.text.secondary} />
              <Text style={styles.locationText}>{profileData.location}</Text>
            </View>
          </View>

          {/* Current Subscription */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Subscription</Text>
            
              {/* Subscription Card */}
              <LinearGradient 
                start={{x:0, y:0}}
                end={{x:0, y:1}}
                colors={["#000080", "#1D4ED8"]}
                style={styles.subscriptionCard}
              >
                <View style={styles.subscriptionHeader}>
                  <View style={styles.subscriptionLeft}>
                    <Text style={styles.subscriptionPlanName}>{profileData.subscription.planName}</Text>
                    <Text style={styles.subscriptionPrice}>{profileData.subscription.price}</Text>
                  </View>
                  <Ionicons name="star" size={24} color="#FFD700" />
                </View>
                
                <View style={styles.subscriptionStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{profileData.subscription.cutsRemaining}</Text>
                    <Text style={styles.statLabel}>Cuts Remaining</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{profileData.subscription.daysLeft}</Text>
                    <Text style={styles.statLabel}>Days Left</Text>
                  </View>
                </View>
                
                <View style={styles.subscriptionFooter}>
                  <Text style={styles.renewalText}>Renews {profileData.subscription.renewsOn}</Text>
                  <TouchableOpacity style={styles.managePlanButton} onPress={handleManageSubscription}>
                    <Text style={styles.managePlanButtonText}>Manage Plan</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>

            {/* Action Tiles */}
            <View style={styles.actionTilesContainer}>
              <TouchableOpacity style={styles.actionTile} onPress={handleUpgradePlan}>
                <Ionicons name="arrow-up" size={24} color={colors.text.primary} />
                <Text style={styles.actionTileTitle}>Upgrade Plan</Text>
                <Text style={styles.actionTileSubtitle}>More cuts & perks</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionTile} onPress={handlePausePlan}>
                <Ionicons name="pause" size={24} color={colors.text.primary} />
                <Text style={styles.actionTileTitle}>Pause Plan</Text>
                <Text style={styles.actionTileSubtitle}>Temporary hold</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Usage This Month */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Usage This Month</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllLink}>View All</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.usageCard}>
              <View style={styles.usageProgress}>
                <Text style={styles.cutsUsedLabel}>Cuts Used</Text>
                <Text style={styles.progressText}>{profileData.usage.used} of {profileData.usage.total}</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${(profileData.usage.used / profileData.usage.total) * 100}%` }]} />
              </View>
              
              {profileData.usage.cuts.map((cut, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.usageItem,
                    index === profileData.usage.cuts.length - 1 && styles.usageItemLast
                  ]}
                >
                  <View style={styles.usageInfo}>
                    <Text style={styles.usageService}>{cut.service}</Text>
                    <Text style={styles.usageDate}>{cut.date}</Text>
                  </View>
                  <Text style={styles.usageStatus}>{cut.status}</Text>
                </View>
              ))}
            </View>
          </View>


          {/* Payment & Billing */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment & Billing</Text>
            
            <View style={styles.paymentCard}>
              {/* Payment Method Row */}
              <View style={styles.paymentMethodRow}>
                <View style={styles.paymentLeft}>
                  <View style={styles.paymentIcon}>
                    <Text style={styles.paymentIconText}>VISA</Text>
                  </View>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentMethod}>{profileData.paymentMethod.brand} •••• {profileData.paymentMethod.last4}</Text>
                    <Text style={styles.paymentExpires}>Expires {profileData.paymentMethod.expires}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={handleUpdatePayment}>
                  <Text style={styles.updateLink}>Update</Text>
                </TouchableOpacity>
              </View>
              
              {/* Divider */}
              <View style={styles.paymentDivider} />
              
              {/* Billing Summary */}
              <View style={styles.billingSummary}>
                <View style={styles.billingRow}>
                  <Text style={styles.billingLabel}>Next billing date</Text>
                  <Text style={styles.billingValue}>{profileData.subscription.renewsOn}</Text>
                </View>
                <View style={styles.billingRow}>
                  <Text style={styles.billingLabel}>Amount</Text>
                  <Text style={styles.billingValue}>$79.00</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Preferences */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferences</Text>
            
            <View style={styles.preferenceItem}>
              <View style={styles.preferenceLeft}>
                <Text style={styles.preferenceTitle}>Appointment Reminders</Text>
                <Text style={styles.preferenceSubtitle}>Get notified before appointments</Text>
              </View>
              <Switch
                value={appointmentReminders}
                onValueChange={setAppointmentReminders}
                trackColor={{ false: colors.gray[300], true: colors.accent.primary }}
                thumbColor={colors.white}
                style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
              />
            </View>
            
            <View style={styles.preferenceItem}>
              <View style={styles.preferenceLeft}>
                <Text style={styles.preferenceTitle}>Marketing Emails</Text>
                <Text style={styles.preferenceSubtitle}>Receive promotions and offers</Text>
              </View>
              <Switch
                value={marketingEmails}
                onValueChange={setMarketingEmails}
                trackColor={{ false: colors.gray[300], true: colors.accent.primary }}
                thumbColor={colors.white}
                style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
              />
            </View>
            
            <View style={styles.preferenceItem}>
              <View style={styles.preferenceLeft}>
                <Text style={styles.preferenceTitle}>Auto-Rebook</Text>
                <Text style={styles.preferenceSubtitle}>Automatically book next appointment</Text>
              </View>
              <Switch
                value={autoRebook}
                onValueChange={setAutoRebook}
                trackColor={{ false: colors.gray[300], true: colors.accent.primary }}
                thumbColor={colors.white}
                style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
              />
            </View>
          </View>

          {/* Account */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            
            <TouchableOpacity style={styles.accountItem} onPress={handleEditProfile}>
              <Ionicons name="person-outline" size={24} color={colors.text.secondary} />
              <Text style={styles.accountItemText}>Edit Profile</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.gray[400]} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.accountItem} onPress={handleReferFriends}>
              <Ionicons name="gift-outline" size={24} color={colors.text.secondary} />
              <Text style={styles.accountItemText}>Refer Friends</Text>
              <View style={styles.referReward}>
                <Text style={styles.referRewardText}>Earn $10</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.gray[400]} />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.accountItem} onPress={handleSupport}>
              <Ionicons name="headset-outline" size={24} color={colors.text.secondary} />
              <Text style={styles.accountItemText}>Support</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.gray[400]} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color={colors.accent.error} />
              <Text style={styles.logoutButtonText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    backgroundColor: '#F9FAFB',
    paddingTop: 20,
  },
  section: {
    marginBottom: 16,
    marginHorizontal: 16,
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 2,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  viewAllLink: {
    color: '#000080',
    fontSize: 14,
  },

  // Profile Card
  profileCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderRadius: 16,
    borderWidth: 1,
    padding: 25,
    marginBottom: 24,
    marginHorizontal: 16,
    shadowColor: '#0000000D',
    shadowOpacity: 0.1,
    shadowOffset: {
      width: 0,
      height: 1
    },
    shadowRadius: 2,
    elevation: 2,
  },
  avatar: {
    borderRadius: 40,
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  profileName: {
    color: '#111827',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  memberSince: {
    color: '#4B5563',
    fontSize: 14,
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationText: {
    color: '#4B5563',
    fontSize: 14,
    marginLeft: 4,
  },

  // Subscription Card
  subscriptionCard: {
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 16,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginHorizontal: 16,
  },
  subscriptionLeft: {
    flex: 1,
  },
  subscriptionPlanName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subscriptionPrice: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 1,
    marginRight: 52,
  },
  subscriptionStats: {
    flexDirection: 'row',
    marginBottom: 16,
    marginHorizontal: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  subscriptionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  renewalText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 1,
    marginRight: 12,
    flex: 1,
  },
  managePlanButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.button,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  managePlanButtonText: {
    color: '#000080',
    fontSize: 14,
    fontWeight: 'bold',
  },

  // Action Tiles
  actionTilesContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionTile: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FEFCE8',
    borderColor: '#FEF08A',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 13,
  },
  actionTileTitle: {
    fontSize: 14,
    color: '#A16207',
    marginTop: 8,
    marginBottom: 4,
  },
  actionTileSubtitle: {
    fontSize: 12,
    color: '#CA8A04',
    textAlign: 'center',
  },

  // Usage Progress
  usageCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 17,
    marginBottom: 12,
    shadowColor: '#0000000D',
    shadowOpacity: 0.1,
    shadowOffset: {
      width: 0,
      height: 1
    },
    shadowRadius: 2,
    elevation: 2,
  },
  usageProgress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginHorizontal: 17,
  },
  cutsUsedLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 9999,
    marginBottom: 16,
    marginHorizontal: 17,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#000080',
    borderRadius: 9999,
  },
  progressText: {
    fontSize: 14,
    color: '#4B5563',
  },
  usageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    marginHorizontal: 17,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  usageItemLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  usageInfo: {
    flex: 1,
  },
  usageService: {
    fontSize: 14,
    color: '#111827',
    marginBottom: 4,
  },
  usageDate: {
    fontSize: 12,
    color: '#4B5563',
  },
  usageStatus: {
    fontSize: 12,
    color: '#16A34A',
  },

  // Appointment Cards
  appointmentCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 17,
    marginBottom: 12,
    shadowColor: '#0000000D',
    shadowOpacity: 0.1,
    shadowOffset: {
      width: 0,
      height: 1
    },
    shadowRadius: 2,
    elevation: 2,
  },
  pastAppointmentCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 17,
    marginBottom: 12,
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
    marginBottom: 12,
    marginHorizontal: 17,
  },
  appointmentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentShopName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  appointmentService: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
  },
  appointmentRating: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  appointmentDateTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  appointmentDateTimeText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  appointmentBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 17,
    marginTop: 8,
    gap: 12,
  },
  pastAppointmentBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 17,
    marginTop: 8,
    gap: 12,
  },
  appointmentLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  appointmentLocationText: {
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 4,
  },
  appointmentRight: {
    alignItems: 'flex-end',
  },
  todayChip: {
    backgroundColor: '#000080',
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 4,
  },
  todayChipText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  appointmentDate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
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
  appointmentActions: {
    flexDirection: 'row',
    gap: 12,
  },
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
  completedChip: {
    backgroundColor: '#DCFCE7',
    borderRadius: 9999,
    paddingVertical: 4,
    paddingHorizontal: 7,
  },
  completedChipText: {
    fontSize: 12,
    color: '#15803D',
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
  rebookButtonText: {
    fontSize: 14,
    color: colors.white,
    fontWeight: typography.fontWeight.medium,
  },

  // Payment & Billing
  paymentCard: {
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
  paymentMethodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 17,
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentIcon: {
    width: 40,
    height: 20,
    backgroundColor: '#1E40AF',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentIconText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentMethod: {
    fontSize: 16,
    color: '#111827',
    marginBottom: 4,
  },
  paymentExpires: {
    fontSize: 14,
    color: '#4B5563',
  },
  updateLink: {
    fontSize: 14,
    color: '#000080',
  },
  paymentDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 17,
    marginVertical: 16,
  },
  billingSummary: {
    marginHorizontal: 17,
  },
  billingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  billingLabel: {
    fontSize: 14,
    color: '#4B5563',
  },
  billingValue: {
    fontSize: 14,
    color: '#111827',
  },

  // Preferences
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 17,
    paddingRight: 20,
    marginBottom: 12,
    shadowColor: '#0000000D',
    shadowOpacity: 0.1,
    shadowOffset: {
      width: 0,
      height: 1
    },
    shadowRadius: 2,
    elevation: 2,
  },
  preferenceLeft: {
    flex: 1,
    marginHorizontal: 17,
  },
  preferenceTitle: {
    fontSize: 16,
    color: '#111827',
    marginTop: 1,
    marginBottom: 4,
  },
  preferenceSubtitle: {
    fontSize: 14,
    color: '#4B5563',
  },

  // Account
  accountItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 17,
    paddingHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#0000000D',
    shadowOpacity: 0.1,
    shadowOffset: {
      width: 0,
      height: 1
    },
    shadowRadius: 2,
    elevation: 2,
  },
  accountItemText: {
    fontSize: 16,
    color: '#111827',
    marginLeft: 12,
    flex: 1,
  },
  referReward: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  referRewardText: {
    fontSize: 14,
    color: '#16A34A',
    marginRight: 11,
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 17,
    marginTop: 12,
  },
  logoutButtonText: {
    fontSize: 16,
    color: '#DC2626',
    marginLeft: 12,
  },
});

export default ProfileScreen;
