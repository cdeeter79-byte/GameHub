// GameHub Pricing Configuration

export interface ManagerTier {
  /** Unique identifier used in Stripe / RevenueCat */
  id: string;
  /** Human-readable tier name */
  name: string;
  /** Maximum number of teams the manager can oversee (-1 = unlimited) */
  maxTeams: number;
  /** Monthly price in USD cents (0 = free) */
  monthlyPrice: number;
  /** Annual price in USD cents (0 = free) */
  annualPrice: number;
  /** True when pricing is negotiated (enterprise) */
  custom?: boolean;
  /** Marketing bullet points for the tier */
  features: string[];
}

export const MANAGER_TIERS: ManagerTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    maxTeams: 1,
    monthlyPrice: 1200, // $12.00
    annualPrice: 11520, // $115.20 (20% off = $9.60/mo)
    features: [
      'Manage up to 1 team',
      'Full schedule sync from all providers',
      'RSVP tracking & writeback',
      'Unified team messaging',
      'Push notifications',
      'Basic attendance reports',
    ],
  },
  {
    id: 'familyPro',
    name: 'Family Pro',
    maxTeams: 5,
    monthlyPrice: 2900, // $29.00
    annualPrice: 27840, // $278.40 (20% off = $23.20/mo)
    features: [
      'Manage up to 5 teams',
      'Everything in Starter',
      'Tournament bracket views',
      'Google Calendar sync',
      'Advanced RSVP analytics',
      'Priority support',
      'Volunteer shift management',
    ],
  },
  {
    id: 'club',
    name: 'Club',
    maxTeams: 15,
    monthlyPrice: 5900, // $59.00
    annualPrice: 56640, // $566.40 (20% off = $47.20/mo)
    features: [
      'Manage up to 15 teams',
      'Everything in Family Pro',
      'Bulk schedule import',
      'Club-wide announcements',
      'Custom branding & logo',
      'Manager sub-accounts',
      'Export to CSV / PDF',
      'Dedicated onboarding',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    maxTeams: -1, // unlimited
    monthlyPrice: 0,
    annualPrice: 0,
    custom: true,
    features: [
      'Unlimited teams & leagues',
      'Everything in Club',
      'White-label options',
      'SSO / SAML integration',
      'Custom provider integrations',
      'SLA & uptime guarantee',
      'Dedicated account manager',
      'API access',
    ],
  },
];

// ─── Parent / Fan Tiers ────────────────────────────────────────────────────────

export type ParentPlanId = 'free' | 'premium';

export interface ParentTier {
  id: ParentPlanId;
  name: string;
  /** Monthly price in USD cents (0 = free) */
  monthlyPrice: number;
  /** Annual price in USD cents (0 = free) */
  annualPrice: number;
  /** Maximum number of linked sport providers (-1 = unlimited) */
  maxProviders: number;
  showAds: boolean;
  features: string[];
}

export const PARENT_TIERS: ParentTier[] = [
  {
    id: 'free',
    name: 'Free',
    monthlyPrice: 0,
    annualPrice: 0,
    maxProviders: 3,
    showAds: true,
    features: [
      'Connect up to 3 sport providers',
      'Unified family schedule',
      'Basic RSVP tracking',
      'Standard notifications',
      'Ad-supported experience',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    monthlyPrice: 499, // $4.99
    annualPrice: 3588, // $35.88 ($2.99/mo — 40% off)
    maxProviders: -1,
    showAds: false,
    features: [
      'Unlimited sport providers',
      'No ads',
      'Priority schedule sync',
      'Google Calendar sync',
      'Conflict detection & smart merge',
      'Offline mode',
      'Advanced notifications',
      'Early access to new features',
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns the cheapest ManagerTier that supports the given team count.
 * Falls back to the enterprise tier for very large counts.
 */
export function getManagerTier(teamCount: number): ManagerTier {
  const suitable = MANAGER_TIERS.find(
    (t) => t.maxTeams === -1 || t.maxTeams >= teamCount,
  );
  // Enterprise is always last and has maxTeams = -1, so this will never be undefined
  return suitable ?? MANAGER_TIERS[MANAGER_TIERS.length - 1];
}

/**
 * Returns the annual savings in USD cents for a given manager tier
 * compared to paying monthly for 12 months.
 */
export function annualSavings(tier: ManagerTier): number {
  if (tier.custom || tier.monthlyPrice === 0) {
    return 0;
  }
  return tier.monthlyPrice * 12 - tier.annualPrice;
}

/**
 * Returns the annual savings in USD cents for a parent tier.
 */
export function parentAnnualSavings(tier: ParentTier): number {
  if (tier.monthlyPrice === 0) {
    return 0;
  }
  return tier.monthlyPrice * 12 - tier.annualPrice;
}

/**
 * Formats a price in cents to a display string like "$12.00".
 */
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
