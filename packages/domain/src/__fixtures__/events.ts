// GameHub Fixture Events
// 6 realistic sample events for testing and Storybook

import type { Event } from '../models/index';
import { EventType, RSVPStatus, Sport, SyncStatus } from '../models/index';

const BASE_LOCATION = {
  name: 'Riverside Soccer Complex',
  address: '4500 River Rd',
  city: 'Springfield',
  state: 'IL',
  zip: '62701',
  country: 'US',
  lat: 39.7817,
  lng: -89.6501,
};

const HOCKEY_ARENA = {
  name: 'IceHouse Arena',
  address: '200 Frozen Lake Dr',
  city: 'Springfield',
  state: 'IL',
  zip: '62704',
  country: 'US',
  lat: 39.7942,
  lng: -89.6441,
};

const TOURNAMENT_COMPLEX = {
  name: 'Capital City Sports Park',
  address: '1000 Championship Blvd',
  city: 'Springfield',
  state: 'IL',
  zip: '62702',
  country: 'US',
  lat: 39.8012,
  lng: -89.6623,
};

// ─── Event 1: Soccer Game — Emma vs Eastside FC ───────────────────────────────

export const soccerGame1: Event = {
  id: 'event-001',
  title: 'U12 Girls — Springfield FC vs Eastside FC',
  type: EventType.GAME,
  sport: Sport.SOCCER,
  teamId: 'team-001',
  teamName: 'Springfield FC U12G',
  childProfileId: 'child-001',
  childName: 'Emma Johnson',
  providerId: 'teamsnap',
  externalId: 'ts-evt-44231',
  startAt: '2025-05-10T10:00:00.000Z',
  endAt: '2025-05-10T11:30:00.000Z',
  location: BASE_LOCATION,
  opponent: 'Eastside FC',
  notes: 'Home game — bring snack if on snack list.',
  rsvpStatus: RSVPStatus.ATTENDING,
  syncStatus: SyncStatus.SUCCESS,
  isCanceled: false,
  isRescheduled: false,
  sourceUpdatedAt: '2025-04-28T14:22:00.000Z',
  createdAt: '2025-04-01T09:00:00.000Z',
};

// ─── Event 2: Soccer Game — Emma (away) ───────────────────────────────────────

export const soccerGame2: Event = {
  id: 'event-002',
  title: 'U12 Girls — Lakewood United vs Springfield FC',
  type: EventType.GAME,
  sport: Sport.SOCCER,
  teamId: 'team-001',
  teamName: 'Springfield FC U12G',
  childProfileId: 'child-001',
  childName: 'Emma Johnson',
  providerId: 'teamsnap',
  externalId: 'ts-evt-44298',
  startAt: '2025-05-17T09:00:00.000Z',
  endAt: '2025-05-17T10:30:00.000Z',
  location: {
    name: 'Lakewood Park Fields',
    address: '850 Lakeview Ave',
    city: 'Decatur',
    state: 'IL',
    zip: '62521',
    country: 'US',
    lat: 39.8403,
    lng: -88.9548,
  },
  opponent: 'Lakewood United',
  notes: 'Away game — carpool organized in TeamSnap.',
  rsvpStatus: RSVPStatus.PENDING,
  syncStatus: SyncStatus.SUCCESS,
  isCanceled: false,
  isRescheduled: false,
  sourceUpdatedAt: '2025-04-29T10:05:00.000Z',
  createdAt: '2025-04-01T09:00:00.000Z',
};

// ─── Event 3: Soccer Practice ─────────────────────────────────────────────────

export const soccerPractice1: Event = {
  id: 'event-003',
  title: 'Springfield FC U12G — Practice',
  type: EventType.PRACTICE,
  sport: Sport.SOCCER,
  teamId: 'team-001',
  teamName: 'Springfield FC U12G',
  childProfileId: 'child-001',
  childName: 'Emma Johnson',
  providerId: 'teamsnap',
  externalId: 'ts-evt-44305',
  startAt: '2025-05-13T17:00:00.000Z',
  endAt: '2025-05-13T18:30:00.000Z',
  location: {
    ...BASE_LOCATION,
    name: 'Training Field B',
  },
  rsvpStatus: RSVPStatus.ATTENDING,
  syncStatus: SyncStatus.SUCCESS,
  isCanceled: false,
  isRescheduled: false,
  sourceUpdatedAt: '2025-04-25T08:00:00.000Z',
  createdAt: '2025-04-01T09:00:00.000Z',
};

