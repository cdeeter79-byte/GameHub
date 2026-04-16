import { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useInbox } from '../../src/hooks/useInbox';
import type { ThreadRow } from '../../src/hooks/useInbox';
import { useAuth } from '../../src/hooks/useAuth';
import { useChildren } from '../../src/hooks/useChildren';
import { useRoster } from '../../src/hooks/useRoster';
import type { RosterPlayer } from '../../src/hooks/useRoster';
import { supabase } from '@gamehub/domain';

const C = {
  bg: '#0F172A',
  surface: '#1E293B',
  surfaceRaised: '#253347',
  border: '#334155',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  primary: '#3B82F6',
  primaryBg: '#172554',
  primaryLight: '#60A5FA',
  unread: '#10B981',
  unreadBg: '#064E3B',
  accent: '#10B981',
};

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

interface Message {
  id: string;
  senderName: string;
  body: string;
  sentAt: string;
  isOutbound: boolean;
}

type InboxFilter = 'all' | 'coaches' | string; // string for team-id or child-id filter

function formatThreadTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString('en-US', { weekday: 'short' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatMsgTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function ProviderDot({ providerId }: { providerId: string }) {
  const id = (providerId ?? 'manual').toLowerCase();
  const color = PROVIDER_COLORS[id] ?? C.textTertiary;
  return (
    <View style={[styles.providerDot, { backgroundColor: color }]}>
      <Text style={styles.providerText}>{id.substring(0, 2).toUpperCase()}</Text>
    </View>
  );
}

function Thread({ item, onPress }: { item: ThreadRow; onPress: () => void }) {
  const hasUnread = item.unreadCount > 0;
  return (
    <TouchableOpacity
      style={styles.thread}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.teamName}, open thread`}
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
              <Text style={styles.unreadCount}>{item.unreadCount > 99 ? '99+' : item.unreadCount}</Text>
            </View>
          )}
        </View>
        {item.isReadOnly && <Text style={styles.readOnly}>Read-only</Text>}
      </View>
    </TouchableOpacity>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isOut = message.isOutbound;
  return (
    <View style={[styles.bubbleWrap, isOut ? styles.bubbleWrapOut : styles.bubbleWrapIn]}>
      {!isOut && <Text style={styles.bubbleSender}>{message.senderName}</Text>}
      <View style={[styles.bubble, isOut ? styles.bubbleOut : styles.bubbleIn]}>
        <Text style={[styles.bubbleText, isOut && styles.bubbleTextOut]}>{message.body}</Text>
      </View>
      <Text style={[styles.bubbleTime, isOut && styles.bubbleTimeOut]}>
        {formatMsgTime(message.sentAt)}
      </Text>
    </View>
  );
}

// ─── Contact picker for new message ───────────────────────────────────────────

interface Contact {
  id: string;
  label: string;       // e.g. "Emma Test's Mom"
  sublabel: string;    // e.g. "Blue Lightning FC"
  phone: string | null;
  email: string | null;
  teamName: string;
}

function ContactPickerModal({
  visible,
  contacts,
  onSelect,
  onCancel,
}: {
  visible: boolean;
  contacts: Contact[];
  onSelect: (contact: Contact) => void;
  onCancel: () => void;
}) {
  const [search, setSearch] = useState('');
  const filtered = contacts.filter(
    (c) =>
      c.label.toLowerCase().includes(search.toLowerCase()) ||
      c.sublabel.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onCancel}>
      <SafeAreaView style={styles.pickerRoot}>
        <View style={styles.pickerHeader}>
          <TouchableOpacity onPress={onCancel} accessibilityRole="button">
            <Text style={styles.pickerCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.pickerTitle}>New Message</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.pickerSearch}>
          <TextInput
            style={styles.pickerSearchInput}
            placeholder="Search contacts…"
            placeholderTextColor={C.textTertiary}
            value={search}
            onChangeText={setSearch}
            autoFocus
          />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.pickerRow}
              onPress={() => { setSearch(''); onSelect(item); }}
              activeOpacity={0.7}
            >
              <View style={styles.pickerAvatar}>
                <Text style={styles.pickerAvatarText}>
                  {item.label.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
                </Text>
              </View>
              <View style={styles.pickerInfo}>
                <Text style={styles.pickerLabel}>{item.label}</Text>
                <Text style={styles.pickerSublabel}>{item.sublabel}</Text>
              </View>
              <Text style={styles.pickerChevron}>›</Text>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.pickerSep} />}
          ListEmptyComponent={
            <View style={styles.pickerEmpty}>
              <Text style={styles.pickerEmptyText}>No contacts found</Text>
            </View>
          }
          contentContainerStyle={styles.pickerList}
        />
      </SafeAreaView>
    </Modal>
  );
}

// ─── Compose modal ─────────────────────────────────────────────────────────────

function ComposeModal({
  contact,
  onSend,
  onCancel,
}: {
  contact: Contact | null;
  onSend: (body: string) => void;
  onCancel: () => void;
}) {
  const [body, setBody] = useState('');
  if (!contact) return null;
  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onCancel}>
      <SafeAreaView style={styles.composeRoot}>
        <View style={styles.composeHeader}>
          <TouchableOpacity onPress={onCancel} accessibilityRole="button">
            <Text style={styles.composeCancel}>Cancel</Text>
          </TouchableOpacity>
          <View style={styles.composeTitleWrap}>
            <Text style={styles.composeTitle} numberOfLines={1}>To: {contact.label}</Text>
            <Text style={styles.composeSubtitle}>{contact.sublabel}</Text>
          </View>
          <TouchableOpacity
            onPress={() => { if (body.trim()) { onSend(body.trim()); setBody(''); } }}
            disabled={!body.trim()}
            accessibilityRole="button"
          >
            <Text style={[styles.composeSend, !body.trim() && styles.composeSendDisabled]}>Send</Text>
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TextInput
            style={styles.composeBody}
            placeholder="Write your message…"
            placeholderTextColor={C.textTertiary}
            value={body}
            onChangeText={setBody}
            multiline
            autoFocus
            textAlignVertical="top"
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function InboxScreen() {
  const { threads, isLoading, refresh } = useInbox();
  const { user } = useAuth();
  const { children } = useChildren();
  const { teams: rosterTeams } = useRoster();

  const [filter, setFilter] = useState<InboxFilter>('all');
  const [selectedThread, setSelectedThread] = useState<ThreadRow | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const listRef = useRef<FlatList>(null);

  // ── Build contact directory from roster ────────────────────────────────────
  const contacts = useMemo<Contact[]>(() => {
    const result: Contact[] = [];
    for (const team of rosterTeams) {
      for (const player of team.players) {
        for (const parent of player.parents) {
          result.push({
            id: `${player.id}-${parent.name}`,
            label: `${player.firstName} ${player.lastName}'s ${parent.relationship ?? 'Parent'}`,
            sublabel: team.teamName,
            phone: parent.phone,
            email: parent.email,
            teamName: team.teamName,
          });
        }
        // If no parents recorded, still add player entry
        if (player.parents.length === 0) {
          result.push({
            id: player.id,
            label: `${player.firstName} ${player.lastName}`,
            sublabel: `${team.teamName} · No contact info`,
            phone: null,
            email: null,
            teamName: team.teamName,
          });
        }
      }
    }
    // De-duplicate by label+team
    const seen = new Set<string>();
    return result.filter((c) => {
      const key = `${c.label}|${c.teamName}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [rosterTeams]);

  // ── Filter logic ───────────────────────────────────────────────────────────
  const filteredThreads = useMemo(() => {
    if (filter === 'all') return threads;
    if (filter === 'coaches') {
      // Threads where the last message or title suggests a coach
      return threads.filter(
        (t) =>
          t.lastMessage?.toLowerCase().includes('coach') ||
          t.teamName?.toLowerCase().includes('coach'),
      );
    }
    // Filter by child name (child.id stored as filter value)
    const child = children.find((c) => c.id === filter);
    if (child) {
      // Show threads for teams this child is on
      const childTeamNames = rosterTeams
        .filter((t) => t.players.some((p) => p.isOwnChild && p.firstName === child.firstName))
        .map((t) => t.teamName.toLowerCase());
      return threads.filter((t) =>
        childTeamNames.some((name) => t.teamName?.toLowerCase().includes(name.split(' ')[0] ?? '')),
      );
    }
    return threads;
  }, [threads, filter, children, rosterTeams]);

  // ── Filter chip definitions ────────────────────────────────────────────────
  const filterChips: { id: InboxFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    ...children.map((c) => ({ id: c.id as InboxFilter, label: c.firstName })),
    { id: 'coaches', label: 'Coaches' },
  ];

  // ── Thread open ────────────────────────────────────────────────────────────
  async function openThread(thread: ThreadRow) {
    setSelectedThread(thread);
    setThreadLoading(true);
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('thread_id', thread.id)
      .order('sent_at', { ascending: true });

    const mapped: Message[] = (data ?? []).map((row: Record<string, unknown>) => ({
      id: row['id'] as string,
      senderName: row['sender_name'] as string,
      body: row['body'] as string,
      sentAt: row['sent_at'] as string,
      isOutbound: (row['is_outbound'] as boolean) ?? false,
    }));
    setMessages(mapped);
    setThreadLoading(false);
  }

  function closeThread() {
    setSelectedThread(null);
    setMessages([]);
    setReplyText('');
    refresh();
  }

  async function sendReply() {
    if (!selectedThread || !replyText.trim() || !user) return;
    setSending(true);
    const body = replyText.trim();
    setReplyText('');
    const userName = (user.user_metadata?.['full_name'] as string) ?? user.email ?? 'Me';
    const newMsg: Message = {
      id: `temp-${Date.now()}`,
      senderName: userName,
      body,
      sentAt: new Date().toISOString(),
      isOutbound: true,
    };
    setMessages((prev) => [...prev, newMsg]);
    await supabase.from('messages').insert({
      thread_id: selectedThread.id,
      sender_name: userName,
      body,
      sent_at: newMsg.sentAt,
      is_outbound: true,
      provider_id: selectedThread.providerId,
    });
    setSending(false);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }

  // ── Direct message send ────────────────────────────────────────────────────
  async function handleDirectMessageSend(body: string) {
    if (!selectedContact || !user) return;
    const userName = (user.user_metadata?.['full_name'] as string) ?? user.email ?? 'Me';
    try {
      // Create a new thread for this direct message
      const { data: threadData, error: threadError } = await supabase
        .from('message_threads')
        .insert({
          title: `Direct: ${selectedContact.label}`,
          last_message_at: new Date().toISOString(),
          is_read_only: false,
          provider_id: 'manual',
        })
        .select()
        .single();

      if (threadError) throw threadError;

      await supabase.from('messages').insert({
        thread_id: threadData.id,
        sender_name: userName,
        body,
        sent_at: new Date().toISOString(),
        is_outbound: true,
        provider_id: 'manual',
      });

      setSelectedContact(null);
      refresh();
      Alert.alert('Message Sent', `Your message to ${selectedContact.label} has been sent.`);
    } catch {
      Alert.alert('Error', 'Could not send message. Please try again.');
    }
  }

  function handleNewMessage() {
    if (contacts.length === 0) {
      Alert.alert(
        'No Contacts Available',
        'To message teammates and coaches, sync a team platform (like TeamSnap) first. Contacts will appear here once your roster is loaded.',
        [{ text: 'OK' }],
      );
      return;
    }
    setShowContactPicker(true);
  }

  return (
    <View style={styles.root}>
      {/* ── Filter chips ─── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {filterChips.map((chip) => (
          <TouchableOpacity
            key={chip.id}
            style={[styles.filterChip, filter === chip.id && styles.filterChipActive]}
            onPress={() => setFilter(chip.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: filter === chip.id }}
          >
            <Text style={[styles.filterChipText, filter === chip.id && styles.filterChipTextActive]}>
              {chip.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Thread list ─── */}
      {isLoading ? (
        <View style={styles.center}>
          <Text style={styles.centerText}>Loading messages…</Text>
        </View>
      ) : filteredThreads.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>✉️</Text>
          <Text style={styles.emptyTitle}>
            {threads.length === 0 ? 'No messages yet' : 'No messages match this filter'}
          </Text>
          <Text style={styles.emptyDesc}>
            {threads.length === 0
              ? 'Connect TeamSnap, BAND, or another platform with messaging support to see team messages here.'
              : 'Try a different filter above.'}
          </Text>
        </View>
      ) : (
        <>
          <FlatList
            data={filteredThreads}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <Thread item={item} onPress={() => openThread(item)} />}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
          <TouchableOpacity
            style={styles.composeFab}
            onPress={handleNewMessage}
            accessibilityRole="button"
            accessibilityLabel="New message"
          >
            <Text style={styles.composeFabText}>✏️  New Message</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Show FAB even when empty */}
      {!isLoading && threads.length === 0 && (
        <TouchableOpacity
          style={styles.composeFab}
          onPress={handleNewMessage}
          accessibilityRole="button"
          accessibilityLabel="New message"
        >
          <Text style={styles.composeFabText}>✏️  New Message</Text>
        </TouchableOpacity>
      )}

      {/* ── Thread detail modal ─── */}
      <Modal
        visible={selectedThread != null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeThread}
      >
        <SafeAreaView style={styles.modalRoot}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeThread} accessibilityRole="button" accessibilityLabel="Close">
              <Text style={styles.modalClose}>← Back</Text>
            </TouchableOpacity>
            <View style={styles.modalTitleWrap}>
              <Text style={styles.modalTitle} numberOfLines={1}>{selectedThread?.teamName}</Text>
              {selectedThread?.isReadOnly && (
                <Text style={styles.modalReadOnly}>Read-only</Text>
              )}
            </View>
            {!selectedThread?.isReadOnly && (
              <TouchableOpacity onPress={handleNewMessage} accessibilityRole="button">
                <Text style={styles.modalNewMsg}>+</Text>
              </TouchableOpacity>
            )}
          </View>

          {threadLoading ? (
            <View style={styles.center}>
              <ActivityIndicator color={C.primary} />
            </View>
          ) : (
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(m) => m.id}
              renderItem={({ item }) => <MessageBubble message={item} />}
              contentContainerStyle={styles.msgList}
              onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
              ListEmptyComponent={
                <View style={styles.center}>
                  <Text style={styles.centerText}>No messages in this thread yet.</Text>
                </View>
              }
            />
          )}

          {!selectedThread?.isReadOnly && (
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              keyboardVerticalOffset={8}
            >
              <View style={styles.replyBar}>
                <TextInput
                  style={styles.replyInput}
                  placeholder="Type a message…"
                  placeholderTextColor={C.textTertiary}
                  value={replyText}
                  onChangeText={setReplyText}
                  multiline
                  maxLength={2000}
                />
                <TouchableOpacity
                  style={[styles.sendBtn, (!replyText.trim() || sending) && styles.sendBtnDisabled]}
                  onPress={sendReply}
                  disabled={!replyText.trim() || sending}
                  accessibilityRole="button"
                  accessibilityLabel="Send message"
                >
                  {sending ? (
                    <ActivityIndicator color={C.text} size="small" />
                  ) : (
                    <Text style={styles.sendBtnText}>Send</Text>
                  )}
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          )}
        </SafeAreaView>
      </Modal>

      {/* ── Contact picker ─── */}
      <ContactPickerModal
        visible={showContactPicker}
        contacts={contacts}
        onSelect={(contact) => {
          setShowContactPicker(false);
          // Delay so the picker's dismiss animation completes before the compose modal mounts
          setTimeout(() => setSelectedContact(contact), 400);
        }}
        onCancel={() => setShowContactPicker(false)}
      />

      {/* ── Compose to individual ─── */}
      {selectedContact && (
        <ComposeModal
          contact={selectedContact}
          onSend={handleDirectMessageSend}
          onCancel={() => setSelectedContact(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Filter chips
  filterScroll: { maxHeight: 48, borderBottomWidth: 1, borderBottomColor: C.border },
  filterContent: {
    paddingHorizontal: 16, paddingVertical: 10, gap: 8, flexDirection: 'row', alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
  },
  filterChipActive: { backgroundColor: C.primaryBg, borderColor: C.primary },
  filterChipText: { color: C.textSecondary, fontSize: 13, fontWeight: '500' },
  filterChipTextActive: { color: '#fff', fontWeight: '700' },

  list: { paddingBottom: 100 },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: C.border, marginLeft: 72 },

  thread: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 16, paddingVertical: 14, gap: 14, backgroundColor: C.bg,
  },
  providerDot: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  providerText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  threadBody: { flex: 1, gap: 4 },
  threadTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  teamName: { color: C.textSecondary, fontSize: 15, fontWeight: '500', flex: 1, marginRight: 8 },
  teamNameUnread: { color: C.text, fontWeight: '700' },
  time: { color: C.textTertiary, fontSize: 12 },
  timeUnread: { color: C.unread, fontWeight: '600' },
  threadBottom: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  preview: { color: C.textTertiary, fontSize: 14, lineHeight: 20, flex: 1 },
  previewUnread: { color: C.textSecondary },
  unreadBadge: {
    backgroundColor: C.unread, borderRadius: 10, minWidth: 20, height: 20,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, marginTop: 2,
  },
  unreadCount: { color: '#fff', fontSize: 11, fontWeight: '700' },
  readOnly: { color: C.textTertiary, fontSize: 11, marginTop: 2 },

  composeFab: {
    position: 'absolute', bottom: 20, right: 16, left: 16,
    backgroundColor: C.primary, borderRadius: 14,
    paddingVertical: 13, alignItems: 'center', justifyContent: 'center',
  },
  composeFabText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  centerText: { color: C.textTertiary, fontSize: 14 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  emptyEmoji: { fontSize: 48, marginBottom: 4 },
  emptyTitle: { color: C.text, fontSize: 20, fontWeight: '700', textAlign: 'center' },
  emptyDesc: { color: C.textSecondary, fontSize: 15, textAlign: 'center', lineHeight: 22, maxWidth: 300 },

  // Thread modal
  modalRoot: { flex: 1, backgroundColor: C.bg },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  modalClose: { color: C.primaryLight, fontSize: 16, fontWeight: '600' },
  modalTitleWrap: { flex: 1, gap: 2 },
  modalTitle: { color: C.text, fontSize: 16, fontWeight: '700' },
  modalReadOnly: { color: C.textTertiary, fontSize: 11 },
  modalNewMsg: { color: C.primaryLight, fontSize: 26, fontWeight: '300', lineHeight: 30 },
  msgList: { padding: 16, gap: 12, paddingBottom: 24 },
  bubbleWrap: { gap: 3 },
  bubbleWrapIn: { alignItems: 'flex-start' },
  bubbleWrapOut: { alignItems: 'flex-end' },
  bubbleSender: { color: C.textTertiary, fontSize: 11, marginLeft: 4 },
  bubble: { maxWidth: '80%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 9 },
  bubbleIn: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  bubbleOut: { backgroundColor: C.primary },
  bubbleText: { color: C.text, fontSize: 15, lineHeight: 21 },
  bubbleTextOut: { color: '#fff' },
  bubbleTime: { color: C.textTertiary, fontSize: 11, marginLeft: 4 },
  bubbleTimeOut: { marginLeft: 0, marginRight: 4 },
  replyBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.bg,
  },
  replyInput: {
    flex: 1, backgroundColor: C.surface, borderRadius: 20,
    borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 16, paddingVertical: 10,
    color: C.text, fontSize: 15, maxHeight: 120,
  },
  sendBtn: {
    backgroundColor: C.primary, borderRadius: 20,
    paddingHorizontal: 18, paddingVertical: 10, minWidth: 64, alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Contact picker
  pickerRoot: { flex: 1, backgroundColor: C.bg },
  pickerHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  pickerCancel: { color: C.primaryLight, fontSize: 16, width: 60 },
  pickerTitle: { color: C.text, fontSize: 16, fontWeight: '700' },
  pickerSearch: { paddingHorizontal: 16, paddingVertical: 10 },
  pickerSearchInput: {
    backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 14, paddingVertical: 10, color: C.text, fontSize: 15,
  },
  pickerList: { paddingBottom: 40 },
  pickerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 13, backgroundColor: C.bg,
  },
  pickerAvatar: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: C.primaryBg,
    alignItems: 'center', justifyContent: 'center',
  },
  pickerAvatarText: { color: C.primaryLight, fontSize: 14, fontWeight: '700' },
  pickerInfo: { flex: 1 },
  pickerLabel: { color: C.text, fontSize: 15, fontWeight: '600' },
  pickerSublabel: { color: C.textSecondary, fontSize: 12, marginTop: 2 },
  pickerChevron: { color: C.textTertiary, fontSize: 20 },
  pickerSep: { height: StyleSheet.hairlineWidth, backgroundColor: C.border, marginLeft: 70 },
  pickerEmpty: { padding: 32, alignItems: 'center' },
  pickerEmptyText: { color: C.textTertiary, fontSize: 14 },

  // Compose modal
  composeRoot: { flex: 1, backgroundColor: C.bg },
  composeHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  composeCancel: { color: C.primaryLight, fontSize: 16, width: 60 },
  composeTitleWrap: { flex: 1, alignItems: 'center' },
  composeTitle: { color: C.text, fontSize: 15, fontWeight: '700' },
  composeSubtitle: { color: C.textSecondary, fontSize: 12, marginTop: 1 },
  composeSend: { color: C.primaryLight, fontSize: 16, fontWeight: '700', width: 60, textAlign: 'right' },
  composeSendDisabled: { opacity: 0.4 },
  composeBody: {
    flex: 1, color: C.text, fontSize: 16, padding: 16, lineHeight: 24,
    ...Platform.select({ web: { outlineStyle: 'none' } as object }),
  },
});
