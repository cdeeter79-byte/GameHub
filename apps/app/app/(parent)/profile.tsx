import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@gamehub/domain';
import { useAuth } from '../../src/hooks/useAuth';

const C = {
  bg: '#0F172A',
  surface: '#1E293B',
  border: '#334155',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  primary: '#3B82F6',
  primaryLight: '#60A5FA',
  primaryBg: '#1E3A8A',
  error: '#EF4444',
  errorBg: '#7F1D1D',
  gold: '#FBBF24',
  goldBg: '#451A03',
};

function Row({
  label, value, onPress, chevron = true, destructive = false,
}: {
  label: string; value?: string; onPress: () => void; chevron?: boolean; destructive?: boolean;
}) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      activeOpacity={0.7}
    >
      <Text style={[styles.rowLabel, destructive && styles.rowDestructive]}>{label}</Text>
      {value
        ? <Text style={styles.rowValue}>{value}</Text>
        : chevron && <Text style={styles.chevron}>›</Text>
      }
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

function Avatar({ name, size = 64 }: { name: string; size?: number }) {
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.38 }]}>{initials}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { user } = useAuth();
  const name = (user?.user_metadata?.['full_name'] as string) ?? 'Parent';
  const email = user?.email ?? '';

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* ── Identity ────────────────────────────────────────────────── */}
      <View style={styles.identity}>
        <Avatar name={name} size={72} />
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.email}>{email}</Text>
      </View>

      {/* ── Account ─────────────────────────────────────────────────── */}
      <Section title="Account">
        <Row label="My Children" onPress={() => router.push('/(parent)/children/')} />
        <Row label="Connected Platforms" onPress={() => router.push('/(shared)/provider-connect/')} />
        <Row label="Notifications" onPress={() => router.push('/(shared)/notifications')} />
        <Row label="Settings" onPress={() => router.push('/(shared)/settings')} />
      </Section>

      {/* ── Subscription ────────────────────────────────────────────── */}
      <Section title="Subscription">
        <Row label="Upgrade to Premium" value="Free plan" onPress={() => {}} />
        <Row label="Restore Purchases" onPress={() => {}} />
      </Section>

      {/* ── Legal ───────────────────────────────────────────────────── */}
      <Section title="Legal & Privacy">
        <Row label="Privacy Policy" onPress={() => {}} />
        <Row label="Terms of Service" onPress={() => {}} />
        <Row label="Your Privacy Data" onPress={() => {}} />
        <Row label="Delete Account" onPress={() => {}} destructive />
      </Section>

      {/* ── Sign out ────────────────────────────────────────────────── */}
      <Section>
        <Row label="Sign Out" onPress={handleSignOut} chevron={false} destructive />
      </Section>

      <Text style={styles.version}>GameHub · v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: C.bg },
  content: { paddingBottom: 60 },

  // Identity
  identity: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    gap: 6,
  },
  avatar: {
    backgroundColor: C.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarText: { color: C.primaryLight, fontWeight: '700' },
  name: { color: C.text, fontSize: 20, fontWeight: '700' },
  email: { color: C.textSecondary, fontSize: 14 },

  // Section
  section: { marginHorizontal: 16, marginBottom: 20 },
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

  // Row
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.border,
  },
  rowLabel: { color: C.text, fontSize: 15 },
  rowValue: { color: C.textTertiary, fontSize: 14 },
  chevron: { color: C.textTertiary, fontSize: 20 },
  rowDestructive: { color: C.error },

  version: {
    color: C.textTertiary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
});
