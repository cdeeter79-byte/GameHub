import { AdapterError } from '../base';
import { CAPABILITY_MATRIX } from '../capability-matrix';
import type {
  ProviderAdapter,
  AdapterContext,
  AuthResult,
  ExternalTeam,
  ExternalEvent,
  ExternalMessage,
} from '../base';

/**
 * BAND adapter.
 *
 * BAND provides a partner API that is NOT publicly available to third-party developers.
 * Access requires a formal partnership agreement with Camp Mobile (BAND's parent company).
 *
 * Integration status: STUB — endpoints reflect the known BAND API structure
 * but will fail without valid partner credentials.
 *
 * Risk level: HIGH — API availability, rate limits, and feature scope are
 * subject to BAND's partner agreement terms and may change without notice.
 *
 * Fallback: If no partner access, direct users to export a group calendar or
 * copy event details manually into GameHub.
 *
 * Partner API info: https://developers.band.us (requires partner registration)
 */

const BASE_URL = 'https://openapi.band.us/v2';

const NO_PARTNER_MSG =
  'BAND integration requires partner API access from Camp Mobile. ' +
  'Without a partner token, BAND data cannot be synced automatically. ' +
  'You can manually add events from BAND to GameHub using the manual entry feature.';

export const bandAdapter: ProviderAdapter = {
  id: 'band',
  capabilities: CAPABILITY_MATRIX['band'],

  async authenticate(credentials) {
    const clientToken = credentials['clientToken'] ?? process.env['BAND_CLIENT_TOKEN'] ?? '';
    if (!clientToken) {
      return { success: false, error: NO_PARTNER_MSG };
    }

    // BAND OAuth flow (partner only)
    const code = credentials['code'];
    if (!code) {
      const url = new URL('https://auth.band.us/oauth2/authorize');
      url.searchParams.set('response_type', 'code');
      url.searchParams.set('client_id', credentials['clientId'] ?? '');
      url.searchParams.set('redirect_uri', credentials['redirectUri'] ?? '');
      return { success: false, error: url.toString() };
    }

    const res = await fetch('https://auth.band.us/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: credentials['clientId'] ?? '',
        client_secret: credentials['clientSecret'] ?? '',
      }),
    });

    if (!res.ok) return { success: false, error: 'BAND token exchange failed. Ensure you have valid partner credentials.' };
    const data = await res.json() as { access_token: string; expires_in?: number };
    return {
      success: true,
      accessToken: data.access_token,
      expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
    };
  },

  async fetchTeams(ctx): Promise<ExternalTeam[]> {
    if (!ctx.accessToken) {
      throw new AdapterError('AUTH_FAILED', NO_PARTNER_MSG, 'band');
    }

    // Fetch BAND groups (groups = "teams" in BAND terminology)
    const res = await fetch(`${BASE_URL}/profile/groups`, {
      headers: { Authorization: `Bearer ${ctx.accessToken}` },
    });

    if (res.status === 401) throw new AdapterError('AUTH_FAILED', 'BAND token expired or invalid', 'band');
    if (!res.ok) throw new AdapterError('NETWORK_ERROR', `BAND API error: ${res.status}`, 'band');

    const data = await res.json() as {
      result_data?: { bands?: Array<{ band_key: string; name: string; cover?: { photo_url?: string } }> }
    };

    return (data.result_data?.bands ?? []).map((band) => ({
      externalId: band.band_key,
      name: band.name,
      sport: 'OTHER', // BAND does not expose sport type
      logoUrl: band.cover?.photo_url,
      providerId: 'band' as const,
    } satisfies ExternalTeam));
  },

  // BAND does not expose a calendar/events API to partners
  async fetchEvents(): Promise<ExternalEvent[]> {
    throw new AdapterError(
      'NOT_SUPPORTED',
      'BAND does not expose event/schedule data via its partner API. Events from BAND must be added manually or imported via a shared calendar link (ICS) if your BAND group admin has configured one.',
      'band',
    );
  },

  async fetchMessages(ctx, teamExternalId): Promise<ExternalMessage[]> {
    if (!ctx.accessToken) {
      throw new AdapterError('AUTH_FAILED', NO_PARTNER_MSG, 'band');
    }

    const res = await fetch(`${BASE_URL}/band/posts?band_key=${teamExternalId}&limit=20`, {
      headers: { Authorization: `Bearer ${ctx.accessToken}` },
    });

    if (!res.ok) throw new AdapterError('NETWORK_ERROR', `BAND posts error: ${res.status}`, 'band');

    const data = await res.json() as {
      result_data?: {
        items?: Array<{
          post_key: string; author: { name: string }; content: string; created_at: number;
          photos?: Array<{ photo_url: string }>
        }>
      }
    };

    return (data.result_data?.items ?? []).map((post) => ({
      externalId: post.post_key,
      threadId: teamExternalId ?? 'band-feed',
      senderName: post.author.name,
      body: post.content,
      sentAt: new Date(post.created_at),
      attachments: post.photos?.map((p) => ({
        name: 'Photo',
        url: p.photo_url,
        mimeType: 'image/jpeg',
      })),
    } satisfies ExternalMessage));
  },

  async sendRSVP() {
    throw new AdapterError('NOT_SUPPORTED', 'BAND does not support RSVP writeback via API.', 'band');
  },
};
