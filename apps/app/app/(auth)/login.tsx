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
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@gamehub/domain';

// Hard-coded palette — never depends on theme import for critical render path
const C = {
  bg: '#0F172A',
  surface: '#1E293B',
  surfaceRaised: '#334155',
  border: '#334155',
  borderSubtle: '#1E293B',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  primary: '#3B82F6',
  primaryDark: '#1E3A8A',
  primaryDeep: '#172554',
  primaryLight: '#60A5FA',
  white: '#FFFFFF',
  black: '#000000',
  errorBg: '#7F1D1D',
  errorText: '#FCA5A5',
  errorBorder: '#B91C1C',
};

const isWeb = Platform.OS === 'web';
const screenWidth = Dimensions.get('window').width;
const isMobileWeb = isWeb && screenWidth < 768;

type LegalDoc = 'terms' | 'privacy' | null;

const TERMS_TEXT = `TERMS OF SERVICE

Last updated: April 11, 2026

By using GameHub, you agree to these terms.

WHAT GAMEHUB IS
GameHub provides a sports schedule aggregation service that lets parents manage their kids' youth sports activities across multiple platforms (TeamSnap, SportsEngine, and others) from one unified app.

ACCOUNTS
You must be 13 or older to create an account. Parents are responsible for all activity on their account, including management of child profiles.

SUBSCRIPTIONS
Parent Premium is available as an optional upgrade via in-app purchase. Premium provides ad-free experience and advanced features. Manager plans for coaches are billed monthly via Stripe. You may cancel at any time; no refunds for partial months.

PROVIDER INTEGRATIONS
GameHub connects to third-party sports platforms on your behalf using credentials you provide. We are not responsible for data availability, accuracy, or changes to those providers' services.

COPPA COMPLIANCE
GameHub is designed as a parent-directed app. Children under 13 do not create accounts — parents manage child profiles. We collect minimal information about children: first name, sport, and age group only.

WARRANTIES & LIABILITY
GameHub is provided "as is" without warranty of any kind, express or implied. Our liability is limited to the greater of $100 or fees you paid in the past 12 months.

GOVERNING LAW
These terms are governed by the laws of the State of Delaware.

CONTACT
support@gamehub.app`;

const PRIVACY_TEXT = `PRIVACY POLICY

Last updated: April 11, 2026

INFORMATION WE COLLECT

About you (the parent):
• Name and email from Google/Apple sign-in
• Profile preferences and settings
• Connected provider accounts (TeamSnap, SportsEngine, etc.)

About your children:
• First name only
• Sport and age group (no exact birthdate)
• Avatar color/emoji (optional, parent-chosen)
• We do NOT collect location, photos, or any other data for children

Schedule data:
• Events, practices, and games synced from your connected sports apps
• Your RSVP responses

HOW WE USE YOUR DATA
• Display a unified schedule for your family
• Send RSVP confirmations to your sports platforms
• Deliver push notifications for upcoming events
• Provide app features and customer support

HOW WE PROTECT IT
• All data stored in Supabase (SOC 2 compliant)
• End-to-end encryption for stored credentials
• Row-Level Security prevents any cross-family data access
• We do not sell your data — ever

CHILDREN'S PRIVACY (COPPA)
GameHub is a parent-directed app. Children do not create accounts. We collect the minimum data needed (first name, sport, age group) to display their schedule. No advertising or analytics targeting children under 13. Parents can delete all child data at any time in Settings → Privacy.

DATA SHARING
We share data only with:
• Sports providers you explicitly connect (to sync your schedule)
• Supabase (our secure cloud database host)

YOUR RIGHTS
Access, export, or delete your data at any time: Settings → Privacy → Data Management. We respond to all requests within 7 days.

CONTACT
privacy@gamehub.app`;

