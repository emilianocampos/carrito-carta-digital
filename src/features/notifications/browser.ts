/**
 * Gestor de Notificaciones del Navegador (Web Notifications API & Service Worker)
 */

export function isBrowserNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getBrowserNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isBrowserNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestBrowserNotificationPermission(): Promise<NotificationPermission> {
  if (!isBrowserNotificationSupported()) return 'denied';
  try {
    return await Notification.requestPermission();
  } catch (err) {
    console.error('Error solicitando permisos de notificación:', err);
    return 'denied';
  }
}

export interface DesktopNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
}

export async function sendDesktopNotification({
  title,
  body,
  icon = '/favicon.ico',
  badge = '/favicon.ico',
  url,
  tag,
}: DesktopNotificationOptions): Promise<void> {
  if (!isBrowserNotificationSupported() || Notification.permission !== 'granted') {
    return;
  }

  try {
    // 1. Intentar mostrar a través del Service Worker si está registrado
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.showNotification) {
          await registration.showNotification(title, {
            body,
            icon,
            badge,
            tag: tag || title,
            data: { url: url || window.location.href },
          });
          return;
        }
      } catch {
        // Fallback a Notification clásica si el SW no está listo
      }
    }

    // 2. Fallback estándar a Notification nativa
    const notification = new Notification(title, {
      body,
      icon,
      badge,
      tag: tag || title,
    });

    if (url) {
      notification.onclick = () => {
        window.focus();
        window.location.href = url;
        notification.close();
      };
    }
  } catch (err) {
    console.warn('Error al disparar notificación nativa:', err);
  }
}
