import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@gamehub/domain';
import { useAuth } from '../../../src/hooks/useAuth';

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
  white: '#FFFFFF',
};

const SPORTS = [
  { value: 'SOCCER',     label: '⚽ Soccer' },
  { value: 'BASKETBALL', label: '🏀 Basketball' },
  { value: 'BASEBALL',   label: '⚾ Baseball' },
  { value: 'SOFTBALL',   label: '🥎 Softball' },
  { value: 'LACROSSE',   label: '🥍 Lacrosse' },
  { value: 'HOCKEY',     label: '🏒 Hockey' },
  { value: 'FOOTBALL',   label: '🏈 Football' },
  { value: 'VOLLEYBALL', label: '🏐 Volleyball' },
  { value: 'TENNIS',     label: '🎾 Tennis' },
  { value: 'SWIMMING',   label: '🏊 Swimming' },
  { value: 'OTHER',      label: '🏅 Other' },
];

const AGE_BANDS = [
  { value: 'UNDER_13',    label: 'Under 13' },
  { value: 'TEEN_13_17',  label: '13 – 17' },
  { value: 'ADULT_18_PLUS', label: '18+' },
];

export default function NewChildScreen() {
  const { user } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [sport, setSport] = useState<string>('SOCCER');
  const [ageBand, setAgeBand] = useState<string>('UNDER_13');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const first = firstName.trim();
    const last = lastName.trim();
    if (!first) { Alert.alert('Required', 'Please enter a first name.'); return; }
    if (!last)  { Alert.alert('Required', 'Please enter a last name.'); return; }
    if (!user)  { Alert.alert('Error', 'Not signed in.'); return; }

    setSaving(true);
    try {
      const { error } = await supabase.from('child_profiles').insert({
        parent_user_id: user.id,
        first_name: first,
        last_name: last,
        sport,
        age_band: ageBand,
      });
      if (error) throw error;
      router.back();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not save. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.pageTitle}>Add a Child</Text>
      <Text style={styles.pageSubtitle}>
        Add your child's info to start tracking their sports schedule.
      </Text>

      {/* ── Name ── */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>NAME</Text>
        <View style={styles.card}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>First Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Emma"
              placeholderTextColor={C.textTertiary}
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
              returnKeyType="next"
              maxLength={50}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Last Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Smith"
              placeholderTextColor={C.textTertiary}
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
              returnKeyType="done"
              maxLength={50}
            />
          </View>
        </View>
      </View>

      {/* ── Sport ── */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>PRIMARY SPORT</Text>
        <View style={styles.pillGrid}>
          {SPORTS.map((s) => (
            <TouchableOpacity
              key={s.value}
              style={[styles.pill, sport === s.value && styles.pillActive]}
              onPress={() => setSport(s.value)}
              accessibilityRole="radio"
              accessibilityState={{ checked: sport === s.value }}
            >
              <Text style={[styles.pillText, sport === s.value && styles.pillTextActive]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Age band ── */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>AGE GROUP</Text>
        <View style={styles.pillRow}>
          {AGE_BANDS.map((a) => (
            <TouchableOpacity
              key={a.value}
              style={[styles.agePill, ageBand === a.value && styles.agePillActive]}
              onPress={() => setAgeBand(a.value)}
              accessibilityRole="radio"
              accessibilityState={{ checked: ageBand === a.value }}
            >
              <Text style={[styles.agePillText, ageBand === a.value && styles.agePillTextActive]}>
                {a.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Save ── */}
      <TouchableOpacity
        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={saving}
        accessibilityRole="button"
        accessibilityLabel="Save child"
      >
        {saving
          ? <ActivityIndicator color={C.white} />
          : <Text style={styles.saveBtnText}>Add Child</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cancelBtn}
        onPress={() => router.back()}
        accessibilityRole="button"
      >
        <Text style={styles.cancelBtnText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: C.bg },
  content: { padding: 20, paddingBottom: 100, gap: 8 },

  pageTitle: { color: C.text, fontSize: 24, fontWeight: '800', marginBottom: 4 },
  pageSubtitle: { color: C.textSecondary, fontSize: 15, lineHeight: 22, marginBottom: 12 },

  section: { gap: 8, marginBottom: 8 },
  sectionLabel: {
    color: C.textTertiary, fontSize: 11, fontWeight: '700',
    letterSpacing: 0.8, textTransform: 'uppercase', paddingHorizontal: 4,
  },

  card: {
    backgroundColor: C.surface, borderRadius: 14,
    borderWidth: 1, borderColor: C.border, overflow: 'hidden',
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: C.border, marginLeft: 16 },
  fieldRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 4, gap: 12,
  },
  fieldLabel: { color: C.textSecondary, fontSize: 15, width: 90 },
  input: {
    flex: 1, color: C.text, fontSize: 15, paddingVertical: 12,
    ...Platform.select({ web: { outlineStyle: 'none' } as object }),
  },

  pillGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
  },
  pillActive: { backgroundColor: C.primaryBg, borderColor: C.primary },
  pillText: { color: C.textSecondary, fontSize: 14, fontWeight: '500' },
  pillTextActive: { color: C.white, fontWeight: '600' },

  pillRow: { flexDirection: 'row', gap: 10 },
  agePill: {
    flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
  },
  agePillActive: { backgroundColor: C.primaryBg, borderColor: C.primary },
  agePillText: { color: C.textSecondary, fontSize: 14, fontWeight: '500' },
  agePillTextActive: { color: C.white, fontWeight: '700' },

  saveBtn: {
    backgroundColor: C.primary, borderRadius: 14,
    paddingVertical: 15, alignItems: 'center', marginTop: 16,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: C.white, fontSize: 16, fontWeight: '700' },

  cancelBtn: { paddingVertical: 12, alignItems: 'center' },
  cancelBtnText: { color: C.textSecondary, fontSize: 15 },
});
