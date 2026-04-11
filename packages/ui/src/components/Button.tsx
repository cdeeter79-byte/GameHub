import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, typography, spacing, radii } from '@gamehub/config';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  accessibilityLabel?: string;
}

const variantStyles = {
  primary: {
    container: {
      backgroundColor: colors.primary[500],
      borderWidth: 0,
      borderColor: 'transparent',
    },
    text: {
      color: colors.neutral[0],
    },
    pressed: {
      backgroundColor: colors.primary[600],
    },
  },
  secondary: {
    container: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: colors.primary[500],
    },
    text: {
      color: colors.primary[400],
    },
    pressed: {
      backgroundColor: colors.primary[950],
    },
  },
  ghost: {
    container: {
      backgroundColor: 'transparent',
      borderWidth: 0,
      borderColor: 'transparent',
    },
    text: {
      color: colors.primary[400],
    },
    pressed: {
      backgroundColor: colors.navy[800],
    },
  },
  danger: {
    container: {
      backgroundColor: colors.error[500],
      borderWidth: 0,
      borderColor: 'transparent',
    },
    text: {
      color: colors.neutral[0],
    },
    pressed: {
      backgroundColor: colors.error[600],
    },
  },
} as const;

const sizeStyles = {
  sm: {
    container: {
      paddingVertical: spacing[1.5],
      paddingHorizontal: spacing[3],
      borderRadius: radii.md,
      minHeight: 32,
    },
    text: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.semibold as '600',
      letterSpacing: typography.letterSpacing.wide,
    },
    iconSize: 14,
    gap: spacing[1],
  },
  md: {
    container: {
      paddingVertical: spacing[2.5],
      paddingHorizontal: spacing[5],
      borderRadius: radii.lg,
      minHeight: 44,
    },
    text: {
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.semibold as '600',
      letterSpacing: typography.letterSpacing.wide,
    },
    iconSize: 16,
    gap: spacing[2],
  },
  lg: {
    container: {
      paddingVertical: spacing[3.5],
      paddingHorizontal: spacing[7],
      borderRadius: radii.xl,
      minHeight: 54,
    },
    text: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.semibold as '600',
      letterSpacing: typography.letterSpacing.wide,
    },
    iconSize: 20,
    gap: spacing[2.5],
  },
} as const;

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  accessibilityLabel,
}) => {
  const isDisabled = disabled || loading;
  const vStyle = variantStyles[variant];
  const sStyle = sizeStyles[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={loading ? 'Loading, please wait' : undefined}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={[
        styles.container,
        vStyle.container,
        sStyle.container,
        isDisabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'secondary' || variant === 'ghost' ? colors.primary[400] : colors.neutral[0]}
          accessibilityLabel="Loading"
        />
      ) : (
        <View style={[styles.inner, { gap: sStyle.gap }]}>
          {leftIcon != null && <View style={styles.iconWrapper}>{leftIcon}</View>}
          <Text style={[styles.text, vStyle.text, sStyle.text]} numberOfLines={1}>
            {label}
          </Text>
          {rightIcon != null && <View style={styles.iconWrapper}>{rightIcon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.45,
  },
});

export default Button;
