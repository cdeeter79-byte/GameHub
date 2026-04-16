import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useChildren } from '../../../src/hooks/useChildren';
import { useSchedule } from '../../../src/hooks/useSchedule';
import { RSVPStatus } from '@gamehub/domain';
import { supabase } from '@gamehub/domain';
import type { Event } from '@gamehub/domain';

const C = {
  bg: '#0F172A',
  surface: '#1E293B',
  border: '#334155',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  primary: '#3B82F6',
  primaryLight: '#60A5FA',
  primaryBg: '#1E3A8A',
  accent: '#10B981',
  accentBg: '#064E3B',
  warning: '#F59E0B',
  warningBg: '#78350F',
  error: '#EF4444',
  white: '#FFFFFF',
};

const SPORT_ICONS: Record<string, string> = {
  SOCCER: '⚽', BASKETBALL: '🏀', BASEBALL: '⚾', SOFTBALL: '🥎',
  LACROSSE: '🥍', HOCKEY: '🏒', FOOTBALL: '🏈', VOLLEYBALL: '🏐',
  TENNIS: '🎾', SWIMMING: '🏊', OTHER: '🏅',
};

const AGE_BAND_LABELS: Record<string, string> = {
  UNDER_13: 'Under 13',
  TEEN_13_17: '13–17',
  ADULT_18_PLUS: '18+',
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  GAME: 'Game', PRACTICE: 'Practice', TOURNAMENT: 'Tournament',
  TOURNAMENT_GAME: 'Tournament Game', MEETING: 'Meeting',
  VOLUNTEER: 'Volunteer', OTHER: 'Event',
};

const RSVP_CONFIG = {
  [RSVPStatus.ATTENDING]:     { label: 'Going',     color: C.accent,       bg: C.accentBg },
  [RSVPStatus.NOT_ATTENDING]: { label: 'Not Going', color: C.error,        bg: '#7F1D1D' },
  [RSVPStatus.MAYBE]:         { label: 'Maybe',     color: C.warning,      bg: C.warningBg },
  [RSVPStatus.PENDING]:       { label: 'RSVP',      color: C.textTertiary, bg: C.surface },
};

function formatCardDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}

function formatCardTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

