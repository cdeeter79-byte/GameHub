// GameHub Schedule Merge Utilities
// Deduplication, sorting, grouping, and filtering of Event arrays

import type { Event } from '../models/index';
import { RSVPStatus, EventType } from '../models/index';
import type { ProviderId } from '@gamehub/config';
import type { Sport } from '../models/index';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface EventFilters {
  /** Only include events for these child profiles */
  childProfileIds?: string[];
  /** Only include events for these teams */
  teamIds?: string[];
  /** Only include events from these providers */
  providerIds?: ProviderId[];
  /** Only include events for these sports */
  sports?: Sport[];
  /** Only include events with these RSVP statuses */
  rsvpStatuses?: RSVPStatus[];
  /** If true, only include TOURNAMENT and TOURNAMENT_GAME events */
  showTournamentOnly?: boolean;
  /** Only include events within this date range (ISO 8601 strings) */
  dateRange?: { from: string; to: string };
  /** If true, include canceled events (default: false) */
  showCanceled?: boolean;
}

// ─── mergeEvents ──────────────────────────────────────────────────────────────

/**
 * Deduplicates a list of events by (providerId + externalId), keeping the
 * version with the most recent `sourceUpdatedAt` timestamp.
 * Also sorts the result ascending by `startAt`.
 * Canceled events are excluded unless `showCanceled` is true (passed via filter separately).
 */
export function mergeEvents(events: Event[], showCanceled = false): Event[] {
  // Deduplication map keyed by "providerId:externalId"
  const dedupMap = new Map<string, Event>();

  for (const event of events) {
    // Events without a provider/externalId are always unique (manual entries)
    const dedupeKey =
      event.providerId && event.externalId
        ? `${event.providerId}:${event.externalId}`
        : `local:${event.id}`;

    const existing = dedupMap.get(dedupeKey);
    if (!existing) {
      dedupMap.set(dedupeKey, event);
    } else {
      // Keep the one with the newer sourceUpdatedAt (fall back to createdAt)
      const existingTs = new Date(existing.sourceUpdatedAt ?? existing.createdAt).getTime();
      const incomingTs = new Date(event.sourceUpdatedAt ?? event.createdAt).getTime();
      if (incomingTs > existingTs) {
        dedupMap.set(dedupeKey, event);
      }
    }
  }

  let result = Array.from(dedupMap.values());

  // Filter canceled events
  if (!showCanceled) {
    result = result.filter((e) => !e.isCanceled);
  }

  // Sort ascending by startAt
  result.sort((a, b) => {
    const aTs = new Date(a.startAt).getTime();
    const bTs = new Date(b.startAt).getTime();
    return aTs - bTs;
  });

  return result;
}

// ─── groupByDay ───────────────────────────────────────────────────────────────

/**
 * Groups events by calendar day (local date, YYYY-MM-DD).
 * The key is derived from the event's `startAt` in local time.
 */
