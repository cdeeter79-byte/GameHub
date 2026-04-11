# GameHub

> **Your family's unified sports command center.**

GameHub aggregates schedules, RSVPs, messaging, and rosters from all your kids' youth sports apps—TeamSnap, SportsEngine, PlayMetrics, and more—into a single, parent-friendly interface.

---

## Features

### For Parents 👨‍👩‍👧‍👦
- **Unified calendar** — All kids' games and practices in one place
- **Smart RSVP** — Respond to attendance requests instantly; sync across all apps
- **Team messaging** — Read team announcements and stay in the loop
- **Rosters** — See who's on the team and how to reach them
- **Provider sync** — Connect any supported sports app for automatic schedule updates
- **Offline support** — Basic viewing works without internet
- **COPPA-compliant** — Safe for children; parental controls built-in
- **Accessible** — WCAG 2.1 AA compliance (screen readers, keyboard nav, high contrast)

### For Coaches & Managers 🏆
- **Team management** — Create teams, manage rosters, schedule games
- **RSVP tracking** — See who's available for games and practices
- **Team messaging** — Send announcements to parents and players
- **Paid subscription** — Optional SaaS tier for advanced features

---

## Supported Providers

| Provider | Status | Auth | Parent Access | RSVP Write |
|---|---|---|---|---|
| **TeamSnap** | ✅ Fully supported | OAuth | ✅ Yes | ✅ Yes |
| **SportsEngine** | ✅ Fully supported | OAuth | ✅ Yes (read-only) | ❌ No |
| **PlayMetrics** | ⚠️ Planned v1.1 | API Key | ✅ Yes | ❌ No |
| **LeagueApps** | ⚠️ Planned v1.1 | OAuth/Key | ✅ Yes | ❌ No |
| **iCalendar (ICS)** | ✅ Fully supported | None | ✅ Yes | ❌ No |
| **Email import** | ⚠️ Planned v1.1 | Paste text | ✅ Yes | ❌ No |
| **Manual entry** | ✅ Fully supported | None | ✅ Yes | ✅ Local only |

[See full provider matrix →](./docs/provider-capability-matrix.md)

---

## Getting Started

### Prerequisites
- Node.js 18+ and pnpm 9
- iOS Xcode 15+ (for iOS development)
- Expo CLI (`npm install -g eas-cli`)

### Installation

```bash
# Clone the repo
git clone https://github.com/cdeeter79-byte/GameHub.git
cd GameHub

# Install dependencies (monorepo with pnpm)
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase and provider credentials

# Start development server (web)
pnpm --filter app run dev

# Or: Start Expo development (iOS/Android simulator)
pnpm --filter app run ios
pnpm --filter app run android
```

### Build for Deployment

```bash
# Build all packages
pnpm run build

# Build web static export (for GitHub Pages)
pnpm --filter app expo export --platform web

# Build iOS for App Store
eas build --platform ios

# Test locally
pnpm test
pnpm run typecheck
pnpm run lint
```

---

## Project Structure

```
GameHub/
├── apps/app                    # Expo app (iOS, web, Android)
├── packages/
│   ├── ui/                     # Shared components (RN + RNW)
│   ├── domain/                 # Business logic, models, Supabase types
│   ├── adapters/               # Provider integrations
│   └── config/                 # Design tokens, constants, feature flags
├── supabase/                   # PostgreSQL schema, RLS policies, Edge Functions
├── docs/                       # Architecture, PRD, compliance guides
├── legal/                      # Privacy policy, ToS, COPPA addendum
└── .github/                    # CI/CD workflows, issue templates
```

[Architecture overview →](./docs/architecture.md)

---

## Development

### Working on a Feature

```bash
# Create a feature branch
git checkout -b feature/my-feature develop

# Make changes, test locally
pnpm test
pnpm run typecheck
pnpm run lint --fix

# Commit with clear message
git commit -m "feat: add event detail screen"

# Push and create a PR
git push origin feature/my-feature
# PR creates on GitHub with automated checks
```

### Testing

```bash
# Run Jest tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Check code coverage
pnpm test --coverage

# Type-check all packages
pnpm run typecheck

# Lint all code
pnpm run lint
pnpm run lint --fix  # Auto-fix
```

### Local Development Server

```bash
# Web (http://localhost:19000)
pnpm --filter app run web

# iOS simulator
pnpm --filter app run ios

# Android emulator
pnpm --filter app run android
```

---

## Architecture Highlights

