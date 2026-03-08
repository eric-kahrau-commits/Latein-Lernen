# Umsetzungsplan: Retention und Gewohnheit (Punkt 4 – Dranbleiben)

Vollständiger Plan für **tägliche Erinnerungen**, **Tagesziel sichtbar und belohnen** sowie **klare Achievement-Anzeige**.

---

## 1. Ausgangslage

| Modul | Datei | Stand |
|-------|--------|--------|
| **Streak** | `src/data/streak.ts` | ✅ Einmal pro Tag nach Lektion; Freeze; `updateStreak()` wird in LernenPage nach Abschluss aufgerufen. |
| **Tagesziel** | `src/data/tagesziel.ts` | ✅ `getDailyGoal() === 1`, `getTodaySessionCount()`, `isDailyGoalReached()`; nutzt `getSessionCountForDate(getToday())`. |
| **Statistik** | `src/data/statistik.ts` | ✅ `addSession()` und `addAttempt()` werden in LernenPage bei Abschluss aufgerufen; Sessions pro Tag für Tagesziel. |
| **Kronen** | `src/data/kronen.ts` | ✅ Werden nach Lektion vergeben; Shop verknüpft. |
| **Benachrichtigungen** | `src/data/notifications.ts` | ✅ Permission speichern/abfragen; `showReminderNotification(title, body)` – wird aber nirgends getriggert. |
| **Achievements** | `src/data/achievements.ts` | ✅ `checkAchievementsAfterLesson(percent)`; in LernenPage aufgerufen; neu freigeschaltete IDs werden in State gehalten und als Toast in der Auswertung angezeigt. |
| **Home** | `src/pages/HomePage.tsx` | ✅ Zeigt Tagesziel (todayCount/dailyGoal), „Tagesziel erreicht“ wenn `goalReached`; Streak; Achievements-Übersicht. |
| **LernenPage Auswertung** | `src/pages/LernenPage.tsx` | ✅ Streak-Popup mit „Tagesziel erreicht“-Badge bei `streakPopup.updated`; Achievement-Toast bei `newAchievementIds.length > 0`. |

**Lücken:**

1. **Erinnerung wird nie ausgelöst:** Die Permission wird nur gespeichert; es gibt keine Logik, die einmal am Tag prüft „noch keine Lektion heute“ und dann eine Browser-Benachrichtigung schickt (z. B. „Dein Streak wartet – mach heute noch eine Lektion“).
2. **Tagesziel-Bestätigung:** Nach Abschluss wird „Tagesziel erreicht“ nur als kleines Badge im Streak-Popup gezeigt; keine explizite, gut sichtbare Bestätigung (z. B. eigener Satz oder kurzer Hinweis). Auf Home ist das Tagesziel sichtbar, könnte bei Erreichen etwas stärker hervorgehoben werden.
3. **Achievements:** Werden bereits nach Lektion geprüft und als Toast gezeigt; sicherstellen, dass alle Abschluss-Pfade (inkl. Karteikarten, Wortpaare, etc.) dieselbe Statistik-/Achievement-Logik durchlaufen und der Toast zuverlässig erscheint.

---

## 2. Konkrete Umsetzung

### 2.1 Erinnerungen wirklich nutzen

**Ziel:** Einmal am Tag eine Erinnerung senden (Browser-Notification), wenn der Nutzer noch keine Lektion heute absolviert hat – um Streak und Gewohnheit zu stützen.

**Einschränkung (Web):** Echte Hintergrund-Planung (z. B. um 18:00 Uhr) ist im Browser ohne Service Worker / Push nicht zuverlässig möglich. Daher: **Trigger beim App-Besuch**. Wenn der Nutzer die App öffnet (oder Tab wieder sichtbar wird), prüfen wir: Berechtigung erteilt? Heute noch keine Lektion? Heute noch keine Erinnerung gezeigt? Optional: erst ab einer Uhrzeit (z. B. 14:00), damit morgens nicht sofort eine Erinnerung kommt.

**Schritte:**

