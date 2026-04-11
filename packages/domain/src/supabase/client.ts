// Supabase client singleton — platform-safe for Expo (iOS/Android/Web)
// URL polyfill must be imported before @supabase/supabase-js

import 'react-native-url-polyfill/auto';

import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Environment Variables ─────────────────────────────────────────────────────

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    '[GameHub] EXPO_PUBLIC_SUPABASE_URL is not set. ' +
      'Add it to your .env file or app.config.ts extra fields.',
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    '[GameHub] EXPO_PUBLIC_SUPABASE_ANON_KEY is not set. ' +
      'Add it to your .env file or app.config.ts extra fields.',
  );
}

// ─── AsyncStorage Auth Adapter ─────────────────────────────────────────────────
// Supabase uses this to persist session tokens on native platforms.
// On web, it falls back to localStorage automatically when no storage is provided,
// but we supply AsyncStorage explicitly so the same bundle works on both.

const ExpoSecureStorageAdapter = {
  getItem: (key: string): Promise<string | null> => {
    return AsyncStorage.getItem(key);
  },
  setItem: (key: string, value: string): Promise<void> => {
    return AsyncStorage.setItem(key, value);
  },
  removeItem: (key: string): Promise<void> => {
    return AsyncStorage.removeItem(key);
  },
};

// ─── Singleton Client ─────────────────────────────────────────────────────────

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStorageAdapter,
    // Automatically refresh the session when it's about to expire
    autoRefreshToken: true,
    // Persist session between app restarts
    persistSession: true,
    // Disable detecting the session from the URL (not applicable on native)
    detectSessionInUrl: false,
  },
  // Enable realtime only when explicitly subscribed — avoids unnecessary connections
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
 * Uses the cached session — does NOT make a network request.
 */
export async function getSupabaseUser(): Promise<User | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    // Session may be expired or missing — treat as unauthenticated
    console.warn('[GameHub] getSupabaseUser error:', error.message);
    return null;
  }

  return user ?? null;
}

/**
 * Returns the current session's access token, or null if not signed in.
 * Useful for passing to server-side functions or provider adapters.
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
