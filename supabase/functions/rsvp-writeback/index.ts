import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Supabase Edge Function: rsvp-writeback
 *
 * Attempts to write an RSVP back to the source provider.
 * Called after user sets RSVP intent in the app.
 *
 * Body: { userId, eventId, status, childName? }
 */

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const WRITEBACK_CAPABLE_PROVIDERS = ['teamsnap'];

serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  let body: { userId: string; eventId: string; status: string; childName?: string };
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const { userId, eventId, status, childName } = body;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Fetch the event + provider
  const { data: event } = await supabase
    .from('events')
    .select('provider_id, external_id')
    .eq('id', eventId)
    .maybeSingle();

  if (!event) return new Response('Event not found', { status: 404 });

  const providerId = event['provider_id'] as string | null;
  const canWriteBack = providerId && WRITEBACK_CAPABLE_PROVIDERS.includes(providerId);

  if (!canWriteBack) {
    // Read-only provider — store local intent, inform caller
    await supabase.from('attendances').upsert({
      event_id: eventId,
      user_id: userId,
      local_intent: status,
      wrote_back: false,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'event_id,user_id,child_profile_id' });

    // Log audit entry
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: 'rsvp_local_intent',
      entity_type: 'attendance',
      entity_id: eventId,
      after_value: { status, wrote_back: false, provider: providerId, reason: 'provider_readonly' },
    });

    return new Response(
      JSON.stringify({
        success: true,
        wroteBack: false,
        message: `Your RSVP has been saved in GameHub. ${providerId ? `${providerId} does not support RSVP writeback.` : ''}`,
      }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Fetch provider token (decrypt in production via Supabase Vault)
  const { data: account } = await supabase
    .from('provider_accounts')
    .select('access_token')
    .eq('user_id', userId)
    .eq('provider_id', providerId)
    .maybeSingle();

  if (!account?.['access_token']) {
    return new Response('Provider not connected', { status: 401 });
  }

  try {
    // Provider-specific writeback (TeamSnap example)
    const statusCode = status === 'ATTENDING' ? 1 : status === 'NOT_ATTENDING' ? 2 : 3;
    const res = await fetch('https://api.teamsnap.com/v3/availabilities', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${account['access_token']}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        availability: {
          event_id: event['external_id'],
          status_code: statusCode,
          notes: childName ? `For: ${childName}` : undefined,
        },
      }),
    });

    const wroteBack = res.ok;

    await supabase.from('attendances').upsert({
      event_id: eventId,
      user_id: userId,
      status,
      local_intent: status,
      wrote_back: wroteBack,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'event_id,user_id,child_profile_id' });

    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: wroteBack ? 'rsvp_writeback_success' : 'rsvp_writeback_failed',
      entity_type: 'attendance',
      entity_id: eventId,
      after_value: { status, wrote_back: wroteBack, provider: providerId },
    });

    return new Response(
      JSON.stringify({ success: true, wroteBack }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Writeback failed';
    return new Response(JSON.stringify({ success: false, wroteBack: false, error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
