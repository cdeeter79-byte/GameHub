import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { EventCard, SyncStatusIndicator } from '@gamehub/ui';
import { EventType, Sport, SyncStatus, RSVPStatus } from '@gamehub/domain';
import type { Event } from '@gamehub/domain';
import { useAuth } from '../../src/hooks/useAuth';
import { useUpcomingEvents } from '../../src/hooks/useUpcomingEvents';

// Hard-coded palette — same approach as login for reliable rendering
const C = {
  bg: '#0F172A',
  surface: '#1E293B',
  surfaceRaised: '#334155',
  border: '#334155',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  primary: '#3B82F6',
  primaryDark: '#1E3A8A',
  primaryDeep: '#172554',
  primaryLight: '#60A5FA',
  accent: '#10B981',
  white: '#FFFFFF',
  warningBg: '#78350F',
  warningText: '#FCD34D',
};

// ISO timestamps computed once at module load — stable during dev
const NOW = Date.now();
const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

// Demo events shown to guests with correct domain model types
const DEMO_EVENTS: Event[] = [
  {
    id: 'demo-1',
    title: 'Soccer Game vs. Riverside FC',
    type: EventType.GAME,
    sport: Sport.SOCCER,
    startAt: new Date(NOW + 2 * DAY).toISOString(),
    endAt: new Date(NOW + 2 * DAY + 90 * 60 * 1000).toISOString(),
    location: {
      name: 'Riverside Park Field 3',
      address: '123 Park Ave',
      city: 'Riverside',
      state: 'CA',
      country: 'US',
    },
    teamId: 'demo-team-1',
    teamName: 'U12 Lightning',
    opponent: 'Riverside FC',
    providerId: 'teamsnap',
    externalId: 'demo-1',
    syncStatus: SyncStatus.SUCCESS,
    isCanceled: false,
    isRescheduled: false,
    rsvpStatus: RSVPStatus.PENDING,
    createdAt: new Date(NOW - DAY).toISOString(),
  },
  {
    id: 'demo-2',
    title: 'Soccer Practice',
    type: EventType.PRACTICE,
    sport: Sport.SOCCER,
    startAt: new Date(NOW + 4 * DAY).toISOString(),
    endAt: new Date(NOW + 4 * DAY + HOUR).toISOString(),
    location: {
      name: 'Community Center Field',
      address: '456 Main St',
      city: 'Springfield',
      state: 'CA',
      country: 'US',
    },
    teamId: 'demo-team-1',
    teamName: 'U12 Lightning',
    providerId: 'teamsnap',
    externalId: 'demo-2',
    syncStatus: SyncStatus.SUCCESS,
    isCanceled: false,
    isRescheduled: false,
    rsvpStatus: RSVPStatus.ATTENDING,
    createdAt: new Date(NOW - DAY).toISOString(),
  },
  {
    id: 'demo-3',
    title: 'Hockey Game vs. Eagles',
    type: EventType.GAME,
    sport: Sport.HOCKEY,
    startAt: new Date(NOW + 5 * DAY).toISOString(),
    endAt: new Date(NOW + 5 * DAY + 75 * 60 * 1000).toISOString(),
    location: {
      name: 'Ice Arena Rink 2',
      address: '789 Ice Way',
      city: 'Frostfield',
      state: 'MN',
      country: 'US',
    },
    teamId: 'demo-team-2',
    teamName: 'Peewee Sharks',
    opponent: 'Eagles',
    providerId: 'sportsengine',
    externalId: 'demo-3',
    syncStatus: SyncStatus.SUCCESS,
    isCanceled: false,
    isRescheduled: false,
    rsvpStatus: RSVPStatus.PENDING,
    createdAt: new Date(NOW - DAY).toISOString(),
  },
];

