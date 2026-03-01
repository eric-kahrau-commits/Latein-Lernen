import { useState, useEffect, useRef } from 'react'
import './FavoritenSection.css'

const PLACEHOLDER_COUNT = 10

function useItemsPerPage() {
  const [itemsPerPage, setItemsPerPage] = useState(2)
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth
      if (w < 480) setItemsPerPage(1)
      else if (w < 768) setItemsPerPage(2)
      else if (w < 1024) setItemsPerPage(3)
      else setItemsPerPage(4)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return itemsPerPage
}

type FavoritenSectionProps = {
  title: string
  headingId?: string
}

export function FavoritenSection({ title, headingId = 'favoriten-heading' }: FavoritenSectionProps) {
  const [currentPage, setCurrentPage] = useState(0)
  const [visible, setVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)
  const itemsPerPage = useItemsPerPage()
  const totalPages = Math.ceil(PLACEHOLDER_COUNT / itemsPerPage)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => setVisible(e.isIntersecting),
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (currentPage >= totalPages && totalPages > 0) {
      setCurrentPage(totalPages - 1)
    }
  }, [totalPages, currentPage])

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(0, Math.min(page, totalPages - 1)))
  }

  const trackWidthPercent = itemsPerPage > 0 ? 1000 / itemsPerPage : 100
  const translateXPercent = totalPages > 0 ? -(currentPage * 10 * itemsPerPage) : 0

  return (
    <section
      ref={sectionRef}
      className={`favoriten-section ${visible ? 'favoriten-section--visible' : ''}`}
      aria-labelledby={headingId}
    >
      <h2 id={headingId} className="favoriten-heading">
        {title}
      </h2>

      <div className="favoriten-viewport">
        <div
          className="favoriten-track"
          style={{
            width: `${trackWidthPercent}%`,
            transform: `translateX(${translateXPercent}%)`,
          }}
        >
          {Array.from({ length: PLACEHOLDER_COUNT }, (_, i) => (
            <div key={i} className="favoriten-card">
              <span className="favoriten-card-placeholder">Platz {i + 1}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="favoriten-nav">
        <button
          type="button"
          className="favoriten-nav-btn"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 0}
          aria-label="Vorherige Seite"
        >
          ‹
        </button>
        <div className="favoriten-dots" role="tablist" aria-label="Seiten">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={currentPage === i}
              aria-label={`Seite ${i + 1}`}
              className={`favoriten-dot ${currentPage === i ? 'favoriten-dot--active' : ''}`}
              onClick={() => goToPage(i)}
            />
          ))}
        </div>
        <button
          type="button"
          className="favoriten-nav-btn"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
          aria-label="Nächste Seite"
        >
          ›
        </button>
      </div>
    </section>
  )
}
