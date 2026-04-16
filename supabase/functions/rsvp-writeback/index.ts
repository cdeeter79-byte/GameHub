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
      .select('external_id, provider_id, team_id')
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
    const memberCacheKey = `member_id_${tsTeamId}`;

    // ── 4. Resolve user's TeamSnap member_id (cached or fetched fresh) ─────────
    let tsMemberId: string | null = metadata[memberCacheKey] ? String(metadata[memberCacheKey]) : null;

    if (!tsMemberId) {
      // GET /me → TeamSnap user_id
      const meData = await tsGet('/me', accessToken);
      const meItems = meData.collection?.items ?? [];
      const meFields = meItems.length > 0 ? extractFields(meItems[0] as Record<string, unknown>) : {};
      const tsUserId = meFields['id'] ? String(meFields['id']) : null;
      if (!tsUserId) throw new Error('Could not get TeamSnap user ID from /me');

      // GET /members/search?team_id=&user_id= → member record
      const membersData = await tsGet('/members/search', accessToken, {
        team_id: tsTeamId,
        user_id: tsUserId,
      });
      const memberItems = membersData.collection?.items ?? [];
      if (memberItems.length > 0) {
        const f = extractFields(memberItems[0] as Record<string, unknown>);
        tsMemberId = f['id'] ? String(f['id']) : null;
        // Cache for next time
        if (tsMemberId) {
          await adminClient
            .from('provider_accounts')
            .update({ metadata: { ...metadata, [memberCacheKey]: tsMemberId } })
            .eq('user_id', user.id)
            .eq('provider_id', 'teamsnap');
        }
      }
    }

    if (!tsMemberId) {
      return json({ error: 'Could not resolve TeamSnap member ID for this user on this team' }, 400);
    }

    // ── 5. Find existing availability for this member + event ─────────────────
    const availData = await tsGet('/availabilities/search', accessToken, {
      team_id: tsTeamId,
      member_id: tsMemberId,
    });
    const availItems = (availData.collection?.items ?? []) as Array<Record<string, unknown>>;

    // Log what availabilities we found so we can debug member/event mapping
    console.log(`[rsvp-writeback] Found ${availItems.length} availabilities for member=${tsMemberId}`);
    for (const item of availItems.slice(0, 5)) {
      const f = extractFields(item);
      console.log(`  avail id=${f['id']} event_id=${f['event_id']} status_code=${f['status_code']} href=${item['href']}`);
    }

    const existingAvail = availItems.find((item) => {
      const f = extractFields(item);
      return String(f['event_id']) === tsEventId;
    });

    // ── 6. PUT to update or POST to create ────────────────────────────────────
    let writeOk = false;
    let writeError = '';

    if (existingAvail) {
      // Use href directly — more reliable than constructing URL from extracted id
      const availHref = existingAvail['href'] as string | undefined;
      const f = extractFields(existingAvail);
      const availUrl = availHref ?? `${TS_BASE}/availabilities/${f['id']}`;
      console.log(`[rsvp-writeback] PUT ${availUrl} → status_code=${statusCode}`);
      const res = await tsWrite(availUrl, 'PUT', accessToken, { status_code: statusCode });
      const resBody = await res.text();
      writeOk = res.ok;
      writeError = resBody;
      console.log(`[rsvp-writeback] PUT response ${res.status}:`, resBody);

      // Re-GET the availability to verify TeamSnap actually persisted our value.
      // The PUT response is just a template echo; only a follow-up fetch shows truth.
      if (writeOk) {
        try {
          const verifyRes = await fetch(availUrl, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: 'application/vnd.collection+json',
            },
          });
          const verifyBody = await verifyRes.text();
          console.log(`[rsvp-writeback] VERIFY GET ${verifyRes.status}:`, verifyBody);
          const parsed = JSON.parse(verifyBody) as { collection?: { items?: unknown[] } };
          const items = parsed.collection?.items ?? [];
          if (items.length > 0) {
            const applied = extractFields(items[0] as Record<string, unknown>);
            const stored = applied['status_code'];
            console.log(`[rsvp-writeback] Stored status_code=${stored} (expected ${statusCode})`);
            if (stored !== statusCode) {
              writeOk = false;
              writeError = `TeamSnap stored status_code=${stored} (expected ${statusCode})`;
            }
          }
        } catch (err) {
          console.warn('[rsvp-writeback] verify fetch failed:', err);
        }
      }
    } else {
      console.log(`[rsvp-writeback] No existing avail found for event=${tsEventId}, POSTing new one`);
      const res = await tsWrite(`${TS_BASE}/availabilities`, 'POST', accessToken, {
        team_id: Number(tsTeamId),
        member_id: Number(tsMemberId),
        event_id: Number(tsEventId),
        status_code: statusCode,
      });
      const resBody = await res.text();
      writeOk = res.ok;
      writeError = resBody;
      console.log(`[rsvp-writeback] POST response ${res.status}:`, resBody.substring(0, 300));
    }

    if (!writeOk) console.error('[rsvp-writeback] TeamSnap write failed:', writeError);

    // ── 7. Update attendances.wrote_back ──────────────────────────────────────
    await adminClient
      .from('attendances')
      .update({ wrote_back: writeOk, updated_at: new Date().toISOString() })
      .eq('event_id', eventId)
      .eq('user_id', user.id);

    return json({ success: true, wroteBack: writeOk, ...(writeOk ? {} : { error: writeError }) });

  } catch (err) {
    console.error('[rsvp-writeback] Unhandled error:', err);
    return json({ error: String(err) }, 500);
  }
});