function getGreeting(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardScreen() {
  const { user, session } = useAuth();
  const isGuest = !session;

  const { events: liveEvents, isLoading, refresh, syncStatus, lastSyncAt } = useUpcomingEvents({
    limit: 10,
    skip: isGuest,
  });

  const [refreshing, setRefreshing] = useState(false);

  const events = isGuest ? DEMO_EVENTS : liveEvents;
  const hour = new Date().getHours();
  const firstName = user?.user_metadata?.['full_name']
    ? (user.user_metadata['full_name'] as string).split(' ')[0]
    : null;

  const greeting = isGuest
    ? 'Welcome to GameHub!'
    : firstName
      ? `${getGreeting(hour)}, ${firstName}!`
      : `${getGreeting(hour)}!`;

  async function onRefresh() {
    if (isGuest) return;
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  function handleEventPress(event: Event) {
    if (isGuest) {
      router.push('/(auth)/login');
      return;
    }
    router.push(`/(parent)/schedule/${event.id}`);
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={
        !isGuest ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.primary}
          />
        ) : undefined
      }
    >
      {/* ── Guest banner ──────────────────────────────────────────────── */}
      {isGuest && (
        <TouchableOpacity
          style={styles.guestBanner}
          onPress={() => router.push('/(auth)/login')}
          accessibilityRole="button"
          accessibilityLabel="Sign in to connect your real sports schedules"
          activeOpacity={0.85}
        >
          <View style={styles.guestBannerContent}>
            <Text style={styles.guestBannerTitle}>You're browsing with sample data</Text>
            <Text style={styles.guestBannerSub}>
              Tap to sign in and connect TeamSnap, SportsEngine & more →
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {/* ── Header ────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.subtitle}>
            {isGuest
              ? `${DEMO_EVENTS.length} upcoming events (demo)`
              : events.length === 0 && !isLoading
                ? 'No upcoming events'
                : "Here's what's coming up"}
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

      {/* ── Upcoming events ────────────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Upcoming Events</Text>

        {!isGuest && isLoading && liveEvents.length === 0 ? (
          <View style={styles.loadingWrap}>
            <Text style={styles.loadingText}>Loading your schedule…</Text>
          </View>
        ) : events.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>📅</Text>
            <Text style={styles.emptyTitle}>No upcoming events</Text>
            <Text style={styles.emptyDesc}>
              Connect a sports platform or add events manually to get started.
            </Text>
            <TouchableOpacity
              style={styles.emptyAction}
              onPress={() => router.push('/(shared)/provider-connect/')}
              accessibilityRole="button"
            >
              <Text style={styles.emptyActionText}>Connect a Platform</Text>
            </TouchableOpacity>
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
      </View>

      {/* ── Guest bottom CTA ──────────────────────────────────────────── */}
      {isGuest && (
        <View style={styles.guestCTA}>
          <Text style={styles.guestCTAEmoji}>🏆</Text>
          <Text style={styles.guestCTATitle}>
            Ready to connect your real schedules?
          </Text>
          <Text style={styles.guestCTADesc}>
            Link TeamSnap, SportsEngine, ICS feeds, and more — all in one place.
          </Text>
          <TouchableOpacity
            style={styles.guestCTAButton}
            onPress={() => router.push('/(auth)/login')}
            accessibilityRole="button"
            activeOpacity={0.85}
          >
            <Text style={styles.guestCTAButtonText}>Create Free Account</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/(auth)/login')}
            accessibilityRole="button"
          >
            <Text style={styles.guestCTASignIn}>Already have an account? Sign in</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: C.bg,
  },
  content: {
    paddingBottom: 60,
  },

  // ── Guest banner ─────────────────────────────────────────────────────────
  guestBanner: {
    backgroundColor: C.primaryDeep,
    borderBottomWidth: 1,
    borderBottomColor: C.primaryDark,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  guestBannerContent: {
    gap: 2,
  },
  guestBannerTitle: {
    color: '#BFDBFE', // primary-200
    fontSize: 13,
    fontWeight: '600',
  },
  guestBannerSub: {
    color: '#93C5FD', // primary-300
    fontSize: 12,
  },

  // ── Header ───────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  headerLeft: {
    flex: 1,
    gap: 4,
  },
  greeting: {
    color: C.text,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: C.textSecondary,
    fontSize: 13,
  },

  // ── Section ──────────────────────────────────────────────────────────────
  section: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sectionLabel: {
    color: C.textTertiary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },

  // ── Loading ──────────────────────────────────────────────────────────────
  loadingWrap: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: C.textTertiary,
    fontSize: 14,
  },

  // ── Empty state ──────────────────────────────────────────────────────────
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 10,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 4,
  },
  emptyTitle: {
    color: C.text,
    fontSize: 17,
    fontWeight: '700',
  },
  emptyDesc: {
    color: C.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  emptyAction: {
    marginTop: 8,
    backgroundColor: C.primary,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  emptyActionText: {
    color: C.white,
    fontSize: 14,
    fontWeight: '600',
  },

  // ── Guest CTA ─────────────────────────────────────────────────────────────
  guestCTA: {
    margin: 16,
    marginTop: 24,
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  guestCTAEmoji: {
    fontSize: 32,
  },
  guestCTATitle: {
    color: C.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  guestCTADesc: {
    color: C.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
  guestCTAButton: {
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 4,
  },
  guestCTAButtonText: {
    color: C.white,
    fontSize: 16,
    fontWeight: '700',
  },
  guestCTASignIn: {
    color: C.primaryLight,
    fontSize: 13,
  },
});
