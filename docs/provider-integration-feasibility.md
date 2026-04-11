# GameHub — Provider Integration Feasibility Analysis

Last updated: 2026-04-11

## Summary

This document analyzes the technical and business feasibility of integrating each of the 12 providers in GameHub's adapter layer. Each assessment covers: API availability, authentication mechanism, data access scope, write capabilities, rate limits, known risks, and recommended implementation approach.

---

## 1. TeamSnap

**Feasibility: HIGH ✅**

- **Official API:** Yes — REST with Collection+JSON media type (`application/vnd.collection+json`)
- **Auth:** OAuth 2.0 Authorization Code flow; access + refresh tokens
- **Base URL:** `https://api.teamsnap.com/v3`
- **Parent access:** Full — parents can read all team data they belong to
- **Key endpoints:**
  - `GET /teams` — list user's teams
  - `GET /events?team_id=X` — team events (games, practices, tournaments)
  - `GET /team_members?team_id=X` — roster
  - `GET /availabilities?team_id=X` — RSVP status for all members
  - `POST /availabilities` — write RSVP (attending/not/maybe)
  - `GET /messages?team_id=X` — team messages
  - `POST /messages` — send message (coach/manager role required)
- **Rate limits:** ~1,000 requests per 15 minutes per OAuth token
- **RSVP writeback:** Yes — `POST /availabilities` with `{ status_code: 1|2|3 }` (yes/no/maybe)
- **Risks:** Collection+JSON parsing is non-standard; response shapes are nested arrays
- **Implementation:** Full adapter with retry backoff. Parse `collection.items` arrays into typed ExternalTeam/ExternalEvent shapes.

---

## 2. SportsEngine

**Feasibility: MEDIUM ⚠️**

- **Official API:** Yes — GraphQL
- **Auth:** OAuth 2.0
- **Base URL:** `https://api.sportsengine.com/graphql`
- **Parent access:** Read-only for parent/guardian role; write access requires coach/admin role
- **Key queries:**
  - `teams(userId)` — list teams
  - `scheduleItems(teamId)` — games and events with location
  - `roster(teamId)` — team members and positions
- **Rate limits:** GraphQL complexity budget enforced (complex nested queries rejected); batch with aliases
- **RSVP writeback:** Not available for parent role
- **Messaging:** Not available via API
- **Risks:** Complexity errors if queries are too nested; schema may change without versioned endpoints; OAuth token expiry handling required
- **Implementation:** Split roster, events, and teams into separate GraphQL operations. Handle `COMPLEXITY_LIMIT_EXCEEDED` errors with retry using simplified query.

---

## 3. SportsEngine Tourney (Tournament Module)

**Feasibility: MEDIUM ⚠️**

- **Official API:** Yes — REST (separate from main SE GraphQL)
- **Auth:** Shared SportsEngine OAuth token
- **Base URL:** `https://tournament.sportsengine.com/api/v1`
- **Key endpoints:**
  - `GET /tournaments` — list tournaments for user's teams
  - `GET /tournaments/:id/brackets` — bracket structure
  - `GET /tournaments/:id/schedule` — game schedule with times/fields
- **Parent access:** Read-only bracket and schedule data
- **RSVP writeback:** Not available
- **Risks:** Separate API from main SE; may require separate OAuth scope; undocumented pagination
- **Implementation:** Extend SE adapter; reuse access token with additional scope `tourney:read`.

---

## 4. PlayMetrics

**Feasibility: MEDIUM ✅**

- **Official API:** Yes — REST
- **Auth:** API Key (per organization; no OAuth)
- **Base URL:** `https://api.playmetrics.com/v1`
- **Key endpoints:**
  - `GET /teams` — teams for the API key's org
  - `GET /events?team_id=X` — events with practice/game type
  - `GET /players?team_id=X` — roster (player-focused, not parent contact)
- **Parent access:** Limited — API is primarily coach-facing. Parents connected to the org can read events.
- **RSVP writeback:** Not available
- **Rate limits:** Not publicly documented; implement conservative 1 req/sec throttle
- **Risks:** API key is org-scoped, not user-scoped — parent must provide the API key obtained from their coach/club. No self-serve OAuth.
- **Implementation:** Prompt user to enter API key obtained from their club administrator. Store encrypted in `provider_accounts.credentials`.

---

## 5. LeagueApps

**Feasibility: MEDIUM-HIGH ⚠️**

- **Official API:** Yes — REST
- **Auth:** OAuth 2.0 (preferred) or API Key (older integrations)
- **Base URL:** `https://api.leagueapps.com/v2`
- **Key endpoints:**
  - `GET /programs` — programs/leagues/seasons
  - `GET /games?programId=X` — game schedule
  - `GET /registrations` — who is registered (roster-like)
- **Parent access:** Conditional — depends on league's LeagueApps plan and privacy settings
- **RSVP writeback:** Not available
- **Risks:** Data availability varies significantly by league configuration; some leagues disable API access for non-admins; pagination is cursor-based and can be slow for large leagues
- **Implementation:** OAuth flow with graceful degradation if data is inaccessible. Surface helpful error message: "Your league's LeagueApps settings may restrict parent API access. Contact your league administrator."

---

## 6. GameChanger

**Feasibility: LOW — CSV Import Only ❌**

- **Official API:** No public API exists
- **Partner program:** No public partner program for data export
- **Auth:** N/A
- **Available data extraction methods:**
  1. CSV export from GameChanger web app (schedule export button)
  2. Manual entry by user