const FEATURES = [
  { icon: '📅', label: 'Unified schedule', detail: 'All your kids, all their sports, one calendar' },
  { icon: '✅', label: 'One-tap RSVP', detail: 'Confirms back to TeamSnap, SportsEngine, and more' },
  { icon: '💬', label: 'Unified inbox', detail: 'All team messages without switching apps' },
  { icon: '🔗', label: '12+ platforms', detail: 'TeamSnap, SportsEngine, ICS feeds, and more' },
];

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
      <View style={styles.root}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            {/* Brand */}
            <View style={styles.brand}>
              <Text style={styles.brandEmoji}>🏟️</Text>
              <Text style={styles.brandName}>GameHub</Text>
              <Text style={styles.brandTagline}>
                Every team. Every kid. One app.
              </Text>
            </View>

            {/* Feature grid */}
            <View style={styles.features}>
              {FEATURES.map((f) => (
                <View key={f.icon} style={styles.featureRow}>
                  <View style={styles.featureIconWrap}>
                    <Text style={styles.featureIcon}>{f.icon}</Text>
                  </View>
                  <View style={styles.featureText}>
                    <Text style={styles.featureLabel}>{f.label}</Text>
                    <Text style={styles.featureDetail}>{f.detail}</Text>
                  </View>
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
                  style={[styles.btn, styles.btnApple]}
                  onPress={handleAppleSignIn}
                  disabled={isLoading}
                  accessibilityRole="button"
                  accessibilityLabel="Continue with Apple"
                >
                  {loading === 'apple' ? (
                    <ActivityIndicator color={C.black} size="small" />
                  ) : (
                    <View style={styles.btnInner}>
                      <Text style={styles.btnAppleIcon}></Text>
                      <Text style={styles.btnDarkText}>Continue with Apple</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                style={[styles.btn, styles.btnGoogle]}
                onPress={handleGoogleSignIn}
                disabled={isLoading}
                accessibilityRole="button"
                accessibilityLabel="Continue with Google"
              >
                {loading === 'google' ? (
                  <ActivityIndicator color={C.black} size="small" />
                ) : (
                  <View style={styles.btnInner}>
                    <Text style={styles.btnGoogleG}>G</Text>
                    <Text style={styles.btnDarkText}>Continue with Google</Text>
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={[styles.btn, styles.btnGuest]}
                onPress={handleGuest}
                disabled={isLoading}
                accessibilityRole="button"
                accessibilityLabel="Browse without an account"
              >
                <Text style={styles.btnGuestText}>Browse without an account</Text>
              </TouchableOpacity>

              <Text style={styles.guestNote}>
                Explore with sample data — no account needed.{'\n'}Sign in anytime to connect your real sports apps.
              </Text>
            </View>

            {/* Legal */}
            <Text style={styles.legal}>
              By signing in you agree to our{' '}
              <Text
                style={styles.legalLink}
                onPress={() => setLegalDoc('terms')}
                accessibilityRole="link"
              >
                Terms of Service
              </Text>
              {' '}and{' '}
              <Text
                style={styles.legalLink}
                onPress={() => setLegalDoc('privacy')}
                accessibilityRole="link"
              >
                Privacy Policy
              </Text>
              . You must be 13 or older to create an account.
            </Text>
          </View>
        </ScrollView>
      </View>

      {/* Legal doc modal */}
      <Modal
        visible={legalDoc !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setLegalDoc(null)}
      >
        <SafeAreaView style={styles.modalRoot}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {legalDoc === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
            </Text>
            <TouchableOpacity
              onPress={() => setLegalDoc(null)}
              accessibilityRole="button"
              accessibilityLabel="Close"
              style={styles.modalClose}
            >
              <Text style={styles.modalCloseText}>Done</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalContent}
            showsVerticalScrollIndicator
          >
            <Text style={styles.modalBody}>
              {legalDoc === 'terms' ? TERMS_TEXT : PRIVACY_TEXT}
            </Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const CARD_MAX_WIDTH = 480;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
    minHeight: '100%' as unknown as number,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  card: {
    width: '100%',
    maxWidth: CARD_MAX_WIDTH,
    gap: 28,
  },

  // ── Brand ─────────────────────────────────────────────────────────────────
  brand: {
    alignItems: 'center',
    gap: 8,
    paddingBottom: 4,
  },
  brandEmoji: {
    fontSize: 56,
    lineHeight: 72,
  },
  brandName: {
    color: C.text,
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  brandTagline: {
    color: C.textSecondary,
    fontSize: 16,
    textAlign: 'center',
  },

  // ── Features ───────────────────────────────────────────────────────────────
  features: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 20,
    gap: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  featureIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: C.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIcon: {
    fontSize: 20,
  },
  featureText: {
    flex: 1,
    gap: 2,
  },
  featureLabel: {
    color: C.text,
    fontSize: 14,
    fontWeight: '600',
  },
  featureDetail: {
    color: C.textTertiary,
    fontSize: 12,
    lineHeight: 16,
  },

  // ── Auth ──────────────────────────────────────────────────────────────────
  authSection: {
    gap: 12,
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
  btn: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  btnApple: {
    backgroundColor: C.white,
  },
  btnAppleIcon: {
    fontSize: 18,
    color: C.black,
  },
  btnGoogle: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  btnGoogleG: {
    fontSize: 18,
    fontWeight: '700',
    color: C.primary,
  },
  btnDarkText: {
    color: C.black,
    fontSize: 16,
    fontWeight: '600',
  },
  btnGuest: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: C.border,
  },
  btnGuestText: {
    color: C.text,
    fontSize: 15,
    fontWeight: '500',
  },

  // ── Divider ───────────────────────────────────────────────────────────────
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 2,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: C.border,
  },
  dividerText: {
    color: C.textTertiary,
    fontSize: 13,
  },

  // ── Guest note ────────────────────────────────────────────────────────────
  guestNote: {
    color: C.textTertiary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },

  // ── Legal ─────────────────────────────────────────────────────────────────
  legal: {
    color: C.textTertiary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 20,
  },
  legalLink: {
    color: C.primaryLight,
    textDecorationLine: 'underline',
  },

  // ── Modal ─────────────────────────────────────────────────────────────────
  modalRoot: {
    flex: 1,
    backgroundColor: C.bg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  modalTitle: {
    color: C.text,
    fontSize: 18,
    fontWeight: '700',
  },
  modalClose: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: C.surface,
  },
  modalCloseText: {
    color: C.primaryLight,
    fontSize: 15,
    fontWeight: '600',
  },
  modalScroll: {
    flex: 1,
  },
  modalContent: {
    padding: 24,
    paddingBottom: 48,
  },
  modalBody: {
    color: C.textSecondary,
    fontSize: 14,
    lineHeight: 24,
    whiteSpace: 'pre-wrap' as unknown as undefined,
  },
});
