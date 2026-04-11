import { AdapterError } from '../base';
import { CAPABILITY_MATRIX } from '../capability-matrix';
import { icsAdapter } from '../ics';
import type { ProviderAdapter, AdapterContext, ExternalEvent, ExternalTeam } from '../base';

/**
 * Crossbar adapter.
 *
 * Crossbar does not provide a public developer API. The only supported
 * integration is via Crossbar's built-in calendar export (ICS).
 *
 * How to get your Crossbar ICS link:
 * 1. Log in at crossbar.net → your league/team page
 * 2. Look for "Subscribe to Calendar" or "Export Calendar"
 * 3. Copy the webcal:// or .ics URL
 * 4. Paste it into GameHub's "Add Calendar Feed" screen
 */

const NOT_SUPPORTED_MSG =
  'Crossbar does not provide a public API. To sync your Crossbar schedule, ' +
  'export your team calendar from Crossbar (team page → Subscribe to Calendar) ' +
  'and paste the link into GameHub.';

export const crossbarAdapter: ProviderAdapter = {
  id: 'crossbar',
  capabilities: CAPABILITY_MATRIX['crossbar'],

  async authenticate(credentials) {
    if (credentials['url']) return icsAdapter.authenticate(credentials);
    return { success: false, error: NOT_SUPPORTED_MSG };
  },

  async fetchTeams(ctx): Promise<ExternalTeam[]> {
    if (ctx.accessToken) {
      const teams = await icsAdapter.fetchTeams(ctx);
      return teams.map((t) => ({ ...t, providerId: 'crossbar' as const }));
    }
    throw new AdapterError('NOT_SUPPORTED', NOT_SUPPORTED_MSG, 'crossbar');
  },

  async fetchEvents(ctx): Promise<ExternalEvent[]> {
    if (ctx.accessToken) return icsAdapter.fetchEvents(ctx);
    throw new AdapterError('NOT_SUPPORTED', NOT_SUPPORTED_MSG, 'crossbar');
  },

  async sendRSVP() {
    throw new AdapterError('NOT_SUPPORTED', 'Crossbar does not support RSVP writeback. Your response has been saved in GameHub only.', 'crossbar');
  },
};
