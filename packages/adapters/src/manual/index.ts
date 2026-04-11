import { CAPABILITY_MATRIX } from '../capability-matrix';
import type { ProviderAdapter } from '../base';

/**
 * Manual entry adapter.
 *
 * Represents events and teams created directly by the user in GameHub.
 * All data is stored in Supabase — this adapter has no external network calls.
 * It exists in the registry so the UI can treat manual entries consistently
 * with provider-synced data (same event card, same RSVP flow, etc.).
 */
export const manualAdapter: ProviderAdapter = {
  id: 'manual',
  capabilities: CAPABILITY_MATRIX['manual'],

  async authenticate() {
    return { success: true }; // Always authenticated — no external credentials
  },

  async fetchTeams() {
    // Manual teams are stored in Supabase, fetched by the domain layer directly.
    // This adapter returns empty — the sync engine won't call it for manual entries.
    return [];
  },

  async fetchEvents() {
    // Manual events are stored in Supabase, not fetched via adapter.
    return [];
  },

  async sendRSVP() {
    // Manual events have native RSVP in Supabase — no external writeback needed.
    return { success: true, wroteBack: false };
  },
};