- **RSVP writeback:** Not applicable
- **Risks:** CSV format may change without notice; no real-time updates; one-way import only
- **Implementation:**
  - `GameChangerAdapter` throws `AdapterError('NOT_SUPPORTED')` for all API methods
  - Separate `parseGameChangerCSV(csvText: string): ExternalEvent[]` utility exported for use in an import UI flow
  - In-app CSV import screen: user pastes CSV content or uploads file; events are created as manual entries with `source: 'gamechanger_csv'`
- **UX:** Show "Import from GameChanger" as a special flow in provider-connect, clearly explaining the manual export step required.

---

## 7. BAND

**Feasibility: LOW-MEDIUM 🔒**

- **Official API:** Limited partner API — requires formal agreement with BAND (South Korea-based company)
- **Auth:** Partner API key (post-agreement)
- **Available without partnership:**
  - No public data API
  - No OAuth for third parties
- **Available with partnership:**
  - Read access to posts/messages in BAND groups
  - Member list read
- **RSVP writeback:** Not available via any API
- **Event read:** Not directly available; BAND posts may contain event information but are unstructured
- **Risks:** Partnership timeline is uncertain; API is not self-serve; BAND's user base is declining in North American youth sports
- **Implementation:**
  - Ship BAND adapter as a stub that surfaces a "Partner API — coming soon" message
  - `fetchMessages()` implemented if partnership is secured
  - All other methods throw `NOT_SUPPORTED`
  - Long-term: encourage users to export BAND events to ICS

---

## 8. Heja

**Feasibility: LOW — ICS Fallback ❌**

- **Official API:** No public API
- **Partner program:** None
- **Available data extraction:**
  - ICS calendar export from Heja web app
- **Implementation:**
  - `HejaAdapter` is a thin wrapper that instantiates `IcsAdapter` with the user-provided ICS URL
  - Prompt: "Export your Heja calendar as an ICS link and paste it here"
  - Error message: "Heja does not have a public API. Connect via calendar link for automatic schedule sync."
- **Limitations:** ICS sync is pull-only (user must re-sync); no RSVP writeback; no roster; no messaging

---

## 9. Crossbar

**Feasibility: LOW — ICS Fallback ❌**

- **Official API:** No public API
- **Partner program:** None
- **Available data extraction:**
  - Some Crossbar leagues publish ICS feeds; availability is league-dependent
- **Implementation:** Same ICS delegation pattern as Heja
- **Limitations:** Same as Heja; additionally, not all Crossbar leagues publish public ICS feeds

---

## 10. ICS Feed

**Feasibility: HIGH ✅**

- **Standard:** RFC 5545 (iCalendar)
- **Auth:** None (public URL) or HTTP Basic Auth for private feeds
- **Capabilities:** Events (VEVENT), location, description, recurrence (RRULE weekly expansion)
- **RSVP writeback:** Not applicable (read-only standard)
- **Implementation:**
  - Full iCal parser: VEVENT extraction, DTSTART format handling (DATE-TIME and DATE), RRULE FREQ=WEEKLY expansion for 12 weeks
  - `webcal://` URL scheme normalized to `https://`
  - HTTP fetch with 15-second timeout; error on non-200 response
  - Refresh interval: user-configurable (default: every 6 hours)
- **Risks:** Some providers generate malformed iCal (e.g., missing DTEND, incorrect timezone offsets); parser must be lenient

---

## 11. Email Import

**Feasibility: MEDIUM ✅**

- **Standard:** None — regex pattern matching against common email formats
- **Auth:** None (user pastes email body)
- **Supported email patterns:**
  - TeamSnap confirmation emails
  - SportsEngine schedule notification emails
  - Generic "Game vs. [Team] at [Location] on [Date] at [Time]" patterns
- **Output:** `ParsedEmailEvent[]` with confidence score (0–1)
- **User flow:**
  1. User receives schedule email
  2. User copies email body, pastes into GameHub "Import from Email" screen
  3. System extracts event candidates with confidence scores
  4. User reviews and confirms
  5. Events saved as manual entries with `source: 'email_import'`
- **Risks:** Regex patterns are brittle; email format changes will break parsing; always requires user confirmation
- **Implementation:** `parseEmailContent(text: string): ParsedEmailEvent[]` with multiple regex strategies

---

## 12. Manual Entry

**Feasibility: ALWAYS AVAILABLE ✅**

- **No external dependencies**
- **Capabilities:** Create/edit/delete events, teams, RSVP locally
- **RSVP:** Local state only
- **Implementation:** `ManualAdapter` returns empty arrays from all fetch methods; all events/teams are created directly in Supabase by the UI layer

---

## Risk Register

| Risk | Providers Affected | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| API shutdown/deprecation | All | Low | High | Abstract behind adapter interface; swap implementation without UI changes |
| OAuth token revocation | TeamSnap, SportsEngine, LeagueApps | Medium | Medium | Detect 401 responses → re-auth flow; store refresh tokens |
| Rate limit exhaustion | TeamSnap, SportsEngine, PlayMetrics | Medium | Low | Exponential backoff; cache responses for 5 minutes |
| Schema change breaking parser | SportsEngine GraphQL, GameChanger CSV | Low-Medium | Medium | Unit tests against fixture responses; alert on parse failure |
| Partnership requirement | BAND | High | Medium | Ship as stub; don't block launch |
| ICS format variation | Heja, Crossbar, ICS | Medium | Low | Lenient parser; skip malformed VEVENTs with warning |
| Provider discontinuation | BAND, Heja, Crossbar | Low | Low | ICS fallback covers most cases |
| COPPA compliance for provider data | All (if syncing minor data) | Medium | High | All child-related data stored under parent's auth scope; no minor data sent to providers |
