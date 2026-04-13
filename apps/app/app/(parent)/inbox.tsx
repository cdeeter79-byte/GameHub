import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useInbox } from '../../src/hooks/useInbox';

const C = {
  bg: '#0F172A',
  surface: '#1E293B',
  border: '#334155',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  primary: '#3B82F6',
  primaryBg: '#172554',
  unread: '#10B981',
  unreadBg: '#064E3B',
};

// Provider brand colors
const PROVIDER_COLORS: Record<string, string> = {
  teamsnap: '#EF4444',
  sportsengine: '#3B82F6',
  playmetrics: '#10B981',
  gamechanger: '#1D4ED8',
  band: '#6366F1',
  heja: '#059669',
  ics: '#64748B',
  manual: '#94A3B8',
};

interface ThreadRow {
  id: string;
  teamName: string;
  providerId: string;
  lastMessage: string;
  lastMessageAt: string;  // ISO string from Supabase
  unreadCount: number;
  isReadOnly: boolean;
}

function formatThreadTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) {
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function ProviderDot({ providerId }: { providerId: string }) {
  const color = PROVIDER_COLORS[providerId.toLowerCase()] ?? C.textTertiary;
  return (
    <View style={[styles.providerDot, { backgroundColor: color }]}>
      <Text style={styles.providerText}>{providerId.substring(0, 2).toUpperCase()}</Text>
    </View>
  );
}

function Thread({ item }: { item: ThreadRow }) {
  const hasUnread = item.unreadCount > 0;
  return (
    <TouchableOpacity
      style={styles.thread}
      accessibilityRole="button"
      accessibilityLabel={`${item.teamName}, ${item.unreadCount} unread messages`}
      activeOpacity={0.7}
    >
      <ProviderDot providerId={item.providerId} />
      <View style={styles.threadBody}>
        <View style={styles.threadTop}>
          <Text style={[styles.teamName, hasUnread && styles.teamNameUnread]} numberOfLines={1}>
            {item.teamName}
          </Text>
          <Text style={[styles.time, hasUnread && styles.timeUnread]}>
            {formatThreadTime(item.lastMessageAt)}
          </Text>
        </View>
        <View style={styles.threadBottom}>
          <Text style={[styles.preview, hasUnread && styles.previewUnread]} numberOfLines={2}>
            {item.lastMessage}
          </Text>
          {hasUnread && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>
                {item.unreadCount > 99 ? '99+' : item.unreadCount}
              </Text>
            </View>
          )}
        </View>
        {item.isReadOnly && (
          <Text style={styles.readOnly}>Read-only</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function InboxScreen() {
  const { threads, isLoading } = useInbox();
  const typedThreads = threads as ThreadRow[];

  return (
    <View style={styles.root}>
      {isLoading ? (
        <View style={styles.center}>
          <Text style={styles.centerText}>Loading messages…</Text>
        </View>
      ) : typedThreads.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>✉️</Text>
          <Text style={styles.emptyTitle}>No messages yet</Text>
          <Text style={styles.emptyDesc}>
            Connect TeamSnap, BAND, or another platform with messaging support to see team messages here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={typedThreads}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <Thread item={item} />}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  list: { paddingBottom: 60 },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: C.border, marginLeft: 72 },

  thread: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
    backgroundColor: C.bg,
  },

  providerDot: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  providerText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  threadBody: { flex: 1, gap: 4 },
  threadTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  teamName: {
    color: C.textSecondary,
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  teamNameUnread: { color: C.text, fontWeight: '700' },
  time: { color: C.textTertiary, fontSize: 12 },
  timeUnread: { color: C.unread, fontWeight: '600' },

  threadBottom: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  preview: {
    color: C.textTertiary,
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  previewUnread: { color: C.textSecondary },
  unreadBadge: {
    backgroundColor: C.unread,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginTop: 2,
  },
  unreadCount: { color: '#fff', fontSize: 11, fontWeight: '700' },
  readOnly: { color: C.textTertiary, fontSize: 11, marginTop: 2 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  centerText: { color: C.textTertiary, fontSize: 14 },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 4 },
  emptyTitle: { color: C.text, fontSize: 20, fontWeight: '700', textAlign: 'center' },
  emptyDesc: {
    color: C.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
});
