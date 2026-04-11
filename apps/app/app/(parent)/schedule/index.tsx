import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, typography, radii } from '@gamehub/config';
import { EventCard, ChildSelector, SportFilterBar, EmptyState } from '@gamehub/ui';
import { useSchedule } from '../../../src/hooks/useSchedule';
import { useChildren } from '../../../src/hooks/useChildren';
import type { Event } from '@gamehub/domain';

type ViewMode = 'agenda' | 'week' | 'month';

const VIEW_LABELS: Record<ViewMode, string> = {
  agenda: 'Agenda',
  week: 'Week',
  month: 'Month',
};

export default function ScheduleScreen() {
  const [view, setView] = useState<ViewMode>('agenda');
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([]);
  const { children } = useChildren();
  const { events, isLoading, sports, selectedSports, toggleSport } = useSchedule({ childIds: selectedChildIds });

  function toggleChild(id: string) {
    setSelectedChildIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  }

  function handleEventPress(event: Event) {
    router.push({ pathname: '/(parent)/schedule/[id]', params: { id: event.id } });
  }

  return (
    <View style={styles.container}>
      {/* View mode toggle */}
      <View style={styles.viewToggle}>
        {(Object.keys(VIEW_LABELS) as ViewMode[]).map((v) => (
          <TouchableOpacity
            key={v}
            style={[styles.viewTab, view === v && styles.viewTabActive]}
            onPress={() => setView(v)}
            accessibilityRole="tab"
            accessibilityState={{ selected: view === v }}
            accessibilityLabel={`${VIEW_LABELS[v]} view`}
          >
            <Text style={[styles.viewTabText, view === v && styles.viewTabTextActive]}>
              {VIEW_LABELS[v]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Child filter */}
      {children.length > 0 ? (
        <ChildSelector
          children={children}
          selectedIds={selectedChildIds}
          onToggle={toggleChild}
          allowAll
        />
      ) : null}

      {/* Sport filter */}
      <SportFilterBar
        sports={sports}
        selectedSports={selectedSports}
        onToggle={(s) => toggleSport(s === 'all' ? null : s)}
      />

      {/* Event list */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {isLoading ? (
          <View style={styles.center}>
            <Text style={styles.loadingText}>Loading…</Text>
          </View>
        ) : events.length === 0 ? (
          <EmptyState
            icon="📅"
            title="No events found"
            description="Try adjusting your filters or connect more platforms."
          />
        ) : (
          <View style={styles.list}>
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onPress={() => handleEventPress(event)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[950],
  },
  viewToggle: {
    flexDirection: 'row',
    margin: spacing[4],
    backgroundColor: colors.neutral[900],
    borderRadius: radii.lg,
    padding: spacing[1],
  },
  viewTab: {
    flex: 1,
    paddingVertical: spacing[2],
    alignItems: 'center',
    borderRadius: radii.md,
  },
  viewTabActive: {
    backgroundColor: colors.primary[600],
  },
  viewTabText: {
    color: colors.neutral[400],
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  viewTabTextActive: {
    color: colors.white,
    fontWeight: typography.fontWeight.semibold,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[4],
    paddingBottom: spacing[8],
  },
  list: {
    gap: spacing[3],
  },
  center: {
    padding: spacing[8],
    alignItems: 'center',
  },
  loadingText: {
    color: colors.neutral[500],
    fontSize: typography.fontSize.sm,
  },
});
