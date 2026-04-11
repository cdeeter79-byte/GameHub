# GameHub — App Store Readiness

Last updated: 2026-04-11

## iOS App Store Review Risk Register

GameHub targets App Store approval under the non-Kids Category. Key review categories and GameHub's compliance posture:

| Policy Area | Requirement | GameHub Status | Risk Level |
|---|---|---|---|---|
| **Data Privacy** | Must clearly disclose what data is collected and how it's used | Comprehensive privacy policy + in-app consent | Low |
| **Parental Consent (COPPA)** | Apps collecting data from children <13 must have verifiable parental consent | Parent-directed model with logged consent records | Low |
| **Age-Appropriate Content** | App must not contain 17+ content | No adult content; sports scheduling only | Low |
| **In-App Purchases** | RevenueCat must handle premium subscriptions transparently | RevenueCat configured for Apple subscription receipt validation | Low |
| **Health Data** | HealthKit integration requires explicit disclosure | No HealthKit integration | None |
| **Location** | Background location use requires justification; foreground location is fine | Foreground location only (show event directions) | Low |
| **Camera/Microphone** | Unnecessary use is rejected | No camera/mic access | None |
| **Sign-In** | Must offer account creation without third-party account requirement | Email/Apple/Google options offered | Low |
| **URLs/Unsolicited Contacts** | No spam, scams, or phishing | No external URLs except provider OAuth; verified HTTPS only | Low |
| **Performance** | Crashes, bugs, or incomplete features result in rejection | Requires beta testing on real devices | Medium |
| **Ads** | Ads must be compliant with app's rating; ads for underage users must not be personalized | Ads disabled for UNDER_13 age band | Low |
| **Subscription Disclosure** | Free trial terms, cancellation process must be transparent | Handled by RevenueCat + clear in-app cancellation | Low |

---

## App Store Metadata Checklist

### App Name
- **Primary:** GameHub
- **Subtitle:** "Sports Schedule Hub for Families"
- **Keyword considerations:** "youth sports", "family scheduler", "sports calendar", "team management"

### Description (160 characters max for App Store preview)
```
Stay connected to your kids' sports. Unified schedule, RSVP, messaging, and team rosters from all apps in one place. Parent and coach tools.
```

### Full Description (4000 characters)
```
**Tired of juggling 5+ sports apps?**

GameHub brings all your kids' sports schedules into one unified family app. Connect TeamSnap, SportsEngine, PlayMetrics, and more—all in one place.

**For Parents:**
- Unified calendar across all kids and all sports
- RSVP to games and practices instantly
- Real-time team messaging and notifications
- Find directions and event details
- Manage multiple children in one account

**For Coaches/Managers:**
- Manage team rosters and schedules
- Send team-wide messages
- Track attendance and availability
- Import existing team data
- Optional premium billing

**Supported Providers:**
TeamSnap, SportsEngine, SportsEngine Tournaments, PlayMetrics, LeagueApps, GameChanger (CSV import), BAND, Heja, Crossbar, generic iCalendar feeds, email import, and manual entry.

**Privacy & Family Safety:**
- COPPA-compliant for children under 13
- Parent-controlled child profiles
- No ads for children under 13
- End-to-end encrypted messaging (parent-only)
- Full data transparency and export

**Pricing:**
- Free for parents (with optional premium)
- Free for coaches (with optional team management subscription)
- Cancel anytime

GameHub is built by sports families, for sports families.
```

### Keywords (up to 100 characters)
```
sports, calendar, scheduler, family, youth sports, team management, RSVP, schedule
```

### Support URL
```
https://gamehub.app/support
```

### Privacy Policy URL
```
https://gamehub.app/privacy
```

### Age Rating
- **App Store rating:** 4+ (no objectionable content)
- Questionnaire answers:
  - Alcohol/tobacco: No
  - Gambling: No
  - Realistic violence: No
  - Medical info: No
  - Prolonged graphic violence: No
  - Frequent/intense violence: No
  - Profanity: No
  - Sexualized content: No
  - Mature themes: No
  - Simulated gambling: No
  - Contests: No
  - Kids: Yes (COPPA compliance)

### Localizations (MVP)
- English (US)
- Planned: Spanish, French, German (v1.1)

---

## Screenshots & Assets

### Required Assets
| Asset | Specs | Notes |
|---|---|---|
| App Icon | 1024×1024 PNG, no transparency, rounded corners | Sports-themed (ball, family, calendar motif) |
| Launch Screen | 1170×2532 (iPhone) | Branding only; no marketing copy |
| Screenshots (5 required) | 1170×2532 per screenshot | Dashboard, schedule, RSVP, messaging, settings |
| Preview Video (optional) | MP4, <30 seconds, portrait orientation | Walkthrough of core parent flow |
| Dark Mode Support | All assets in light + dark variants | Auto-detected by system |

