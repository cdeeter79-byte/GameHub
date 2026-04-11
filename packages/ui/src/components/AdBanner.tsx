import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '@gamehub/config';

interface AdBannerProps {
  /** Placement identifier for the ad slot (e.g. 'dashboard_bottom', 'schedule_between') */
  placementId?: string;
  /** Whether the banner should render. Set false to suppress (premium users, child profiles, COPPA). */
  isVisible?: boolean;
  /** Height of the ad slot. Defaults to 50 (standard banner). */
  height?: number;
}

/**
 * AdBanner — pluggable ad placement component.
 *
 * In development / when no real ad SDK is configured, renders a clearly labeled
 * placeholder. Swap the internals for your chosen ad network SDK (e.g. Google
 * AdMob, Meta Audience Network) by replacing the placeholder View.
 *
 * COPPA / privacy rules:
 * - Never render when isVisible=false (premium users, child profile context)
 * - The calling screen is responsible for passing isVisible=false for child profiles
 * - Never pass child PII to an ad network
 */
export function AdBanner({ placementId, isVisible = true, height = 50 }: AdBannerProps) {
  if (!isVisible) return null;

  return (
    <View
      style={[styles.container, { height }]}
      // Hide from screen readers — ads are decorative
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {/* ── Replace this View with your real ad SDK component ── */}
      <View style={styles.placeholder}>
        <Text style={styles.label}>Advertisement</Text>
        {placementId ? (
          <Text style={styles.placement}>{placementId}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: colors.neutral[900],
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.neutral[800],
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
  },
  label: {
    color: colors.neutral[500],
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  placement: {
    color: colors.neutral[600],
    fontSize: 10,
  },
});
