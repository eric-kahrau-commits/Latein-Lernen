# 🎨 Verwendungsanleitung - Neue Design-Komponenten

## VoiceBubble Komponente

### Import
```tsx
import { VoiceBubble } from '../components/VoiceBubble'
```

### Verwendung
```tsx
// Basis Verwendung
<VoiceBubble 
  isListening={true}
  transcript="Ich höre dir zu…"
/>

// Mit Optionalem Callback
<VoiceBubble 
  isListening={isListening}
  transcript={speechTranscript || 'Ich höre dir zu…'}
  onListening={(state) => console.log('Listening:', state)}
/>
```

### Props
```tsx
interface VoiceBubbleProps {
  isListening: boolean;           // Ob gerade Spracherkennng läuft
  transcript?: string;            // Angezeigter Text (default: 'Ich höre dir zu…')
  onListening?: (state: boolean) => void;  // Optional Callback
}
```

### Features
- ✅ Live Frequenz-Analyse
- ✅ Animierte Sound-Wave Bars
- ✅ Pulsing Mikrofon Icon
- ✅ Responsive & Mobile-optimiert
- ✅ Dark Mode Support

---

## Animation Helper Funktionen

### Import
```tsx
import { 
  generateConfetti, 
  addPulseAnimation,
  playSuccessAnimation 
} from '../utils/animationHelpers'
```

### Confetti
```tsx
// Confetti bei Success erzeugen
const handleSuccess = () => {
  generateConfetti(document.body, 40)  // 40 Konfetti-Partikel
}

// Mit Custom Container
generateConfetti(containerElement, 30)
```

### Pulse Animation
```tsx
const handlePulse = (element: HTMLElement) => {
  const cleanup = addPulseAnimation(element)
  // Später: cleanup() aufrufen um Animation zu stoppen
}
```

### Bounce Animation
```tsx
const handleBounce = (element: HTMLElement) => {
  addBounceAnimation(element)
}
```

### Success Sequence
```tsx
const handleSuccess = async (element: HTMLElement) => {
  await playSuccessAnimation(element)
  // Animation ist komplett
}
```

---

## Glass Design CSS Classes

### Container
```html
<!-- Glasmorphic Container -->
<div class="glass-container">
  Inhalt mit Blur-Effekt
</div>

<!-- Glasmorphic Card -->
<div class="glass-card">
  Card mit subtilerem Blur
</div>
```

### Buttons
```html
<!-- Glasmorphic Button -->
<button class="btn-glass">Klick mich</button>

<!-- Mit Primary Button -->
<button class="ki-btn ki-btn--primary btn-glass">Primary</button>

<!-- Mit Secondary Button -->
<button class="ki-btn ki-btn--secondary">Secondary</button>
```

### Input Felder
```html
<!-- Glasmorphic Input -->
<input class="input-glass" type="text" placeholder="Eingabe…" />

<!-- Im Glass Container -->
<div class="ki-input-bubble glass-card">
  <input class="ki-input ki-input--bubble input-glass" />
</div>
```

### Chat Bubbles
```html
<!-- Assistant Bubble -->
<div class="ki-chat-bubble ki-chat-bubble--assistant">
  <p class="ki-chat-bubble-text">Hallo, wie kann ich helfen?</p>
</div>

<!-- User Bubble -->
<div class="ki-chat-bubble ki-chat-bubble--user">
  <p class="ki-chat-bubble-text">Ich habe eine Frage</p>
</div>
```

---

## Farb-Klassen

```css
/* Create Cards */
.ki-create-card--ki      /* Purple Gradient */
.ki-create-card--vokabel /* Teal Gradient */
.ki-create-card--helper  /* Orange Gradient */
.ki-create-card--fach    /* Green Gradient */

/* Status */
.ki-checklist-item--done /* Success State */
.ki-error                /* Error State */
```

---

## Komplette Beispiele

