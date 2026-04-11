import { AdapterError, retryWithBackoff } from '../base';
import { CAPABILITY_MATRIX } from '../capability-matrix';
import type {
  ProviderAdapter,
  AdapterContext,
  AuthResult,
  ExternalTeam,
  ExternalEvent,
  ExternalRosterMember,
} from '../base';
import type { EventType } from '@gamehub/domain';

const GRAPHQL_URL = 'https://api.sportsengine.com/graphql';
const AUTH_URL = 'https://user.sportsengine.com/oauth/authorize';
const TOKEN_URL = 'https://user.sportsengine.com/oauth/token';

async function gqlQuery<T>(
  ctx: AdapterContext,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  return retryWithBackoff(async () => {
    const res = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ctx.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });

    if (res.status === 401) throw new AdapterError('AUTH_FAILED', 'SportsEngine token expired', 'sportsengine');
    if (res.status === 429) throw new AdapterError('RATE_LIMITED', 'SportsEngine rate limit', 'sportsengine');
    if (!res.ok) throw new AdapterError('NETWORK_ERROR', `SportsEngine error: ${res.status}`, 'sportsengine');

    const json = await res.json() as { data?: T; errors?: Array<{ message: string }> };

    if (json.errors?.some((e) => e.message.includes('complexity'))) {
      throw new AdapterError('RATE_LIMITED', 'Query complexity limit exceeded', 'sportsengine');
    }
    if (json.errors?.length) {
      throw new AdapterError('PARSE_ERROR', json.errors[0]?.message ?? 'GraphQL error', 'sportsengine');
    }

    return json.data as T;
  });
}

function mapEventType(type: string): EventType {
  if (type === 'Game') return 'GAME';
  if (type === 'Practice') return 'PRACTICE';
  if (type === 'Tournament') return 'TOURNAMENT';
  if (type === 'Meeting') return 'MEETING';
  return 'OTHER';
}

const TEAMS_QUERY = `
  query GetOrganizations {
    viewer {
      organizations {
        id
        name
        sport
        logoUrl
        teams {
          id
          name
          ageGroup
          divisionName
        }
      }
    }
  }
`;

const EVENTS_QUERY = `
  query GetEvents($teamId: ID!) {
    team(id: $teamId) {
      events {
        id
        title
        type
        startTime
        endTime
        isCanceled
        updatedAt
        location {
          name
          address
          city
          state
          zip
        }
        opponent {
          name
        }
      }
    }
  }
`;

const ROSTER_QUERY = `
  query GetRoster($teamId: ID!) {
    team(id: $teamId) {
      members {
        id
        firstName
        lastName
        role
        jerseyNumber
        position
        eligibilityStatus
      }
    }
  }
`;

export const sportsEngineAdapter: ProviderAdapter = {
  id: 'sportsengine',
  capabilities: CAPABILITY_MATRIX['sportsengine'],

  async authenticate(credentials) {
    const clientId = credentials['clientId'] ?? process.env['SPORTSENGINE_CLIENT_ID'] ?? '';
    const redirectUri = credentials['redirectUri'] ?? '';
    const code = credentials['code'];

    if (!code) {
      const url = new URL(AUTH_URL);
      url.searchParams.set('client_id', clientId);
      url.searchParams.set('redirect_uri', redirectUri);
      url.searchParams.set('response_type', 'code');
      url.searchParams.set('scope', 'profile teams events rosters');
      return { success: false, error: url.toString() };
    }

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

    if (!res.ok) return { success: false, error: 'SportsEngine token exchange failed' };
    const data = await res.json() as { access_token: string; refresh_token?: string; expires_in?: number };
    return {
      success: true,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
    };
  },

  async fetchTeams(ctx) {
    const data = await gqlQuery<{
      viewer: { organizations: Array<{ id: string; name: string; sport: string; logoUrl?: string }> }
    }>(ctx, TEAMS_QUERY);

    return (data.viewer?.organizations ?? []).map((org) => ({
      externalId: org.id,
      name: org.name,
      sport: org.sport ?? 'OTHER',
      logoUrl: org.logoUrl,
      providerId: 'sportsengine' as const,
    } satisfies ExternalTeam));
  },

  async fetchEvents(ctx, teamExternalId) {
    const data = await gqlQuery<{
      team: { events: Array<{
        id: string; title: string; type: string; startTime: string; endTime: string;
        isCanceled: boolean; updatedAt?: string;
        location?: { name?: string; address: string; city: string; state: string; zip?: string };
        opponent?: { name: string };
      }> }
    }>(ctx, EVENTS_QUERY, { teamId: teamExternalId });

    return (data.team?.events ?? []).map((ev) => ({
      externalId: ev.id,
      title: ev.title,
      type: mapEventType(ev.type),
      startAt: new Date(ev.startTime),
      endAt: new Date(ev.endTime),
      isCanceled: ev.isCanceled,
      opponent: ev.opponent?.name,
      externalUpdatedAt: ev.updatedAt ? new Date(ev.updatedAt) : undefined,
      location: ev.location ? {
        name: ev.location.name,
        address: ev.location.address,
        city: ev.location.city,
        state: ev.location.state,
        zip: ev.location.zip,
        country: 'US',
      } : undefined,
    } satisfies ExternalEvent));
  },

  async fetchRoster(ctx, teamExternalId) {
    const data = await gqlQuery<{
      team: { members: Array<{ id: string; firstName: string; lastName: string; role: string; jerseyNumber?: string; position?: string }> }
    }>(ctx, ROSTER_QUERY, { teamId: teamExternalId });

    return (data.team?.members ?? []).map((m) => ({
      externalId: m.id,
      firstName: m.firstName,
      lastName: m.lastName,
      role: m.role === 'COACH' ? 'COACH' as const : m.role === 'MANAGER' ? 'MANAGER' as const : 'PLAYER' as const,
      jerseyNumber: m.jerseyNumber,
      position: m.position,
    } satisfies ExternalRosterMember));
  },

  // SportsEngine does not support RSVP or messaging writeback
  async sendRSVP() {
    throw new AdapterError('NOT_SUPPORTED', 'SportsEngine does not support RSVP writeback. Your response will be stored locally in GameHub only.', 'sportsengine');
  },
};
