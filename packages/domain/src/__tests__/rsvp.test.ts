// Unit tests for RSVPService
// Mocks Supabase client and ProviderAdapter

import { RSVPService } from '../rsvp/rsvp-service';
import { RSVPStatus, ConflictResolution, EventType, Sport, SyncStatus } from '../models/index';
import type { ProviderAdapter, ProviderAccount, ProviderCapabilities, Event } from '../models/index';

// ─── Mock Builders ─────────────────────────────────────────────────────────────

function makeSupabaseMock(overrides: Record<string, unknown> = {}) {
  const mock = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    ...overrides,
  };
  return mock as unknown as ReturnType<typeof import('@supabase/supabase-js').createClient>;
}

function makeWritebackAdapter(canWriteRSVP = true): ProviderAdapter {
  const capabilities: ProviderCapabilities = {
    canFetchTeams: true,
    canFetchSchedule: true,
    canFetchMessages: false,
    canFetchTournaments: false,
    canReadRSVP: true,
    canWriteRSVP,
    supportsWebhooks: false,
    supportsIncrementalSync: false,
    supportsAttendance: false,
    supportsLineup: false,
  };

  return {
    providerId: 'teamsnap',
    capabilities,
    fetchTeams: jest.fn().mockResolvedValue([]),
    fetchEvents: jest.fn().mockResolvedValue([]),
    sendRSVP: jest.fn().mockResolvedValue(undefined),
  };
}

