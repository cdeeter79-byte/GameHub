import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, typography } from '@gamehub/config';
import { EventCard, EmptyState, SyncStatusIndicator, AdBanner } from '@gamehub/ui';
import { useAuth } from '../../src/hooks/useAuth';
import { useUpcomingEvents } from '../../src/hooks/useUpcomingEvents';
import { useEntitlements } from '../../src/hooks/useEntitlements';
import type { Event } from '@gamehub/domain';

export default function DashboardScreen() {
  const { user } = useAuth();
  const { events, isLoading, refresh, syncStatus, lastSyncAt } = useUpcomingEvents({ limit: 10 });
  const { isPremium } = useEntitlements();
  const [refreshing, setRefreshing] = useState(false);

  async function onRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  function handleEventPress(event: Event) {
    router.push(`/(parent)/schedule/${event.id}`);
  }

  function handleRSVPPress(event: Event) {
    router.push({ pathname: '/(parent)/schedule/[id]', params: { id: event.id, openRSVP: '1' } });
  }

  const greeting = user?.user_metadata?.['full_name']
    ? `Hey, ${(user.user_metadata['full_name'] as string).split(' ')[0]}!`
    : 'Welcome back!';

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary[400]}
        />
      }
    >
      {/* Header greeting */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.subtitle}>Here's what's coming up</Text>
        </View>
        <SyncStatusIndicator
          status={syncStatus}
          lastSyncAt={lastSyncAt}
          onRetry={refresh}
        />
      </View>

      {/* Ad banner — only for free tier, never for child profiles */}
      <AdBanner isVisible={!isPremium} placementId="dashboard_top" />

      {/* Upcoming events */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming Events</Text>

        {isLoading && events.length === 0 ? (
          <View style={styles.loadingPlaceholder}>
            <Text style={styles.loadingText}>Loading your schedule…</Text>
          </View>
        ) : events.length === 0 ? (
          <EmptyState
            icon="📅"
            title="No upcoming events"
            description="Connect a sports platform or add events manually to get started."
            action={{
              label: 'Connect a Platform',
              onPress: () => router.push('/(shared)/provider-connect/'),
            }}
          />
        ) : (
          <View style={styles.eventList}>
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onPress={() => handleEventPress(event)}
                onRSVPPress={() => handleRSVPPress(event)}
              />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.neutral[950],
  },
  content: {
    paddingBottom: spacing[8],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing[5],
    paddingBottom: spacing[3],
  },
  greeting: {
    color: colors.white,
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
  },
  subtitle: {
    color: colors.neutral[400],
    fontSize: typography.fontSize.sm,
    marginTop: spacing[1],
  },
  section: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
  },
  sectionTitle: {
    color: colors.neutral[300],
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing[3],
  },
  eventList: {
    gap: spacing[3],
  },
  loadingPlaceholder: {
    padding: spacing[8],
    alignItems: 'center',
  },
  loadingText: {
    color: colors.neutral[500],
    fontSize: typography.fontSize.sm,
  },
});
