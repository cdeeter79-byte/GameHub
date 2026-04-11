import { AdapterError } from '../base';
import { CAPABILITY_MATRIX } from '../capability-matrix';
import type { ProviderAdapter, ExternalEvent } from '../base';
import type { EventType } from '@gamehub/domain';

/**
 * GameChanger adapter.
 *
 * GameChanger does NOT have a public API as of 2025. The only supported
 * integration path is CSV export from the GameChanger web app.
 *
 * Direct users to: https://gc.com → Team → Export → Schedule CSV
 *
 * CSV format expected:
 *   date, time, event_type, opponent, location, result, notes
 */

const NOT_SUPPORTED_MSG =
  'GameChanger does not provide a public API. To import your schedule, ' +
  'go to your GameChanger team page → Export → Download Schedule (CSV), ' +
  'then use the "Import CSV" option in GameHub.';

function parseDate(dateStr: string, timeStr: string): Date {
  const combined = `${dateStr.trim()} ${timeStr.trim()}`;
  const d = new Date(combined);
  if (isNaN(d.getTime())) return new Date();
  return d;
}

function mapEventType(raw: string): EventType {
  const t = raw.trim().toLowerCase();
  if (t === 'game') return 'GAME';
  if (t === 'practice') return 'PRACTICE';
  if (t === 'tournament' || t === 'tournament game') return 'TOURNAMENT_GAME';
  return 'OTHER';
}

export const gameChangerAdapter: ProviderAdapter = {
  id: 'gamechanger',
  capabilities: CAPABILITY_MATRIX['gamechanger'],

  async authenticate() {
    throw new AdapterError('NOT_SUPPORTED', NOT_SUPPORTED_MSG, 'gamechanger');
  },

  async fetchTeams() {
    throw new AdapterError('NOT_SUPPORTED', NOT_SUPPORTED_MSG, 'gamechanger');
  },

  async fetchEvents() {
    throw new AdapterError('NOT_SUPPORTED', NOT_SUPPORTED_MSG, 'gamechanger');
  },

  async sendRSVP() {
    throw new AdapterError('NOT_SUPPORTED', NOT_SUPPORTED_MSG, 'gamechanger');
  },
};

/**
 * Parse a GameChanger schedule CSV export into ExternalEvent objects.
 * Call this from a CSV import UI flow — not through the standard adapter interface.
 *
 * @param csvContent - raw text content of the exported CSV file
 * @param teamName   - team name to use as event context (from user input)
 */
export function parseGameChangerCSV(csvContent: string, teamName: string): ExternalEvent[] {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0]?.split(',').map((h) => h.trim().toLowerCase()) ?? [];
  const results: ExternalEvent[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line?.trim()) continue;

    const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = cols[idx] ?? ''; });

    const dateStr = row['date'] ?? row['game date'] ?? '';
    const timeStr = row['time'] ?? row['game time'] ?? '12:00 PM';
    if (!dateStr) continue;

    const startAt = parseDate(dateStr, timeStr);
    const endAt = new Date(startAt.getTime() + 5400000); // default 90 min

    results.push({
      externalId: `gc-import-${i}-${startAt.getTime()}`,
      title: row['opponent'] ? `vs ${row['opponent']}` : (row['event_type'] ?? 'Event'),
      type: mapEventType(row['event_type'] ?? ''),
      startAt,
      endAt,
      isCanceled: false,
      opponent: row['opponent'] || undefined,
      notes: row['notes'] || row['result'] || undefined,
      location: row['location'] ? {
        name: row['location'],
        address: row['location'],
        city: '',
        state: '',
        country: 'US',
      } : undefined,
    });
  }

  return results;
}
