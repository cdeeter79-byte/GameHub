import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '@gamehub/config';
import type { ProviderId } from '@gamehub/config';
import { PROVIDER_COLORS, PROVIDER_DISPLAY_NAMES } from '@gamehub/config';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'provider';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  color?: string;
  size?: BadgeSize;
  accessibilityLabel?: string;
}

const VARIANT_COLORS: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
  default: {
    bg: colors.navy[700],
    text: colors.navy[200],
    border: colors.navy[600],
  },
  success: {
    bg: colors.accent[900],
    text: colors.accent[300],
    border: colors.accent[700],
  },
  warning: {
    bg: colors.warning[900],
    text: colors.warning[300],
    border: colors.warning[700],
  },
  error: {
    bg: colors.error[900],
    text: colors.error[300],
    border: colors.error[700],
  },
  info: {
    bg: colors.primary[900],
    text: colors.primary[300],
    border: colors.primary[700],
  },
  provider: {
    bg: colors.navy[800],
    text: colors.neutral[0],
    border: colors.navy[600],
  },
};

const SIZE_STYLES = {
  sm: {
    paddingVertical: spacing[0.5],
    paddingHorizontal: spacing[1.5],
    fontSize: typography.fontSize.xs,
    borderRadius: radii.sm,
  },
  md: {
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[2.5],
    fontSize: typography.fontSize.sm,
    borderRadius: radii.md,
  },
} as const;

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'default',
  color,
  size = 'md',
  accessibilityLabel,
}) => {
  const colorScheme = VARIANT_COLORS[variant];
  const sizeStyle = SIZE_STYLES[size];

  const bgColor = color != null ? `${color}22` : colorScheme.bg;
  const textColor = color != null ? color : colorScheme.text;
  const borderColor = color != null ? `${color}55` : colorScheme.border;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bgColor,
          borderColor,
          paddingVertical: sizeStyle.paddingVertical,
          paddingHorizontal: sizeStyle.paddingHorizontal,
          borderRadius: sizeStyle.borderRadius,
        },
      ]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel ?? label}
    >
      <Text
        style={[
          styles.label,
          {
            color: textColor,
            fontSize: sizeStyle.fontSize,
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
};

export function providerBadgeProps(providerId: ProviderId): BadgeProps {
  return {
    label: PROVIDER_DISPLAY_NAMES[providerId],
    variant: 'provider',
    color: PROVIDER_COLORS[providerId],
  };
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontWeight: typography.fontWeight.semibold as '600',
    letterSpacing: typography.letterSpacing.wide,
  },
});

export default Badge;
