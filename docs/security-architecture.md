# GameHub — Security Architecture

Last updated: 2026-04-11

## Threat Model

GameHub handles sensitive family data: children's names and ages, sports schedules and locations, family contact information, and financial subscription data. The threat model prioritizes:

1. **Unauthorized access to family data** — cross-family data leakage
2. **Child data exposure** — minors' information accessed by unauthorized parties
3. **Provider credential compromise** — OAuth tokens and API keys stolen
4. **Supply chain attacks** — malicious npm packages
5. **Injection attacks** — SQL injection, XSS in web surface
6. **Payment data interception** — subscription billing fraud

---

## Authentication Architecture

### Supabase Auth
- Google OAuth and Apple Sign-In via Supabase's built-in auth providers
- JWT access tokens (1-hour expiry) + refresh tokens (7-day expiry)
- All tokens transmitted over HTTPS only

### Token Storage
| Platform | Storage Mechanism | Notes |
|---|---|---|
| iOS | AsyncStorage (Expo SecureStore wrapper recommended for production) | Expo SecureStore uses iOS Keychain under the hood |
| Web | Supabase JS client defaults to localStorage | Acceptable for non-sensitive JWT; upgrade to httpOnly cookie session if XSS risk increases |

### Session Management
```typescript
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') clearAllLocalState();
  if (event === 'TOKEN_REFRESHED') updateLocalToken(session);
});
```

### Multi-Factor Authentication
- Supabase Auth supports TOTP MFA; enable for manager accounts in v1.1
- Apple Sign-In users inherit Apple's 2FA requirement

---

## Data Isolation: Row-Level Security

RLS is the primary enforcement mechanism. Every table has `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` and `ALTER TABLE ... FORCE ROW LEVEL SECURITY`.

### Core RLS Policies

```sql
-- Parents can only see their own profile
CREATE POLICY "parent_profiles_self" ON parent_profiles
  USING (user_id = auth.uid());

-- Children are only visible to their parent
CREATE POLICY "child_profiles_parent_only" ON child_profiles
  USING (parent_user_id = auth.uid());

-- Events visible only to team members
CREATE POLICY "events_team_members" ON events
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      JOIN teams t ON t.id = tm.team_id
      WHERE t.id = events.team_id
      AND tm.user_id = auth.uid()
    )
  );

-- Attendances: parent sees only their children's RSVPs
CREATE POLICY "attendances_own_children" ON attendances
  USING (
    EXISTS (
      SELECT 1 FROM child_profiles cp
      WHERE cp.id = attendances.child_id
      AND cp.parent_user_id = auth.uid()
    )
  );

-- Audit logs: insert-only; read own records only
CREATE POLICY "audit_logs_insert" ON audit_logs FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "audit_logs_read_own" ON audit_logs FOR SELECT
  USING (user_id = auth.uid());
```

### Service Role
Edge Functions use the Supabase `service_role` key (bypasses RLS) only for:
- `sync-provider`: Writing synced event data across teams
- `stripe-webhook`: Updating manager_plans on behalf of Stripe events
- `send-notification`: Reading user preferences for notification dispatch

The `anon` key is used for all client-side operations and is subject to RLS.

---

## Provider Credential Security

Provider OAuth tokens and API keys are stored in the `provider_accounts` table. In production:

