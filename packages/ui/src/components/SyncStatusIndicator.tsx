import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, spacing, typography } from '@gamehub/config';
import type { SyncStatus } from '@gamehub/domain';
import { formatDistanceToNow } from 'date-fns';

interface SyncStatusIndicatorProps {
  status: SyncStatus;
  lastSyncAt?: Date;
  onRetry?: () => void;
}

const STATUS_CONFIG: Record<SyncStatus, { color: string; label: string; showSpinner?: boolean }> = {
  SUCCESS: { color: colors.success[500], label: 'Synced' },
  IN_PROGRESS: { color: colors.primary[400], label: 'Syncing…', showSpinner: true },
  PENDING: { color: colors.neutral[500], label: 'Pending' },
  FAILED: { color: colors.error[500], label: 'Sync failed' },
  PARTIAL: { color: colors.warning[500], label: 'Partially synced' },
};

export function SyncStatusIndicator({ status, lastSyncAt, onRetry }: SyncStatusIndicatorProps) {
  const config = STATUS_CONFIG[status];

  return (
    <View style={styles.container}>
      {config.showSpinner ? (
        <ActivityIndicator size="small" color={config.color} />
      ) : (
        <View style={[styles.dot, { backgroundColor: config.color }]} />
      )}
      <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
      {lastSyncAt && status === 'SUCCESS' ? (
        <Text style={styles.time}>
          {formatDistanceToNow(lastSyncAt, { addSuffix: true })}
        </Text>
      ) : null}
      {status === 'FAILED' && onRetry ? (
        <TouchableOpacity
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="Retry sync"
        >
          <Text style={styles.retry}>Retry</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  time: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[500],
  },
  retry: {
    fontSize: typography.fontSize.xs,
    color: colors.primary[400],
    fontWeight: typography.fontWeight.semibold,
    textDecorationLine: 'underline',
  },
});
