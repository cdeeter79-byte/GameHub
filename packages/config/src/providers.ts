// GameHub Provider Registry

export type ProviderId =
  | 'teamsnap'
  | 'sportsengine'
  | 'sportsengine_tourney'
  | 'playmetrics'
  | 'leagueapps'
  | 'gamechanger'
  | 'band'
  | 'heja'
  | 'crossbar'
  | 'ics'
  | 'email_import'
  | 'manual';

export type AuthStrategy =
  | 'oauth2'
  | 'api_key'
  | 'csv_import'
  | 'ics_url'
  | 'email'
  | 'manual';

// ─── Display Names ─────────────────────────────────────────────────────────────

export const PROVIDER_DISPLAY_NAMES: Record<ProviderId, string> = {
  teamsnap: 'TeamSnap',
  sportsengine: 'SportsEngine',
  sportsengine_tourney: 'SportsEngine Tournaments',
  playmetrics: 'PlayMetrics',
  leagueapps: 'LeagueApps',
  gamechanger: 'GameChanger',
  band: 'Band',
  heja: 'Heja',
  crossbar: 'Crossbar',
  ics: 'ICS Calendar Feed',
  email_import: 'Email Import',
  manual: 'Manual Entry',
};

// ─── Brand Colors (primary hex) ────────────────────────────────────────────────

export const PROVIDER_COLORS: Record<ProviderId, string> = {
  teamsnap: '#E8272A',
  sportsengine: '#0057A8',
  sportsengine_tourney: '#0057A8',
  playmetrics: '#00B388',
  leagueapps: '#F4A800',
  gamechanger: '#1A2E6C',
  band: '#6C5CE7',
  heja: '#00C896',
  crossbar: '#C0392B',
  ics: '#5B6470',
  email_import: '#7C4DFF',
  manual: '#90A4AE',
};

// ─── Logo Asset Paths ──────────────────────────────────────────────────────────
// These reference bundled asset paths relative to the app's assets directory.
// The native image loader resolves them at build time.

export const PROVIDER_LOGOS: Record<ProviderId, string> = {
  teamsnap: 'assets/providers/teamsnap.png',
  sportsengine: 'assets/providers/sportsengine.png',
  sportsengine_tourney: 'assets/providers/sportsengine_tourney.png',
  playmetrics: 'assets/providers/playmetrics.png',
  leagueapps: 'assets/providers/leagueapps.png',
  gamechanger: 'assets/providers/gamechanger.png',
  band: 'assets/providers/band.png',
  heja: 'assets/providers/heja.png',
  crossbar: 'assets/providers/crossbar.png',
  ics: 'assets/providers/ics.png',
  email_import: 'assets/providers/email_import.png',
  manual: 'assets/providers/manual.png',
};

// ─── Authentication Strategies ─────────────────────────────────────────────────

export const AUTH_STRATEGIES: Record<ProviderId, AuthStrategy> = {
  teamsnap: 'oauth2',
  sportsengine: 'oauth2',
  sportsengine_tourney: 'oauth2',
  playmetrics: 'oauth2',
  leagueapps: 'oauth2',
  gamechanger: 'oauth2',
  band: 'oauth2',
  heja: 'api_key',
  crossbar: 'api_key',
  ics: 'ics_url',
  email_import: 'email',
  manual: 'manual',
};

// ─── Provider Capabilities ─────────────────────────────────────────────────────

export interface ProviderCapabilities {
  /** Provider can return a list of teams */
  canFetchTeams: boolean;
  /** Provider can return event / game schedules */
  canFetchSchedule: boolean;
  /** Provider can return team messaging threads */
  canFetchMessages: boolean;
  /** Provider can return tournament brackets */
  canFetchTournaments: boolean;
  /** Provider supports reading RSVP status */
  canReadRSVP: boolean;
  /** Provider supports writing RSVP back to source */
  canWriteRSVP: boolean;
  /** Provider supports real-time / webhook events */
  supportsWebhooks: boolean;
  /** Provider supports incremental sync (since-timestamp) */
  supportsIncrementalSync: boolean;
  /** Provider returns attendance / headcount data */
  supportsAttendance: boolean;
  /** Provider supports adding lineup / roster notes */
  supportsLineup: boolean;
}

