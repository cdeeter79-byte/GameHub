import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  ScrollView,
  Modal,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@gamehub/domain';
import { colors, spacing, typography, radii } from '@gamehub/config';

type LegalDoc = 'terms' | 'privacy' | null;

const TERMS_TEXT = `Terms of Service

Last updated: April 11, 2026

By using GameHub, you agree to these terms. GameHub provides a sports schedule aggregation service for families.

SUBSCRIPTIONS
Parent Premium is available via in-app purchase. Manager plans are billed monthly via Stripe. You may cancel at any time.

PROVIDER INTEGRATIONS
GameHub connects to third-party sports platforms on your behalf. We are not responsible for data availability or accuracy from those providers.

WARRANTY DISCLAIMER
GameHub is provided "as is" without warranty of any kind.

LIMITATION OF LIABILITY
Our liability is limited to the greater of $100 or fees paid in the past 12 months.

GOVERNING LAW
These terms are governed by the laws of the State of Delaware.

For questions: support@gamehub.app`;

const PRIVACY_TEXT = `Privacy Policy

Last updated: April 11, 2026

INFORMATION WE COLLECT
• Your name and email (from Google/Apple sign-in)
• Child profiles: first name, sport, age band, avatar (optional)
• Sports schedule data synced from connected provider accounts
• RSVP responses and preferences

HOW WE USE IT
• Display unified schedules and send RSVP confirmations
• Sync data with your connected sports apps
• Send push notifications for upcoming events

CHILDREN'S PRIVACY (COPPA)
GameHub is parent-directed. Children under 13 do not create accounts — parents manage child profiles. We collect minimal data for children: first name, sport, and age band only. No ads or analytics for children under 13.

DATA SHARING
We do not sell your data. We share data only with the sports providers you connect and with Supabase (our secure database host).

YOUR RIGHTS
You may access, export, or delete your data at any time in Settings → Privacy.

CONTACT
privacy@gamehub.app (7-day response target)`;

