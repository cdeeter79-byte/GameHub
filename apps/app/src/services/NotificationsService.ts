import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Event } from '@gamehub/domain';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false; // Web push requires service worker setup
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleEventReminder(event: Event, advanceMinutes = 120): Promise<void> {
  const triggerAt = new Date(event.startAt.getTime() - advanceMinutes * 60 * 1000);
  if (triggerAt <= new Date()) return; // Don't schedule past reminders

  await Notifications.scheduleNotificationAsync({
    content: {
      title: event.type === 'GAME' ? '🏆 Game Today!' : '⚽ Practice Reminder',
      body: `${event.title} starts in ${advanceMinutes >= 60 ? `${advanceMinutes / 60}h` : `${advanceMinutes}m`} at ${event.location?.name ?? 'TBD'}`,
      data: { eventId: event.id, type: 'EVENT_REMINDER' },
      sound: true,
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerAt },
    identifier: `event-reminder-${event.id}`,
  });
}

export async function cancelEventReminder(eventId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(`event-reminder-${eventId}`);
}

export async function getExpoPushToken(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  const { data } = await Notifications.getExpoPushTokenAsync();
  return data;
}
