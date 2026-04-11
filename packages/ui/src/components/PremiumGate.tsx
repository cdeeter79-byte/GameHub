import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, radii, typography } from '@gamehub/config';

interface PremiumGateProps {
  children: React.ReactNode;
  isLocked: boolean;
  feature: string;
  onUpgrade: () => void;
}

export function PremiumGate({ children, isLocked, feature, onUpgrade }: PremiumGateProps) {
  if (!isLocked) return <>{children}</>;

  return (
    <View
      style={styles.container}
      accessibilityLabel={`${feature} is a premium feature`}
    >
      {/* Dimmed preview */}
      <View style={styles.preview} pointerEvents="none">
        {children}
      </View>
      {/* Overlay */}
      <View style={styles.overlay}>
        <Text style={styles.lockIcon}>⭐</Text>
        <Text style={styles.title}>Premium Feature</Text>
        <Text style={styles.description}>{feature} is available on GameHub Premium.</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={onUpgrade}
          accessibilityRole="button"
          accessibilityLabel="Upgrade to GameHub Premium"
          accessibilityHint="Opens the premium upgrade screen"
        >
          <Text style={styles.buttonText}>Upgrade to Premium</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: radii.lg,
  },
  preview: {
    opacity: 0.2,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
    gap: spacing[3],
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.primary[700],
  },
  lockIcon: {
    fontSize: 32,
  },
  title: {
    color: colors.white,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
  },
  description: {
    color: colors.neutral[300],
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    lineHeight: typography.fontSize.sm * 1.5,
  },
  button: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: radii.full,
    marginTop: spacing[2],
  },
  buttonText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
});
