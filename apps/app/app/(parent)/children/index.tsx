import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useChildren } from '../../../src/hooks/useChildren';
import type { ChildProfile } from '@gamehub/domain';

const C = {
  bg: '#0F172A',
  surface: '#1E293B',
  surfaceRaised: '#334155',
  border: '#334155',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  primary: '#3B82F6',
  primaryLight: '#60A5FA',
  primaryBg: '#1E3A8A',
  white: '#FFFFFF',
};

const SPORT_ICONS: Record<string, string> = {
  SOCCER: '⚽', BASKETBALL: '🏀', BASEBALL: '⚾', SOFTBALL: '🥎',
  LACROSSE: '🥍', HOCKEY: '🏒', FOOTBALL: '🏈', VOLLEYBALL: '🏐',
  TENNIS: '🎾', SWIMMING: '🏊', OTHER: '🏅',
};

const AGE_BAND_LABELS: Record<string, string> = {
  UNDER_13: 'Under 13',
  TEEN_13_17: '13 – 17',
  ADULT_18_PLUS: '18+',
};

function initials(first: string, last: string) {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase();
}

function ChildCard({ item }: { item: ChildProfile }) {
  const sportIcon = item.sport ? (SPORT_ICONS[item.sport] ?? '🏅') : '🏅';
  const sportLabel = item.sport
    ? item.sport.charAt(0) + item.sport.slice(1).toLowerCase()
    : 'No sport set';
  const ageLabel = AGE_BAND_LABELS[item.ageBand] ?? item.ageBand;

  return (
    <TouchableOpacity
      style={styles.card}
      accessibilityRole="button"
      accessibilityLabel={`${item.firstName} ${item.lastName}`}
      onPress={() => router.push({ pathname: '/(parent)/children/[id]', params: { id: item.id } })}
      activeOpacity={0.75}
    >
      <View style={styles.avatarWrap}>
        <Text style={styles.avatarText}>{initials(item.firstName, item.lastName)}</Text>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{item.firstName} {item.lastName}</Text>
        <Text style={styles.cardDetail}>
          {sportIcon} {sportLabel} · {ageLabel}
        </Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

export default function ChildrenScreen() {
  const { children, isLoading } = useChildren();

  return (
    <View style={styles.root}>
      <FlatList
        data={children}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ChildCard item={item} />}
        contentContainerStyle={
          children.length === 0 ? styles.emptyContainer : styles.list
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.center}>
              <Text style={styles.centerText}>Loading…</Text>
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>👧🏻🧒🏾</Text>
              <Text style={styles.emptyTitle}>No kids added yet</Text>
              <Text style={styles.emptyDesc}>
                Add your children to start tracking their sports schedules in one place.
              </Text>
              <TouchableOpacity
                style={styles.emptyAction}
                onPress={() => router.push('/(parent)/children/new')}
                accessibilityRole="button"
              >
                <Text style={styles.emptyActionText}>Add a Child</Text>
              </TouchableOpacity>
            </View>
          )
        }
      />

      {children.length > 0 && (
        <View style={styles.fab}>
          <TouchableOpacity
            style={styles.fabButton}
            onPress={() => router.push('/(parent)/children/new')}
            accessibilityRole="button"
            accessibilityLabel="Add a child"
          >
            <Text style={styles.fabIcon}>+</Text>
            <Text style={styles.fabLabel}>Add Child</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  list: { padding: 16, gap: 10, paddingBottom: 100 },
  emptyContainer: { flex: 1 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: C.primaryLight, fontSize: 18, fontWeight: '700' },
  cardInfo: { flex: 1, gap: 3 },
  cardName: { color: C.text, fontSize: 16, fontWeight: '600' },
  cardDetail: { color: C.textSecondary, fontSize: 13 },
  chevron: { color: C.textTertiary, fontSize: 22 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  centerText: { color: C.textTertiary, fontSize: 14 },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 4 },
  emptyTitle: { color: C.text, fontSize: 20, fontWeight: '700', textAlign: 'center' },
  emptyDesc: {
    color: C.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  emptyAction: {
    marginTop: 8,
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  emptyActionText: { color: C.white, fontSize: 15, fontWeight: '700' },

  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    left: 20,
  },
  fabButton: {
    backgroundColor: C.primary,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  fabIcon: { color: C.white, fontSize: 20, fontWeight: '700' },
  fabLabel: { color: C.white, fontSize: 16, fontWeight: '700' },
});
