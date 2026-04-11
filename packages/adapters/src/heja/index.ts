import { AdapterError } from '../base';
import { CAPABILITY_MATRIX } from '../capability-matrix';
import { icsAdapter } from '../ics';
import type { ProviderAdapter, AdapterContext, ExternalEvent, ExternalTeam } from '../base';

/**
 * Heja adapter.
 *
 * Heja does not provide a public developer API. The only supported integration
 * is via Heja's built-in calendar export (ICS/webcal) feature.
 *
 * How to get your Heja ICS link:
 * 1. Open Heja app → Team → Calendar
 * 2. Tap "Share Calendar" or "Export"
 * 3. Copy the webcal:// or https:// link
 * 4. Paste it into GameHub's "Add Calendar Feed" screen
 *
 * All schedule data is read-only.
 */

const NOT_SUPPORTED_MSG =
  'Heja does not provide a public API. To sync your Heja schedule, ' +
  'export your team calendar from the Heja app (Team → Calendar → Share Calendar) ' +
  'and paste the calendar link into GameHub.';

export const hejaAdapter: ProviderAdapter = {
  id: 'heja',
  capabilities: CAPABILITY_MATRIX['heja'],

  async authenticate(credentials) {
    // If an ICS URL was provided, delegate to the ICS adapter
    if (credentials['url']) return icsAdapter.authenticate(credentials);
    return { success: false, error: NOT_SUPPORTED_MSG };
  },

  async fetchTeams(ctx): Promise<ExternalTeam[]> {
    if (ctx.accessToken) {
      const teams = await icsAdapter.fetchTeams(ctx);
      return teams.map((t) => ({ ...t, providerId: 'heja' as const }));
    }
    throw new AdapterError('NOT_SUPPORTED', NOT_SUPPORTED_MSG, 'heja');
  },

  async fetchEvents(ctx): Promise<ExternalEvent[]> {
    if (ctx.accessToken) return icsAdapter.fetchEvents(ctx);
    throw new AdapterError('NOT_SUPPORTED', NOT_SUPPORTED_MSG, 'heja');
  },

  async sendRSVP() {
    throw new AdapterError('NOT_SUPPORTED', 'Heja does not support RSVP writeback. Your response has been saved in GameHub only.', 'heja');
  },
};
