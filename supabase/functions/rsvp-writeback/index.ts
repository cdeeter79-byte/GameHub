import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Supabase Edge Function: rsvp-writeback
 *
 * Accepts: POST { eventId: string; status: 'ATTENDING' | 'NOT_ATTENDING' | 'MAYBE' }
 * Header:  Authorization: Bearer <supabase_session_token>
 *
 * 1. Resolves the user's TeamSnap member_id for the event's team
 *    (first call fetches from /members/search, then caches in provider_accounts.metadata)
 * 2. Searches for an existing TeamSnap availability for that member+event;
 *    PUTs to update if found, POSTs to create if not
 * 3. Updates attendances.wrote_back = true on success
 */

const TS_BASE = 'https://apiv3.teamsnap.com';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// TeamSnap RSVP status codes: 1 = yes, 2 = maybe, 0 = no.
// (Empirically verified: a "No" set via TeamSnap's web console stores status_code=0.
//  status_code=3 round-trips as status="Unknown", i.e. not a valid response on this account.)
const STATUS_CODE_MAP: Record<string, number> = {
  ATTENDING: 1,
  MAYBE: 2,
  NOT_ATTENDING: 0,
};

function extractFields(item: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!Array.isArray(item['data'])) return out;
  for (const field of item['data'] as Array<{ name: string; value: unknown }>) {
    out[field.name] = field.value;
  }
  return out;
}

async function tsGet(path: string, accessToken: string, params?: Record<string, string>) {
  const url = new URL(`${TS_BASE}${path}`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`TeamSnap GET ${path} failed: ${res.status} — ${body}`);
  }
  return res.json() as Promise<{ collection?: { items?: unknown[] } }>;
}

// TeamSnap v3 is Collection+JSON: writes MUST use a template body and
// the vnd.collection+json content type, or the server silently 200s
// while returning the empty template (no actual update applied).
function toCollectionJsonBody(fields: Record<string, string | number | boolean>) {
  return {
    template: {
      data: Object.entries(fields).map(([name, value]) => ({ name, value })),
    },
  };
}

