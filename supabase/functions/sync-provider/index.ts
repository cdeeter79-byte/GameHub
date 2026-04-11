import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Supabase Edge Function: sync-provider
 *
 * Triggered by: cron schedule (every 30 min per active provider account)
 * or on-demand via POST { userId, providerId }
 *
 * Does NOT import @gamehub/adapters directly (Deno environment).
 * Instead, calls the provider REST APIs or GraphQL endpoints
 * using the tokens stored in provider_accounts.
 *
 * In production: decrypt access_token using Supabase Vault before using.
 */

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let body: { userId?: string; providerId?: string };
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const { userId, providerId } = body;
  if (!userId || !providerId) {
    return new Response('userId and providerId required', { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Create sync job record
  const { data: job, error: jobError } = await supabase
    .from('sync_jobs')
    .insert({ user_id: userId, provider_id: providerId, status: 'IN_PROGRESS' })
    .select()
    .single();

  if (jobError || !job) {
    return new Response('Failed to create sync job', { status: 500 });
  }

  try {
    // Fetch provider credentials
    const { data: account } = await supabase
      .from('provider_accounts')
      .select('access_token, refresh_token, expires_at, metadata')
      .eq('user_id', userId)
      .eq('provider_id', providerId)
      .single();

    if (!account) {
      throw new Error(`No provider account found for ${providerId}`);
    }

    // Log sync job completion (actual sync logic would call provider APIs here)
    // For the scaffold, we mark as success with 0 entities synced
    await supabase
      .from('sync_jobs')
      .update({
        status: 'SUCCESS',
        completed_at: new Date().toISOString(),
        entities_synced: 0,
        next_sync_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      })
      .eq('id', job['id']);

    // Update last_sync_at on provider account
    await supabase
      .from('provider_accounts')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('provider_id', providerId);

    return new Response(
      JSON.stringify({ success: true, jobId: job['id'], entitiesSynced: 0 }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';

    await supabase
      .from('sync_jobs')
      .update({ status: 'FAILED', completed_at: new Date().toISOString(), error: message })
      .eq('id', job['id']);

    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
