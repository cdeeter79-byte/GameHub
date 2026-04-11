// GameHub Domain Models
// Complete TypeScript interfaces for all domain entities

// ─── Enums ─────────────────────────────────────────────────────────────────────

export enum Sport {
  SOCCER = 'SOCCER',
  BASKETBALL = 'BASKETBALL',
  BASEBALL = 'BASEBALL',
  SOFTBALL = 'SOFTBALL',
  LACROSSE = 'LACROSSE',
  HOCKEY = 'HOCKEY',
  FOOTBALL = 'FOOTBALL',
  VOLLEYBALL = 'VOLLEYBALL',
  TENNIS = 'TENNIS',
  SWIMMING = 'SWIMMING',
  OTHER = 'OTHER',
}

export enum ChildAgeBand {
  UNDER_13 = 'UNDER_13',
  TEEN_13_17 = 'TEEN_13_17',
  ADULT_18_PLUS = 'ADULT_18_PLUS',
}

export enum EventType {
  GAME = 'GAME',
  PRACTICE = 'PRACTICE',
  TOURNAMENT = 'TOURNAMENT',
  TOURNAMENT_GAME = 'TOURNAMENT_GAME',
  MEETING = 'MEETING',
  VOLUNTEER = 'VOLUNTEER',
  OTHER = 'OTHER',
}

export enum RSVPStatus {
  ATTENDING = 'ATTENDING',
  NOT_ATTENDING = 'NOT_ATTENDING',
  MAYBE = 'MAYBE',
  PENDING = 'PENDING',
}

export enum SyncStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  PARTIAL = 'PARTIAL',
}

export enum ConflictResolution {
  SOURCE_WINS = 'SOURCE_WINS',
  LOCAL_WINS = 'LOCAL_WINS',
  MANUAL = 'MANUAL',
}

export enum MemberRole {
  PARENT = 'PARENT',
  PLAYER = 'PLAYER',
  COACH = 'COACH',
  MANAGER = 'MANAGER',
  ADMIN = 'ADMIN',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  TRIALING = 'TRIALING',
  PAST_DUE = 'PAST_DUE',
  CANCELED = 'CANCELED',
  PAUSED = 'PAUSED',
}

export enum NotificationType {
  UPCOMING_GAME = 'UPCOMING_GAME',
  UPCOMING_PRACTICE = 'UPCOMING_PRACTICE',
  RSVP_NEEDED = 'RSVP_NEEDED',
  EVENT_CHANGED = 'EVENT_CHANGED',
  SYNC_MISMATCH = 'SYNC_MISMATCH',
  UNREAD_MESSAGE = 'UNREAD_MESSAGE',
  DIGEST = 'DIGEST',
}

// ─── User & Profile Entities ───────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface NotificationPreference {
  userId: string;
  type: NotificationType;
  enabled: boolean;
  /** Minutes before event to send notification (for upcoming event types) */
  advanceMinutes?: number;
}

export interface ParentProfile {
  userId: string;
  phone?: string;
  notificationPreferences: NotificationPreference[];
}

export interface ChildProfile {
  id: string;
  parentUserId: string;
  firstName: string;
  lastName: string;
  birthDate?: string; // ISO 8601 date string (YYYY-MM-DD)
  ageBand: ChildAgeBand;
  sport?: Sport;
  avatarUrl?: string;
  createdAt: string; // ISO 8601
}

export interface ConsentRecord {
  id: string;
  parentUserId: string;
  /** null when consent is for the parent themselves (e.g. ToS) */
  childProfileId?: string;
  consentType: string; // e.g. 'COPPA', 'TERMS_OF_SERVICE', 'PRIVACY_POLICY', 'MARKETING'
  granted: boolean;
  grantedAt: string; // ISO 8601
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string; // e.g. 'rsvp.set', 'sync.completed', 'team.connected'
  entityType: string; // e.g. 'Event', 'Attendance', 'ProviderAccount'
  entityId: string;
  /** Snapshot of values before the change (null for creates) */
  before?: unknown;
  /** Snapshot of values after the change */
  after: unknown;
  timestamp: string; // ISO 8601
  ipAddress?: string;
}

// ─── Team & Season Entities ────────────────────────────────────────────────────

export interface Team {
  id: string;
  name: string;
  sport: Sport;
  season?: string;
  ageGroup?: string;
  logoUrl?: string;
  /** The provider-side team identifier */
  externalId?: string;
  providerId?: string;
}

export interface Season {
  id: string;
  teamId: string;
  name: string;
  startDate: string; // ISO 8601 date string
  endDate: string;   // ISO 8601 date string
  isActive: boolean;
}

export interface Tournament {
  id: string;
  name: string;
  sport: Sport;
  startDate: string; // ISO 8601 date string
  endDate: string;   // ISO 8601 date string
  location: Location;
  providerId?: string;
  externalId?: string;
}

// ─── Location ─────────────────────────────────────────────────────────────────

export interface Location {
  name: string;
  address: string;
  city: string;
  state: string;
  zip?: string;
  country: string;
  lat?: number;
  lng?: number;
}

// ─── Provider & Sync Entities ──────────────────────────────────────────────────

export interface ProviderAccount {
  id: string;
  userId: string;
  providerId: string;
  authStrategy: 'oauth2' | 'api_key' | 'csv_import' | 'ics_url' | 'email' | 'manual';
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string; // ISO 8601
  metadata?: Record<string, unknown>;
  connectedAt: string; // ISO 8601
  lastSyncAt?: string; // ISO 8601
}

