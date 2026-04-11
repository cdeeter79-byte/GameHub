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

const BASE_URL = 'https://api.leagueapps.com/v2';
const TOKEN_URL = 'https://auth.leagueapps.com/oauth/token';
const AUTH_URL = 'https://auth.leagueapps.com/oauth/authorize';

async function laGet<T>(path: string, ctx: AdapterContext): Promise<T> {
  const token = ctx.accessToken ?? ctx.apiKey ?? '';
  const authHeader = ctx.metadata?.['authMethod'] === 'api_key'
    ? `ApiKey ${token}`
    : `Bearer ${token}`;

  return retryWithBackoff(async () => {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
    });
    if (res.status === 401) throw new AdapterError('AUTH_FAILED', 'LeagueApps auth failed', 'leagueapps');
    if (res.status === 429) throw new AdapterError('RATE_LIMITED', 'LeagueApps rate limit', 'leagueapps');
    if (!res.ok) throw new AdapterError('NETWORK_ERROR', `LeagueApps error: ${res.status}`, 'leagueapps');
    return res.json() as Promise<T>;
  });
}

export const leagueAppsAdapter: ProviderAdapter = {
  id: 'leagueapps',
  capabilities: CAPABILITY_MATRIX['leagueapps'],

  async authenticate(credentials) {
    if (credentials['authMethod'] === 'api_key') {
      const apiKey = credentials['apiKey'];
      if (!apiKey) return { success: false, error: 'API key required' };
      return { success: true, accessToken: apiKey };
    }

    const code = credentials['code'];
    if (!code) {
      const url = new URL(AUTH_URL);
      url.searchParams.set('client_id', credentials['clientId'] ?? '');
      url.searchParams.set('redirect_uri', credentials['redirectUri'] ?? '');
      url.searchParams.set('response_type', 'code');
      url.searchParams.set('scope', 'read');
      return { success: false, error: url.toString() };
    }

    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: credentials['clientId'] ?? '',
        client_secret: credentials['clientSecret'] ?? '',
        redirect_uri: credentials['redirectUri'] ?? '',
      }),
    });
    if (!res.ok) return { success: false, error: 'LeagueApps token exchange failed' };
    const data = await res.json() as { access_token: string; refresh_token?: string; expires_in?: number };
    return {
      success: true,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
    };
  },

  async fetchTeams(ctx) {
    const data = await laGet<{
      programs: Array<{ id: string; name: string; sport?: string; season?: string; ageGroup?: string }>
    }>('/programs', ctx);
    return (data.programs ?? []).map((p) => ({
      externalId: String(p.id),
      name: p.name,
      sport: (p.sport ?? 'OTHER').toUpperCase(),
      season: p.season,
      ageGroup: p.ageGroup,
      providerId: 'leagueapps' as const,
    } satisfies ExternalTeam));
  },

  async fetchEvents(ctx, teamExternalId) {
    const data = await laGet<{
      games: Array<{
        id: string; title?: string; startTime: string; endTime?: string;
        opponent?: string; locationName?: string; locationAddress?: string;
        locationCity?: string; locationState?: string; isCanceled?: boolean;
      }>
    }>(`/programs/${teamExternalId}/games`, ctx);

    return (data.games ?? []).map((g) => ({
      externalId: String(g.id),
      title: g.title ?? 'Game',
      type: 'GAME' as const,
      startAt: new Date(g.startTime),
      endAt: g.endTime ? new Date(g.endTime) : new Date(new Date(g.startTime).getTime() + 7200000),
      isCanceled: g.isCanceled ?? false,
      opponent: g.opponent,
      location: g.locationAddress ? {
        name: g.locationName,
        address: g.locationAddress,
        city: g.locationCity ?? '',
        state: g.locationState ?? '',
        country: 'US',
      } : undefined,
    } satisfies ExternalEvent));
  },

  async fetchRoster(ctx, teamExternalId) {
    const data = await laGet<{
      members: Array<{ id: string; firstName: string; lastName: string; jerseyNumber?: string; position?: string }>
    }>(`/programs/${teamExternalId}/members`, ctx);
    return (data.members ?? []).map((m) => ({
      externalId: String(m.id),
      firstName: m.firstName,
      lastName: m.lastName,
      role: 'PLAYER' as const,
      jerseyNumber: m.jerseyNumber,
      position: m.position,
    } satisfies ExternalRosterMember));
  },

  async sendRSVP() {
    throw new AdapterError('NOT_SUPPORTED', 'LeagueApps does not support RSVP writeback. Your response has been saved in GameHub only.', 'leagueapps');
  },
};
