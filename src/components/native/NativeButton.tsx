/**
 * NativeButton - A modular, composable button component
 * Provides consistent styling and interaction patterns across the app
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { haptics } from '../../utils/haptics';
import { colors } from '../../theme/colors';
import { componentTokens } from '../../theme/components';
import { shadows } from '../../theme/spacing';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface NativeButtonProps {
  /** Button text content */
  children: string;

  /** Button style variant */
  variant?: ButtonVariant;

  /** Button size */
  size?: ButtonSize;

  /** Icon name from Ionicons */
  icon?: keyof typeof Ionicons.glyphMap;

  /** Icon position relative to text */
  iconPosition?: 'left' | 'right';

  /** Enable haptic feedback on press */
  haptic?: boolean;

  /** Show loading spinner */
  loading?: boolean;

  /** Disable button */
  disabled?: boolean;

  /** Make button full width */
  fullWidth?: boolean;

  /** Press handler */
  onPress?: () => void;

  /** Custom style overrides */
  style?: ViewStyle;

  /** Custom text style overrides */
  textStyle?: TextStyle;
}

export const NativeButton: React.FC<NativeButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  haptic = true,
  loading = false,
  disabled = false,
  fullWidth = false,
  onPress,
  style,
  textStyle,
}) => {
  const sizeConfig = componentTokens.button.sizes[size];
  const iconSize = componentTokens.button.iconSizes[size];

  const handlePress = () => {
    if (disabled || loading) return;

    if (haptic) {
      if (variant === 'danger') {
        haptics.warning();
      } else {
        haptics.light();
      }
    }

    onPress?.();
  };

  const buttonStyle: ViewStyle = {
    height: sizeConfig.height,
    paddingHorizontal: sizeConfig.paddingHorizontal,
    borderRadius: componentTokens.button.borderRadius,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: componentTokens.button.iconSpacing,
    opacity: disabled ? 0.5 : 1,
    ...(fullWidth && { width: '100%' }),
  };

  const textStyles: TextStyle = {
    fontSize: sizeConfig.fontSize,
    fontWeight: '600',
  };

  const renderIcon = () => {
    if (loading) {
      return (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'danger' ? colors.white : colors.accent.primary}
        />
      );
    }

    if (icon) {
      return (
        <Ionicons
          name={icon}
          size={iconSize}
          color={variant === 'primary' || variant === 'danger' ? colors.white : colors.accent.primary}
        />
      );
    }

    return null;
  };

  const renderContent = () => (
    <>
      {iconPosition === 'left' && renderIcon()}
      {!loading && (
        <Text style={[styles.text, textStyles, getTextColor(variant), textStyle]}>
          {children}
        </Text>
      )}
      {iconPosition === 'right' && renderIcon()}
    </>
  );

  // Primary variant uses gradient
  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[buttonStyle, style]}
      >
        <LinearGradient
          colors={[colors.accent.primary, colors.accent.primaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          {renderContent()}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // Danger variant uses red gradient
  if (variant === 'danger') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[buttonStyle, style]}
      >
        <LinearGradient
          colors={['#DC2626', colors.accent.error]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          {renderContent()}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // Secondary and ghost variants
  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        buttonStyle,
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        style,
      ]}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const getTextColor = (variant: ButtonVariant): TextStyle => {
  switch (variant) {
    case 'primary':
    case 'danger':
      return { color: colors.white };
    case 'secondary':
      return { color: colors.accent.primary };
    case 'ghost':
      return { color: colors.text.primary };
    default:
      return { color: colors.white };
  }
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: componentTokens.button.iconSpacing,
    borderRadius: componentTokens.button.borderRadius,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.accent.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  text: {
    fontWeight: '600',
  },
});
