# Umsetzungsplan: Offline-Hinweis (Punkt 3 – Zuverlässigkeit)

Vollständiger Plan für **proaktive Offline-Erkennung**, **einheitliche Hinweise** und **gute UX**, wenn keine Internetverbindung für KI-Funktionen verfügbar ist.

---

## 1. Ziel und Nutzen

- **Erwartung steuern:** Nutzer sehen sofort, dass KI-Funktionen Internet brauchen – bevor sie auf „Senden“ oder „Lernset erstellen“ klicken.
- **Frust vermeiden:** Kein langes Warten (Timeout), keine unklare Fehlermeldung; stattdessen klare, freundliche Hinweise.
- **Konsistenz:** Dieselbe Botschaft überall („Für KI-Funktionen wird eine Internetverbindung benötigt. Andere Lerninhalte funktionieren offline.“) und optional ein wiedererkennbares Icon (z. B. „Keine Verbindung“).

---

## 2. Aktueller Stand

| Was | Wo | Status |
|-----|-----|--------|
| **isOnline()** | `src/data/aiClient.ts` | ✅ Exportiert, nutzt `navigator.onLine` (mit Check `typeof navigator !== 'undefined'`). |
| **OFFLINE_MESSAGE** | `src/data/aiClient.ts` | ✅ Exportiert, Text wie im Plan. |
| **Check vor Request** | `openAIFetch()` in aiClient | ✅ Wirft zu Beginn `throw new Error(OFFLINE_MESSAGE)`, wenn `!isOnline()`. |
| **Fehleranzeige** | KIPage, KICenterPage | ✅ Im catch wird `e.message` in `.ki-error` angezeigt – Offline-Fehler erscheinen also bereits. |
| **Retry-Button** | KIPage, KICenterPage | ✅ Bei Fehler wird „Erneut versuchen“ angeboten (sinnvoll, wenn Nutzer wieder online ist). |

**Lücken:**

1. **Proaktiver Hinweis:** Wenn die Seite geladen wird und der Nutzer **bereits offline** ist, erscheint erst beim Klick auf Senden/Create die Fehlermeldung. Besser: direkt sichtbarer Hinweis (z. B. Infobox), dass KI gerade nicht verfügbar ist.
2. **Reaktion auf Wechsel:** Geht der Nutzer **während der Nutzung** offline (oder wieder online), aktualisiert sich die UI nicht automatisch – erst nach erneutem Klick oder Reload. Besser: `window`-Events `online` / `offline` nutzen und State/UI aktualisieren.
3. **Wiedererkennung:** Die Offline-Meldung sieht wie jede andere Fehlermeldung aus. Optional: kleines Icon (z. B. WLAN durchgestrichen) oder Zusatz „Keine Verbindung“, damit Nutzer die Ursache sofort erkennen.
4. **App-weiter Hinweis:** Auf Nicht-KI-Seiten (z. B. Lernen, Home) weiß der Nutzer nicht, dass er offline ist. Optional: schmales **globales Offline-Banner** (z. B. im Layout), das nur erscheint, wenn `!isOnline()` – „Offline. Einige Funktionen (z. B. KI) benötigen eine Internetverbindung.“

---

## 3. Alle KI-Einstiegspunkte

| Seite / Komponente | KI-Funktion | Wann ausgelöst |
|--------------------|-------------|-----------------|
| **KIPage (KIAssistantPage)** | `chatLernsetAssistant` | Nachricht senden (Enter / Button). |
| **KIPage (KIAssistantPage)** | `generateKarteikartenSetWithAI` | „Lernset erstellen“ klicken. |
| **KICenterPage** | `chatLernSupport` | Im Bereich „Lernunterstützer“: Senden klicken. |

Weitere KI-Funktionen in `aiClient` (`generateDeklinationWithAI`, `generateVokabelSetWithAI`) werden derzeit von keiner Seite aufgerufen; sobald sie genutzt werden, laufen sie über `openAIFetch` und erhalten denselben Offline-Check.

---

