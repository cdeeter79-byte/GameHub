// Unit tests for ConflictResolver
// Covers all 3 deterministic policies + edge cases

import { ConflictResolver } from '../sync/conflict';
import { ConflictResolution, EventType, RSVPStatus, Sport, SyncStatus } from '../models/index';
import type { Event, ExternalEvent } from '../models/index';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeLocalEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: 'event-local-001',
    title: 'Home Game',
    type: EventType.GAME,
    sport: Sport.SOCCER,
    teamId: 'team-001',
    teamName: 'Springfield FC',
    providerId: 'teamsnap',
    externalId: 'ts-evt-001',
    startAt: '2025-05-10T10:00:00.000Z',
    endAt: '2025-05-10T11:30:00.000Z',
    rsvpStatus: RSVPStatus.ATTENDING,
    syncStatus: SyncStatus.SUCCESS,
    isCanceled: false,
    isRescheduled: false,
    sourceUpdatedAt: '2025-04-20T08:00:00.000Z',
    createdAt: '2025-04-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeExternalEvent(overrides: Partial<ExternalEvent> = {}): ExternalEvent {
  return {
    externalId: 'ts-evt-001',
    title: 'Home Game',
    type: EventType.GAME,
    sport: Sport.SOCCER,
    startAt: '2025-05-10T10:00:00.000Z',
    endAt: '2025-05-10T11:30:00.000Z',
    teamExternalId: 'ts-team-001',
    rsvpStatus: RSVPStatus.NOT_ATTENDING,
    isCanceled: false,
    isRescheduled: false,
    sourceUpdatedAt: '2025-04-28T12:00:00.000Z', // newer than local
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ConflictResolver', () => {
  let resolver: ConflictResolver;

  beforeEach(() => {
    resolver = new ConflictResolver();
  });

  // ── source_wins policy ────────────────────────────────────────────────────

  describe('policy: source_wins', () => {
    it('returns SOURCE_WINS regardless of timestamps', () => {
      const local = makeLocalEvent({ sourceUpdatedAt: '2025-05-01T00:00:00.000Z' });
      const source = makeExternalEvent({ sourceUpdatedAt: '2025-04-01T00:00:00.000Z' }); // older

      const result = resolver.resolve(local, source, 'source_wins');

      expect(result).toBe(ConflictResolution.SOURCE_WINS);
    });

    it('returns SOURCE_WINS when timestamps are identical', () => {
      const ts = '2025-05-10T10:00:00.000Z';
      const local = makeLocalEvent({ sourceUpdatedAt: ts });
      const source = makeExternalEvent({ sourceUpdatedAt: ts });

      const result = resolver.resolve(local, source, 'source_wins');

      expect(result).toBe(ConflictResolution.SOURCE_WINS);
    });

    it('records an audit log entry for source_wins', () => {
      const local = makeLocalEvent();
      const source = makeExternalEvent();

      resolver.resolve(local, source, 'source_wins');

      const log = resolver.getAuditLog();
      expect(log).toHaveLength(1);
      expect(log[0].policy).toBe('source_wins');
      expect(log[0].resolution).toBe(ConflictResolution.SOURCE_WINS);
    });
  });

  // ── local_wins policy ─────────────────────────────────────────────────────

  describe('policy: local_wins', () => {
    it('returns LOCAL_WINS regardless of timestamps', () => {
      const local = makeLocalEvent({ sourceUpdatedAt: '2025-04-01T00:00:00.000Z' });
      const source = makeExternalEvent({ sourceUpdatedAt: '2025-05-01T00:00:00.000Z' }); // newer

      const result = resolver.resolve(local, source, 'local_wins');

      expect(result).toBe(ConflictResolution.LOCAL_WINS);
    });

    it('returns LOCAL_WINS even when source has a cancellation', () => {
      const local = makeLocalEvent({ isCanceled: false });
      const source = makeExternalEvent({ isCanceled: true });

      const result = resolver.resolve(local, source, 'local_wins');

      expect(result).toBe(ConflictResolution.LOCAL_WINS);
    });

    it('records an audit log entry for local_wins', () => {
      const local = makeLocalEvent();
      const source = makeExternalEvent();

      resolver.resolve(local, source, 'local_wins');

      const log = resolver.getAuditLog();
      expect(log).toHaveLength(1);
      expect(log[0].policy).toBe('local_wins');
      expect(log[0].resolution).toBe(ConflictResolution.LOCAL_WINS);
    });
  });

  // ── manual policy ─────────────────────────────────────────────────────────

  describe('policy: manual', () => {
    it('returns MANUAL resolution', () => {
      const local = makeLocalEvent();
      const source = makeExternalEvent();

      const result = resolver.resolve(local, source, 'manual');

      expect(result).toBe(ConflictResolution.MANUAL);
    });

    it('records MANUAL in audit log', () => {
      const local = makeLocalEvent();
      const source = makeExternalEvent();

      resolver.resolve(local, source, 'manual');

      const log = resolver.getAuditLog();
      expect(log[0].resolution).toBe(ConflictResolution.MANUAL);
      expect(log[0].policy).toBe('manual');
    });
  });

  // ── newest_wins policy ────────────────────────────────────────────────────

  describe('policy: newest_wins', () => {
    it('returns SOURCE_WINS when source timestamp is strictly newer', () => {
      const local = makeLocalEvent({ sourceUpdatedAt: '2025-04-20T08:00:00.000Z' });
      const source = makeExternalEvent({ sourceUpdatedAt: '2025-04-28T12:00:00.000Z' });

      const result = resolver.resolve(local, source, 'newest_wins');

      expect(result).toBe(ConflictResolution.SOURCE_WINS);
    });

    it('returns SOURCE_WINS (safe default) when local is newer', () => {
      const local = makeLocalEvent({ sourceUpdatedAt: '2025-05-01T00:00:00.000Z' });
      const source = makeExternalEvent({ sourceUpdatedAt: '2025-04-01T00:00:00.000Z' });

      const result = resolver.resolve(local, source, 'newest_wins');

      // Safe default is SOURCE_WINS even when local is newer
      expect(result).toBe(ConflictResolution.SOURCE_WINS);
    });

    it('falls back gracefully when sourceUpdatedAt is missing on local', () => {
      const local = makeLocalEvent({ sourceUpdatedAt: undefined, createdAt: '2025-04-01T00:00:00.000Z' });
      const source = makeExternalEvent({ sourceUpdatedAt: '2025-04-28T12:00:00.000Z' });

      const result = resolver.resolve(local, source, 'newest_wins');

      expect(result).toBe(ConflictResolution.SOURCE_WINS);
    });
  });

  // ── applyResolution ───────────────────────────────────────────────────────

  describe('applyResolution', () => {
    it('SOURCE_WINS: returns source field values', () => {
      const local = makeLocalEvent({ title: 'Old Title', startAt: '2025-05-10T10:00:00.000Z' });
      const source = makeExternalEvent({ title: 'New Title', startAt: '2025-05-11T10:00:00.000Z' });

      const patch = resolver.applyResolution(local, source, ConflictResolution.SOURCE_WINS);

      expect(patch.title).toBe('New Title');
      expect(patch.startAt).toBe('2025-05-11T10:00:00.000Z');
      expect(patch.isCanceled).toBe(false);
    });

    it('LOCAL_WINS: returns only non-destructive source fields', () => {
      const local = makeLocalEvent({ title: 'My Title' });
      const source = makeExternalEvent({ title: 'Provider Title' });

      const patch = resolver.applyResolution(local, source, ConflictResolution.LOCAL_WINS);

      // Should NOT overwrite local title
      expect(patch.title).toBeUndefined();
      // Should carry over source timestamp for record-keeping
      expect(patch.sourceUpdatedAt).toBe(source.sourceUpdatedAt);
    });

    it('MANUAL: returns empty object', () => {
      const local = makeLocalEvent();
      const source = makeExternalEvent();

      const patch = resolver.applyResolution(local, source, ConflictResolution.MANUAL);

      expect(Object.keys(patch)).toHaveLength(0);
    });
  });

  // ── audit log management ──────────────────────────────────────────────────

  describe('audit log', () => {
    it('accumulates multiple log entries across calls', () => {
      const local = makeLocalEvent();
      const source = makeExternalEvent();

      resolver.resolve(local, source, 'source_wins');
      resolver.resolve(local, source, 'local_wins');
      resolver.resolve(local, source, 'manual');

      expect(resolver.getAuditLog()).toHaveLength(3);
    });

    it('clearAuditLog resets the log to empty', () => {
      const local = makeLocalEvent();
      const source = makeExternalEvent();

      resolver.resolve(local, source, 'source_wins');
      expect(resolver.getAuditLog()).toHaveLength(1);

      resolver.clearAuditLog();
      expect(resolver.getAuditLog()).toHaveLength(0);
    });

    it('log entry contains correct entity snapshot data', () => {
      const local = makeLocalEvent({ id: 'event-abc', title: 'Local Title' });
      const source = makeExternalEvent({ title: 'Source Title' });

      resolver.resolve(local, source, 'source_wins');

      const entry = resolver.getAuditLog()[0];
      expect(entry.entityId).toBe('event-abc');
      expect(entry.localSnapshot.title).toBe('Local Title');
      expect(entry.sourceSnapshot.title).toBe('Source Title');
    });
  });
});
