import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Supabase Edge Function: sync-provider
 *
 * Accepts: POST { userId: string; providerId: string }
 * Header:  Authorization: Bearer <supabase_session_token>
 *
 * Fetches teams + events from the provider (TeamSnap) and upserts them
 * into the GameHub database. Creates a sync_job record to track progress.
 */

// Official API base URL (confirmed from teamsnap-javascript-sdk source: apiv3.teamsnap.com)
const TS_BASE = 'https://apiv3.teamsnap.com';
const TS_TOKEN_URL = 'https://auth.teamsnap.com/oauth/token';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const tsClientId = Deno.env.get('TEAMSNAP_CLIENT_ID') ?? '';
const tsClientSecret = Deno.env.get('TEAMSNAP_CLIENT_SECRET') ?? '';

// ── Collection+JSON helpers ───────────────────────────────────────────────────

function extractFields(item: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!Array.isArray(item['data'])) return out;
  for (const field of item['data'] as Array<{ name: string; value: unknown }>) {
    out[field.name] = field.value;
  }
  return out;
}

// ── Enum mappers ──────────────────────────────────────────────────────────────

const SPORT_MAP: Record<string, string> = {
  soccer: 'SOCCER',
  basketball: 'BASKETBALL',
  baseball: 'BASEBALL',
  softball: 'SOFTBALL',
  lacrosse: 'LACROSSE',
  hockey: 'HOCKEY',
  'ice hockey': 'HOCKEY',
  football: 'FOOTBALL',
  'flag football': 'FOOTBALL',
  volleyball: 'VOLLEYBALL',
  tennis: 'TENNIS',
  swimming: 'SWIMMING',
};

function mapSport(name: string): string {
  return SPORT_MAP[name.toLowerCase()] ?? 'OTHER';
}

function mapRole(f: Record<string, unknown>): string {
  if (f['is_owner'] === true || f['is_manager'] === true) return 'MANAGER';
  if (f['is_non_player'] === true) return 'COACH';
  return 'PLAYER';
}

// TeamSnap availability status codes: 1=yes, 2=maybe, 0=no.
// (Empirically verified — status_code=3 round-trips as status="Unknown" and is not
//  a valid response code; a missing availability record means the member hasn't replied.)
const TS_STATUS_CODE_MAP: Record<number, string> = {
  1: 'ATTENDING',
  2: 'MAYBE',
  0: 'NOT_ATTENDING',
};

/**
 * TeamSnap events use a boolean `is_game` field — no `event_type` string field exists.
 * Infer practice/meeting/tournament from the event name when is_game is false.
 */
function mapEventType(isGame: boolean, name: string): string {
  if (isGame) return 'GAME';
  const lower = name.toLowerCase();
  if (lower.includes('practice')) return 'PRACTICE';
  if (lower.includes('meeting')) return 'MEETING';
  if (lower.includes('tournament')) return 'TOURNAMENT';
  return 'OTHER';
}

// ── TeamSnap API wrapper ──────────────────────────────────────────────────────

