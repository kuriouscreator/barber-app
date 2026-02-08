import React, { useState, useEffect, useRef } from 'react';
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
import * as ImagePicker from 'expo-image-picker';
import { RootStackParamList, MainTabParamList } from '../types';
import { useApp } from '../context/AppContext';
import { useAuth } from '../hooks/useAuth';
import { BillingService } from '../services/billing';
import { CutTrackingService } from '../services/CutTrackingService';
import { uploadAvatar } from '../services/storage';
import { supabase } from '../lib/supabase';
import { colors } from '../theme/colors';
import SubscriptionManagementSheet from '../components/SubscriptionManagementSheet';
import { formatSubscriptionPrice, formatPriceAmountToDollars } from '../utils/priceFormatter';
import { SettingsSheet, SettingsSheetRef } from '../components/SettingsSheet';
import { PersonalInformationForm } from '../components/PersonalInformationForm';
import { NotificationsForm } from '../components/NotificationsForm';
import { PaymentMethodsSheet, PaymentMethodsSheetRef } from '../components/PaymentMethodsSheet';
import { PreferencesSheet, PreferencesSheetRef } from '../components/PreferencesSheet';

type ProfileScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Profile'>;

interface Props {
  navigation?: ProfileScreenNavigationProp;
}

const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { state, logout, refreshSubscription, syncUser } = useApp();
  const { user, appointments, userSubscription } = state;
  const { user: authUser } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const isBarber = user?.role === 'barber';
  const [autoRenew, setAutoRenew] = useState<boolean>(true);
  const subscriptionSheetRef = useRef<any>(null);
  const personalInfoSheetRef = useRef<SettingsSheetRef>(null);
  const notificationsSheetRef = useRef<SettingsSheetRef>(null);
  const paymentMethodsSheetRef = useRef<PaymentMethodsSheetRef>(null);
  const preferencesSheetRef = useRef<PreferencesSheetRef>(null);
  const [profileData, setProfileData] = useState({
    subscription: {
      planName: 'No Plan',
      price: '',
      cutsRemaining: 0,
      totalCuts: 0,
      points: 0,
      monthsActive: 0,
      renewsOn: '',
    },
  });

  useEffect(() => {
    // Load subscription data
    if (user?.id && !isBarber) {
      loadSubscriptionData();
    }

    // Set auto-renew state based on subscription
    if (userSubscription) {
      setAutoRenew(BillingService.willAutoRenew(userSubscription));
    }

    // Load avatar URL from profile
    if (user?.id) {
      loadAvatarUrl();
    }
  }, [user?.id, userSubscription]);

  const loadAvatarUrl = async () => {
    try {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading avatar:', error);
        return;
      }

      if (data?.avatar_url) {
        setAvatarUrl(data.avatar_url);
      }
    } catch (error) {
      console.error('Error loading avatar:', error);
    }
  };

  const loadSubscriptionData = async () => {
    try {
      console.log('👤 ProfileScreen: Loading subscription data...');
      console.log('👤 ProfileScreen: userSubscription from context:', userSubscription);
      console.log('👤 ProfileScreen: price_amount value:', userSubscription?.price_amount);
      console.log('👤 ProfileScreen: price_amount type:', typeof userSubscription?.price_amount);
      console.log('👤 ProfileScreen: stripe_price_id:', userSubscription?.stripe_price_id);

      if (userSubscription) {
        // Use the centralized cut tracking service for accurate data
        const cutStatus = await CutTrackingService.getCutStatus();
        const renewsOn = new Date(userSubscription.current_period_end).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });

        // Calculate months active (mock for now)
        const startDate = new Date(userSubscription.created_at || Date.now());
        const monthsActive = Math.max(1, Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));

        // Calculate points (mock: 50 points per completed cut)
        const completedCuts = cutStatus.usedCuts;
        const points = completedCuts * 50;

        // Use the interval from the database, defaulting to 'month' if not set
        const interval = userSubscription.interval || 'month';
        const priceDisplay = formatSubscriptionPrice(
          userSubscription.price_amount,
          interval,
          userSubscription.status
        );

        const profileDisplayData = {
          subscription: {
            planName: userSubscription.plan_name,
            price: priceDisplay,
            cutsRemaining: cutStatus.remainingCuts,
            totalCuts: completedCuts,
            points,
            monthsActive,
            renewsOn,
          },
        };

        console.log('👤 ProfileScreen: Setting profile data:', profileDisplayData);
        setProfileData(profileDisplayData);
      } else {
        // No subscription
        console.log('👤 ProfileScreen: No subscription found, showing default state');
        setProfileData({
          subscription: {
            planName: 'No Active Plan',
            price: 'Choose a plan',
            cutsRemaining: 0,
            totalCuts: 0,
            points: 0,
            monthsActive: 0,
            renewsOn: '',
          },
        });
      }
    } catch (error) {
      console.error('❌ ProfileScreen: Error loading subscription data:', error);
    }
  };

  // Helper functions
  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Logout error:', error);
            }
          }
        },
      ]
    );
  };

  const handleAvatarUpload = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to upload an avatar.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0] && authUser?.id) {
        const uri = result.assets[0].uri;
        const uploadedUrl = await uploadAvatar(authUser.id, uri);

        // Update the avatar URL in the database
        const { error } = await supabase
          .from('profiles')
          .update({ avatar_url: uploadedUrl })
          .eq('id', authUser.id);

        if (error) {
          throw new Error('Failed to update profile');
        }

        setAvatarUrl(uploadedUrl);
        Alert.alert('Success', 'Avatar updated successfully!');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to upload avatar');
    }
  };

  const handleManageSubscription = () => {
    subscriptionSheetRef.current?.open();
  };

  const handleUpgradePlan = (plan: any) => {
    Alert.alert('Upgrade Plan', `Upgrading to ${plan.name} plan`);
    // TODO: Implement actual subscription upgrade logic
  };

  const handleCancelSubscription = () => {
    Alert.alert('Subscription Cancelled', 'Your subscription has been cancelled');
    // TODO: Implement actual subscription cancellation logic
  };

  const handleSettings = (setting: string) => {
    switch (setting) {
      case 'personal-info':
        personalInfoSheetRef.current?.open();
        break;
      case 'payment':
        paymentMethodsSheetRef.current?.open();
        break;
      case 'notifications':
        notificationsSheetRef.current?.open();
        break;
      case 'preferences':
        preferencesSheetRef.current?.open();
        break;
      default:
        console.log(`Navigate to ${setting}`);
    }
  };

  const handlePersonalInfoSaved = async () => {
    personalInfoSheetRef.current?.close();
    // Refresh user data to reflect the updated profile
    await syncUser();
  };

  const handleNotificationsSaved = () => {
    notificationsSheetRef.current?.close();
    // Preferences are saved, no need to sync entire user profile
  };

  const handleAutoRenewToggle = async (value: boolean) => {
    try {
      // Optimistically update UI
      setAutoRenew(value);

      // Call API to update Stripe subscription
      const result = await BillingService.toggleAutoRenew(value);

      if (result.success) {
        const message = value
          ? 'Auto-renew enabled. Your subscription will continue automatically.'
          : 'Auto-renew disabled. Your subscription will end on the current period end date.';

        Alert.alert('Success', message);
        await refreshSubscription();
      }
    } catch (error) {
      console.error('Error toggling auto-renew:', error);
      // Revert optimistic update
      setAutoRenew(!value);
      Alert.alert('Error', 'Failed to update auto-renew setting. Please try again.');
    }
  };

  // Calculate progress for rewards
  const rewardsProgress = profileData.subscription.points;
  const rewardsGoal = 1500;
  const progressPercent = Math.min((rewardsProgress / rewardsGoal) * 100, 100);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header Section with Dark Gradient */}
        <LinearGradient
          colors={['#0F172A', '#1E293B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          {/* User Info */}
          <View style={styles.userInfoSection}>
            <TouchableOpacity onPress={handleAvatarUpload} style={styles.avatarContainer}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={32} color={colors.gray[400]} />
                </View>
              )}
              <View style={styles.avatarEditBadge}>
                <Ionicons name="camera" size={12} color={colors.white} />
              </View>
            </TouchableOpacity>

            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.name || 'User Name'}</Text>
              <Text style={styles.userEmail}>{authUser?.email || 'user@example.com'}</Text>
            </View>
          </View>

          {/* Plan and Points Cards Row */}
          <View style={styles.headerCardsRow}>
            {/* Current Plan Card */}
            <View style={styles.headerCard}>
              <Text style={styles.headerCardLabel}>Current Plan</Text>
              <Text style={styles.headerCardValue}>{profileData.subscription.planName}</Text>
              <Text style={styles.headerCardSubtext}>{profileData.subscription.price}</Text>
            </View>

            {/* Points Card */}
            <View style={styles.headerCard}>
              <Text style={styles.headerCardLabel}>Points</Text>
              <Text style={styles.headerCardValue}>{profileData.subscription.points.toLocaleString()}</Text>
              <Text style={styles.headerCardSubtext}>Rewards balance</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Stats Cards Row */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{profileData.subscription.totalCuts}</Text>
              <Text style={styles.statLabel}>Total Cuts</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statValue}>{profileData.subscription.points.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statValue}>{profileData.subscription.monthsActive}</Text>
              <Text style={styles.statLabel}>Months</Text>
            </View>
          </View>

          {/* Subscription Management Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Subscription Management</Text>
            <View style={styles.subscriptionCard}>
              <View style={styles.subscriptionRow}>
                <Text style={styles.subscriptionLabel}>Next Billing</Text>
                <Text style={styles.subscriptionValue}>
                  {profileData.subscription.renewsOn || 'N/A'}
                </Text>
              </View>

              <View style={styles.subscriptionRow}>
                <Text style={styles.subscriptionLabel}>Amount</Text>
                <Text style={styles.subscriptionValue}>{profileData.subscription.price}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.autoRenewRow}>
                <View style={styles.autoRenewLeft}>
                  <Text style={styles.autoRenewTitle}>Auto-Renew</Text>
                  <Text style={styles.autoRenewSubtitle}>Subscription renews automatically</Text>
                </View>
                <Switch
                  value={autoRenew}
                  onValueChange={handleAutoRenewToggle}
                  trackColor={{ false: colors.gray[300], true: colors.accent.primary }}
                  thumbColor={colors.white}
                  disabled={!userSubscription || userSubscription.status !== 'active'}
                />
              </View>

              <TouchableOpacity style={styles.managePlanButton} onPress={handleManageSubscription}>
                <Text style={styles.managePlanButtonText}>Manage Subscription</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.accent.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Account Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Settings</Text>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => handleSettings('personal-info')}
            >
              <View style={[styles.settingIcon, { backgroundColor: colors.gray[200] }]}>
                <Ionicons name="person-outline" size={20} color={colors.gray[700]} />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingText}>Personal Information</Text>
                <Text style={styles.settingSubtext}>Name, email, phone number</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => handleSettings('payment')}
            >
              <View style={[styles.settingIcon, { backgroundColor: colors.gray[200] }]}>
                <Ionicons name="card-outline" size={20} color={colors.gray[700]} />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingText}>Payment Methods</Text>
                <Text style={styles.settingSubtext}>Manage cards & billing</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => handleSettings('notifications')}
            >
              <View style={[styles.settingIcon, { backgroundColor: colors.gray[200] }]}>
                <Ionicons name="notifications-outline" size={20} color={colors.gray[700]} />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingText}>Notifications</Text>
                <Text style={styles.settingSubtext}>Push, email & SMS preferences</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => handleSettings('privacy')}
            >
              <View style={[styles.settingIcon, { backgroundColor: colors.gray[200] }]}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.gray[700]} />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingText}>Privacy & Security</Text>
                <Text style={styles.settingSubtext}>Password, 2FA & data settings</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => handleSettings('preferences')}
            >
              <View style={[styles.settingIcon, { backgroundColor: `${colors.gray[700]}10` }]}>
                <Ionicons name="heart-outline" size={20} color={colors.gray[700]} />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingText}>Preferences</Text>
                <Text style={styles.settingSubtext}>Favorite barbers & services</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
            </TouchableOpacity>
          </View>

          {/* Logout Button */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color={colors.red[500]} />
              <Text style={styles.logoutButtonText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Subscription Management Bottom Sheet */}
      <SubscriptionManagementSheet
        ref={subscriptionSheetRef}
        currentPlan={userSubscription || undefined}
        onUpgrade={handleUpgradePlan}
        onCancel={handleCancelSubscription}
      />

      {/* Personal Information Settings Sheet */}
      {user && (
        <SettingsSheet ref={personalInfoSheetRef} title="Personal Information">
          <PersonalInformationForm
            user={user}
            onSaveSuccess={handlePersonalInfoSaved}
            onCancel={() => personalInfoSheetRef.current?.close()}
          />
        </SettingsSheet>
      )}

      {/* Notifications Settings Sheet */}
      {user && (
        <SettingsSheet ref={notificationsSheetRef} title="Notifications">
          <NotificationsForm
            user={user}
            onSaveSuccess={handleNotificationsSaved}
            onCancel={() => notificationsSheetRef.current?.close()}
          />
        </SettingsSheet>
      )}

      {/* Payment Methods Sheet */}
      <PaymentMethodsSheet
        ref={paymentMethodsSheetRef}
        onPaymentMethodUpdated={refreshSubscription}
      />

      {/* Preferences Sheet */}
      <PreferencesSheet
        ref={preferencesSheetRef}
        userId={user?.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollView: {
    flex: 1,
  },

  // Header Section
  headerGradient: {
    paddingTop: 56,
    paddingBottom: 56,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: -24,
  },
  userInfoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.gray[700],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.accent.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: colors.gray[300],
  },

  // Header Cards Row
  headerCardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  headerCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
  },
  headerCardLabel: {
    fontSize: 12,
    color: colors.gray[300],
    marginBottom: 8,
  },
  headerCardValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 4,
  },
  headerCardSubtext: {
    fontSize: 12,
    color: colors.gray[400],
  },

  // Main Content
  mainContent: {
    padding: 20,
    paddingTop: 0,
    gap: 24,
    marginTop: -24,
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },

  // Section
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  upgradeLink: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },

  // Subscription Card
  subscriptionCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  subscriptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subscriptionLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  subscriptionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray[200],
    marginVertical: 16,
  },
  autoRenewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  autoRenewLeft: {
    flex: 1,
  },
  autoRenewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  autoRenewSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  managePlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  managePlanButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.accent.primary,
  },

  // Rewards Card
  rewardsCard: {
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  rewardsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  rewardsTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 4,
  },
  rewardsSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  rewardsProgress: {
    marginBottom: 12,
  },
  rewardsProgressText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  progressBarContainer: {
    marginBottom: 16,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.white,
    borderRadius: 4,
  },
  rewardsFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rewardsFooter: {
    fontSize: 14,
    color: colors.white,
    flex: 1,
  },

  // Settings Items
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingText: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingSubtext: {
    fontSize: 14,
    color: colors.text.secondary,
  },

  // Logout Button
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.red[500],
  },
});

export default ProfileScreen;
