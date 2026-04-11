import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '@gamehub/config';

interface UnreadBadgeProps {
  count: number;
  maxCount?: number;
}

export function UnreadBadge({ count, maxCount = 99 }: UnreadBadgeProps) {
  if (count <= 0) return null;

  const display = count > maxCount ? `${maxCount}+` : String(count);
  const isWide = display.length > 2;

  return (
    <View
      style={[styles.badge, isWide && styles.wide]}
      accessibilityLabel={`${count} unread`}
    >
      <Text style={styles.text}>{display}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.error[500],
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  wide: {
    minWidth: 24,
    paddingHorizontal: 6,
  },
  text: {
    color: colors.white,
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
    lineHeight: 14,
  },
});
