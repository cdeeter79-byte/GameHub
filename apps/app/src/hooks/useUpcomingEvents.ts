import { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '@gamehub/domain';
import type { Event } from '@gamehub/domain';
import { SyncStatus, EventType, RSVPStatus } from '@gamehub/domain';
import { useAuth } from './useAuth';

interface UseUpcomingEventsOptions {
  limit?: number;
  skip?: boolean;
}

interface UseUpcomingEventsResult {
  events: Event[];
  isLoading: boolean;
  syncStatus: SyncStatus;
  lastSyncAt: Date | undefined;
  refresh: () => Promise<void>;
}

export function useUpcomingEvents({ limit = 10, skip = false }: UseUpcomingEventsOptions = {}): UseUpcomingEventsResult {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(!skip);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(SyncStatus.PENDING);
  const [lastSyncAt, setLastSyncAt] = useState<Date | undefined>(undefined);

  const fetchEvents = useCallback(async () => {
    if (!user || skip) return;
    setIsLoading(true);
    setSyncStatus(SyncStatus.IN_PROGRESS);

    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          attendances(status, local_intent, wrote_back)
        `)
        .gte('start_at', now)
        .order('start_at', { ascending: true })
        .limit(limit);

      if (error) throw error;

      // Map DB rows to domain Event type
      const mapped: Event[] = (data ?? []).map((row: Record<string, unknown>) => ({
        id: row['id'] as string,
        title: row['title'] as string,
        type: (row['type'] as EventType) ?? EventType.OTHER,
        teamId: row['team_id'] as string,
        teamName: (row['team_name'] as string) ?? '',
        childProfileId: (row['child_profile_id'] as string | null) ?? undefined,
        childName: (row['child_name'] as string | null) ?? undefined,
        startAt: row['start_at'] as string,   // ISO 8601 string, NOT a Date object
        endAt: row['end_at'] as string,         // ISO 8601 string, NOT a Date object
        isCanceled: (row['is_canceled'] as boolean) ?? false,
        isRescheduled: (row['is_rescheduled'] as boolean) ?? false,
        syncStatus: SyncStatus.SUCCESS,
        providerId: row['provider_id'] as string | undefined,
        externalId: row['external_id'] as string | undefined,
        location: row['location'] as Event['location'],
        opponent: row['opponent'] as string | undefined,
        tournamentId: row['tournament_id'] as string | undefined,
        tournamentName: row['tournament_name'] as string | undefined,
        rsvpStatus: (row['attendances'] as Array<{ status: RSVPStatus }>)?.[0]?.status,
        createdAt: row['created_at'] as string,
      }));

      setEvents(mapped);
      setSyncStatus(SyncStatus.SUCCESS);
      setLastSyncAt(new Date());
    } catch {
      setSyncStatus(SyncStatus.FAILED);
    } finally {
      setIsLoading(false);
    }
  }, [user, limit]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Refetch when the screen regains focus so RSVP changes made elsewhere show up.
  useFocusEffect(
    useCallback(() => {
      fetchEvents();
    }, [fetchEvents]),
  );

  return { events, isLoading, syncStatus, lastSyncAt, refresh: fetchEvents };
}
