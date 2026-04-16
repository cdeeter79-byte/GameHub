import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@gamehub/domain';
import { useAuth } from './useAuth';

export interface ThreadRow {
  id: string;
  teamName: string;
  providerId: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  isReadOnly: boolean;
}

export function useInbox() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);

    const { data } = await supabase
      .from('message_threads')
      .select('*, messages(body, sent_at, sender_name)')
      .order('last_message_at', { ascending: false })
      .limit(50);

    const mapped: ThreadRow[] = (data ?? []).map((row: Record<string, unknown>) => {
      const msgs = (row['messages'] as Array<{ body: string; sent_at: string; sender_name: string }>) ?? [];
      const sorted = [...msgs].sort(
        (a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime(),
      );
      const lastMsg = sorted[0];
      return {
        id: row['id'] as string,
        teamName: (row['title'] as string) ?? 'Team Chat',
        providerId: (row['provider_id'] as string) ?? 'manual',
        lastMessage: lastMsg
          ? `${lastMsg.sender_name}: ${lastMsg.body}`
          : 'No messages yet',
        lastMessageAt: (row['last_message_at'] as string) ?? new Date().toISOString(),
        unreadCount: 0,
        isReadOnly: (row['is_read_only'] as boolean) ?? false,
      };
    });

    setThreads(mapped);
    setIsLoading(false);
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  return { threads, isLoading, refresh: fetch };
}