async function tsWrite(
  url: string,
  method: 'POST' | 'PUT',
  accessToken: string,
  fields: Record<string, string | number | boolean>,
): Promise<Response> {
  return fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/vnd.collection+json',
      Accept: 'application/vnd.collection+json',
    },
    body: JSON.stringify(toCollectionJsonBody(fields)),
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });

  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error: authError } = await adminClient.auth.getUser(token);
    if (authError || !user) return json({ error: 'Unauthorized' }, 401);

    const { eventId, status } = await req.json() as { eventId: string; status: string };
    if (!eventId || !status) return json({ error: 'Missing eventId or status' }, 400);

    const statusCode = STATUS_CODE_MAP[status];
    if (statusCode == null) return json({ error: `Unknown status: ${status}` }, 400);

    // ── 1. Look up event ───────────────────────────────────────────────────────
    const { data: eventRow } = await adminClient
      .from('events')
      .select('external_id, provider_id, team_id, child_profile_id')
      .eq('id', eventId)
      .single();

    if (!eventRow) return json({ error: 'Event not found' }, 404);

    // For non-TeamSnap events, local-only RSVP is fine
    if (eventRow.provider_id !== 'teamsnap' || !eventRow.external_id) {
      return json({ success: true, wroteBack: false, reason: 'not_teamsnap' });
    }

    const tsEventId = String(eventRow.external_id);

    // ── 2. Look up team's TeamSnap ID ─────────────────────────────────────────
    const { data: teamRow } = await adminClient
      .from('teams')
      .select('external_id')
      .eq('id', eventRow.team_id)
      .single();

    if (!teamRow?.external_id) return json({ error: 'Team external ID not found' }, 404);
    const tsTeamId = String(teamRow.external_id);

    // ── 3. Get TeamSnap access token ──────────────────────────────────────────
    const { data: providerAccount } = await adminClient
      .from('provider_accounts')
      .select('access_token, metadata')
      .eq('user_id', user.id)
      .eq('provider_id', 'teamsnap')
      .single();

    if (!providerAccount?.access_token) return json({ error: 'TeamSnap not connected' }, 400);

    const accessToken = String(providerAccount.access_token);
    const metadata = (providerAccount.metadata ?? {}) as Record<string, unknown>;

    // ── 4. Collect every TeamSnap member this RSVP applies to ────────────────
    // Team events can apply to more than one of the user's kids (siblings on
    // one team). RSVP-ing "Going" from the app means "all my kids on this team
    // are going" — so we write availability for each linked member, not just
    // one. Fall back to the parent's own member only when no kids are linked.
    const memberIdsToWrite: string[] = [];

    const { data: myKids } = await adminClient
      .from('child_profiles')
      .select('id')
      .eq('parent_user_id', user.id);
    const kidIds = (myKids ?? []).map((k) => k['id'] as string);

    if (kidIds.length > 0) {
      const { data: linkRows } = await adminClient
        .from('child_provider_members')
        .select('external_member_id, child_profile_id')
        .eq('team_id', eventRow.team_id)
        .eq('provider_id', 'teamsnap')
        .in('child_profile_id', kidIds);
      for (const row of linkRows ?? []) {
        const mid = row['external_member_id'] ? String(row['external_member_id']) : null;
        if (mid && !memberIdsToWrite.includes(mid)) {
          memberIdsToWrite.push(mid);
          console.log(
            `[rsvp-writeback] Will write for member=${mid} (child=${row['child_profile_id']})`,
          );
        }
      }
    }

    // Legacy fallback for pre-migration data.
    if (memberIdsToWrite.length === 0 && eventRow.child_profile_id) {
      const { data: rosterRow } = await adminClient
        .from('roster_contacts')
        .select('external_id')
        .eq('team_id', eventRow.team_id)
        .eq('child_profile_id', eventRow.child_profile_id)
        .eq('provider_id', 'teamsnap')
        .maybeSingle();
      if (rosterRow?.external_id) memberIdsToWrite.push(String(rosterRow.external_id));
    }

    // Last-resort fallback: the parent's own member (teams where parent is the
    // player, e.g., adult leagues). Only used when no kid is linked to this team.
    if (memberIdsToWrite.length === 0) {
      const memberCacheKey = `member_id_${tsTeamId}`;
      let parentMid = metadata[memberCacheKey] ? String(metadata[memberCacheKey]) : null;

      if (!parentMid) {
        const meData = await tsGet('/me', accessToken);
        const meItems = meData.collection?.items ?? [];
        const meFields = meItems.length > 0 ? extractFields(meItems[0] as Record<string, unknown>) : {};
        const tsUserId = meFields['id'] ? String(meFields['id']) : null;
        if (tsUserId) {
          const membersData = await tsGet('/members/search', accessToken, {
            team_id: tsTeamId,
            user_id: tsUserId,
          });
          const memberItems = membersData.collection?.items ?? [];
          if (memberItems.length > 0) {
            const f = extractFields(memberItems[0] as Record<string, unknown>);
            parentMid = f['id'] ? String(f['id']) : null;
            if (parentMid) {
              await adminClient
                .from('provider_accounts')
                .update({ metadata: { ...metadata, [memberCacheKey]: parentMid } })
                .eq('user_id', user.id)
                .eq('provider_id', 'teamsnap');
            }
          }
        }
      }

      if (parentMid) {
        memberIdsToWrite.push(parentMid);
        console.log(`[rsvp-writeback] No kids linked; falling back to parent member=${parentMid}`);
      }
    }

    if (memberIdsToWrite.length === 0) {
      return json({ error: 'Could not resolve any TeamSnap member for this RSVP' }, 400);
    }

    // ── 5. Write availability for each member ────────────────────────────────
    async function writeOneAvailability(memberId: string): Promise<{ ok: boolean; error: string }> {
      const availData = await tsGet('/availabilities/search', accessToken, {
        team_id: tsTeamId,
        member_id: memberId,
      });
      const availItems = (availData.collection?.items ?? []) as Array<Record<string, unknown>>;
      const existing = availItems.find((item) => {
        const f = extractFields(item);
        return String(f['event_id']) === tsEventId;
      });

      if (existing) {
        const availHref = existing['href'] as string | undefined;
        const f = extractFields(existing);
        const availUrl = availHref ?? `${TS_BASE}/availabilities/${f['id']}`;
        console.log(`[rsvp-writeback] PUT ${availUrl} (member=${memberId}) → status_code=${statusCode}`);
        const res = await tsWrite(availUrl, 'PUT', accessToken, { status_code: statusCode });
        const body = await res.text();
        if (!res.ok) return { ok: false, error: body };

        // Verify via follow-up GET since PUT just echoes the template.
        try {
          const verifyRes = await fetch(availUrl, {
            headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.collection+json' },
          });
          const verifyBody = await verifyRes.text();
          const parsed = JSON.parse(verifyBody) as { collection?: { items?: unknown[] } };
          const items = parsed.collection?.items ?? [];
          if (items.length > 0) {
            const applied = extractFields(items[0] as Record<string, unknown>);
            const stored = applied['status_code'];
            console.log(`[rsvp-writeback] member=${memberId} stored status_code=${stored} (expected ${statusCode})`);
            if (stored !== statusCode) {
              return { ok: false, error: `stored=${stored} expected=${statusCode}` };
            }
          }
        } catch (err) {
          console.warn('[rsvp-writeback] verify fetch failed:', err);
        }
        return { ok: true, error: '' };
      } else {
        console.log(`[rsvp-writeback] POST new availability for member=${memberId}`);
        const res = await tsWrite(`${TS_BASE}/availabilities`, 'POST', accessToken, {
          team_id: Number(tsTeamId),
          member_id: Number(memberId),
          event_id: Number(tsEventId),
          status_code: statusCode,
        });
        const body = await res.text();
        console.log(`[rsvp-writeback] POST member=${memberId} response ${res.status}`);
        return { ok: res.ok, error: res.ok ? '' : body };
      }
    }

    const writeErrors: string[] = [];
    for (const mid of memberIdsToWrite) {
      const { ok, error } = await writeOneAvailability(mid);
      if (!ok) writeErrors.push(`member=${mid}: ${error}`);
    }
    const allOk = writeErrors.length === 0;
    if (!allOk) console.error('[rsvp-writeback] TeamSnap write failed:', writeErrors);

    // ── 6. Update attendances.wrote_back ─────────────────────────────────────
    await adminClient
      .from('attendances')
      .update({ wrote_back: allOk, updated_at: new Date().toISOString() })
      .eq('event_id', eventId)
      .eq('user_id', user.id);

    return json({
      success: true,
      wroteBack: allOk,
      membersWritten: memberIdsToWrite.length,
      ...(allOk ? {} : { error: writeErrors.join('; ') }),
    });

  } catch (err) {
    console.error('[rsvp-writeback] Unhandled error:', err);
    return json({ error: String(err) }, 500);
  }
});
