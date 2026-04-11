import type { EventType, MemberRole, RSVPStatus } from '@gamehub/domain';
import type { ProviderId } from '@gamehub/config';

// ─── Context & Auth ───────────────────────────────────────────────────────────

export interface AdapterContext {
  userId: string;
  accessToken?: string;
  refreshToken?: string;
  apiKey?: string;
  metadata?: Record<string, unknown>;
}

export interface AuthResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  error?: string;
}

// ─── External Entity Types ────────────────────────────────────────────────────

export interface ExternalLocation {
  name?: string;
  address: string;
  city: string;
  state: string;
  zip?: string;
  country?: string;
  lat?: number;
  lng?: number;
}

export interface ExternalTeam {
  externalId: string;
  name: string;
  sport: string;
  season?: string;
  ageGroup?: string;
  logoUrl?: string;
  providerId: ProviderId;
}

export interface ExternalEvent {
  externalId: string;
  title: string;
  type: EventType;
  startAt: Date;
  endAt: Date;
  location?: ExternalLocation;
  opponent?: string;
  tournamentId?: string;
  tournamentName?: string;
  notes?: string;
  isCanceled: boolean;
  isRescheduled?: boolean;
  externalUpdatedAt?: Date;
}

export interface ExternalRosterMember {
  externalId: string;
  firstName: string;
  lastName: string;
  role: MemberRole;
  jerseyNumber?: string;
  position?: string;
  parentEmail?: string;
  parentPhone?: string;
}

export interface ExternalMessage {
  externalId: string;
  threadId: string;
  threadTitle?: string;
  senderName: string;
  body: string;
  sentAt: Date;
  attachments?: Array<{ name: string; url: string; mimeType: string }>;
  isRead?: boolean;
}

export interface RSVPIntent {
  eventExternalId: string;
  teamExternalId: string;
  status: RSVPStatus;
  childName?: string;
  notes?: string;
}

export interface RSVPResult {
  success: boolean;
  wroteBack: boolean;
  error?: string;
}

export interface MessageIntent {
  threadExternalId: string;
  body: string;
  attachmentUrls?: string[];
}

// ─── Capabilities ─────────────────────────────────────────────────────────────

export interface ProviderCapabilities {
  supportsOfficialAPI: boolean;
  supportsOAuth: boolean;
  supportsUserCredentialAuth: boolean;
  supportsAdminOnlyAPI: boolean;
  supportsParentFacingAccess: boolean;
  supportsScheduleRead: boolean;
  supportsScheduleWrite: boolean;
  supportsRosterRead: boolean;
  supportsMessagingRead: boolean;
  supportsMessagingWrite: boolean;
  supportsRSVPRead: boolean;
  supportsRSVPWrite: boolean;
  supportsTournamentRead: boolean;
  supportsBracketRead: boolean;
  supportsStandingsRead: boolean;
  supportsCalendarSubscription: boolean;
  supportsWebhooks: boolean;
  supportsDeltaSync: boolean;
  supportsAttachments: boolean;
  supportsBackgroundRefresh: boolean;
}

// ─── Adapter Interface ────────────────────────────────────────────────────────

export interface ProviderAdapter {
  readonly id: ProviderId;
  readonly capabilities: ProviderCapabilities;

  /** Authenticate and return tokens. For OAuth, constructs redirect URL or exchanges code. */
  authenticate(credentials: Record<string, string>): Promise<AuthResult>;

  /** Refresh an expiring access token. */
  refreshToken?(ctx: AdapterContext): Promise<AuthResult>;

  /** Fetch all teams/groups accessible to the user. */
  fetchTeams(ctx: AdapterContext): Promise<ExternalTeam[]>;

  /** Fetch events for a specific team. */
  fetchEvents(ctx: AdapterContext, teamExternalId: string): Promise<ExternalEvent[]>;

  /** Fetch roster for a specific team. Optional — only if supportsRosterRead. */
  fetchRoster?(ctx: AdapterContext, teamExternalId: string): Promise<ExternalRosterMember[]>;

  /** Fetch messages/threads. Optional — only if supportsMessagingRead. */
  fetchMessages?(ctx: AdapterContext, teamExternalId?: string): Promise<ExternalMessage[]>;

  /** Send an RSVP to the source platform. Optional — only if supportsRSVPWrite. */
  sendRSVP?(ctx: AdapterContext, intent: RSVPIntent): Promise<RSVPResult>;

  /** Send a message to a team thread. Optional — only if supportsMessagingWrite. */
  sendMessage?(ctx: AdapterContext, intent: MessageIntent): Promise<void>;
}

// ─── Error ────────────────────────────────────────────────────────────────────

export type AdapterErrorCode =
  | 'AUTH_FAILED'
  | 'RATE_LIMITED'
  | 'NOT_SUPPORTED'
  | 'NETWORK_ERROR'
  | 'PARSE_ERROR'
  | 'PERMISSION_DENIED'
  | 'INVALID_CREDENTIALS';

export class AdapterError extends Error {
  constructor(
    public readonly code: AdapterErrorCode,
    message: string,
    public readonly providerId?: string,
  ) {
    super(message);
    this.name = 'AdapterError';
  }
}

// ─── Retry Utility ────────────────────────────────────────────────────────────

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 1000,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (err instanceof AdapterError && err.code === 'NOT_SUPPORTED') throw err;
      if (attempt < maxRetries - 1) {
        await new Promise((r) => setTimeout(r, baseDelayMs * Math.pow(2, attempt)));
      }
    }
  }
  throw lastError;
}
