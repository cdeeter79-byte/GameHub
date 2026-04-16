import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@gamehub/domain';
import type { ChildProfile } from '@gamehub/domain';
import { ChildAgeBand } from '@gamehub/domain';
import type { Sport } from '@gamehub/domain';
import { useAuth } from './useAuth';

export function useChildren() {
  const { user } = useAuth();
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('child_profiles')
      .select('*')
      .eq('parent_user_id', user.id)
      .order('first_name');

    setChildren(
      (data ?? []).map((row: Record<string, unknown>) => ({
        id: row['id'] as string,
        parentUserId: row['parent_user_id'] as string,
        firstName: row['first_name'] as string,
        lastName: row['last_name'] as string,
        birthDate: row['birth_date'] as string | undefined,
        ageBand: (row['age_band'] as ChildAgeBand) ?? ChildAgeBand.UNDER_13,
        sport: row['sport'] as Sport | undefined,
        avatarUrl: row['avatar_url'] as string | undefined,
        createdAt: row['created_at'] as string,
      })),
    );
    setIsLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  return { children, isLoading, refresh: load };
}
