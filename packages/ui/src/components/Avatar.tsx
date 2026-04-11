import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, radii, typography } from '@gamehub/config';
import type { Sport } from '@gamehub/domain';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  uri?: string;
  name: string;
  size?: AvatarSize;
  sport?: Sport;
  accessibilityLabel?: string;
}

const AVATAR_DIMENSIONS: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 72,
};

const AVATAR_FONT_SIZE: Record<AvatarSize, number> = {
  xs: typography.fontSize.xs,
  sm: typography.fontSize.sm,
  md: typography.fontSize.base,
  lg: typography.fontSize.xl,
  xl: typography.fontSize['2xl'],
};

const SPORT_COLORS: Record<string, string> = {
  SOCCER: colors.sport.soccer,
  BASKETBALL: colors.sport.basketball,
  BASEBALL: colors.sport.baseball,
  SOFTBALL: colors.sport.softball,
  LACROSSE: colors.sport.lacrosse,
  HOCKEY: colors.sport.hockey,
  FOOTBALL: colors.sport.football,
  VOLLEYBALL: colors.sport.volleyball,
  TENNIS: colors.sport.tennis,
  SWIMMING: colors.sport.swimming,
  OTHER: colors.sport.other,
};

const DEFAULT_BACKGROUND_COLORS = [
  colors.primary[600],
  colors.accent[600],
  colors.warning[600],
  colors.error[600],
  colors.navy[600],
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || parts[0] === '') return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getDefaultBackgroundColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return DEFAULT_BACKGROUND_COLORS[Math.abs(hash) % DEFAULT_BACKGROUND_COLORS.length];
}

export const Avatar: React.FC<AvatarProps> = ({
  uri,
  name,
  size = 'md',
  sport,
  accessibilityLabel,
}) => {
  const dimension = AVATAR_DIMENSIONS[size];
  const fontSize = AVATAR_FONT_SIZE[size];
  const initials = getInitials(name);

  const backgroundColor = sport != null && SPORT_COLORS[sport] != null
    ? SPORT_COLORS[sport]
    : getDefaultBackgroundColor(name);

  const circleStyle = {
    width: dimension,
    height: dimension,
    borderRadius: radii.full,
    backgroundColor,
  };

  if (uri != null && uri.length > 0) {
    return (
      <Image
        source={{ uri }}
        style={[styles.image, circleStyle]}
        accessibilityLabel={accessibilityLabel ?? name}
        accessibilityRole="image"
      />
    );
  }

  return (
    <View
      style={[styles.fallback, circleStyle]}
      accessible
      accessibilityLabel={accessibilityLabel ?? `${name} avatar`}
      accessibilityRole="image"
    >
      <Text style={[styles.initials, { fontSize }]} numberOfLines={1}>
        {initials}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    resizeMode: 'cover',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.neutral[0],
    fontWeight: typography.fontWeight.bold as '700',
    letterSpacing: typography.letterSpacing.wide,
  },
});

export default Avatar;
