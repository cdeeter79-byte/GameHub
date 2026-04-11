// Base types and utilities
export type {
  AdapterContext,
  AuthResult,
  ExternalTeam,
  ExternalEvent,
  ExternalLocation,
  ExternalRosterMember,
  ExternalMessage,
  RSVPIntent,
  RSVPResult,
  MessageIntent,
  ProviderCapabilities,
  ProviderAdapter,
  AdapterErrorCode,
} from './base';
export { AdapterError, retryWithBackoff } from './base';

// Capability matrix
export { CAPABILITY_MATRIX } from './capability-matrix';

// Registry
export { ProviderRegistry, providerRegistry } from './registry';

// Individual adapters
export { teamSnapAdapter } from './teamsnap';
export { sportsEngineAdapter } from './sportsengine';
export { sportsEngineTourneyAdapter } from './sportsengine-tourney';
export { playMetricsAdapter } from './playmetrics';
export { leagueAppsAdapter } from './leagueapps';
export { gameChangerAdapter, parseGameChangerCSV } from './gamechanger';
export { bandAdapter } from './band';
export { hejaAdapter } from './heja';
export { crossbarAdapter } from './crossbar';
export { icsAdapter } from './ics';
export { emailImportAdapter, parseEmailContent } from './email-import';
export type { ParsedEmailEvent } from './email-import';
export { manualAdapter } from './manual';
