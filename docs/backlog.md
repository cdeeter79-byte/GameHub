# GameHub — Product Backlog & Roadmap

Last updated: 2026-04-11

---

## Milestone: v1.0.0 — MVP (Target: Q3 2026)

### Core Features
- [x] User onboarding (parent registration, child profiles, age bands)
- [x] Supabase auth (Google + Apple Sign-In)
- [x] Provider connections (OAuth flow)
- [x] Unified event calendar (merge + dedup)
- [x] RSVP sync (read/write/conflict resolution)
- [x] Team roster viewing
- [x] Messaging (read from connected providers)
- [x] Push notifications (event reminders)
- [x] Parent premium freemium model (RevenueCat)
- [x] iOS build (Xcode + eas build)
- [x] Web static export (GitHub Pages)
- [x] COPPA compliance (parental consent, age gating)
- [x] Accessibility (WCAG 2.1 AA target)

### Supported Providers (MVP)
1. **TeamSnap** — Full integration (read/write)
2. **SportsEngine** — Read-only
3. **ICS Feed** — Universal calendar import
4. **Manual Entry** — Always available

### Technical Requirements
- [x] Turborepo monorepo setup
- [x] TypeScript strict mode
- [x] Jest unit tests (80%+ coverage on domain)
- [x] GitHub Actions CI/CD (lint, typecheck, test, web-build, ios-check)
- [x] Supabase RLS policies (data isolation)
- [x] Environment variable management (.env.example)
- [x] Security scan (npm audit, CodeQL)
- [x] Error handling & logging (Sentry integration planned for v1.1)

### Non-Functional Requirements
- [x] Launch time <2 seconds
- [x] Crash-free operation (target: <0.1% crash rate)
- [x] Responsiveness (tap feedback <100ms)
- [x] Color contrast (WCAG AA: 4.5:1)
- [x] Touch targets (44×44 points)

---

## Milestone: v1.1.0 — Phase 2 Providers + Refinement (Target: Q4 2026)

### New Provider Integrations
- [ ] **PlayMetrics** — Coach-oriented schedules (API key auth)
- [ ] **LeagueApps** — League management platform (OAuth/API key hybrid)
- [ ] **Email Import** — Parse sports schedules from email
- [ ] **GameChanger CSV** — One-way CSV import UI
- [ ] **BAND** — Partner API (if partnership secured); messaging read-only

### UI/UX Improvements
- [ ] Dashboard redesign (card-based layout, visual polish)
- [ ] Calendar view options (agenda, day, week, month enhanced)
- [ ] Sport-specific icons (soccer, baseball, hockey, etc.)
- [ ] Dark mode enhancements (automatic dark color scheme per sport)
- [ ] Onboarding animations + microcopy improvements

### Feature Enhancements
- [ ] Message compose UI (reply in-thread)
- [ ] Event location search (show nearby events)
- [ ] Recurring event display (show series, not individual instances)
- [ ] Undo RSVP (grace period before sync)
- [ ] Export calendar (add to Apple Calendar, Google Calendar, Outlook)

### Performance & Reliability
- [ ] Offline mode (cache recent events, queued RSVP)
- [ ] Sync retry exponential backoff improvements
- [ ] Event deduplication refinement (match by location + time)
- [ ] Error recovery UX (clearer sync failure messages)
- [ ] App launch optimization (<1 second cold start)

### Observability
- [ ] Sentry error tracking integration
- [ ] Analytics (Firebase or PostHog)
- [ ] Performance monitoring (Core Web Vitals)
- [ ] Crash dashboard in admin panel

---

## Milestone: v1.2.0 — Accessibility & Compliance Audit (Target: Q1 2027)

### Accessibility (WCAG 2.1 AA Full Compliance)
- [ ] VoiceOver testing (iOS)
- [ ] TalkBack testing (Android)
- [ ] Keyboard navigation audit (web)
- [ ] Color contrast remediation (any failures from v1.0)
- [ ] axe-core CI integration
- [ ] WCAG 2.1 AA third-party audit report

### COPPA Compliance Audit
- [ ] Legal review of privacy policy + consent forms
- [ ] Parental consent flow user testing (5+ parents)
- [ ] Audit log completeness verification
- [ ] Data minimization audit (no unnecessary child data)
- [ ] Third-party service compliance check (analytics, ads, etc.)
- [ ] Data deletion + export features verified

### Internationalization (i18n)
- [ ] Spanish (Latin America) localization
- [ ] French (Canada/Europe) localization
- [ ] German localization
- [ ] RTL language support (planned for future)

### Security Hardening
- [ ] Penetration testing (external firm)
- [ ] Code signing for iOS (Apple Developer)
- [ ] Secrets rotation policy
- [ ] Rate limiting on API endpoints
- [ ] DDOS mitigation (Cloudflare)

---

## Milestone: v2.0.0 — Manager SaaS Platform (Target: Q2 2027)

### Manager App Features
- [ ] Team creation + management
- [ ] Roster management (add/remove players)
- [ ] Event scheduling (create/edit/delete games + practices)
- [ ] RSVP tracking (attendance dashboard)
- [ ] Messaging (team-wide notifications)
- [ ] Document sharing (team files, schedule PDFs)
- [ ] Billing dashboard (Stripe integration)
- [ ] Analytics (team engagement metrics)

