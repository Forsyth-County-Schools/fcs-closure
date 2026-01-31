// Chrome Notification Service for desktop alerts

// Store the last known notification to avoid duplicates
let lastKnownNotification: string | null = null;

// Check if notifications are supported (server-side check)
export function areNotificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

// Server-side check for notifications support
export function isServerSide(): boolean {
  return typeof window === 'undefined';
}

// Request notification permission
export async function requestNotificationPermission(): Promise<boolean> {
  if (!areNotificationsSupported()) {
    console.log('Notifications not supported in this browser');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
}

// Check current permission status
export function getNotificationPermission(): NotificationPermission {
  if (!areNotificationsSupported()) {
    return 'denied';
  }
  return Notification.permission;
}

// Create and show a desktop notification
export async function createNotification(
  title: string, 
  message: string, 
  options?: {
    icon?: string;
    badge?: string;
    tag?: string;
    requireInteraction?: boolean;
    silent?: boolean;
  }
): Promise<boolean> {
  try {
    // Only send if the message is different from the last one
    if (message === lastKnownNotification) {
      console.log('Notification message unchanged, skipping notification');
      return false;
    }

    // Skip the default "no changes" message
    if (message === 'No changes detected for Monday, February 2nd') {
      console.log('Default message, skipping notification');
      return false;
    }

    // Check if notifications are permitted
    if (getNotificationPermission() !== 'granted') {
      console.log('Notification permission not granted');
      return false;
    }

    const notificationOptions: NotificationOptions = {
      body: message,
      icon: options?.icon || '/favicon.ico',
      badge: options?.badge || '/favicon.ico',
      tag: options?.tag || 'fcs-status',
      requireInteraction: options?.requireInteraction || false,
      silent: options?.silent || false,
    };

    const notification = new Notification(title, notificationOptions);

    // Auto-close after 10 seconds unless requireInteraction is true
    if (!options?.requireInteraction) {
      setTimeout(() => {
        notification.close();
      }, 10000);
    }

    lastKnownNotification = message;
    
    console.log('✅ Desktop notification created successfully');
    console.log(`Title: ${title}`);
    console.log(`Message: ${message}`);
    
    return true;
  } catch (error) {
    console.error('Error creating desktop notification:', error);
    return false;
  }
}

// Send FCS status notification
export async function sendFCSNotification(
  statusMessage: string, 
  weatherData?: any
): Promise<boolean> {
  const title = '🚨 FCS Status Alert';
  let message = statusMessage;

  // Add weather info to notification if available
  if (weatherData) {
    message += `\n\n🌤️ Weather: ${weatherData.temp_f}°F, ${weatherData.condition?.text || 'Unknown'}`;
  }

  return await createNotification(title, message, {
    tag: 'fcs-status-alert',
    requireInteraction: true, // Keep visible until user interacts
    silent: false,
  });
}

// Test notification
export async function testNotification(): Promise<boolean> {
  return await createNotification(
    '🧪 FCS Status Test',
    'Desktop notifications are working! 🎉\n\nThis is a test of the FCS monitoring system.',
    {
      tag: 'fcs-test',
      requireInteraction: false,
      silent: false,
    }
  );
}

// Clear all notifications
export function clearAllNotifications(): void {
  if (areNotificationsSupported()) {
    // Close all notifications with our tag
    // Note: There's no direct way to close all notifications, but they auto-close
    console.log('Notifications will auto-close based on their timeout');
  }
}

// Reset last known notification
export function resetLastKnownNotification(): void {
  lastKnownNotification = null;
}
