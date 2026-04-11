// GameHub RSVP Service
// Manages local RSVP intent and writeback to source providers

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Event, ExternalEvent, ProviderAdapter, Attendance } from '../models/index';
import { RSVPStatus, ConflictResolution } from '../models/index';
import { ConflictResolver } from '../sync/conflict';

// ─── RSVPService ──────────────────────────────────────────────────────────────

export class RSVPService {
  private readonly supabase: SupabaseClient;
  private readonly resolver: ConflictResolver;
  /** Optional adapter for writeback — may be undefined for read-only providers */
  private readonly adapter?: ProviderAdapter;

  constructor(supabase: SupabaseClient, adapter?: ProviderAdapter) {
    this.supabase = supabase;
    this.resolver = new ConflictResolver();
    this.adapter = adapter;
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  /**
   * Returns the current RSVP status for a user/child on an event.
   * Prefers the local intent if set; falls back to the source provider status.
   */
  async getStatus(
    eventId: string,
    userId: string,
    childProfileId?: string,
  ): Promise<RSVPStatus> {
    const attendance = await this.fetchAttendance(eventId, userId, childProfileId);

    if (!attendance) {
      // No attendance record yet — fetch the event's rsvp_status from source
      const { data: event } = await this.supabase
        .from('events')
        .select('rsvp_status')
        .eq('id', eventId)
        .single();

      return (event?.rsvp_status as RSVPStatus) ?? RSVPStatus.PENDING;
    }

    // Prefer local intent over source status
    return attendance.localIntent ?? attendance.status ?? RSVPStatus.PENDING;
  }

  /**
   * Records the user's RSVP intent locally and attempts writeback to the
   * source provider if the adapter supports it.
   *
   * If writeback is not supported, the intent is stored locally with wroteBack=false.
   */
  async setIntent(
    eventId: string,
    userId: string,
    status: RSVPStatus,
    childProfileId?: string,
  ): Promise<void> {
    const now = new Date().toISOString();
    let wroteBack = false;
    let writebackNote: string | undefined;

    // Attempt writeback if the adapter supports it
    if (this.adapter?.capabilities.canWriteRSVP && this.adapter.sendRSVP) {
      // Fetch the provider account for this user
      const { data: account } = await this.supabase
        .from('provider_accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('provider_id', this.adapter.providerId)
        .single();

      if (account) {
        try {
          await this.adapter.sendRSVP(account, eventId, status);
          wroteBack = true;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          writebackNote = `Writeback failed: ${msg}`;
          console.warn(`[RSVPService] Writeback failed for event ${eventId}:`, msg);
        }
      } else {
        writebackNote = 'No provider account found for writeback.';
      }
    } else {
      writebackNote = this.adapter
        ? `Provider ${this.adapter.providerId} does not support RSVP writeback.`
        : 'No adapter configured — storing intent locally only.';
    }

    // Upsert the attendance record
    const existing = await this.fetchAttendance(eventId, userId, childProfileId);

    const attendanceRow = {
      event_id: eventId,
      user_id: userId,
      child_profile_id: childProfileId ?? null,
      local_intent: status,
      wrote_back: wroteBack,
      mismatch_detected: false,
      updated_at: now,
      ...(writebackNote ? { notes: writebackNote } : {}),
    };

    if (existing) {
      await this.supabase
        .from('attendance')
        .update(attendanceRow)
        .eq('id', existing.id);
    } else {
      await this.supabase.from('attendance').insert({
        ...attendanceRow,
        // Inherit the source RSVP status from the event if available
        status: await this.getSourceStatus(eventId),
      });
    }

    // Emit audit log
    await this.emitAuditLog(userId, eventId, {
      action: 'rsvp.set_intent',
      before: existing?.localIntent,
      after: status,
      wroteBack,
    });
  }

  /**
   * Reconciles the local RSVP intent with the incoming source status.
   * Detects mismatches, resolves them via ConflictResolver, and updates
   * the attendance record with the outcome.
   */
  async reconcile(
    eventId: string,
    sourceStatus: RSVPStatus,
    userId: string,
    childProfileId?: string,
  ): Promise<void> {
    const now = new Date().toISOString();
    const attendance = await this.fetchAttendance(eventId, userId, childProfileId);

    if (!attendance) {
      // Nothing to reconcile — no local intent
      return;
    }

    const localIntent = attendance.localIntent;
    if (!localIntent || localIntent === sourceStatus) {
      // No mismatch — clear any prior mismatch flag
      if (attendance.mismatchDetected) {
        await this.supabase
          .from('attendance')
          .update({ mismatch_detected: false, updated_at: now })
          .eq('id', attendance.id);
      }
      return;
    }

    // Mismatch detected — resolve it
    const { data: eventRow } = await this.supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    const localEvent = eventRow as Event | null;
    const canWriteback = this.adapter?.capabilities.canWriteRSVP ?? false;

    // Build a minimal ExternalEvent for the resolver
    const externalSnapshot: ExternalEvent = {
      externalId: localEvent?.externalId ?? eventId,
      title: localEvent?.title ?? '',
      type: localEvent?.type ?? ('GAME' as any),
      startAt: localEvent?.startAt ?? now,
      endAt: localEvent?.endAt ?? now,
      isCanceled: localEvent?.isCanceled ?? false,
      isRescheduled: localEvent?.isRescheduled ?? false,
      rsvpStatus: sourceStatus,
      teamExternalId: localEvent?.teamId ?? '',
      sourceUpdatedAt: new Date().toISOString(),
    };

    const resolution = this.resolver.resolve(
      localEvent ?? {},
      externalSnapshot,
      // If the local intent was already written back, prefer local; otherwise newest wins
      attendance.wroteBack && canWriteback ? 'local_wins' : 'newest_wins',
    );

    const update: Record<string, unknown> = {
      mismatch_detected: true,
      resolved_at: now,
      resolution,
      updated_at: now,
    };

    if (resolution === ConflictResolution.SOURCE_WINS) {
      // Align local intent with source
      update.local_intent = sourceStatus;
      update.status = sourceStatus;
    }

    await this.supabase.from('attendance').update(update).eq('id', attendance.id);

    // Emit audit log
    await this.emitAuditLog(userId, eventId, {
      action: 'rsvp.reconcile',
      before: { localIntent, sourceStatus: attendance.status },
      after: { resolution, effectiveStatus: resolution === ConflictResolution.SOURCE_WINS ? sourceStatus : localIntent },
    });
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  private async fetchAttendance(
    eventId: string,
    userId: string,
    childProfileId?: string,
  ): Promise<Attendance | null> {
    let query = this.supabase
      .from('attendance')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', userId);

    if (childProfileId) {
      query = query.eq('child_profile_id', childProfileId);
    } else {
      query = query.is('child_profile_id', null);
    }

    const { data } = await query.single();
    return (data as Attendance) ?? null;
  }

  private async getSourceStatus(eventId: string): Promise<RSVPStatus> {
    const { data } = await this.supabase
      .from('events')
      .select('rsvp_status')
      .eq('id', eventId)
      .single();
    return (data?.rsvp_status as RSVPStatus) ?? RSVPStatus.PENDING;
  }

  private async emitAuditLog(
    userId: string,
    eventId: string,
    payload: {
      action: string;
      before: unknown;
      after: unknown;
      wroteBack?: boolean;
    },
  ): Promise<void> {
    try {
      await this.supabase.from('audit_logs').insert({
        user_id: userId,
        action: payload.action,
        entity_type: 'Attendance',
        entity_id: eventId,
        before: payload.before ?? null,
        after: payload.after,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      // Audit log failure is non-fatal
      console.warn('[RSVPService] Failed to write audit log:', err);
    }
  }
}