async function tsGet(
  path: string,
  accessToken: string,
  params?: Record<string, string>,
): Promise<{ collection: { items: Array<Record<string, unknown>> } }> {
  const url = new URL(`${TS_BASE}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) {
    throw new Error(`TeamSnap API ${path} returned ${res.status}`);
  }
  return res.json();
}

// ── Token refresh ─────────────────────────────────────────────────────────────

async function refreshTeamSnapToken(
  refreshToken: string,
): Promise<{ access_token: string; refresh_token?: string; expires_in?: number } | null> {
  if (!tsClientId || !tsClientSecret) return null;
  const res = await fetch(TS_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: tsClientId,
      client_secret: tsClientSecret,
    }),
  });
  if (!res.ok) return null;
  return res.json();
}

// ── Main handler ──────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS });
  }

  // ── Verify caller ──────────────────────────────────────────────────────────
  // Use service role client + explicit token to support both HS256 and ES256 JWTs
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  // ── Parse body ─────────────────────────────────────────────────────────────
  let body: { userId?: string; providerId?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const { userId, providerId } = body;
  if (!userId || !providerId) {
    return new Response(JSON.stringify({ error: 'userId and providerId required' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  // Callers can only sync their own data
  if (userId !== user.id) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  // ── Create sync job ────────────────────────────────────────────────────────
  const { data: job, error: jobError } = await supabase
    .from('sync_jobs')
    .insert({ user_id: userId, provider_id: providerId, status: 'IN_PROGRESS' })
    .select()
    .single();

  if (jobError || !job) {
    return new Response(JSON.stringify({ error: 'Failed to create sync job' }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const jobId = job['id'] as string;

  try {
    // ── Fetch provider account ───────────────────────────────────────────────
    const { data: account } = await supabase
      .from('provider_accounts')
      .select('access_token, refresh_token, expires_at')
      .eq('user_id', userId)
      .eq('provider_id', providerId)
      .single();

    if (!account) throw new Error(`No provider account found for ${providerId}`);

    let accessToken = account['access_token'] as string;

    // ── Refresh token if expired ─────────────────────────────────────────────
    const expiresAt = account['expires_at'] ? new Date(account['expires_at'] as string) : null;
    if (expiresAt && expiresAt < new Date() && account['refresh_token']) {
      const refreshed = await refreshTeamSnapToken(account['refresh_token'] as string);
      if (refreshed) {
        accessToken = refreshed.access_token;
        const newExpiry = refreshed.expires_in
          ? new Date(Date.now() + refreshed.expires_in * 1000).toISOString()
          : null;
        await supabase
          .from('provider_accounts')
          .update({
            access_token: refreshed.access_token,
            refresh_token: refreshed.refresh_token ?? account['refresh_token'],
            expires_at: newExpiry,
          })
          .eq('user_id', userId)
          .eq('provider_id', providerId);
      }
    }

    if (providerId !== 'teamsnap') {
      // Only TeamSnap is implemented — mark success with 0 entities
      await supabase.from('sync_jobs').update({
        status: 'SUCCESS',
        completed_at: new Date().toISOString(),
        entities_synced: 0,
        next_sync_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      }).eq('id', jobId);
      await supabase.from('provider_accounts')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('user_id', userId).eq('provider_id', providerId);
      return new Response(
        JSON.stringify({ success: true, jobId, entitiesSynced: 0 }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    // ── Fetch TeamSnap teams ─────────────────────────────────────────────────
    // TeamSnap v3: /teams requires a user_id filter. Fetch /me first to get it.
    const meData = await tsGet('/me', accessToken);
    const meItems = meData.collection?.items ?? [];
    const meFields = meItems.length > 0 ? extractFields(meItems[0] as Record<string, unknown>) : {};
    const tsUserId = meFields['id'] ? String(meFields['id']) : null;

    if (!tsUserId) throw new Error('Could not determine TeamSnap user ID from /me');

    const teamsData = await tsGet('/teams/search', accessToken, { user_id: tsUserId });
    const tsTeams = teamsData.collection?.items ?? [];

    // Load the user's children so we can tag events by the matching child.
    const userChildren: { id: string; firstName: string; lastName: string }[] = [];
    async function reloadUserChildren() {
      const { data: childRows } = await supabase
        .from('child_profiles')
        .select('id, first_name, last_name')
        .eq('parent_user_id', userId);
      userChildren.length = 0;
      for (const c of childRows ?? []) {
        userChildren.push({
          id: c['id'] as string,
          firstName: String(c['first_name'] ?? '').trim().toLowerCase(),
          lastName: String(c['last_name'] ?? '').trim().toLowerCase(),
        });
      }
    }
    await reloadUserChildren();

    // Tombstones: members the user explicitly dismissed from "My Kids".
    const { data: dismissedRows } = await supabase
      .from('dismissed_provider_members')
      .select('provider_id, external_member_id')
      .eq('user_id', userId);
    const dismissedMembers = new Set(
      (dismissedRows ?? []).map(
        (r) => `${r['provider_id']}:${r['external_member_id']}`,
      ),
    );

    // Existing child ↔ provider member links (for this user's children).
    const childIds = userChildren.map((c) => c.id);
    const { data: linkRows } = childIds.length > 0
      ? await supabase
          .from('child_provider_members')
          .select('child_profile_id, team_id, provider_id, external_member_id')
          .in('child_profile_id', childIds)
      : { data: [] as Array<Record<string, unknown>> };
    const linkByExtId = new Map<string, string>(); // "provider:external" -> child_profile_id
    for (const r of linkRows ?? []) {
      const key = `${r['provider_id']}:${r['external_member_id']}`;
      linkByExtId.set(key, r['child_profile_id'] as string);
    }

    // Load provider_accounts metadata so we can read/update the member_id cache.
    const { data: providerAccountMeta } = await supabase
      .from('provider_accounts')
      .select('metadata')
      .eq('user_id', userId)
      .eq('provider_id', providerId)
      .single();
    const providerMetadata =
      (providerAccountMeta?.['metadata'] as Record<string, unknown> | null) ?? {};

    let entitiesSynced = 0;

    for (const rawTeam of tsTeams) {
      const tf = extractFields(rawTeam);
      const teamExtId = String(tf['id'] ?? '');
      const teamName = String(tf['name'] ?? 'Unnamed Team');
      const sportName = String(tf['sport_name'] ?? '');
      const sport = mapSport(sportName);

      if (!teamExtId) continue;

      // Upsert team
      const { data: teamRow, error: teamErr } = await supabase
        .from('teams')
        .upsert(
          {
            name: teamName,
            sport,
            season: tf['season_name'] ? String(tf['season_name']) : null,
            age_group: tf['division_name'] ? String(tf['division_name']) : null,
            logo_url: tf['logo_url'] ? String(tf['logo_url']) : null,
            provider_id: 'teamsnap',
            external_id: teamExtId,
            created_by: userId,
          },
          { onConflict: 'provider_id,external_id' },
        )
        .select('id')
        .single();

      if (teamErr || !teamRow) continue;

      const teamId = teamRow['id'] as string;

      // Upsert user as team member (PARENT role)
      await supabase
        .from('team_members')
        .upsert(
          { team_id: teamId, user_id: userId, role: 'PARENT' },
          { onConflict: 'team_id,user_id', ignoreDuplicates: true },
        );

      // ── Fetch roster members first so we can tag events by the matching child ─
      let tsMembers: Array<Record<string, unknown>> = [];
      try {
        const membersData = await tsGet('/members/search', accessToken, { team_id: teamExtId });
        tsMembers = membersData.collection?.items ?? [];
      } catch {
        // Non-fatal: skip roster sync for this team and continue
      }

      // Find the player members on this team that belong to this user, creating
      // or linking child_profile rows as needed. child_provider_members is the
      // source of truth for the link — name is just a display property that can
      // be renamed without breaking RSVP addressing.
      const matchedChildren: { id: string; firstName: string; lastName: string }[] = [];
      let newlyCreatedChild = false;
      for (const rawMember of tsMembers) {
        const mf = extractFields(rawMember);
        const memberExtId = mf['id'] ? String(mf['id']) : null;
        if (!memberExtId) continue;

        const mFirstRaw = String(mf['first_name'] ?? '').trim();
        const mLastRaw = String(mf['last_name'] ?? '').trim();
        if (!mFirstRaw && !mLastRaw) continue;

        // Skip the parent's own member row (the parent isn't their own kid).
        const memberUserId = mf['user_id'] ? String(mf['user_id']) : null;
        if (memberUserId && memberUserId === tsUserId) continue;

        // Skip coach/manager-only members.
        if (mapRole(mf) !== 'PLAYER') continue;

        // Skip members the user explicitly dismissed from "My Kids".
        if (dismissedMembers.has(`${providerId}:${memberExtId}`)) continue;

        const mFirstLc = mFirstRaw.toLowerCase();
        const mLastLc = mLastRaw.toLowerCase();
        const linkKey = `${providerId}:${memberExtId}`;
        let childId = linkByExtId.get(linkKey) ?? null;

        if (childId) {
          // Already linked — keep the child's display name in sync with the provider.
          await supabase
            .from('child_profiles')
            .update({
              first_name: mFirstRaw,
              last_name: mLastRaw,
              updated_at: new Date().toISOString(),
            })
            .eq('id', childId);
        } else {
          // Try to adopt an existing manual child_profile by exact name match,
          // but only if that profile has no provider link yet (so we don't steal
          // a kid that's already linked to another provider/team).
          const nameMatch = userChildren.find(
            (c) => c.firstName === mFirstLc && c.lastName === mLastLc,
          );
          const nameMatchIsUnlinked =
            !!nameMatch && !Array.from(linkByExtId.values()).includes(nameMatch.id);

          if (nameMatch && nameMatchIsUnlinked) {
            childId = nameMatch.id;
          } else {
            const { data: newChild, error: childErr } = await supabase
              .from('child_profiles')
              .insert({
                parent_user_id: userId,
                first_name: mFirstRaw,
                last_name: mLastRaw,
              })
              .select('id')
              .single();
            if (childErr || !newChild) {
              console.warn(
                `[sync-provider] failed to create child for member ${memberExtId}:`,
                childErr,
              );
              continue;
            }
            childId = newChild['id'] as string;
            newlyCreatedChild = true;
          }

          await supabase
            .from('child_provider_members')
            .upsert(
              {
                child_profile_id: childId,
                team_id: teamId,
                provider_id: providerId,
                external_member_id: memberExtId,
              },
              { onConflict: 'provider_id,external_member_id' },
            );
          linkByExtId.set(linkKey, childId);
        }

        if (!matchedChildren.some((m) => m.id === childId)) {
          matchedChildren.push({ id: childId, firstName: mFirstRaw, lastName: mLastRaw });
        }
      }

      // Refresh local userChildren cache so later loops see freshly created kids.
      if (newlyCreatedChild) await reloadUserChildren();
      const eventChildName = matchedChildren.length > 0
        ? matchedChildren.map((c) => c.firstName).join(' & ')
        : null;
      const eventChildProfileId = matchedChildren.length === 1 ? matchedChildren[0].id : null;

      // ── Fetch events for this team ───────────────────────────────────────
      let tsEvents: Array<Record<string, unknown>> = [];
      try {
        const eventsData = await tsGet('/events/search', accessToken, { team_id: teamExtId });
        tsEvents = eventsData.collection?.items ?? [];
      } catch {
        // Non-fatal: skip events for this team but still sync members
      }

      for (const rawEvent of tsEvents) {
        const ef = extractFields(rawEvent);
        const eventExtId = String(ef['id'] ?? '');
        if (!eventExtId) continue;

        const startDate = ef['start_date'] ? String(ef['start_date']) : null;
        if (!startDate) continue;

        const eventName = String(ef['name'] ?? 'Event');
        // TeamSnap uses is_game (boolean) — no event_type string field
        const isGame = ef['is_game'] === true;
        const startAt = new Date(startDate).toISOString();
        const endAt = ef['end_date']
          ? new Date(String(ef['end_date'])).toISOString()
          : new Date(new Date(startDate).getTime() + 7200000).toISOString();

        // Location may be inlined as location_name/location_street etc.
        // or available only via the linked /locations resource
        const location = ef['location_name']
          ? {
              name: String(ef['location_name']),
              address: String(ef['location_street'] ?? ''),
              city: String(ef['location_city'] ?? ''),
              state: String(ef['location_state'] ?? ''),
              zip: ef['location_zip'] ? String(ef['location_zip']) : undefined,
              country: 'US',
            }
          : null;

        const { error: eventErr } = await supabase
          .from('events')
          .upsert(
            {
              title: eventName,
              type: mapEventType(isGame, eventName),
              sport,
              team_id: teamId,
              team_name: teamName,
              child_profile_id: eventChildProfileId,
              child_name: eventChildName,
              provider_id: 'teamsnap',
              external_id: eventExtId,
              start_at: startAt,
              end_at: endAt,
              location,
              opponent: ef['opponent_name'] ? String(ef['opponent_name']) : null,
              notes: ef['notes'] ? String(ef['notes']) : null,
              is_canceled: ef['canceled'] === true,
              is_rescheduled: ef['is_rescheduled'] === true,
              sync_status: 'SUCCESS',
              source_updated_at: ef['updated_at']
                ? new Date(String(ef['updated_at'])).toISOString()
                : null,
            },
            { onConflict: 'provider_id,external_id' },
          );

        if (!eventErr) entitiesSynced++;
      }

      // ── Pull this user's availabilities for the team ────────────────────
      // Mirrors the resolution used by rsvp-writeback so manual TeamSnap
      // changes flow back into GameHub's attendances table.
      try {
        const memberCacheKey = `member_id_${teamExtId}`;
        let tsMemberId = providerMetadata[memberCacheKey]
          ? String(providerMetadata[memberCacheKey])
          : null;

        if (!tsMemberId) {
          const membersData = await tsGet('/members/search', accessToken, {
            team_id: teamExtId,
            user_id: tsUserId,
          });
          const memberItems = membersData.collection?.items ?? [];
          if (memberItems.length > 0) {
            const f = extractFields(memberItems[0] as Record<string, unknown>);
            tsMemberId = f['id'] ? String(f['id']) : null;
            if (tsMemberId) {
              providerMetadata[memberCacheKey] = tsMemberId;
              await supabase
                .from('provider_accounts')
                .update({ metadata: providerMetadata })
                .eq('user_id', userId)
                .eq('provider_id', providerId);
            }
          }
        }

        if (tsMemberId) {
          // Map TeamSnap event external_id → GameHub event.id for this team
          const { data: teamEvents } = await supabase
            .from('events')
            .select('id, external_id')
            .eq('team_id', teamId)
            .eq('provider_id', 'teamsnap');

          const eventIdByExt = new Map<string, string>();
          for (const row of teamEvents ?? []) {
            const ext = row['external_id'] as string | null;
            if (ext) eventIdByExt.set(ext, row['id'] as string);
          }

          const availData = await tsGet('/availabilities/search', accessToken, {
            team_id: teamExtId,
            member_id: tsMemberId,
          });
          const availItems = (availData.collection?.items ?? []) as Array<Record<string, unknown>>;

          for (const rawAvail of availItems) {
            const af = extractFields(rawAvail);
            const codeRaw = af['status_code'];
            const code = typeof codeRaw === 'number' ? codeRaw : Number(codeRaw);
            const status = TS_STATUS_CODE_MAP[code];
            if (!status) continue; // unknown/invalid code, skip

            const tsEventExtId = af['event_id'] ? String(af['event_id']) : null;
            if (!tsEventExtId) continue;
            const eventDbId = eventIdByExt.get(tsEventExtId);
            if (!eventDbId) continue;

            // Only overwrite when the remote is authoritative (no pending local
            // change). If the user has a local_intent that hasn't been pushed,
            // flag the mismatch instead of clobbering.
            const { data: existing } = await supabase
              .from('attendances')
              .select('status, local_intent, wrote_back')
              .eq('event_id', eventDbId)
              .eq('user_id', userId)
              .maybeSingle();

            const hasPendingLocal =
              existing &&
              existing['wrote_back'] === false &&
              existing['local_intent'] != null &&
              existing['local_intent'] !== status;

            if (hasPendingLocal) {
              await supabase
                .from('attendances')
                .update({
                  mismatch_detected: true,
                  updated_at: new Date().toISOString(),
                })
                .eq('event_id', eventDbId)
                .eq('user_id', userId);
              continue;
            }

            await supabase
              .from('attendances')
              .delete()
              .eq('event_id', eventDbId)
              .eq('user_id', userId);

            await supabase.from('attendances').insert({
              event_id: eventDbId,
              user_id: userId,
              status,
              local_intent: status,
              wrote_back: true,
              mismatch_detected: false,
              updated_at: new Date().toISOString(),
            });
            entitiesSynced++;
          }
        }
      } catch (err) {
        console.warn(`[sync-provider] availability sync failed for team ${teamExtId}:`, err);
      }

      // ── Upsert roster contacts (reuses the tsMembers fetched earlier) ────
      for (const rawMember of tsMembers) {
        const mf = extractFields(rawMember);
        const firstName = String(mf['first_name'] ?? '').trim();
        const lastName = String(mf['last_name'] ?? '').trim();
        if (!firstName && !lastName) continue;

        const matchedChild = userChildren.find(
          (c) => c.firstName === firstName.toLowerCase() && c.lastName === lastName.toLowerCase(),
        );

        await supabase
          .from('roster_contacts')
          .upsert(
            {
              team_id: teamId,
              player_first_name: firstName,
              player_last_name: lastName,
              jersey_number: mf['jersey_number'] ? String(mf['jersey_number']) : null,
              position: mf['position_name'] ? String(mf['position_name']) : null,
              role: mapRole(mf),
              child_profile_id: matchedChild?.id ?? null,
              provider_id: providerId,
              external_id: mf['id'] ? String(mf['id']) : null,
            },
            { onConflict: 'team_id,player_first_name,player_last_name' },
          );

        entitiesSynced++;
      }

      entitiesSynced++; // count the team itself
    }

    // ── Finalize sync job ────────────────────────────────────────────────────
    await supabase.from('sync_jobs').update({
      status: 'SUCCESS',
      completed_at: new Date().toISOString(),
      entities_synced: entitiesSynced,
      next_sync_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    }).eq('id', jobId);

    await supabase.from('provider_accounts')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('provider_id', providerId);

    return new Response(
      JSON.stringify({ success: true, jobId, entitiesSynced }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';

    await supabase.from('sync_jobs').update({
      status: 'FAILED',
      completed_at: new Date().toISOString(),
      error: message,
    }).eq('id', jobId);

    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }
});
