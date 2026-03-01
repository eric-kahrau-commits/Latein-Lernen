/**
 * Onboarding – einmalige Einführung beim ersten Besuch.
 */

const STORAGE_KEY = 'latinum-onboarding-done'

export function isOnboardingDone(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function setOnboardingDone(): void {
  try {
    localStorage.setItem(STORAGE_KEY, '1')
  } catch {
    // ignore
  }
}
