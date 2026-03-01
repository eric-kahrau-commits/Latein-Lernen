/**
 * Erinnerungen: Browser-Benachrichtigungen + in-app Hinweis.
 */

const PERMISSION_STORAGE_KEY = 'latinum-notifications-enabled'

export function isNotificationPermissionRequested(): boolean {
  try {
    return localStorage.getItem(PERMISSION_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function setNotificationPermissionRequested(): void {
  try {
    localStorage.setItem(PERMISSION_STORAGE_KEY, '1')
  } catch {
    // ignore
  }
}

/** Aktueller Status der Browser-Benachrichtigung */
export function getNotificationPermission(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied'
  return Notification.permission
}

/** Berechtigung anfragen (von UI aus aufrufen) */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  setNotificationPermissionRequested()
  const result = await Notification.requestPermission()
  return result === 'granted'
}

/** Eine lokale Benachrichtigung anzeigen (nur wenn Berechtigung erteilt) */
export function showReminderNotification(title: string, body: string): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'granted') return
  try {
    const n = new Notification(title, {
      body,
      icon: '/favicon.ico',
      tag: 'latinum-reminder',
    })
    n.onclick = () => {
      window.focus()
      n.close()
    }
    setTimeout(() => n.close(), 6000)
  } catch {
    // ignore
  }
}
