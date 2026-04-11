import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { colors, radii, shadows, spacing } from '@gamehub/config';

export interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  elevation?: 0 | 1 | 2 | 3;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

const elevationShadows = [
  shadows.none,
  shadows.sm,
  shadows.md,
  shadows.lg,
] as const;

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  elevation = 1,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const shadowStyle = elevationShadows[Math.max(0, Math.min(3, elevation)) as 0 | 1 | 2 | 3];
  const containerStyle = [styles.card, shadowStyle, style];

  if (onPress != null) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        style={containerStyle}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={containerStyle}
      accessible={accessibilityLabel != null}
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.dark.surface,
    borderRadius: radii.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.dark.border,
    overflow: 'hidden',
  },
});

export default Card;
