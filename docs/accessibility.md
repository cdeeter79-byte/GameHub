# GameHub — Accessibility Compliance

Last updated: 2026-04-11

## WCAG 2.1 Level AA Target

GameHub targets WCAG 2.1 Level AA accessibility compliance across all surfaces (iOS, web, React Native). This ensures usability for users with visual, motor, hearing, and cognitive disabilities.

---

## Component-Level Accessibility Standards

### Visual Accessibility
| Standard | Implementation |
|---|---|
| **Color contrast** | Minimum 4.5:1 for text, 3:1 for UI components (WCAG AA) |
| **Text sizing** | Scalable fonts (no fixed px heights); respect system font size settings |
| **Text alternatives** | All images have `alt` text; icons paired with visible labels |
| **Color alone** | Never use color as the only indicator of state; include icons, labels, or patterns |

### Motor & Touch Accessibility
| Standard | Implementation |
|---|---|
| **Touch targets** | Minimum 44×44 points (iOS) / 48×48 dp (Android) |
| **Keyboard navigation** | All controls reachable via Tab + arrow keys on web |
| **Voice control** | iOS VoiceOver and Android TalkBack compatible |
| **Motion** | Animations have `prefers-reduced-motion` respects; no flashing >3 Hz |
| **Long press** | No critical actions on long-press; use explicit buttons |

### Hearing Accessibility
| Standard | Implementation |
|---|---|
| **Captions** | Video content (if used) has captions |
| **Sound-based alerts** | No critical information conveyed by sound alone; paired with visual indicator |
| **Notification badges** | Unread count shown as number (not just visual badge) |

### Cognitive Accessibility
| Standard | Implementation |
|---|---|
| **Language clarity** | Plain language, short sentences; reading level 8th grade max |
| **Consistent patterns** | Navigation structure consistent across screens |
| **Error recovery** | Clear error messages; easy undo/correction |
| **Focus management** | Focus indicator visible; focus moves predictably |

---

## React Native Accessibility Props

### Required Accessibility Props

```typescript
// Button with accessible label
<Button
  accessibilityLabel="Add child profile"
  accessibilityRole="button"
  accessible={true}
  onPress={handleAddChild}
/>

// Icon with label (don't expose icon separately)
<View accessible={true} accessibilityLabel="Game scheduled for 2:00 PM">
  <Icon name="schedule" />
  <Text>2:00 PM</Text>
</View>

// Disabled state must be communicated
<Button
  disabled={isLoading}
  accessibilityState={{ disabled: isLoading }}
  accessibilityLabel={isLoading ? "Loading..." : "Submit RSVP"}
/>

// Complex components: use accessibilityHint
<EventCard
  accessibilityLabel="Soccer game vs. Titans"
  accessibilityHint="Saturday at 10:00 AM. Double tap to view details or RSVP."
  accessibilityRole="button"
/>
```

### FlatList Accessibility
```typescript
<FlatList
  accessible={true}
  accessibilityLabel="Upcoming events"
  accessibilityRole="list"
  data={events}
  renderItem={({ item }) => (
    <EventCard
      {...item}
      accessibilityRole="listitem"
      accessibilityLabel={`${item.name} on ${item.date}`}
    />
  )}
/>
```

### Color Contrast Checker
All colors in `packages/config/src/theme.ts` are tested against WCAG AA standards:

| Component | Color | Background | Ratio | Status |
|---|---|---|---|---|
| Primary button text | #FFFFFF | #3B82F6 | 4.8:1 | ✅ AA |
| Label text | #0F172A | #FFFFFF | 13.2:1 | ✅ AAA |
| Disabled text | #9CA3AF | #FFFFFF | 4.5:1 | ✅ AA |
| Link underline | #3B82F6 | #FFFFFF | 4.8:1 | ✅ AA |
| Error border | #EF4444 | #FFFFFF | 3.9:1 | ⚠️ Try #DC2626 (5.2:1) |

---

## Web Surface Accessibility (React Native Web)

### Semantic HTML
Generate semantic HTML from RN components:
- `<button>` (not `<div onClick>`)
- `<input type="checkbox">` (not custom toggle)
- `<nav>`, `<main>`, `<section>` landmarks
- `<label htmlFor="input-id">` for form inputs