export default function LoginScreen() {
  const [loading, setLoading] = useState<'google' | 'apple' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [legalDoc, setLegalDoc] = useState<LegalDoc>(null);

  async function handleGoogleSignIn() {
    setLoading('google');
    setError(null);
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo:
            Platform.OS === 'web'
              ? `${window.location.origin}/auth/callback`
              : 'gamehub://auth/callback',
          scopes: 'email profile',
        },
      });
      if (authError) setError(authError.message);
    } catch {
      setError('Sign in failed. Please try again.');
    } finally {
      setLoading(null);
    }
  }

  async function handleAppleSignIn() {
    setLoading('apple');
    setError(null);
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo:
            Platform.OS === 'web'
              ? `${window.location.origin}/auth/callback`
              : 'gamehub://auth/callback',
        },
      });
      if (authError) setError(authError.message);
    } catch {
      setError('Sign in failed. Please try again.');
    } finally {
      setLoading(null);
    }
  }

  function handleGuest() {
    router.replace('/(parent)/dashboard');
  }

  const isLoading = loading !== null;

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.logo}>🏟️</Text>
          <Text style={styles.appName}>GameHub</Text>
          <Text style={styles.tagline}>All your kids' sports. One app.</Text>
        </View>

        {/* Feature highlights */}
        <View style={styles.features}>
          {[
            { icon: '📅', text: 'Unified schedule across all your kids' },
            { icon: '✅', text: 'RSVP from one place — syncs back automatically' },
            { icon: '💬', text: 'All team messages in one inbox' },
            { icon: '🔗', text: 'TeamSnap, SportsEngine, ICS & more' },
          ].map((f) => (
            <View key={f.text} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>

        {/* Auth buttons */}
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
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityLabel="Sign in with Apple"
            >
              {loading === 'apple' ? (
                <ActivityIndicator color={colors.neutral[900]} size="small" />
              ) : (
                <>
                  <Text style={styles.appleIcon}></Text>
                  <Text style={styles.darkButtonText}>Continue with Apple</Text>
                </>
              )}
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={[styles.button, styles.googleButton]}
            onPress={handleGoogleSignIn}
            disabled={isLoading}
            accessibilityRole="button"
            accessibilityLabel="Sign in with Google"
          >
            {loading === 'google' ? (
              <ActivityIndicator color={colors.neutral[900]} size="small" />
            ) : (
              <>
                <Text style={styles.googleG}>G</Text>
                <Text style={styles.darkButtonText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Guest mode */}
          <TouchableOpacity
            style={[styles.button, styles.guestButton]}
            onPress={handleGuest}
            disabled={isLoading}
            accessibilityRole="button"
            accessibilityLabel="Browse app without an account"
          >
            <Text style={styles.guestButtonText}>Browse without an account</Text>
          </TouchableOpacity>

          <Text style={styles.guestNote}>
            Explore with sample data. Sign in anytime to connect your real sports apps.
          </Text>

          {/* Legal */}
          <Text style={styles.terms}>
            By signing in, you agree to our{' '}
            <Text style={styles.link} onPress={() => setLegalDoc('terms')}>
              Terms of Service
            </Text>
            {' '}and{' '}
            <Text style={styles.link} onPress={() => setLegalDoc('privacy')}>
              Privacy Policy
            </Text>
            . You must be 13 or older to create an account.
          </Text>
        </View>
      </ScrollView>

      {/* Legal document modal */}
      <Modal
        visible={legalDoc !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setLegalDoc(null)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {legalDoc === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
            </Text>
            <TouchableOpacity
              onPress={() => setLegalDoc(null)}
              accessibilityRole="button"
              accessibilityLabel="Close"
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalBody}>
              {legalDoc === 'terms' ? TERMS_TEXT : PRIVACY_TEXT}
            </Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing[6],
    backgroundColor: colors.dark.background,
    minHeight: '100%',
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing[8],
  },
  logo: {
    fontSize: 64,
    marginBottom: spacing[3],
  },
  appName: {
    color: colors.dark.text,
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold as '700',
    letterSpacing: -0.5,
  },
  tagline: {
    color: colors.dark.textSecondary,
    fontSize: typography.fontSize.lg,
    marginTop: spacing[2],
    textAlign: 'center',
  },
  features: {
    backgroundColor: colors.dark.surface,
    borderRadius: radii.xl,
    padding: spacing[4],
    marginBottom: spacing[8],
    gap: spacing[3],
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  featureIcon: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
  },
  featureText: {
    color: colors.dark.text,
    fontSize: typography.fontSize.sm,
    flex: 1,
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
    backgroundColor: colors.neutral[0],
  },
  googleButton: {
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[300],
  },
  guestButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.dark.border,
  },
  darkButtonText: {
    color: colors.neutral[900],
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold as '600',
  },
  guestButtonText: {
    color: colors.dark.text,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium as '500',
  },
  googleG: {
    fontSize: 18,
    fontWeight: typography.fontWeight.bold as '700',
    color: colors.primary[600],
  },
  appleIcon: {
    fontSize: 20,
    color: colors.neutral[900],
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginVertical: spacing[1],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.dark.border,
  },
  dividerText: {
    color: colors.dark.textTertiary,
    fontSize: typography.fontSize.sm,
  },
  guestNote: {
    color: colors.dark.textTertiary,
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
  },
  terms: {
    color: colors.dark.textSecondary,
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
    lineHeight: typography.fontSize.xs * 1.7,
    marginTop: spacing[2],
  },
  link: {
    color: colors.primary[400],
    textDecorationLine: 'underline',
  },
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  modalTitle: {
    color: colors.dark.text,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold as '700',
  },
  closeButton: {
    padding: spacing[2],
  },
  closeButtonText: {
    color: colors.primary[400],
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold as '600',
  },
  modalScroll: {
    flex: 1,
  },
  modalContent: {
    padding: spacing[5],
  },
  modalBody: {
    color: colors.dark.textSecondary,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.fontSize.sm * 1.7,
  },
});