| Schritt | Was | Wo / wie |
|--------|-----|----------|
| **A** | **Speicher für „heute schon erinnert“** | In `src/data/notifications.ts`: Konstante für localStorage-Key (z. B. `REMINDER_LAST_SHOWN_KEY`), Wert = Datum (YYYY-MM-DD). Funktion `getLastReminderDate(): string \| null` und `setLastReminderDate(date: string)`. |
| **B** | **Prüflogik „soll Erinnerung gezeigt werden?“** | In `notifications.ts`: Neue Funktion `trySendDailyReminder(): boolean`. Ablauf: (1) `getNotificationPermission() !== 'granted'` → return false. (2) `isDailyGoalReached()` (aus tagesziel) → return false. (3) Heute = YYYY-MM-DD; wenn `getLastReminderDate() === heute` → return false (nur 1× pro Tag). (4) Optional: Stunde prüfen – z. B. nur wenn `new Date().getHours() >= REMINDER_MIN_HOUR` (z. B. 14). (5) `showReminderNotification('Latinum', 'Dein Streak wartet – mach heute noch eine Lektion')` aufrufen; `setLastReminderDate(heute)`; return true. |
| **C** | **Trigger im App-Lebenszyklus** | Beim Start der App einmal prüfen: z. B. in `src/App.tsx` ein `useEffect` (oder in einer kleinen Komponente, die in Layout/App eingebunden wird), der bei Mount `trySendDailyReminder()` aufruft. Optional: bei `document.visibilitychange` (Tab wieder sichtbar) erneut prüfen, damit ein späterer Besuch am gleichen Tag die Erinnerung auslösen kann (aber nur 1× pro Tag wegen B). |
| **D** | **Abhängigkeit tagesziel** | `notifications.ts` importiert `isDailyGoalReached` aus `./tagesziel` (oder von einem zentralen Modul), um „heute noch keine Lektion“ zu erkennen. |

**Ergebnis:** Nutzer mit erteilter Benachrichtigungs-Permission bekommen maximal einmal pro Tag beim Öffnen (oder beim Wechsel zurück in den Tab) eine Erinnerung, wenn das Tagesziel noch nicht erreicht ist. Die Erinnerung erscheint nur ab 14:00 Uhr (konfigurierbar via `REMINDER_MIN_HOUR` in `notifications.ts`).

---

### 2.2 Tagesziel sichtbar und belohnen

**Ziel:** Tagesziel auf Home klar sichtbar lassen und nach Abschluss einer Lektion eine deutliche Bestätigung zeigen („Tagesziel erreicht!“), verknüpft mit Streak/Kronen.

| Schritt | Was | Wo / wie |
|--------|-----|----------|
| **A** | **Home: Tagesziel-Karte** | Bereits vorhanden: `home-stats-card--tagesziel`, bei `goalReached` Klasse `home-stats-card--done`. Optional: bei `goalReached` einen kurzen Text oder Icon hinzufügen (z. B. „Tagesziel erreicht“ ist schon das Label). Kann um eine dezente „Belohnung“-Formulierung ergänzt werden (z. B. Untertitel „Streak gesichert“ wenn goalReached). |
| **B** | **Nach Abschluss: „Tagesziel erreicht!“ verstärken** | In `src/pages/LernenPage.tsx`: In der Auswertung wird bereits bei `streakPopup.updated` das Badge „Tagesziel erreicht“ angezeigt. Zusätzlich: Wenn in dieser Session das Tagesziel gerade erreicht wurde (d. h. vor dem Aufruf von `updateStreak` war `getTodaySessionCount() < getDailyGoal()`, danach nicht mehr – oder einfacher: wenn `streakPopup.updated === true`, dann war es die erste Lektion heute), eine klarere Überschrift oder einen eigenen Block anzeigen: z. B. „Tagesziel erreicht!“ als kleines Highlight oberhalb oder neben dem Streak-Popup. Optional: kurzer Satz „Du hast dein Tagesziel erreicht und deinen Streak gesichert.“ |
| **C** | **Verknüpfung Streak/Kronen** | Bereits gegeben: Streak-Popup und Kronen-Belohnung erscheinen in derselben Auswertung. Keine zusätzliche technische Verknüpfung nötig; Text/Badge „Tagesziel erreicht“ bleibt beim Streak-Bereich, damit die Verbindung klar ist. |

