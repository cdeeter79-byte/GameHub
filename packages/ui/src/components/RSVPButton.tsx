import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, radii, spacing, typography } from '@gamehub/config';
import { RSVPStatus } from '@gamehub/domain';

export interface RSVPButtonProps {
  status: RSVPStatus;
  onPress: () => void;
  isReadOnly?: boolean;
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

interface RSVPConfig {
  icon: string;
  label: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  a11yLabel: string;
  a11yHint: string;
}

const RSVP_CONFIGS: Record<RSVPStatus, RSVPConfig> = {
  [RSVPStatus.ATTENDING]: {
    icon: '✓',
    label: 'Going',
    backgroundColor: colors.accent[900],
    textColor: colors.accent[300],
    borderColor: colors.accent[600],
    a11yLabel: 'RSVP: Attending',
    a11yHint: 'Tap to change RSVP status',
  },
  [RSVPStatus.NOT_ATTENDING]: {
    icon: '✕',
    label: 'Not Going',
    backgroundColor: colors.error[900],
    textColor: colors.error[300],
    borderColor: colors.error[600],
    a11yLabel: 'RSVP: Not Attending',
    a11yHint: 'Tap to change RSVP status',
  },
  [RSVPStatus.MAYBE]: {
    icon: '?',
    label: 'Maybe',
    backgroundColor: colors.warning[900],
    textColor: colors.warning[300],
    borderColor: colors.warning[600],
    a11yLabel: 'RSVP: Maybe',
    a11yHint: 'Tap to change RSVP status',
  },
  [RSVPStatus.PENDING]: {
    icon: '○',
    label: 'RSVP',
    backgroundColor: colors.navy[800],
    textColor: colors.dark.textSecondary,
    borderColor: colors.dark.border,
    a11yLabel: 'RSVP pending — tap to respond',
    a11yHint: 'Tap to set your attendance status',
  },
};

const SIZE_STYLES = {
  sm: {
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[2.5],
    iconSize: typography.fontSize.sm,
    labelSize: typography.fontSize.xs,
    gap: spacing[1],
    borderRadius: radii.md,
    minWidth: 64,
  },
  md: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    iconSize: typography.fontSize.base,
    labelSize: typography.fontSize.sm,
    gap: spacing[1.5],
    borderRadius: radii.lg,
    minWidth: 90,
  },
  lg: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[5],
    iconSize: typography.fontSize.lg,
    labelSize: typography.fontSize.base,
    gap: spacing[2],
    borderRadius: radii.xl,
    minWidth: 110,
  },
} as const;

export const RSVPButton: React.FC<RSVPButtonProps> = ({
  status,
  onPress,
  isReadOnly = false,
  isLoading = false,
  size = 'md',
}) => {
  const config = RSVP_CONFIGS[status];
  const sizeStyle = SIZE_STYLES[size];

  const a11yLabel = isReadOnly
    ? `${config.a11yLabel} (read only)`
    : config.a11yLabel;
  const a11yHint = isReadOnly ? undefined : config.a11yHint;

  const inner = (
    <View
      style={[
        styles.inner,
        {
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
          paddingVertical: sizeStyle.paddingVertical,
          paddingHorizontal: sizeStyle.paddingHorizontal,
          borderRadius: sizeStyle.borderRadius,
          minWidth: sizeStyle.minWidth,
          gap: sizeStyle.gap,
        },
      ]}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={config.textColor} />
      ) : (
        <>
          <Text
            style={[
              styles.icon,
              { color: config.textColor, fontSize: sizeStyle.iconSize },
            ]}
          >
            {isReadOnly ? `${config.icon} 🔒` : config.icon}
          </Text>
          <Text
            style={[
              styles.label,
              { color: config.textColor, fontSize: sizeStyle.labelSize },
            ]}
            numberOfLines={1}
          >
            {config.label}
          </Text>
        </>
      )}
    </View>
  );

  if (isReadOnly) {
    return (
      <View
        accessible
        accessibilityRole="text"
        accessibilityLabel={a11yLabel}
      >
        {inner}
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isLoading}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      accessibilityHint={a11yHint}
      accessibilityState={{ disabled: isLoading, busy: isLoading }}
    >
      {inner}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  icon: {
    fontWeight: typography.fontWeight.bold as '700',
  },
  label: {
    fontWeight: typography.fontWeight.semibold as '600',
    letterSpacing: typography.letterSpacing.wide,
  },
});

export default RSVPButton;
