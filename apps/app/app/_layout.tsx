// URL polyfill must come before any Supabase/fetch usage
import 'react-native-url-polyfill/auto';
// Global CSS for web dark background (global.native.ts is a no-op stub)
import '../global';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';

const BG = '#0F172A';
const SURFACE = '#1E293B';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  // Splash is hidden by app/index.tsx after the auth check resolves.
  // Do NOT hide it here — index.tsx returns null while loading, which
  // would produce a black screen if the splash is already gone.

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: BG }}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor={BG} />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: SURFACE },
            headerTintColor: '#F8FAFC',
            headerTitleStyle: { fontWeight: '700' },
            contentStyle: { backgroundColor: BG },
          }}
        >
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(parent)" options={{ headerShown: false }} />
          <Stack.Screen name="(manager)" options={{ headerShown: false }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
