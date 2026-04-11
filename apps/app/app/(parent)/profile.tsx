import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@gamehub/domain';
import { colors, spacing, typography, radii } from '@gamehub/config';
import { Avatar } from '@gamehub/ui';
import { useAuth } from '../../src/hooks/useAuth';
import { useEntitlements } from '../../src/hooks/useEntitlements';

function SettingRow({ label, value, onPress, destructive }: {
  label: string; value?: string; onPress: () => void; destructive?: boolean;
}) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={[styles.rowLabel, destructive && styles.destructive]}>{label}</Text>
      {value ? <Text style={styles.rowValue}>{value}</Text> : <Text style={styles.chevron}>›</Text>}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { user } = useAuth();
  const { isPremium } = useEntitlements();

  const name = user?.user_metadata?.['full_name'] as string ?? 'Parent';
  const email = user?.email ?? '';

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
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
      {/* Avatar / identity */}
      <View style={styles.avatarSection}>
        <Avatar
          name={name}
          uri={user?.user_metadata?.['avatar_url'] as string | undefined}
          size="xl"
        />
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.email}>{email}</Text>
        {isPremium ? (
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumText}>⭐ Premium</Text>
          </View>
        ) : null}
      </View>

      {/* Settings sections */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Account</Text>
        <SettingRow label="Notifications" onPress={() => router.push('/(shared)/notifications')} />
        <SettingRow label="Connected Platforms" onPress={() => router.push('/(shared)/provider-connect/')} />
        <SettingRow label="My Children" onPress={() => router.push('/(parent)/children/')} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Subscription</Text>
        {isPremium ? (
          <SettingRow label="Manage Premium" value="Active" onPress={() => router.push('/(shared)/settings')} />
        ) : (
          <SettingRow label="Upgrade to Premium" onPress={() => router.push('/(shared)/settings')} />
        )}
        <SettingRow label="Restore Purchases" onPress={() => { /* RevenueCat restore */ }} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Legal</Text>
        <SettingRow label="Privacy Policy" onPress={() => {}} />
        <SettingRow label="Terms of Service" onPress={() => {}} />
        <SettingRow label="Delete Account" onPress={() => {}} destructive />
      </View>

      <View style={styles.section}>
        <SettingRow label="Sign Out" onPress={handleSignOut} destructive />
      </View>

      <Text style={styles.version}>GameHub v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.neutral[950] },
  content: { paddingBottom: spacing[12] },
  avatarSection: {
    alignItems: 'center',
    padding: spacing[6],
    gap: spacing[2],
  },
  name: { color: colors.white, fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold },
  email: { color: colors.neutral[400], fontSize: typography.fontSize.sm },
  premiumBadge: {
    backgroundColor: colors.primary[900],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radii.full,
    marginTop: spacing[1],
  },
  premiumText: { color: colors.primary[300], fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold },
  section: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[4],
    backgroundColor: colors.neutral[900],
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  sectionLabel: {
    color: colors.neutral[500],
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    padding: spacing[3],
    paddingBottom: spacing[1],
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[800],
  },
  rowLabel: { color: colors.white, fontSize: typography.fontSize.md },
  rowValue: { color: colors.neutral[400], fontSize: typography.fontSize.sm },
  chevron: { color: colors.neutral[500], fontSize: 20 },
  destructive: { color: colors.error[400] },
  version: { color: colors.neutral[600], fontSize: typography.fontSize.xs, textAlign: 'center', marginTop: spacing[4] },
});
