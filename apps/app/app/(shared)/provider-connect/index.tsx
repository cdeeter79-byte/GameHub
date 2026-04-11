import { View, Text, FlatList, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { colors, spacing, typography, radii, PROVIDER_DISPLAY_NAMES, PROVIDER_COLORS, AUTH_STRATEGIES } from '@gamehub/config';
import type { ProviderId } from '@gamehub/config';
import { CAPABILITY_MATRIX } from '@gamehub/adapters';

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
  if (strategy === 'oauth2') return 'Connect with OAuth';
  if (strategy === 'api_key') return 'Enter API Key';
  if (strategy === 'csv_import') return 'Import CSV';
  if (strategy === 'ics_url') return 'Add Calendar URL';
  if (strategy === 'email') return 'Paste Email';
  return 'Add Manually';
}

function getStatusLabel(id: ProviderId): { label: string; color: string } {
  const caps = CAPABILITY_MATRIX[id];
  if (!caps.supportsOfficialAPI && !caps.supportsCalendarSubscription) {
    return { label: 'Limited', color: colors.warning[500] };
  }
  if (caps.supportsRSVPWrite || caps.supportsMessagingWrite) {
    return { label: 'Full sync', color: colors.success[500] };
  }
  return { label: 'Read only', color: colors.primary[400] };
}

export default function ProviderConnectScreen() {
  function renderProvider({ item }: { item: ProviderId }) {
    const { label: statusLabel, color: statusColor } = getStatusLabel(item);
    const authLabel = getAuthLabel(item);
    const brandColor = PROVIDER_COLORS[item];

    return (
      <TouchableOpacity
        style={styles.card}
        accessibilityRole="button"
        accessibilityLabel={`Connect ${PROVIDER_DISPLAY_NAMES[item]}, ${statusLabel}`}
        onPress={() => {
          // In a real implementation: route to provider-specific OAuth/setup flow
        }}
      >
        <View style={[styles.colorBar, { backgroundColor: brandColor }]} />
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.providerName}>{PROVIDER_DISPLAY_NAMES[item]}</Text>
            <View style={[styles.statusBadge, { borderColor: statusColor }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
          </View>
          <Text style={styles.authLabel}>{authLabel}</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.intro}>
        Connect your sports platforms to sync schedules, rosters, and messages into GameHub.
      </Text>
      <FlatList
        data={PROVIDER_IDS}
        keyExtractor={(item) => item}
        renderItem={renderProvider}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[950] },
  intro: {
    color: colors.neutral[400],
    fontSize: typography.fontSize.sm,
    padding: spacing[4],
    lineHeight: 20,
  },
  list: { paddingBottom: spacing[10] },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[900],
    overflow: 'hidden',
  },
  colorBar: { width: 4, alignSelf: 'stretch' },
  cardContent: { flex: 1, padding: spacing[4], gap: spacing[1] },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  providerName: { color: colors.white, fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.semibold, flex: 1 },
  statusBadge: { borderWidth: 1, borderRadius: radii.full, paddingHorizontal: spacing[2], paddingVertical: 2 },
  statusText: { fontSize: 11, fontWeight: typography.fontWeight.medium },
  authLabel: { color: colors.neutral[500], fontSize: typography.fontSize.sm },
  chevron: { color: colors.neutral[500], fontSize: 22, paddingRight: spacing[4] },
  separator: { height: 1, backgroundColor: colors.neutral[800] },
});
