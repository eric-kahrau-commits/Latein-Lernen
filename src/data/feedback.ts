/**
 * Feedback-Kanal: E-Mail-Link für allgemeines Feedback (Einstellungen, Impressum).
 */

export const FEEDBACK_EMAIL = 'feedback@latinum-app.de'
export const FEEDBACK_SUBJECT = 'Feedback zu Latinum'

export function getFeedbackMailtoUrl(body?: string): string {
  const params = new URLSearchParams()
  params.set('subject', FEEDBACK_SUBJECT)
  if (body) params.set('body', body)
  return `mailto:${FEEDBACK_EMAIL}?${params.toString()}`
}
