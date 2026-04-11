# GameHub Product Requirements Document

**Version:** 1.0  
**Date:** 2026-04-11  
**Status:** Active  
**Owner:** Product

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Problem Statement](#problem-statement)
3. [Product Vision](#product-vision)
4. [Target Users](#target-users)
5. [Dual Product Model](#dual-product-model)
6. [User Stories](#user-stories)
7. [Feature Prioritization](#feature-prioritization)
8. [Success Metrics](#success-metrics)
9. [Risks and Mitigations](#risks-and-mitigations)

---

## Executive Summary

GameHub is a universal sports family platform that solves the chronic fragmentation problem in youth sports management. Families with children in multiple sports leagues are forced to juggle 3–7 different apps simultaneously — TeamSnap for soccer, GameChanger for baseball, SportsEngine for the travel team, BAND for parent communication, and more. Each app has its own notification model, calendar format, RSVP mechanism, and UX. Parents miss games. Coaches get low RSVP rates. Managers waste time on administrative overhead.

GameHub unifies all of this into a single platform. On the parent side, it aggregates schedules, RSVPs, and communications from every provider into one unified inbox and calendar. On the manager side, it provides a lightweight SaaS toolkit for teams that do not use any external provider — or that want cross-platform broadcast capabilities.

GameHub is built on React Native + Expo with full web parity via React Native Web, deployed to iOS App Store and GitHub Pages. The backend is Supabase (Postgres + Auth + Realtime + Edge Functions). Monetization is dual: RevenueCat subscription for parent premium features, Stripe SaaS billing for the manager product.

---

## Problem Statement

### The Fragmentation Crisis in Youth Sports

Youth sports participation in the United States involves approximately 60 million children per year. The average sports family has 2.1 children, each participating in 1.8 sports per season. This means the average sports parent is juggling 3–5 sports management apps at any given time.

**Core pain points identified:**

1. **Calendar fragmentation:** Each provider has its own calendar. Parents must check multiple apps to know where to be on Saturday morning. Conflicts between games are discovered late or not at all.

2. **RSVP inconsistency:** RSVP systems vary wildly. Some apps send push notifications, some email, some in-app. Low response rates frustrate coaches and leave them unable to plan.

3. **Communication silos:** Team chats, announcements, and updates live in separate apps. A weather cancellation in TeamSnap does not surface in the parent's main notification feed.

4. **Cognitive load:** Parents report "app fatigue." They forget to check one of the four apps and miss critical information. Notification volume from multiple apps causes notification blindness.

5. **Manager overhead:** Team managers — often volunteer parents — must use whatever tool their league mandates. Many small recreational leagues have no tool at all and manage via group text.

6. **No unified family view:** A parent with a soccer player and a baseball player cannot see both schedules side-by-side without switching apps.

### What the Market Lacks

Existing solutions are provider-specific. TeamSnap serves TeamSnap leagues. GameChanger serves GameChanger leagues. No neutral aggregation layer exists that puts the parent — not the league — in control of their experience.

---

## Product Vision

> GameHub is the one app every sports family needs, regardless of which platform their coaches use.

**Three-year vision:** GameHub becomes the default home screen for sports families. Every league, every provider, every sport — visible in one place. Parents gain back hours of cognitive overhead per month. Coaches see higher RSVP rates because their players' parents actually see the requests. Managers of small teams get enterprise-grade scheduling and communication without enterprise pricing.

**Guiding principles:**

- **Parent-first:** The primary design lens is the parent experience. Features that benefit parents take priority over features that benefit managers.
- **Provider-neutral:** GameHub does not compete with TeamSnap or SportsEngine. It sits above them as an aggregation layer.
- **Privacy by default:** Youth sports data is sensitive. Children's information is never monetized. COPPA compliance is non-negotiable.
- **Simplicity under complexity:** The underlying system is technically complex (12 provider integrations, real-time sync, conflict resolution). The user experience must feel simple.
- **Offline-first resilience:** Sports happen in parks with poor cell service. Core features must work without a reliable internet connection.

---

## Target Users

### Primary: Sports Parents

**Profile:** Parent or guardian of one or more children participating in organized youth sports. Age 28–55. Manages schedules for the household. May have children in multiple sports simultaneously.

**Jobs to be done:**
- Know where my kids need to be and when, without checking multiple apps
- RSVP quickly from a single notification
- See whether there are schedule conflicts before they happen
- Get cancellation and weather alerts regardless of which provider the coach uses
- Share the schedule with a co-parent or caregiver

**Technical profile:** Mixed. Many are comfortable smartphone users but not power users. They will not tolerate complex onboarding. They expect the app to work like a consumer product.

**Willingness to pay:** Moderate. Free tier must be genuinely useful. Premium ($4.99–$9.99/month) is viable if it saves meaningful time.

### Secondary: Team Managers

**Profile:** Volunteer parent-coach, assistant coach, or league administrator who is responsible for scheduling and communicating with a team. May or may not be a technology-forward user.

**Jobs to be done:**
- Schedule games and practices without a paid league platform
- Send announcements to all team families at once
- Track RSVP status before a game
- Create repeating practice schedules
- Export schedules to CSV or share links with parents

**Technical profile:** Mixed. Ranges from highly technical to "I just need it to work."

**Willingness to pay:** Low to moderate for self-organized teams. $19.99–$49.99/month for a manager plan is viable if it replaces a more expensive platform.

### Tertiary: Coaches

Coaches use the manager product primarily for RSVP visibility and game-day communication. They are not the primary buyer but are a key activation path — if a coach adopts GameHub, all their players' families are potential parent users.

---

## Dual Product Model

GameHub operates two distinct but connected products on a shared platform.

### Product A: Parent App (Consumer)

A mobile-first consumer app for sports parents. Free with optional premium subscription managed via RevenueCat.

**Free tier:**
- Connect up to 2 providers
- Unified calendar (read-only)
- Basic RSVP (respond to existing requests)
- Push notifications for schedule changes

**Premium tier ($6.99/month or $49.99/year):**
- Unlimited provider connections
- Conflict detection and alerts
- Family sharing (add co-parent/caregiver)
- Advanced notification preferences
- Priority sync (more frequent background refresh)
- Export to Apple/Google Calendar
- Offline mode with full schedule cache

### Product B: Manager SaaS (B2B)

A web-first SaaS product for team managers who do not use an existing provider, or who use GameHub as a secondary communication layer.

**Starter (free):**
- 1 team, up to 15 players
- Basic scheduling
- Email announcements

**Team plan ($19.99/month):**
- Up to 3 teams
- RSVP tracking
- Push notifications to parent app users
- Roster management
- Game-day lineup

**Club plan ($49.99/month):**
- Unlimited teams
- Tournament scheduling
- Standings and bracket management
- Bulk import/export
- Priority support

Manager billing is processed via Stripe. Manager plans are independent of parent premium subscriptions.

---

## User Stories

### Parent User Stories

**P-01:** As a sports parent, I want to connect my TeamSnap account so that my child's soccer schedule appears in GameHub without manual entry.

**P-02:** As a sports parent, I want to see all my children's games and practices in a single weekly calendar view so that I can plan my week at a glance.

**P-03:** As a sports parent, I want to receive a single push notification for RSVP requests from any connected provider so that I never miss a response deadline.

**P-04:** As a sports parent, I want to RSVP to a game directly from the notification without opening the app so that responding takes under five seconds.

**P-05:** As a sports parent, I want to see a conflict alert when two events overlap so that I can proactively communicate with coaches.

**P-06:** As a sports parent with a co-parent, I want to share my family's sports calendar so that both parents see the same schedule.

**P-07:** As a sports parent, I want to subscribe to my child's schedule as an ICS calendar feed so that events appear in my Apple or Google Calendar.

**P-08:** As a sports parent, I want to see driving directions to a venue directly from an event detail screen so that I don't need to copy-paste addresses.

**P-09:** As a sports parent, I want to see weather conditions for upcoming outdoor games so that I can dress my child appropriately.

**P-10:** As a sports parent, I want to get a notification when a game is cancelled or rescheduled so that I hear about it before driving to the field.

**P-11:** As a sports parent, I want to filter the calendar by child or sport so that I can focus on one child's schedule when needed.

**P-12:** As a sports parent, I want to see my RSVP history so that I can confirm I responded to an important event.

**P-13:** As a sports parent, I want to add a manual event (e.g., a pickup game not in any provider) so that my GameHub calendar is truly complete.

**P-14:** As a sports parent on a free plan, I want to understand clearly what premium features exist and what the cost is so that I can make an informed upgrade decision.

**P-15:** As a sports parent, I want my app to work when I'm at the field with no cell service so that I can still see the schedule and venue address.

**P-16:** As a sports parent, I want to set quiet hours for notifications so that I'm not woken up at midnight by a schedule update.

**P-17:** As a sports parent, I want to see team roster information (names, jersey numbers) so that I can identify my child's teammates.

**P-18:** As a sports parent, I want to receive in-app messages from my child's coach when the provider supports messaging so that I don't need to switch to another app.

**P-19:** As a sports parent, I want to see standings for my child's league when available so that I understand where the team ranks.

**P-20:** As a sports parent, I want to connect a GameChanger account so that my son's baseball live scores and stats are visible in GameHub.

### Manager User Stories

**M-01:** As a team manager, I want to create a team in GameHub without needing a league platform so that I can manage a recreational team independently.

**M-02:** As a team manager, I want to invite parents to my team by sharing a link or QR code so that onboarding does not require their email addresses.

**M-03:** As a team manager, I want to schedule a repeating weekly practice so that I don't need to create 16 separate events.

**M-04:** As a team manager, I want to see RSVP status for an upcoming game in a dashboard so that I know if I have enough players.

**M-05:** As a team manager, I want to send a push notification announcement to all team families so that important information reaches everyone immediately.

**M-06:** As a team manager, I want to export the team schedule to CSV so that I can share it with parents who don't use the app.

**M-07:** As a team manager, I want to mark a game as cancelled and have all parents notified automatically so that I don't need to contact each family individually.

**M-08:** As a team manager, I want to upgrade to a paid plan using a credit card so that I can unlock advanced features for my club.

**M-09:** As a team manager, I want to manage multiple teams under one account so that I can oversee an entire club from one dashboard.

**M-10:** As a team manager, I want to set up a tournament bracket so that families can follow the elimination rounds.

---

## Feature Prioritization

### MVP (v0.1) — Core Viability

These features must be present for the product to deliver its core value proposition.

| Feature | Rationale |
|---|---|
| Supabase auth (email + Google + Apple) | Foundation for all personalization |
| TeamSnap OAuth integration | Largest provider by install base |
| SportsEngine credential integration | Second largest provider |
| Unified calendar view (week/month) | Primary parent value proposition |
| Event detail screen with map link | Essential for game-day use |
| Basic RSVP (read + write where supported) | Core engagement mechanic |
| Push notifications for schedule changes | Critical for retention |
| ICS import (manual file upload) | Universal fallback |
| Manual event creation | Completeness fallback |
| Parent onboarding flow | Without this, nothing else works |
| RevenueCat paywall (free/premium gates) | Required for monetization |
| Child profile management | Required for multi-child families |
| Basic notification preferences | Required for app store approval |
| iOS App Store build pipeline | Target platform |
| Web deployment to GitHub Pages | Secondary access surface |

### v1.0 Public Beta — Full Consumer Experience

| Feature | Rationale |
|---|---|
| GameChanger integration | Baseball-heavy demographic |
| PlayMetrics integration | Growing soccer platform |
| LeagueApps integration | Covers many league types |
| BAND scraping/fallback | High demand from parents |
| Heja integration | Growing soccer platform |
| Conflict detection engine | Key premium differentiator |
| Family sharing (co-parent) | High value for two-parent households |
| ICS calendar export (subscribe link) | High demand feature |
| Weather widget on event detail | Quality of life |
| Offline mode with full cache | Reliability at fields |
| Manager product (Starter + Team plans) | Revenue diversification |
| Stripe billing integration | Required for manager plans |
| Multi-child filter | Required for families with 3+ children |
| Notification quiet hours | App store / UX requirement |
| Accessibility audit pass (WCAG 2.1 AA) | Required for App Store |

### v1.1 — Retention and Engagement

| Feature | Rationale |
|---|---|
| Crossbar integration | Hockey demographic |
| SportsEngine Tourney integration | Tournament parents |
| Email import parsing | Covers legacy leagues |
| GameChanger live score widget | Engagement for baseball families |
| In-app messaging aggregation | Reduces app switching |
| RSVP history view | Parent-requested feature |
| Roster view | Parent-requested feature |
| Standings aggregation | Engagement driver |
| Club manager plan + tournament tools | Upsell path |
| Manager analytics dashboard | Manager retention |
| Android / Google Play release | Expand addressable market |

### Future / v2.0

| Feature | Rationale |
|---|---|
| AI-powered schedule conflict resolution suggestions | Premium differentiator |
| Carpooling coordination | High community value |
| Team store / fundraising links | Revenue potential |
| Photo/video sharing from games | Engagement driver |
| Referee assignment integration | League admin use case |
| Field condition reporting | Community sourced |
| Multi-language support (Spanish priority) | Demographic alignment |
| Apple Watch companion app | Premium experience |
| Siri/Google Assistant shortcuts | Power user feature |

---

## Success Metrics

### Acquisition

| Metric | MVP Target | v1.0 Target |
|---|---|---|
| Monthly new parent signups | 500 | 5,000 |
| Monthly new manager signups | 50 | 500 |
| Provider connections per active user | 1.5 | 2.3 |
| App Store rating | — | ≥ 4.3 |

### Activation

| Metric | Target |
|---|---|
| % users who connect at least 1 provider within 24h of signup | ≥ 60% |
| % users who complete onboarding in one session | ≥ 75% |
| Time to first calendar event visible | ≤ 3 minutes |

### Engagement

| Metric | Target |
|---|---|
| DAU / MAU ratio | ≥ 0.25 |
| RSVP response rate (GameHub-connected users vs baseline) | +20% vs baseline |
| Push notification open rate | ≥ 18% |
| 30-day retention | ≥ 45% |

### Monetization

| Metric | MVP Target | v1.0 Target |
|---|---|---|
| Parent premium conversion rate | — | ≥ 4% |
| Manager paid plan conversion | — | ≥ 12% |
| Monthly recurring revenue | — | $10,000 |
| Average revenue per paying user | — | $7.50/month |

### Technical

| Metric | Target |
|---|---|
| API sync success rate | ≥ 99.5% |
| Push notification delivery rate | ≥ 98% |
| App crash rate | ≤ 0.5% |
| P95 calendar load time | ≤ 1.5s |
| Sync latency (provider change → user notification) | ≤ 5 minutes |

---

## Risks and Mitigations

### R-01: Provider API Instability (HIGH)

**Risk:** TeamSnap, SportsEngine, or another major provider changes or deprecates their API without notice, breaking integrations for a significant percentage of users.

**Likelihood:** Medium. Provider APIs are generally stable but not versioned with SLAs for third parties.

**Impact:** High. Broken integrations directly damage core value proposition.

**Mitigation:**
- Implement per-provider circuit breakers with graceful degradation messaging
- Monitor API endpoints via synthetic health checks every 15 minutes
- Build ICS fallback for every provider so parents can still access schedules
- Establish partner relationships with major providers where possible
- Legal review of each provider's Terms of Service before integration

### R-02: Provider Terms of Service Violation (CRITICAL)

**Risk:** A provider's ToS prohibits third-party data aggregation, and enforcement action causes a legal or technical access revocation.

**Likelihood:** Low-Medium. Some providers explicitly prohibit screen scraping.

**Impact:** Critical. Loss of a major provider integration affects a large user segment.

**Mitigation:**
- Legal review of all 12 provider ToS before MVP launch
- Prefer official OAuth/API paths over credential-based or scraping approaches
- For providers requiring scraping, pursue formal partnership agreements
- Document ToS risk level per provider in the feasibility matrix
- Have graceful fallback messaging ready for users if an integration is disabled

### R-03: COPPA Non-Compliance (CRITICAL)

**Risk:** App is found to collect or process children's data in ways that violate COPPA, resulting in FTC enforcement.

**Likelihood:** Low if parent-directed model is properly implemented.

**Impact:** Critical. FTC fines can reach $50,000+ per violation. App Store removal is possible.

**Mitigation:**
- Implement strict parent-directed model (parents register, children are non-signing profiles)
- No behavioral advertising targeting any user
- No collection of biometric or location data from child profiles
- Privacy policy reviewed by counsel with COPPA expertise before launch
- Annual compliance review

### R-04: App Store Rejection (HIGH)

**Risk:** Apple App Store rejects the initial submission or a subsequent update due to guidelines violations.

**Likelihood:** Medium. Sports apps with subscription paywalls and youth-adjacent content receive additional scrutiny.

**Impact:** High. Delays launch or update deployment.

**Mitigation:**
- Complete App Store readiness checklist before each submission
- Do not use Kids Category (avoids the strictest restrictions while still being appropriate for families)
- Implement account deletion within the app per App Store requirement 5.1.1
- Prepare App Review communication template for escalations
- TestFlight beta with 100+ external testers before submission

### R-05: Low Provider Connection Rate (HIGH)

**Risk:** Parents do not successfully connect their provider accounts during onboarding, reducing core value delivery.

**Likelihood:** Medium. OAuth flows and credential-based auth have known friction points.

**Impact:** High. A parent who cannot connect their TeamSnap account sees no schedule data and churns.

**Mitigation:**
- Invest heavily in onboarding UX — provider connection should be the hero moment
- Support ICS import and email import as fallbacks for any provider
- Provide clear error messages and support documentation for each auth failure mode
- Track connection success rates per provider and address outliers

### R-06: RevenueCat / Stripe Integration Failure (MEDIUM)

**Risk:** A billing system outage or integration bug prevents subscription purchases or manager plan upgrades.

**Likelihood:** Low. RevenueCat and Stripe are highly reliable.

**Impact:** Medium. Lost revenue, frustrated users.

**Mitigation:**
- Implement retry logic and clear error states in paywall and checkout flows
- Monitor billing webhooks with alerting
- Test billing flows in staging before every release

### R-07: Competitive Response from Providers (MEDIUM)

**Risk:** TeamSnap, SportsEngine, or another large provider perceives GameHub as a threat and takes action to block API access or launch a competing aggregator.

**Likelihood:** Low-Medium.

**Impact:** Medium-High depending on which provider.

**Mitigation:**
- Position GameHub as complementary to providers, not competitive
- Focus on parent experience, not manager tools that compete with providers
- Diversify provider coverage so no single provider's loss is fatal

### R-08: Data Breach (HIGH)

**Risk:** A security incident exposes user credentials, children's data, or provider tokens.

**Likelihood:** Low with proper security controls.

**Impact:** Critical. Regulatory exposure, loss of user trust, potential FTC action.

**Mitigation:**
- Encrypt all provider tokens at rest using Supabase Vault
- Never store plaintext credentials server-side
- Implement RLS policies on all Supabase tables
- Conduct security review before MVP launch
- Establish incident response plan

### R-09: Notification Fatigue (MEDIUM)

**Risk:** Users receive too many notifications from GameHub and disable them, breaking the core engagement loop.

**Likelihood:** Medium. Multi-provider aggregation can produce high notification volume.

**Impact:** Medium. Reduces engagement and RSVP response rates.

**Mitigation:**
- Implement smart notification deduplication (same event update from multiple sources = one notification)
- Provide granular notification preferences (per-child, per-provider, per-event-type)
- Default to a conservative notification profile; let users opt in to more
- Implement quiet hours

### R-10: Engineering Capacity Risk (MEDIUM)

**Risk:** 12 provider integrations across two products exceed available engineering capacity, causing delays or quality degradation.

**Likelihood:** High in early stages.

**Impact:** Medium. Delays MVP or forces scope reduction.

**Mitigation:**
- Phase provider integrations by reach (TeamSnap and SportsEngine first, covering ~60% of target users)
- Build provider adapter framework so each integration is incremental, not from scratch
- Treat ICS as a universal fallback that covers gaps while new adapters are built
