import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Supabase Edge Function: teamsnap-oauth
 *
 * Accepts: POST { code: string; redirectUri: string }
 * Header:  Authorization: Bearer <supabase_session_token>
 *
 * Exchanges the authorization code for TeamSnap OAuth tokens server-side
 * (keeping TEAMSNAP_CLIENT_SECRET off the device), then upserts the tokens
 * into provider_accounts for the authenticated user.
 */

const TOKEN_URL = 'https://auth.teamsnap.com/oauth/token';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const tsClientId = Deno.env.get('TEAMSNAP_CLIENT_ID') ?? '';
const tsClientSecret = Deno.env.get('TEAMSNAP_CLIENT_SECRET') ?? '';

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  // ── Verify caller identity via session JWT ─────────────────────────────────
  // Use service role client + explicit token to support both HS256 and ES256 JWTs
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  const adminClient = createClient(supabaseUrl, supabaseServiceKey);

  const { data: { user }, error: authError } = await adminClient.auth.getUser(token);
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  // ── Parse request body ─────────────────────────────────────────────────────
  let body: { code?: string; redirectUri?: string; codeVerifier?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const { code, redirectUri, codeVerifier } = body;
  if (!code || !redirectUri) {
    return new Response(JSON.stringify({ error: 'code and redirectUri are required' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  if (!tsClientId || !tsClientSecret) {
    return new Response(JSON.stringify({ error: 'TeamSnap credentials not configured on server' }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  // ── Exchange authorization code for tokens ─────────────────────────────────
  const tokenRes = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: tsClientId,
      client_secret: tsClientSecret,
      redirect_uri: redirectUri,
      ...(codeVerifier ? { code_verifier: codeVerifier } : {}),
    }),
  });

  if (!tokenRes.ok) {
    const detail = await tokenRes.text();
    return new Response(
      JSON.stringify({ error: 'Token exchange failed', detail }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }

  const tokenData = await tokenRes.json() as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };

  const expiresAt = tokenData.expires_in
    ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
    : null;

  // ── Persist tokens in provider_accounts ───────────────────────────────────
  const { error: upsertError } = await adminClient
    .from('provider_accounts')
    .upsert(
      {
        user_id: user.id,
        provider_id: 'teamsnap',
        auth_strategy: 'oauth2',
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token ?? null,
        expires_at: expiresAt,
        connected_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,provider_id' },
    );

  if (upsertError) {
    return new Response(
      JSON.stringify({ error: 'Failed to save credentials', detail: upsertError.message }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }

  return new Response(
    JSON.stringify({ success: true, userId: user.id }),
    { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
  );
});
