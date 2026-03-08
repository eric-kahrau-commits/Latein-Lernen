# 🎨 Design System - Quick Reference Guide

## 🎬 Animation Classes Quick Reference

### Entrance Animations
```css
.animate-fade-in                /* Smooth fade from transparent to visible */
.animate-slide-in-top           /* Slide from top */
.animate-slide-in-bottom        /* Slide from bottom */
.animate-slide-in-left          /* Slide from left */
.animate-slide-in-right         /* Slide from right */
.animate-zoom-in                /* Scale up from 0 to 1 */
.animate-zoom-in-bounce         /* Zoom with bounce effect */
.animate-bounce-in              /* Bounce entrance with overshoot */
.animate-rotate-in              /* Rotate while entering */
.animate-flip-in-x              /* 3D flip on X axis */
.animate-flip-in-y              /* 3D flip on Y axis */
.animate-back-in-right          /* Slide in with perspective */
.animate-back-in-left           /* Slide in with perspective */
.animate-elastic-in             /* Elastic spring effect */
```

### Hover & Interactive Effects
```css
.animate-hover-lift             /* Lift up on hover */
.animate-hover-scale            /* Scale up on hover */
.animate-hover-scale-gentle     /* Subtle scale on hover */
.animate-hover-rotate           /* Rotate on hover */
.animate-hover-glow             /* Glow effect on hover */
.animate-pulse-glow             /* Pulsing glow animation */
.animate-pulse-scale            /* Pulsing scale animation */
.animate-beat                   /* Heart beat effect */
.animate-heartbeat              /* Continuous heart beat */
```

### Text Animations
```css
.animate-text-shimmer           /* Shimmer wave over text */
.animate-text-pop               /* Pop effect (scale bounce) */
.animate-text-wave              /* Wave animation */
.animate-letter-spacing-expand  /* Expand letter spacing */
```

### Loading States
```css
.animate-spinner                /* Rotating spinner */
.animate-spinner-pulse          /* Spinner with pulse */
.animate-dots-bounce            /* Three bouncing dots */
.animate-progress-fill          /* Progress bar fill */
.animate-progress-glow          /* Progress bar with glow */
```

### Motion Effects
```css
.animate-float                  /* Floating up and down */
.animate-float-slow             /* Slower floating */
.animate-float-fast             /* Faster floating */
.animate-wave                   /* Wave motion */
.animate-wave-rotate            /* Wave with rotation */
.animate-bounce-vertical        /* Vertical bouncing */
.animate-bounce-horizontal      /* Horizontal bouncing */
.animate-bounce-icon            /* Icon specific bounce */
```

### Gradient Animations
```css
.animate-gradient-shift         /* Shift gradient colors */
.animate-gradient-rotate        /* Rotate gradient */
.animate-color-shift            /* Color transition */
```

### Effect Animations
```css
.animate-blur-in                /* Blur then focus */
.animate-blur-out               /* Focus then blur */
.animate-blur-pulse             /* Pulsing blur effect */
.animate-skew-in                /* Skew entrance */
.animate-skew-out               /* Skew exit */
.animate-tilt                   /* Subtle tilt */
.animate-tilt-intense           /* Strong tilt */
.animate-morph-circle-square    /* Circle to square morph */
.animate-morph-smooth           /* Smooth morphing */
.animate-shine                  /* Shine sweep effect */
```

### Stagger & Swipe
```css
.animate-stagger-in             /* Staggered entrance */
.animate-slide-out-right        /* Slide out to right */
.animate-slide-out-left         /* Slide out to left */
.animate-swipe-right            /* Swipe gesture */
.animate-swipe-left             /* Swipe gesture */
```

### Attention Seekers
```css
.animate-shake                  /* Shaking motion */
.animate-wiggle                 /* Wiggle motion */
.animate-jello                  /* Jello wobble */
```

