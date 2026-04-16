import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useState, useEffect } from 'react';
import { PROVIDER_DISPLAY_NAMES, PROVIDER_COLORS, AUTH_STRATEGIES } from '@gamehub/config';
import type { ProviderId } from '@gamehub/config';
import { CAPABILITY_MATRIX } from '@gamehub/adapters';
import { useProviderConnect } from '../../../src/hooks/useProviderConnect';

const C = {
  bg: '#0F172A',
  surface: '#1E293B',
  border: '#334155',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  primary: '#3B82F6',
  primaryBg: '#1E3A8A',
  accent: '#10B981',
  accentBg: '#064E3B',
  warning: '#F59E0B',
  white: '#FFFFFF',
};

const PROVIDER_IDS: ProviderId[] = [
  'teamsnap',
  'sportsengine',
  'sportsengine_tourney',
  'playmetrics',
  'leagueapps',
  'gamechanger',
  'band',
  'heja',
  'crossbar',
  'ics',
  'email_import',
  'manual',
];

function getAuthLabel(id: ProviderId): string {
  const strategy = AUTH_STRATEGIES[id];
  if (strategy === 'oauth2') return 'One-tap OAuth connection';
  if (strategy === 'api_key') return 'Enter your API key';
  if (strategy === 'csv_import') return 'Import a CSV file';
  if (strategy === 'ics_url') return 'Paste a calendar feed URL';
  if (strategy === 'email') return 'Forward a confirmation email';
  return 'Add events manually';
}

function getCapabilityInfo(id: ProviderId): { label: string; color: string; dot: string } {
  const caps = CAPABILITY_MATRIX[id];
  if (caps.supportsRSVPWrite && caps.supportsMessagingWrite) {
    return { label: 'Full sync', color: C.accent, dot: '●' };
  }
  if (caps.supportsOfficialAPI || caps.supportsCalendarSubscription) {
    return { label: 'Read only', color: C.primary, dot: '●' };
  }
  return { label: 'Limited', color: C.warning, dot: '●' };
}

// ─── Provider Row ─────────────────────────────────────────────────────────────

interface ProviderRowProps {
  id: ProviderId;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onSync?: () => void;
  isConnected?: boolean;
  isConnecting?: boolean;
  isSyncing?: boolean;
  hasError?: boolean;
}

