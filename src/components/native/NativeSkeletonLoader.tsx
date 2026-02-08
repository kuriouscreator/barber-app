/**
 * NativeSkeletonLoader - Loading state component
 * Displays animated skeleton placeholders for various content types
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ViewStyle, Animated } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';

export type SkeletonType = 'card' | 'list' | 'stat' | 'avatar' | 'text';

export interface NativeSkeletonLoaderProps {
  /** Type of skeleton to display */
  type: SkeletonType;

  /** Number of skeleton items to render */
  count?: number;

  /** Custom style overrides */
  style?: ViewStyle;
}

const SkeletonItem: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        style,
        { opacity },
      ]}
    />
  );
};

export const NativeSkeletonLoader: React.FC<NativeSkeletonLoaderProps> = ({
  type,
  count = 1,
  style,
}) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <View style={styles.cardContainer}>
            <SkeletonItem style={styles.cardSkeleton} />
          </View>
        );

      case 'stat':
        return (
          <View style={styles.statContainer}>
            <SkeletonItem style={styles.statValue} />
            <SkeletonItem style={styles.statLabel} />
          </View>
        );

      case 'list':
        return (
          <View style={styles.listContainer}>
            <SkeletonItem style={styles.listAvatar} />
            <View style={styles.listContent}>
              <SkeletonItem style={styles.listTitle} />
              <SkeletonItem style={styles.listSubtitle} />
            </View>
          </View>
        );

      case 'avatar':
        return <SkeletonItem style={styles.avatarSkeleton} />;

      case 'text':
        return <SkeletonItem style={styles.textSkeleton} />;

      default:
        return <SkeletonItem style={styles.cardSkeleton} />;
    }
  };

  return (
    <View style={style}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={index > 0 && styles.spacer}>
          {renderSkeleton()}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.gray[200],
  },
  spacer: {
    marginTop: spacing.md,
  },

  // Card skeleton
  cardContainer: {
    width: '100%',
  },
  cardSkeleton: {
    height: 120,
    borderRadius: borderRadius.lg,
  },

  // Stat skeleton
  statContainer: {
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    width: '48%',
  },
  statValue: {
    width: 60,
    height: 32,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  statLabel: {
    width: 80,
    height: 16,
    borderRadius: borderRadius.sm,
  },

  // List skeleton
  listContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
  },
  listAvatar: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    marginRight: spacing.md,
  },
  listContent: {
    flex: 1,
  },
  listTitle: {
    height: 18,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
    width: '70%',
  },
  listSubtitle: {
    height: 14,
    borderRadius: borderRadius.sm,
    width: '50%',
  },

  // Avatar skeleton
  avatarSkeleton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
  },

  // Text skeleton
  textSkeleton: {
    height: 16,
    borderRadius: borderRadius.sm,
    width: '100%',
  },
});
