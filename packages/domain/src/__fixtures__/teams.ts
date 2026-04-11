// GameHub Fixture Teams
// 3 sample teams across 2 sports and 2 children

import type { Team } from '../models/index';
import { Sport } from '../models/index';

// ─── Team 1: Emma's Soccer Team ───────────────────────────────────────────────

export const springfieldFCU12G: Team = {
  id: 'team-001',
  name: 'Springfield FC U12G',
  sport: Sport.SOCCER,
  season: 'Spring 2025',
  ageGroup: 'U12 Girls',
  logoUrl: 'https://assets.gamehub.app/teams/springfield-fc-u12g.png',
  externalId: 'ts-team-5521',
  providerId: 'teamsnap',
};

// ─── Team 2: Noah's Hockey Team ───────────────────────────────────────────────

export const capitalsU10: Team = {
  id: 'team-002',
  name: 'Capitals U10',
  sport: Sport.HOCKEY,
  season: '2024–2025 Travel Season',
  ageGroup: 'U10 Boys',
  logoUrl: 'https://assets.gamehub.app/teams/capitals-u10.png',
  externalId: 'se-team-3304',
  providerId: 'sportsengine',
};

// ─── Team 3: Emma's Tournament-Only Team (via SportsEngine Tournaments) ────────

export const prairieLightningU12: Team = {
  id: 'team-003',
  name: 'Prairie Lightning U12',
  sport: Sport.SOCCER,
  season: 'Summer 2025 Tournament Circuit',
  ageGroup: 'U12 Girls',
  logoUrl: 'https://assets.gamehub.app/teams/prairie-lightning-u12.png',
  externalId: 'set-team-7791',
  providerId: 'sportsengine_tourney',
};

// ─── Aggregated export ────────────────────────────────────────────────────────

export const FIXTURE_TEAMS: Team[] = [
  springfieldFCU12G,
  capitalsU10,
  prairieLightningU12,
];

export default FIXTURE_TEAMS;