function ProviderRow({ id, onConnect, onDisconnect, onSync, isConnected, isConnecting, isSyncing, hasError }: ProviderRowProps) {
  const cap = getCapabilityInfo(id);
  const authLabel = getAuthLabel(id);
  const brandColor = PROVIDER_COLORS[id] ?? C.textTertiary;
  const displayName = PROVIDER_DISPLAY_NAMES[id];

  const initials = displayName
    .split(' ')
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  function handlePress() {
    if (isConnecting || isSyncing) return;

    // If we have a live connect handler (currently TeamSnap only)
    if (onConnect) {
      if (isConnected) {
        Alert.alert(
          `${displayName} Connected`,
          'Your account is linked and syncing.',
          [
            { text: 'Sync Now', onPress: () => onSync?.() },
            {
              text: 'Disconnect',
              style: 'destructive',
              onPress: () =>
                Alert.alert(
                  `Disconnect ${displayName}?`,
                  'Your schedule and roster data will remain but new syncs will stop.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Disconnect', style: 'destructive', onPress: () => onDisconnect?.() },
                  ],
                ),
            },
            { text: 'Cancel', style: 'cancel' },
          ],
        );
      } else {
        onConnect();
      }
      return;
    }

    // Fallback for providers not yet implemented
    const strategy = AUTH_STRATEGIES[id];
    if (strategy === 'oauth2') {
      Alert.alert(
        `Connect ${displayName}`,
        `${displayName} OAuth integration is coming soon.`,
        [{ text: 'OK' }],
      );
    } else if (strategy === 'ics_url') {
      Alert.alert(
        `Add ${displayName} Calendar`,
        'Calendar URL import is coming in the next update.',
        [{ text: 'OK' }],
      );
    } else {
      Alert.alert(
        `Connect ${displayName}`,
        `${displayName} integration (${strategy}) is coming soon.`,
        [{ text: 'OK' }],
      );
    }
  }

  // When the provider has management actions, use a plain View so inner
  // TouchableOpacity buttons don't conflict with an outer one.
  const hasActions = !isConnecting && !isSyncing && !!onDisconnect && !!isConnected;

  const rowContent = (
    <>
      {/* Brand avatar */}
      <View style={[
        styles.brandAvatar,
        { backgroundColor: brandColor + '22', borderColor: brandColor + '44' },
        isConnected && styles.brandAvatarConnected,
      ]}>
        {isConnecting || isSyncing ? (
          <ActivityIndicator size="small" color={brandColor} />
        ) : (
          <Text style={[styles.brandInitials, { color: brandColor }]}>{initials}</Text>
        )}
      </View>

      {/* Info */}
      <View style={styles.rowInfo}>
        <View style={styles.rowTitleRow}>
          <Text style={styles.providerName}>{displayName}</Text>
          {isConnected ? (
            <View style={[styles.capBadge, { borderColor: C.accent }]}>
              <Text style={[styles.capDot, { color: C.accent }]}>●</Text>
              <Text style={[styles.capLabel, { color: C.accent }]}>Connected</Text>
            </View>
          ) : (
            <View style={[styles.capBadge, { borderColor: cap.color }]}>
              <Text style={[styles.capDot, { color: cap.color }]}>{cap.dot}</Text>
              <Text style={[styles.capLabel, { color: cap.color }]}>{cap.label}</Text>
            </View>
          )}
        </View>
        <Text style={styles.authLabel}>
          {isConnecting ? 'Connecting…' : isSyncing ? 'Syncing…' : isConnected ? 'Connected' : authLabel}
        </Text>
      </View>

      {/* Actions */}
      {hasActions ? (
        <View style={styles.rowActions}>
          {isConnected && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => onSync?.()}
              accessibilityRole="button"
            >
              <Text style={styles.actionBtnText}>Sync</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnDestructive]}
            onPress={() =>
              Alert.alert(
                `Disconnect ${displayName}?`,
                'Your existing data will remain but new syncs will stop.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Disconnect', style: 'destructive', onPress: () => onDisconnect() },
                ],
              )
            }
            accessibilityRole="button"
          >
            <Text style={[styles.actionBtnText, styles.actionBtnTextDestructive]}>Disconnect</Text>
          </TouchableOpacity>
        </View>
      ) : !isConnecting && !isSyncing ? (
        <Text style={styles.chevron}>›</Text>
      ) : null}
    </>
  );

  if (hasActions) {
    return <View style={styles.row}>{rowContent}</View>;
  }

  return (
    <TouchableOpacity
      style={styles.row}
      accessibilityRole="button"
      accessibilityLabel={`Connect ${displayName}`}
      activeOpacity={0.75}
      onPress={handlePress}
      disabled={isConnecting}
    >
      {rowContent}
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProviderConnectScreen() {
  const teamsnap = useProviderConnect('teamsnap');

  // Show error alert in an effect — never during render
  useEffect(() => {
    if (!teamsnap.error) return;
    Alert.alert('Connection Error', teamsnap.error, [
      { text: 'OK', onPress: () => teamsnap.clearError() },
    ]);
  }, [teamsnap.error]);

  function getRowProps(id: ProviderId): Partial<ProviderRowProps> {
    if (id === 'teamsnap') {
      return {
        onConnect: teamsnap.connect,
        onDisconnect: teamsnap.disconnect,
        onSync: teamsnap.sync,
        isConnected: teamsnap.isConnected,
        isConnecting: teamsnap.isConnecting,
        isSyncing: teamsnap.isSyncing,
        hasError: !!teamsnap.error,
      };
    }
    return {};
  }

  return (
    <View style={styles.root}>
      <FlatList
        data={PROVIDER_IDS}
        keyExtractor={(item) => item}
        renderItem={({ item }) => <ProviderRow id={item} {...getRowProps(item)} />}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Connect Platforms</Text>
            <Text style={styles.headerDesc}>
              Link your sports apps to pull schedules, RSVPs, and messages into one place.
              We support 12 providers.
            </Text>
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <Text style={[styles.legendDot, { color: C.accent }]}>●</Text>
                <Text style={styles.legendLabel}>Full sync — schedule + RSVP write-back</Text>
              </View>
              <View style={styles.legendItem}>
                <Text style={[styles.legendDot, { color: C.primary }]}>●</Text>
                <Text style={styles.legendLabel}>Read only — schedule sync</Text>
              </View>
              <View style={styles.legendItem}>
                <Text style={[styles.legendDot, { color: C.warning }]}>●</Text>
                <Text style={styles.legendLabel}>Limited — import only</Text>
              </View>
            </View>
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  list: { paddingBottom: 100 },

  header: {
    padding: 20,
    paddingBottom: 16,
    gap: 10,
  },
  headerTitle: {
    color: C.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerDesc: {
    color: C.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  legend: {
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { fontSize: 10 },
  legendLabel: { color: C.textSecondary, fontSize: 12 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 14,
    backgroundColor: C.bg,
  },
  brandAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandAvatarConnected: {
    borderWidth: 2,
  },
  brandInitials: { fontSize: 14, fontWeight: '800' },

  rowInfo: { flex: 1, gap: 3 },
  rowTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  providerName: { color: C.text, fontSize: 15, fontWeight: '600', flex: 1 },
  capBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  capDot: { fontSize: 8 },
  capLabel: { fontSize: 11, fontWeight: '600' },
  authLabel: { color: C.textTertiary, fontSize: 13 },

  chevron: { color: C.textTertiary, fontSize: 22 },

  rowActions: { flexDirection: 'column', gap: 6, alignItems: 'flex-end' },
  actionBtn: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 8, borderWidth: 1, borderColor: C.primary,
  },
  actionBtnText: { color: C.primary, fontSize: 12, fontWeight: '600' },
  actionBtnDestructive: { borderColor: '#EF4444' },
  actionBtnTextDestructive: { color: '#EF4444' },

  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: C.border,
    marginLeft: 78,
  },
});
