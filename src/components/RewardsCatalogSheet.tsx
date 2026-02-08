import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import RBSheet from 'react-native-raw-bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { haptics } from '../utils/haptics';
import { useAuth } from '../hooks/useAuth';
import { RewardsService, Reward, RewardRedemption } from '../services/RewardsService';

interface RewardsCatalogSheetProps {
  onClose?: () => void;
  onRedemptionSuccess?: (redemption: RewardRedemption) => void;
}

export const RewardsCatalogSheet = forwardRef<any, RewardsCatalogSheetProps>(
  ({ onClose, onRedemptionSuccess }, ref) => {
    const { user } = useAuth();
    const rbSheetRef = useRef<any>(null);
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [pointsBalance, setPointsBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [selectedReward, setSelectedReward] = useState<Reward | null>(null);

    // Expose open and close methods to parent
    useImperativeHandle(ref, () => ({
      open: () => {
        rbSheetRef.current?.open();
        loadCatalog();
      },
      close: () => rbSheetRef.current?.close(),
    }));

    const loadCatalog = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        const [catalogData, balance] = await Promise.all([
          RewardsService.getRewardsCatalog(),
          RewardsService.getPointsBalance(user.id),
        ]);
        setRewards(catalogData);
        setPointsBalance(balance);
      } catch (error) {
        console.error('Error loading rewards catalog:', error);
        Alert.alert('Error', 'Failed to load rewards catalog');
      } finally {
        setLoading(false);
      }
    };

    const handleClose = () => {
      rbSheetRef.current?.close();
      setSelectedReward(null);
      if (onClose) onClose();
    };

    const handleRewardPress = (reward: Reward) => {
      haptics.light();
      setSelectedReward(reward);
    };

    const handleRedeem = async () => {
      if (!selectedReward || !user?.id) return;

      haptics.medium();

      // Check if user has enough points
      if (pointsBalance < selectedReward.points_cost) {
        Alert.alert(
          'Insufficient Points',
          `You need ${selectedReward.points_cost - pointsBalance} more points to redeem this reward.`
        );
        return;
      }

      // Confirm redemption
      Alert.alert(
        'Confirm Redemption',
        `Redeem ${selectedReward.name} for ${selectedReward.points_cost} points?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Redeem',
            onPress: async () => {
              try {
                const result = await RewardsService.redeemReward(user.id, selectedReward.id);

                if (result.success && result.redemption) {
                  haptics.success();
                  Alert.alert(
                    'Success!',
                    `Your ${selectedReward.name} has been redeemed. Your redemption code is: ${result.redemption.redemption_code}`,
                    [
                      {
                        text: 'OK',
                        onPress: () => {
                          if (onRedemptionSuccess && result.redemption) {
                            onRedemptionSuccess(result.redemption);
                          }
                          handleClose();
                        },
                      },
                    ]
                  );
                  // Reload catalog to update points balance
                  loadCatalog();
                } else {
                  Alert.alert('Error', result.error || 'Failed to redeem reward');
                }
              } catch (error) {
                console.error('Error redeeming reward:', error);
                Alert.alert('Error', 'Failed to redeem reward');
              }
            },
          },
        ]
      );
    };

    const getCategoryIcon = (category: Reward['category']) => {
      switch (category) {
        case 'service':
          return 'cut';
        case 'flexibility':
          return 'time';
        case 'product':
          return 'cart';
        case 'experiential':
          return 'star';
        default:
          return 'gift';
      }
    };

    const getCategoryColor = (category: Reward['category']) => {
      switch (category) {
        case 'service':
          return colors.gray[700];
        case 'flexibility':
          return colors.orange[600];
        case 'product':
          return colors.gray[700];
        case 'experiential':
          return '#000000';
        default:
          return colors.gray[600];
      }
    };

    const groupedRewards = rewards.reduce((acc, reward) => {
      if (!acc[reward.category]) {
        acc[reward.category] = [];
      }
      acc[reward.category].push(reward);
      return acc;
    }, {} as Record<string, Reward[]>);

    const categoryLabels: Record<string, string> = {
      service: 'Service Rewards',
      flexibility: 'Flexibility Perks',
      product: 'Product Rewards',
      experiential: 'Exclusive Experiences',
    };

    return (
      <RBSheet
        ref={rbSheetRef}
        height={700}
        openDuration={250}
        closeDuration={200}
        customStyles={{
          wrapper: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          },
          draggableIcon: {
            display: 'none',
          },
          container: {
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            backgroundColor: colors.white,
            paddingHorizontal: 0,
          },
        }}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Rewards Catalog</Text>
              <Text style={styles.headerSubtitle}>
                Your balance: {pointsBalance.toLocaleString()} points
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.gray[600]} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.gray[700]} />
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
              {Object.entries(groupedRewards).map(([category, categoryRewards]) => (
                <View key={category} style={styles.categorySection}>
                  <Text style={styles.categoryTitle}>
                    {categoryLabels[category] || category}
                  </Text>

                  <View style={styles.rewardsList}>
                    {categoryRewards.map((reward) => {
                      const canAfford = pointsBalance >= reward.points_cost;
                      const isSelected = selectedReward?.id === reward.id;

                      return (
                        <TouchableOpacity
                          key={reward.id}
                          style={[
                            styles.rewardCard,
                            isSelected && styles.rewardCardSelected,
                            !canAfford && styles.rewardCardDisabled,
                          ]}
                          onPress={() => handleRewardPress(reward)}
                          activeOpacity={0.7}
                        >
                          {/* Reward Icon */}
                          <View
                            style={[
                              styles.rewardIcon,
                              { backgroundColor: `${getCategoryColor(reward.category)}15` },
                            ]}
                          >
                            <Ionicons
                              name={getCategoryIcon(reward.category)}
                              size={24}
                              color={getCategoryColor(reward.category)}
                            />
                          </View>

                          {/* Reward Info */}
                          <View style={styles.rewardInfo}>
                            <Text
                              style={[
                                styles.rewardName,
                                !canAfford && styles.rewardNameDisabled,
                              ]}
                            >
                              {reward.name}
                            </Text>
                            <Text
                              style={[
                                styles.rewardDescription,
                                !canAfford && styles.rewardDescriptionDisabled,
                              ]}
                            >
                              {reward.description}
                            </Text>
                            {reward.terms && (
                              <Text style={styles.rewardTerms}>{reward.terms}</Text>
                            )}
                          </View>

                          {/* Points Cost */}
                          <View style={styles.rewardCost}>
                            <Text
                              style={[
                                styles.rewardPoints,
                                !canAfford && styles.rewardPointsDisabled,
                              ]}
                            >
                              {reward.points_cost.toLocaleString()}
                            </Text>
                            <Text style={styles.rewardPointsLabel}>points</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}

              {rewards.length === 0 && !loading && (
                <View style={styles.emptyState}>
                  <Ionicons name="gift-outline" size={64} color={colors.gray[300]} />
                  <Text style={styles.emptyStateText}>No rewards available</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Check back later for exclusive rewards!
                  </Text>
                </View>
              )}
            </ScrollView>
          )}

          {/* Redeem Button */}
          {selectedReward && (
            <View style={styles.footer}>
              <TouchableOpacity
                style={[
                  styles.redeemButton,
                  pointsBalance < selectedReward.points_cost && styles.redeemButtonDisabled,
                ]}
                onPress={handleRedeem}
                disabled={pointsBalance < selectedReward.points_cost}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="gift"
                  size={20}
                  color={colors.white}
                  style={styles.redeemButtonIcon}
                />
                <Text style={styles.redeemButtonText}>
                  Redeem {selectedReward.name}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </RBSheet>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  closeButton: {
    padding: 4,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },

  // Category Section
  categorySection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Rewards List
  rewardsList: {
    gap: 12,
  },
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.gray[200],
    gap: 12,
  },
  rewardCardSelected: {
    borderColor: colors.gray[700],
    backgroundColor: colors.gray[100],
  },
  rewardCardDisabled: {
    opacity: 0.5,
  },

  // Reward Icon
  rewardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Reward Info
  rewardInfo: {
    flex: 1,
  },
  rewardName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  rewardNameDisabled: {
    color: colors.gray[500],
  },
  rewardDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: 4,
  },
  rewardDescriptionDisabled: {
    color: colors.gray[400],
  },
  rewardTerms: {
    fontSize: 12,
    color: colors.gray[500],
    fontStyle: 'italic',
  },

  // Reward Cost
  rewardCost: {
    alignItems: 'flex-end',
  },
  rewardPoints: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.gray[700],
  },
  rewardPointsDisabled: {
    color: colors.gray[400],
  },
  rewardPointsLabel: {
    fontSize: 12,
    color: colors.text.secondary,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 20,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },

  // Footer
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    backgroundColor: colors.white,
  },
  redeemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray[700],
    borderRadius: 12,
    paddingVertical: 16,
    shadowColor: colors.gray[700],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  redeemButtonDisabled: {
    backgroundColor: colors.gray[300],
    shadowOpacity: 0,
  },
  redeemButtonIcon: {
    marginRight: 8,
  },
  redeemButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
});

export default RewardsCatalogSheet;