export function groupByDay(events: Event[]): Map<string, Event[]> {
  const map = new Map<string, Event[]>();

  for (const event of events) {
    const date = new Date(event.startAt);
    // Format as YYYY-MM-DD in local time
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const key = `${year}-${month}-${day}`;

    const bucket = map.get(key) ?? [];
    bucket.push(event);
    map.set(key, bucket);
  }

  // Sort events within each day
  for (const [key, dayEvents] of map) {
    map.set(
      key,
      dayEvents.sort(
        (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
      ),
    );
  }

  return map;
}

// ─── groupByWeek ──────────────────────────────────────────────────────────────

/**
 * Groups events by ISO week number (YYYY-Www, e.g. "2025-W14").
 * Uses ISO 8601 week numbering (Monday = first day of week).
 */
export function groupByWeek(events: Event[]): Map<string, Event[]> {
  const map = new Map<string, Event[]>();

  for (const event of events) {
    const key = getISOWeekKey(new Date(event.startAt));
    const bucket = map.get(key) ?? [];
    bucket.push(event);
    map.set(key, bucket);
  }

  // Sort events within each week
  for (const [key, weekEvents] of map) {
    map.set(
      key,
      weekEvents.sort(
        (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
      ),
    );
  }

  return map;
}

/** Returns ISO week key string like "2025-W14" for a given date */
function getISOWeekKey(date: Date): string {
  // Copy and set to Thursday of the current week (ISO standard)
  const target = new Date(date.valueOf());
  const dayOfWeek = date.getDay(); // 0 = Sunday
  // Adjust to nearest Thursday: dayOfWeek is 0-6 (Sun=0)
  const isoDay = dayOfWeek === 0 ? 7 : dayOfWeek; // Mon=1, Sun=7
  target.setDate(date.getDate() + (4 - isoDay)); // Thursday of ISO week

  const year = target.getFullYear();
  // Get week number
  const jan4 = new Date(year, 0, 4); // Jan 4 is always in week 1
  const diffMs = target.getTime() - jan4.getTime();
  const diffDays = Math.round(diffMs / 86400000);
  const weekNum = Math.floor(diffDays / 7) + 1;

  return `${year}-W${String(weekNum).padStart(2, '0')}`;
}

// ─── filterEvents ─────────────────────────────────────────────────────────────

/**
 * Applies a set of optional filters to an event list.
 * All provided filters are ANDed together.
 */
export function filterEvents(events: Event[], filters: EventFilters): Event[] {
  return events.filter((event) => {
    // Canceled filter
    if (!filters.showCanceled && event.isCanceled) {
      return false;
    }

    // Child profile filter
    if (
      filters.childProfileIds &&
      filters.childProfileIds.length > 0 &&
      event.childProfileId &&
      !filters.childProfileIds.includes(event.childProfileId)
    ) {
      return false;
    }

    // Team filter
    if (
      filters.teamIds &&
      filters.teamIds.length > 0 &&
      !filters.teamIds.includes(event.teamId)
    ) {
      return false;
    }

    // Provider filter
    if (
      filters.providerIds &&
      filters.providerIds.length > 0 &&
      event.providerId &&
      !filters.providerIds.includes(event.providerId as ProviderId)
    ) {
      return false;
    }

    // Sport filter
    if (filters.sports && filters.sports.length > 0) {
      if (!event.sport || !filters.sports.includes(event.sport)) {
        return false;
      }
    }

    // RSVP status filter
    if (filters.rsvpStatuses && filters.rsvpStatuses.length > 0) {
      const effectiveStatus = event.rsvpStatus ?? RSVPStatus.PENDING;
      if (!filters.rsvpStatuses.includes(effectiveStatus)) {
        return false;
      }
    }

    // Tournament-only filter
    if (filters.showTournamentOnly) {
      if (
        event.type !== EventType.TOURNAMENT &&
        event.type !== EventType.TOURNAMENT_GAME
      ) {
        return false;
      }
    }

    // Date range filter
    if (filters.dateRange) {
      const eventStart = new Date(event.startAt).getTime();
      const fromTs = new Date(filters.dateRange.from).getTime();
      const toTs = new Date(filters.dateRange.to).getTime();
      if (eventStart < fromTs || eventStart > toTs) {
        return false;
      }
    }

    return true;
  });
}

// ─── Convenience helpers ──────────────────────────────────────────────────────

/**
 * Returns upcoming events (startAt >= now), sorted ascending.
 */
export function getUpcomingEvents(events: Event[], limit?: number): Event[] {
  const now = Date.now();
  const upcoming = events
    .filter((e) => !e.isCanceled && new Date(e.startAt).getTime() >= now)
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  return limit !== undefined ? upcoming.slice(0, limit) : upcoming;
}

/**
 * Returns events that need an RSVP (status is PENDING or undefined).
 */
export function getEventsNeedingRSVP(events: Event[]): Event[] {
  const now = Date.now();
  return events.filter(
    (e) =>
      !e.isCanceled &&
      new Date(e.startAt).getTime() >= now &&
      (!e.rsvpStatus || e.rsvpStatus === RSVPStatus.PENDING),
  );
}

/**
 * Returns events occurring on the given calendar date string (YYYY-MM-DD).
 */
export function getEventsForDate(events: Event[], dateStr: string): Event[] {
  return events.filter((event) => {
    const d = new Date(event.startAt);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}` === dateStr;
  });
}
