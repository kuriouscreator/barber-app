/**
 * NativeCard - A modular, composable card component
 * Uses compound component pattern for flexible composition
 */

import React, { ReactNode } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { haptics } from '../../utils/haptics';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadows } from '../../theme/spacing';
import { componentTokens, CardVariant } from '../../theme/components';

// ===== Main Card Component =====

export interface NativeCardProps {
  children: ReactNode;
  variant?: CardVariant;
  onPress?: () => void;
  style?: ViewStyle;
  gradient?: boolean;
  gradientColors?: [string, string];
}

const NativeCardComponent: React.FC<NativeCardProps> = ({
  children,
  variant = 'default',
  onPress,
  style,
  gradient = false,
  gradientColors = [colors.accent.primary, colors.accent.primaryLight],
}) => {
  const variantStyle = componentTokens.card.variants[variant];

  const cardStyle: ViewStyle = {
    backgroundColor: variantStyle.backgroundColor,
    borderWidth: variantStyle.borderWidth,
    borderColor: variantStyle.borderWidth > 0 ? colors.border.light : 'transparent',
    borderRadius: componentTokens.card.borderRadius,
    padding: variantStyle.padding || componentTokens.card.padding,
    gap: componentTokens.card.gap,
    ...(variant === 'elevated' && shadows.md),
  };

  if (gradient) {
    const Wrapper = onPress ? TouchableOpacity : View;
    return (
      <Wrapper
        onPress={() => {
          if (onPress) {
            haptics.light();
            onPress();
          }
        }}
        activeOpacity={onPress ? 0.8 : 1}
        style={[cardStyle, style]}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientInner}
        >
          {children}
        </LinearGradient>
      </Wrapper>
    );
  }

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={() => {
          haptics.light();
          onPress();
        }}
        activeOpacity={0.8}
        style={[cardStyle, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[cardStyle, style]}>{children}</View>;
};

// ===== Card Header =====

interface CardHeaderProps {
  children: ReactNode;
  style?: ViewStyle;
}

const CardHeader: React.FC<CardHeaderProps> = ({ children, style }) => (
  <View style={[styles.header, style]}>{children}</View>
);

// ===== Card Body =====

interface CardBodyProps {
  children: ReactNode;
  style?: ViewStyle;
}

const CardBody: React.FC<CardBodyProps> = ({ children, style }) => (
  <View style={[styles.body, style]}>{children}</View>
);

// ===== Card Actions =====

interface CardActionsProps {
  children: ReactNode;
  style?: ViewStyle;
}

const CardActions: React.FC<CardActionsProps> = ({ children, style }) => (
  <View style={[styles.actions, style]}>{children}</View>
);

// ===== Card Title =====

interface CardTitleProps {
  children: string;
  style?: TextStyle;
  variant?: 'default' | 'gradient';
}

const CardTitle: React.FC<CardTitleProps> = ({ children, style, variant = 'default' }) => (
  <Text
    style={[
      styles.title,
      variant === 'gradient' && styles.titleGradient,
      style,
    ]}
  >
    {children}
  </Text>
);

// ===== Card Subtitle =====

interface CardSubtitleProps {
  children: string;
  style?: TextStyle;
  variant?: 'default' | 'gradient';
}

const CardSubtitle: React.FC<CardSubtitleProps> = ({ children, style, variant = 'default' }) => (
  <Text
    style={[
      styles.subtitle,
      variant === 'gradient' && styles.subtitleGradient,
      style,
    ]}
  >
    {children}
  </Text>
);

// ===== Card Icon =====

interface CardIconProps {
  name: keyof typeof Ionicons.glyphMap;
  size?: number;
  color?: string;
  gradient?: boolean;
  style?: ViewStyle;
}

const CardIcon: React.FC<CardIconProps> = ({
  name,
  size = 24,
  color = colors.accent.primary,
  gradient = false,
  style,
}) => (
  <View style={style}>
    <Ionicons
      name={name}
      size={size}
      color={gradient ? colors.white : color}
    />
  </View>
);

// ===== Card Stat (for stat variant) =====

interface CardStatProps {
  value: number | string;
  label: string;
  style?: ViewStyle;
}

const CardStat: React.FC<CardStatProps> = ({ value, label, style }) => (
  <View style={[styles.stat, style]}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// ===== Card Chevron =====

interface CardChevronProps {
  gradient?: boolean;
}

const CardChevron: React.FC<CardChevronProps> = ({ gradient = false }) => (
  <Ionicons
    name="chevron-forward"
    size={20}
    color={gradient ? colors.white : colors.gray[400]}
  />
);

// ===== Card Content (for action cards) =====

interface CardContentProps {
  children: ReactNode;
  style?: ViewStyle;
}

const CardContent: React.FC<CardContentProps> = ({ children, style }) => (
  <View style={[styles.content, style]}>{children}</View>
);

// ===== Export compound component =====

export const NativeCard = Object.assign(NativeCardComponent, {
  Header: CardHeader,
  Body: CardBody,
  Actions: CardActions,
  Title: CardTitle,
  Subtitle: CardSubtitle,
  Icon: CardIcon,
  Stat: CardStat,
  Chevron: CardChevron,
  Content: CardContent,
});

// ===== Styles =====

const styles = StyleSheet.create({
  gradientInner: {
    borderRadius: componentTokens.card.borderRadius,
    flex: 1,
    padding: componentTokens.card.padding,
    gap: componentTokens.card.gap,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  body: {
    gap: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  titleGradient: {
    color: colors.white,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  subtitleGradient: {
    color: colors.white,
    opacity: 0.9,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.accent.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    gap: spacing.xs,
  },
});
