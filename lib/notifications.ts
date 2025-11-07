import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions() {
  if (Platform.OS === 'web') {
    return { granted: false };
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return { granted: finalStatus === 'granted' };
}

export async function scheduleTrainingNotification(
  trainingId: string,
  title: string,
  date: string, // Format: YYYY-MM-DD
  time: string, // Format: HH:MM
  minutesBefore: number = 30
): Promise<string | null> {
  try {
    // Parse the date and time strings
    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);

    // Create the scheduled datetime
    const scheduledDate = new Date(year, month - 1, day, hours, minutes, 0, 0);

    // Calculate notification time (subtract minutesBefore)
    const notificationDate = new Date(scheduledDate.getTime() - minutesBefore * 60 * 1000);

    // Calculate seconds until notification should trigger
    const now = new Date();
    const secondsUntilNotification = Math.floor((notificationDate.getTime() - now.getTime()) / 1000);

    // Don't schedule if the time has already passed
    if (secondsUntilNotification <= 0) {
      console.log('Notification time has already passed');
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '💪 Training Reminder',
        body: `${title} starts in ${minutesBefore} minute${
          minutesBefore !== 1 ? 's' : ''
        }`,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { trainingId },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: secondsUntilNotification,
      },
    });

    console.log(
      `Notification scheduled for ${notificationDate.toLocaleString()} (in ${secondsUntilNotification} seconds)`
    );
    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
}

export async function cancelNotification(notificationId: string) {
  if (Platform.OS === 'web') {
    return;
  }

  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error('Error canceling notification:', error);
  }
}

export async function cancelAllTrainingNotifications() {
  if (Platform.OS === 'web') {
    return;
  }

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error canceling all notifications:', error);
  }
}
