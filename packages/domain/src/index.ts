// GameHub Domain — public API
// Re-exports all domain models, services, utilities, and fixtures

// ─── Domain Models & Enums ────────────────────────────────────────────────────
export * from './models/index';

// ─── Supabase Client ──────────────────────────────────────────────────────────
export { supabase, getSupabaseUser, getAccessToken, signOut } from './supabase/client';

// ─── Sync Engine ──────────────────────────────────────────────────────────────
export { SyncEngine } from './sync/engine';
export type { SyncResult, SyncContext, ProgressCallback } from './sync/engine';

// ─── Conflict Resolver ────────────────────────────────────────────────────────
export { ConflictResolver } from './sync/conflict';
export type { ConflictPolicy, ResolutionLog } from './sync/conflict';

// ─── RSVP Service ─────────────────────────────────────────────────────────────
export { RSVPService } from './rsvp/rsvp-service';

// ─── Schedule Utilities ───────────────────────────────────────────────────────
export {
  mergeEvents,
  groupByDay,
  groupByWeek,
  filterEvents,
  getUpcomingEvents,
  getEventsNeedingRSVP,
  getEventsForDate,
} from './schedule/merge';
export type { EventFilters } from './schedule/merge';

// ─── Fixtures (for tests and Storybook) ──────────────────────────────────────
export {
  soccerGame1,
  soccerGame2,
  soccerPractice1,
  hockeyPractice1,
  tournamentEvent,
  tournamentGame1,
  FIXTURE_EVENTS,
} from './__fixtures__/events';

export {
  springfieldFCU12G,
  capitalsU10,
  prairieLightningU12,
  FIXTURE_TEAMS,
} from './__fixtures__/teams';
