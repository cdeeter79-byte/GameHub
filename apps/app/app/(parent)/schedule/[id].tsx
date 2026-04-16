import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@gamehub/domain';
import { EventType, Sport, SyncStatus, RSVPStatus } from '@gamehub/domain';
import type { Event } from '@gamehub/domain';

// react-native-maps is native-only — guard web at import level
let MapView: React.ComponentType<{
  style?: object;
  initialRegion?: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number };
  scrollEnabled?: boolean;
  zoomEnabled?: boolean;
  rotateEnabled?: boolean;
  pitchEnabled?: boolean;
  children?: React.ReactNode;
}> | null = null;

let Marker: React.ComponentType<{
  coordinate: { latitude: number; longitude: number };
  title?: string;
}> | null = null;

if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
  } catch {
    // silently fail if module unavailable
  }
}

// Palette
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
  accent: '#10B981',
  accentBg: '#064E3B',
  warning: '#F59E0B',
  warningBg: '#78350F',
  error: '#EF4444',
  errorBg: '#7F1D1D',
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
  [RSVPStatus.ATTENDING]:     { label: 'Going',     emoji: '✅', color: '#10B981', bg: '#064E3B' },
  [RSVPStatus.NOT_ATTENDING]: { label: 'Not Going', emoji: '❌', color: '#EF4444', bg: '#7F1D1D' },
  [RSVPStatus.MAYBE]:         { label: 'Maybe',     emoji: '🤔', color: '#F59E0B', bg: '#78350F' },
  [RSVPStatus.PENDING]:       { label: 'RSVP',      emoji: '❓', color: '#64748B', bg: '#1E293B' },
};

function formatFullDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

