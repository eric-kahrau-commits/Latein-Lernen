/**
 * Fächer (feste Ordner) – für Sortierung auf der Lernseite.
 * Die Fächer sind vordefiniert; Lernsets werden einem Fach zugeordnet.
 */

export interface Fach {
  id: string
  name: string
  /** Emoji oder Icon-Bezeichnung für die Anzeige */
  icon: string
  /** Hex-Farbe (z. B. #3b82f6) */
  color: string
  /** Reihenfolge (0, 1, 2, …) */
  order: number
}

/** Feste, vordefinierte Fächer – nicht änderbar durch Nutzer. */
const FAECHER: Fach[] = [
  { id: 'mathe', name: 'Mathe', icon: '📐', color: '#3b82f6', order: 0 },
  { id: 'chemie', name: 'Chemie', icon: '🧪', color: '#22c55e', order: 1 },
  { id: 'latein', name: 'Latein', icon: '📜', color: '#f59e0b', order: 2 },
  { id: 'spanisch', name: 'Spanisch', icon: '🇪🇸', color: '#ef4444', order: 3 },
  { id: 'franzoesisch', name: 'Französisch', icon: '🇫🇷', color: '#2563eb', order: 4 },
  { id: 'englisch', name: 'Englisch', icon: '🇬🇧', color: '#dc2626', order: 5 },
  { id: 'bio', name: 'Bio', icon: '🧬', color: '#16a34a', order: 6 },
  { id: 'physik', name: 'Physik', icon: '⚛️', color: '#7c3aed', order: 7 },
]

export function getFaecher(): Fach[] {
  return [...FAECHER].sort((a, b) => a.order - b.order)
}

export function getFachById(id: string): Fach | undefined {
  return FAECHER.find((f) => f.id === id)
}

/** Legacy: Für Kompatibilität mit Stellen, die FAECHER_ICONS nutzen (z. B. LernenPage). Liefert ein Objekt mit id und emoji. */
export const FAECHER_ICONS = FAECHER.map((f) => ({ id: f.id, label: f.name, emoji: f.icon }))