export interface ProviderCapabilities {
  canFetchTeams: boolean;
  canFetchSchedule: boolean;
  canFetchMessages: boolean;
  canFetchTournaments: boolean;
  canReadRSVP: boolean;
  canWriteRSVP: boolean;
  supportsWebhooks: boolean;
  supportsIncrementalSync: boolean;
  supportsAttendance: boolean;
  supportsLineup: boolean;
}

// ─── Event Entities ────────────────────────────────────────────────────────────

export interface Event {
  id: string;
  title: string;
  type: EventType;
  sport?: Sport;
  teamId: string;
  teamName: string;
  /** If event belongs to a specific child's schedule */
  childProfileId?: string;
  childName?: string;
  providerId?: string;
  /** Provider-side event identifier, used for deduplication */
  externalId?: string;
  startAt: string;  // ISO 8601
  endAt: string;    // ISO 8601
  location?: Location;
  /** Opponent team name (for games) */
  opponent?: string;
  tournamentId?: string;
  tournamentName?: string;
  notes?: string;
  rsvpStatus?: RSVPStatus;
  syncStatus: SyncStatus;
  isCanceled: boolean;
  isRescheduled: boolean;
  /** Timestamp of the most recent source-side update */
  sourceUpdatedAt?: string; // ISO 8601
  createdAt: string; // ISO 8601
}

export interface Attendance {
  id: string;
  eventId: string;
  userId: string;
  childProfileId?: string;
  /** The RSVP status as reported by the source provider */
  status: RSVPStatus;
  /** The user's locally expressed intent, may differ from source */
  localIntent?: RSVPStatus;
  /** Whether the local intent was successfully written back to the provider */
  wroteBack: boolean;
  /** True when local intent diverges from source RSVP */
  mismatchDetected: boolean;
  resolvedAt?: string; // ISO 8601
  resolution?: ConflictResolution;
  updatedAt: string; // ISO 8601
}

// ─── Messaging Entities ────────────────────────────────────────────────────────

export interface MessageThread {
  id: string;
  teamId: string;
  providerId?: string;
  externalId?: string;
  title?: string;
  lastMessageAt: string; // ISO 8601
  unreadCount: number;
  /** True when the app cannot send replies to this thread */
  isReadOnly: boolean;
}

export interface Message {
  id: string;
  threadId: string;
  senderName: string;
  senderAvatarUrl?: string;
  body: string;
  attachments?: Attachment[];
  sentAt: string; // ISO 8601
  /** True when the message was sent by the current user */
  isOutbound: boolean;
  providerId?: string;
}

export interface Attachment {
  name: string;
  url: string;
  mimeType: string;
  sizeBytes?: number;
}

// ─── Sync Entities ─────────────────────────────────────────────────────────────

export interface SyncJob {
  id: string;
  userId: string;
  providerId: string;
  status: SyncStatus;
  startedAt: string; // ISO 8601
  completedAt?: string; // ISO 8601
  error?: string;
  entitiesSynced?: number;
  nextSyncAt?: string; // ISO 8601
}

export interface SyncConflict {
  id: string;
  syncJobId: string;
  entityType: string; // e.g. 'Event', 'Attendance'
  entityId: string;
  localValue: unknown;
  sourceValue: unknown;
  resolution: ConflictResolution;
  resolvedAt: string; // ISO 8601
  notes?: string;
}

// ─── Subscription & Billing Entities ──────────────────────────────────────────

export interface SubscriptionState {
  userId: string;
  plan: 'free' | 'premium';
  status: SubscriptionStatus;
  expiresAt?: string; // ISO 8601
  revenueCatCustomerId?: string;
  entitlements: string[];
}

export interface ManagerPlan {
  userId: string;
  tierId: string;
  teamLimit: number;
  status: SubscriptionStatus;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodEnd?: string; // ISO 8601
}

export interface ManagedTeam {
  id: string;
  managerUserId: string;
  teamId: string;
  createdAt: string; // ISO 8601
}

// ─── External / Adapter Types ─────────────────────────────────────────────────
// Used by provider adapters to return normalized data before it's mapped to domain models

export interface ExternalTeam {
  externalId: string;
  name: string;
  sport?: Sport;
  season?: string;
  ageGroup?: string;
  logoUrl?: string;
}

export interface ExternalEvent {
  externalId: string;
  title: string;
  type: EventType;
  sport?: Sport;
  startAt: string;  // ISO 8601
  endAt: string;    // ISO 8601
  location?: Location;
  opponent?: string;
  teamExternalId: string;
  tournamentId?: string;
  tournamentName?: string;
  notes?: string;
  rsvpStatus?: RSVPStatus;
  isCanceled: boolean;
  isRescheduled: boolean;
  sourceUpdatedAt?: string; // ISO 8601
}

// ─── Provider Adapter Interface ───────────────────────────────────────────────

export interface ProviderAdapter {
  readonly providerId: string;
  readonly capabilities: ProviderCapabilities;

  fetchTeams(account: ProviderAccount): Promise<ExternalTeam[]>;
  fetchEvents(account: ProviderAccount, teamId: string, since?: string): Promise<ExternalEvent[]>;
  sendRSVP?(account: ProviderAccount, eventId: string, status: RSVPStatus): Promise<void>;
  fetchMessages?(account: ProviderAccount, teamId: string): Promise<MessageThread[]>;
}