function formatDuration(startIso: string, endIso: string): string {
  const mins = Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function openMaps(location: Event['location']) {
  if (!location) return;
  const query = encodeURIComponent(`${location.address}, ${location.city}, ${location.state}`);
  const url = Platform.OS === 'ios'
    ? `maps://maps.apple.com/?q=${query}`
    : `https://maps.google.com/?q=${query}`;
  Linking.openURL(url);
}

interface Coords { latitude: number; longitude: number }

async function geocodeAddress(location: Event['location']): Promise<Coords | null> {
  if (!location) return null;

  // Use stored lat/lng if available
  if (location.lat != null && location.lng != null) {
    return { latitude: location.lat, longitude: location.lng };
  }

  // Fall back to expo-location geocoding (native only)
  if (Platform.OS === 'web') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Location = require('expo-location');
    const address = `${location.address}, ${location.city}, ${location.state} ${location.country}`;
    const results = await Location.geocodeAsync(address);
    if (results.length > 0) {
      return { latitude: results[0].latitude, longitude: results[0].longitude };
    }
  } catch {
    // silently fail
  }
  return null;
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [mapLoading, setMapLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadEvent();
  }, [id]);

  async function loadEvent() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*, attendances(status, local_intent, wrote_back)')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Event not found');

      const row = data as Record<string, unknown>;
      const loadedEvent: Event = {
        id: row['id'] as string,
        title: row['title'] as string,
        type: (row['type'] as EventType) ?? EventType.OTHER,
        sport: row['sport'] as Sport | undefined,
        teamId: row['team_id'] as string,
        teamName: (row['team_name'] as string) ?? '',
        childProfileId: (row['child_profile_id'] as string | null) ?? undefined,
        childName: (row['child_name'] as string | null) ?? undefined,
        startAt: row['start_at'] as string,
        endAt: row['end_at'] as string,
        isCanceled: (row['is_canceled'] as boolean) ?? false,
        isRescheduled: (row['is_rescheduled'] as boolean) ?? false,
        syncStatus: SyncStatus.SUCCESS,
        providerId: row['provider_id'] as string | undefined,
        externalId: row['external_id'] as string | undefined,
        location: row['location'] as Event['location'],
        opponent: row['opponent'] as string | undefined,
        tournamentId: row['tournament_id'] as string | undefined,
        tournamentName: row['tournament_name'] as string | undefined,
        notes: row['notes'] as string | undefined,
        rsvpStatus: (row['attendances'] as Array<{ status: RSVPStatus }>)?.[0]?.status,
        createdAt: row['created_at'] as string,
      };
      setEvent(loadedEvent);

      // Kick off geocoding for the map
      if (loadedEvent.location) {
        setMapLoading(true);
        geocodeAddress(loadedEvent.location).then((c) => {
          setCoords(c);
          setMapLoading(false);
        });
      }
    } catch (err) {
      console.error('[EventDetail] load error:', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRSVP(status: RSVPStatus) {
    if (!event || rsvpLoading) return;
    setRsvpLoading(true);
    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) throw new Error('Not authenticated');

      const session = (await supabase.auth.getSession()).data.session;

      // 1. Save locally first so the UI updates immediately.
      //    Delete-then-insert avoids the NULL child_profile_id conflict issue
      //    (the unique constraint is on (event_id, user_id, child_profile_id) and
      //    PostgreSQL treats NULL != NULL, so upsert never resolves the conflict).
      await supabase
        .from('attendances')
        .delete()
        .eq('event_id', event.id)
        .eq('user_id', user.id);

      await supabase
        .from('attendances')
        .insert({
          event_id: event.id,
          user_id: user.id,
          status,
          local_intent: status,
          wrote_back: false,
          mismatch_detected: false,
          updated_at: new Date().toISOString(),
        });

      setEvent((e) => e ? { ...e, rsvpStatus: status } : e);

      // 2. Write back to the source provider (TeamSnap) in the background
      if (session && event.providerId === 'teamsnap') {
        const supabaseUrl = process.env['EXPO_PUBLIC_SUPABASE_URL'] ?? '';
        fetch(`${supabaseUrl}/functions/v1/rsvp-writeback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ eventId: event.id, status }),
        }).then(async (res) => {
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            console.warn('[RSVP writeback] failed:', data);
          } else {
            const data = await res.json();
            console.log('[RSVP writeback] success, wroteBack:', data.wroteBack);
          }
        }).catch((err) => {
          console.warn('[RSVP writeback] network error:', err);
        });
      }
    } catch {
      Alert.alert('Error', 'Could not update RSVP. Please try again.');
    } finally {
      setRsvpLoading(false);
    }
  }

  // ── Loading / not-found states ─────────────────────────────────────────────

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={C.primary} size="large" />
        <Text style={styles.loadingText}>Loading event…</Text>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFoundEmoji}>📭</Text>
        <Text style={styles.notFoundTitle}>Event not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} accessibilityRole="button">
          <Text style={styles.backBtnText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const sportIcon = event.sport ? (SPORT_ICONS[event.sport] ?? '🏅') : '🏅';
  const typeLabel = EVENT_TYPE_LABELS[event.type] ?? 'Event';
  const rsvp = event.rsvpStatus ?? RSVPStatus.PENDING;
  const rsvpConfig = RSVP_CONFIG[rsvp];
  const nextRsvp: RSVPStatus[] = [RSVPStatus.ATTENDING, RSVPStatus.NOT_ATTENDING, RSVPStatus.MAYBE];

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      nestedScrollEnabled
      keyboardShouldPersistTaps="handled"
      contentInsetAdjustmentBehavior="automatic"
    >
      {/* ── Status banners ──────────────────────────────────────────── */}
      {event.isCanceled && (
        <View style={styles.cancelBanner}>
          <Text style={styles.cancelBannerText}>⛔ This event has been canceled</Text>
        </View>
      )}
      {!event.isCanceled && event.isRescheduled && (
        <View style={styles.rescheduledBanner}>
          <Text style={styles.rescheduledBannerText}>📅 This event has been rescheduled</Text>
        </View>
      )}

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <View style={styles.hero}>
        <Text style={styles.heroIcon}>{sportIcon}</Text>
        <View style={styles.heroInfo}>
          <Text style={styles.heroType}>{typeLabel.toUpperCase()}</Text>
          <View style={styles.heroTitleRow}>
            <Text style={styles.heroTitle}>{event.title}</Text>
            {event.childName && (
              <View style={styles.heroChildPill}>
                <Text style={styles.heroChildPillText} numberOfLines={1}>
                  👤 {event.childName}
                </Text>
              </View>
            )}
          </View>
          {event.opponent && (
            <Text style={styles.heroOpponent}>vs. {event.opponent}</Text>
          )}
        </View>
      </View>

      {/* ── Info cards ──────────────────────────────────────────────── */}
      <View style={styles.cards}>

        {/* Date & time */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>DATE & TIME</Text>
          <View style={styles.cardRow}>
            <Text style={styles.cardIcon}>📅</Text>
            <View>
              <Text style={styles.cardPrimary}>{formatFullDate(event.startAt)}</Text>
              <Text style={styles.cardSecondary}>
                {formatTime(event.startAt)} – {formatTime(event.endAt)}
                {'  ·  '}{formatDuration(event.startAt, event.endAt)}
              </Text>
            </View>
          </View>
        </View>

        {/* Team */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>TEAM</Text>
          <View style={styles.cardRow}>
            <Text style={styles.cardIcon}>🏷</Text>
            <Text style={styles.cardPrimary}>{event.teamName}</Text>
          </View>
          {event.tournamentName && (
            <View style={[styles.cardRow, { marginTop: 8 }]}>
              <Text style={styles.cardIcon}>🏆</Text>
              <Text style={styles.cardSecondary}>{event.tournamentName}</Text>
            </View>
          )}
        </View>

        {/* Location + map */}
        {event.location && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>LOCATION</Text>
            <View style={styles.cardRow}>
              <Text style={styles.cardIcon}>📍</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardPrimary}>{event.location.name}</Text>
                <Text style={styles.cardSecondary}>
                  {event.location.address}, {event.location.city}, {event.location.state}
                </Text>
              </View>
            </View>

            {/* Map preview — native only */}
            {mapLoading ? (
              <View style={styles.mapPlaceholder}>
                <ActivityIndicator color={C.primary} size="small" />
                <Text style={styles.mapPlaceholderText}>Loading map…</Text>
              </View>
            ) : MapView != null && Marker != null && coords != null ? (
              <TouchableOpacity
                style={styles.mapContainer}
                onPress={() => openMaps(event.location)}
                activeOpacity={0.9}
                accessibilityRole="button"
                accessibilityLabel="Open location in maps"
              >
                <MapView
                  style={styles.map}
                  initialRegion={{
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                    latitudeDelta: 0.008,
                    longitudeDelta: 0.008,
                  }}
                  scrollEnabled={false}
                  zoomEnabled={false}
                  rotateEnabled={false}
                  pitchEnabled={false}
                >
                  <Marker coordinate={coords} title={event.location.name} />
                </MapView>
                <View style={styles.mapOverlay}>
                  <Text style={styles.mapOverlayText}>🗺  Open in Maps →</Text>
                </View>
              </TouchableOpacity>
            ) : (
              /* Fallback for web or when geocoding unavailable */
              <TouchableOpacity
                style={styles.mapsButton}
                onPress={() => openMaps(event.location)}
                accessibilityRole="button"
              >
                <Text style={styles.mapsButtonText}>🗺  Open in Maps →</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Notes */}
        {event.notes && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>NOTES</Text>
            <Text style={styles.notesText}>{event.notes}</Text>
          </View>
        )}
      </View>

      {/* ── RSVP section ────────────────────────────────────────────── */}
      {!event.isCanceled && (
        <View style={styles.rsvpSection}>
          <Text style={styles.rsvpTitle}>Your RSVP</Text>
          <View style={[styles.rsvpCurrent, { backgroundColor: rsvpConfig.bg, borderColor: rsvpConfig.color }]}>
            <Text style={styles.rsvpCurrentEmoji}>{rsvpConfig.emoji}</Text>
            <Text style={[styles.rsvpCurrentLabel, { color: rsvpConfig.color }]}>
              {rsvpConfig.label}
            </Text>
          </View>
          <View style={styles.rsvpButtons}>
            {nextRsvp.map((status) => {
              const cfg = RSVP_CONFIG[status];
              const isSelected = rsvp === status;
              return (
                <TouchableOpacity
                  key={status}
                  style={[styles.rsvpBtn, { borderColor: cfg.color }, isSelected && { backgroundColor: cfg.bg }]}
                  onPress={() => handleRSVP(status)}
                  disabled={rsvpLoading || isSelected}
                  accessibilityRole="button"
                  accessibilityLabel={`RSVP ${cfg.label}`}
                  accessibilityState={{ selected: isSelected }}
                >
                  {rsvpLoading && isSelected ? (
                    <ActivityIndicator size="small" color={cfg.color} />
                  ) : (
                    <>
                      <Text style={styles.rsvpBtnEmoji}>{cfg.emoji}</Text>
                      <Text style={[styles.rsvpBtnLabel, { color: cfg.color }]}>{cfg.label}</Text>
                    </>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* ── Source ──────────────────────────────────────────────────── */}
      {event.providerId && (
        <View style={[styles.cards, { marginBottom: 0 }]}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>SOURCE</Text>
            <View style={styles.cardRow}>
              <Text style={styles.cardIcon}>🔗</Text>
              <View>
                <Text style={styles.cardPrimary}>{event.providerId}</Text>
                {event.externalId && (
                  <Text style={styles.cardSecondary}>ID: {event.externalId}</Text>
                )}
              </View>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: C.bg },
  content: { paddingBottom: 120 },
  centered: {
    flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24,
  },
  loadingText: { color: C.textSecondary, fontSize: 14, marginTop: 8 },
  notFoundEmoji: { fontSize: 48 },
  notFoundTitle: { color: C.text, fontSize: 18, fontWeight: '700' },
  backBtn: {
    marginTop: 8, backgroundColor: C.surface, borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: 20, borderWidth: 1, borderColor: C.border,
  },
  backBtnText: { color: C.primary, fontSize: 15, fontWeight: '600' },

  // Banners
  cancelBanner: {
    backgroundColor: C.errorBg, paddingVertical: 10, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: C.error,
  },
  cancelBannerText: { color: '#FCA5A5', fontSize: 14, fontWeight: '600' },
  rescheduledBanner: {
    backgroundColor: C.warningBg, paddingVertical: 10, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: C.warning,
  },
  rescheduledBannerText: { color: '#FCD34D', fontSize: 14, fontWeight: '600' },

  // Hero
  hero: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, padding: 20, paddingBottom: 16 },
  heroIcon: { fontSize: 40, lineHeight: 48 },
  heroInfo: { flex: 1, gap: 4 },
  heroType: { color: C.primary, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  heroTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' },
  heroTitle: {
    color: C.text, fontSize: 22, fontWeight: '800', lineHeight: 28, letterSpacing: -0.3,
    flexShrink: 1,
  },
  heroChildPill: {
    backgroundColor: '#1E3A8A',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: C.primary,
    marginTop: 4,
  },
  heroChildPillText: { color: C.primaryLight, fontSize: 12, fontWeight: '700' },
  heroOpponent: { color: C.textSecondary, fontSize: 15, fontWeight: '500', marginTop: 2 },

  // Cards
  cards: { paddingHorizontal: 16, gap: 12 },
  card: {
    backgroundColor: C.surface, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: C.border, gap: 10,
  },
  cardLabel: { color: C.textTertiary, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  cardIcon: { fontSize: 16, lineHeight: 22, marginTop: 1 },
  cardPrimary: { color: C.text, fontSize: 15, fontWeight: '600', lineHeight: 22 },
  cardSecondary: { color: C.textSecondary, fontSize: 13, lineHeight: 20, marginTop: 2 },
  notesText: { color: C.textSecondary, fontSize: 14, lineHeight: 22 },

  // Map
  mapContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 4,
    borderWidth: 1,
    borderColor: C.border,
  },
  map: { height: 180, width: '100%' },
  mapOverlay: {
    backgroundColor: C.surface,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  mapOverlayText: { color: C.primaryLight, fontSize: 13, fontWeight: '600' },

  mapPlaceholder: {
    marginTop: 4,
    height: 80,
    backgroundColor: C.surfaceRaised,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  mapPlaceholderText: { color: C.textTertiary, fontSize: 13 },
  mapsButton: {
    marginTop: 4,
    backgroundColor: C.surfaceRaised,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
  },
  mapsButtonText: { color: C.primaryLight, fontSize: 13, fontWeight: '600' },

  // RSVP
  rsvpSection: {
    margin: 16, marginTop: 20, backgroundColor: C.surface, borderRadius: 16,
    padding: 20, borderWidth: 1, borderColor: C.border, gap: 14,
  },
  rsvpTitle: { color: C.text, fontSize: 16, fontWeight: '700' },
  rsvpCurrent: {
    flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start',
    paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1,
  },
  rsvpCurrentEmoji: { fontSize: 16 },
  rsvpCurrentLabel: { fontSize: 14, fontWeight: '700' },
  rsvpButtons: { flexDirection: 'row', gap: 10 },
  rsvpBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, backgroundColor: 'transparent',
  },
  rsvpBtnEmoji: { fontSize: 16 },
  rsvpBtnLabel: { fontSize: 13, fontWeight: '600' },
});
