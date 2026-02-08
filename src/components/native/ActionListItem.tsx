import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { triggerHaptic } from '../../utils/haptics';

interface ActionListItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBackgroundColor: string;
  title: string;
  subtitle: string;
  onPress?: () => void;
  showChevron?: boolean;
}

export const ActionListItem: React.FC<ActionListItemProps> = ({
  icon,
  iconColor,
  iconBackgroundColor,
  title,
  subtitle,
  onPress,
  showChevron = true,
}) => {
  const handlePress = () => {
    if (onPress) {
      triggerHaptic('light');
      onPress();
    }
  };

  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconCircle, { backgroundColor: iconBackgroundColor }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      {showChevron && (
        <View style={styles.chevronContainer}>
          <Ionicons name="chevron-forward" size={14} color={colors.gray[400]} />
        </View>
      )}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    paddingTop: 4,
    gap: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
    lineHeight: 24,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.gray[500],
    lineHeight: 20,
  },
  chevronContainer: {
    paddingTop: 16,
  },
});
