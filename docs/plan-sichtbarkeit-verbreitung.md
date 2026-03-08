# Umsetzungsplan: Sichtbarkeit und Verbreitung (Punkt 5)

Plan für **Lernset teilen**, **PWA (Installierbarkeit)** und **Feedback-Kanal**.

---

## 1. Ausgangslage

| Thema | Stand |
|-------|--------|
| **Teilen** | `src/data/share.ts`: Web Share API mit Fallback (Kopieren). `getShareStreakText`, `getShareResultText`; genutzt auf Home (Streak) und LernenPage (Ergebnis). |
| **PWA** | Kein Manifest, kein Service Worker. |
| **Feedback** | KILernsetVorschauPage: „Fehler melden“ (mailto) für KI-Lernset-Fehler. Kein allgemeiner „Feedback geben“-Link in Einstellungen oder Impressum. |

---

## 2. Ziele

1. **Teilen attraktiv machen:** Zusätzlich zu Streak/Ergebnis eine „Lernset teilen“-Funktion (Export als Text/Link, „Kopieren zum Teilen“), damit Nutzer Mitschüler oder Lehrer einladen können.
2. **PWA:** Web-App-Manifest + Service Worker (z. B. Vite PWA Plugin) für Installierbarkeit und besseres „App“-Gefühl auf dem Handy.
3. **Feedback-Kanal:** „Feedback geben“ in Einstellungen und/oder Impressum (mailto oder Link), um Verbesserungen zu sammeln und Ernsthaftigkeit zu zeigen.

---

## 3. Konkrete Umsetzung

### 3.1 Lernset teilen

| Schritt | Was | Wo / wie |
|--------|-----|----------|
| **A** | **Share-Payload für Lernset** | In `src/data/share.ts`: Funktion `getShareLernsetPayload(lernset: Lernset): SharePayload`. Titel z. B. „Latinum – Lernset: {name}“. Text: „Lernset: {name}“ + kurzer Hinweis (z. B. „Zum Üben mit Latinum“) + erste Zeilen der Vokabeln (z. B. „Vokabel – Übersetzung“ pro Zeile, max. 20–30 Einträge, damit die Nachricht nicht zu lang wird). URL: `window.location.origin` (App-Startseite). Typ `Lernset` aus `lernsets` importieren. |
| **B** | **UI: „Lernset teilen“ anbieten** | (1) **KICenterPage** (Meine Dateien): Bei jedem Vokabel-Lernset in der Liste einen Button „Teilen“ (ShareIcon). Bei Klick: `share(getShareLernsetPayload(set))`, Feedback „Kopiert!“ oder „Geteilt!“. (2) **LernenPage**: Wenn ein Vokabel-Lernset ausgewählt ist (z. B. auf Stufe Modus wählen oder in der Kopfzeile), einen kleinen „Teilen“-Button anzeigen (z. B. neben dem Lernset-Namen oder in der Aktionsleiste), gleiche Logik. So können Nutzer das Set teilen, um andere einzuladen. |

### 3.2 PWA (optional, stark für App-Gefühl)

| Schritt | Was | Wo / wie |
|--------|-----|----------|
| **A** | **Vite PWA Plugin** | Paket `vite-plugin-pwa` installieren. In `vite.config.ts` Plugin einbinden mit `VitePWA({ registerType: 'autoUpdate', manifest: { ... } })`. |
| **B** | **Manifest** | Über Plugin-Option `manifest`: name, short_name (z. B. „Latinum“), theme_color, background_color, display: „standalone“, start_url: „/“, icons: mindestens 192x192 und 512x512 (können Platzhalter oder ein einfaches Icon sein; ggf. aus vorhandenem Favicon/Logo ableiten). |
| **C** | **Icons** | Ein Icon liegt unter `public/icon.svg` (Buch-Symbol). Für beste Installierbarkeit auf allen Geräten können zusätzlich PNG-Icons (192×192, 512×512) unter `public/` abgelegt und im Manifest ergänzt werden. |

### 3.3 Feedback-Kanal

| Schritt | Was | Wo / wie |
|--------|-----|----------|
| **A** | **Zentrale Feedback-E-Mail** | Konstante für Feedback-E-Mail und Betreff (z. B. in `src/data/feedback.ts` oder in den bestehenden Konstanten in KILernsetVorschauPage erweitern). Einheitliche mailto-URL: `mailto:…?subject=Feedback zu Latinum`. |
| **B** | **Einstellungen** | In `src/pages/EinstellungenPage.tsx` einen Abschnitt „Feedback & Hilfe“ (oder „Über die App“) mit einem Button/Link „Feedback geben“. Bei Klick: `window.location.href = mailto:…` oder `<a href={mailtoUrl}>Feedback geben</a>`. |
| **C** | **Impressum** | In `src/pages/ImpressumPage.tsx` unter „Kontakt“ einen Link „Feedback geben“ (mailto) ergänzen, damit Nutzer auch von dort aus Rückmeldung senden können. |

---

## 4. Reihenfolge und Dateien

| Phase | Inhalt | Dateien |
|-------|--------|---------|
| 1 | Share: `getShareLernsetPayload` + Buttons (KICenterPage, LernenPage) | `src/data/share.ts`, `src/pages/KICenterPage.tsx`, `src/pages/LernenPage.tsx` |
| 2 | Feedback: Konstante + Einstellungen + Impressum | `src/data/feedback.ts` (oder Konstante in Einstellungen), `EinstellungenPage.tsx`, `ImpressumPage.tsx` |
| 3 | PWA: Plugin + Manifest + Icons | `package.json`, `vite.config.ts`, `public/` (Icon), ggf. `index.html` (theme-color meta) |

---

## 5. Kurz-Zusammenfassung

| Thema | Umsetzung |
|-------|-----------|
| **Lernset teilen** | `getShareLernsetPayload(lernset)` in share.ts; „Teilen“-Button auf KICenterPage (pro Vokabel-Lernset) und auf LernenPage (bei ausgewähltem Lernset); bestehende `share()`-Funktion (Web Share + Kopieren). |
| **PWA** | vite-plugin-pwa; Manifest (name, short_name, display standalone, start_url, icons, theme_color); Service Worker autoUpdate. |
| **Feedback** | Einheitliche mailto-URL; „Feedback geben“ in Einstellungen und Impressum. |

Damit ist Punkt 5 (Sichtbarkeit und Verbreitung) geplant und umsetzbar.
