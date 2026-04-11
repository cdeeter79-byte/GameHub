# GameHub — GitHub Strategy

Last updated: 2026-04-11

## Repository Overview

- **Repo:** `cdeeter79-byte/GameHub`
- **Primary branch:** `main` (production-ready)
- **Development branch:** `develop` (integration branch)
- **Feature branches:** `feature/` prefix
- **Hotfix branches:** `hotfix/` prefix

---

## Branching Strategy

### Main Branch (`main`)
- Always production-ready
- Tagged with semantic version (v1.0.0, v1.0.1, v1.1.0, etc.)
- Deployed to GitHub Pages automatically on push
- iOS TestFlight builds created from `main` tags
- All commits are fast-forward merges (no merge commits)

### Develop Branch (`develop`)
- Integration branch for features
- Staging environment builds from `develop`
- Features merged via pull request with 1 approval
- May contain pre-release features (feature-flagged)

### Feature Branches
```
feature/auth-redesign
feature/provider-band-integration
feature/coppa-compliance
feature/a11y-wcag-aa
```
- Branch from `develop`
- Merge back to `develop` via PR
- Delete after merge
- Naming: `feature/<kebab-case-description>`

### Hotfix Branches
```
hotfix/rsvp-sync-crash
hotfix/security-provider-token-leak
```
- Branch from `main` for critical production fixes
- Merge to both `main` and `develop`
- Semantic version increment: `1.0.0` → `1.0.1`

---

## Pull Request Process

### PR Template (`.github/PULL_REQUEST_TEMPLATE.md`)
```markdown
## Summary
Brief description of changes

## Type
- [ ] Feature
- [ ] Bug fix
- [ ] Refactor
- [ ] Docs
- [ ] Chore

## Testing
- [ ] Unit tests added/updated
- [ ] Manual testing completed (device/OS)
- [ ] Accessibility testing (color contrast, screen reader)

## Screenshots (if UI change)
[Attach images]

## Checklist
- [ ] No hardcoded secrets
- [ ] Dependencies reviewed (npm audit clean)
- [ ] TypeScript strict mode passes
- [ ] ESLint passes
- [ ] Tests pass locally
```

### PR Review Requirements
- **Code review:** 1 approval (any CODEOWNER)
- **CI checks:** All GitHub Actions must pass
- **Branch protection rules on `main`:**
  - Require PR reviews before merge
  - Require status checks to pass
  - Dismiss stale reviews
  - Require branches to be up to date before merge

### Merge Strategy
- Use "Squash and merge" for feature branches (clean history)
- Use "Rebase and merge" for hotfixes and docs (linear history)
- Avoid merge commits

---

## CI/CD Workflows

### Trigger Summary

| Workflow | Trigger | Purpose | Duration |
|---|---|---|---|---|
| `lint.yml` | PR, push | ESLint across all packages | ~2 min |
| `typecheck.yml` | PR, push | TypeScript strict check | ~2 min |
| `test.yml` | PR, push | Jest unit + domain tests | ~5 min |
| `web-build.yml` | PR, push | `expo export --platform web` | ~8 min |
| `ios-check.yml` | PR | `expo prebuild --platform ios` validation | ~10 min |
| `security-scan.yml` | PR, push, weekly | npm audit, dependency-review, OSSF scorecard | ~3 min |
| `codeql.yml` | push, weekly schedule | GitHub CodeQL SAST analysis | ~5 min |
| `pages-deploy.yml` | push to main | Deploy web export to GitHub Pages | ~2 min |
| `preview-build.yml` | PR | Deploy preview to Pages subdirectory | ~8 min |
| `release-tag.yml` | tag push (v*) | Create GitHub release, zip iOS/web artifacts | ~2 min |

### Workflow Concurrency

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

Ensures only one workflow runs per branch at a time. In-progress runs are cancelled when new commit pushed.

---

## Versioning & Releases

### Semantic Versioning
```
v1.0.0
  ↑↑↑
  ││└─ Patch (bug fixes)
  │└── Minor (features, non-breaking)
  └─── Major (breaking changes)
```

### Release Cadence
- **Major** (v1 → v2): ~6–12 months
- **Minor** (v1.0 → v1.1): ~2–4 weeks (3 per quarter target)
- **Patch** (v1.0.0 → v1.0.1): As needed for bugs/security (same week)

### Release Process

1. **Create release branch:**
   ```bash
   git checkout -b release/v1.1.0 develop
   ```

2. **Update version:** Edit `package.json` (root + all packages)
   ```json
   { "version": "1.1.0" }
   ```

3. **Update CHANGELOG.md:**
   ```markdown
   ## [1.1.0] — 2026-06-15

   ### Added
   - BAND provider integration
   - Email import from schedule emails
   - Improved accessibility (WCAG AA)

   ### Fixed
   - RSVP sync race condition
   - Maps service iOS fallback

   ### Changed
   - Dashboard redesign (card-based layout)
   ```

4. **Create PR:** `release/v1.1.0` → `main`
   - Final code review + QA sign-off
   - Automated version bumps via PR commit

5. **Merge & tag:**
   ```bash
   git checkout main
   git merge --squash release/v1.1.0
   git tag v1.1.0
   git push origin main v1.1.0
   ```

6. **GitHub Actions `release-tag.yml` fires:**
   - Creates GitHub Release with release notes
   - Zips `dist/` (web) and `ios/` (Xcode project)
   - Uploads artifacts to release page

7. **Post-release:**
   - Merge `main` back into `develop`
   - Delete `release/v1.1.0` branch

---