### Monetization
- [ ] Stripe subscription tiers (Starter/$12, Family/$29, Club/$59, Enterprise/custom)
- [ ] Usage-based billing (optional)
- [ ] Team member seats (limit team size by tier)
- [ ] White-label options (for leagues)

### Provider Integrations for Managers
- [ ] Export GameHub events to TeamSnap
- [ ] Bulk roster import from SportsEngine
- [ ] CSV/Excel roster templates
- [ ] Webhook support (push events to external systems)

### Advanced Features
- [ ] Tournament bracket management
- [ ] Game scoring + live updates
- [ ] Photo gallery (post-game photos)
- [ ] Parent payment collection (fees, uniforms, etc.)
- [ ] Parent communication tools (announcements, polls)

---

## Future Roadmap (v2.1+)

### Long-Term Enhancements
- [ ] **Multi-family accounts:** Manage grandparent/guardian relationships
- [ ] **Health tracking:** Integration with wearables (Fitbit, Apple Watch)
- [ ] **Coach certification:** Store/verify coach credentials
- [ ] **Youth development:** Player stats, skill tracking (coach-facing)
- [ ] **Sponsorships:** Parent-facing sponsor ads (contextual, non-personalized)
- [ ] **Social:** Team photo sharing, game recaps
- [ ] **Analytics API:** Custom reports for leagues/clubs
- [ ] **Mobile web app:** Progressive Web App (PWA) for browsers

### Potential Integrations (Post-MVP)
- Calendar sync (Apple Calendar, Google Calendar, Outlook)
- Chat platforms (Slack, Discord)
- Team management systems (Tourney.net, Bracket.io)
- Payment systems (Square, Stripe for team fees)

---

## Bug Backlog (Prioritized)

| Bug | Severity | v1.0 | v1.1 | Notes |
|---|---|---|---|---|
| RSVP sync race condition on rapid clicks | High | P1 | v1.0.1 | Add button debounce |
| Provider auth token expiry not handled | High | P1 | v1.0 | Refresh token rotation |
| Large event lists cause scroll jank | Medium | P2 | v1.1 | Virtualization + pagination |
| Error messages not user-friendly | Medium | P2 | v1.1 | Rewrite error copy |
| Map directions fail on iOS without Google Maps | Low | P3 | v1.1 | Fallback to Apple Maps only |

---

## Known Limitations & Technical Debt

### v1.0 Scope Exclusions
- **Manager mode:** SaaS team management deferred to v2.0
- **Live scoring:** Real-time game score updates (requires provider support)
- **Photo gallery:** Team photos / post-game album
- **Advanced messaging:** Threaded conversations, file attachments
- **Offline mode:** Full offline-first sync (partial caching only)
- **Android:** Build available; Google Play launch post-TestFlight v1.0

### Technical Debt
| Item | Impact | Mitigation |
|---|---|---|
| RSVP writeback not all providers | Medium | Documented in adapter; graceful degradation |
| GameChanger has no API | Medium | CSV import workaround; educate users |
| ICS parser is lenient (may miss events) | Low | User warnings; manual entry fallback |
| Analytics not integrated | Low | Sentry error tracking sufficient for v1.0 |
| No A/B testing framework | Low | Feature flags enable manual cohort testing |

---

## Quarterly Planning Template

### Q3 2026 (v1.0.0 Launch)
- **Goals:** Ship MVP to TestFlight, get App Review approval, soft launch to 100 beta users
- **Team:** 2 engineers, 1 designer, 1 PM
- **Key milestones:** Code complete (Aug 1), TestFlight beta (Aug 15), App Review submission (Sep 1)
- **Risks:** Provider auth bugs, COPPA compliance delays, App Review rejection

### Q4 2026 (v1.1.0 Features)
- **Goals:** Add 2–3 new provider integrations, 1000+ paying parents
- **Team:** Same + 1 contractor
- **Key milestones:** PlayMetrics + LeagueApps integration (Oct), email import (Nov), release (Dec)

### Q1 2027 (v1.2.0 Polish)
- **Goals:** Full WCAG AA compliance, security audit, i18n
- **Team:** Same + 1 accessibility specialist (contract)
- **Key milestones:** Accessibility audit (Jan), compliance signed-off (Feb), release (Mar)

### Q2 2027 (v2.0.0 Manager SaaS)
- **Goals:** Beta launch of manager tier; $10k MRR target
- **Team:** 3 engineers, 1 designer, 1 PM, 1 sales/CS
- **Key milestones:** Manager onboarding (Apr), Stripe billing (May), beta invite (June)

---

## Success Metrics

### Engagement (v1.0)
- Parent DAU > 50% of signups
- Schedule views per parent > 3/week
- RSVP rate > 60% of events invited
- Message open rate > 70%

### Retention (v1.1+)
- 30-day retention > 40%
- 90-day retention > 20%
- Premium conversion > 5% of free users

### Growth (v2.0+)
- Organic signup rate > 30% of total
- Team manager signups > 100 in beta
- Manager tier MRR > $5k by Q3 2027

---

## Decision Log

| Decision | Rationale | Date |
|---|---|---|
| Parent-directed model (not Kids Category) | Maintains monetization; COPPA compliance still full | 2026-01-15 |
| Turborepo monorepo | Faster builds; single dependency tree | 2026-01-20 |
| Supabase (not Firebase) | PostgreSQL allows complex RLS; better for privacy | 2026-01-22 |
| Expo (not custom RN) | Managed workflow; faster iteration; GitHub Pages export | 2026-02-01 |
