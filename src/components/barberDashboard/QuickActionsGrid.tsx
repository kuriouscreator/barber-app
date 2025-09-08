import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius, shadows } from '../../theme/spacing';
import { QuickAction } from '../../types';

interface QuickActionsGridProps {
  actions: QuickAction[];
}

const QuickActionsGrid: React.FC<QuickActionsGridProps> = ({ actions }) => {
  const getIcon = (key: string) => {
    switch (key) {
      case 'book':
        return 'add-circle';
      case 'schedule':
        return 'calendar';
      case 'clients':
        return 'people';
      case 'services':
        return 'cut';
      default:
        return 'ellipse';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.grid}>
        {actions.map((action) => (
          <TouchableOpacity
            key={action.key}
            style={styles.actionCard}
            onPress={action.onPress}
            accessibilityRole="button"
            accessibilityLabel={`${action.title}: ${action.subtitle}`}
          >
            <View style={styles.iconContainer}>
              <Ionicons 
                name={getIcon(action.key) as any} 
                size={24} 
                color={colors.white} 
              />
            </View>
            <View style={styles.content}>
              <Text style={styles.title}>{action.title}</Text>
              <Text style={styles.subtitle}>{action.subtitle}</Text>
            </View>
            <Ionicons 
              name="chevron-forward" 
              size={16} 
              color={colors.text.secondary} 
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionCard: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
});

export default QuickActionsGrid;
