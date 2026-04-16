import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@gamehub/domain';
import { useAuth } from './useAuth';

export interface RosterParent {
  name: string;
  relationship: string | null;
  phone: string | null;
  email: string | null;
}

export interface RosterPlayer {
  id: string;
  firstName: string;
  lastName: string;
  jerseyNumber: string | null;
  position: string | null;
  role: string;
  avatarUrl: string | null;
  /** Parent/guardian contacts — from roster_contacts if available */
  parents: RosterParent[];
  /** True if this is one of the current user's own children */
  isOwnChild: boolean;
}

export interface RosterTeam {
  teamId: string;
  teamName: string;
  sport: string;
  players: RosterPlayer[];
}

export function useRoster() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<RosterTeam[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) { setIsLoading(false); return; }
    setIsLoading(true);
    try {
      // ── Build team map ────────────────────────────────────────────────────
      const teamMap = new Map<string, RosterTeam>();

      function ensureTeam(teamId: string, teamName: string, sport: string) {
        if (!teamMap.has(teamId)) {
          teamMap.set(teamId, { teamId, teamName, sport, players: [] });
        }
        return teamMap.get(teamId)!;
      }

      // ── 1. Seed map with all teams the user belongs to ────────────────────
      const { data: memberTeams } = await supabase
        .from('team_members')
        .select('teams ( id, name, sport )');

      for (const row of (memberTeams ?? [])) {
        const r = row as Record<string, unknown>;
        const team = r['teams'] as { id: string; name: string; sport: string } | null;
        if (team) ensureTeam(team.id, team.name, team.sport);
      }

      // ── 2. Fetch classic roster_entries (own children) ───────────────────
      const { data: entryData, error: entryError } = await supabase
        .from('roster_entries')
        .select(`
          id,
          jersey_number,
          position,
          role,
          teams ( id, name, sport ),
          child_profiles ( id, first_name, last_name, avatar_url )
        `);

      if (entryError) throw entryError;

      // ── 3. Fetch roster_contacts (full team with parent info) ────────────
      const { data: contactData } = await supabase
        .from('roster_contacts')
        .select(`
          id,
          team_id,
          player_first_name,
          player_last_name,
          jersey_number,
          position,
          role,
          parent_name,
          parent_relationship,
          parent_phone,
          parent_email,
          parent2_name,
          parent2_relationship,
          parent2_phone,
          parent2_email,
          child_profile_id,
          teams ( id, name, sport )
        `);

      // Collect child_profile_ids that come from roster_contacts so we don't duplicate
      const contactChildIds = new Set<string>(
        (contactData ?? [])
          .map((r: Record<string, unknown>) => r['child_profile_id'] as string | null)
          .filter((id): id is string => Boolean(id)),
      );

      // Add players from roster_entries that are NOT already in roster_contacts
      for (const row of (entryData ?? [])) {
        const r = row as Record<string, unknown>;
        const team = r['teams'] as { id: string; name: string; sport: string } | null;
        const child = r['child_profiles'] as {
          id: string; first_name: string; last_name: string; avatar_url: string | null;
        } | null;

        if (!team || !child) continue;
        // Skip if already covered by roster_contacts
        if (contactChildIds.has(child.id)) continue;

        const t = ensureTeam(team.id, team.name, team.sport);
        t.players.push({
          id: r['id'] as string,
          firstName: child.first_name,
          lastName: child.last_name,
          jerseyNumber: r['jersey_number'] as string | null,
          position: r['position'] as string | null,
          role: r['role'] as string,
          avatarUrl: child.avatar_url,
          parents: [],
          isOwnChild: true,
        });
      }

      // Add players from roster_contacts
      for (const row of (contactData ?? [])) {
        const r = row as Record<string, unknown>;
        const team = r['teams'] as { id: string; name: string; sport: string } | null;
        if (!team) continue;

        const parents: RosterParent[] = [];
        if (r['parent_name']) {
          parents.push({
            name: r['parent_name'] as string,
            relationship: r['parent_relationship'] as string | null,
            phone: r['parent_phone'] as string | null,
            email: r['parent_email'] as string | null,
          });
        }
        if (r['parent2_name']) {
          parents.push({
            name: r['parent2_name'] as string,
            relationship: r['parent2_relationship'] as string | null,
            phone: r['parent2_phone'] as string | null,
            email: r['parent2_email'] as string | null,
          });
        }

        const childProfileId = r['child_profile_id'] as string | null;

        const t = ensureTeam(team.id, team.name, team.sport);
        t.players.push({
          id: r['id'] as string,
          firstName: r['player_first_name'] as string,
          lastName: r['player_last_name'] as string,
          jerseyNumber: r['jersey_number'] as string | null,
          position: r['position'] as string | null,
          role: r['role'] as string,
          avatarUrl: null,
          parents,
          isOwnChild: childProfileId != null,
        });
      }

      // Sort players by last name within each team
      for (const team of teamMap.values()) {
        team.players.sort((a, b) => a.lastName.localeCompare(b.lastName));
      }

      setTeams(Array.from(teamMap.values()));
    } catch (err) {
      console.error('[useRoster]', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  return { teams, isLoading, refresh: load };
}