### ARIA Attributes
```typescript
// Tab navigation
<View
  role="tablist"
  aria-label="Main navigation"
>
  <Pressable
    role="tab"
    aria-selected={activeTab === 'dashboard'}
    aria-controls="dashboard-panel"
    onPress={() => setActiveTab('dashboard')}
  >
    Dashboard
  </Pressable>
  <Pressable
    role="tab"
    aria-selected={activeTab === 'schedule'}
    aria-controls="schedule-panel"
  >
    Schedule
  </Pressable>
</View>

<View id="dashboard-panel" role="tabpanel" aria-labelledby="dashboard-tab">
  {/* content */}
</View>
```

### Focus Management
```typescript
const searchInput = useRef(null);

useEffect(() => {
  if (isSearchOpen) {
    searchInput.current?.focus();
  }
}, [isSearchOpen]);

return <TextInput ref={searchInput} />;
```

### Skip Links
Add to `_layout.tsx`:
```html
<a href="#main-content" className="sr-only">
  Skip to main content
</a>
<main id="main-content">
  {/* page content */}
</main>
```

---

## Testing Plan

### Automated Testing
- **axe-core** (web): `npm run a11y:test` checks all routes for accessibility violations
- **Pa11y** (CI): Runs in GitHub Actions on `pages-deploy.yml` before deploying to Pages

### Manual Testing (Required Pre-Launch)
| Testing Scenario | Tools | Frequency |
|---|---|---|
| Screen reader (iOS) | VoiceOver | Per feature (iOS) |
| Screen reader (Android) | TalkBack | Per feature (Android) |
| Screen reader (web) | NVDA or JAWS | Per release |
| Keyboard navigation | Tab + arrow keys | Per release (web) |
| Voice control | Voice Control (iOS) or Voice Access (Android) | Quarterly |
| Color contrast | WebAIM contrast checker | Per design change |
| Zoom/text scaling | iOS: Settings > Accessibility > Larger Accessibility Sizes | Per release |
| Motion reduction | iOS: Settings > Accessibility > Reduce Motion | Per animation |

### Test Fixtures
Create test data in `packages/domain/src/__fixtures__/a11y.ts`:
```typescript
// Events with long names, short names, special characters
export const a11yTestEvents = [
  { name: 'Soccer Game vs. Super Long Team Name FC United', ...},
  { name: '⚽', ...}, // icon-only name
];

// Teams with various name lengths
export const a11yTestTeams = [
  { name: 'A', ...}, // single char
  { name: 'Very Long Team Name With Multiple Words', ...},
];
```

---

## Accessibility Audit Checklist

### Perception (Visible/Perceivable)
- [ ] All text has sufficient color contrast (4.5:1 minimum)
- [ ] Text resizes up to 200% without loss of function (web)
- [ ] All images have alt text or are marked decorative
- [ ] Color is not the only indicator of state
- [ ] No flashing or strobing content

### Operability (Usable)
- [ ] All interactive elements are 44×44 (iOS) or 48×48 (Android) minimum
- [ ] Keyboard navigation works on web (Tab, Enter, Escape)
- [ ] Touch targets are spaced adequately (no accidental activation)
- [ ] Focus is always visible
- [ ] No time limits on interactions (or easily extended)

### Understandability
- [ ] Language is clear; reading level is 8th grade or lower
- [ ] Instructions are explicit; headings are descriptive
- [ ] Error messages are specific ("Required field" not "Error")
- [ ] Navigation is consistent across screens
- [ ] Users can undo destructive actions

### Robustness
- [ ] Accessible names/descriptions on all controls
- [ ] Proper heading hierarchy (H1 > H2 > H3)
- [ ] ARIA roles and attributes used correctly
- [ ] No duplicate IDs
- [ ] Semantic HTML where possible

---

## Pre-Launch Accessibility Testing

- [ ] Full axe-core scan of web app in staging
- [ ] Manual VoiceOver test on iPhone (iOS)
- [ ] Manual TalkBack test on Android
- [ ] Keyboard-only navigation on web (no mouse)
- [ ] Color contrast audit on all buttons, links, text
- [ ] 200% zoom test on web
- [ ] Usability test with 2–3 screen reader users (accessibility specialist recommended)
- [ ] WCAG 2.1 Level AA audit report generated

---

## Ongoing Accessibility Maintenance

- Every PR must pass axe-core scan in CI
- Design system components must have accessibility documented
- New features include accessibility testing in acceptance criteria
- Annual third-party accessibility audit
- User feedback on accessibility issues prioritized in backlog
