import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@gamehub/domain';
import { colors, spacing, typography, radii } from '@gamehub/config';

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogleSignIn() {
    setLoading(true);
    setError(null);
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: Platform.OS === 'web'
            ? `${window.location.origin}/auth/callback`
            : 'gamehub://auth/callback',
          scopes: 'email profile',
        },
      });
      if (authError) setError(authError.message);
    } catch (e) {
      setError('Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAppleSignIn() {
    setLoading(true);
    setError(null);
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: Platform.OS === 'web'
            ? `${window.location.origin}/auth/callback`
            : 'gamehub://auth/callback',
        },
      });
      if (authError) setError(authError.message);
    } catch (e) {
      setError('Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      {/* Logo / Hero */}
      <View style={styles.hero}>
        <Text style={styles.logo}>🏟️</Text>
        <Text style={styles.appName}>GameHub</Text>
        <Text style={styles.tagline}>All your kids' sports. One app.</Text>
      </View>

      {/* Sign in options */}
      <View style={styles.authSection}>
        {error ? (
          <View style={styles.errorBanner} accessibilityRole="alert">
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {Platform.OS === 'ios' || Platform.OS === 'web' ? (
          <TouchableOpacity
            style={[styles.button, styles.appleButton]}
            onPress={handleAppleSignIn}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Sign in with Apple"
          >
            <Text style={styles.appleIcon}>🍎</Text>
            <Text style={styles.buttonText}>Continue with Apple</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={[styles.button, styles.googleButton]}
          onPress={handleGoogleSignIn}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Sign in with Google"
        >
          {loading ? (
            <ActivityIndicator color={colors.neutral[900]} size="small" />
          ) : (
            <>
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.terms}>
          By continuing, you agree to our{' '}
          <Text style={styles.link}>Terms of Service</Text> and{' '}
          <Text style={styles.link}>Privacy Policy</Text>. You must be 13 or older to create an account.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing[6],
    backgroundColor: colors.neutral[950],
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing[12],
  },
  logo: {
    fontSize: 64,
    marginBottom: spacing[3],
  },
  appName: {
    color: colors.white,
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    letterSpacing: -0.5,
  },
  tagline: {
    color: colors.neutral[400],
    fontSize: typography.fontSize.lg,
    marginTop: spacing[2],
    textAlign: 'center',
  },
  authSection: {
    gap: spacing[3],
  },
  errorBanner: {
    backgroundColor: colors.error[900],
    borderColor: colors.error[700],
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing[3],
  },
  errorText: {
    color: colors.error[300],
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[4],
    borderRadius: radii.lg,
    gap: spacing[3],
    minHeight: 52,
  },
  appleButton: {
    backgroundColor: colors.white,
  },
  googleButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.neutral[300],
  },
  buttonText: {
    color: colors.neutral[900],
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  googleButtonText: {
    color: colors.neutral[800],
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  appleIcon: {
    fontSize: 20,
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[600],
  },
  terms: {
    color: colors.neutral[500],
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
    lineHeight: typography.fontSize.xs * 1.6,
    marginTop: spacing[2],
  },
  link: {
    color: colors.primary[400],
    textDecorationLine: 'underline',
  },
});
