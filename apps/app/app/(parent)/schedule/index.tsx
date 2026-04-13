import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { EventCard } from '@gamehub/ui';
import { useSchedule } from '../../../src/hooks/useSchedule';
import { useChildren } from '../../../src/hooks/useChildren';
import type { Event } from '@gamehub/domain';

const C = {
  bg: '#0F172A',
  surface: '#1E293B',
  surfaceRaised: '#334155',
  border: '#334155',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  primary: '#3B82F6',
  primaryBg: '#1E3A8A',
  white: '#FFFFFF',
};

const SPORT_ICONS: Record<string, string> = {
  SOCCER: '⚽', BASKETBALL: '🏀', BASEBALL: '⚾', SOFTBALL: '🥎',
  LACROSSE: '🥍', HOCKEY: '🏒', FOOTBALL: '🏈', VOLLEYBALL: '🏐',
  TENNIS: '🎾', SWIMMING: '🏊', OTHER: '🏅',
};

type ViewMode = 'agenda' | 'week';

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
      {/* ── View toggle ───────────────────────────────────────────────── */}
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

      {/* ── Child chips ───────────────────────────────────────────────── */}
      {children.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          <TouchableOpacity
            style={[
              styles.chip,
              selectedChildIds.length === 0 && styles.chipActive,
            ]}
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

      {/* ── Sport filter ──────────────────────────────────────────────── */}
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
                <Text style={styles.sportChipIcon}>{SPORT_ICONS[sport] ?? '🏅'}</Text>
                <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                  {sport.charAt(0) + sport.slice(1).toLowerCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* ── Event list ────────────────────────────────────────────────── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
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
            <EventCard
              key={event.id}
              event={event}
              onPress={() => handleEventPress(event)}
              onRSVPPress={() => handleEventPress(event)}
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

  // Chips
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
  chipActive: {
    backgroundColor: C.primaryBg,
    borderColor: C.primary,
  },
  chipText: { color: C.textSecondary, fontSize: 13, fontWeight: '500' },
  chipTextActive: { color: C.white, fontWeight: '600' },
  sportChipIcon: { fontSize: 13 },

  // List
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 48 },
  center: { paddingVertical: 48, alignItems: 'center' },
  centerText: { color: C.textTertiary, fontSize: 14 },
  empty: { paddingVertical: 48, alignItems: 'center', gap: 10 },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { color: C.text, fontSize: 17, fontWeight: '700' },
  emptyDesc: {
    color: C.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
});
