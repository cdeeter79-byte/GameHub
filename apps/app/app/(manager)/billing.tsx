import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { colors, spacing, typography, radii, MANAGER_TIERS } from '@gamehub/config';
import { Card } from '@gamehub/ui';

export default function ManagerBillingScreen() {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Team Manager Plans</Text>
      <Text style={styles.subheading}>
        Manage your teams with powerful tools. Lower per-team cost as you grow.
      </Text>

      {MANAGER_TIERS.filter((t) => !t.custom).map((tier) => (
        <Card key={tier.id} style={styles.tierCard}>
          <View style={styles.tierHeader}>
            <Text style={styles.tierName}>{tier.name}</Text>
            <View>
              <Text style={styles.tierPrice}>
                ${tier.monthlyPrice}<Text style={styles.tierPer}>/mo</Text>
              </Text>
              <Text style={styles.tierAnnual}>
                ${tier.annualPrice}/yr · save ${tier.monthlyPrice * 12 - tier.annualPrice}
              </Text>
            </View>
          </View>
          <Text style={styles.tierLimit}>
            Up to {tier.maxTeams === Infinity ? 'unlimited' : tier.maxTeams} team{tier.maxTeams !== 1 ? 's' : ''}
          </Text>
          <View style={styles.features}>
            {tier.features.map((f) => (
              <Text key={f} style={styles.feature}>✓ {f}</Text>
            ))}
          </View>
          <TouchableOpacity
            style={styles.cta}
            accessibilityRole="button"
            accessibilityLabel={`Subscribe to ${tier.name}`}
            onPress={() => { /* Launch Stripe checkout */ }}
          >
            <Text style={styles.ctaText}>Get Started</Text>
          </TouchableOpacity>
        </Card>
      ))}

      {/* Enterprise */}
      <Card style={styles.tierCard}>
        <Text style={styles.tierName}>Enterprise</Text>
        <Text style={styles.tierLimit}>16+ teams · custom pricing</Text>
        <Text style={styles.enterpriseDesc}>
          For leagues and clubs with multiple teams. Includes dedicated support,
          org-level dashboard, and volume discounts.
        </Text>
        <TouchableOpacity
          style={[styles.cta, styles.ctaOutline]}
          onPress={() => Linking.openURL('mailto:sales@gamehub.app')}
          accessibilityRole="button"
          accessibilityLabel="Contact sales for enterprise pricing"
        >
          <Text style={[styles.ctaText, styles.ctaOutlineText]}>Contact Sales</Text>
        </TouchableOpacity>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.neutral[950] },
  content: { padding: spacing[5], paddingBottom: spacing[10], gap: spacing[4] },
  heading: { color: colors.white, fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold },
  subheading: { color: colors.neutral[400], fontSize: typography.fontSize.sm, lineHeight: 22 },
  tierCard: { backgroundColor: colors.neutral[900], padding: spacing[5], gap: spacing[3] },
  tierHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  tierName: { color: colors.white, fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold },
  tierPrice: { color: colors.primary[300], fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, textAlign: 'right' },
  tierPer: { fontSize: typography.fontSize.sm, color: colors.neutral[400] },
  tierAnnual: { color: colors.neutral[500], fontSize: typography.fontSize.xs, textAlign: 'right' },
  tierLimit: { color: colors.neutral[300], fontSize: typography.fontSize.sm },
  features: { gap: spacing[1] },
  feature: { color: colors.neutral[300], fontSize: typography.fontSize.sm },
  cta: {
    backgroundColor: colors.primary[600],
    padding: spacing[3],
    borderRadius: radii.lg,
    alignItems: 'center',
    marginTop: spacing[2],
  },
  ctaText: { color: colors.white, fontWeight: typography.fontWeight.semibold },
  ctaOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.primary[600] },
  ctaOutlineText: { color: colors.primary[400] },
  enterpriseDesc: { color: colors.neutral[400], fontSize: typography.fontSize.sm, lineHeight: 20 },
});
