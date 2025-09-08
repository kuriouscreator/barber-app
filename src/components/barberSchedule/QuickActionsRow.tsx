import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { borderRadius } from '../../theme/index';

interface QuickAction {
  key: string;
  title: string;
  subtitle: string;
  icon: string;
  onPress: () => void;
}

interface QuickActionsRowProps {
  actions: QuickAction[];
}

const QuickActionsRow: React.FC<QuickActionsRowProps> = ({ actions }) => {
  const getActionColors = (key: string) => {
    switch (key) {
      case 'copyWeek':
        return {
          background: '#3B82F6',
          icon: 'copy-outline',
        };
      case 'bulkEdit':
        return {
          background: '#8B5CF6',
          icon: 'create-outline',
        };
      default:
        return {
          background: colors.accent.primary,
          icon: 'help-outline',
        };
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick Actions</Text>
      <View style={styles.actionsContainer}>
        {actions.map((action) => {
          const colors = getActionColors(action.key);
          return (
            <TouchableOpacity
              key={action.key}
              style={[styles.actionCard, { backgroundColor: colors.background }]}
              onPress={action.onPress}
            >
              <View style={styles.actionContent}>
                <Ionicons name={colors.icon as any} size={24} color="#FFFFFF" />
                <View style={styles.actionText}>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                  <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 0, // Remove margin since parent now handles horizontal spacing
    marginVertical: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#0000000D',
    shadowOpacity: 0.1,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowRadius: 2,
    elevation: 2,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  actionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  actionSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.white,
    opacity: 0.9,
    marginTop: 2,
  },
});

export default QuickActionsRow;
