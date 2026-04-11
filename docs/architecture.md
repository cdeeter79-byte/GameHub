# GameHub — Technical Architecture

## Overview

GameHub is a universal sports family platform built on a single codebase that targets iOS (native) and web (React Native Web static export). The architecture is designed for correctness, privacy compliance, and provider extensibility.

---

## Stack Rationale

| Choice | Alternative Considered | Why GameHub's Choice |
|---|---|---|
| React Native + Expo | Flutter, Capacitor | Single JS/TS codebase, largest RN ecosystem, Expo managed workflow reduces native tooling friction |
| Expo Router | React Navigation + custom web router | File-based routing works identically on native and web; enables static export |
| React Native Web | Next.js | Keeps one component tree instead of two; shares every UI component with iOS |
| Turborepo + pnpm | Nx, Lerna, Yarn workspaces | Fast incremental builds with remote cache support; pnpm strict dependency resolution |
| Supabase | Firebase, custom Node API | PostgreSQL fits complex relational model; RLS enforces privacy at DB level; built-in Auth with OAuth |
| TypeScript strict mode | JavaScript, loose TS | Required for team-scale correctness; catches provider data shape mismatches |
| RevenueCat | Custom IAP, Stripe for iOS | Handles App Store + Play Store purchase validation; entitlement management across platforms |
| Stripe | RevenueCat billing | Best-in-class B2B SaaS billing; webhooks for subscription lifecycle |

---

## Repository Structure

```
GameHub/                          # Turborepo monorepo root
├── apps/
│   └── app/                      # Single Expo app → iOS + Web
│       ├── app/                  # Expo Router file-based routes
│       │   ├── _layout.tsx       # Root layout: auth guard, theme, providers
│       │   ├── index.tsx         # Redirect → login or dashboard
│       │   ├── (auth)/           # login, register, onboarding
│       │   ├── (parent)/         # Family dashboard, schedule, inbox, children
│       │   ├── (manager)/        # Team management SaaS surface
│       │   └── (shared)/         # Settings, notifications, provider-connect
│       └── src/
│           ├── hooks/            # useAuth, useSchedule, useInbox, useEntitlements
│           └── services/         # MapsService, NotificationsService, RevenueCatService
├── packages/
│   ├── ui/                       # Shared component library (RN + RNW)
│   ├── domain/                   # Business logic, TypeScript models, Supabase types
│   ├── adapters/                 # 12 provider integration adapters
│   └── config/                   # Theme tokens, feature flags, pricing, provider constants
├── supabase/
│   ├── migrations/               # SQL schema + RLS policies + audit log
│   ├── functions/                # Deno Edge Functions
│   └── seed.sql                  # Development seed data
├── docs/                         # Architecture, PRD, compliance docs
└── legal/                        # Privacy policy, ToS, COPPA addendum
```

---

## Turborepo Task Pipeline

```json
{
  "tasks": {
    "build":      { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "typecheck":  { "dependsOn": ["^build"] },
    "test":       { "dependsOn": ["^build"] },
    "lint":       {}
  }
}
```

Packages build in dependency order: `config` → `domain` → `adapters` → `ui` → `app`.

---

## Supabase Backend

### Authentication
- **Apple Sign-In** and **Google OAuth** via Supabase Auth
- JWT tokens stored in AsyncStorage (React Native) / localStorage (web)
- `supabase.auth.onAuthStateChange` drives the app's auth state machine

### Database Schema (Key Tables)

```
parent_profiles      → 1:1 with auth.users
child_profiles       → many:1 to parent_profiles; sport, age_band, avatar
consent_records      → COPPA parental consent audit trail
provider_accounts    → OAuth tokens/API keys per provider per parent
teams                → sport, season, division; linked to provider_account
events               → unified across providers; external_id + provider_id for dedup
attendances          → RSVP state per child per event; local vs provider state
message_threads      → per provider+team; read/unread tracking
messages             → threaded messages with provider metadata
sync_jobs            → one per provider sync run; status, last_sync_at, error
sync_conflicts       → unresolved field-level conflicts for manual review
notification_preferences → per-type toggles per user
subscription_states  → parent premium entitlement (RevenueCat)
manager_plans        → SaaS tier per org (Stripe)
managed_teams        → teams under a manager plan
audit_logs           → append-only RSVP writeback + consent actions
```

### Row-Level Security
Every table has RLS enabled. Core policies:
- `parent_profiles`: user can read/write only their own row
- `child_profiles`: parent_user_id = auth.uid()
- `events`: user must be a team_member of the event's team
- `attendances`: user sees only their children's RSVP rows
- `message_threads`: user must be in the team's roster
- `audit_logs`: insert-only; SELECT restricted to own records

### Realtime
- `message_threads` and `messages` use Supabase Realtime for live inbox updates
- `sync_jobs` status updates are subscribed to for live sync progress UI

### Edge Functions (Deno)
| Function | Trigger | Purpose |
|---|---|---|
| `sync-provider` | HTTP POST (cron or user-initiated) | Fetch from provider, write to events/teams tables |
| `rsvp-writeback` | HTTP POST on RSVP change | Push RSVP to provider if writeback supported |
| `send-notification` | Called by sync-provider | Schedule or send push notifications |
| `stripe-webhook` | Stripe webhook POST | Update manager_plans on subscription events |

---

## Provider Adapter Pattern

