import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, typography, radii } from '@gamehub/config';
import { ProviderBadge, UnreadBadge, EmptyState } from '@gamehub/ui';
import { useInbox } from '../../src/hooks/useInbox';
import type { ExternalMessage } from '@gamehub/adapters';
import type { ProviderId } from '@gamehub/config';

interface ThreadItem {
  id: string;
  title: string;
  teamName: string;
  providerId: ProviderId;
  lastMessage: string;
  lastMessageAt: Date;
  unreadCount: number;
  isReadOnly: boolean;
}

export default function InboxScreen() {
  const { threads, isLoading, refresh } = useInbox();

  function renderThread({ item }: { item: ThreadItem }) {
    const timeStr = item.lastMessageAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return (
      <TouchableOpacity
        style={styles.thread}
        accessibilityRole="button"
        accessibilityLabel={`${item.teamName} thread from ${item.providerId}, ${item.unreadCount} unread`}
      >
        <View style={styles.threadLeft}>
          <View style={styles.threadHeader}>
            <Text style={styles.teamName} numberOfLines={1}>{item.teamName}</Text>
            {item.isReadOnly ? (
              <View style={styles.readOnlyBadge}>
                <Text style={styles.readOnlyText}>Read only</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.lastMessage} numberOfLines={2}>{item.lastMessage}</Text>
          <ProviderBadge providerId={item.providerId} size="sm" showLabel />
        </View>
        <View style={styles.threadRight}>
          <Text style={styles.time}>{timeStr}</Text>
          <UnreadBadge count={item.unreadCount} />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.center}>
          <Text style={styles.loadingText}>Loading messages…</Text>
        </View>
      ) : threads.length === 0 ? (
        <EmptyState
          icon="✉️"
          title="No messages yet"
          description="Connect a platform with messaging support (like TeamSnap) to see team messages here."
        />
      ) : (
        <FlatList
          data={threads}
          keyExtractor={(item) => item.id}
          renderItem={renderThread}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[950],
  },
  list: {
    paddingBottom: spacing[8],
  },
  thread: {
    flexDirection: 'row',
    padding: spacing[4],
    gap: spacing[3],
    alignItems: 'flex-start',
    backgroundColor: colors.neutral[950],
  },
  threadLeft: {
    flex: 1,
    gap: spacing[1],
  },
  threadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  teamName: {
    color: colors.white,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    flex: 1,
  },
  lastMessage: {
    color: colors.neutral[400],
    fontSize: typography.fontSize.sm,
    lineHeight: typography.fontSize.sm * 1.4,
  },
  threadRight: {
    alignItems: 'flex-end',
    gap: spacing[2],
    minWidth: 60,
  },
  time: {
    color: colors.neutral[500],
    fontSize: typography.fontSize.xs,
  },
  separator: {
    height: 1,
    backgroundColor: colors.neutral[800],
    marginHorizontal: spacing[4],
  },
  readOnlyBadge: {
    backgroundColor: colors.neutral[800],
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  readOnlyText: {
    color: colors.neutral[400],
    fontSize: 10,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.neutral[500],
    fontSize: typography.fontSize.sm,
  },
});
