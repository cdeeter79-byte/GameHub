import type { ProviderId } from '@gamehub/config';
import type { ProviderAdapter, ProviderCapabilities } from './base';
import { teamSnapAdapter } from './teamsnap';
import { sportsEngineAdapter } from './sportsengine';
import { sportsEngineTourneyAdapter } from './sportsengine-tourney';
import { playMetricsAdapter } from './playmetrics';
import { leagueAppsAdapter } from './leagueapps';
import { gameChangerAdapter } from './gamechanger';
import { bandAdapter } from './band';
import { hejaAdapter } from './heja';
import { crossbarAdapter } from './crossbar';
import { icsAdapter } from './ics';
import { emailImportAdapter } from './email-import';
import { manualAdapter } from './manual';

export class ProviderRegistry {
  private adapters = new Map<ProviderId, ProviderAdapter>();

  register(adapter: ProviderAdapter): void {
    this.adapters.set(adapter.id, adapter);
  }

  get(id: ProviderId): ProviderAdapter | undefined {
    return this.adapters.get(id);
  }

  getOrThrow(id: ProviderId): ProviderAdapter {
    const adapter = this.adapters.get(id);
    if (!adapter) throw new Error(`No adapter registered for provider: ${id}`);
    return adapter;
  }

  getCapabilities(id: ProviderId): ProviderCapabilities | undefined {
    return this.adapters.get(id)?.capabilities;
  }

  listRegistered(): ProviderId[] {
    return Array.from(this.adapters.keys());
  }

  isCapable(id: ProviderId, capability: keyof ProviderCapabilities): boolean {
    return this.adapters.get(id)?.capabilities[capability] === true;
  }
}

/** Singleton registry — pre-registered with all known adapters */
export const providerRegistry = new ProviderRegistry();
providerRegistry.register(teamSnapAdapter);
providerRegistry.register(sportsEngineAdapter);
providerRegistry.register(sportsEngineTourneyAdapter);
providerRegistry.register(playMetricsAdapter);
providerRegistry.register(leagueAppsAdapter);
providerRegistry.register(gameChangerAdapter);
providerRegistry.register(bandAdapter);
providerRegistry.register(hejaAdapter);
providerRegistry.register(crossbarAdapter);
providerRegistry.register(icsAdapter);
providerRegistry.register(emailImportAdapter);
providerRegistry.register(manualAdapter);