1. **Supabase Vault** (pgcrypto extension): Store `credentials` JSONB column encrypted using `vault.create_secret()` and `vault.decrypt_secret()`
2. **Environment variable isolation**: Supabase service role key never exposed to client bundles
3. **Token rotation**: OAuth refresh tokens are rotated on use; expired tokens trigger re-authentication flow in the app
4. **Scope minimization**: OAuth scopes requested are the minimum required (read-only for providers that don't support write)

```typescript
// provider_accounts credentials are always fetched server-side (Edge Function)
// Never exposed in client API responses
const { credentials } = await supabase
  .from('provider_accounts')
  .select('vault_secret_id')  // only ID, not decrypted credentials
  .eq('id', accountId)
  .single();
```

---

## Environment Variable Management

All secrets are environment variables, never committed to source control.

| Variable | Used By | Sensitivity |
|---|---|---|
| `SUPABASE_URL` | Client + Edge Functions | Low (public) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Client | Low (public, RLS-protected) |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge Functions only | **HIGH** |
| `STRIPE_SECRET_KEY` | Edge Functions only | **HIGH** |
| `STRIPE_WEBHOOK_SECRET` | Edge Functions only | **HIGH** |
| `REVENUECAT_APPLE_API_KEY` | Client (iOS) | Medium |
| `REVENUECAT_WEB_API_KEY` | Client (web) | Medium |
| `GOOGLE_MAPS_IOS_API_KEY` | iOS native config | Medium |
| `EXPO_PUBLIC_*` | Client bundle | Low (public) |

`.env` files are in `.gitignore`. `.env.example` with placeholder values is committed.

GitHub Actions secrets are stored in repository secrets and injected at workflow runtime. Never logged.

---

## Transport Security

- All Supabase connections use TLS 1.2+ (enforced by Supabase infrastructure)
- All provider API calls use HTTPS; `http://` URLs are rejected at the adapter level
- ICS feeds must be `https://` (webcal:// normalized to https://)
- Content Security Policy headers for GitHub Pages web deployment:
  ```
  Content-Security-Policy: default-src 'self'; 
    script-src 'self' 'unsafe-eval'; 
    connect-src 'self' https://*.supabase.co https://api.stripe.com;
    img-src 'self' data: https:;
  ```

---

## Input Validation

### Client-Side
- All user inputs validated with Zod schemas before Supabase writes
- Email addresses validated with regex + Supabase Auth validation
- Child profile names: alphanumeric + spaces, max 100 chars
- ICS URLs: must parse as valid HTTPS URL; fetched server-side to avoid SSRF from client

### Server-Side (Edge Functions)
- Stripe webhook signatures verified with `stripe.webhooks.constructEvent()`
- Provider sync jobs validate team/event shapes before writing; malformed records are skipped and logged
- SQL injection is not possible via Supabase JS client (uses parameterized queries internally)

---

## COPPA-Specific Security Controls

See `docs/privacy-and-coppa.md` for full compliance detail.

| Control | Implementation |
|---|---|
| Child data isolation | RLS `parent_user_id = auth.uid()` on child_profiles |
| Consent audit trail | `consent_records` table: parent_user_id, child_id, consent_given_at, ip_address, user_agent |
| Minimal PII for children | Child profiles store: first name, sport, age_band, avatar. No email, phone, or address for minors. |
| Analytics suppression | `UNDER_13` age band → analytics events not fired; ad SDK returns null banner |
| Data deletion | Parent can delete a child profile → cascades to all child_profiles, attendances rows via FK cascade |

---

## Audit Logging

The `audit_logs` table captures security-relevant events:

| Event Type | Logged Fields |
|---|---|
| `rsvp_writeback` | user_id, child_id, event_id, provider_id, intent, result, timestamp |
| `consent_given` | parent_user_id, child_id, ip_address, user_agent, timestamp |
| `provider_connected` | user_id, provider_id, auth_method, timestamp |
| `provider_disconnected` | user_id, provider_id, reason, timestamp |
| `subscription_change` | user_id, plan_id, change_type, stripe_event_id, timestamp |

Audit logs are append-only (no UPDATE/DELETE policies). Retention: 2 years.

---

## CI/CD Security Controls

### GitHub Actions
- All action versions pinned to specific SHA commits (not floating tags)
- `permissions` block set to minimum required per workflow
- Concurrency groups with `cancel-in-progress: true` prevent race conditions
- Secrets never echoed in logs (`${{ secrets.X }}` interpolation is masked by GitHub)

### Dependency Security
- **Dependabot**: Weekly automated PRs for npm + GitHub Actions dependencies
- **npm audit**: Run in `security-scan.yml` with `--audit-level=high`; fails on high/critical
- **dependency-review-action**: Blocks PRs that introduce packages with known vulnerabilities
- **CodeQL**: GitHub's SAST scanner on push + weekly schedule; `security-extended` query suite

### OSSF Scorecard
Run monthly via `security-scan.yml`. Target score: ≥7/10.

---

## Incident Response

### Severity Levels
| Level | Description | Response Time |
|---|---|---|
| P0 | Data breach; child data exposed; auth bypass | Immediate (<2 hours) |
| P1 | Credential compromise; payment fraud | <24 hours |
| P2 | Provider token leak; RSVP data tampering | <72 hours |
| P3 | Minor security misconfiguration | Next sprint |

### Disclosure Policy
Vulnerabilities are reported via GitHub Security Advisories (private). See `.github/SECURITY.md`.

### Containment Actions
1. Revoke compromised Supabase service role key → rotate all downstream secrets
2. Force sign-out all sessions via Supabase Auth admin API
3. Notify affected users per breach notification requirements (varies by jurisdiction; 72 hours for EU GDPR, "expedient" for US COPPA)

---

## Security Testing Plan

| Test Type | Tool | Frequency |
|---|---|---|
| Static analysis | CodeQL | Every push |
| Dependency audit | npm audit, dependency-review | Every PR |
| RLS policy testing | pgTAP (PostgreSQL unit tests) | Each migration |
| OWASP Top 10 review | Manual + Semgrep | Quarterly |
| Penetration testing | External firm | Pre-launch, annually |
| Auth flow testing | Playwright (web), Detox (iOS) | Pre-release |
