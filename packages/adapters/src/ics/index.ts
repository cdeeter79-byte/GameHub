import { AdapterError, retryWithBackoff } from '../base';
import { CAPABILITY_MATRIX } from '../capability-matrix';
import type { ProviderAdapter, AdapterContext, ExternalTeam, ExternalEvent } from '../base';

/**
 * ICS / iCalendar feed adapter.
 *
 * Supports any standard iCalendar (.ics) feed URL, including webcal:// links.
 * Used as a fallback for Heja, Crossbar, and any other platform that exports
 * a calendar subscription without an API.
 */

function normalizeUrl(url: string): string {
  return url.replace(/^webcal:\/\//i, 'https://');
}

/** Parse a DTSTART/DTEND value — handles both date-time and date-only formats */
function parseICSDate(value: string): Date {
  // Strip TZID= parameter prefix: DTSTART;TZID=America/Chicago:20250601T100000
  const raw = value.includes(':') ? value.split(':').pop() ?? value : value;
  if (/^\d{8}T\d{6}Z$/.test(raw)) return new Date(raw);
  if (/^\d{8}T\d{6}$/.test(raw)) {
    const [y, mo, d, h, mi, s] = [raw.slice(0,4), raw.slice(4,6), raw.slice(6,8), raw.slice(9,11), raw.slice(11,13), raw.slice(13,15)];
    return new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}`);
  }
  if (/^\d{8}$/.test(raw)) {
    return new Date(`${raw.slice(0,4)}-${raw.slice(4,6)}-${raw.slice(6,8)}`);
  }
  return new Date(raw);
}

/** Expand RRULE=FREQ=WEEKLY for next N occurrences within a window */
function expandWeeklyRRule(dtstart: Date, rrule: string, windowDays = 90): Date[] {
  const freq = /FREQ=([^;]+)/.exec(rrule)?.[1];
  if (freq !== 'WEEKLY') return [dtstart]; // only handle weekly for now

  const until = /UNTIL=([^;]+)/.exec(rrule)?.[1];
  const count = /COUNT=(\d+)/.exec(rrule)?.[1];
  const interval = Number(/INTERVAL=(\d+)/.exec(rrule)?.[1] ?? '1');

  const maxDate = until
    ? parseICSDate(until)
    : new Date(Date.now() + windowDays * 86400000);
  const maxCount = count ? Number(count) : 100;

  const dates: Date[] = [];
  let current = new Date(dtstart);
  while (current <= maxDate && dates.length < maxCount) {
    dates.push(new Date(current));
    current = new Date(current.getTime() + interval * 7 * 86400000);
  }
  return dates;
}

interface ParsedVEvent {
  uid: string;
  summary: string;
  dtstart: string;
  dtend?: string;
  location?: string;
  description?: string;
  status?: string;
  rrule?: string;
}

function parseICSText(icsText: string): ParsedVEvent[] {
  const events: ParsedVEvent[] = [];
  const lines = icsText
    .replace(/\r\n[ \t]/g, '') // unfold long lines
    .replace(/\r\n/g, '\n')
    .split('\n');

  let current: Partial<ParsedVEvent> | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line === 'BEGIN:VEVENT') {
      current = {};
    } else if (line === 'END:VEVENT' && current) {
      if (current.uid && current.summary && current.dtstart) {
        events.push(current as ParsedVEvent);
      }
      current = null;
    } else if (current) {
      // Property parsing: DTSTART;TZID=...:value  or  SUMMARY:value
      const colonIdx = line.indexOf(':');
      if (colonIdx < 0) continue;
      const propFull = line.slice(0, colonIdx).toUpperCase();
      const propName = propFull.split(';')[0];
      const value = line.slice(colonIdx + 1);

      if (propName === 'UID') current.uid = value;
      else if (propName === 'SUMMARY') current.summary = value;
      else if (propName === 'DTSTART') current.dtstart = line.slice(colonIdx + 1);
      else if (propName === 'DTEND') current.dtend = line.slice(colonIdx + 1);
      else if (propName === 'LOCATION') current.location = value;
      else if (propName === 'DESCRIPTION') current.description = value.replace(/\\n/g, '\n');
      else if (propName === 'STATUS') current.status = value;
      else if (propName === 'RRULE') current.rrule = value;
    }
  }

  return events;
}

function vEventToExternalEvents(ev: ParsedVEvent, teamName: string): ExternalEvent[] {
  const startAt = parseICSDate(ev.dtstart);
  const endAt = ev.dtend ? parseICSDate(ev.dtend) : new Date(startAt.getTime() + 3600000);
  const isCanceled = ev.status?.toUpperCase() === 'CANCELLED';

  const base: ExternalEvent = {
    externalId: ev.uid,
    title: ev.summary,
    type: 'OTHER',
    startAt,
    endAt,
    isCanceled,
    notes: ev.description,
    location: ev.location ? {
      name: ev.location,
      address: ev.location,
      city: '',
      state: '',
      country: '',
    } : undefined,
  };

  if (ev.rrule) {
    const dates = expandWeeklyRRule(startAt, ev.rrule);
    return dates.map((d, i) => ({
      ...base,
      externalId: `${ev.uid}_${i}`,
      startAt: d,
      endAt: new Date(d.getTime() + (endAt.getTime() - startAt.getTime())),
    }));
  }

  return [base];
}

function parseCalendarName(icsText: string): string {
  const match = /X-WR-CALNAME:(.+)/i.exec(icsText);
  return match?.[1]?.trim() ?? 'Imported Calendar';
}

export const icsAdapter: ProviderAdapter = {
  id: 'ics',
  capabilities: CAPABILITY_MATRIX['ics'],

  async authenticate(credentials) {
    const url = credentials['url'];
    if (!url) return { success: false, error: 'ICS URL required' };

    try {
      const normalized = normalizeUrl(url);
      const res = await fetch(normalized, { method: 'HEAD' });
      if (!res.ok) return { success: false, error: `Cannot reach ICS URL (HTTP ${res.status})` };
      return { success: true, accessToken: normalized };
    } catch {
      return { success: false, error: 'Cannot reach ICS URL — check the URL and try again' };
    }
  },

  async fetchTeams(ctx) {
    const url = normalizeUrl(ctx.accessToken ?? '');
    if (!url) throw new AdapterError('INVALID_CREDENTIALS', 'No ICS URL configured', 'ics');

    const res = await retryWithBackoff(() => fetch(url));
    if (!res.ok) throw new AdapterError('NETWORK_ERROR', `ICS fetch failed: ${res.status}`, 'ics');
    const text = await res.text();
    const calName = parseCalendarName(text);

    return [{
      externalId: encodeURIComponent(url),
      name: calName,
      sport: 'OTHER',
      providerId: 'ics' as const,
    }];
  },

  async fetchEvents(ctx) {
    const url = normalizeUrl(ctx.accessToken ?? '');
    if (!url) throw new AdapterError('INVALID_CREDENTIALS', 'No ICS URL configured', 'ics');

    const res = await retryWithBackoff(() => fetch(url));
    if (!res.ok) throw new AdapterError('NETWORK_ERROR', `ICS fetch failed: ${res.status}`, 'ics');
    const text = await res.text();
    const calName = parseCalendarName(text);
    const vEvents = parseICSText(text);

    return vEvents.flatMap((ev) => vEventToExternalEvents(ev, calName));
  },

  async sendRSVP() {
    throw new AdapterError('NOT_SUPPORTED', 'Calendar feeds are read-only. RSVP has been saved in GameHub only.', 'ics');
  },
};
