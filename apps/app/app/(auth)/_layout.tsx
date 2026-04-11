import { Stack } from 'expo-router';
import { colors } from '@gamehub/config';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.neutral[950] },
        animation: 'fade',
      }}
    />
  );
}