```typescript
interface ProviderAdapter {
  id: ProviderId;
  capabilities: ProviderCapabilities;
  authenticate(credentials: unknown): Promise<AuthResult>;
  fetchTeams(ctx: AdapterContext): Promise<ExternalTeam[]>;
  fetchEvents(ctx: AdapterContext, teamId: string): Promise<ExternalEvent[]>;
  fetchRoster?(ctx: AdapterContext, teamId: string): Promise<ExternalRosterMember[]>;
  fetchMessages?(ctx: AdapterContext): Promise<ExternalMessage[]>;
  sendRSVP?(ctx: AdapterContext, rsvp: RSVPIntent): Promise<RSVPResult>;
  sendMessage?(ctx: AdapterContext, msg: MessageIntent): Promise<void>;
}
```

Optional methods (`?`) are only called after checking `capabilities` flags. Adapters that don't support a capability throw `AdapterError` with code `NOT_SUPPORTED`, which the registry catches and handles gracefully.

### Provider Registry
`ProviderRegistry` is a singleton that pre-registers all 12 adapters. The sync engine calls `registry.getAdapter(providerId)` and dispatches based on capabilities.

### Sync Flow
```
SyncEngine.syncAll()
  → for each connected provider_account
      → adapter.fetchTeams()  → upsert teams table
      → adapter.fetchEvents() → upsert events table (dedup by external_id)
      → ConflictResolver.resolve() if local edit conflicts with incoming data
      → SyncJob row updated: status=completed, last_sync_at=now()
```

Retry: 3 attempts with exponential backoff (1s, 2s, 4s).

---

## RSVP Sync Architecture

```
User taps RSVP button
  → RSVPService.setIntent(eventId, childId, intent)
      → writes attendance row (local_state = intent)
      → if adapter.capabilities.supportsRSVPWrite:
          → supabase/functions/rsvp-writeback
              → adapter.sendRSVP()
              → on success: attendance.provider_state = intent
              → on failure: attendance.sync_status = 'pending'
      → else: attendance.sync_status = 'local_only'
```

**Conflict resolution policies** (set per provider or per field):
- `source_wins` — provider data overwrites local on next sync (default for read-only providers)
- `local_wins` — user's edit persists across syncs
- `newest_wins` — higher `updated_at` timestamp wins
- `manual` — creates a `sync_conflicts` row for user review

---

## Schedule Merge Logic

```typescript
mergeEvents(events: Event[]): Event[]
```
1. Group by `(providerId, externalId)` — deduplicate same event from multiple syncs
2. If same real-world event appears from multiple providers (matched by time + location proximity), mark as `isDuplicate` and surface once with all provider badges
3. Sort chronologically
4. Apply `EventFilters` (childIds, sportIds, providerIds, dateRange)

---

## Maps Abstraction

```typescript
interface MapsService {
  openDirections(destination: LatLng | Address, label: string): Promise<void>;
}
```
- **iOS**: Action sheet offers Apple Maps (default) or Google Maps (if installed)
- **Web**: Opens `https://maps.google.com/?q=...` in new tab
- **User preference**: stored in `notification_preferences` table as `preferred_maps_app`

---

## RevenueCat Integration

```
RevenueCatService.initialize(userId)
  → Purchases.configure({ apiKey, appUserID })
  → Purchases.getOfferings()     → paywall UI
  → Purchases.getCustomerInfo()  → entitlements.active['premium_parent']
```

Premium gating is done client-side via `useEntitlements()` hook. Server-side enforcement via Supabase `subscription_states` table (populated by RevenueCat webhook → Edge Function).

---

## Manager SaaS Billing (Stripe)

```
Manager clicks "Upgrade" on billing screen
  → Stripe Checkout session created via Edge Function
  → Redirect to Stripe hosted page (web) or Stripe SDK (iOS)
  → Stripe fires webhook → supabase/functions/stripe-webhook
      → upserts manager_plans: tier, max_teams, status, stripe_subscription_id
```

Tiers: Starter (1 team/$12/mo), Family Pro (5/$29), Club (15/$59), Enterprise (custom).

---

## Push Notifications

```
Expo Notifications → device push token stored in parent_profiles
NotificationsService.scheduleEventReminder(event, minutesBefore)
  → checks notification_preferences.{event_type}_enabled
  → Notifications.scheduleNotificationAsync(trigger)
```

Server-side: `send-notification` Edge Function dispatches via Expo Push Notification Service.

**Digest mode**: When `notification_preferences.digest_enabled = true`, individual notifications are batched and sent once per day at the user's preferred time.

---

## Web Deployment (GitHub Pages)

```bash
expo export --platform web   # produces dist/
```

GitHub Actions `pages-deploy.yml`:
1. `pnpm --filter app expo export --platform web`
2. `actions/upload-pages-artifact` from `apps/app/dist`
3. `actions/deploy-pages` → `https://cdeeter79-byte.github.io/GameHub`

The static export includes all routes pre-rendered with Expo Router's static generation. Deep links work via `_redirects` and `index.html` fallback.

---

## iOS Xcode Flow

```bash
expo prebuild --platform ios --clean
# generates ios/ directory
open ios/GameHub.xcworkspace
```

- Bundle ID: `com.gamehub.app`
- CocoaPods handles native dependencies
- RevenueCat, Expo modules, and React Native Web are all compatible with Expo SDK 52 managed workflow

---

## Security Architecture (Summary)

See `docs/security-architecture.md` for full detail.

- All API keys stored in environment variables (never committed)
- Supabase RLS is the primary data isolation mechanism
- OAuth tokens encrypted at rest in Supabase Vault (provider_accounts table)
- HTTPS only; Supabase enforces TLS on all connections
- CodeQL + npm audit in CI
- OSSF Scorecard for supply chain health
