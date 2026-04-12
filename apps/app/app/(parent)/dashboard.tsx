import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, typography, radii } from '@gamehub/config';
import { EventCard, EmptyState, SyncStatusIndicator } from '@gamehub/ui';
import { useAuth } from '../../src/hooks/useAuth';
import { useUpcomingEvents } from '../../src/hooks/useUpcomingEvents';
import { useEntitlements } from '../../src/hooks/useEntitlements';
import type { Event } from '@gamehub/domain';

// Demo events shown to guests so they can explore the UI
const DEMO_EVENTS: Event[] = [
  {
    id: 'demo-1',
    title: 'Soccer Game vs. Riverside FC',
    sport: 'soccer',
    startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString(),
    eventType: 'game',
    location: { name: 'Riverside Park Field 3', address: '123 Park Ave' },
    teamId: 'demo-team-1',
    teamName: 'U12 Lightning',
    providerId: 'teamsnap',
    externalId: 'demo-1',
    syncStatus: 'synced',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-2',
    title: 'Soccer Practice',
    sport: 'soccer',
    startTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
    eventType: 'practice',
    location: { name: 'Community Center Field', address: '456 Main St' },
    teamId: 'demo-team-1',
    teamName: 'U12 Lightning',
    providerId: 'teamsnap',
    externalId: 'demo-2',
    syncStatus: 'synced',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-3',
    title: 'Hockey Game vs. Eagles',
    sport: 'hockey',
    startTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 75 * 60 * 1000).toISOString(),
    eventType: 'game',
    location: { name: 'Ice Arena Rink 2', address: '789 Ice Way' },
    teamId: 'demo-team-2',
    teamName: 'Peewee Sharks',
    providerId: 'sportsengine',
    externalId: 'demo-3',
    syncStatus: 'synced',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function DashboardScreen() {
  const { user, session } = useAuth();
  const isGuest = !session;

  const { events: liveEvents, isLoading, refresh, syncStatus, lastSyncAt } = useUpcomingEvents({
    limit: 10,
    skip: isGuest,
  });
  const { isPremium } = useEntitlements();
  const [refreshing, setRefreshing] = useState(false);

  const events = isGuest ? DEMO_EVENTS : liveEvents;

  async function onRefresh() {
    if (isGuest) return;
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  function handleEventPress(_event: Event) {
    if (isGuest) {
      router.push('/(auth)/login');
      return;
    }
    router.push(`/(parent)/schedule/${_event.id}`);
  }

  const greeting = user?.user_metadata?.['full_name']
    ? `Hey, ${(user.user_metadata['full_name'] as string).split(' ')[0]}!`
    : isGuest
      ? 'Welcome to GameHub!'
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
      {/* Guest banner */}
      {isGuest && (
        <TouchableOpacity
          style={styles.guestBanner}
          onPress={() => router.push('/(auth)/login')}
          accessibilityRole="button"
          accessibilityLabel="Sign in to connect your real schedules"
        >
          <View style={styles.guestBannerInner}>
            <Text style={styles.guestBannerTitle}>You're browsing with sample data</Text>
            <Text style={styles.guestBannerSub}>
              Sign in to connect TeamSnap, SportsEngine, and more →
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.subtitle}>
            {isGuest ? '3 upcoming events (demo)' : "Here's what's coming up"}
          </Text>
        </View>
        {!isGuest && (
          <SyncStatusIndicator
            status={syncStatus}
            lastSyncAt={lastSyncAt}
            onRetry={refresh}
          />
        )}
      </View>

      {/* Upcoming events */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming Events</Text>

        {!isGuest && isLoading && liveEvents.length === 0 ? (
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
                onRSVPPress={() => handleEventPress(event)}
              />
            ))}
          </View>
        )}
      </View>

      {/* Guest CTA at bottom */}
      {isGuest && (
        <View style={styles.guestCTA}>
          <Text style={styles.guestCTATitle}>Ready to connect your real schedules?</Text>
          <TouchableOpacity
            style={styles.guestCTAButton}
            onPress={() => router.push('/(auth)/login')}
            accessibilityRole="button"
          >
            <Text style={styles.guestCTAButtonText}>Create Free Account</Text>
          </TouchableOpacity>
          <Text style={styles.guestCTANote}>
            Supports TeamSnap, SportsEngine, iCalendar feeds, and more
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  content: {
    paddingBottom: spacing[12],
  },
  guestBanner: {
    backgroundColor: colors.primary[900],
    borderBottomWidth: 1,
    borderBottomColor: colors.primary[800],
    padding: spacing[4],
  },
  guestBannerInner: {
    gap: spacing[1],
  },
  guestBannerTitle: {
    color: colors.primary[200],
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold as '600',
  },
  guestBannerSub: {
    color: colors.primary[400],
    fontSize: typography.fontSize.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing[5],
    paddingBottom: spacing[3],
  },
  greeting: {
    color: colors.dark.text,
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold as '700',
  },
  subtitle: {
    color: colors.dark.textSecondary,
    fontSize: typography.fontSize.sm,
    marginTop: spacing[1],
  },
  section: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
  },
  sectionTitle: {
    color: colors.dark.textSecondary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold as '600',
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
    color: colors.dark.textTertiary,
    fontSize: typography.fontSize.sm,
  },
  guestCTA: {
    margin: spacing[4],
    marginTop: spacing[8],
    backgroundColor: colors.dark.surface,
    borderRadius: radii.xl,
    padding: spacing[6],
    alignItems: 'center',
    gap: spacing[3],
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  guestCTATitle: {
    color: colors.dark.text,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold as '700',
    textAlign: 'center',
  },
  guestCTAButton: {
    backgroundColor: colors.primary[600],
    borderRadius: radii.lg,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[8],
  },
  guestCTAButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold as '600',
  },
  guestCTANote: {
    color: colors.dark.textTertiary,
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
  },
});
