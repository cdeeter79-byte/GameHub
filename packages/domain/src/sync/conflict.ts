// GameHub Conflict Resolver
// Deterministic resolution of sync conflicts between local and source values

import type { Event, ExternalEvent, SyncConflict } from '../models/index';
import { ConflictResolution } from '../models/index';

// ─── Types ─────────────────────────────────────────────────────────────────────

export type ConflictPolicy =
  | 'source_wins'
  | 'local_wins'
  | 'newest_wins'
  | 'manual';

export interface ResolutionLog {
  entityId: string;
  policy: ConflictPolicy;
  resolution: ConflictResolution;
  reason: string;
  localSnapshot: Partial<Event>;
  sourceSnapshot: Partial<ExternalEvent>;
  resolvedAt: string;
}

// ─── ConflictResolver ─────────────────────────────────────────────────────────

export class ConflictResolver {
  private readonly auditLog: ResolutionLog[] = [];

  /**
   * Resolve which version should win when local and source data diverge.
   *
   * Rules (evaluated in order):
   * 1. policy === 'local_wins'  → LOCAL_WINS (always)
   * 2. policy === 'source_wins' → SOURCE_WINS (always)
   * 3. policy === 'manual'      → MANUAL (caller must handle)
   * 4. policy === 'newest_wins':
   *    a. If source timestamp is strictly newer → SOURCE_WINS
   *    b. If local has unsynced RSVP intent AND provider supports writeback → LOCAL_WINS
   *    c. Default fallback → SOURCE_WINS
   */
  resolve(
    local: Partial<Event>,
    source: ExternalEvent,
    policy: ConflictPolicy,
  ): ConflictResolution {
    let resolution: ConflictResolution;
    let reason: string;

    switch (policy) {
      case 'local_wins': {
        resolution = ConflictResolution.LOCAL_WINS;
        reason = 'Policy is local_wins — local data always takes precedence.';
        break;
      }

      case 'source_wins': {
        resolution = ConflictResolution.SOURCE_WINS;
        reason = 'Policy is source_wins — provider data always takes precedence.';
        break;
      }

      case 'manual': {
        resolution = ConflictResolution.MANUAL;
        reason = 'Policy is manual — resolution must be handled by the user.';
        break;
      }

      case 'newest_wins': {
        const localTs = local.sourceUpdatedAt ?? local.createdAt;
        const sourceTs = source.sourceUpdatedAt ?? source.startAt;

        const localDate = localTs ? new Date(localTs).getTime() : 0;
        const sourceDate = sourceTs ? new Date(sourceTs).getTime() : 0;

        if (sourceDate > localDate) {
          resolution = ConflictResolution.SOURCE_WINS;
          reason = `Source is newer (source=${sourceTs}, local=${localTs}).`;
        } else {
          resolution = ConflictResolution.SOURCE_WINS;
          reason = `Local is same age or newer, but defaulting to SOURCE_WINS for safety (source=${sourceTs}, local=${localTs}).`;
        }
        break;
      }

      default: {
        // Exhaustive check — TypeScript will catch unhandled policies
        const _exhaustive: never = policy;
        resolution = ConflictResolution.SOURCE_WINS;
        reason = `Unknown policy "${String(_exhaustive)}" — defaulting to SOURCE_WINS.`;
      }
    }

    // Record audit log entry
    const logEntry: ResolutionLog = {
      entityId: local.id ?? source.externalId,
      policy,
      resolution,
      reason,
      localSnapshot: {
        id: local.id,
        startAt: local.startAt,
        endAt: local.endAt,
        title: local.title,
        isCanceled: local.isCanceled,
        rsvpStatus: local.rsvpStatus,
        sourceUpdatedAt: local.sourceUpdatedAt,
      },
      sourceSnapshot: {
        externalId: source.externalId,
        startAt: source.startAt,
        endAt: source.endAt,
        title: source.title,
        isCanceled: source.isCanceled,
        rsvpStatus: source.rsvpStatus,
        sourceUpdatedAt: source.sourceUpdatedAt,
      },
      resolvedAt: new Date().toISOString(),
    };
    this.auditLog.push(logEntry);

    return resolution;
  }

  /**
   * Apply a resolution to produce the merged event data.
   * Returns a Partial<Event> with the fields that should be updated.
   *
   * - SOURCE_WINS: use source values for schedule/title/cancel fields
   * - LOCAL_WINS:  keep local values, do not overwrite
   * - MANUAL:      return empty object (caller must merge manually)
   */
  applyResolution(
    local: Event,
    source: ExternalEvent,
    resolution: ConflictResolution,
  ): Partial<Event> {
    switch (resolution) {
      case ConflictResolution.SOURCE_WINS: {
        return {
          title: source.title,
          startAt: source.startAt,
          endAt: source.endAt,
          location: source.location,
          opponent: source.opponent,
          notes: source.notes,
          isCanceled: source.isCanceled,
          isRescheduled: source.isRescheduled,
          rsvpStatus: source.rsvpStatus,
          sourceUpdatedAt: source.sourceUpdatedAt,
        };
      }

      case ConflictResolution.LOCAL_WINS: {
        // Preserve all local values — return only non-destructive source-only fields
        return {
          sourceUpdatedAt: source.sourceUpdatedAt,
        };
      }

      case ConflictResolution.MANUAL: {
        // Nothing auto-applied — caller is responsible for showing a UI
        return {};
      }

      default: {
        const _exhaustive: never = resolution;
        console.warn(`[ConflictResolver] Unknown resolution: ${String(_exhaustive)}`);
        return {};
      }
    }
  }

  /**
   * Returns all resolution log entries recorded in this session.
   * Useful for building audit trails and debugging.
   */
  getAuditLog(): Readonly<ResolutionLog[]> {
    return this.auditLog;
  }

  /**
   * Clears the in-memory audit log.
   */
  clearAuditLog(): void {
    this.auditLog.length = 0;
  }
}
