/**
 * Erinnerungen: Browser-Benachrichtigungen + in-app Hinweis.
 * Tägliche Erinnerung: einmal am Tag (beim App-Besuch), wenn Tagesziel noch nicht erreicht.
 */

import { isDailyGoalReached } from './tagesziel'

const PERMISSION_STORAGE_KEY = 'latinum-notifications-enabled'
const REMINDER_LAST_SHOWN_KEY = 'latinum-reminder-last-shown-date'

/** Ab dieser Stunde (0–23) Erinnerung erlauben, damit morgens nicht sofort eine Meldung kommt. */
const REMINDER_MIN_HOUR = 14

function getToday(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function getLastReminderDate(): string | null {
  try {
    const raw = localStorage.getItem(REMINDER_LAST_SHOWN_KEY)
    return raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null
  } catch {
    return null
  }
}

function setLastReminderDate(date: string): void {
  try {
    localStorage.setItem(REMINDER_LAST_SHOWN_KEY, date)
  } catch {
    // ignore
  }
}

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

/**
 * Tägliche Erinnerung: einmal pro Tag, wenn Berechtigung da, Tagesziel noch nicht erreicht
 * und heute noch nicht erinnert. Optional: erst ab REMINDER_MIN_HOUR Uhr.
 * Wird z. B. beim App-Start oder bei Tab-Fokus aufgerufen.
 * Gibt true zurück, wenn eine Benachrichtigung gezeigt wurde.
 */
export function trySendDailyReminder(): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) return false
  if (Notification.permission !== 'granted') return false
  if (isDailyGoalReached()) return false

  const today = getToday()
  if (getLastReminderDate() === today) return false

  const hour = new Date().getHours()
  if (hour < REMINDER_MIN_HOUR) return false

  showReminderNotification(
    'Latinum',
    'Dein Streak wartet – mach heute noch eine Lektion.',
  )
  setLastReminderDate(today)
  return true
}
