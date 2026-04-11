// GameHub Feature Flags
// All flags can be overridden via EXPO_PUBLIC_ environment variables

export interface FeatureFlags {
  /** Show ads to free-tier users */
  enableAds: boolean;
  /** Enable Band.us group integration for messaging */
  enableBandIntegration: boolean;
  /** Enable the manager/coach-facing team management mode */
  enableManagerMode: boolean;
  /** Allow importing schedule data from email (Gmail / Outlook parsing) */
  enableEmailImport: boolean;
  /** Enable push notifications via Expo Push / APNs / FCM */
  enablePushNotifications: boolean;
  /** Enable Google Calendar two-way sync */
  enableGoogleCalendarSync: boolean;
  /** Enable tournament bracket and pool-play views */
  enableTournamentView: boolean;
  /** Enable the unified inbox aggregating provider messages */
  enableUnifiedInbox: boolean;
  /** Enable writing RSVP decisions back to source providers */
  enableRSVPWriteback: boolean;
  /** Enable offline caching and optimistic UI updates */
  enableOfflineMode: boolean;
}

/**
 * Safely parse a boolean from an environment variable string.
 * Accepts '1', 'true', 'yes' (case-insensitive) as truthy.
 * Returns `defaultValue` when the env var is absent or empty.
 */
function parseBoolEnv(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value === '') {
    return defaultValue;
  }
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

/**
 * Default feature flag values.
 * Values are read from EXPO_PUBLIC_* environment variables at module load time
 * so that Expo's constant inlining works correctly at build time.
 */
export const defaultFlags: FeatureFlags = {
  enableAds: parseBoolEnv(
    process.env.EXPO_PUBLIC_FEATURE_ENABLE_ADS,
    true,
  ),

  enableBandIntegration: parseBoolEnv(
    process.env.EXPO_PUBLIC_FEATURE_ENABLE_BAND_INTEGRATION,
    false,
  ),

  enableManagerMode: parseBoolEnv(
    process.env.EXPO_PUBLIC_FEATURE_ENABLE_MANAGER_MODE,
    true,
  ),

  enableEmailImport: parseBoolEnv(
    process.env.EXPO_PUBLIC_FEATURE_ENABLE_EMAIL_IMPORT,
    false,
  ),

  enablePushNotifications: parseBoolEnv(
    process.env.EXPO_PUBLIC_FEATURE_ENABLE_PUSH_NOTIFICATIONS,
    true,
  ),

  enableGoogleCalendarSync: parseBoolEnv(
    process.env.EXPO_PUBLIC_FEATURE_ENABLE_GOOGLE_CALENDAR_SYNC,
    false,
  ),

  enableTournamentView: parseBoolEnv(
    process.env.EXPO_PUBLIC_FEATURE_ENABLE_TOURNAMENT_VIEW,
    true,
  ),

  enableUnifiedInbox: parseBoolEnv(
    process.env.EXPO_PUBLIC_FEATURE_ENABLE_UNIFIED_INBOX,
    true,
  ),

  enableRSVPWriteback: parseBoolEnv(
    process.env.EXPO_PUBLIC_FEATURE_ENABLE_RSVP_WRITEBACK,
    true,
  ),

  enableOfflineMode: parseBoolEnv(
    process.env.EXPO_PUBLIC_FEATURE_ENABLE_OFFLINE_MODE,
    true,
  ),
};

/**
 * Merge custom overrides on top of defaultFlags.
 * Useful for tests or per-screen feature gating.
 */
export function createFlags(overrides: Partial<FeatureFlags> = {}): FeatureFlags {
  return { ...defaultFlags, ...overrides };
}

export default defaultFlags;
