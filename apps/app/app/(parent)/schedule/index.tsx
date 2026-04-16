import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSchedule } from '../../../src/hooks/useSchedule';
import { useChildren } from '../../../src/hooks/useChildren';
import { useRSVP } from '../../../src/hooks/useRSVP';
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

type ViewMode = 'agenda' | 'month';

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

// ─── RSVP buttons ─────────────────────────────────────────────────────────────

const RSVP_BUTTONS: { status: RSVPStatus; label: string; emoji: string }[] = [
  { status: RSVPStatus.ATTENDING,     label: 'Going',     emoji: '✅' },
  { status: RSVPStatus.MAYBE,         label: 'Maybe',     emoji: '🤔' },
  { status: RSVPStatus.NOT_ATTENDING, label: 'Not Going', emoji: '❌' },
];

// ─── Schedule card ─────────────────────────────────────────────────────────────

function ScheduleCard({
  event,
  onPress,
  rsvpOverride,
  onRSVP,
  rsvpLoading,
}: {
  event: Event;
  onPress: () => void;
  rsvpOverride?: RSVPStatus;
  onRSVP: (status: RSVPStatus) => void;
  rsvpLoading: boolean;
}) {
  const sportIcon = event.sport ? (SPORT_ICONS[event.sport] ?? '🏅') : '🏅';
  const typeLabel = EVENT_TYPE_LABELS[event.type] ?? 'Event';
  const rsvp = rsvpOverride ?? event.rsvpStatus ?? RSVPStatus.PENDING;
  const rsvpCfg = RSVP_CONFIG[rsvp];

  return (
    <TouchableOpacity
      style={[styles.card, event.isCanceled && styles.cardCanceled]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`${event.title}, ${formatCardDate(event.startAt)}`}
    >
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

      <View style={styles.dateRow}>
        <Text style={styles.dateText}>
          {formatCardDate(event.startAt)}  ·  {formatCardTime(event.startAt)}
        </Text>
        <View style={styles.typePill}>
          <Text style={styles.typePillIcon}>{sportIcon}</Text>
          <Text style={styles.typePillLabel}>{typeLabel}</Text>
        </View>
      </View>

      <Text
        style={[styles.title, event.isCanceled && styles.titleCanceled]}
        numberOfLines={2}
      >
        {event.title}
      </Text>

      <Text style={styles.teamText} numberOfLines={1}>🏷  {event.teamName}</Text>

      {event.location && (
        <Text style={styles.locationText} numberOfLines={1}>
          📍  {event.location.name}{event.location.city ? `, ${event.location.city}` : ''}
        </Text>
      )}

      <View style={styles.divider} />

      {!event.isCanceled && (
        <View style={styles.rsvpRow}>
          {RSVP_BUTTONS.map((btn) => {
            const isSelected = rsvp === btn.status;
            const cfg = RSVP_CONFIG[btn.status];
            return (
              <TouchableOpacity
                key={btn.status}
                style={[
                  styles.rsvpBtn,
                  { borderColor: cfg.color },
                  isSelected && { backgroundColor: cfg.bg },
                ]}
                onPress={(e) => { e.stopPropagation?.(); onRSVP(btn.status); }}
                disabled={rsvpLoading}
                accessibilityRole="button"
                accessibilityLabel={`RSVP ${btn.label}`}
                accessibilityState={{ selected: isSelected }}
              >
                {rsvpLoading && isSelected ? (
                  <ActivityIndicator size="small" color={cfg.color} />
                ) : (
                  <>
                    <Text style={styles.rsvpBtnEmoji}>{btn.emoji}</Text>
                    <Text style={[styles.rsvpBtnLabel, { color: cfg.color }]}>{btn.label}</Text>
                  </>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <Text style={styles.detailsLink}>View Details →</Text>
    </TouchableOpacity>
  );
}

// ─── Month calendar ────────────────────────────────────────────────────────────

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function MonthCalendar({
  events,
  onEventPress,
  rsvpOverrides,
  onRSVP,
  loadingEventId,
}: {
  events: Event[];
  onEventPress: (e: Event) => void;
  rsvpOverrides: Record<string, RSVPStatus>;
  onRSVP: (event: Event, status: RSVPStatus) => void;
  loadingEventId: string | null;
}) {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<number | null>(() => new Date().getDate());

  const year = month.getFullYear();
  const monthIdx = month.getMonth();

  const firstWeekday = new Date(year, monthIdx, 1).getDay();
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() === monthIdx;

  // Group events by day
  const eventsByDay = new Map<number, Event[]>();
  for (const event of events) {
    const d = new Date(event.startAt);
    if (d.getFullYear() === year && d.getMonth() === monthIdx) {
      const day = d.getDate();
      if (!eventsByDay.has(day)) eventsByDay.set(day, []);
      eventsByDay.get(day)!.push(event);
    }
  }

  const selectedDayEvents = selectedDay ? (eventsByDay.get(selectedDay) ?? []) : [];

  const monthLabel = month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  function prevMonth() {
    setMonth(new Date(year, monthIdx - 1, 1));
    setSelectedDay(null);
  }
  function nextMonth() {
    setMonth(new Date(year, monthIdx + 1, 1));
    setSelectedDay(null);
  }

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return (
    <>
      {/* Month navigation */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={prevMonth} style={styles.monthNavBtn} accessibilityRole="button" accessibilityLabel="Previous month">
          <Text style={styles.monthNavArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthNavTitle}>{monthLabel}</Text>
        <TouchableOpacity onPress={nextMonth} style={styles.monthNavBtn} accessibilityRole="button" accessibilityLabel="Next month">
          <Text style={styles.monthNavArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Day-of-week headers */}
      <View style={styles.calWeekRow}>
        {DAY_LABELS.map((d) => (
          <View key={d} style={styles.calDayHeader}>
            <Text style={styles.calDayHeaderText}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.calGrid}>
        {weeks.map((week, wi) => (
          <View key={wi} style={styles.calWeekRow}>
            {week.map((day, di) => {
              if (day === null) {
                return <View key={`e-${wi}-${di}`} style={styles.calCell} />;
              }
              const dayEvents = eventsByDay.get(day) ?? [];
              const isToday = isCurrentMonth && today.getDate() === day;
              const isSelected = selectedDay === day;
              const hasGame = dayEvents.some((e) => e.type === 'GAME' || e.type === 'TOURNAMENT_GAME');
              const hasPractice = dayEvents.some((e) => e.type === 'PRACTICE');

              return (
                <TouchableOpacity
                  key={day}
                  style={styles.calCell}
                  onPress={() => setSelectedDay(isSelected ? null : day)}
                  accessibilityRole="button"
                  accessibilityLabel={`${day}${dayEvents.length > 0 ? `, ${dayEvents.length} event${dayEvents.length > 1 ? 's' : ''}` : ''}`}
                >
                  <View style={[
                    styles.calDayNumWrap,
                    isToday && styles.calDayNumToday,
                    isSelected && !isToday && styles.calDayNumSelected,
                  ]}>
                    <Text style={[
                      styles.calDayNum,
                      isToday && styles.calDayNumTextToday,
                      isSelected && !isToday && styles.calDayNumTextSelected,
                    ]}>
                      {day}
                    </Text>
                  </View>
                  {/* Event indicator dots */}
                  {dayEvents.length > 0 && (
                    <View style={styles.calDots}>
                      {hasGame && <View style={[styles.calDot, { backgroundColor: C.primary }]} />}
                      {hasPractice && <View style={[styles.calDot, { backgroundColor: C.accent }]} />}
                      {!hasGame && !hasPractice && <View style={[styles.calDot, { backgroundColor: C.warning }]} />}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* Legend */}
      <View style={styles.calLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: C.primary }]} />
          <Text style={styles.legendText}>Game</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: C.accent }]} />
          <Text style={styles.legendText}>Practice</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: C.warning }]} />
          <Text style={styles.legendText}>Other</Text>
        </View>
      </View>

      {/* Selected day events */}
      {selectedDay !== null && (
        <View style={styles.selectedDaySection}>
          <Text style={styles.selectedDayTitle}>
            {new Date(year, monthIdx, selectedDay).toLocaleDateString('en-US', {
              weekday: 'long', month: 'long', day: 'numeric',
            })}
          </Text>
          {selectedDayEvents.length === 0 ? (
            <View style={styles.noDayEvents}>
              <Text style={styles.noDayEventsText}>No events on this day</Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {selectedDayEvents.map((event) => (
                <ScheduleCard
                  key={event.id}
                  event={event}
                  onPress={() => onEventPress(event)}
                  rsvpOverride={rsvpOverrides[event.id]}
                  onRSVP={(status) => onRSVP(event, status)}
                  rsvpLoading={loadingEventId === event.id}
                />
              ))}
            </View>
          )}
        </View>
      )}
    </>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ScheduleScreen() {
  const [view, setView] = useState<ViewMode>('agenda');
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([]);
  const [rsvpOverrides, setRsvpOverrides] = useState<Record<string, RSVPStatus>>({});
  const { children } = useChildren();
  const { events, isLoading, sports, selectedSports, toggleSport } = useSchedule({
    childIds: selectedChildIds,
  });
  const { updateRSVP, loadingEventId } = useRSVP();

  function toggleChild(id: string) {
    setSelectedChildIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  }

  function handleEventPress(event: Event) {
    router.push({ pathname: '/(parent)/schedule/[id]', params: { id: event.id } });
  }

  async function handleRSVP(event: Event, status: RSVPStatus) {
    setRsvpOverrides((prev) => ({ ...prev, [event.id]: status }));
    const ok = await updateRSVP(event.id, status, {
      childProfileId: event.childProfileId,
      providerId: event.providerId,
    });
    if (!ok) {
      setRsvpOverrides((prev) => {
        const next = { ...prev };
        delete next[event.id];
        return next;
      });
    }
  }

  return (
    <View style={styles.root}>
      {/* ── View toggle ───────────────────────────────────────────── */}
      <View style={styles.viewRow}>
        {([
          { key: 'agenda', label: 'Week at a Glance' },
          { key: 'month',  label: 'Month' },
        ] as { key: ViewMode; label: string }[]).map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[styles.viewTab, view === key && styles.viewTabActive]}
            onPress={() => setView(key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: view === key }}
          >
            <Text style={[styles.viewTabText, view === key && styles.viewTabTextActive]}>
              {label}
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

      {/* ── Content ───────────────────────────────────────────────── */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {isLoading ? (
          <View style={styles.center}>
            <Text style={styles.centerText}>Loading your schedule…</Text>
          </View>
        ) : view === 'agenda' ? (
          // ── Agenda (Week at a Glance) ──
          events.length === 0 ? (
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
                rsvpOverride={rsvpOverrides[event.id]}
                onRSVP={(status) => handleRSVP(event, status)}
                rsvpLoading={loadingEventId === event.id}
              />
            ))
          )
        ) : (
          // ── Month calendar ──
          <MonthCalendar
            events={events}
            onEventPress={handleEventPress}
            rsvpOverrides={rsvpOverrides}
            onRSVP={handleRSVP}
            loadingEventId={loadingEventId}
          />
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
  scrollContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100, gap: 12 },
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
    backgroundColor: '#7F1D1D', borderRadius: 6, paddingVertical: 4,
    paddingHorizontal: 10, alignSelf: 'flex-start', marginBottom: 4,
  },
  cancelBannerText: { color: '#FCA5A5', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  reschedBanner: {
    backgroundColor: C.warningBg, borderRadius: 6, paddingVertical: 4,
    paddingHorizontal: 10, alignSelf: 'flex-start', marginBottom: 4,
  },
  reschedBannerText: { color: '#FCD34D', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },

  dateRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2,
  },
  dateText: { color: C.primaryLight, fontSize: 13, fontWeight: '600' },
  typePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.surfaceRaised, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3,
  },
  typePillIcon: { fontSize: 11 },
  typePillLabel: { color: C.textSecondary, fontSize: 11, fontWeight: '600' },

  title: { color: C.text, fontSize: 18, fontWeight: '700', lineHeight: 24, letterSpacing: -0.2 },
  titleCanceled: { textDecorationLine: 'line-through', color: C.textSecondary },
  teamText: { color: C.textSecondary, fontSize: 13 },
  locationText: { color: C.textSecondary, fontSize: 13, marginTop: 2 },

  divider: { height: 1, backgroundColor: C.border, marginVertical: 10 },

  rsvpRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  rsvpBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: 7, borderRadius: 10, borderWidth: 1.5, backgroundColor: 'transparent',
  },
  rsvpBtnEmoji: { fontSize: 13 },
  rsvpBtnLabel: { fontSize: 12, fontWeight: '600' },
  detailsLink: {
    color: C.primaryLight, fontSize: 13, fontWeight: '600', textAlign: 'right', marginTop: 4,
  },

  // ── Month calendar ─────────────────────────────────────────────────────────
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    marginBottom: 4,
  },
  monthNavBtn: { padding: 8 },
  monthNavArrow: { color: C.primaryLight, fontSize: 26, fontWeight: '300', lineHeight: 30 },
  monthNavTitle: { color: C.text, fontSize: 17, fontWeight: '700' },

  calGrid: { gap: 0 },
  calWeekRow: { flexDirection: 'row' },
  calDayHeader: { flex: 1, alignItems: 'center', paddingBottom: 6 },
  calDayHeaderText: { color: C.textTertiary, fontSize: 11, fontWeight: '600' },

  calCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    minHeight: 52,
    gap: 2,
  },
  calDayNumWrap: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  calDayNumToday: { backgroundColor: C.primary },
  calDayNumSelected: { backgroundColor: C.primaryBg, borderWidth: 1, borderColor: C.primary },
  calDayNum: { color: C.textSecondary, fontSize: 14, fontWeight: '500' },
  calDayNumTextToday: { color: C.white, fontWeight: '700' },
  calDayNumTextSelected: { color: C.primaryLight, fontWeight: '700' },

  calDots: { flexDirection: 'row', gap: 3, marginTop: 1 },
  calDot: { width: 5, height: 5, borderRadius: 3 },

  calLegend: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
    paddingVertical: 10,
    marginBottom: 4,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: C.textTertiary, fontSize: 11 },

  selectedDaySection: { marginTop: 8, gap: 12 },
  selectedDayTitle: {
    color: C.text, fontSize: 15, fontWeight: '700',
    paddingVertical: 6,
    borderTopWidth: 1, borderTopColor: C.border,
    paddingTop: 12,
  },
  noDayEvents: { paddingVertical: 20, alignItems: 'center' },
  noDayEventsText: { color: C.textTertiary, fontSize: 14 },
});
