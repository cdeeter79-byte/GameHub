import { Redirect } from 'expo-router';
import { useAuth } from '../src/hooks/useAuth';

export default function Index() {
  const { session, isLoading } = useAuth();

  if (isLoading) return null; // Splash screen is still visible

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/(parent)/dashboard" />;
}