### 1. KI-Assistent mit Voice & Glass
```tsx
import { VoiceBubble } from '../components/VoiceBubble'
import { generateConfetti } from '../utils/animationHelpers'

export function MyKIPage() {
  const [isListening, setIsListening] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    if (showSuccess) {
      generateConfetti(document.body, 40)
    }
  }, [showSuccess])

  return (
    <div className="ki-page">
      {isListening && (
        <VoiceBubble isListening={true} transcript="Ich höre…" />
      )}
      
      <div className="glass-container">
        <input className="input-glass" placeholder="Schreibe oder spreche…" />
        <button className="btn-glass">Absenden</button>
      </div>

      {showSuccess && (
        <div className="ki-check ki-check--inline">
          <div className="ki-check-circle">✓</div>
          <p>Erfolgreich erstellt!</p>
        </div>
      )}
    </div>
  )
}
```

### 2. Create Card mit Animationen
```tsx
<button 
  className="ki-create-card ki-create-card--ki"
  onClick={() => navigate('/ki/assistent')}
>
  <span className="ki-create-card-icon">✨</span>
  <span className="ki-create-card-title">KI-Lernset</span>
  <span className="ki-create-card-desc">Mit KI erstellen</span>
</button>
```

### 3. Form mit Glass Design
```tsx
<div className="ki-faecher-card">
  <h2 className="ki-faecher-title">Neues Fach erstellen</h2>
  
  <input 
    className="ki-input input-glass" 
    placeholder="Fach-Name…" 
  />
  
  <button className="btn-glass">Speichern</button>
</div>
```

---

## CSS Custom Properties (Dark Mode)

```css
/* Light Mode (Default) */
:root {
  --glass-bg: rgba(255, 255, 255, 0.7);
  --glass-border: rgba(255, 255, 255, 0.2);
  --glass-blur: 12px;
  --glass-shadow: 0 8px 32px rgba(31, 38, 135, 0.15);
}

/* Dark Mode */
@media (prefers-color-scheme: dark) {
  :root {
    --glass-bg: rgba(30, 41, 59, 0.7);
    --glass-border: rgba(148, 163, 184, 0.15);
    --glass-blur: 12px;
    --glass-shadow: 0 8px 32px rgba(31, 38, 135, 0.15);
  }
}
```

---

## Performance Tips

✅ **Do's:**
- Nutze GPU-beschleunigte Properties (transform, opacity)
- Begrenzte Anzahl Animationen gleichzeitig
- Nutze `backdrop-filter` sparsam
- Combine mehrere Animationen mit `animation`

❌ **Don'ts:**
- Vermeide simultane Box-Shadow Animationen
- Nicht zu viele backdrop-filter kombinieren
- CSS-in-JS nur wo nötig

---

## Browser Kompatibilität

| Feature | Min. Version |
|---------|-------------|
| backdrop-filter | Chrome 76 |
| CSS Variables | Chrome 49 |
| CSS Grid | Chrome 57 |
| Web Audio API | Chrome 10 |

---

## Troubleshooting

### Animationen sehen verzögert aus?
→ Deaktiviere Browser DevTools
→ Überprüfe GPU-Beschleunigung in Chrome Settings

### Dark Mode wird nicht angewendet?
→ Überprüfe System Dark Mode Settings
→ Clear Browser Cache
→ Hard Refresh (Cmd+Shift+R / Ctrl+Shift+F5)

### Glass Blur sieht verschwommen aus?
→ Das ist normal! Es ist der Glasmorphismus-Effekt
→ Adjust `--glass-blur` wenn nötig (12px ist Standard)

---

## Weitere Ressourcen

- [Design Technical Docs](./DESIGN_TECHNICAL_DOCS.md)
- [Design Summary](./DESIGN_UPGRADE_SUMMARY.md)
- [CSS MDN Docs](https://developer.mozilla.org/en-US/docs/Web/CSS)
- [React Hooks Guide](https://react.dev/reference/react/hooks)

---

**Letzte Aktualisierung:** März 2026
**Status:** ✅ Production Ready
