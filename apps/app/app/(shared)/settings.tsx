import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native';

const C = {
  bg: '#0F172A',
  surface: '#1E293B',
  border: '#334155',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  primary: '#3B82F6',
  primaryLight: '#60A5FA',
};

function Row({ label, detail, onPress, right }: {
  label: string;
  detail?: string;
  onPress?: () => void;
  right?: React.ReactNode;
}) {
  const inner = (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowLabel}>{label}</Text>
        {detail && <Text style={styles.rowDetail}>{detail}</Text>}
      </View>
      {right ?? (onPress && <Text style={styles.chevron}>›</Text>)}
    </View>
  );
  if (!onPress) return inner;
  return (
    <TouchableOpacity onPress={onPress} accessibilityRole="button" accessibilityLabel={label} activeOpacity={0.7}>
      {inner}
    </TouchableOpacity>
  );
}

function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      {title && <Text style={styles.sectionLabel}>{title}</Text>}
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function ToggleRow({ label, detail, value, onChange }: {
  label: string; detail?: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <Row
      label={label}
      detail={detail}
      right={
        <Switch
          value={value}
          onValueChange={onChange}
          trackColor={{ false: '#334155', true: '#1D4ED8' }}
          thumbColor={value ? C.primaryLight : '#94A3B8'}
        />
      }
    />
  );
}

export default function SettingsScreen() {
  const [gameAlerts, setGameAlerts] = useState(true);
  const [practiceAlerts, setPracticeAlerts] = useState(true);
  const [rsvpReminders, setRsvpReminders] = useState(true);
  const [inboxAlerts, setInboxAlerts] = useState(true);
  const [syncAlerts, setSyncAlerts] = useState(false);
  const [digestMode, setDigestMode] = useState(false);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

      <Section title="Notifications">
        <ToggleRow label="Game Alerts" detail="1 hour before each game" value={gameAlerts} onChange={setGameAlerts} />
        <ToggleRow label="Practice Alerts" detail="1 hour before each practice" value={practiceAlerts} onChange={setPracticeAlerts} />
        <ToggleRow label="RSVP Reminders" detail="When RSVP is still needed" value={rsvpReminders} onChange={setRsvpReminders} />
        <ToggleRow label="Inbox Messages" detail="New messages from connected platforms" value={inboxAlerts} onChange={setInboxAlerts} />
        <ToggleRow label="Sync Failures" detail="If a platform fails to sync" value={syncAlerts} onChange={setSyncAlerts} />
        <ToggleRow label="Digest Mode" detail="Daily summary instead of individual alerts" value={digestMode} onChange={setDigestMode} />
      </Section>

      <Section title="Calendar">
        <Row label="Default View" detail="Agenda" onPress={() => {}} />
        <Row label="Week Starts On" detail="Sunday" onPress={() => {}} />
        <Row label="Time Zone" detail="Device default" onPress={() => {}} />
      </Section>

      <Section title="Maps">
        <Row label="Preferred Maps App" detail="Auto (Apple on iOS, Google on web)" onPress={() => {}} />
      </Section>

      <Section title="Data & Privacy">
        <Row label="Sync All Providers Now" detail="Refresh all connected platforms" onPress={() => {}} />
        <Row label="Export My Data" detail="Download a copy of your schedule and data" onPress={() => {}} />
        <Row label="Delete All My Data" onPress={() => {}} />
      </Section>

      <Text style={styles.version}>GameHub · v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: C.bg },
  content: { paddingTop: 8, paddingBottom: 60 },

  section: { marginHorizontal: 16, marginBottom: 20, marginTop: 12 },
  sectionLabel: {
    color: C.textTertiary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionCard: {
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.border,
    gap: 12,
  },
  rowLeft: { flex: 1, gap: 2 },
  rowLabel: { color: C.text, fontSize: 15 },
  rowDetail: { color: C.textTertiary, fontSize: 12 },
  chevron: { color: C.textTertiary, fontSize: 20 },
  version: { color: C.textTertiary, fontSize: 12, textAlign: 'center', marginTop: 4 },
});
