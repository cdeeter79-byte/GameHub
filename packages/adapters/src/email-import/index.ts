import { AdapterError } from '../base';
import { CAPABILITY_MATRIX } from '../capability-matrix';
import type { ProviderAdapter, ExternalEvent } from '../base';
import type { EventType } from '@gamehub/domain';

/**
 * Email Import adapter — last-resort fallback.
 *
 * When no API or ICS feed is available, users can paste the text of a
 * schedule email into GameHub and we attempt to extract events via pattern
 * matching. Results are low-confidence and should be reviewed before saving.
 *
 * This adapter has no network calls — parsing is purely local.
 */

const DATE_PATTERNS = [
  // "Saturday, June 7, 2025" or "Sat Jun 7 2025"
  /\b(?:Mon(?:day)?|Tue(?:sday)?|Wed(?:nesday)?|Thu(?:rsday)?|Fri(?:day)?|Sat(?:urday)?|Sun(?:day)?)[,\s]+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:,?\s+\d{4})?/gi,
  // "06/07/2025" or "6/7/25"
  /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g,
  // "2025-06-07"
  /\b\d{4}-\d{2}-\d{2}\b/g,
];

const TIME_PATTERN = /\b(\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm))\b/g;

const LOCATION_KEYWORDS = ['at ', 'location:', 'venue:', 'field:', 'gym:', 'court:', 'rink:', 'pool:'];

const EVENT_KEYWORDS: Record<EventType, string[]> = {
  GAME: ['game', 'match', 'vs ', 'vs.', 'versus', 'home game', 'away game'],
  PRACTICE: ['practice', 'training', 'workout', 'scrimmage'],
  TOURNAMENT: ['tournament', 'tourney', 'jamboree'],
  TOURNAMENT_GAME: ['bracket game', 'playoff', 'semifinals', 'finals'],
  MEETING: ['meeting', 'parent meeting', 'team meeting'],
  VOLUNTEER: ['volunteer', 'signup', 'sign up'],
  OTHER: [],
};

function detectEventType(text: string): EventType {
  const lower = text.toLowerCase();
  for (const [type, keywords] of Object.entries(EVENT_KEYWORDS) as [EventType, string[]][]) {
    if (keywords.some((k) => lower.includes(k))) return type;
  }
  return 'OTHER';
}

function extractDates(text: string): string[] {
  const found: string[] = [];
  for (const pattern of DATE_PATTERNS) {
    const matches = text.match(new RegExp(pattern.source, pattern.flags));
    if (matches) found.push(...matches);
  }
  return [...new Set(found)];
}

function extractLocation(line: string): string | undefined {
  const lower = line.toLowerCase();
  for (const kw of LOCATION_KEYWORDS) {
    const idx = lower.indexOf(kw);
    if (idx !== -1) return line.slice(idx + kw.length).trim();
  }
  return undefined;
}

export interface ParsedEmailEvent {
  /** Confidence: 0-1. Low confidence = user should review before saving. */
  confidence: number;
  event: ExternalEvent;
}

/**
 * Parse pasted email content into candidate events.
 * Users should review results before confirming.
 */
export function parseEmailContent(emailText: string): ParsedEmailEvent[] {
  const lines = emailText.split('\n').map((l) => l.trim()).filter(Boolean);
  const results: ParsedEmailEvent[] = [];

  let currentDate: string | null = null;
  let idx = 0;

  for (const line of lines) {
    // Check if line contains a date
    const lineDates = extractDates(line);
    if (lineDates.length > 0) currentDate = lineDates[0] ?? null;

    if (!currentDate) { idx++; continue; }

    // Check if line contains a time — treat this line as an event
    const times = line.match(TIME_PATTERN);
    if (times && times.length > 0) {
      const timeStr = times[0] ?? '';
      const startAt = new Date(`${currentDate} ${timeStr}`);
      if (isNaN(startAt.getTime())) { idx++; continue; }

      const endAt = new Date(startAt.getTime() + 5400000); // 90 min default
      const eventType = detectEventType(line);
      const location = extractLocation(line);

      // Title: take the meaningful part of the line
      const title = line
        .replace(new RegExp(TIME_PATTERN.source, 'gi'), '')
        .replace(/\s{2,}/g, ' ')
        .trim() || 'Imported Event';

      results.push({
        confidence: 0.5,
        event: {
          externalId: `email-import-${idx}-${startAt.getTime()}`,
          title,
          type: eventType,
          startAt,
          endAt,
          isCanceled: false,
          location: location ? { name: location, address: location, city: '', state: '', country: '' } : undefined,
        },
      });
    }
    idx++;
  }

  return results;
}

export const emailImportAdapter: ProviderAdapter = {
  id: 'email_import',
  capabilities: CAPABILITY_MATRIX['email_import'],

  async authenticate() {
    // No authentication needed for email import
    return { success: true };
  },

  async fetchTeams() {
    return []; // No teams — email events are manually assigned to a team
  },

  async fetchEvents() {
    throw new AdapterError('NOT_SUPPORTED', 'Email import requires pasting email text. Use parseEmailContent() instead.', 'email_import');
  },

  async sendRSVP() {
    throw new AdapterError('NOT_SUPPORTED', 'Email import does not support RSVP writeback.', 'email_import');
  },
};
