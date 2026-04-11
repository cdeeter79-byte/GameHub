# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| latest (main) | ✅ |
| develop | ✅ (pre-release) |
| older releases | ❌ |

## Reporting a Vulnerability

**Do NOT open a public GitHub issue for security vulnerabilities.**

Please report security vulnerabilities through **GitHub Security Advisories**:

1. Go to the [Security tab](../../security) of this repository
2. Click **"Report a vulnerability"**
3. Fill in the advisory form with as much detail as possible

Alternatively, email **security@gamehub.app** with subject line `[SECURITY] <brief description>`.

### What to include

- Description of the vulnerability
- Steps to reproduce (proof of concept if possible)
- Potential impact / attack scenario
- Affected versions or components
- Any suggested remediation

## Response SLA

| Severity | Acknowledgment | Target Patch |
|----------|---------------|--------------|
| Critical | 24 hours | 7 days |
| High | 72 hours | 14 days |
| Medium | 1 week | 30 days |
| Low | 2 weeks | Next release |

We will keep you informed of progress. Coordinated disclosure is requested — please allow us to patch before public disclosure.

## Scope

**In scope:**
- Authentication and authorization bypass
- SQL injection / data access vulnerabilities
- Cross-site scripting (XSS) on the web app
- Exposure of user PII or child profile data
- COPPA compliance violations
- Token leakage or insecure storage
- RSVP or messaging writeback to wrong user/team
- Supabase Row-Level Security bypass

**Out of scope:**
- Rate limiting / denial of service
- Social engineering attacks
- Vulnerabilities in third-party provider platforms (TeamSnap, SportsEngine, etc.)
- Issues requiring physical device access
- Self-XSS

## Bug Bounty

GameHub does not currently offer a paid bug bounty program. We greatly appreciate responsible disclosure and will publicly credit researchers (with permission) in our changelog.
