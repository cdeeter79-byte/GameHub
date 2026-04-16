import { AdapterError, retryWithBackoff } from '../base';
import { CAPABILITY_MATRIX } from '../capability-matrix';
import type {
  ProviderAdapter,
  AdapterContext,
  AuthResult,
  ExternalTeam,
  ExternalEvent,
  ExternalRosterMember,
  ExternalMessage,
  RSVPIntent,
  RSVPResult,
  MessageIntent,
} from '../base';
import type { EventType, MemberRole } from '@gamehub/domain';

// Official API base (confirmed from teamsnap-javascript-sdk source)
const BASE_URL = 'https://apiv3.teamsnap.com';
const AUTH_URL = 'https://auth.teamsnap.com/oauth/authorize';
const TOKEN_URL = 'https://auth.teamsnap.com/oauth/token';

/** Parse Collection+JSON format returned by TeamSnap API */
function extractFields(item: Record<string, unknown>): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  if (!Array.isArray(item['data'])) return data;
  for (const field of item['data'] as Array<{ name: string; value: unknown }>) {
    data[field.name] = field.value;
  }
  return data;
}

/**
 * TeamSnap events use a boolean `is_game` field — there is no `event_type` enum.
 * Practices can be inferred from `is_game: false` + name check.
 */
function mapEventType(isGame: boolean, name: string): EventType {
  if (isGame) return 'GAME';
  const lower = name.toLowerCase();
  if (lower.includes('practice')) return 'PRACTICE';
  if (lower.includes('meeting') || lower.includes('team meeting')) return 'MEETING';
  if (lower.includes('tournament')) return 'TOURNAMENT';
  return 'OTHER';
}

/**
 * TeamSnap members have boolean flags `is_manager`, `is_owner`, `is_non_player`
 * rather than a single `role` string. Derive the GameHub role from those flags.
 */
function mapRole(f: Record<string, unknown>): MemberRole {
  if (f['is_owner'] === true) return 'MANAGER';
  if (f['is_manager'] === true) return 'MANAGER';
  if (f['is_non_player'] === true) return 'PARENT';
  return 'PLAYER';
}

async function tsGet<T>(
  path: string,
  ctx: AdapterContext,
  params?: Record<string, string>,
): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await retryWithBackoff(async () => {
    const r = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${ctx.accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    if (r.status === 401) throw new AdapterError('AUTH_FAILED', 'TeamSnap token expired', 'teamsnap');
    if (r.status === 429) throw new AdapterError('RATE_LIMITED', 'TeamSnap rate limit hit', 'teamsnap');
    if (!r.ok) throw new AdapterError('NETWORK_ERROR', `TeamSnap API error: ${r.status}`, 'teamsnap');
    return r;
  });

  return res.json() as Promise<T>;
}