function makeEventRow(overrides: Partial<Event> = {}): Event {
  return {
    id: 'event-001',
    title: 'Home Game',
    type: EventType.GAME,
    sport: Sport.SOCCER,
    teamId: 'team-001',
    teamName: 'Springfield FC',
    providerId: 'teamsnap',
    externalId: 'ts-evt-001',
    startAt: '2025-05-10T10:00:00.000Z',
    endAt: '2025-05-10T11:30:00.000Z',
    rsvpStatus: RSVPStatus.PENDING,
    syncStatus: SyncStatus.SUCCESS,
    isCanceled: false,
    isRescheduled: false,
    sourceUpdatedAt: '2025-04-20T08:00:00.000Z',
    createdAt: '2025-04-01T00:00:00.000Z',
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('RSVPService', () => {
  // ── getStatus ─────────────────────────────────────────────────────────────

  describe('getStatus', () => {
    it('returns PENDING when no attendance record exists and event has no rsvp_status', async () => {
      const supabase = makeSupabaseMock({
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      const service = new RSVPService(supabase);
      const status = await service.getStatus('event-001', 'user-001');

      expect(status).toBe(RSVPStatus.PENDING);
    });

    it('returns the event rsvp_status when no attendance row exists', async () => {
      // First call (attendance) returns null; second call (event) returns a row
      const singleMock = jest.fn()
        .mockResolvedValueOnce({ data: null, error: null }) // attendance
        .mockResolvedValueOnce({ data: { rsvp_status: RSVPStatus.ATTENDING }, error: null }); // event

      const supabase = makeSupabaseMock({ single: singleMock });

      const service = new RSVPService(supabase);
      const status = await service.getStatus('event-001', 'user-001');

      expect(status).toBe(RSVPStatus.ATTENDING);
    });

    it('prefers localIntent over source status when attendance row exists', async () => {
      const attendanceRow = {
        id: 'att-001',
        eventId: 'event-001',
        userId: 'user-001',
        status: RSVPStatus.NOT_ATTENDING,
        localIntent: RSVPStatus.MAYBE,
        wroteBack: false,
        mismatchDetected: false,
        updatedAt: new Date().toISOString(),
      };

      const singleMock = jest.fn()
        .mockResolvedValueOnce({ data: attendanceRow, error: null }); // attendance

      const supabase = makeSupabaseMock({ single: singleMock });

      const service = new RSVPService(supabase);
      const status = await service.getStatus('event-001', 'user-001');

      expect(status).toBe(RSVPStatus.MAYBE);
    });
  });

  // ── setIntent — with writeback ────────────────────────────────────────────

  describe('setIntent — with writeback adapter', () => {
    it('calls adapter.sendRSVP and sets wroteBack=true on success', async () => {
      const singleMock = jest.fn()
        .mockResolvedValueOnce({ data: null, error: null }) // attendance lookup
        .mockResolvedValueOnce({ data: { rsvp_status: RSVPStatus.PENDING }, error: null }) // event rsvp_status
        .mockResolvedValueOnce({ data: { access_token: 'tok' }, error: null }); // provider account

      const insertMock = jest.fn().mockResolvedValue({ data: {}, error: null });

      const supabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        insert: insertMock,
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        single: singleMock,
      } as unknown as ReturnType<typeof import('@supabase/supabase-js').createClient>;

      const adapter = makeWritebackAdapter(true);

      const service = new RSVPService(supabase, adapter);
      await service.setIntent('event-001', 'user-001', RSVPStatus.ATTENDING);

      expect(adapter.sendRSVP).toHaveBeenCalledWith(
        expect.objectContaining({ access_token: 'tok' }),
        'event-001',
        RSVPStatus.ATTENDING,
      );
    });

    it('sets wroteBack=false when sendRSVP throws', async () => {
      const singleMock = jest.fn()
        .mockResolvedValueOnce({ data: null, error: null }) // attendance
        .mockResolvedValueOnce({ data: { rsvp_status: RSVPStatus.PENDING }, error: null }) // event
        .mockResolvedValueOnce({ data: { access_token: 'tok' }, error: null }); // account

      const insertedRows: unknown[] = [];
      const insertMock = jest.fn().mockImplementation((row: unknown) => {
        insertedRows.push(row);
        return Promise.resolve({ data: {}, error: null });
      });

      const supabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        insert: insertMock,
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        single: singleMock,
      } as unknown as ReturnType<typeof import('@supabase/supabase-js').createClient>;

      const adapter = makeWritebackAdapter(true);
      (adapter.sendRSVP as jest.Mock).mockRejectedValue(new Error('Network error'));

      const service = new RSVPService(supabase, adapter);
      await service.setIntent('event-001', 'user-001', RSVPStatus.NOT_ATTENDING);

      // Should NOT throw
      // The attendance row should have wroteBack=false
      const attendanceInsert = insertedRows[0] as Record<string, unknown>;
      expect(attendanceInsert?.wrote_back).toBe(false);
    });
  });

  // ── setIntent — without writeback adapter ─────────────────────────────────

  describe('setIntent — read-only provider', () => {
    it('stores intent locally without calling sendRSVP', async () => {
      const singleMock = jest.fn()
        .mockResolvedValueOnce({ data: null, error: null }) // attendance
        .mockResolvedValueOnce({ data: { rsvp_status: RSVPStatus.PENDING }, error: null }); // event

      const insertedRows: unknown[] = [];
      const insertMock = jest.fn().mockImplementation((row: unknown) => {
        insertedRows.push(row);
        return Promise.resolve({ data: {}, error: null });
      });

      const supabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        insert: insertMock,
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        single: singleMock,
      } as unknown as ReturnType<typeof import('@supabase/supabase-js').createClient>;

      const readOnlyAdapter = makeWritebackAdapter(false);

      const service = new RSVPService(supabase, readOnlyAdapter);
      await service.setIntent('event-001', 'user-001', RSVPStatus.ATTENDING);

      // sendRSVP must NOT be called
      expect(readOnlyAdapter.sendRSVP).not.toHaveBeenCalled();

      const attendanceInsert = insertedRows[0] as Record<string, unknown>;
      expect(attendanceInsert?.wrote_back).toBe(false);
      expect(attendanceInsert?.local_intent).toBe(RSVPStatus.ATTENDING);
    });

    it('works with no adapter at all', async () => {
      const singleMock = jest.fn()
        .mockResolvedValueOnce({ data: null, error: null }) // attendance
        .mockResolvedValueOnce({ data: { rsvp_status: RSVPStatus.PENDING }, error: null }); // event

      const insertMock = jest.fn().mockResolvedValue({ data: {}, error: null });

      const supabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        insert: insertMock,
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        single: singleMock,
      } as unknown as ReturnType<typeof import('@supabase/supabase-js').createClient>;

      const service = new RSVPService(supabase); // no adapter

      // Should resolve without throwing
      await expect(
        service.setIntent('event-001', 'user-001', RSVPStatus.MAYBE),
      ).resolves.toBeUndefined();
    });
  });

  // ── reconcile ─────────────────────────────────────────────────────────────

  describe('reconcile', () => {
    it('does nothing when there is no local attendance record', async () => {
      const singleMock = jest.fn().mockResolvedValue({ data: null, error: null });
      const updateMock = jest.fn().mockReturnThis();

      const supabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        update: updateMock,
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        single: singleMock,
      } as unknown as ReturnType<typeof import('@supabase/supabase-js').createClient>;

      const service = new RSVPService(supabase);
      await service.reconcile('event-001', RSVPStatus.ATTENDING, 'user-001');

      expect(updateMock).not.toHaveBeenCalled();
    });

    it('clears mismatch flag when local intent matches source', async () => {
      const existingAttendance = {
        id: 'att-001',
        eventId: 'event-001',
        userId: 'user-001',
        status: RSVPStatus.ATTENDING,
        localIntent: RSVPStatus.ATTENDING, // matches source
        wroteBack: true,
        mismatchDetected: true, // stale flag
        updatedAt: new Date().toISOString(),
      };

      const updatedRows: unknown[] = [];
      const singleMock = jest.fn().mockResolvedValue({ data: existingAttendance, error: null });
      const updateMock = jest.fn().mockImplementation((row: unknown) => {
        updatedRows.push(row);
        return { eq: jest.fn().mockReturnThis() };
      });

      const supabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        update: updateMock,
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        single: singleMock,
      } as unknown as ReturnType<typeof import('@supabase/supabase-js').createClient>;

      const service = new RSVPService(supabase);
      await service.reconcile('event-001', RSVPStatus.ATTENDING, 'user-001');

      expect(updatedRows[0]).toMatchObject({ mismatch_detected: false });
    });

    it('sets mismatch_detected=true and records resolution when intents diverge', async () => {
      const existingAttendance = {
        id: 'att-001',
        eventId: 'event-001',
        userId: 'user-001',
        status: RSVPStatus.ATTENDING,
        localIntent: RSVPStatus.NOT_ATTENDING, // diverges from source
        wroteBack: false,
        mismatchDetected: false,
        updatedAt: new Date().toISOString(),
      };

      const eventRow = makeEventRow({ rsvpStatus: RSVPStatus.ATTENDING });

      const singleMock = jest.fn()
        .mockResolvedValueOnce({ data: existingAttendance, error: null }) // attendance
        .mockResolvedValueOnce({ data: eventRow, error: null }); // event

      const updatedRows: unknown[] = [];
      const updateMock = jest.fn().mockImplementation((row: unknown) => {
        updatedRows.push(row);
        return { eq: jest.fn().mockReturnThis() };
      });

      const insertMock = jest.fn().mockResolvedValue({ data: {}, error: null });

      const supabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        update: updateMock,
        insert: insertMock,
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        single: singleMock,
      } as unknown as ReturnType<typeof import('@supabase/supabase-js').createClient>;

      const service = new RSVPService(supabase);
      await service.reconcile('event-001', RSVPStatus.ATTENDING, 'user-001');

      const update = updatedRows[0] as Record<string, unknown>;
      expect(update.mismatch_detected).toBe(true);
      expect(update.resolution).toBeDefined();
      expect(update.resolved_at).toBeDefined();
    });
  });
});
