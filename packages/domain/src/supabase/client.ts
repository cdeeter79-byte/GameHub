// Supabase client singleton — platform-safe for Expo (iOS/Android/Web + SSR)

import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// ─── Environment Variables ─────────────────────────────────────────────────────

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

// ─── Platform-safe Storage Adapter ────────────────────────────────────────────
// On web (browser): use localStorage
// On native (iOS/Android): use AsyncStorage
// On SSR (server-side render during static export): use no-op (no window/storage)

function buildStorageAdapter() {
  // SSR guard — no storage available during server-side rendering
  if (typeof window === 'undefined') {
    return undefined;
  }

  // Web browser — use localStorage
  if (Platform.OS === 'web') {
    return undefined; // Supabase uses localStorage by default on web
  }

  // Native — use AsyncStorage (lazy import to avoid SSR crash)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  return {
    getItem: (key: string): Promise<string | null> => AsyncStorage.getItem(key),
    setItem: (key: string, value: string): Promise<void> => AsyncStorage.setItem(key, value),
    removeItem: (key: string): Promise<void> => AsyncStorage.removeItem(key),
  };
}

// ─── Singleton Client ─────────────────────────────────────────────────────────

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: buildStorageAdapter(),
    autoRefreshToken: true,
    persistSession: true,
    // On web, detect session from URL (for OAuth redirects)
    detectSessionInUrl: Platform.OS === 'web' && typeof window !== 'undefined',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      'x-app-name': 'gamehub',
      'x-app-version': process.env.EXPO_PUBLIC_APP_VERSION ?? 'unknown',
    },
  },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns the currently authenticated Supabase user, or null if not signed in.
 */
export async function getSupabaseUser(): Promise<User | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.warn('[GameHub] getSupabaseUser error:', error.message);
    return null;
  }

  return user ?? null;
}

/**
 * Returns the current session's access token, or null if not signed in.
 */
export async function getAccessToken(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

/**
 * Signs out the current user and clears all local session data.
 */
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(`[GameHub] Sign out failed: ${error.message}`);
  }
}

export default supabase;
