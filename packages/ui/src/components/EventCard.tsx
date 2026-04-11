import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, radii, spacing, typography } from '@gamehub/config';
import type { Event } from '@gamehub/domain';
import { RSVPStatus, SyncStatus, EventType, Sport } from '@gamehub/domain';
import { Badge } from './Badge';
import { ProviderBadge } from './ProviderBadge';
import { RSVPButton } from './RSVPButton';
import { SyncStatusIndicator } from './SyncStatusIndicator';
import type { ProviderId } from '@gamehub/config';

export interface EventCardProps {
  event: Event;
  onPress: () => void;
  onRSVPPress?: (status: RSVPStatus) => void;
  compact?: boolean;
}

const SPORT_ICONS: Record<string, string> = {
  [Sport.SOCCER]: '⚽',
  [Sport.BASKETBALL]: '🏀',
  [Sport.BASEBALL]: '⚾',
  [Sport.SOFTBALL]: '🥎',
  [Sport.LACROSSE]: '🥍',
  [Sport.HOCKEY]: '🏒',
  [Sport.FOOTBALL]: '🏈',
  [Sport.VOLLEYBALL]: '🏐',
  [Sport.TENNIS]: '🎾',
  [Sport.SWIMMING]: '🏊',
  [Sport.OTHER]: '🏅',
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  [EventType.GAME]: 'Game',
  [EventType.PRACTICE]: 'Practice',
  [EventType.TOURNAMENT]: 'Tournament',
  [EventType.TOURNAMENT_GAME]: 'Tournament Game',
  [EventType.MEETING]: 'Meeting',
  [EventType.VOLUNTEER]: 'Volunteer',
  [EventType.OTHER]: 'Event',
};

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function buildAccessibilityLabel(event: Event): string {
  const parts: string[] = [];
  parts.push(event.title);
  if (event.type) parts.push(EVENT_TYPE_LABELS[event.type] ?? event.type);
  if (event.childName) parts.push(`for ${event.childName}`);
  if (event.teamName) parts.push(`team ${event.teamName}`);
  parts.push(formatDate(event.startAt));
  parts.push(`at ${formatTime(event.startAt)}`);
  if (event.location?.city) parts.push(`in ${event.location.city}`);
  if (event.opponent) parts.push(`vs ${event.opponent}`);
  if (event.tournamentName) parts.push(`tournament: ${event.tournamentName}`);
  if (event.isCanceled) parts.push('CANCELED');
  if (event.isRescheduled) parts.push('RESCHEDULED');
  if (event.rsvpStatus) parts.push(`RSVP: ${event.rsvpStatus}`);
  return parts.join(', ');
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onPress,
  onRSVPPress,
  compact = false,
}) => {
  const sportIcon = event.sport != null ? (SPORT_ICONS[event.sport] ?? '🏅') : '🏅';
  const typeLabel = EVENT_TYPE_LABELS[event.type] ?? 'Event';
  const a11yLabel = buildAccessibilityLabel(event);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      accessibilityHint="Tap to view event details"
      style={[
        styles.card,
        event.isCanceled && styles.canceled,
      ]}
    >
      {/* Canceled / Rescheduled overlay banner */}
      {event.isCanceled && (
        <View style={styles.canceledBanner}>
          <Text style={styles.canceledBannerText}>CANCELED</Text>
        </View>
      )}
      {!event.isCanceled && event.isRescheduled && (
        <View style={styles.rescheduledBanner}>
          <Text style={styles.rescheduledBannerText}>RESCHEDULED</Text>
        </View>
      )}

      {/* Header row: sport icon + title + sync status */}
      <View style={styles.headerRow}>
        <Text style={styles.sportIcon} accessibilityLabel={event.sport ?? 'sport'}>
          {sportIcon}
        </Text>
        <View style={styles.titleBlock}>
          <Text style={[styles.title, event.isCanceled && styles.titleCanceled]} numberOfLines={2}>
            {event.title}
          </Text>
          <Text style={styles.typeLabel}>{typeLabel}</Text>
        </View>
        <SyncStatusIndicator status={event.syncStatus} />
      </View>

      {/* Child + team row */}
      {!compact && (event.childName != null || event.teamName) && (
        <View style={styles.metaRow}>
          {event.childName != null && (
            <Text style={styles.metaText} numberOfLines={1}>
              👤 {event.childName}
            </Text>
          )}
          <Text style={styles.metaText} numberOfLines={1}>
            🏷 {event.teamName}
          </Text>
        </View>
      )}

      {/* Date + time row */}
      <View style={styles.metaRow}>
        <Text style={styles.dateText}>
          {formatDate(event.startAt)} · {formatTime(event.startAt)}
        </Text>
      </View>

      {/* Location */}
      {event.location != null && (
        <View style={styles.metaRow}>
          <Text style={styles.metaText} numberOfLines={1}>
            📍 {event.location.name}, {event.location.city}
          </Text>
        </View>
      )}

      {/* Opponent */}
      {event.opponent != null && !compact && (
        <View style={styles.metaRow}>
          <Text style={styles.metaText} numberOfLines={1}>
            vs {event.opponent}
          </Text>
        </View>
      )}

      {/* Tournament name */}
      {event.tournamentName != null && !compact && (
        <View style={styles.metaRow}>
          <Text style={styles.metaText} numberOfLines={1}>
            🏆 {event.tournamentName}
          </Text>
        </View>
      )}

      {/* Footer row: badges + RSVP */}
      <View style={styles.footerRow}>
        <View style={styles.badgeRow}>
          {/* RSVP status badge */}
          {event.rsvpStatus != null && (
            <Badge
              label={rsvpLabel(event.rsvpStatus)}
              variant={rsvpBadgeVariant(event.rsvpStatus)}
              size="sm"
            />
          )}
          {/* Provider badge */}
          {event.providerId != null && (
            <ProviderBadge
              providerId={event.providerId as ProviderId}
              size="sm"
              showLabel={!compact}
            />
          )}
        </View>

        {/* RSVP button */}
        {onRSVPPress != null && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation?.();
              const next = nextRSVPStatus(event.rsvpStatus ?? RSVPStatus.PENDING);
              onRSVPPress(next);
            }}
            accessibilityRole="button"
            accessibilityLabel={`RSVP: ${event.rsvpStatus ?? RSVPStatus.PENDING}`}
            accessibilityHint="Tap to change RSVP status"
            style={styles.rsvpSection}
          >
            <RSVPButton
              status={event.rsvpStatus ?? RSVPStatus.PENDING}
              onPress={() => {
                const next = nextRSVPStatus(event.rsvpStatus ?? RSVPStatus.PENDING);
                onRSVPPress(next);
              }}
              size="sm"
            />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