### Screenshot Descriptions (per App Store guidelines)
1. **Dashboard:** "See all your kids' upcoming games and practices in one unified calendar."
2. **Schedule:** "Week and month views with sport and team filters."
3. **RSVP:** "Instantly RSVP to events. Sync across all connected apps."
4. **Messaging:** "Team-wide messaging and notifications in one place."
5. **Settings:** "Manage multiple children and connected provider accounts."

---

## Pre-Submission Testing (Internal)

### Device Testing
- [ ] iPhone 15, 14, 13 (current generation)
- [ ] iOS 17, 18 (current and N-1 OS versions)
- [ ] iPad (tablet layout)
- [ ] Light and dark mode
- [ ] Zoom/accessibility text sizing

### Functional Testing
- [ ] Onboarding flow end-to-end
- [ ] Add child profile (all age bands)
- [ ] Connect TeamSnap (OAuth)
- [ ] Fetch and display events
- [ ] RSVP on event
- [ ] Sign out and sign in
- [ ] Premium paywall (RevenueCat)
- [ ] App termination and force-quit (state persistence)
- [ ] Crash-free operation for 10+ minutes of use

### Rejection Prevention
- [ ] No console errors or warnings in Xcode
- [ ] No memory leaks (Instruments profiler)
- [ ] Launch time <5 seconds (cold start)
- [ ] All UI elements respond to taps (no dead zones)
- [ ] Network calls timeout gracefully (no hang)
- [ ] Background fetch completes within 30 seconds
- [ ] No hardcoded API keys or test URLs visible

### Privacy Submission
- [ ] App Privacy questionnaire completed accurately
- [ ] All third-party SDKs listed (RevenueCat, Google Maps, etc.)
- [ ] Data collection minimized (no unnecessary tracking)
- [ ] User privacy choices respected (consent stored)

---

## App Store Review Submission Checklist

- [ ] Bundle ID: `com.gamehub.app`
- [ ] Build number incremented (1, 2, 3...)
- [ ] Version number follows semver (1.0.0)
- [ ] No test credentials in binary
- [ ] No console logs with sensitive data
- [ ] Localizations complete for submission regions
- [ ] Screenshots in all required sizes
- [ ] Release notes written (100 characters max): "GameHub v1.0: Your family's sports command center. Unified schedules, RSVP, messaging."
- [ ] Build uploaded and processed (takes 10–15 minutes)
- [ ] Metadata review: spelling, grammar, no false claims
- [ ] Review URL (if needed): playground account credentials provided separately
- [ ] Submission ready for App Review

---

## Beta Testing (TestFlight)

Before submitting to App Review, run a 2–4 week closed beta on TestFlight:

1. **Build submission:** Upload to App Store Connect
2. **TestFlight invite:** 50–100 beta testers (sports parents + coaches)
3. **Feedback collection:** Collect via TestFlight feedback form + separate survey
4. **Bug triage:** Prioritize crashes; fix, rebuild, re-submit within 2 weeks
5. **Release notes:** Update based on feedback; confirm no blockers
6. **Final submission:** Proceed to App Review

---

## Post-Approval: Maintenance

### Update Policy
- **Major versions** (1.0 → 2.0): ~6-month cadence
- **Minor versions** (1.0 → 1.1): ~2-month cadence
- **Patch releases** (1.0.0 → 1.0.1): As needed for bugs/security
- **Rapid security patch:** Possible expedited review if critical issue identified

### Monitoring Post-Launch
- App Review team monitors crash reports; ensure crash rate <0.1%
- Monitor user reviews; respond to 1-star reviews within 48 hours
- Track app analytics: retention, crash rate, key user flows
- Monitor provider API changes; adapter updates as needed

---

## Android / Google Play (v1.1+)

Similar checklist applies for Google Play Store. Key differences:
- Target API level: 34+ (annually updated requirement)
- Content rating: 3+ (IARC system)
- Data Safety form (similar to App Store privacy questionnaire)
- Build signing: Google Play App Signing required
- Release schedule: Can have staggered rollout (10% → 50% → 100%)

GameHub's multi-platform Expo setup means one codebase, separate store submissions.

---

## Known Risks & Mitigation

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|---|
| Crash on launch | Low | Critical | Beta test 50+ users for 2 weeks |
| Provider OAuth failing | Low | High | Test all OAuth flows with real accounts |
| RevenueCat entitlements not syncing | Medium | High | Validate receipt validation in sandbox |
| Excessive data collection flagged | Low | High | Privacy policy audit by lawyer pre-submission |
| App rejected for "incomplete features" | Medium | Medium | Feature flag incomplete features; disable in production build |
| Performance degradation with many events | Medium | Medium | Load testing with 500+ events per parent |

---

## Launch Communication Plan

1. **Pre-launch:** Private beta via TestFlight (2–4 weeks)
2. **Launch:** Press release + Product Hunt launch + Twitter/LinkedIn announcement
3. **Post-launch:** Bi-weekly feature updates; monthly blog post on product roadmap
4. **Community:** Discord community for feature requests + user support
