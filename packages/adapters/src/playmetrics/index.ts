import { AdapterError, retryWithBackoff } from '../base';
import { CAPABILITY_MATRIX } from '../capability-matrix';
import type {
  ProviderAdapter,
  AdapterContext,
  ExternalTeam,
  ExternalEvent,
  ExternalRosterMember,
} from '../base';
import type { EventType } from '@gamehub/domain';

const BASE_URL = 'https://api.playmetrics.com/v1';

async function pmGet<T>(path: string, apiKey: string): Promise<T> {
  return retryWithBackoff(async () => {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
    });
    if (res.status === 401) throw new AdapterError('AUTH_FAILED', 'Invalid PlayMetrics API key', 'playmetrics');
    if (res.status === 429) throw new AdapterError('RATE_LIMITED', 'PlayMetrics rate limit', 'playmetrics');
    if (!res.ok) throw new AdapterError('NETWORK_ERROR', `PlayMetrics error: ${res.status}`, 'playmetrics');
    return res.json() as Promise<T>;
  });
}

function mapEventType(type: string): EventType {
  if (type === 'game') return 'GAME';
  if (type === 'practice') return 'PRACTICE';
  if (type === 'tournament') return 'TOURNAMENT';
  return 'OTHER';
}

export const playMetricsAdapter: ProviderAdapter = {
  id: 'playmetrics',
  capabilities: CAPABILITY_MATRIX['playmetrics'],

  async authenticate(credentials) {
    const apiKey = credentials['apiKey'];
    if (!apiKey) return { success: false, error: 'API key required' };
    // Validate by hitting a lightweight endpoint
    try {
      await pmGet('/me', apiKey);
      return { success: true, accessToken: apiKey };
    } catch {
      return { success: false, error: 'Invalid PlayMetrics API key' };
    }
  },

  async fetchTeams(ctx) {
    const apiKey = ctx.accessToken ?? ctx.apiKey ?? '';
    const data = await pmGet<{ teams: Array<{ id: string; name: string; sport: string; season?: string; age_group?: string }> }>(
      '/teams',
      apiKey,
    );
    return (data.teams ?? []).map((t) => ({
      externalId: t.id,
      name: t.name,
      sport: t.sport?.toUpperCase() ?? 'OTHER',
      season: t.season,
      ageGroup: t.age_group,
      providerId: 'playmetrics' as const,
    } satisfies ExternalTeam));
  },

  async fetchEvents(ctx, teamExternalId) {
    const apiKey = ctx.accessToken ?? ctx.apiKey ?? '';
    const data = await pmGet<{
      events: Array<{
        id: string; name: string; event_type: string;
        start_time: string; end_time?: string;
        location_name?: string; location_address?: string;
        location_city?: string; location_state?: string;
        opponent_name?: string; is_canceled?: boolean; updated_at?: string;
      }>
    }>(`/teams/${teamExternalId}/events`, apiKey);

    return (data.events ?? []).map((ev) => ({
      externalId: ev.id,
      title: ev.name,
      type: mapEventType(ev.event_type),
      startAt: new Date(ev.start_time),
      endAt: ev.end_time ? new Date(ev.end_time) : new Date(new Date(ev.start_time).getTime() + 5400000),
      isCanceled: ev.is_canceled ?? false,
      opponent: ev.opponent_name,
      externalUpdatedAt: ev.updated_at ? new Date(ev.updated_at) : undefined,
      location: ev.location_address ? {
        name: ev.location_name,
        address: ev.location_address,
        city: ev.location_city ?? '',
        state: ev.location_state ?? '',
        country: 'US',
      } : undefined,
    } satisfies ExternalEvent));
  },

  async fetchRoster(ctx, teamExternalId) {
    const apiKey = ctx.accessToken ?? ctx.apiKey ?? '';
    const data = await pmGet<{
      players: Array<{ id: string; first_name: string; last_name: string; jersey_number?: string; position?: string }>
    }>(`/teams/${teamExternalId}/players`, apiKey);

    return (data.players ?? []).map((p) => ({
      externalId: p.id,
      firstName: p.first_name,
      lastName: p.last_name,
      role: 'PLAYER' as const,
      jerseyNumber: p.jersey_number,
      position: p.position,
    } satisfies ExternalRosterMember));
  },

  async sendRSVP() {
    throw new AdapterError(
      'NOT_SUPPORTED',
      'PlayMetrics does not support RSVP writeback via API. Your response has been saved in GameHub only.',
      'playmetrics',
    );
  },
};