## 4. Konkrete Umsetzung

### 4.1 Hilfsfunktion und Konstante (bereits erledigt)

- **Datei:** `src/data/aiClient.ts`
- **Inhalt:** `isOnline()` und `OFFLINE_MESSAGE` sind exportiert; `openAIFetch` prüft am Anfang `isOnline()` und wirft bei Offline sofort `OFFLINE_MESSAGE`.
- **Optional:** In einem zentralen Modul (z. B. `src/utils/network.ts`) nur `isOnline` und `OFFLINE_MESSAGE` re-exportieren, falls andere Teile der App (ohne aiClient-Import) den Offline-Status nutzen sollen. Für die geplante Umsetzung reicht der Export aus `aiClient`.

### 4.2 Proaktiver Offline-Hinweis auf KI-Seiten

- **KIPage (KIAssistantPage)** – `src/pages/KIPage.tsx`
  - State für Online-Status: z. B. `const [online, setOnline] = useState(() => isOnline())`.
  - `useEffect`: Listener für `window.addEventListener('online', …)` und `window.addEventListener('offline', …)` registrieren; in den Callbacks `setOnline(isOnline())` oder direkt `setOnline(true)` / `setOnline(false)`. Cleanup: Listener in `return` entfernen.
  - **Wenn `!online`:** Oberhalb des Chats / der Checkliste eine **Infobox** anzeigen (nicht als Fehler, sondern als Info):
    - Text: `OFFLINE_MESSAGE` (von aiClient importieren).
    - Optional: kleines Icon (z. B. WLAN aus / Offline) links neben dem Text.
    - Klasse z. B. `ki-offline-hinweis` (dezent, z. B. hellblau/grau Hintergrund, Icon).
  - **Optional:** Wenn `!online`: Eingabefeld und „Lernset erstellen“ visuell deaktivieren (disabled) und mit kurzem Hinweis „Verfügbar sobald du online bist“ – oder nur die Infobox; beim Klick kommt weiterhin die gleiche Fehlermeldung aus dem catch. Plan: erst nur Infobox; Buttons wie bisher (beim Klick Fehler + Retry).

- **KICenterPage** – `src/pages/KICenterPage.tsx`
  - Gleiches Muster: State `online` mit `useEffect` und `online`/`offline`-Events.
  - **Wenn `createSection === 'helper'` und `!online`:** Oberhalb des Lernunterstützer-Chats dieselbe Infobox mit `OFFLINE_MESSAGE` und optional Icon anzeigen.
  - Buttons bleiben klickbar; bei Klick kommt wie bisher die Fehlermeldung aus dem catch (inkl. Retry).

### 4.3 Einheitliche Fehlerdarstellung bei Offline

- **Erkennung:** Wenn in KIPage bzw. KICenterPage `error === OFFLINE_MESSAGE` (oder `helperError === OFFLINE_MESSAGE`), soll die Anzeige optional hervorgehoben werden.
- **Umsetzung:** In der bestehenden Fehlerbox (`.ki-error-block`), wenn `error === OFFLINE_MESSAGE`:
  - Optional vor dem Text ein **Icon** „Keine Verbindung“ (z. B. `WifiOffIcon`) anzeigen.
  - Optional Zusatz „Keine Verbindung“ neben oder über dem Fließtext (z. B. `<span className="ki-error-label">Keine Verbindung</span>`).
- **Dateien:** `src/pages/KIPage.tsx`, `src/pages/KICenterPage.tsx`; neues Icon in `src/components/icons.tsx` (z. B. `WifiOffIcon`).

### 4.4 Globales Offline-Banner (optional, aber empfohlen)