function rsvpLabel(status: RSVPStatus): string {
  switch (status) {
    case RSVPStatus.ATTENDING: return 'Attending';
    case RSVPStatus.NOT_ATTENDING: return 'Not Going';
    case RSVPStatus.MAYBE: return 'Maybe';
    case RSVPStatus.PENDING: return 'RSVP';
  }
}

function rsvpBadgeVariant(status: RSVPStatus): 'success' | 'error' | 'warning' | 'default' {
  switch (status) {
    case RSVPStatus.ATTENDING: return 'success';
    case RSVPStatus.NOT_ATTENDING: return 'error';
    case RSVPStatus.MAYBE: return 'warning';
    case RSVPStatus.PENDING: return 'default';
  }
}

function nextRSVPStatus(current: RSVPStatus): RSVPStatus {
  switch (current) {
    case RSVPStatus.PENDING: return RSVPStatus.ATTENDING;
    case RSVPStatus.ATTENDING: return RSVPStatus.NOT_ATTENDING;
    case RSVPStatus.NOT_ATTENDING: return RSVPStatus.MAYBE;
    case RSVPStatus.MAYBE: return RSVPStatus.ATTENDING;
  }
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.dark.surface,
    borderRadius: radii.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.dark.border,
    overflow: 'hidden',
    marginBottom: spacing[3],
  },
  canceled: {
    opacity: 0.6,
  },
  canceledBanner: {
    backgroundColor: colors.error[800],
    borderRadius: radii.sm,
    paddingVertical: spacing[0.5],
    paddingHorizontal: spacing[2],
    alignSelf: 'flex-start',
    marginBottom: spacing[2],
  },
  canceledBannerText: {
    color: colors.error[200],
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold as '700',
    letterSpacing: typography.letterSpacing.widest,
  },
  rescheduledBanner: {
    backgroundColor: colors.warning[900],
    borderRadius: radii.sm,
    paddingVertical: spacing[0.5],
    paddingHorizontal: spacing[2],
    alignSelf: 'flex-start',
    marginBottom: spacing[2],
  },
  rescheduledBannerText: {
    color: colors.warning[300],
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold as '700',
    letterSpacing: typography.letterSpacing.widest,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing[2],
    gap: spacing[2],
  },
  sportIcon: {
    fontSize: 22,
    lineHeight: 28,
    marginTop: 2,
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    color: colors.dark.text,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as '600',
    lineHeight: 20,
  },
  titleCanceled: {
    textDecorationLine: 'line-through',
    color: colors.dark.textSecondary,
  },
  typeLabel: {
    color: colors.dark.textTertiary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium as '500',
    marginTop: 2,
    letterSpacing: typography.letterSpacing.wide,
    textTransform: 'uppercase',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[1],
    gap: spacing[3],
    flexWrap: 'wrap',
  },
  metaText: {
    color: colors.dark.textSecondary,
    fontSize: typography.fontSize.sm,
  },
  dateText: {
    color: colors.primary[400],
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium as '500',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing[2],
    gap: spacing[2],
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
    flexWrap: 'wrap',
    flex: 1,
  },
  rsvpSection: {
    alignItems: 'flex-end',
  },
});

export default EventCard;
