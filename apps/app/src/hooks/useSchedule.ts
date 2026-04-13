import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@gamehub/domain';
import { mergeEvents, filterEvents } from '@gamehub/domain';
import type { Event } from '@gamehub/domain';
import { EventType, SyncStatus, RSVPStatus } from '@gamehub/domain';
import type { Sport } from '@gamehub/domain';
import { useAuth } from './useAuth';

interface UseScheduleOptions {
  childIds?: string[];
}

export function useSchedule({ childIds = [] }: UseScheduleOptions = {}) {
  const { user } = useAuth();
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [selectedSports, setSelectedSports] = useState<Sport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);

    let query = supabase
      .from('events')
      .select('*, attendances(status)')
      .gte('start_at', new Date().toISOString())
      .order('start_at');

    if (childIds.length > 0) {
      query = query.in('child_profile_id', childIds);
    }

    const { data } = await query;

    const mapped: Event[] = (data ?? []).map((row: Record<string, unknown>) => ({
      id: row['id'] as string,
      title: row['title'] as string,
      type: (row['type'] as EventType) ?? EventType.OTHER,
      sport: row['sport'] as Sport | undefined,
      teamId: row['team_id'] as string,
      teamName: (row['team_name'] as string) ?? '',
      startAt: row['start_at'] as string,   // ISO 8601 string
      endAt: row['end_at'] as string,         // ISO 8601 string
      isCanceled: (row['is_canceled'] as boolean) ?? false,
      isRescheduled: false,
      syncStatus: SyncStatus.SUCCESS,
      providerId: row['provider_id'] as string | undefined,
      externalId: row['external_id'] as string | undefined,
      location: row['location'] as Event['location'],
      opponent: row['opponent'] as string | undefined,
      rsvpStatus: (row['attendances'] as Array<{ status: RSVPStatus }>)?.[0]?.status,
      createdAt: row['created_at'] as string,
    }));

    setAllEvents(mergeEvents(mapped));
    setIsLoading(false);
  }, [user, childIds.join(',')]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const sports = [...new Set(allEvents.map((e) => e.sport).filter(Boolean))] as Sport[];

  function toggleSport(sport: Sport | null) {
    if (!sport) { setSelectedSports([]); return; }
    setSelectedSports((prev) =>
      prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport],
    );
  }

  const events = filterEvents(allEvents, {
    sports: selectedSports.length > 0 ? selectedSports : undefined,
  });

  return { events, allEvents, isLoading, sports, selectedSports, toggleSport, refresh: fetchAll };
}
