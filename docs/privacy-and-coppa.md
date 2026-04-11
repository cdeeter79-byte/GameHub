# GameHub — Privacy and COPPA Compliance

Last updated: 2026-04-11

## COPPA Compliance Strategy

GameHub uses a **parent-directed model** rather than the Kids Category app model. This means:

- **Parental control:** All child profiles are sub-accounts under the parent's authenticated account; children do not sign in independently
- **Minimal child data collection:** Child profiles store only: first name, sport, age band (enum), avatar image
- **Age-appropriate restrictions:** Analytics, ads, and third-party tracking are disabled for children under 13
- **Parental consent:** At child profile creation, parent explicitly consents to data collection via a dated, IP-logged consent record
- **Data retention:** Parents can delete child profiles at any time; deletion cascades to all associated data

This approach satisfies COPPA (Children's Online Privacy Protection Act, 16 CFR Part 1100) without relegating GameHub to the Kids Category, which would restrict monetization and feature richness.

---

## COPPA Compliance Checklist

### Parental Consent
- [ ] `consent_records` table captures: parent_user_id, child_id, consent_given_at, ip_address, user_agent
- [ ] Consent form shown at child profile creation; modal requires explicit checkbox acknowledgment
- [ ] Consent form text explains: data collection, how data is used, parent's right to review/delete
- [ ] Consent timestamp recorded server-side (not client-side) via Supabase
- [ ] Parent can view all active consent records in Settings → Privacy

### Data Minimization for Children
**Allowed child data:**
- First name (required)
- Sport(s) they play (required)
- Age band: UNDER_13 | TEEN_13_17 | ADULT_18_PLUS (required)
- Avatar image (optional)

**Prohibited child data:**
- Email address
- Phone number
- Home address
- School name
- Social media handles
- Exact date of birth (age band only)
- Health/medical information (even allergy notes)

### Parental Access & Control
- [ ] Parent can view all data associated with each child
- [ ] Parent can edit child profile (name, sport, age band, avatar)
- [ ] Parent can delete child profile → cascades to attendance, RSVP records
- [ ] Parent can export all child data as JSON
- [ ] "Delete my data" option in Settings → exports child data before deletion (7-day retention for account recovery)

### Third-Party Service Restrictions for UNDER_13

| Service | Under 13 | Teen 13+ | Adult |
|---|:---:|:---:|:---:|
| Google Analytics | ❌ | ✅ | ✅ |
| Firebase Crashlytics | ❌ | ✅ | ✅ |
| Ad SDK (Google Mobile Ads) | ❌ | ✅ (if no personalization) | ✅ |
| RevenueCat (entitlements) | ✅ | ✅ | ✅ |
| Stripe (parental purchase) | ✅ (no direct billing) | ⚠️ | ✅ |
| Maps (Apple/Google) | ✅ (location only) | ✅ | ✅ |

Code gate:
```typescript
const isUnder13 = childProfile.age_band === 'UNDER_13';
if (!isUnder13) {
  analytics.logEvent('schedule_viewed'); // logged only for 13+
  AdBanner.show(); // shown only for 13+
}
```

### Directed vs. Self-Directed Disclosure
- **Parents are the intended audience** for all disclosures
- Privacy policy includes a dedicated "Children's Privacy" section
- In-app consent flows target parent literacy level (clear language, checkboxes)
- Email communications (subscription reminders, RSVP updates) go to parent email, not child

---

## Age Band Strategy

Child age is bucketed into bands rather than collecting exact birth date. This minimizes data while enabling feature gating:

```typescript
enum ChildAgeBand {
  UNDER_13 = 'UNDER_13',      // 0–12: full parental consent, no ads, no analytics
  TEEN_13_17 = 'TEEN_13_17',  // 13–17: parental consent still required (user is not adult), limited ads
  ADULT_18_PLUS = 'ADULT_18_PLUS', // 18+: can manage own account
}
```

**Age band is verified at onboarding**: Parent selects "My child is X years old" from dropdown (not a birth date picker). Parent confirms understanding of age restrictions.

---

## Consent Flow

### Initial Setup (onboarding)
```
1. Parent signs in with Google/Apple
2. Screen: "Add your first child"
   - Child's first name (text input)
   - Child's sport(s) (multi-select checkboxes: soccer, football, baseball, etc.)
   - Child's age: [dropdown: Under 13 | Teen 13-17 | 18+]
3. Screen: "Parental Consent Agreement"
   - Disclosure text (see Legal > COPPA Addendum)
   - Checkbox: "I confirm that I am the parent/guardian and consent to GameHub's collection of my child's sport and name"
   - Checkbox: "I understand that for children under 13, GameHub does not display ads or collect usage analytics"
   - [Agree] [Cancel]
4. On agree:
   - consent_records row created (consent_given_at, ip_address from Cloudflare header)
   - child_profiles row created
   - Parent directed to dashboard

5. Parent can add more children → repeat from step 2
```

### Consent Verification
- At every sign-in, if parent has UNDER_13 child, show reminder banner: "You're managing [count] child profile(s) under parental consent. View consent records."
- Parent can review all consent records in Settings → Privacy → Consent Records
- Timestamp, IP address visible for audit trail

---

## Data Deletion & Retention

### Parent-Initiated Deletion
Parent clicks "Delete [child name]'s profile" in child settings:
1. Soft delete: mark `child_profiles.deleted_at = now()`
2. RLS policy prevents any further access: `WHERE deleted_at IS NULL`
3. Associated data (attendances, messages as participant) is also soft-deleted
4. 30-day retention period: parent can undelete within 30 days
5. After 30 days, hard delete: `DELETE FROM child_profiles WHERE deleted_at < now() - interval '30 days'`

### Account Closure
Parent deletes own account:
1. All child profiles cascade soft-delete
2. Provider accounts disconnected (tokens revoked)
3. Subscription cancelled in Stripe/RevenueCat
4. 90-day retention period (per platform retention requirements)
5. Hard delete after 90 days

### Data Export (Right to Data Portability)
Parent can export all data in Settings → Privacy → Download My Data:
```json
{
  "parent": { ...parent_profile },
  "children": [
    {
      "id": "child-uuid",
      "name": "Emma",
      "sport": "soccer",
      "age_band": "UNDER_13",
      "events": [ { event data } ]
    }
  ],
  "consent_records": [ { ...consent_record } ],
  "audit_log": [ { ...actions_taken } ]
}
```

---

## Privacy Policy Key Sections

See `legal/privacy-policy.md` for full text. Highlights:

| Section | Content |
|---|---|
| 1. Information We Collect | Explains parent vs. child data; explicit list of child data points; optional avatar |
| 2. How We Use Information | Schedule aggregation, RSVP sync, messaging, billing |
| 3. Children's Privacy | "We comply with COPPA. Child profiles are parent-controlled; children do not sign in independently." |
| 4. Third-Party Services | Google Analytics (not for UNDER_13), Stripe, RevenueCat, provider integrations |
| 5. Data Security | RLS, encryption at rest/transit, audit logging |
| 6. Your Rights | Data access, deletion, portability (export) |
| 7. Contact | privacy@gamehub.app (monitored; 7-day response target) |

---

## Regional Compliance Beyond COPPA

### GDPR (EU Users)
- Lawful basis: Parental consent + legitimate interest (sports coordination)
- Data processing agreement available upon request
- Data subject rights (access, deletion, rectification) built into app
- GDPR applies to EU users even if parent is outside EU
- Data is stored in Supabase region `eu-west-1` (Ireland) for EU users

### CCPA (California Users)
- "Do Not Sell My Personal Information" link in footer
- Treats child data as "personal information of minors"; parents are the data subject
- Disclosures match CCPA "at or before collection" requirement

### UK ICO
- UK GDPR has COPPA equivalent via ICO guidance on parental consent
- Same approach as GDPR compliance

---

## Audit Trail

Every RSVP write, consent grant, and provider connection is logged to `audit_logs`:

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

| Action | Logged Details |
|---|---|
| `rsvp_written` | child_id, event_id, intent (attending/not/maybe) |
| `consent_given` | child_id, age_band, name, timestamp, ip_address |
| `provider_connected` | provider_id, auth_method |
| `child_deleted` | child_id, name, age_band, deletion_reason |
| `data_exported` | export format, timestamp |

Parents can access their audit log via Settings → Privacy → Activity Log.

---

## Testing & Verification

- [ ] Unit tests for age_band gating (ads/analytics suppressed for UNDER_13)
- [ ] Consent form displays correctly on iOS/web; checkbox required
- [ ] RLS policies prevent accessing sibling children (cross-family test)
- [ ] Soft delete works; undelete possible within 30 days
- [ ] Data export generates valid JSON; includes all child data
- [ ] Provider credentials are not included in data export
- [ ] GDPR deletion request processed in <30 days
- [ ] External audit (pre-launch) validates COPPA compliance

---

## Pre-Launch Verification (COPPA Checklist)

- [ ] Privacy policy reviewed by legal counsel (COPPA + GDPR expert)
- [ ] Parental consent form tested with 10+ parents; clarity validated
- [ ] Age band selection required; no exact DOB collection
- [ ] Child data export verified for completeness
- [ ] Third-party services list audited (no tracking for UNDER_13)
- [ ] Supabase RLS policies tested (cross-family isolation)
- [ ] Soft delete and undelete flows tested end-to-end
- [ ] Audit log includes all security-relevant actions
- [ ] Email communications from platform addressed to parent (no child-directed marketing)