function EventRow({ event }: { event: Event }) {
  const sportIcon = event.sport ? (SPORT_ICONS[event.sport] ?? '🏅') : '🏅';
  const typeLabel = EVENT_TYPE_LABELS[event.type] ?? 'Event';
  const rsvp = event.rsvpStatus ?? RSVPStatus.PENDING;
  const rsvpCfg = RSVP_CONFIG[rsvp];

  return (
    <TouchableOpacity
      style={styles.eventRow}
      onPress={() => router.push({ pathname: '/(parent)/schedule/[id]', params: { id: event.id } })}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={event.title}
    >
      <Text style={styles.eventIcon}>{sportIcon}</Text>
      <View style={styles.eventInfo}>
        <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
        <Text style={styles.eventMeta}>
          {typeLabel}  ·  {formatCardDate(event.startAt)}  {formatCardTime(event.startAt)}
        </Text>
        {event.location && (
          <Text style={styles.eventLocation} numberOfLines={1}>
            📍 {event.location.name}
          </Text>
        )}
      </View>
      <View style={[styles.rsvpPill, { backgroundColor: rsvpCfg.bg, borderColor: rsvpCfg.color }]}>
        <Text style={[styles.rsvpPillText, { color: rsvpCfg.color }]}>{rsvpCfg.label}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function ChildDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { children, isLoading: childLoading } = useChildren();
  const { events, isLoading: eventsLoading } = useSchedule({ childIds: id ? [id] : [] });

  async function handleDelete() {
    Alert.alert(
      'Remove Child',
      `Are you sure you want to remove ${child?.firstName} from your account? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('child_profiles').delete().eq('id', id);
            if (error) {
              Alert.alert('Error', 'Could not remove child. Please try again.');
            } else {
              router.back();
            }
          },
        },
      ],
    );
  }

  const child = children.find((c) => c.id === id);

  if (childLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={C.primary} size="large" />
      </View>
    );
  }

  if (!child) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFoundEmoji}>👤</Text>
        <Text style={styles.notFoundTitle}>Child not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} accessibilityRole="button">
          <Text style={styles.backBtnText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const initials = `${child.firstName[0] ?? ''}${child.lastName[0] ?? ''}`.toUpperCase();
  const sportIcon = child.sport ? (SPORT_ICONS[child.sport] ?? '🏅') : null;
  const sportLabel = child.sport
    ? child.sport.charAt(0) + child.sport.slice(1).toLowerCase()
    : 'No sport set';
  const ageLabel = AGE_BAND_LABELS[child.ageBand] ?? child.ageBand;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* ── Identity ── */}
      <View style={styles.identity}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{child.firstName} {child.lastName}</Text>
        <View style={styles.tags}>
          {sportIcon && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{sportIcon} {sportLabel}</Text>
            </View>
          )}
          <View style={styles.tag}>
            <Text style={styles.tagText}>🎂 {ageLabel}</Text>
          </View>
        </View>
      </View>

      {/* ── Upcoming events ── */}
      <Text style={styles.sectionLabel}>UPCOMING EVENTS</Text>
      <View style={styles.eventsCard}>
        {eventsLoading ? (
          <View style={styles.eventsLoading}>
            <ActivityIndicator color={C.primary} size="small" />
            <Text style={styles.eventsLoadingText}>Loading events…</Text>
          </View>
        ) : events.length === 0 ? (
          <View style={styles.eventsEmpty}>
            <Text style={styles.eventsEmptyText}>No upcoming events for {child.firstName}</Text>
          </View>
        ) : (
          events.map((event, i) => (
            <View key={event.id}>
              {i > 0 && <View style={styles.separator} />}
              <EventRow event={event} />
            </View>
          ))
        )}
      </View>

      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={handleDelete}
        accessibilityRole="button"
        accessibilityLabel={`Remove ${child.firstName}`}
      >
        <Text style={styles.deleteBtnText}>Remove Child</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: C.bg },
  content: { paddingBottom: 80 },
  centered: {
    flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24,
  },
  notFoundEmoji: { fontSize: 48 },
  notFoundTitle: { color: C.text, fontSize: 18, fontWeight: '700' },
  backBtn: {
    backgroundColor: C.surface, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 20,
    borderWidth: 1, borderColor: C.border,
  },
  backBtnText: { color: C.primary, fontSize: 15, fontWeight: '600' },

  identity: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 24, gap: 8 },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: C.primaryBg,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  avatarText: { color: C.primaryLight, fontSize: 28, fontWeight: '700' },
  name: { color: C.text, fontSize: 22, fontWeight: '800' },
  tags: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 },
  tag: {
    backgroundColor: C.surface, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: C.border,
  },
  tagText: { color: C.textSecondary, fontSize: 13, fontWeight: '500' },

  sectionLabel: {
    color: C.textTertiary, fontSize: 11, fontWeight: '700', letterSpacing: 1,
    marginHorizontal: 16, marginBottom: 8,
  },
  eventsCard: {
    marginHorizontal: 16, backgroundColor: C.surface, borderRadius: 14,
    borderWidth: 1, borderColor: C.border, overflow: 'hidden',
  },
  eventsLoading: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 20 },
  eventsLoadingText: { color: C.textTertiary, fontSize: 14 },
  eventsEmpty: { padding: 24, alignItems: 'center' },
  eventsEmptyText: { color: C.textTertiary, fontSize: 14 },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: C.border, marginLeft: 56 },

  eventRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  eventIcon: { fontSize: 22, lineHeight: 28 },
  eventInfo: { flex: 1, gap: 2 },
  eventTitle: { color: C.text, fontSize: 15, fontWeight: '600' },
  eventMeta: { color: C.textSecondary, fontSize: 12 },
  eventLocation: { color: C.textTertiary, fontSize: 12 },
  rsvpPill: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1,
  },
  rsvpPillText: { fontSize: 11, fontWeight: '700' },

  deleteBtn: {
    marginHorizontal: 16, marginTop: 32, marginBottom: 16,
    paddingVertical: 14, borderRadius: 12,
    borderWidth: 1, borderColor: '#EF4444',
    alignItems: 'center',
  },
  deleteBtnText: { color: '#EF4444', fontSize: 15, fontWeight: '600' },
});
