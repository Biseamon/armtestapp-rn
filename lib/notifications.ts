import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
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
  scheduledDate: string,
  scheduledTime: string,
  minutesBefore: number
) {
  if (Platform.OS === 'web') {
    console.log('Notifications not supported on web');
    return null;
  }

  try {
    const [hours, minutes] = scheduledTime.split(':').map(Number);
    const trainingDateTime = new Date(scheduledDate);
    trainingDateTime.setHours(hours, minutes, 0, 0);

    const notificationTime = new Date(trainingDateTime.getTime() - minutesBefore * 60 * 1000);

    if (notificationTime <= new Date()) {
      console.log('Notification time is in the past');
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Training Reminder',
        body: `${title} starts in ${minutesBefore} minutes!`,
        data: { trainingId },
      },
      trigger: {
        date: notificationTime,
      },
    });

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
