import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Share,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { haptics } from '../utils/haptics';
import { useAuth } from '../hooks/useAuth';
import { RewardsService, RewardPoint, Referral } from '../services/RewardsService';
import RBSheet from 'react-native-raw-bottom-sheet';
import RewardsCatalogSheet from '../components/RewardsCatalogSheet';

const RewardsScreen: React.FC = () => {
  const { user } = useAuth();
  const [pointsBalance, setPointsBalance] = useState(0);
  const [pointsHistory, setPointsHistory] = useState<RewardPoint[]>([]);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const catalogSheetRef = useRef<any>(null);
  const referralSheetRef = useRef<any>(null);

  useEffect(() => {
    if (user?.id) {
      loadRewardsData();
    }
  }, [user?.id]);

  const loadRewardsData = async () => {
    if (!user?.id) return;

    try {
      const [balance, history, code, userReferrals] = await Promise.all([
        RewardsService.getPointsBalance(user.id),
        RewardsService.getPointsHistory(user.id),
        RewardsService.getReferralCode(user.id),
        RewardsService.getUserReferrals(user.id),
      ]);

      setPointsBalance(balance);
      setPointsHistory(history.slice(0, 10)); // Show last 10 transactions
      setReferralCode(code);
      setReferrals(userReferrals);
    } catch (error) {
      console.error('Error loading rewards data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRewardsData();
    setRefreshing(false);
  };

  const handleShareReferralCode = async () => {
    if (!referralCode) return;

    haptics.light();
    try {
      await Share.share({
        message: `Join me on BarberApp! Use my referral code: ${referralCode} and we both get 500 reward points! 💈`,
      });
    } catch (error) {
      console.error('Error sharing referral code:', error);
    }
  };

  const handleViewCatalog = () => {
    haptics.light();
    catalogSheetRef.current?.open();
  };

  const handleViewReferrals = () => {
    haptics.light();
    referralSheetRef.current?.open();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getTransactionIcon = (source: RewardPoint['source']) => {
    switch (source) {
      case 'monthly_loyalty':
        return 'calendar';
      case 'referral':
        return 'people';
      case 'anniversary':
        return 'trophy';
      case 'signup_bonus':
        return 'gift';
      case 'plan_upgrade':
        return 'trending-up';
      default:
        return 'star';
    }
  };

  const getTransactionColor = (type: RewardPoint['transaction_type']) => {
    switch (type) {
      case 'earned':
        return colors.accent.success;
      case 'redeemed':
        return colors.gray[700];
      case 'expired':
        return colors.gray[400];
      default:
        return colors.text.secondary;
    }
  };

  // Calculate progress to next reward milestone (every 1000 points)
  const nextMilestone = Math.ceil(pointsBalance / 1000) * 1000;
  const progressToMilestone = pointsBalance % 1000;
  const progressPercent = (progressToMilestone / 1000) * 100;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header Section with Gradient */}
        <LinearGradient
          colors={['#000000', '#334155']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          {/* Points Balance */}
          <View style={styles.balanceSection}>
            <Text style={styles.balanceLabel}>Your Points Balance</Text>
            <Text style={styles.balanceValue}>{pointsBalance.toLocaleString()}</Text>
            <Text style={styles.balanceSubtext}>Redeem for exclusive rewards</Text>
          </View>

          {/* Progress to Next Milestone */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>
                {progressToMilestone} / 1,000 points to next milestone
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Quick Actions */}
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={handleViewCatalog}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.gray[100] }]}>
                <Ionicons name="gift" size={24} color={colors.gray[700]} />
              </View>
              <Text style={styles.actionTitle}>Rewards</Text>
              <Text style={styles.actionSubtitle}>Catalog</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={handleViewReferrals}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.gray[100] }]}>
                <Ionicons name="people" size={24} color={colors.gray[700]} />
              </View>
              <Text style={styles.actionTitle}>Refer</Text>
              <Text style={styles.actionSubtitle}>Friends</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={handleShareReferralCode}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.gray[100] }]}>
                <Ionicons name="share-social" size={24} color={colors.gray[700]} />
              </View>
              <Text style={styles.actionTitle}>Share</Text>
              <Text style={styles.actionSubtitle}>Code</Text>
            </TouchableOpacity>
          </View>

          {/* Referral Code Card */}
          {referralCode && (
            <View style={styles.referralCard}>
              <View style={styles.referralHeader}>
                <View>
                  <Text style={styles.referralTitle}>Your Referral Code</Text>
                  <Text style={styles.referralSubtitle}>
                    Share with friends and earn 500 points each
                  </Text>
                </View>
                <Ionicons name="people-circle" size={40} color={colors.gray[700]} />
              </View>

              <View style={styles.referralCodeBox}>
                <Text style={styles.referralCode}>{referralCode}</Text>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={() => {
                    haptics.light();
                    Alert.alert('Copied!', 'Referral code copied to clipboard');
                  }}
                >
                  <Ionicons name="copy-outline" size={20} color={colors.gray[700]} />
                </TouchableOpacity>
              </View>

              {referrals.length > 0 && (
                <View style={styles.referralStats}>
                  <View style={styles.referralStat}>
                    <Text style={styles.referralStatValue}>{referrals.length}</Text>
                    <Text style={styles.referralStatLabel}>Total Referrals</Text>
                  </View>
                  <View style={styles.referralStat}>
                    <Text style={styles.referralStatValue}>
                      {referrals.filter(r => r.status === 'completed').length}
                    </Text>
                    <Text style={styles.referralStatLabel}>Completed</Text>
                  </View>
                  <View style={styles.referralStat}>
                    <Text style={styles.referralStatValue}>
                      {referrals.filter(r => r.points_awarded > 0).reduce((sum, r) => sum + r.points_awarded, 0).toLocaleString()}
                    </Text>
                    <Text style={styles.referralStatLabel}>Points Earned</Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* How to Earn Points */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How to Earn Points</Text>
            <View style={styles.earnMethodsList}>
              <View style={styles.earnMethod}>
                <View style={[styles.earnIcon, { backgroundColor: colors.gray[100] }]}>
                  <Ionicons name="calendar" size={20} color={colors.gray[700]} />
                </View>
                <View style={styles.earnTextContainer}>
                  <Text style={styles.earnTitle}>Monthly Loyalty Bonus</Text>
                  <Text style={styles.earnSubtitle}>
                    100-300 points per month based on your tier
                  </Text>
                </View>
              </View>

              <View style={styles.earnMethod}>
                <View style={[styles.earnIcon, { backgroundColor: colors.gray[100] }]}>
                  <Ionicons name="people" size={20} color={colors.gray[700]} />
                </View>
                <View style={styles.earnTextContainer}>
                  <Text style={styles.earnTitle}>Refer Friends</Text>
                  <Text style={styles.earnSubtitle}>
                    500 points when they complete first subscription
                  </Text>
                </View>
              </View>

              <View style={styles.earnMethod}>
                <View style={[styles.earnIcon, { backgroundColor: colors.gray[100] }]}>
                  <Ionicons name="trophy" size={20} color={colors.gray[700]} />
                </View>
                <View style={styles.earnTextContainer}>
                  <Text style={styles.earnTitle}>Anniversary Milestones</Text>
                  <Text style={styles.earnSubtitle}>
                    750-2,000 points at subscription milestones
                  </Text>
                </View>
              </View>

              <View style={styles.earnMethod}>
                <View style={[styles.earnIcon, { backgroundColor: colors.gray[100] }]}>
                  <Ionicons name="gift" size={20} color={colors.gray[700]} />
                </View>
                <View style={styles.earnTextContainer}>
                  <Text style={styles.earnTitle}>Welcome Bonus</Text>
                  <Text style={styles.earnSubtitle}>
                    100 points just for signing up!
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Points History */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {pointsHistory.length > 0 ? (
              <View style={styles.historyList}>
                {pointsHistory.map((transaction) => (
                  <View key={transaction.id} style={styles.historyItem}>
                    <View
                      style={[
                        styles.historyIcon,
                        { backgroundColor: `${getTransactionColor(transaction.transaction_type)}15` },
                      ]}
                    >
                      <Ionicons
                        name={getTransactionIcon(transaction.source)}
                        size={20}
                        color={getTransactionColor(transaction.transaction_type)}
                      />
                    </View>
                    <View style={styles.historyTextContainer}>
                      <Text style={styles.historyTitle}>{transaction.description}</Text>
                      <Text style={styles.historyDate}>{formatDate(transaction.created_at)}</Text>
                    </View>
                    <Text
                      style={[
                        styles.historyPoints,
                        {
                          color: getTransactionColor(transaction.transaction_type),
                        },
                      ]}
                    >
                      {transaction.transaction_type === 'earned' ? '+' : '-'}
                      {transaction.points.toLocaleString()}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="star-outline" size={48} color={colors.gray[300]} />
                <Text style={styles.emptyStateText}>No points history yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Start earning points by maintaining your subscription!
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Rewards Catalog Bottom Sheet */}
      <RewardsCatalogSheet
        ref={catalogSheetRef}
        onRedemptionSuccess={() => {
          // Reload rewards data after successful redemption
          loadRewardsData();
        }}
      />

      {/* Referrals Bottom Sheet - Placeholder */}
      <RBSheet
        ref={referralSheetRef}
        height={500}
        openDuration={250}
        closeDuration={200}
        customStyles={{
          wrapper: { backgroundColor: 'rgba(0, 0, 0, 0.5)' },
          draggableIcon: { display: 'none' },
          container: {
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            backgroundColor: colors.white,
          },
        }}
      >
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>My Referrals</Text>
            <TouchableOpacity
              style={styles.sheetCloseButton}
              onPress={() => referralSheetRef.current?.close()}
            >
              <Ionicons name="close" size={24} color={colors.gray[600]} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          {referrals.length > 0 ? (
            <ScrollView style={styles.sheetContent} showsVerticalScrollIndicator={false}>
              {referrals.map((referral) => (
                <View key={referral.id} style={styles.referralItem}>
                  <View style={styles.referralItemIcon}>
                    <Ionicons
                      name={referral.status === 'completed' ? 'checkmark-circle' : 'time'}
                      size={24}
                      color={
                        referral.status === 'completed'
                          ? colors.accent.success
                          : colors.orange[500]
                      }
                    />
                  </View>
                  <View style={styles.referralItemText}>
                    <Text style={styles.referralItemTitle}>
                      {referral.status === 'completed' ? 'Completed' : 'Pending'}
                    </Text>
                    <Text style={styles.referralItemSubtitle}>
                      {formatDate(referral.created_at)}
                    </Text>
                  </View>
                  {referral.points_awarded > 0 && (
                    <Text style={styles.referralItemPoints}>
                      +{referral.points_awarded}
                    </Text>
                  )}
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.sheetContent}>
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color={colors.gray[300]} />
                <Text style={styles.emptyStateText}>No referrals yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Share your code to start earning rewards!
                </Text>
              </View>
            </View>
          )}
        </View>
      </RBSheet>
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
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  balanceSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
  },
  balanceValue: {
    fontSize: 56,
    fontWeight: '800',
    color: colors.white,
    marginBottom: 4,
  },
  balanceSubtext: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },

  // Progress Section
  progressSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 16,
  },
  progressHeader: {
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarBackground: {
    width: '100%',
    height: '100%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.white,
    borderRadius: 4,
  },

  // Main Content
  mainContent: {
    padding: 20,
    gap: 24,
  },

  // Actions Grid
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
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
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 13,
    color: colors.text.secondary,
  },

  // Referral Card
  referralCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  referralHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  referralTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  referralSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  referralCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  referralCode: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.gray[700],
    letterSpacing: 2,
  },
  copyButton: {
    padding: 8,
  },
  referralStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  referralStat: {
    alignItems: 'center',
  },
  referralStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  referralStatLabel: {
    fontSize: 12,
    color: colors.text.secondary,
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

  // Earn Methods
  earnMethodsList: {
    gap: 16,
  },
  earnMethod: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  earnIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  earnTextContainer: {
    flex: 1,
    paddingTop: 2,
  },
  earnTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  earnSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },

  // History List
  historyList: {
    gap: 12,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyTextContainer: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  historyDate: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  historyPoints: {
    fontSize: 16,
    fontWeight: '700',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },

  // Bottom Sheets
  sheetContainer: {
    flex: 1,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[900],
  },
  sheetCloseButton: {
    padding: 4,
  },
  sheetContent: {
    flex: 1,
    padding: 20,
  },

  // Referrals List in Sheet
  referralsList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  referralItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  referralItemIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  referralItemText: {
    flex: 1,
  },
  referralItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  referralItemSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  referralItemPoints: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.accent.success,
  },
});

export default RewardsScreen;
