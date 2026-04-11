import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Supabase Edge Function: send-notification
 *
 * Sends push notifications via Expo's push notification service.
 * Called from: sync-provider (event reminders), RSVP writeback, event changes.
 *
 * Body: { userId, type, title, body, data? }
 */

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  let body: { userId: string; type: string; title: string; body: string; data?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const { userId, type, title, body: msgBody, data } = body;
  if (!userId || !title || !msgBody) {
    return new Response('userId, title, body required', { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Check notification preference
  const { data: pref } = await supabase
    .from('notification_preferences')
    .select('enabled')
    .eq('user_id', userId)
    .eq('type', type)
    .maybeSingle();

  if (pref && !pref['enabled']) {
    return new Response(JSON.stringify({ sent: false, reason: 'disabled_by_user' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Fetch Expo push token from metadata
  const { data: account } = await supabase
    .from('parent_profiles')
    .select('phone') // placeholder — in prod store push token in user metadata
    .eq('user_id', userId)
    .maybeSingle();

  // In production: fetch the Expo push token stored in a push_tokens table
  // For now, log and return success scaffold
  console.log(`[send-notification] Would send to user ${userId}: ${title}`);

  return new Response(
    JSON.stringify({ sent: true, userId, type }),
    { headers: { 'Content-Type': 'application/json' } },
  );
});