## Issue Tracking

### Issue Templates

**Bug Report** (`.github/ISSUE_TEMPLATE/bug_report.yml`)
```yaml
name: Bug Report
description: Report a bug
labels: ["bug"]
body:
  - type: textarea
    id: description
    label: Description
    required: true
  - type: input
    id: reproduction
    label: Steps to Reproduce
    required: true
  - type: input
    id: expected
    label: Expected Behavior
    required: true
  - type: input
    id: device
    label: Device/OS
    required: true
    placeholder: "iPhone 14 / iOS 17"
```

**Feature Request** (`.github/ISSUE_TEMPLATE/feature_request.yml`)
```yaml
name: Feature Request
description: Suggest a feature
labels: ["enhancement"]
body:
  - type: textarea
    id: problem
    label: Problem Statement
    required: true
  - type: textarea
    id: solution
    label: Proposed Solution
    required: true
  - type: textarea
    id: alternatives
    label: Alternatives Considered
```

**Provider Integration** (`.github/ISSUE_TEMPLATE/provider_integration.yml`)
```yaml
name: Provider Integration
description: Add a new provider integration
labels: ["provider"]
body:
  - type: input
    id: provider
    label: Provider Name
    required: true
  - type: textarea
    id: capabilities
    label: Required Capabilities
    required: true
  - type: input
    id: auth
    label: Auth Method
    placeholder: "OAuth, API Key, etc."
```

### Milestones

- **v1.0.0** — MVP (TeamSnap, SportsEngine, ICS, manual)
- **v1.1.0** — Phase 2 providers (PlayMetrics, LeagueApps, email import)
- **v1.2.0** — Accessibility & compliance (WCAG AA, COPPA audit)
- **v2.0.0** — Manager SaaS (Stripe billing, advanced team tools)

### Labels

```
type/bug
type/feature
type/refactor
type/docs
type/chore
priority/p0-critical
priority/p1-high
priority/p2-medium
priority/p3-low
provider/<name>
provider-integration
a11y-accessibility
coppa-compliance
security
performance
ui/web
ui/ios
```

---

## Code Review Standards

### What Gets Reviewed
- **All PRs:** Code quality, test coverage, accessibility
- **Feature PRs:** Architecture, performance, backward compatibility
- **Hotfix PRs:** Minimal scope, regression risk
- **Docs PRs:** Clarity, completeness, examples

### Review Checklist
- [ ] Code follows style guide (ESLint, Prettier)
- [ ] TypeScript strict; no `any` types
- [ ] Test coverage added; critical paths tested
- [ ] Accessibility: color contrast, keyboard nav, screen reader labels
- [ ] No hardcoded secrets or API keys
- [ ] Dependencies are minimal; no unused imports
- [ ] Performance: no N+1 queries, no memory leaks
- [ ] Backward compatibility maintained (or explicitly breaking)

### Request Changes If:
- Missing tests for critical logic
- Accessibility violations (contrast, keyboard nav, labels)
- Security risk (unvalidated input, exposed credentials)
- Significant complexity without explanation/comments
- Inconsistent with established patterns

### Approve If:
- Code is correct and complete
- Tests pass; coverage is acceptable
- No accessibility or security issues
- Follows established patterns
- Documentation is clear

---

## Dependabot Configuration

`.github/dependabot.yml`:
```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: "/"
    schedule:
      interval: weekly
      day: monday
      time: "03:00"
    groups:
      - dependency-type: development
        dependency-type: indirect
    ignore:
      # Ignore major version bumps for RN and Expo (handled manually)
      - dependency-name: "react-native"
        update-types: ["version-update:semver-major"]
      - dependency-name: "expo"
        update-types: ["version-update:semver-major"]
    pull-requests-limit: 5
    rebase-strategy: auto

  - package-ecosystem: github-actions
    directory: "/"
    schedule:
      interval: weekly
      day: monday
```

Dependabot PRs are auto-merged if CI passes (via Mergify or GitHub Actions workflow).

---

## CODEOWNERS

`.github/CODEOWNERS`:
```
# Global
* @cdeeter79-byte

# Documentation
/docs @cdeeter79-byte
/legal @cdeeter79-byte

# Database
/supabase @cdeeter79-byte

# Workflows
/.github/workflows @cdeeter79-byte

# Core packages
/packages/domain @cdeeter79-byte
/packages/adapters @cdeeter79-byte
/packages/config @cdeeter79-byte
/packages/ui @cdeeter79-byte

# App
/apps/app @cdeeter79-byte
```

---

## Security Policy

See `.github/SECURITY.md`:

**Reporting vulnerabilities:**
1. Do NOT open a public issue
2. Report via GitHub Security Advisories (Settings > Security > Report a vulnerability)
3. Include: vulnerability description, affected code, suggested fix, severity
4. Response SLA: 48 hours

**Disclosure:**
- 90-day embargo before public disclosure
- Exception: active exploitation or imminent threat (30-day embargo)

---

## Documentation Policy

- All features documented in `docs/` before or immediately after release
- README.md kept current with latest features
- Architecture decisions documented in Architecture Decision Records (ADRs)
- API docs auto-generated from TypeScript JSDoc comments
- CHANGELOG.md updated with every release

---

## Community & Contribution Policy

GameHub is open-source but not yet accepting external contributions. Future policy:

- Contributors must sign CLA (Contributor License Agreement)
- First-time contributors: welcome; small fixes encouraged
- New provider integrations: post issue first; coordinate with maintainers
- PRs without issues may be declined
- Code of Conduct enforced (inclusive, respectful, professional)
