import { Link } from 'react-router-dom'
import './RechtlichesPage.css'

export function DatenschutzPage() {
  return (
    <div className="rechtliches-page">
      <h1 className="page-title">Datenschutzerklärung</h1>

      <section className="rechtliches-card" aria-labelledby="ds-verantwortlich">
        <h2 id="ds-verantwortlich" className="rechtliches-heading">
          Verantwortlicher
        </h2>
        <p className="rechtliches-text">
          Verantwortlich für die Datenverarbeitung im Sinne der DSGVO ist: Eric Kahrau (Kontakt siehe Impressum).
        </p>
      </section>

      <section className="rechtliches-card" aria-labelledby="ds-erhebung">
        <h2 id="ds-erhebung" className="rechtliches-heading">
          Erhebung und Speicherung von Daten
        </h2>
        <p className="rechtliches-text">
          Diese App speichert Daten ausschließlich lokal in deinem Browser (localStorage). Es werden keine personenbezogenen Daten an einen Server übertragen. Gespeichert werden u. a. dein Name (optional), deine Lernsets, Favoriten, Lernstatistik und Einstellungen (z. B. Design, Schriftgröße).
        </p>
      </section>

      <section className="rechtliches-card" aria-labelledby="ds-zweck">
        <h2 id="ds-zweck" className="rechtliches-heading">
          Zweck der Verarbeitung
        </h2>
        <p className="rechtliches-text">
          Die lokale Speicherung dient der Nutzbarkeit der App (persönliche Einstellungen, Lernfortschritt, Favoriten). Eine Auswertung oder Weitergabe an Dritte erfolgt nicht.
        </p>
      </section>

      <section className="rechtliches-card" aria-labelledby="ds-rechte">
        <h2 id="ds-rechte" className="rechtliches-heading">
          Deine Rechte
        </h2>
        <p className="rechtliches-text">
          Du kannst die gespeicherten Daten jederzeit in den Einstellungen (z. B. „Statistik zurücksetzen“) oder durch Löschen der App-Daten im Browser entfernen. Auskunft, Berichtigung, Löschung und Widerspruch richten Sie an den Verantwortlichen (siehe Impressum).
        </p>
      </section>

      <section className="rechtliches-card" aria-labelledby="ds-host">
        <h2 id="ds-host" className="rechtliches-heading">
          Hosting
        </h2>
        <p className="rechtliches-text">
          Sofern die App über einen externen Anbieter gehostet wird, können beim Aufruf der Seite Zugriffsdaten (z. B. IP, Datum, aufgerufene Seite) an den Hoster übermittelt werden. Die jeweiligen Bestimmungen des Hosters sind zu beachten.
        </p>
      </section>

      <p className="rechtliches-back">
        <Link to="/" className="rechtliches-back-link">
          ← Zur Startseite
        </Link>
      </p>
    </div>
  )
}
