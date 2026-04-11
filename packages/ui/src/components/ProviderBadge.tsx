import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '@gamehub/config';
import type { ProviderId } from '@gamehub/config';
import { PROVIDER_COLORS, PROVIDER_DISPLAY_NAMES } from '@gamehub/config';

export type ProviderBadgeSize = 'sm' | 'md';

export interface ProviderBadgeProps {
  providerId: ProviderId;
  size?: ProviderBadgeSize;
  showLabel?: boolean;
  accessibilityLabel?: string;
}

const SIZE_CONFIG = {
  sm: {
    dotSize: 8,
    fontSize: typography.fontSize.xs,
    paddingVertical: spacing[0.5],
    paddingHorizontal: spacing[1.5],
    gap: spacing[1],
    borderRadius: radii.sm,
  },
  md: {
    dotSize: 10,
    fontSize: typography.fontSize.sm,
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[2.5],
    gap: spacing[1.5],
    borderRadius: radii.md,
  },
} as const;

export const ProviderBadge: React.FC<ProviderBadgeProps> = ({
  providerId,
  size = 'md',
  showLabel = true,
  accessibilityLabel,
}) => {
  const color = PROVIDER_COLORS[providerId];
  const displayName = PROVIDER_DISPLAY_NAMES[providerId];
  const sizeConfig = SIZE_CONFIG[size];
  const a11yLabel = accessibilityLabel ?? `Provider: ${displayName}`;

  return (
    <View
      style={[
        styles.container,
        {
          paddingVertical: sizeConfig.paddingVertical,
          paddingHorizontal: sizeConfig.paddingHorizontal,
          borderRadius: sizeConfig.borderRadius,
          gap: sizeConfig.gap,
          backgroundColor: `${color}18`,
          borderColor: `${color}44`,
        },
      ]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={a11yLabel}
    >
      <View
        style={[
          styles.dot,
          {
            width: sizeConfig.dotSize,
            height: sizeConfig.dotSize,
            borderRadius: sizeConfig.dotSize / 2,
            backgroundColor: color,
          },
        ]}
      />
      {showLabel && (
        <Text
          style={[
            styles.label,
            {
              color,
              fontSize: sizeConfig.fontSize,
            },
          ]}
          numberOfLines={1}
        >
          {displayName}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  dot: {
    flexShrink: 0,
  },
  label: {
    fontWeight: typography.fontWeight.semibold as '600',
    letterSpacing: typography.letterSpacing.wide,
  },
});

export default ProviderBadge;
