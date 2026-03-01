/**
 * Achievements / Badges – werden bei bestimmten Aktionen freigeschaltet.
 */

import { getSessions } from './statistik'
import { getStreak } from './streak'

const STORAGE_KEY = 'latinum-achievements'

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string // Emoji
  unlockedAt: string | null // YYYY-MM-DD oder null
}

const ACHIEVEMENT_DEFS: Omit<Achievement, 'unlockedAt'>[] = [
  { id: 'first_lesson', title: 'Erste Lektion', description: 'Erste Lektion abgeschlossen', icon: '🎯' },
  { id: 'streak_7', title: '7-Tage-Streak', description: '7 Tage in Folge gelernt', icon: '🔥' },
  { id: 'perfect_100', title: 'Perfekt', description: 'Eine Lektion mit 100 % abgeschlossen', icon: '💯' },
  { id: 'lessons_10', title: 'Fleißig', description: '10 Lektionen insgesamt absolviert', icon: '⭐' },
  { id: 'streak_30', title: 'Unaufhaltsam', description: '30 Tage in Folge gelernt', icon: '🏆' },
]

function loadUnlocked(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed as Record<string, string>
  } catch {
    return {}
  }
}

function saveUnlocked(data: Record<string, string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // ignore
  }
}

/** Alle Achievements mit Freischalt-Status */
export function getAchievements(): Achievement[] {
  const unlocked = loadUnlocked()
  return ACHIEVEMENT_DEFS.map((a) => ({
    ...a,
    unlockedAt: unlocked[a.id] ?? null,
  }))
}

/** Anzahl freigeschalteter Achievements */
export function getUnlockedCount(): number {
  return Object.keys(loadUnlocked()).length
}

function unlock(id: string): boolean {
  const u = loadUnlocked()
  if (u[id]) return false
  const d = new Date()
  u[id] = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  saveUnlocked(u)
  return true
}

/**
 * Nach einer abgeschlossenen Lektion aufrufen – prüft und schaltet ggf. Achievements frei.
 * Gibt die neu freigeschalteten Achievement-IDs zurück.
 */
export function checkAchievementsAfterLesson(percent: number): string[] {
  const newlyUnlocked: string[] = []
  const sessions = getSessions()
  const streak = getStreak()
  const unlocked = loadUnlocked()

  if (!unlocked.first_lesson && sessions.length >= 1) {
    unlock('first_lesson')
    newlyUnlocked.push('first_lesson')
  }
  if (!unlocked.perfect_100 && percent >= 100) {
    unlock('perfect_100')
    newlyUnlocked.push('perfect_100')
  }
  if (!unlocked.lessons_10 && sessions.length >= 10) {
    unlock('lessons_10')
    newlyUnlocked.push('lessons_10')
  }
  if (!unlocked.streak_7 && streak >= 7) {
    unlock('streak_7')
    newlyUnlocked.push('streak_7')
  }
  if (!unlocked.streak_30 && streak >= 30) {
    unlock('streak_30')
    newlyUnlocked.push('streak_30')
  }

  return newlyUnlocked
}