### Interactive Effects
```css
.animate-button-press           /* Button press down */
.animate-button-ripple          /* Ripple effect */
.animate-button-glow-pulse      /* Glowing pulse */
```

### Modal & UI
```css
.animate-modal-backdrop-fade    /* Backdrop fade in */
.animate-modal-scale-pop        /* Modal pop effect */
.animate-scroll-arrow           /* Scrolling arrow */
.animate-glow-pulse             /* Pulsing glow */
.animate-neon-glow              /* Neon glow effect */
```

---

## 🎨 Color Variables Quick Reference

### Primary Colors
```css
var(--primary-gradient)         /* Indigo → Purple gradient */
var(--primary-light)            /* Light indigo */
var(--primary-dark)             /* Dark indigo */
```

### Secondary Colors
```css
var(--secondary-gradient)       /* Cyan → Teal gradient */
var(--secondary-light)          /* Light cyan */
var(--secondary-dark)           /* Dark cyan */
```

### Accent Colors
```css
var(--accent-success)           /* Success green #10b981 */
var(--accent-warning)           /* Warning orange #f59e0b */
var(--accent-danger)            /* Danger red #ef4444 */
var(--accent-info)              /* Info blue #3b82f6 */
```

### Glass Effects
```css
var(--glass-light)              /* Light glass background */
var(--glass-blur)               /* 12px blur effect */
var(--glass-blur-heavy)         /* 20px blur effect */
```

### Shadows
```css
var(--shadow-sm)                /* Small shadow */
var(--shadow-md)                /* Medium shadow */
var(--shadow-lg)                /* Large shadow */
var(--shadow-xl)                /* Extra large shadow */
var(--shadow-glow)              /* Glow shadow effect */
var(--shadow-glow-strong)       /* Strong glow shadow */
```

### Text Colors
```css
var(--text-primary)             /* Main text color */
var(--text-secondary)           /* Secondary text */
var(--text-muted)               /* Muted text */
```

### Background Colors
```css
var(--bg-primary)               /* Main background */
var(--bg-secondary)             /* Secondary background */
```

### Border Colors
```css
var(--border-primary)           /* Primary border */
```

---

## 🎭 Timing Functions

```css
/* Fast animations */
cubic-bezier(0.25, 0.46, 0.45, 0.94)    /* easeOutQuad */

/* Bouncy animations */
cubic-bezier(0.34, 1.56, 0.64, 1)       /* easeOutBack - for bouncy effects */

/* Smooth animations */
cubic-bezier(0.25, 0.1, 0.25, 1)        /* easeOutQuart */

/* Spring-like */
cubic-bezier(0.68, -0.55, 0.265, 1.55)  /* Spring effect */
```

---

## 🔧 Common Usage Patterns

### Staggered List Animation
```css
.item {
  animation: bounce-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.item:nth-child(1) { animation-delay: 0.05s; }
.item:nth-child(2) { animation-delay: 0.1s; }
.item:nth-child(3) { animation-delay: 0.15s; }
.item:nth-child(n+4) { animation-delay: 0.2s; }
```

### Hover Effect
```css
.card {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.card:hover {
  animation: hover-lift 0.3s ease-out forwards;
  box-shadow: var(--shadow-glow);
  transform: translateY(-4px);
}
```

### Floating Icon
```css
.icon {
  animation: float 3.5s ease-in-out infinite;
}

.card:hover .icon {
  animation: bounce-icon 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

### Loading State
```css
.loader-dot {
  animation: dots-bounce 1.4s ease-in-out infinite;
}

.loader-dot:nth-child(2) { animation-delay: 0.2s; }
.loader-dot:nth-child(3) { animation-delay: 0.4s; }
```

### Gradient Text
```css
.gradient-text {
  background: linear-gradient(135deg, var(--primary-gradient));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: text-pop 0.6s ease-out 0.1s backwards;
}
```

### Glass Container
```css
.glass {
  background: var(--glass-light);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  box-shadow: var(--shadow-md);
}

