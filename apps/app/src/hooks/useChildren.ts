import { useEffect, useState } from 'react';
import { supabase } from '@gamehub/domain';
import type { ChildProfile } from '@gamehub/domain';
import { useAuth } from './useAuth';

export function useChildren() {
  const { user } = useAuth();
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function load() {
      const { data } = await supabase
        .from('child_profiles')
        .select('*')
        .eq('parent_user_id', user!.id)
        .order('first_name');

      setChildren(
        (data ?? []).map((row: Record<string, unknown>) => ({
          id: row['id'] as string,
          parentUserId: row['parent_user_id'] as string,
          firstName: row['first_name'] as string,
          lastName: row['last_name'] as string,
          birthDate: row['birth_date'] ? new Date(row['birth_date'] as string) : undefined,
          ageBand: row['age_band'] as ChildProfile['ageBand'],
          sport: row['sport'] as ChildProfile['sport'],
          avatarUrl: row['avatar_url'] as string | undefined,
          createdAt: new Date(row['created_at'] as string),
        })),
      );
      setIsLoading(false);
    }

    load();
  }, [user]);

  return { children, isLoading };
}