export const teamSnapAdapter: ProviderAdapter = {
  id: 'teamsnap',
  capabilities: CAPABILITY_MATRIX['teamsnap'],

  async authenticate(credentials) {
    const clientId = credentials['clientId'] ?? process.env['TEAMSNAP_CLIENT_ID'] ?? '';
    const redirectUri = credentials['redirectUri'] ?? '';
    const code = credentials['code'];

    if (!code) {
      // Return auth URL for the OAuth flow
      const url = new URL(AUTH_URL);
      url.searchParams.set('client_id', clientId);
      url.searchParams.set('redirect_uri', redirectUri);
      url.searchParams.set('response_type', 'code');
      url.searchParams.set('scope', 'read write');
      return { success: false, error: url.toString() }; // caller uses error as redirect URL
    }

    // Exchange code for tokens
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: credentials['clientSecret'] ?? '',
        redirect_uri: redirectUri,
      }),
    });

    if (!res.ok) {
      return { success: false, error: 'Token exchange failed' };
    }

    const data = await res.json() as {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
    };

    return {
      success: true,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : undefined,
    };
  },

  async refreshToken(ctx) {
    if (!ctx.refreshToken) return { success: false, error: 'No refresh token' };
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: ctx.refreshToken,
        client_id: process.env['TEAMSNAP_CLIENT_ID'] ?? '',
        client_secret: process.env['TEAMSNAP_CLIENT_SECRET'] ?? '',
      }),
    });
    if (!res.ok) return { success: false, error: 'Refresh failed' };
    const data = await res.json() as { access_token: string; refresh_token?: string; expires_in?: number };
    return {
      success: true,
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? ctx.refreshToken,
      expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
    };
  },

  async fetchTeams(ctx) {
    const data = await tsGet<{ collection: { items: unknown[] } }>('/teams', ctx);
    return (data.collection?.items ?? []).map((item) => {
      const f = extractFields(item as Record<string, unknown>);
      return {
        externalId: String(f['id'] ?? ''),
        name: String(f['name'] ?? 'Unnamed Team'),
        sport: String(f['sport_name'] ?? 'OTHER'),
        season: f['season_name'] ? String(f['season_name']) : undefined,
        ageGroup: f['division_name'] ? String(f['division_name']) : undefined,
        logoUrl: f['logo_url'] ? String(f['logo_url']) : undefined,
        providerId: 'teamsnap' as const,
      } satisfies ExternalTeam;
    });
  },

  async fetchEvents(ctx, teamExternalId) {
    const data = await tsGet<{ collection: { items: unknown[] } }>(
      '/events',
      ctx,
      { team_id: teamExternalId },
    );
    return (data.collection?.items ?? []).map((item) => {
      const f = extractFields(item as Record<string, unknown>);
      const name = String(f['name'] ?? 'Event');
      const startAt = new Date(String(f['start_date'] ?? Date.now()));
      const endAt = f['end_date'] ? new Date(String(f['end_date'])) : new Date(startAt.getTime() + 7200000);
      // TeamSnap uses is_game (boolean) — no event_type string field
      const isGame = f['is_game'] === true;
      return {
        externalId: String(f['id'] ?? ''),
        title: name,
        type: mapEventType(isGame, name),
        startAt,
        endAt,
        opponent: f['opponent_name'] ? String(f['opponent_name']) : undefined,
        notes: f['notes'] ? String(f['notes']) : undefined,
        isCanceled: f['canceled'] === true,
        isRescheduled: f['is_rescheduled'] === true,
        externalUpdatedAt: f['updated_at'] ? new Date(String(f['updated_at'])) : undefined,
        location: f['location_name'] ? {
          name: String(f['location_name']),
          address: String(f['location_street'] ?? ''),
          city: String(f['location_city'] ?? ''),
          state: String(f['location_state'] ?? ''),
          zip: f['location_zip'] ? String(f['location_zip']) : undefined,
          country: 'US',
        } : undefined,
      } satisfies ExternalEvent;
    });
  },

  async fetchRoster(ctx, teamExternalId) {
    // TeamSnap v3: roster lives at /members?team_id=xxx (not /team_memberships)
    const data = await tsGet<{ collection: { items: unknown[] } }>(
      '/members',
      ctx,
      { team_id: teamExternalId },
    );
    return (data.collection?.items ?? []).map((item) => {
      const f = extractFields(item as Record<string, unknown>);
      return {
        externalId: String(f['id'] ?? ''),
        // API returns snake_case fields; SDK converts to camelCase but raw API uses first_name/last_name
        firstName: String(f['first_name'] ?? ''),
        lastName: String(f['last_name'] ?? ''),
        role: mapRole(f),
        jerseyNumber: f['jersey_number'] ? String(f['jersey_number']) : undefined,
        position: f['position'] ? String(f['position']) : undefined,
      } satisfies ExternalRosterMember;
    });
  },

  async fetchMessages(ctx, teamExternalId) {
    const params: Record<string, string> = {};
    if (teamExternalId) params['team_id'] = teamExternalId;
    const data = await tsGet<{ collection: { items: unknown[] } }>('/messages', ctx, params);
    return (data.collection?.items ?? []).map((item) => {
      const f = extractFields(item as Record<string, unknown>);
      return {
        externalId: String(f['id'] ?? ''),
        threadId: String(f['team_id'] ?? teamExternalId ?? ''),
        senderName: String(f['sender_name'] ?? 'Unknown'),
        body: String(f['body'] ?? ''),
        sentAt: new Date(String(f['sent_at'] ?? Date.now())),
      } satisfies ExternalMessage;
    });
  },

  async sendRSVP(ctx, intent) {
    try {
      const res = await fetch(`${BASE_URL}/availabilities`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${ctx.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          availability: {
            event_id: intent.eventExternalId,
            status_code: intent.status === 'ATTENDING' ? 1 : intent.status === 'NOT_ATTENDING' ? 2 : 3,
            notes: intent.notes,
          },
        }),
      });
      return { success: res.ok, wroteBack: res.ok };
    } catch {
      return { success: false, wroteBack: false, error: 'Network error' };
    }
  },

  async sendMessage(ctx, intent) {
    const res = await fetch(`${BASE_URL}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ctx.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: { body: intent.body } }),
    });
    if (!res.ok) throw new AdapterError('NETWORK_ERROR', 'Failed to send TeamSnap message', 'teamsnap');
  },
};
