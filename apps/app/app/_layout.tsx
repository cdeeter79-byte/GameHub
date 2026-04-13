// URL polyfill — native only (web has native URL support)
import { Platform } from 'react-native';
if (Platform.OS !== 'web') {
  require('react-native-url-polyfill/auto');
}

// Global CSS for web dark background
import '../global.css';

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';

const BG = '#0F172A';
const SURFACE = '#1E293B';

// Guard SplashScreen for native only — web has no splash
if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync().catch(() => {});
}

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS !== 'web') {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, []);

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
          <Stack.Screen name="(shared)" options={{ headerShown: false }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
