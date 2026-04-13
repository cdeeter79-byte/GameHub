import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSchedule } from '../../../src/hooks/useSchedule';
import { useChildren } from '../../../src/hooks/useChildren';
import { RSVPStatus } from '@gamehub/domain';
import type { Event } from '@gamehub/domain';

const C = {
  bg: '#0F172A',
  surface: '#1E293B',
  surfaceRaised: '#253347',
  border: '#334155',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  primary: '#3B82F6',
  primaryBg: '#1E3A8A',
  primaryLight: '#60A5FA',
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

const EVENT_TYPE_LABELS: Record<string, string> = {
  GAME: 'Game', PRACTICE: 'Practice', TOURNAMENT: 'Tournament',
  TOURNAMENT_GAME: 'Tournament Game', MEETING: 'Meeting',
  VOLUNTEER: 'Volunteer', OTHER: 'Event',
};

const RSVP_CONFIG = {
  [RSVPStatus.ATTENDING]:     { label: 'Going',     color: C.accent,   bg: C.accentBg },
  [RSVPStatus.NOT_ATTENDING]: { label: 'Not Going', color: C.error,    bg: '#7F1D1D' },
  [RSVPStatus.MAYBE]:         { label: 'Maybe',     color: C.warning,  bg: C.warningBg },
  [RSVPStatus.PENDING]:       { label: 'RSVP',      color: C.textTertiary, bg: C.surface },
};

type ViewMode = 'agenda' | 'week';

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

// ─── Individual event card ────────────────────────────────────────────────────

function ScheduleCard({ event, onPress }: { event: Event; onPress: () => void }) {
  const sportIcon = event.sport ? (SPORT_ICONS[event.sport] ?? '🏅') : '🏅';
  const typeLabel = EVENT_TYPE_LABELS[event.type] ?? 'Event';
  const rsvp = event.rsvpStatus ?? RSVPStatus.PENDING;
  const rsvpCfg = RSVP_CONFIG[rsvp];

  return (
    <TouchableOpacity
      style={[styles.card, event.isCanceled && styles.cardCanceled]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`${event.title}, ${formatCardDate(event.startAt)}`}
    >
      {/* ── Canceled / Rescheduled banners ─────────────────────────── */}
      {event.isCanceled && (
        <View style={styles.cancelBanner}>
          <Text style={styles.cancelBannerText}>⛔  CANCELED</Text>
        </View>
      )}
      {!event.isCanceled && event.isRescheduled && (
        <View style={styles.reschedBanner}>
          <Text style={styles.reschedBannerText}>📅  RESCHEDULED</Text>
        </View>
      )}

      {/* ── Date / type row ────────────────────────────────────────── */}
      <View style={styles.dateRow}>
        <Text style={styles.dateText}>
          {formatCardDate(event.startAt)}  ·  {formatCardTime(event.startAt)}
        </Text>
        <View style={styles.typePill}>
          <Text style={styles.typePillIcon}>{sportIcon}</Text>
          <Text style={styles.typePillLabel}>{typeLabel}</Text>
        </View>
      </View>

      {/* ── Event title ────────────────────────────────────────────── */}
      <Text
        style={[styles.title, event.isCanceled && styles.titleCanceled]}
        numberOfLines={2}
      >
        {event.title}
      </Text>

      {/* ── Team ───────────────────────────────────────────────────── */}
      <Text style={styles.teamText} numberOfLines={1}>🏷  {event.teamName}</Text>

      {/* ── Location ───────────────────────────────────────────────── */}
      {event.location && (
        <Text style={styles.locationText} numberOfLines={1}>
          📍  {event.location.name}{event.location.city ? `, ${event.location.city}` : ''}
        </Text>
      )}

      {/* ── Divider ────────────────────────────────────────────────── */}
      <View style={styles.divider} />

      {/* ── RSVP + details row ─────────────────────────────────────── */}
      <View style={styles.footerRow}>
        <View style={[styles.rsvpPill, { backgroundColor: rsvpCfg.bg, borderColor: rsvpCfg.color }]}>
          <Text style={[styles.rsvpPillText, { color: rsvpCfg.color }]}>
            {rsvpCfg.label}
          </Text>
        </View>
        <Text style={styles.detailsLink}>View Details →</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ScheduleScreen() {
  const [view, setView] = useState<ViewMode>('agenda');
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([]);
  const { children } = useChildren();
  const { events, isLoading, sports, selectedSports, toggleSport } = useSchedule({
    childIds: selectedChildIds,
  });

  function toggleChild(id: string) {
    setSelectedChildIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  }

  function handleEventPress(event: Event) {
    router.push({ pathname: '/(parent)/schedule/[id]', params: { id: event.id } });
  }

  return (
    <View style={styles.root}>
      {/* ── View toggle ───────────────────────────────────────────── */}
      <View style={styles.viewRow}>
        {(['agenda', 'week'] as ViewMode[]).map((v) => (
          <TouchableOpacity
            key={v}
            style={[styles.viewTab, view === v && styles.viewTabActive]}
            onPress={() => setView(v)}
            accessibilityRole="tab"
            accessibilityState={{ selected: view === v }}
          >
            <Text style={[styles.viewTabText, view === v && styles.viewTabTextActive]}>
              {v === 'agenda' ? 'Agenda' : 'Week'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Child filter chips ────────────────────────────────────── */}
      {children.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          <TouchableOpacity
            style={[styles.chip, selectedChildIds.length === 0 && styles.chipActive]}
            onPress={() => setSelectedChildIds([])}
            accessibilityRole="button"
            accessibilityLabel="All kids"
          >
            <Text style={[styles.chipText, selectedChildIds.length === 0 && styles.chipTextActive]}>
              All Kids
            </Text>
          </TouchableOpacity>
          {children.map((child) => {
            const isSelected = selectedChildIds.includes(child.id);
            return (
              <TouchableOpacity
                key={child.id}
                style={[styles.chip, isSelected && styles.chipActive]}
                onPress={() => toggleChild(child.id)}
                accessibilityRole="button"
                accessibilityLabel={child.firstName}
                accessibilityState={{ selected: isSelected }}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                  {child.firstName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* ── Sport filter chips ────────────────────────────────────── */}
      {sports.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          <TouchableOpacity
            style={[styles.chip, selectedSports.length === 0 && styles.chipActive]}
            onPress={() => toggleSport(null)}
            accessibilityRole="button"
            accessibilityLabel="All sports"
          >
            <Text style={[styles.chipText, selectedSports.length === 0 && styles.chipTextActive]}>
              All Sports
            </Text>
          </TouchableOpacity>
          {sports.map((sport) => {
            const isSelected = selectedSports.includes(sport);
            return (
              <TouchableOpacity
                key={sport}
                style={[styles.chip, isSelected && styles.chipActive]}
                onPress={() => toggleSport(sport)}
                accessibilityRole="button"
                accessibilityLabel={sport.toLowerCase()}
                accessibilityState={{ selected: isSelected }}
              >
                <Text style={styles.sportIcon}>{SPORT_ICONS[sport] ?? '🏅'}</Text>
                <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                  {sport.charAt(0) + sport.slice(1).toLowerCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* ── Event list ────────────────────────────────────────────── */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {isLoading ? (
          <View style={styles.center}>
            <Text style={styles.centerText}>Loading your schedule…</Text>
          </View>
        ) : events.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📅</Text>
            <Text style={styles.emptyTitle}>No events found</Text>
            <Text style={styles.emptyDesc}>
              Try adjusting your filters, or connect more sports platforms.
            </Text>
          </View>
        ) : (
          events.map((event) => (
            <ScheduleCard
              key={event.id}
              event={event}
              onPress={() => handleEventPress(event)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // View toggle
  viewRow: {
    flexDirection: 'row',
    margin: 16,
    marginBottom: 8,
    backgroundColor: C.surface,
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: C.border,
  },
  viewTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  viewTabActive: { backgroundColor: C.primary },
  viewTabText: { color: C.textTertiary, fontSize: 14, fontWeight: '500' },
  viewTabTextActive: { color: C.white, fontWeight: '600' },

  // Filter chips
  filterScroll: { maxHeight: 44 },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  chipActive: { backgroundColor: C.primaryBg, borderColor: C.primary },
  chipText: { color: C.textSecondary, fontSize: 13, fontWeight: '500' },
  chipTextActive: { color: C.white, fontWeight: '600' },
  sportIcon: { fontSize: 13 },

  // List
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 48, gap: 12 },
  center: { paddingVertical: 48, alignItems: 'center' },
  centerText: { color: C.textTertiary, fontSize: 14 },
  empty: { paddingVertical: 48, alignItems: 'center', gap: 10 },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { color: C.text, fontSize: 17, fontWeight: '700' },
  emptyDesc: {
    color: C.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 20, maxWidth: 280,
  },

  // ── Schedule card ──────────────────────────────────────────────────────────
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    gap: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 6,
      },
      android: { elevation: 3 },
    }),
  },
  cardCanceled: { opacity: 0.55 },

  cancelBanner: {
    backgroundColor: '#7F1D1D',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  cancelBannerText: { color: '#FCA5A5', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  reschedBanner: {
    backgroundColor: C.warningBg,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  reschedBannerText: { color: '#FCD34D', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },

  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  dateText: {
    color: C.primaryLight,
    fontSize: 13,
    fontWeight: '600',
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.surfaceRaised,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  typePillIcon: { fontSize: 11 },
  typePillLabel: { color: C.textSecondary, fontSize: 11, fontWeight: '600' },

  title: {
    color: C.text,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  titleCanceled: { textDecorationLine: 'line-through', color: C.textSecondary },

  teamText: { color: C.textSecondary, fontSize: 13 },
  locationText: { color: C.textSecondary, fontSize: 13, marginTop: 2 },

  divider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 10,
  },

  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rsvpPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  rsvpPillText: { fontSize: 12, fontWeight: '700' },
  detailsLink: {
    color: C.primaryLight,
    fontSize: 13,
    fontWeight: '600',
  },
});