### Tech Stack
- **Frontend:** React Native, Expo Router, React Native Web
- **Backend:** Supabase (PostgreSQL, Auth, Realtime, Edge Functions)
- **Monorepo:** Turborepo + pnpm workspaces
- **Type safety:** TypeScript strict mode
- **CI/CD:** GitHub Actions (lint, test, build, deploy)
- **Deployment:** GitHub Pages (web), TestFlight/App Store (iOS)

### Key Patterns
- **Provider adapters:** Pluggable integrations with capability flags
- **Sync engine:** Conflict resolution for multi-provider events
- **RLS policies:** Row-Level Security for data isolation per family
- **Feature flags:** Controlled rollout of new features
- **Age gating:** Ads/analytics disabled for children under 13 (COPPA)

[Full architecture →](./docs/architecture.md)

---

## Privacy & Security

- **COPPA-compliant:** Parent-directed design; minimal child data collection
- **No ads for kids:** Children under 13 see no ads or analytics tracking
- **Encrypted data:** HTTPS transport + database encryption at rest
- **RLS enforcement:** Supabase enforces family data isolation at DB level
- **Audit logs:** All RSVP and consent actions logged for compliance

[Privacy policy →](./legal/privacy-policy.md)
[COPPA addendum →](./legal/children-privacy-addendum.md)
[Security architecture →](./docs/security-architecture.md)

---

## Accessibility

GameHub targets **WCAG 2.1 Level AA** compliance:
- ✅ Color contrast (4.5:1 minimum)
- ✅ Touch targets (44×44 points)
- ✅ Keyboard navigation (web)
- ✅ Screen reader support (iOS VoiceOver, Android TalkBack)
- ✅ Reduced motion preferences

[Accessibility guide →](./docs/accessibility.md)

---

## Contributing

GameHub is open-source. We welcome contributions!

1. **Report a bug:** [Create an issue →](https://github.com/cdeeter79-byte/GameHub/issues)
2. **Request a feature:** [Create a discussion →](https://github.com/cdeeter79-byte/GameHub/discussions)
3. **Submit a PR:** Fork, create a feature branch, and submit a PR to `develop`

See [CONTRIBUTING.md](./.github/CONTRIBUTING.md) and [GitHub strategy →](./docs/github-strategy.md) for details.

---

## Roadmap

### v1.0.0 (Q3 2026)
- ✅ MVP with TeamSnap, SportsEngine, ICS, manual entry
- ✅ Parental consent & COPPA compliance
- ✅ iOS + web deployment
- ✅ WCAG AA accessibility audit

### v1.1.0 (Q4 2026)
- ⏳ More providers (PlayMetrics, LeagueApps, email import)
- ⏳ Enhanced calendar views and messaging
- ⏳ Offline mode improvements

### v2.0.0 (Q2 2027)
- 🔮 Manager SaaS tier (team management, Stripe billing)
- 🔮 Advanced analytics and team tools

[Full backlog →](./docs/backlog.md)

---

## Deployment

### Web (GitHub Pages)
Every push to `main` automatically deploys to https://cdeeter79-byte.github.io/GameHub

### iOS
1. Prepare: `eas build --platform ios --profile production`
2. Submit: Upload to App Store Connect
3. Review: Apple reviews within 24–48 hours
4. Release: Approve in App Store Connect

See [App Store readiness →](./docs/app-store-readiness.md)

---

## Performance

- **App launch:** <2 seconds (cold start)
- **Schedule load:** <1 second (500+ events)
- **Sync:** 30–60 seconds per provider (background task)
- **Crash rate:** <0.1% (production target)

---

## Support

### Documentation
- [Product Requirements Document →](./docs/PRD.md)
- [Architecture Decisions →](./docs/architecture.md)
- [GitHub Workflow →](./docs/github-strategy.md)

### Getting Help
- **Bug report:** [GitHub issues →](https://github.com/cdeeter79-byte/GameHub/issues)
- **Feature request:** [GitHub discussions →](https://github.com/cdeeter79-byte/GameHub/discussions)
- **Security issue:** [Report privately →](./.github/SECURITY.md)
- **Privacy question:** privacy@gamehub.app

---

## License

GameHub is [MIT licensed](./LICENSE).

---

## Credits

Built with ❤️ by sports families, for sports families.

**Special thanks:**
- Supabase team for excellent backend infrastructure
- Expo team for managed React Native workflow
- Open-source community for testing and feedback

---

## Code of Conduct

We are committed to a respectful, inclusive community. See [CODE_OF_CONDUCT.md](./.github/CODE_OF_CONDUCT.md).

---

**Latest release:** [v1.0.0](https://github.com/cdeeter79-byte/GameHub/releases/tag/v1.0.0) | **Docs updated:** 2026-04-11
