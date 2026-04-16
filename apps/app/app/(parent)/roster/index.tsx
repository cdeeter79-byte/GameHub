import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Linking,
} from 'react-native';
import { useState } from 'react';
import { useRoster } from '../../../src/hooks/useRoster';
import type { RosterPlayer, RosterParent } from '../../../src/hooks/useRoster';

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
  accent: '#10B981',
  accentBg: '#064E3B',
  white: '#FFFFFF',
};

const SPORT_ICONS: Record<string, string> = {
  SOCCER: '⚽', BASKETBALL: '🏀', BASEBALL: '⚾', SOFTBALL: '🥎',
  LACROSSE: '🥍', HOCKEY: '🏒', FOOTBALL: '🏈', VOLLEYBALL: '🏐',
  TENNIS: '🎾', SWIMMING: '🏊', OTHER: '🏅',
};

function initials(first: string, last: string) {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase();
}

// ─── Parent contact card ───────────────────────────────────────────────────────

function ParentContactCard({ parent, playerName }: { parent: RosterParent; playerName: string }) {
  const rel = parent.relationship ?? 'Parent';
  return (
    <View style={styles.contactCard}>
      <View style={styles.contactHeader}>
        <View style={styles.contactAvatar}>
          <Text style={styles.contactAvatarText}>
            {parent.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
          </Text>
        </View>
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{parent.name}</Text>
          <Text style={styles.contactRel}>{rel} of {playerName}</Text>
        </View>
      </View>
      {parent.phone && (
        <TouchableOpacity
          style={styles.contactAction}
          onPress={() => Linking.openURL(`tel:${parent.phone!.replace(/\D/g, '')}`)}
          accessibilityRole="button"
          accessibilityLabel={`Call ${parent.name}`}
        >
          <Text style={styles.contactActionIcon}>📞</Text>
          <Text style={styles.contactActionText}>{parent.phone}</Text>
          <Text style={styles.contactActionChevron}>›</Text>
        </TouchableOpacity>
      )}
      {parent.email && (
        <TouchableOpacity
          style={styles.contactAction}
          onPress={() => Linking.openURL(`mailto:${parent.email}`)}
          accessibilityRole="button"
          accessibilityLabel={`Email ${parent.name}`}
        >
          <Text style={styles.contactActionIcon}>✉️</Text>
          <Text style={styles.contactActionText}>{parent.email}</Text>
          <Text style={styles.contactActionChevron}>›</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Player detail modal ───────────────────────────────────────────────────────

function PlayerDetailModal({
  player,
  onClose,
}: {
  player: RosterPlayer | null;
  onClose: () => void;
}) {
  if (!player) return null;
  const ini = initials(player.firstName, player.lastName);
  const detail = [
    player.position,
    player.jerseyNumber ? `#${player.jerseyNumber}` : null,
    player.role !== 'PLAYER' ? player.role.charAt(0) + player.role.slice(1).toLowerCase() : null,
  ].filter(Boolean).join('  ·  ');

  return (
    <Modal
      visible={player != null}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalRoot}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="Close">
            <Text style={styles.modalClose}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Player Info</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={styles.modalContent}>
          {/* Player identity */}
          <View style={styles.playerHero}>
            {player.avatarUrl ? (
              <Image source={{ uri: player.avatarUrl }} style={styles.heroAvatar} />
            ) : (
              <View style={styles.heroAvatarPlaceholder}>
                <Text style={styles.heroAvatarText}>{ini}</Text>
              </View>
            )}
            <Text style={styles.heroName}>{player.firstName} {player.lastName}</Text>
            {detail ? <Text style={styles.heroDetail}>{detail}</Text> : null}
            {player.isOwnChild && (
              <View style={styles.ownChildBadge}>
                <Text style={styles.ownChildBadgeText}>⭐ My Child</Text>
              </View>
            )}
          </View>

          {/* Parent contacts */}
          {player.parents.length > 0 ? (
            <>
              <Text style={styles.sectionLabel}>PARENT / GUARDIAN CONTACTS</Text>
              {player.parents.map((p, i) => (
                <ParentContactCard key={i} parent={p} playerName={player.firstName} />
              ))}
            </>
          ) : (
            <View style={styles.noContacts}>
              <Text style={styles.noContactsText}>
                No parent contact information on file for this player.
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Player row ────────────────────────────────────────────────────────────────

function PlayerRow({
  player,
  onPress,
}: {
  player: RosterPlayer;
  onPress: () => void;
}) {
  const ini = initials(player.firstName, player.lastName);
  const detail = [
    player.position,
    player.jerseyNumber ? `#${player.jerseyNumber}` : null,
    player.role !== 'PLAYER' ? player.role.charAt(0) + player.role.slice(1).toLowerCase() : null,
  ].filter(Boolean).join('  ·  ');

  return (
    <TouchableOpacity
      style={styles.playerRow}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`${player.firstName} ${player.lastName}, tap for contact info`}
    >
      {/* Avatar */}
      {player.avatarUrl ? (
        <Image source={{ uri: player.avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatarPlaceholder, player.isOwnChild && styles.avatarPlaceholderOwn]}>
          <Text style={styles.avatarText}>{ini}</Text>
        </View>
      )}

      {/* Info */}
      <View style={styles.playerInfo}>
        <Text style={styles.playerName}>
          {player.firstName} {player.lastName}
          {player.isOwnChild ? '  ⭐' : ''}
        </Text>
        {detail ? (
          <Text style={styles.playerDetail}>{detail}</Text>
        ) : null}
        {player.parents.length > 0 && (
          <Text style={styles.parentPreview} numberOfLines={1}>
            {player.parents.map((p) => `${p.name}${p.relationship ? ` (${p.relationship})` : ''}`).join(', ')}
          </Text>
        )}
      </View>

      {/* Jersey + chevron */}
      <View style={styles.playerRight}>
        {player.jerseyNumber ? (
          <View style={styles.jerseyBadge}>
            <Text style={styles.jerseyText}>#{player.jerseyNumber}</Text>
          </View>
        ) : null}
        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function RosterScreen() {
  const { teams, isLoading, refresh } = useRoster();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<RosterPlayer | null>(null);

  async function onRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={C.primary} size="large" />
        <Text style={styles.loadingText}>Loading rosters…</Text>
      </View>
    );
  }

  if (teams.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyEmoji}>👥</Text>
        <Text style={styles.emptyTitle}>No roster data</Text>
        <Text style={styles.emptyDesc}>
          Connect a sports platform to see your team rosters here.
        </Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
      >
        {teams.map((team) => (
          <View key={team.teamId} style={styles.teamSection}>
            {/* Team header */}
            <View style={styles.teamHeader}>
              <Text style={styles.teamIcon}>{SPORT_ICONS[team.sport] ?? '🏅'}</Text>
              <View>
                <Text style={styles.teamName}>{team.teamName}</Text>
                <Text style={styles.teamMeta}>
                  {team.sport.charAt(0) + team.sport.slice(1).toLowerCase()}
                  {'  ·  '}{team.players.length} player{team.players.length !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>

            {/* Player list */}
            <View style={styles.playerCard}>
              {team.players.map((player, i) => (
                <View key={player.id}>
                  {i > 0 && <View style={styles.separator} />}
                  <PlayerRow
                    player={player}
                    onPress={() => setSelectedPlayer(player)}
                  />
                </View>
              ))}
            </View>
          </View>
        ))}
        <Text style={styles.tapHint}>Tap any player to view parent contacts</Text>
      </ScrollView>

      <PlayerDetailModal
        player={selectedPlayer}
        onClose={() => setSelectedPlayer(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, paddingBottom: 100, gap: 24 },
  centered: {
    flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center',
    gap: 12, padding: 32,
  },
  loadingText: { color: C.textTertiary, fontSize: 14, marginTop: 8 },
  emptyEmoji: { fontSize: 48, marginBottom: 4 },
  emptyTitle: { color: C.text, fontSize: 20, fontWeight: '700', textAlign: 'center' },
  emptyDesc: { color: C.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 20, maxWidth: 280 },

  tapHint: {
    color: C.textTertiary, fontSize: 12, textAlign: 'center', marginTop: 8,
  },

  teamSection: { gap: 10 },
  teamHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 4 },
  teamIcon: { fontSize: 26 },
  teamName: { color: C.text, fontSize: 17, fontWeight: '700' },
  teamMeta: { color: C.textTertiary, fontSize: 12, marginTop: 1 },

  playerCard: {
    backgroundColor: C.surface, borderRadius: 14,
    borderWidth: 1, borderColor: C.border, overflow: 'hidden',
  },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: C.border, marginLeft: 70 },

  playerRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12, gap: 12,
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPlaceholder: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.primaryBg, alignItems: 'center', justifyContent: 'center',
  },
  avatarPlaceholderOwn: { backgroundColor: C.accentBg },
  avatarText: { color: C.primaryLight, fontSize: 16, fontWeight: '700' },

  playerInfo: { flex: 1, gap: 2 },
  playerName: { color: C.text, fontSize: 15, fontWeight: '600' },
  playerDetail: { color: C.textSecondary, fontSize: 13 },
  parentPreview: { color: C.textTertiary, fontSize: 11, marginTop: 1 },

  playerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  jerseyBadge: {
    backgroundColor: C.surfaceRaised, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: C.border,
  },
  jerseyText: { color: C.primaryLight, fontSize: 13, fontWeight: '700' },
  chevron: { color: C.textTertiary, fontSize: 20, marginLeft: 2 },

  // ── Player detail modal ────────────────────────────────────────────────────
  modalRoot: { flex: 1, backgroundColor: C.bg },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  modalClose: { color: C.primaryLight, fontSize: 16, fontWeight: '600', width: 60 },
  modalTitle: { color: C.text, fontSize: 16, fontWeight: '700' },
  modalContent: { padding: 20, gap: 16, paddingBottom: 60 },

  playerHero: { alignItems: 'center', gap: 8, paddingVertical: 8 },
  heroAvatar: { width: 80, height: 80, borderRadius: 40 },
  heroAvatarPlaceholder: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: C.primaryBg,
    alignItems: 'center', justifyContent: 'center',
  },
  heroAvatarText: { color: C.primaryLight, fontSize: 28, fontWeight: '700' },
  heroName: { color: C.text, fontSize: 22, fontWeight: '800' },
  heroDetail: { color: C.textSecondary, fontSize: 14 },
  ownChildBadge: {
    backgroundColor: C.accentBg, borderRadius: 20, borderWidth: 1, borderColor: C.accent,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  ownChildBadgeText: { color: C.accent, fontSize: 13, fontWeight: '700' },

  sectionLabel: {
    color: C.textTertiary, fontSize: 11, fontWeight: '700',
    letterSpacing: 0.8, textTransform: 'uppercase',
  },

  contactCard: {
    backgroundColor: C.surface, borderRadius: 14,
    borderWidth: 1, borderColor: C.border, overflow: 'hidden', gap: 0,
  },
  contactHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border,
  },
  contactAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.primaryBg, alignItems: 'center', justifyContent: 'center',
  },
  contactAvatarText: { color: C.primaryLight, fontSize: 16, fontWeight: '700' },
  contactInfo: { flex: 1 },
  contactName: { color: C.text, fontSize: 16, fontWeight: '700' },
  contactRel: { color: C.textSecondary, fontSize: 13, marginTop: 2 },

  contactAction: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 13,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.border,
  },
  contactActionIcon: { fontSize: 16, width: 22, textAlign: 'center' },
  contactActionText: { flex: 1, color: C.primaryLight, fontSize: 14 },
  contactActionChevron: { color: C.textTertiary, fontSize: 18 },

  noContacts: {
    backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border,
    padding: 20, alignItems: 'center',
  },
  noContactsText: { color: C.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
