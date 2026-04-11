import { Stack } from 'expo-router';
import { colors } from '@gamehub/config';

export default function ManagerLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.neutral[900] },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: colors.neutral[950] },
      }}
    />
  );
}
