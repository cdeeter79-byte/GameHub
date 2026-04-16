import { useEffect, useState } from 'react';
import * as AuthSession from 'expo-auth-session';
import { supabase } from '@gamehub/domain';
import { useAuth } from './useAuth';

/**
 * Hook for connecting a sports platform via OAuth.
 * Currently supports TeamSnap; other providers can be added here.
 *
 * Usage:
 *   const { connect, disconnect, isConnecting, isConnected, isReady, error } =
 *     useProviderConnect('teamsnap');
 */

const TEAMSNAP_DISCOVERY: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: 'https://auth.teamsnap.com/oauth/authorize',
  tokenEndpoint: 'https://auth.teamsnap.com/oauth/token',
};

export function useProviderConnect(providerId: string) {
  const { session } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientId = process.env['EXPO_PUBLIC_TEAMSNAP_CLIENT_ID'] ?? '';
  const supabaseUrl = process.env['EXPO_PUBLIC_SUPABASE_URL'] ?? '';

  // Hardcode the redirect URI — makeRedirectUri() produces exp:// URLs in Expo Go
  // which TeamSnap rejects. The dev/production build always uses gamehub://.
  const redirectUri = 'gamehub://auth/callback';

  // Always call the hook unconditionally (React rules of hooks).
  // The hook is wired up for TeamSnap; we only act on the response when
  // providerId === 'teamsnap'.
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId,
      redirectUri,
      scopes: ['read', 'write'],
      responseType: AuthSession.ResponseType.Code,
    },
    TEAMSNAP_DISCOVERY,
  );

  // ── Check initial connection status ────────────────────────────────────────
  useEffect(() => {
    if (!session) return;
    supabase
      .from('provider_accounts')
      .select('id')
      .eq('provider_id', providerId)
      .maybeSingle()
      .then(({ data }) => setIsConnected(!!data));
  }, [session, providerId]);

  // ── Handle OAuth response ──────────────────────────────────────────────────
  useEffect(() => {
    if (!response || response.type !== 'success') {
      if (response?.type === 'error') {
        setError(response.error?.message ?? 'Authorization failed');
      }
      // Reset spinner on cancel/dismiss/error (any non-success outcome)
      if (response) setIsConnecting(false);
      return;
    }
    if (!session) return;
    if (providerId !== 'teamsnap') return;

    const code = response.params['code'];
    if (!code) {
      setError('No authorization code received');
      setIsConnecting(false);
      return;
    }

    // Exchange code server-side, then trigger a sync
    const run = async () => {
      setIsConnecting(true);
      setError(null);

      try {
        console.log('[TeamSnap OAuth] Exchanging code, supabaseUrl:', supabaseUrl ? 'set' : 'MISSING');
        // 1. Server-side token exchange (include PKCE code_verifier)
        let oauthRes: Response;
        try {
          oauthRes = await fetch(`${supabaseUrl}/functions/v1/teamsnap-oauth`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ code, redirectUri, codeVerifier: request?.codeVerifier }),
          });
        } catch (fetchErr) {
          console.log('[TeamSnap OAuth] Fetch threw:', fetchErr);
          throw new Error('Network error reaching auth server');
        }

        if (!oauthRes.ok) {
          const data: { error?: string; detail?: string } = await oauthRes.json();
          console.log('[TeamSnap OAuth] Edge function error:', data);
          throw new Error(data.error ?? 'OAuth token exchange failed');
        }

        console.log('[TeamSnap OAuth] Token exchange succeeded');
        setIsConnected(true);

        // 2. Kick off initial sync (fire-and-forget; UI will poll via useUpcomingEvents)
        fetch(`${supabaseUrl}/functions/v1/sync-provider`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ userId: session.user.id, providerId }),
        }).catch(() => {
          // Non-fatal: sync can be retried; connection is already stored
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Connection failed');
        setIsConnected(false);
      } finally {
        setIsConnecting(false);
      }
    };

    run();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  // ── Public API ─────────────────────────────────────────────────────────────

  async function connect() {
    if (providerId !== 'teamsnap') {
      setError(`${providerId} OAuth is not yet implemented`);
      return;
    }
    if (!clientId) {
      setError('TeamSnap client ID not configured (EXPO_PUBLIC_TEAMSNAP_CLIENT_ID)');
      return;
    }
    if (!request) {
      setError('Auth session not ready — please try again in a moment');
      return;
    }
    setError(null);
    setIsConnecting(true);
    await promptAsync();
    // isConnecting will be reset in the response effect above
  }

  function clearError() {
    setError(null);
  }

  async function disconnect() {
    if (!session) return;
    const { error: delErr } = await supabase
      .from('provider_accounts')
      .delete()
      .eq('user_id', session.user.id)
      .eq('provider_id', providerId);
    if (!delErr) {
      setIsConnected(false);
      setError(null);
    }
  }

  async function sync() {
    if (!session || !isConnected) return;
    setIsSyncing(true);
    setError(null);
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/sync-provider`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ userId: session.user.id, providerId }),
      });
      if (!res.ok) {
        const data: { error?: string } = await res.json();
        throw new Error(data.error ?? 'Sync failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  }

  return {
    connect,
    disconnect,
    sync,
    clearError,
    isConnecting,
    isSyncing,
    isConnected,
    isReady: !!request,
    error,
  };
}
