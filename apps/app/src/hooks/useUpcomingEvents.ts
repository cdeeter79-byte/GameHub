import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@gamehub/domain';
import type { Event, SyncStatus } from '@gamehub/domain';
import { useAuth } from './useAuth';

interface UseUpcomingEventsOptions {
  limit?: number;
}

interface UseUpcomingEventsResult {
  events: Event[];
  isLoading: boolean;
  syncStatus: SyncStatus;
  lastSyncAt: Date | undefined;
  refresh: () => Promise<void>;
}

export function useUpcomingEvents({ limit = 10 }: UseUpcomingEventsOptions = {}): UseUpcomingEventsResult {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('PENDING');
  const [lastSyncAt, setLastSyncAt] = useState<Date | undefined>(undefined);

  const fetchEvents = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setSyncStatus('IN_PROGRESS');

    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          attendances!inner(status, local_intent, wrote_back)
        `)
        .gte('start_at', now)
        .order('start_at', { ascending: true })
        .limit(limit);

      if (error) throw error;

      // Map DB rows to domain Event type
      const mapped: Event[] = (data ?? []).map((row: Record<string, unknown>) => ({
        id: row['id'] as string,
        title: row['title'] as string,
        type: row['type'] as Event['type'],
        teamId: row['team_id'] as string,
        teamName: row['team_name'] as string ?? '',
        startAt: new Date(row['start_at'] as string),
        endAt: new Date(row['end_at'] as string),
        isCanceled: row['is_canceled'] as boolean ?? false,
        isRescheduled: row['is_rescheduled'] as boolean ?? false,
        syncStatus: 'SUCCESS',
        providerId: row['provider_id'] as string | undefined,
        externalId: row['external_id'] as string | undefined,
        location: row['location'] as Event['location'],
        opponent: row['opponent'] as string | undefined,
        tournamentId: row['tournament_id'] as string | undefined,
        tournamentName: row['tournament_name'] as string | undefined,
        rsvpStatus: (row['attendances'] as Array<{ status: string }>)?.[0]?.status as Event['rsvpStatus'],
        createdAt: new Date(row['created_at'] as string),
      }));

      setEvents(mapped);
      setSyncStatus('SUCCESS');
      setLastSyncAt(new Date());
    } catch {
      setSyncStatus('FAILED');
    } finally {
      setIsLoading(false);
    }
  }, [user, limit]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return { events, isLoading, syncStatus, lastSyncAt, refresh: fetchEvents };
}
