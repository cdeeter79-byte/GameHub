import { View, Text, Switch, StyleSheet, ScrollView } from 'react-native';
import { useState } from 'react';
import { colors, spacing, typography, radii } from '@gamehub/config';

interface PrefRow { key: string; label: string; description: string; }

const PREFS: PrefRow[] = [
  { key: 'upcoming_game', label: 'Game Reminders', description: '2 hours before each game' },
  { key: 'upcoming_practice', label: 'Practice Reminders', description: '1 hour before each practice' },
  { key: 'rsvp_needed', label: 'RSVP Requests', description: 'When a new RSVP is needed' },
  { key: 'event_changed', label: 'Event Changes', description: 'Cancellations and reschedules' },
  { key: 'unread_message', label: 'New Messages', description: 'When a new team message arrives' },
  { key: 'sync_mismatch', label: 'Sync Alerts', description: 'When a schedule conflict is detected' },
  { key: 'digest', label: 'Daily Digest', description: 'Morning summary of today\'s events' },
];

export default function NotificationsScreen() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(
    Object.fromEntries(PREFS.map((p) => [p.key, true])),
  );

  function toggle(key: string) {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.description}>
        Choose which notifications you'd like to receive from GameHub.
      </Text>
      <View style={styles.group}>
        {PREFS.map((pref, i) => (
          <View
            key={pref.key}
            style={[styles.row, i === 0 && styles.firstRow]}
          >
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>{pref.label}</Text>
              <Text style={styles.rowDesc}>{pref.description}</Text>
            </View>
            <Switch
              value={prefs[pref.key]}
              onValueChange={() => toggle(pref.key)}
              trackColor={{ false: colors.neutral[700], true: colors.primary[600] }}
              thumbColor={colors.white}
              accessibilityLabel={pref.label}
            />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.neutral[950] },
  content: { padding: spacing[5], gap: spacing[4] },
  description: { color: colors.neutral[400], fontSize: typography.fontSize.sm, lineHeight: 20 },
  group: { backgroundColor: colors.neutral[900], borderRadius: radii.lg, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[800],
    gap: spacing[3],
  },
  firstRow: { borderTopWidth: 0 },
  rowText: { flex: 1 },
  rowLabel: { color: colors.white, fontSize: typography.fontSize.md },
  rowDesc: { color: colors.neutral[500], fontSize: typography.fontSize.xs, marginTop: 2 },
});
