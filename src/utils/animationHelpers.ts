/**
 * Animation Utilities für KI-Seite
 * Enthält Helper-Funktionen für Animationen und Effekte
 */

/* Confetti Animation Generator */
export function generateConfetti(container: HTMLElement, count: number = 30) {
  for (let i = 0; i < count; i++) {
    const confetti = document.createElement('div')
    confetti.className = 'confetti'
    
    const randomX = (Math.random() - 0.5) * 400
    const randomDelay = Math.random() * 0.2
    
    confetti.style.setProperty('--tx', `${randomX}px`)
    confetti.style.left = `${Math.random() * 100}%`
    confetti.style.top = '-10px'
    confetti.style.animationDelay = `${randomDelay}s`
    confetti.style.background = [
      'linear-gradient(135deg, #4f46e5, #8b5cf6)',
      'linear-gradient(135deg, #8b5cf6, #a855f7)',
      'linear-gradient(135deg, #10b981, #059669)',
      'linear-gradient(135deg, #0d9488, #14b8a6)',
    ][Math.floor(Math.random() * 4)]
    
    container.appendChild(confetti)
    
    setTimeout(() => {
      confetti.remove()
    }, 3000)
  }
}

/* Pulse Animation */
export function addPulseAnimation(element: HTMLElement) {
  element.classList.add('pulse')
  return () => element.classList.remove('pulse')
}

/* Bounce Animation */
export function addBounceAnimation(element: HTMLElement) {
  element.classList.add('bounce-in')
  return () => element.classList.remove('bounce-in')
}

/* Float Animation */
export function addFloatAnimation(element: HTMLElement) {
  element.classList.add('float-up')
  return () => element.classList.remove('float-up')
}

/* Glow Effect */
export function addGlowEffect(element: HTMLElement, color: string = '#4f46e5') {
  element.style.boxShadow = `0 0 20px ${color}, 0 0 40px ${color}4d`
  element.style.transition = 'box-shadow 0.3s ease'
  
  return () => {
    element.style.boxShadow = ''
    element.style.transition = ''
  }
}

/* Success Animation Sequence */
export function playSuccessAnimation(element: HTMLElement) {
  return new Promise((resolve) => {
    element.classList.add('bounce-in')
    setTimeout(() => {
      element.classList.remove('bounce-in')
      resolve(null)
    }, 600)
  })
}

/* Shake Animation */
export function shakeElement(element: HTMLElement, duration: number = 400) {
  const keyframes = `
    @keyframes shake-${Date.now()} {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-10px); }
      75% { transform: translateX(10px); }
    }
  `
  
  const style = document.createElement('style')
  style.textContent = keyframes
  document.head.appendChild(style)
  
  const animationName = keyframes.match(/shake-\d+/)?.[0] || 'shake'
  element.style.animation = `${animationName} ${duration}ms`
  
  setTimeout(() => {
    element.style.animation = ''
    style.remove()
  }, duration)
}

/* Ripple Effect */
export function addRippleEffect(event: MouseEvent) {
  const button = event.currentTarget as HTMLElement
  const rect = button.getBoundingClientRect()
  const ripple = document.createElement('span')
  
  const size = Math.max(rect.width, rect.height)
  const x = event.clientX - rect.left - size / 2
  const y = event.clientY - rect.top - size / 2
  
  ripple.style.width = `${size}px`
  ripple.style.height = `${size}px`
  ripple.style.left = `${x}px`
  ripple.style.top = `${y}px`
  ripple.style.position = 'absolute'
  ripple.style.borderRadius = '50%'
  ripple.style.backgroundColor = 'rgba(255, 255, 255, 0.5)'
  ripple.style.pointerEvents = 'none'
  ripple.style.animation = 'ripple-expand 0.6s ease-out'
  
  if (!document.getElementById('ripple-style')) {
    const style = document.createElement('style')
    style.id = 'ripple-style'
    style.textContent = `
      @keyframes ripple-expand {
        0% {
          transform: scale(0);
          opacity: 1;
        }
        100% {
          transform: scale(4);
          opacity: 0;
        }
      }
    `
    document.head.appendChild(style)
  }
  
  button.style.position = 'relative'
  button.style.overflow = 'hidden'
  button.appendChild(ripple)
  
  setTimeout(() => ripple.remove(), 600)
}

export default {
  generateConfetti,
  addPulseAnimation,
  addBounceAnimation,
  addFloatAnimation,
  addGlowEffect,
  playSuccessAnimation,
  shakeElement,
  addRippleEffect,
}