.glass:hover {
  background: var(--glass-light);
  backdrop-filter: blur(20px);
  box-shadow: var(--shadow-glow);
}
```

---

## 🎯 Animation Duration Guidelines

```css
/* Quick interactions */
150ms  /* .animate-fast */

/* Standard animations */
300ms  /* .animate-base (default) */
400ms  /* .animate-bounce */

/* Slower animations */
500ms  /* .animate-slow */

/* Continuous animations */
2s     /* pulse, float, etc. */
3s     /* slow float */
3.5s   /* icon animations */
```

---

## 📱 Icon Categories

### Navigation Icons
ChevronRight, ChevronLeft, ChevronUp, ChevronDown, ArrowRight, ArrowLeft, ArrowUp, ArrowDown, Menu, X

### Media Controls
Play, Pause, Volume2, Volume1, Volume0, Mute, SkipForward, SkipBack, Repeat, FastForward, Rewind

### Communication
Mail, Send, MessageCircle, Phone, PhoneCall, PhoneMissed, MessageSquare, Chat, Bell

### Data & Charts
BarChart, LineChart, PieChart, TrendingUp, TrendingDown, Activity, Zap

### Time & Calendar
Calendar, Clock, AlarmClock, Timer, Watch, Date

### Commerce & Money
ShoppingCart, CreditCard, Wallet, DollarSign, EurSign, Coins, Percent, Tag

### Files & Documents
File, FileText, FileCode, Folder, Copy, Clipboard, ClipboardCheck, Save

### Settings & Tools
Settings, Gear, Wrench, Tool, Hammer, Screwdriver, ToggleLeft, ToggleRight

### Rewards & Recognition
Trophy, Award, Medal, Star, StarHalf, Heart, ThumbsUp, Gift

### Utilities
Search, Filter, Map, Compass, Camera, Eye, Download, Upload, Lock, Unlock

---

## ✅ Accessibility Checklist

- [ ] All animations respect `prefers-reduced-motion`
- [ ] Color contrast meets WCAG standards
- [ ] Icons have proper ARIA labels
- [ ] Focus states are clearly visible
- [ ] Keyboard navigation supported
- [ ] Touch targets are at least 44x44px
- [ ] Animations don't exceed 3 seconds
- [ ] No flashing content >3 per second

---

## 🚀 Performance Tips

1. Use `transform` and `opacity` for smooth animations
2. Avoid animating `width` and `height` when possible
3. Use `will-change` for frequently animated elements
4. Limit concurrent animations on same page
5. Test on mobile devices
6. Use `requestAnimationFrame` for custom JS animations
7. Debounce scroll events
8. Use `prefers-reduced-motion` for user preference

---

## 📚 File Locations

- **Design System**: `/src/styles/design-system.css`
- **Icons Extended**: `/src/components/icons-extended.tsx`
- **Page Animations**: `/src/pages/*-Modern.css`
- **Global Styles**: `/src/index.css`

---

## 🎓 Integration Example

```tsx
import { useState } from 'react'
import { Trophy, Heart, Zap } from '../components/icons-extended'
import './MyPage-Modern.css'

export function MyPage() {
  return (
    <div className="page">
      {/* Animated header */}
      <h1 className="page-title">Welcome</h1>
      
      {/* Icon with float animation */}
      <Trophy className="animate-float" />
      
      {/* Staggered list */}
      <div className="items-list">
        <div className="item">Item 1</div>
        <div className="item">Item 2</div>
        <div className="item">Item 3</div>
      </div>
      
      {/* Interactive button */}
      <button className="btn btn--primary">
        <Heart /> Favorite
      </button>
    </div>
  )
}
```

---

## 📞 Support

For questions about animations or design system:
- Check the specific Modern CSS file
- Review design-system.css for available animations
- Look at other pages for usage examples
- Test on different devices and browsers

Enjoy your modern, animated app! ✨
