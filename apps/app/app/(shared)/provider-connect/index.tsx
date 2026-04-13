import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { PROVIDER_DISPLAY_NAMES, PROVIDER_COLORS, AUTH_STRATEGIES } from '@gamehub/config';
import type { ProviderId } from '@gamehub/config';
import { CAPABILITY_MATRIX } from '@gamehub/adapters';

const C = {
  bg: '#0F172A',
  surface: '#1E293B',
  border: '#334155',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  primary: '#3B82F6',
  accent: '#10B981',
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

function ProviderRow({ id }: { id: ProviderId }) {
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

  return (
    <TouchableOpacity
      style={styles.row}
      accessibilityRole="button"
      accessibilityLabel={`Connect ${displayName}`}
      activeOpacity={0.75}
      onPress={() => {
        // TODO: Route to provider-specific setup flow
      }}
    >
      {/* Brand avatar */}
      <View style={[styles.brandAvatar, { backgroundColor: brandColor + '22', borderColor: brandColor + '44' }]}>
        <Text style={[styles.brandInitials, { color: brandColor }]}>{initials}</Text>
      </View>

      {/* Info */}
      <View style={styles.rowInfo}>
        <View style={styles.rowTitleRow}>
          <Text style={styles.providerName}>{displayName}</Text>
          <View style={[styles.capBadge, { borderColor: cap.color }]}>
            <Text style={[styles.capDot, { color: cap.color }]}>{cap.dot}</Text>
            <Text style={[styles.capLabel, { color: cap.color }]}>{cap.label}</Text>
          </View>
        </View>
        <Text style={styles.authLabel}>{authLabel}</Text>
      </View>

      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

export default function ProviderConnectScreen() {
  return (
    <View style={styles.root}>
      <FlatList
        data={PROVIDER_IDS}
        keyExtractor={(item) => item}
        renderItem={({ item }) => <ProviderRow id={item} />}
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
  list: { paddingBottom: 60 },

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
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: C.border,
    marginLeft: 78,
  },
});
