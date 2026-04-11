// GameHub Sync Engine
// Orchestrates pulling data from a provider adapter and upserting into Supabase

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Event,
  ExternalEvent,
  ExternalTeam,
  ProviderAccount,
  ProviderAdapter,
  SyncJob,
  SyncConflict,
} from '../models/index';
import {
  SyncStatus,
  ConflictResolution,
  EventType,
} from '../models/index';
import type { ProviderId } from '@gamehub/config';
import { ConflictResolver } from './conflict';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface SyncResult {
  jobId: string;
  providerId: string;
  teamsFound: number;
  eventsUpserted: number;
  conflicts: number;
  errors: string[];
  durationMs: number;
}

export interface SyncContext {
  userId: string;
  account: ProviderAccount;
  jobId: string;
}

export type ProgressCallback = (info: {
  jobId: string;
  providerId: string;
  phase: 'teams' | 'events' | 'conflicts' | 'done';
  teamsFound?: number;
  eventsProcessed?: number;
  totalEvents?: number;
}) => void;

// ─── Retry Helper ─────────────────────────────────────────────────────────────

const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 1000;

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries - 1) {
        const delayMs = BASE_BACKOFF_MS * Math.pow(2, attempt); // 1s, 2s, 4s
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError;
}

// ─── SyncEngine ───────────────────────────────────────────────────────────────

export class SyncEngine {
  private readonly supabase: SupabaseClient;
  private readonly adapter: ProviderAdapter;
  private readonly resolver: ConflictResolver;
  public onProgress?: ProgressCallback;