---

### 2.3 Wenige, klare Achievements

**Ziel:** Bestehende Achievements beibehalten; nach jeder relevanten Aktion (Lektion abgeschlossen) prüfen und neu freigeschaltete **einmalig** anzeigen (Toast oder kleines Modal).

| Schritt | Was | Wo / wie |
|--------|-----|----------|
| **A** | **Prüfung konsistent** | In LernenPage wird bei Abschluss (in dem einen `useEffect`, der `addSession`/`addAttempt`/`checkAchievementsAfterLesson`/`updateStreak` aufruft) bereits `checkAchievementsAfterLesson(effectivePercent)` aufgerufen und `setNewAchievementIds(newlyUnlocked)` gesetzt. Sicherstellen, dass **alle** Abschluss-Arten (Karteikarten, Vokabel-Quiz, Sachkunde, Wortpaare, Glücksrad, Rennen, Test, etc.) über dieselbe Bedingung in diesen useEffect laufen (`showAnyAuswertung` und die gleiche Statistik-Aufzeichnung). Bereits der Fall – keine Änderung nötig, nur Bestätigung. |
| **B** | **Anzeige einmalig und sichtbar** | Der Achievement-Toast (`.lernen-auswertung-achievement-toast`) wird nur gerendert, wenn `newAchievementIds.length > 0`; die IDs werden nach dem Anzeigen nicht erneut gesetzt. Beim Wechsel weg von der Auswertung wird `setNewAchievementIds([])` im useEffect auf `showAnyAuswertung` auf false aufgerufen. Damit ist die Anzeige einmalig pro Session. Optional: Toast mit `ref` scrollen (`scrollIntoView`) oder Reihenfolge im DOM so wählen, dass er gut sichtbar ist (bereits im Auswertungs-Bereich). Optional: kurze Überschrift „Neue Erfolge“ über der Toast-Liste für Klarheit. |
| **C** | **Keine neuen Achievement-Definitionen** | Bestehende Liste (Erste Lektion, 7-Tage-Streak, Perfekt, Fleißig, 30-Tage-Streak) beibehalten; nur Logik und UI wie oben absichern. |

---

## 3. Reihenfolge und Dateien

| Phase | Inhalt | Dateien |
|-------|--------|---------|
| 1 | Erinnerung: Last-Date + trySendDailyReminder + Trigger | `src/data/notifications.ts`, `src/App.tsx` (oder `src/components/DailyReminderTrigger.tsx`) |
| 2 | Tagesziel: Verstärkte Bestätigung nach Abschluss | `src/pages/LernenPage.tsx`, ggf. `LernenPage.css` |
| 3 | Home: Optional Untertitel bei Tagesziel erreicht | `src/pages/HomePage.tsx`, ggf. `HomePage.css` |
| 4 | Achievements: Optional Überschrift/Scroll; Code-Review | `src/pages/LernenPage.tsx` |

---

## 4. Kurz-Zusammenfassung

| Thema | Umsetzung |
|-------|-----------|
| **Tägliche Erinnerung** | In `notifications.ts`: `trySendDailyReminder()` – Permission prüfen, Tagesziel noch nicht erreicht, heute noch nicht erinnert, optional ab 14 Uhr; dann eine Browser-Notification („Dein Streak wartet – mach heute noch eine Lektion“) und Datum speichern. In App (oder Layout) bei Mount (und optional bei visibilitychange) `trySendDailyReminder()` aufrufen. |
| **Tagesziel sichtbar** | Home: Tagesziel-Karte unverändert oder mit kleinem Zusatz (z. B. „Streak gesichert“). Nach Lektion: „Tagesziel erreicht!“ in der Auswertung deutlicher machen (eigener Satz oder kleines Highlight neben Streak-Popup). |
| **Achievements** | Prüfung läuft bereits nach jeder Lektion; Toast in Auswertung beibehalten; optional „Neue Erfolge“-Überschrift oder Scroll; keine neuen Achievements. |

Damit ist Punkt 4 (Retention und Gewohnheit) vollständig geplant und umsetzbar.
