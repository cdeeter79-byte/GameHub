import type { ProviderId } from '@gamehub/config';
import type { ProviderCapabilities } from './base';

const NONE: ProviderCapabilities = {
  supportsOfficialAPI: false,
  supportsOAuth: false,
  supportsUserCredentialAuth: false,
  supportsAdminOnlyAPI: false,
  supportsParentFacingAccess: false,
  supportsScheduleRead: false,
  supportsScheduleWrite: false,
  supportsRosterRead: false,
  supportsMessagingRead: false,
  supportsMessagingWrite: false,
  supportsRSVPRead: false,
  supportsRSVPWrite: false,
  supportsTournamentRead: false,
  supportsBracketRead: false,
  supportsStandingsRead: false,
  supportsCalendarSubscription: false,
  supportsWebhooks: false,
  supportsDeltaSync: false,
  supportsAttachments: false,
  supportsBackgroundRefresh: false,
};

export const CAPABILITY_MATRIX: Record<ProviderId, ProviderCapabilities> = {
  teamsnap: {
    ...NONE,
    supportsOfficialAPI: true,
    supportsOAuth: true,
    supportsParentFacingAccess: true,
    supportsScheduleRead: true,
    supportsRosterRead: true,
    supportsMessagingRead: true,
    supportsMessagingWrite: true,
    supportsRSVPRead: true,
    supportsRSVPWrite: true,
    supportsAttachments: true,
    supportsWebhooks: true,
    supportsDeltaSync: true,
    supportsBackgroundRefresh: true,
  },

  sportsengine: {
    ...NONE,
    supportsOfficialAPI: true,
    supportsOAuth: true,
    supportsParentFacingAccess: true,
    supportsScheduleRead: true,
    supportsRosterRead: true,
    supportsWebhooks: true,
    supportsBackgroundRefresh: true,
  },

  sportsengine_tourney: {
    ...NONE,
    supportsOfficialAPI: true,
    supportsOAuth: true,
    supportsParentFacingAccess: true,
    supportsScheduleRead: true,
    supportsTournamentRead: true,
    supportsBracketRead: true,
    supportsStandingsRead: true,
  },

  playmetrics: {
    ...NONE,
    supportsOfficialAPI: true,
    supportsUserCredentialAuth: true,   // API key, not OAuth
    supportsParentFacingAccess: true,
    supportsScheduleRead: true,
    supportsRosterRead: true,
    supportsRSVPRead: true,
    supportsStandingsRead: true,
  },

  leagueapps: {
    ...NONE,
    supportsOfficialAPI: true,
    supportsOAuth: true,                // OAuth on higher plans
    supportsUserCredentialAuth: true,   // API key on lower plans
    supportsParentFacingAccess: true,   // plan-dependent
    supportsScheduleRead: true,
    supportsRosterRead: true,
    supportsStandingsRead: true,
  },

  gamechanger: {
    ...NONE,
    // No public API. CSV export is the only integration path.
    supportsScheduleRead: true,         // via CSV import (manual)
  },

  band: {
    ...NONE,
    supportsOfficialAPI: true,          // limited partner API only
    supportsOAuth: true,                // if partner access granted
    supportsAdminOnlyAPI: true,
    supportsMessagingRead: true,        // partial — requires partner token
  },

  heja: {
    ...NONE,
    supportsCalendarSubscription: true, // ICS export available in app
  },

  crossbar: {
    ...NONE,
    supportsCalendarSubscription: true, // ICS export available in app
  },

  ics: {
    ...NONE,
    supportsOfficialAPI: true,          // standard iCal spec
    supportsParentFacingAccess: true,
    supportsScheduleRead: true,
    supportsCalendarSubscription: true,
    supportsBackgroundRefresh: true,
  },

  email_import: {
    ...NONE,
    supportsScheduleRead: true,         // best-effort parse from pasted email text
  },

  manual: {
    ...NONE,
    supportsParentFacingAccess: true,
    supportsScheduleRead: true,         // user enters data directly in GameHub
  },
};
