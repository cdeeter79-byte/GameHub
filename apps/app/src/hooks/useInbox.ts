import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@gamehub/domain';
import { useAuth } from './useAuth';

export function useInbox() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);

    const { data } = await supabase
      .from('message_threads')
      .select('*, messages(body, sent_at, sender_name)')
      .order('last_message_at', { ascending: false })
      .limit(50);

    setThreads(data ?? []);
    setIsLoading(false);
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  return { threads, isLoading, refresh: fetch };
}
