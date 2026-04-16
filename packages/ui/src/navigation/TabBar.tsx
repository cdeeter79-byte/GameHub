import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '@gamehub/config';
import { UnreadBadge } from '../components/UnreadBadge';

const TAB_ICONS: Record<string, string> = {
  dashboard: '🏠',
  schedule: '📅',
  inbox: '✉️',
  roster: '👥',
  children: '🧒',
  teams: '👥',
  profile: '👤',
};

const TAB_LABELS: Record<string, string> = {
  dashboard: 'Home',
  schedule: 'Schedule',
  inbox: 'Inbox',
  roster: 'Roster',
  children: 'My Kids',
  teams: 'Teams',
  profile: 'Profile',
};

interface TabBarProps {
  state: { index: number; routes: Array<{ name: string; key: string }> };
  descriptors: Record<string, { options: { tabBarAccessibilityLabel?: string } }>;
  navigation: { emit: (e: object) => { defaultPrevented: boolean }; navigate: (name: string) => void };
  unreadInboxCount?: number;
}

export function TabBar({ state, descriptors, navigation, unreadInboxCount = 0 }: TabBarProps) {
  const insets = useSafeAreaInsets();

  // Only show the known top-level tab screens — exclude detail screens ([id]) and utility screens (new)
  const TAB_ROUTES = new Set([
    'dashboard',
    'schedule/index',
    'inbox',
    'roster/index',
    'children/index',
    'profile',
  ]);
  const visibleRoutes = state.routes.filter((r) => TAB_ROUTES.has(r.name));

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {visibleRoutes.map((route) => {
        const originalIndex = state.routes.indexOf(route);
        const isFocused = state.index === originalIndex;
        // Normalize: strip parens, then take only the first path segment
        // so 'schedule/index' → 'schedule', 'children/index' → 'children'
        const routeName = route.name.toLowerCase().replace(/[()]/g, '').split('/')[0];
        const label = TAB_LABELS[routeName] ?? route.name;
        const icon = TAB_ICONS[routeName] ?? '●';
        const isInbox = routeName === 'inbox';

        const accessibilityLabel =
          descriptors[route.key]?.options?.tabBarAccessibilityLabel ??
          `${label} tab`;

        function onPress() {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        }

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tab}
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityLabel={accessibilityLabel}
            accessibilityState={{ selected: isFocused }}
          >
            <View style={styles.iconWrapper}>
              <Text style={[styles.icon, isFocused && styles.iconActive]}>{icon}</Text>
              {isInbox && unreadInboxCount > 0 ? (
                <View style={styles.badgeWrapper}>
                  <UnreadBadge count={unreadInboxCount} maxCount={99} />
                </View>
              ) : null}
            </View>
            <Text style={[styles.label, isFocused && styles.labelActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[900],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[800],
    paddingTop: spacing[2],
    ...Platform.select({
      web: {
        position: 'sticky' as unknown as undefined,
        bottom: 0,
        zIndex: 100,
      },
    }),
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[1],
    minHeight: 44,
  },
  iconWrapper: {
    position: 'relative',
  },
  icon: {
    fontSize: 22,
    opacity: 0.65,
  },
  iconActive: {
    opacity: 1,
  },
  badgeWrapper: {
    position: 'absolute',
    top: -4,
    right: -8,
  },
  label: {
    fontSize: 10,
    color: colors.neutral[400],
    marginTop: 2,
    fontWeight: typography.fontWeight.medium,
  },
  labelActive: {
    color: colors.primary[400],
    fontWeight: typography.fontWeight.semibold,
  },
});
