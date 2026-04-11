# GameHub — Provider Capability Matrix

Last updated: 2026-04-11

## Capability Flags Legend

| Symbol | Meaning |
|---|---|
| ✅ | Fully supported |
| ❌ | Not supported / not available |
| ⚠️ | Partial / conditional support |
| 🔍 | Read-only |
| 🔒 | Requires special partner agreement |

---

## Full Capability Matrix

| Capability | TeamSnap | SportsEngine | SE Tourney | PlayMetrics | LeagueApps | GameChanger | BAND | Heja | Crossbar | ICS Feed | Email Import | Manual |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **supportsOfficialAPI** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ⚠️ | ❌ | ❌ | N/A | N/A | N/A |
| **supportsOAuth** | ✅ | ✅ | ✅ | ❌ | ⚠️ | ❌ | ⚠️ | ❌ | ❌ | N/A | N/A | N/A |
| **supportsAPIKey** | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | N/A | N/A | N/A |
| **supportsICS** | ⚠️ | ⚠️ | ⚠️ | ❌ | ❌ | ⚠️ | ❌ | ✅ | ✅ | ✅ | ❌ | N/A |
| **supportsParentAccess** | ✅ | ✅ | ✅ | ✅ | ⚠️ | ❌ | ⚠️ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **fetchTeams** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ⚠️ | ❌ | ❌ | N/A | N/A | ✅ |
| **fetchEvents** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅* | ✅* | ✅ | ✅ | ✅ |
| **fetchRoster** | ✅ | ✅ | ⚠️ | ✅ | ⚠️ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **fetchMessages** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | 🔒 | ❌ | ❌ | ❌ | ✅ | ❌ |
| **supportsRSVPWrite** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **supportsMessageWrite** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | 🔒 | ❌ | ❌ | ❌ | ❌ | ❌ |
| **supportsTournaments** | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ⚠️ | ⚠️ | ✅ |
| **supportsLiveScores** | ❌ | ⚠️ | ⚠️ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **supportsDocuments** | ❌ | ❌ | ❌ | ⚠️ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **supportsPayments** | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **requiresPartnerAgreement** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **webhooksAvailable** | ✅ | ❌ | ❌ | ❌ | ⚠️ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **realtimeUpdates** | ⚠️ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **gracefulDegradation** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **localOnlyFallback** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

*Heja and Crossbar fetch events via ICS feed delegation (not direct API).

---

## Notes and Risk Levels

| Provider | Notes | Risk Level |
|---|---|---|
| **TeamSnap** | Full read/write REST API with Collection+JSON. OAuth 2.0 required. Best-supported integration. RSVP writes via `/availabilities` endpoint. Rate limit: 1000 req/15min. | Low |
| **SportsEngine** | GraphQL API. OAuth 2.0. Read-only for parent users (coaches have write access). Complexity budget enforced; batch queries required. | Medium |
| **SE Tourney** | Shares SportsEngine OAuth token. Separate tournament/bracket endpoints. Bracket write not exposed via API. | Medium |
| **PlayMetrics** | REST API with API key authentication. No OAuth. Oriented toward coaches; parent-facing data available. Rate limits undocumented. | Medium |
| **LeagueApps** | REST API. Auth method varies by customer plan (OAuth or API key). Parent access to events/schedules depends on league configuration. | Medium-High |
| **GameChanger** | No public API. No official partner program for data export. CSV export is the only data extraction method available. Import is one-way and manual. | High |
| **BAND** | Limited partner API requires formal agreement with BAND Korea. Messaging read may be available via partner API. Direct event read is not available. Treat as "messaging only if partnered." | High |
| **Heja** | No public API. No partner program. ICS feed export available from team calendar. Fallback: manual entry. | High |
| **Crossbar** | No public API. ICS feed export available for leagues that publish calendars. | High |
| **ICS Feed** | Universal standard. Supports VEVENT, DTSTART, RRULE weekly recurrence expansion. Handle webcal:// → https:// normalization. | Low |
| **Email Import** | Regex-based parsing of common sports scheduling email formats. Confidence scoring: high (>0.8), medium (0.5–0.8), low (<0.5). Always requires user confirmation. | Medium |
| **Manual Entry** | Always available. No external dependencies. Used as fallback for all unsupported providers. | None |

---

## Provider Auth Strategy Summary

| Provider | Auth Strategy | Token Storage |
|---|---|---|
| TeamSnap | OAuth 2.0 Authorization Code | Encrypted in Supabase Vault |
| SportsEngine | OAuth 2.0 | Encrypted in Supabase Vault |
| SE Tourney | Shared SE OAuth token | Same as SportsEngine |
| PlayMetrics | API Key | Encrypted in Supabase Vault |
| LeagueApps | OAuth 2.0 or API Key (plan-dependent) | Encrypted in Supabase Vault |
| GameChanger | None (CSV file upload) | N/A |
| BAND | Partner API key (if agreement secured) | Encrypted in Supabase Vault |
| Heja | None (ICS URL) | ICS URL stored in provider_accounts |
| Crossbar | None (ICS URL) | ICS URL stored in provider_accounts |
| ICS Feed | None (public URL) | URL stored in provider_accounts |
| Email Import | None (paste/upload) | N/A |
| Manual | None | N/A |

---

## MVP Provider Priority

For the initial release, prioritize integrations in this order based on market share + API quality:

1. **TeamSnap** — Largest youth sports platform; full read/write API; highest parent adoption
2. **ICS Feed** — Universal fallback enabling any calendar-publishing provider
3. **Manual Entry** — Always-available baseline
4. **SportsEngine** — Second-largest; read-only acceptable for MVP
5. **Email Import** — Covers GameChanger users who export to email
6. **PlayMetrics** — Growing coaching platform; API accessible with API key

Phases 2+: LeagueApps, SE Tourney, BAND (if partnership secured), GameChanger CSV import UI.