// ─── Event 4: Hockey Practice ─────────────────────────────────────────────────

export const hockeyPractice1: Event = {
  id: 'event-004',
  title: 'Capitals U10 — Ice Practice',
  type: EventType.PRACTICE,
  sport: Sport.HOCKEY,
  teamId: 'team-002',
  teamName: 'Capitals U10',
  childProfileId: 'child-002',
  childName: 'Noah Johnson',
  providerId: 'sportsengine',
  externalId: 'se-evt-99012',
  startAt: '2025-05-12T06:30:00.000Z',
  endAt: '2025-05-12T07:45:00.000Z',
  location: HOCKEY_ARENA,
  notes: 'Full pads required. Arrive 20 min early.',
  rsvpStatus: RSVPStatus.ATTENDING,
  syncStatus: SyncStatus.SUCCESS,
  isCanceled: false,
  isRescheduled: false,
  sourceUpdatedAt: '2025-04-22T11:00:00.000Z',
  createdAt: '2025-03-15T09:00:00.000Z',
};

// ─── Event 5: Tournament (parent-level, multi-game weekend) ───────────────────

export const tournamentEvent: Event = {
  id: 'event-005',
  title: 'Prairie State Classic Tournament',
  type: EventType.TOURNAMENT,
  sport: Sport.SOCCER,
  teamId: 'team-001',
  teamName: 'Springfield FC U12G',
  childProfileId: 'child-001',
  childName: 'Emma Johnson',
  providerId: 'sportsengine_tourney',
  externalId: 'set-tourn-8821',
  tournamentId: 'tourn-8821',
  tournamentName: 'Prairie State Classic 2025',
  startAt: '2025-06-07T08:00:00.000Z',
  endAt: '2025-06-08T18:00:00.000Z',
  location: TOURNAMENT_COMPLEX,
  notes: 'Pool play Saturday, bracket play Sunday. Check-in by 7:45am.',
  rsvpStatus: RSVPStatus.ATTENDING,
  syncStatus: SyncStatus.SUCCESS,
  isCanceled: false,
  isRescheduled: false,
  sourceUpdatedAt: '2025-05-01T09:30:00.000Z',
  createdAt: '2025-04-10T14:00:00.000Z',
};

// ─── Event 6: Tournament Game (individual bracket game) ───────────────────────

export const tournamentGame1: Event = {
  id: 'event-006',
  title: 'Prairie State Classic — Pool B Game 1 vs River City United',
  type: EventType.TOURNAMENT_GAME,
  sport: Sport.SOCCER,
  teamId: 'team-001',
  teamName: 'Springfield FC U12G',
  childProfileId: 'child-001',
  childName: 'Emma Johnson',
  providerId: 'sportsengine_tourney',
  externalId: 'set-game-88212-b1',
  tournamentId: 'tourn-8821',
  tournamentName: 'Prairie State Classic 2025',
  startAt: '2025-06-07T10:00:00.000Z',
  endAt: '2025-06-07T11:00:00.000Z',
  location: {
    ...TOURNAMENT_COMPLEX,
    name: 'Capital City Sports Park — Field 3',
  },
  opponent: 'River City United',
  notes: 'Pool B, Game 1. Arrive no later than 9:30am.',
  rsvpStatus: RSVPStatus.ATTENDING,
  syncStatus: SyncStatus.SUCCESS,
  isCanceled: false,
  isRescheduled: false,
  sourceUpdatedAt: '2025-05-15T16:00:00.000Z',
  createdAt: '2025-04-10T14:00:00.000Z',
};

// ─── Aggregated export ────────────────────────────────────────────────────────

export const FIXTURE_EVENTS: Event[] = [
  soccerGame1,
  soccerGame2,
  soccerPractice1,
  hockeyPractice1,
  tournamentEvent,
  tournamentGame1,
];

export default FIXTURE_EVENTS;
