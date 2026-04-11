import { AdapterError } from '../base';
import { CAPABILITY_MATRIX } from '../capability-matrix';
import { sportsEngineAdapter } from '../sportsengine';
import type { ProviderAdapter, AdapterContext, AuthResult, ExternalTeam, ExternalEvent } from '../base';

/**
 * SportsEngine Tourney adapter — focused on tournament and bracket data.
 * Shares OAuth credentials with the main SportsEngine adapter.
 * Uses same GraphQL endpoint, tournament-specific queries.
 */

const GRAPHQL_URL = 'https://api.sportsengine.com/graphql';

const TOURNAMENTS_QUERY = `
  query GetTournaments {
    viewer {
      tournaments {
        id
        name
        sport
        startDate
        endDate
        status
        location {
          name
          address
          city
          state
        }
      }
    }
  }
`;

const TOURNAMENT_TEAMS_QUERY = `
  query GetTournamentTeams($tournamentId: ID!) {
    tournament(id: $tournamentId) {
      id
      name
      sport
      teams {
        id
        name
        ageGroup
      }
    }
  }
`;

const TOURNAMENT_SCHEDULE_QUERY = `
  query GetTournamentSchedule($tournamentId: ID!) {
    tournament(id: $tournamentId) {
      games {
        id
        title
        startTime
        endTime
        homeTeam { name }
        awayTeam { name }
        location { name address city state }
        isCanceled
        bracketRound
      }
    }
  }
`;

async function gqlFetch<T>(ctx: AdapterContext, query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ctx.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new AdapterError('NETWORK_ERROR', `SportsEngine Tourney error: ${res.status}`, 'sportsengine_tourney');
  const json = await res.json() as { data?: T; errors?: Array<{ message: string }> };
  if (json.errors?.length) throw new AdapterError('PARSE_ERROR', json.errors[0]?.message ?? 'GraphQL error', 'sportsengine_tourney');
  return json.data as T;
}

export const sportsEngineTourneyAdapter: ProviderAdapter = {
  id: 'sportsengine_tourney',
  capabilities: CAPABILITY_MATRIX['sportsengine_tourney'],

  // Reuse SportsEngine OAuth
  authenticate: sportsEngineAdapter.authenticate,
  refreshToken: sportsEngineAdapter.refreshToken,

  async fetchTeams(ctx) {
    const data = await gqlFetch<{
      viewer: { tournaments: Array<{ id: string; name: string; sport: string }> }
    }>(ctx, TOURNAMENTS_QUERY);

    // Return tournaments as synthetic "teams" so they appear in the unified schedule
    return (data.viewer?.tournaments ?? []).map((t) => ({
      externalId: `tournament-${t.id}`,
      name: t.name,
      sport: t.sport ?? 'OTHER',
      providerId: 'sportsengine_tourney' as const,
    } satisfies ExternalTeam));
  },

  async fetchEvents(ctx, teamExternalId) {
    // teamExternalId may be "tournament-{id}" — strip prefix
    const tournamentId = teamExternalId.replace(/^tournament-/, '');
    const data = await gqlFetch<{
      tournament: {
        games: Array<{
          id: string; title: string; startTime: string; endTime: string;
          homeTeam?: { name: string }; awayTeam?: { name: string };
          location?: { name?: string; address: string; city: string; state: string };
          isCanceled: boolean; bracketRound?: string;
        }>
      }
    }>(ctx, TOURNAMENT_SCHEDULE_QUERY, { tournamentId });

    return (data.tournament?.games ?? []).map((g) => ({
      externalId: g.id,
      title: g.title ?? `${g.homeTeam?.name ?? '?'} vs ${g.awayTeam?.name ?? '?'}`,
      type: 'TOURNAMENT_GAME' as const,
      startAt: new Date(g.startTime),
      endAt: new Date(g.endTime),
      isCanceled: g.isCanceled,
      opponent: g.awayTeam?.name,
      tournamentId,
      location: g.location ? {
        name: g.location.name,
        address: g.location.address,
        city: g.location.city,
        state: g.location.state,
        country: 'US',
      } : undefined,
    } satisfies ExternalEvent));
  },

  async sendRSVP() {
    throw new AdapterError('NOT_SUPPORTED', 'SportsEngine Tourney does not support RSVP writeback.', 'sportsengine_tourney');
  },
};