- **Zweck:** Auf allen Seiten (nicht nur KI) sichtbar, wenn der Nutzer offline ist – setzt Erwartung, dass „etwas“ (z. B. KI) nicht geht.
- **Komponente:** `src/components/OfflineBanner.tsx`
  - State: `const [online, setOnline] = useState(() => typeof navigator !== 'undefined' && navigator.onLine)`.
  - `useEffect`: `online` / `offline` auf `window` listen, State setzen, Cleanup.
  - Wenn `!online`: ein schmales Banner (z. B. oben im Viewport oder unter der TopBar) rendern:
    - Text z. B.: „Offline. Für KI und einige andere Funktionen wird eine Internetverbindung benötigt. Andere Lerninhalte funktionieren offline.“
    - Styling: dezent (z. B. gelb/grau), nicht alarmierend; Klasse `offline-banner`.
  - Wenn `online`: `null` rendern.
- **Einbindung:** In `src/components/Layout.tsx` die Komponente einbinden (z. B. oben über `main` oder direkt unter der TopBar), sodass sie auf allen Seiten erscheint.
- **CSS:** `src/components/OfflineBanner.css` (oder in `Layout.css`) für `.offline-banner`.

### 4.5 Edge-Cases und Technik

- **SSR / navigator fehlt:** `isOnline()` prüft bereits `typeof navigator !== 'undefined'`. Beim initialen State (z. B. `useState(() => isOnline())`) ist im Browser `navigator` vorhanden; bei SSR kann `navigator` fehlen – dann `isOnline() === false`, Banner/Hinweis erscheint nach Hydration ggf. kurz und verschwindet, wenn der Client „online“ meldet. Optional: erst nach `useEffect` (client-only) den echten Online-Status setzen, um Flackern zu vermeiden.
- **Cleanup:** Alle `addEventListener` in den `useEffect`-Cleanup-Funktionen wieder entfernen.
- **Barrierefreiheit:** Banner und Infobox mit `role="status"` oder `aria-live="polite"` versehen, damit Screenreader die Änderung melden.

---

## 5. Reihenfolge der Umsetzung

| Schritt | Beschreibung | Dateien |
|--------|----------------|---------|
| 1 | Icon `WifiOffIcon` (oder `OfflineIcon`) hinzufügen | `src/components/icons.tsx` |
| 2 | OfflineBanner-Komponente + CSS; in Layout einbinden | `src/components/OfflineBanner.tsx`, `OfflineBanner.css`, `Layout.tsx` |
| 3 | KIPage: State `online`, Event-Listener, proaktive Infobox bei `!online`; bei `error === OFFLINE_MESSAGE` Icon/Label in Fehlerbox | `src/pages/KIPage.tsx`, `KIPage.css` |
| 4 | KICenterPage: State `online`, Event-Listener, proaktive Infobox im Helper-Bereich bei `!online`; bei `helperError === OFFLINE_MESSAGE` Icon/Label | `src/pages/KICenterPage.tsx`, ggf. `KIPage.css` oder KICenter-CSS |
| 5 | Optional: Buttons bei Offline disablen (mit Tooltip/Hinweis) – kann in 3/4 integriert werden | wie oben |

---

## 6. Kurz-Zusammenfassung

| Thema | Umsetzung |
|-------|-----------|
| **Basis** | `isOnline()` und `OFFLINE_MESSAGE` in aiClient; Offline-Check in `openAIFetch` (bereits vorhanden). |
| **Proaktiv** | Auf KIPage und KICenterPage (Helper): State `online` mit `online`/`offline`-Events; wenn `!online` Infobox mit `OFFLINE_MESSAGE` oberhalb der KI-Bereiche. |
| **Reaktiv** | Gleicher State aktualisiert sich bei Wechsel online/offline; keine Reload nötig. |
| **Erkennung** | Bei Anzeige der Fehlermeldung `OFFLINE_MESSAGE`: optional Icon + Label „Keine Verbindung“ in der Fehlerbox. |
| **Global** | OfflineBanner im Layout, nur sichtbar wenn `!online`, mit kurzer Erklärung (KI + andere Funktionen brauchen Internet, Rest offline nutzbar). |
| **Edge-Cases** | navigator-Check, Listener-Cleanup, optional aria-live für Barrierefreiheit. |

Damit ist Punkt 3 (Offline-Hinweis) vollständig geplant und umsetzbar.