export const PROVIDER_CAPABILITIES: Record<ProviderId, ProviderCapabilities> = {
  teamsnap: {
    canFetchTeams: true,
    canFetchSchedule: true,
    canFetchMessages: true,
    canFetchTournaments: false,
    canReadRSVP: true,
    canWriteRSVP: true,
    supportsWebhooks: true,
    supportsIncrementalSync: true,
    supportsAttendance: true,
    supportsLineup: false,
  },
  sportsengine: {
    canFetchTeams: true,
    canFetchSchedule: true,
    canFetchMessages: false,
    canFetchTournaments: false,
    canReadRSVP: true,
    canWriteRSVP: false,
    supportsWebhooks: false,
    supportsIncrementalSync: false,
    supportsAttendance: false,
    supportsLineup: false,
  },
  sportsengine_tourney: {
    canFetchTeams: true,
    canFetchSchedule: true,
    canFetchMessages: false,
    canFetchTournaments: true,
    canReadRSVP: false,
    canWriteRSVP: false,
    supportsWebhooks: false,
    supportsIncrementalSync: false,
    supportsAttendance: false,
    supportsLineup: false,
  },
  playmetrics: {
    canFetchTeams: true,
    canFetchSchedule: true,
    canFetchMessages: true,
    canFetchTournaments: false,
    canReadRSVP: true,
    canWriteRSVP: true,
    supportsWebhooks: false,
    supportsIncrementalSync: true,
    supportsAttendance: true,
    supportsLineup: true,
  },
  leagueapps: {
    canFetchTeams: true,
    canFetchSchedule: true,
    canFetchMessages: false,
    canFetchTournaments: true,
    canReadRSVP: false,
    canWriteRSVP: false,
    supportsWebhooks: false,
    supportsIncrementalSync: false,
    supportsAttendance: false,
    supportsLineup: false,
  },
  gamechanger: {
    canFetchTeams: true,
    canFetchSchedule: true,
    canFetchMessages: true,
    canFetchTournaments: true,
    canReadRSVP: true,
    canWriteRSVP: true,
    supportsWebhooks: false,
    supportsIncrementalSync: true,
    supportsAttendance: true,
    supportsLineup: true,
  },
  band: {
    canFetchTeams: true,
    canFetchSchedule: true,
    canFetchMessages: true,
    canFetchTournaments: false,
    canReadRSVP: true,
    canWriteRSVP: true,
    supportsWebhooks: false,
    supportsIncrementalSync: false,
    supportsAttendance: false,
    supportsLineup: false,
  },
  heja: {
    canFetchTeams: true,
    canFetchSchedule: true,
    canFetchMessages: true,
    canFetchTournaments: false,
    canReadRSVP: true,
    canWriteRSVP: true,
    supportsWebhooks: false,
    supportsIncrementalSync: false,
    supportsAttendance: true,
    supportsLineup: false,
  },
  crossbar: {
    canFetchTeams: true,
    canFetchSchedule: true,
    canFetchMessages: true,
    canFetchTournaments: false,
    canReadRSVP: true,
    canWriteRSVP: false,
    supportsWebhooks: false,
    supportsIncrementalSync: false,
    supportsAttendance: false,
    supportsLineup: false,
  },
  ics: {
    canFetchTeams: false,
    canFetchSchedule: true,
    canFetchMessages: false,
    canFetchTournaments: false,
    canReadRSVP: false,
    canWriteRSVP: false,
    supportsWebhooks: false,
    supportsIncrementalSync: false,
    supportsAttendance: false,
    supportsLineup: false,
  },
  email_import: {
    canFetchTeams: false,
    canFetchSchedule: true,
    canFetchMessages: false,
    canFetchTournaments: false,
    canReadRSVP: false,
    canWriteRSVP: false,
    supportsWebhooks: false,
    supportsIncrementalSync: false,
    supportsAttendance: false,
    supportsLineup: false,
  },
  manual: {
    canFetchTeams: false,
    canFetchSchedule: false,
    canFetchMessages: false,
    canFetchTournaments: false,
    canReadRSVP: false,
    canWriteRSVP: false,
    supportsWebhooks: false,
    supportsIncrementalSync: false,
    supportsAttendance: false,
    supportsLineup: false,
  },
};

/** Returns true if the provider supports OAuth2 sign-in */
export function isOAuthProvider(id: ProviderId): boolean {
  return AUTH_STRATEGIES[id] === 'oauth2';
}

/** Returns all providers sorted by display name */
export function getAllProviders(): ProviderId[] {
  return (Object.keys(PROVIDER_DISPLAY_NAMES) as ProviderId[]).sort((a, b) =>
    PROVIDER_DISPLAY_NAMES[a].localeCompare(PROVIDER_DISPLAY_NAMES[b]),
  );
}
