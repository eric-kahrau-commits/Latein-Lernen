import { Link } from 'react-router-dom'
import { GitHubIcon } from '../components/icons'
import { getFeedbackMailtoUrl } from '../data/feedback'
import './RechtlichesPage.css'

const GITHUB_URL = 'https://github.com/eric-kahrau-commits?tab=repositories'

export function ImpressumPage() {
  return (
    <div className="rechtliches-page">
      <h1 className="page-title">Impressum</h1>
      <p className="rechtliches-intro">Angaben gemäß § 5 TMG</p>

      <section className="rechtliches-card" aria-labelledby="impressum-verantwortlich">
        <h2 id="impressum-verantwortlich" className="rechtliches-heading">
          Verantwortlich für den Inhalt
        </h2>
        <p className="rechtliches-name">Eric Kahrau</p>
        <p className="rechtliches-note">
          (Anschrift und Kontakt auf Wunsch ergänzbar – für private/un kommerzielle Angebote oft ausreichend: Name + Kontaktmöglichkeit.)
        </p>
      </section>

      <section className="rechtliches-card" aria-labelledby="impressum-kontakt">
        <h2 id="impressum-kontakt" className="rechtliches-heading">
          Kontakt &amp; Quellcode
        </h2>
        <div className="rechtliches-links">
          <a
            href={getFeedbackMailtoUrl()}
            className="rechtliches-link"
            rel="noopener noreferrer"
          >
            Feedback geben
          </a>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rechtliches-link rechtliches-github"
          >
            <GitHubIcon className="rechtliches-github-icon" />
            <span>GitHub – eric-kahrau-commits</span>
          </a>
        </div>
      </section>

      <section className="rechtliches-card" aria-labelledby="impressum-haftung">
        <h2 id="impressum-haftung" className="rechtliches-heading">
          Haftung für Inhalte
        </h2>
        <p className="rechtliches-text">
          Als Diensteanbieter sind wir für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Wir sind nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen. Bei Bekanntwerden von Rechtsverletzungen werden wir die entsprechenden Inhalte umgehend entfernen.
        </p>
      </section>

      <section className="rechtliches-card" aria-labelledby="impressum-urheber">
        <h2 id="impressum-urheber" className="rechtliches-heading">
          Urheberrecht
        </h2>
        <p className="rechtliches-text">
          Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung und Verbreitung bedürfen der schriftlichen Zustimmung des jeweiligen Autors.
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
