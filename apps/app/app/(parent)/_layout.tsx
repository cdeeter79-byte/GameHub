import { Tabs } from 'expo-router';
import { TabBar } from '@gamehub/ui';
import { colors } from '@gamehub/config';

export default function ParentLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: colors.neutral[900] },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'GameHub',
          tabBarAccessibilityLabel: 'Home tab',
        }}
      />
      <Tabs.Screen
        name="schedule/index"
        options={{
          title: 'Schedule',
          tabBarAccessibilityLabel: 'Schedule tab',
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Inbox',
          tabBarAccessibilityLabel: 'Inbox tab',
        }}
      />
      <Tabs.Screen
        name="roster/index"
        options={{
          title: 'Roster',
          tabBarAccessibilityLabel: 'Roster tab',
        }}
      />
      <Tabs.Screen
        name="children/index"
        options={{
          title: 'My Kids',
          tabBarAccessibilityLabel: 'My Kids tab',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarAccessibilityLabel: 'Profile tab',
        }}
      />
      {/* Hide detail screens from the tab bar */}
      <Tabs.Screen name="schedule/[id]" options={{ href: null }} />
      <Tabs.Screen name="children/[id]" options={{ href: null }} />
      <Tabs.Screen name="children/new" options={{ href: null, title: 'Add a Child' }} />
      <Tabs.Screen name="provider-connect/index" options={{ href: null, title: 'Connect Platforms' }} />
      <Tabs.Screen name="notifications" options={{ href: null, title: 'Notifications' }} />
      <Tabs.Screen name="settings" options={{ href: null, title: 'Settings' }} />
      <Tabs.Screen name="change-password" options={{ href: null, title: 'Change Password' }} />
    </Tabs>
  );
}
