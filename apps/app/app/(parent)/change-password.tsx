import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@gamehub/domain';

const C = {
  bg: '#0F172A',
  surface: '#1E293B',
  border: '#334155',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  primary: '#3B82F6',
  primaryLight: '#60A5FA',
  white: '#FFFFFF',
  errorBg: '#7F1D1D',
  errorText: '#FCA5A5',
  errorBorder: '#B91C1C',
  successBg: '#14532D',
  successText: '#86EFAC',
  successBorder: '#166534',
};

export default function ChangePasswordScreen() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleChangePassword() {
    setError(null);

    if (!newPassword.trim()) {
      setError('Please enter a new password.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setSuccess(true);
      setNewPassword('');
      setConfirmPassword('');

      // Show success and navigate back after a moment
      Alert.alert('Password Changed', 'Your password has been updated successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.description}>
        Enter a new password for your account. You must be signed in to change your password.
      </Text>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {success ? (
        <View style={styles.successBanner}>
          <Text style={styles.successText}>Password updated successfully.</Text>
        </View>
      ) : null}

      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>New Password</Text>
          <TextInput
            style={styles.input}
            placeholder="At least 6 characters"
            placeholderTextColor={C.textTertiary}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            autoComplete="new-password"
            editable={!loading}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Re-enter new password"
            placeholderTextColor={C.textTertiary}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoComplete="new-password"
            editable={!loading}
          />
        </View>

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleChangePassword}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Update password"
        >
          {loading ? (
            <ActivityIndicator color={C.white} size="small" />
          ) : (
            <Text style={styles.btnText}>Update Password</Text>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.note}>
        This changes the password for email/password sign-in. If you signed up with Google or Apple, you can set a password here to enable email sign-in as well.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: C.bg },
  content: { padding: 24, paddingBottom: 60, gap: 20 },

  description: {
    color: C.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },

  errorBanner: {
    backgroundColor: C.errorBg,
    borderColor: C.errorBorder,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  errorText: {
    color: C.errorText,
    fontSize: 13,
    textAlign: 'center',
  },
  successBanner: {
    backgroundColor: C.successBg,
    borderColor: C.successBorder,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  successText: {
    color: C.successText,
    fontSize: 13,
    textAlign: 'center',
  },

  form: { gap: 16 },
  field: { gap: 6 },
  label: {
    color: C.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 2,
  },
  input: {
    height: 48,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    color: C.text,
    fontSize: 15,
  },

  btn: {
    height: 52,
    backgroundColor: C.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: {
    color: C.white,
    fontSize: 16,
    fontWeight: '600',
  },

  note: {
    color: C.textTertiary,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
});
