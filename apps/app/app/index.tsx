import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Redirect } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useAuth } from '../src/hooks/useAuth';

export default function Index() {
  const { session, isLoading } = useAuth();

  // Hide splash only after the auth check resolves, so the user never
  // sees a black screen between splash dismiss and the first real screen.
  useEffect(() => {
    if (!isLoading && Platform.OS !== 'web') {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isLoading]);

  if (isLoading) return null;

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/(parent)/dashboard" />;
}