  constructor(
    supabase: SupabaseClient,
    adapter: ProviderAdapter,
    onProgress?: ProgressCallback,
  ) {
    this.supabase = supabase;
    this.adapter = adapter;
    this.resolver = new ConflictResolver();
    this.onProgress = onProgress;
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  /**
   * Sync all connected provider accounts for a user.
   * Fetches provider accounts from Supabase and runs syncProvider for each.
   */
  async syncAll(userId: string): Promise<SyncResult[]> {
    const { data: accounts, error } = await this.supabase
      .from('provider_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('provider_id', this.adapter.providerId);

    if (error) {
      throw new Error(`[SyncEngine] Failed to fetch provider accounts: ${error.message}`);
    }

    if (!accounts || accounts.length === 0) {
      return [];
    }

    const results: SyncResult[] = [];
    for (const account of accounts) {
      const result = await this.syncProvider(userId, this.adapter.providerId as ProviderId, account);
      results.push(result);
    }

    return results;
  }

  /**
   * Sync a single provider account for a user.
   * Creates a SyncJob row, fetches teams + events, upserts, detects conflicts,
   * then updates the job to SUCCESS or FAILED.
   */
  async syncProvider(
    userId: string,
    providerId: ProviderId,
    account?: ProviderAccount,
  ): Promise<SyncResult> {
    const startedAt = Date.now();
    const errors: string[] = [];
    let teamsFound = 0;
    let eventsUpserted = 0;
    let conflicts = 0;

    // Resolve the provider account if not passed directly
    if (!account) {
      const { data, error } = await this.supabase
        .from('provider_accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('provider_id', providerId)
        .single();

      if (error || !data) {
        throw new Error(
          `[SyncEngine] No provider account found for userId=${userId}, providerId=${providerId}`,
        );
      }
      account = data as ProviderAccount;
    }

    // Create the SyncJob record
    const jobId = await this.createSyncJob(userId, providerId);

    const ctx: SyncContext = { userId, account, jobId };

    try {
      // Update job to IN_PROGRESS
      await this.updateJobStatus(jobId, SyncStatus.IN_PROGRESS);

      // Phase 1: Teams
      this.onProgress?.({ jobId, providerId, phase: 'teams' });
      const teams = await this.syncTeams(ctx);
      teamsFound = teams.length;

      this.onProgress?.({ jobId, providerId, phase: 'events', teamsFound });

      // Phase 2: Events for each team
      for (const team of teams) {
        try {
          const result = await this.syncEvents(ctx, team);
          eventsUpserted += result.upserted;
          conflicts += result.conflicts;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          errors.push(`Team ${team.externalId}: ${msg}`);
        }
      }

      this.onProgress?.({ jobId, providerId, phase: 'done', eventsProcessed: eventsUpserted });

      const finalStatus = errors.length > 0 ? SyncStatus.PARTIAL : SyncStatus.SUCCESS;
      await this.updateJobStatus(jobId, finalStatus, {
        entitiesSynced: eventsUpserted,
        error: errors.length > 0 ? errors.join('; ') : undefined,
      });

      // Update last sync timestamp on the provider account
      await this.supabase
        .from('provider_accounts')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', account.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(msg);
      await this.updateJobStatus(jobId, SyncStatus.FAILED, { error: msg });
    }

    return {
      jobId,
      providerId,
      teamsFound,
      eventsUpserted,
      conflicts,
      errors,
      durationMs: Date.now() - startedAt,
    };
  }

  // ─── Private: Teams ─────────────────────────────────────────────────────────

  private async syncTeams(ctx: SyncContext): Promise<ExternalTeam[]> {
    if (!this.adapter.capabilities.canFetchTeams) {
      return [];
    }

    const teams = await withRetry(() => this.adapter.fetchTeams(ctx.account));

    // Upsert each team into the local teams table
    for (const team of teams) {
      await this.supabase.from('teams').upsert(
        {
          external_id: team.externalId,
          provider_id: this.adapter.providerId,
          name: team.name,
          sport: team.sport,
          season: team.season,
          age_group: team.ageGroup,
          logo_url: team.logoUrl,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'external_id,provider_id' },
      );
    }

    return teams;
  }

  // ─── Private: Events ─────────────────────────────────────────────────────────

  private async syncEvents(
    ctx: SyncContext,
    team: ExternalTeam,
  ): Promise<{ upserted: number; conflicts: number }> {
    if (!this.adapter.capabilities.canFetchSchedule) {
      return { upserted: 0, conflicts: 0 };
    }

    // Use incremental sync if supported
    let since: string | undefined;
    if (this.adapter.capabilities.supportsIncrementalSync) {
      const { data: lastJob } = await this.supabase
        .from('sync_jobs')
        .select('completed_at')
        .eq('user_id', ctx.userId)
        .eq('provider_id', this.adapter.providerId)
        .eq('status', SyncStatus.SUCCESS)
        .order('completed_at', { ascending: false })
        .limit(1)
        .single();

      since = lastJob?.completed_at ?? undefined;
    }

    const externalEvents = await withRetry(() =>
      this.adapter.fetchEvents(ctx.account, team.externalId, since),
    );

    let upserted = 0;
    let conflicts = 0;

    for (const externalEvent of externalEvents) {
      try {
        const hadConflict = await this.upsertEvent(externalEvent, ctx.userId, ctx.jobId, team);
        upserted++;
        if (hadConflict) conflicts++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[SyncEngine] Failed to upsert event ${externalEvent.externalId}: ${msg}`);
      }
    }

    return { upserted, conflicts };
  }

  // ─── Private: Upsert Single Event ────────────────────────────────────────────

  private async upsertEvent(
    incoming: ExternalEvent,
    userId: string,
    jobId: string,
    team: ExternalTeam,
  ): Promise<boolean> {
    // Look up existing local event
    const { data: existing } = await this.supabase
      .from('events')
      .select('*')
      .eq('external_id', incoming.externalId)
      .eq('provider_id', this.adapter.providerId)
      .single();

    let hadConflict = false;

    if (existing) {
      const localEvent = existing as Event;
      const conflict = await this.detectConflicts(localEvent, incoming);

      if (conflict) {
        hadConflict = true;
        await this.recordConflict(conflict, jobId);

        if (conflict.resolution === ConflictResolution.LOCAL_WINS) {
          // Skip overwriting — preserve local values
          return hadConflict;
        }
      }
    }

    // Resolve team ID from external reference
    const { data: teamRow } = await this.supabase
      .from('teams')
      .select('id, name')
      .eq('external_id', team.externalId)
      .eq('provider_id', this.adapter.providerId)
      .single();

    const teamId: string = teamRow?.id ?? team.externalId;
    const teamName: string = teamRow?.name ?? team.name;

    await this.supabase.from('events').upsert(
      {
        external_id: incoming.externalId,
        provider_id: this.adapter.providerId,
        title: incoming.title,
        type: incoming.type,
        sport: incoming.sport,
        team_id: teamId,
        team_name: teamName,
        start_at: incoming.startAt,
        end_at: incoming.endAt,
        location: incoming.location ? JSON.stringify(incoming.location) : null,
        opponent: incoming.opponent,
        tournament_id: incoming.tournamentId,
        tournament_name: incoming.tournamentName,
        notes: incoming.notes,
        rsvp_status: incoming.rsvpStatus,
        sync_status: SyncStatus.SUCCESS,
        is_canceled: incoming.isCanceled,
        is_rescheduled: incoming.isRescheduled,
        source_updated_at: incoming.sourceUpdatedAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'external_id,provider_id' },
    );

    return hadConflict;
  }

  // ─── Private: Conflict Detection ─────────────────────────────────────────────

  private async detectConflicts(
    local: Event,
    incoming: ExternalEvent,
  ): Promise<SyncConflict | null> {
    // Check if there's a local RSVP intent that differs from the incoming value
    const { data: attendance } = await this.supabase
      .from('attendance')
      .select('*')
      .eq('event_id', local.id)
      .eq('mismatch_detected', false)
      .not('local_intent', 'is', null)
      .single();

    const hasLocalRSVPIntent = !!attendance?.local_intent;
    const canWriteback = this.adapter.capabilities.canWriteRSVP;

    const resolution = this.resolver.resolve(
      local,
      incoming,
      hasLocalRSVPIntent && canWriteback ? 'local_wins' : 'newest_wins',
    );

    // Only record a conflict when the resolution is meaningful
    const localUpdatedAt = local.sourceUpdatedAt ?? local.createdAt;
    const incomingUpdatedAt = incoming.sourceUpdatedAt ?? incoming.startAt;
    const hasDateChange =
      local.startAt !== incoming.startAt || local.endAt !== incoming.endAt;
    const hasTitleChange = local.title !== incoming.title;
    const hasCancelChange = local.isCanceled !== incoming.isCanceled;

    if (!hasDateChange && !hasTitleChange && !hasCancelChange && !hasLocalRSVPIntent) {
      return null;
    }

    const conflict: SyncConflict = {
      id: `${local.id}_${Date.now()}`,
      syncJobId: '', // will be set by caller
      entityType: 'Event',
      entityId: local.id,
      localValue: {
        startAt: local.startAt,
        endAt: local.endAt,
        title: local.title,
        isCanceled: local.isCanceled,
        rsvpStatus: local.rsvpStatus,
        sourceUpdatedAt: localUpdatedAt,
      },
      sourceValue: {
        startAt: incoming.startAt,
        endAt: incoming.endAt,
        title: incoming.title,
        isCanceled: incoming.isCanceled,
        rsvpStatus: incoming.rsvpStatus,
        sourceUpdatedAt: incomingUpdatedAt,
      },
      resolution,
      resolvedAt: new Date().toISOString(),
    };

    return conflict;
  }

  // ─── Private: Record Conflict ─────────────────────────────────────────────────

  private async recordConflict(conflict: SyncConflict, jobId: string): Promise<void> {
    await this.supabase.from('sync_conflicts').insert({
      sync_job_id: jobId,
      entity_type: conflict.entityType,
      entity_id: conflict.entityId,
      local_value: conflict.localValue,
      source_value: conflict.sourceValue,
      resolution: conflict.resolution,
      resolved_at: conflict.resolvedAt,
      notes: conflict.notes,
    });
  }

  // ─── Private: Job Management ──────────────────────────────────────────────────

  private async createSyncJob(userId: string, providerId: string): Promise<string> {
    const { data, error } = await this.supabase
      .from('sync_jobs')
      .insert({
        user_id: userId,
        provider_id: providerId,
        status: SyncStatus.PENDING,
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error || !data) {
      throw new Error(`[SyncEngine] Failed to create sync job: ${error?.message}`);
    }

    return data.id as string;
  }

  private async updateJobStatus(
    jobId: string,
    status: SyncStatus,
    extra?: { entitiesSynced?: number; error?: string },
  ): Promise<void> {
    const update: Record<string, unknown> = { status };

    if (status === SyncStatus.SUCCESS || status === SyncStatus.FAILED || status === SyncStatus.PARTIAL) {
      update.completed_at = new Date().toISOString();
    }

    if (extra?.entitiesSynced !== undefined) {
      update.entities_synced = extra.entitiesSynced;
    }

    if (extra?.error !== undefined) {
      update.error = extra.error;
    }

    await this.supabase.from('sync_jobs').update(update).eq('id', jobId);
  }
}
