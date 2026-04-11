import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@gamehub/domain';

interface Entitlements {
  isPremium: boolean;
  isManager: boolean;
  managerTeamLimit: number;
  isLoading: boolean;
}

export function useEntitlements(): Entitlements {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [managerTeamLimit, setManagerTeamLimit] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    async function loadEntitlements() {
      const { data } = await supabase
        .from('subscription_states')
        .select('plan, status, entitlements')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (data) {
        setIsPremium(data['plan'] === 'premium' && data['status'] === 'ACTIVE');
      }

      const { data: managerData } = await supabase
        .from('manager_plans')
        .select('team_limit, status')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (managerData && managerData['status'] === 'ACTIVE') {
        setIsManager(true);
        setManagerTeamLimit(managerData['team_limit'] as number ?? 1);
      }

      setIsLoading(false);
    }

    loadEntitlements();
  }, [user]);

  return { isPremium, isManager, managerTeamLimit, isLoading };
}
