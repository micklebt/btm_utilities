# BTM Utility - UX/UI Design Document

## **1. Design Philosophy & Principles**

### **1.1 Core Design Principles**
- **Mobile-First**: Designed primarily for smartphone use with desktop compatibility
- **Touch-Optimized**: Large touch targets (44px minimum) with thumb-friendly navigation
- **Field-Ready**: High contrast, readable in various lighting conditions
- **Minimal Input**: Voice and camera-based input preferred over typing
- **One-Handed Operation**: Critical functions accessible with single hand
- **Progressive Disclosure**: Show only relevant information at each step

### **1.2 Design Inspiration**
- Following the clean, simple design of the existing BTM Intercoms application
- Button-based interface with clear categorization
- Immediate visual feedback for all actions
- Minimal text, maximum clarity approach

---

## **2. Information Architecture**

### **2.1 Primary Navigation Structure**
```
BTM Utility App
├── Money Collection
├── To-Do List
├── Parts & Equipment
├── Communications
├── Phone Directory
└── Settings/Config
```

### **2.2 User Flow Hierarchy**
```
Home Dashboard
├── Quick Actions (Most Used)
│   ├── Start Money Collection
│   ├── Add To-Do Item (Voice)
│   └── Emergency Contacts
├── Secondary Functions
│   ├── Parts Lookup
│   ├── Equipment Docs
│   └── Communications
└── Admin Functions
    ├── Configuration
    ├── Data Export
    └── System Status
```

---

## **3. Screen Layouts & Wireframes**

### **3.1 Home Dashboard Layout**
```
┌─────────────────────────────┐
│ BTM Utility        [Config] │
├─────────────────────────────┤
│                             │
│    Quick Collection         │
│  [Camera/QR Scanner Icon]   │
│                             │
├─────────────────────────────┤
│ [+ Voice To-Do] [Emergency] │
├─────────────────────────────┤
│ Recent Activity             │
│ • Last collection: Fri 2PM  │
│ • Tasks due: 3 items        │
│ • Parts alert: Low filters  │
├─────────────────────────────┤
│ [Parts] [Comms] [Directory] │
### Security Portal & Climate Control
```
┌─────────────────────────────┐
│ Security & Climate Portal   │
├─────────────────────────────┤
│ 📍 Location: [Peacock ▼]    │
├─────────────────────────────┤
│ 📹 Camera Feed 1            │
│  ┌─────────────────────┐   │
│  │    [Live Video]     │   │
│  │     🔴 LIVE        │   │
│  └─────────────────────┘   │
│ [📹 Cam 1] [📹 Cam 2] [📼 Rec] │
├─────────────────────────────┤
│ 🌡️ Climate Control          │
│ Current: 72°F               │
│ Target:  [74°F] [- +]       │
│ Status: 🟢 Normal           │
├─────────────────────────────┤
│ [🏠 Dashboard] [⚙️ Settings] │
└─────────────────────────────┘

Temperature Controls Detail:
┌─────────────────────────────┐
│ 🌡️ Peacock Climate Control  │
├─────────────────────────────┤
│ Current Temperature: 72°F   │
│ Target Temperature:  74°F   │
│ Humidity: 45%              │
│ Status: Heating 🔥         │
├─────────────────────────────┤
│ Quick Adjust:               │
│ [68°F] [70°F] [72°F] [74°F] │
│ [76°F] [78°F] [Auto]        │
├─────────────────────────────┤
│ Schedule:                   │
│ Weekdays: 70°F (6AM-10PM)   │
│ Nights: 65°F (10PM-6AM)     │
│ [Edit Schedule]             │
├─────────────────────────────┤
│ [Save Changes] [Cancel]     │
└─────────────────────────────┘
```

### **3.2 Money Collection Workflow**
```
Step 1: Machine Selection
┌─────────────────────────────┐
│ Money Collection            │
├─────────────────────────────┤
│     QR SCANNER VIEW         │
│  ┌─────────────────────┐   │
│  │                     │   │
│  │   [Camera Feed]     │   │
│  │                     │   │
│  └─────────────────────┘   │
│                             │
│ Detected: Peacock Ch.1 H.A  │
│ [Manual Entry] [Continue]   │
└─────────────────────────────┘

Step 2: Counter Reading
┌─────────────────────────────┐
│ Peacock Changer 1 - Hopper A│
├─────────────────────────────┤
│ Counter Mode:               │
│ ○ Quarters (4 = $1)         │
│ ● Dollars (1 = $1) ✓        │
├─────────────────────────────┤
│ Current Reading: [   1234 ] │
├─────────────────────────────┤
│ Comments:                   │
│ [Optional notes...]         │
├─────────────────────────────┤
│ ☐ Coins brought to office   │
├─────────────────────────────┤
│ [Back] [Save & Continue]    │
└─────────────────────────────┘

Step 3: Confirmation
┌─────────────────────────────┐
│ Collection Summary          │
├─────────────────────────────┤
│ Location: Peacock           │
│ Machine: Changer 1, Hopper A│
│ Mode: Dollar counting       │
│ Amount: $1,234              │
│ Comments: "Filter changed"  │
│ Coins to office: ✓ Yes     │
├─────────────────────────────┤
│ [Edit] [Submit & SMS]       │
└─────────────────────────────┘
```

### **3.3 Voice To-Do Entry**
```
┌─────────────────────────────┐
│ Add To-Do Item              │
├─────────────────────────────┤
│                             │
│     🎤 LISTENING...         │
│                             │
│ "Replace filter at Dover    │
│  changer 2 next Friday"     │
│                             │
├─────────────────────────────┤
│ Parsed:                     │
│ Task: Replace filter        │
│ Location: Dover Ch.2        │
│ Due: Friday                 │
├─────────────────────────────┤
│ [Re-record] [Edit] [Save]   │
└─────────────────────────────┘
```

### **3.4 Parts Lookup Interface**
```
┌─────────────────────────────┐
│ Parts & Equipment           │
├─────────────────────────────┤
│ Search: [Water valve...]    │
├─────────────────────────────┤
│ Inventory Status            │
│ 🔴 Water Valves (2 left)    │
│ 🟡 Drive Belts (5 left)     │
│ 🟢 Door Seals (8 left)      │
├─────────────────────────────┤
│ Recent Purchases            │
│ • Dexter valve #9379-183    │
│   $67.50 - Alliance Laundry │
│ • Huebsch belt #44207       │
│   $23.80 - Parts Town      │
├─────────────────────────────┤
│ [Troubleshooting] [Suppliers]│
└─────────────────────────────┘
```

---

## **4. Visual Design System**

### **4.1 Color Palette**
```
Primary Colors:
- Primary Blue: #2563EB (buttons, links)
- Success Green: #16A34A (confirmations, success states)
- Warning Orange: #EA580C (alerts, low inventory)
- Error Red: #DC2626 (errors, critical alerts)

Neutral Colors:
- Dark Gray: #1F2937 (text, headers)
- Medium Gray: #6B7280 (secondary text)
- Light Gray: #F3F4F6 (backgrounds, borders)
- White: #FFFFFF (cards, modals)

Status Colors:
- Money Collection: #059669 (teal)
- Parts Management: #7C3AED (purple)
- Communications: #DB2777 (pink)
- To-Do Items: #2563EB (blue)
```

### **4.2 Typography**
```
Font Family: System UI stack
- iOS: -apple-system, BlinkMacSystemFont
- Android: "Roboto"
- Fallback: sans-serif

Font Sizes:
- H1 (Page Title): 24px, bold
- H2 (Section): 20px, semibold
- H3 (Subsection): 18px, medium
- Body: 16px, regular
- Small: 14px, regular
- Caption: 12px, regular

Line Heights:
- Headers: 1.2
- Body text: 1.5
- UI elements: 1.4
```

### **4.3 Spacing & Layout**
```
Grid System: 8px base unit

Spacing Scale:
- xs: 4px (0.5 units)
- sm: 8px (1 unit)
- md: 16px (2 units)
- lg: 24px (3 units)
- xl: 32px (4 units)
- 2xl: 48px (6 units)

Touch Targets:
- Minimum: 44px × 44px
- Preferred: 48px × 48px
- Spacing between: 8px minimum

Container Widths:
- Mobile: 100% with 16px padding
- Tablet: 768px max-width
- Desktop: 1024px max-width
```

---

## **5. Component Library**

### **5.1 Button Components**
```css
/* Primary Action Button */
.btn-primary {
  background: #2563EB;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  min-height: 48px;
  touch-action: manipulation;
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: #2563EB;
  border: 2px solid #2563EB;
  padding: 10px 22px;
}

/* Danger Button */
.btn-danger {
  background: #DC2626;
  color: white;
}

/* Icon Button */
.btn-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

### **5.2 Form Components**
```css
/* Input Field */
.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #E5E7EB;
  border-radius: 8px;
  font-size: 16px;
  min-height: 48px;
}

/* Textarea */
.form-textarea {
  min-height: 96px;
  resize: vertical;
}

/* Checkbox */
.form-checkbox {
  width: 24px;
  height: 24px;
  accent-color: #2563EB;
}

/* Radio Button */
.form-radio {
  width: 20px;
  height: 20px;
  accent-color: #2563EB;
}
```

### **5.3 Card Components**
```css
/* Standard Card */
.card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #E5E7EB;
}

/* Status Card */
.card-status {
  border-left: 4px solid;
  margin-bottom: 12px;
}

.card-success { border-left-color: #16A34A; }
.card-warning { border-left-color: #EA580C; }
.card-error { border-left-color: #DC2626; }
```

---

## **6. Interaction Design**

### **6.1 Touch Interactions**
```
Tap Gestures:
- Single tap: Primary action (select, open, confirm)
- Long press: Context menu or additional options
- Double tap: Quick action (e.g., mark complete)

Swipe Gestures:
- Swipe right: Mark as complete (to-do items)
- Swipe left: Delete or remove
- Pull to refresh: Update data

Voice Interactions:
- Tap mic icon: Start voice recording
- Voice commands: "Add task", "Complete item", "Call supplier"
- Voice feedback: Audio confirmation of actions
```

### **6.2 Loading States**
```css
/* Loading Spinner */
.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #E5E7EB;
  border-top: 2px solid #2563EB;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Skeleton Loading */
.skeleton {
  background: linear-gradient(90deg, #F3F4F6 25%, #E5E7EB 50%, #F3F4F6 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}
```

### **6.3 Feedback & Notifications**
```
Success States:
- Green checkmark animation
- Success message with auto-dismiss
- Haptic feedback (mobile)

Error States:
- Red error message
- Shake animation for invalid input
- Clear instructions for resolution

Loading States:
- Progress indicators for long operations
- Skeleton screens for data loading
- Timeout handling with retry options
```

---

## **7. Responsive Design**

### **7.1 Breakpoint Strategy**
```css
/* Mobile First Approach */
/* Base: 320px - 767px (Mobile) */
.container { padding: 16px; }

/* Tablet: 768px - 1023px */
@media (min-width: 768px) {
  .container { 
    max-width: 768px;
    margin: 0 auto;
    padding: 24px;
  }
}

/* Desktop: 1024px+ */
@media (min-width: 1024px) {
  .container { 
    max-width: 1024px;
    padding: 32px;
  }
  
  /* Two-column layout for desktop */
  .desktop-grid {
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: 32px;
  }
}
```

### **7.2 Mobile Optimization**
```
Performance:
- Minimize DOM manipulation
- Use CSS transforms for animations
- Lazy load non-critical components
- Optimize images for mobile screens

Touch Optimization:
- 44px minimum touch targets
- Adequate spacing between interactive elements
- Prevent zoom on input focus
- Smooth scrolling behavior

Accessibility:
- High contrast mode support
- Screen reader compatibility
- Voice navigation support
- Large text mode compatibility
```

---

## **8. Accessibility Features**

### **8.1 WCAG 2.1 Compliance**
```
Level AA Requirements:
- Color contrast ratio: 4.5:1 minimum
- Text resizable up to 200%
- Keyboard navigation support
- Alternative text for images
- Proper heading hierarchy
- Focus indicators visible

Voice Accessibility:
- Voice commands for all primary functions
- Audio feedback for confirmations
- Screen reader announcements
- Voice navigation shortcuts
```

### **8.2 Inclusive Design**
```
Motor Impairments:
- Large touch targets (48px recommended)
- Voice input alternatives
- Reduced motion preferences
- Sticky touch interfaces

Visual Impairments:
- High contrast mode
- Large text support
- Screen reader optimization
- Color-blind friendly palette

Cognitive Support:
- Clear navigation structure
- Consistent interaction patterns
- Progress indicators
- Error prevention and recovery
```

---

## **9. Performance Considerations**

### **9.1 Loading Performance**
```
Critical Path:
- Inline critical CSS
- Defer non-critical JavaScript
- Optimize font loading
- Minimize initial bundle size

Progressive Enhancement:
- Core functionality without JavaScript
- Enhanced features with JavaScript
- Offline capability with service workers
- Background sync for data updates
```

### **9.2 Runtime Performance**
```
Smooth Interactions:
- 60fps animations using CSS transforms
- Debounced input handling
- Virtual scrolling for large lists
- Efficient DOM updates

Memory Management:
- Cleanup event listeners
- Manage service worker cache
- Optimize image memory usage
- Clear unused data periodically
```

---

## **10. Design Tokens & Variables**

### **10.1 CSS Custom Properties**
```css
:root {
  /* Colors */
  --color-primary: #2563EB;
  --color-success: #16A34A;
  --color-warning: #EA580C;
  --color-error: #DC2626;
  --color-text: #1F2937;
  --color-text-secondary: #6B7280;
  --color-background: #F9FAFB;
  --color-surface: #FFFFFF;
  
  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  
  /* Typography */
  --font-size-sm: 14px;
  --font-size-base: 16px;
  --font-size-lg: 18px;
  --font-size-xl: 20px;
  --font-size-2xl: 24px;
  
  /* Borders */
  --border-radius: 8px;
  --border-radius-lg: 12px;
  --border-width: 1px;
  --border-width-thick: 2px;
  
# BTM Utility - UX/UI Design Specification

## Design Philosophy

### Core Principles
- **Mobile-First**: Designed for smartphone field workers with desktop admin access
- **Touch-Optimized**: 44px minimum touch targets, thumb-friendly navigation  
- **Field-Ready**: High contrast, readable in bright sunlight and various conditions
- **Voice-Enabled**: Minimal text input, voice commands for core functions
- **One-Handed**: Critical functions accessible with single hand operation

### Design Inspiration
Based on existing BTM Intercoms application (brianmickley.com/intercoms_new.html):
- Clean, button-based interface
- Immediate visual feedback
- Clear categorization of functions
- Minimal text, maximum clarity

---

## Information Architecture

```
BTM Utility App
├── 🏠 Dashboard (Quick Actions)
├── 💰 Money Collection (QR + Camera)
├── ✅ To-Do List (Voice + Touch)
├── 🔧 Parts & Equipment  
├── 📞 Communications (VOIP)
├── 📋 Phone Directory
├── 📹 Security Portal (Cameras + Climate)
└── ⚙️ Settings (Admin Only)
```

---

## Screen Layouts

### Home Dashboard
```
┌─────────────────────────────┐
│ BTM Utility        [⚙️ Config] │
├─────────────────────────────┤
│   💰 START COLLECTION       │
│  [Large QR Scanner Button]  │
├─────────────────────────────┤
│ 🎤 Voice To-Do  📞 Emergency │
├─────────────────────────────┤
│ Recent Activity             │
│ • Last collection: Fri 2PM  │
│ • 3 tasks due today         │
│ • ⚠️ Low: Air filters       │
├─────────────────────────────┤
│ 🔧 Parts  📡 Comms  📹 Portal │
└─────────────────────────────┘
```

### Money Collection Flow
```
Step 1: QR Scanner
┌─────────────────────────────┐
│ Money Collection - Scan QR  │
├─────────────────────────────┤
│     📷 CAMERA ACTIVE        │
│  ┌─────────────────────┐   │
│  │    [Live Camera]    │   │
│  │   Aim at QR Code    │   │
│  └─────────────────────┘   │
│                             │
│ 🔍 Detected: None           │
│ [Manual Entry] [Help]       │
└─────────────────────────────┘

Step 2: Counter Reading & Confirmation
┌─────────────────────────────┐
│ Peacock Ch.1 Hopper A       │
├─────────────────────────────┤
│ 📷 Counter Reading:         │
│ [1234] ✓ Confidence: 95%   │
├─────────────────────────────┤
│ Counting Mode:              │
│ ⚪ Quarters (4 = $1)        │
│ 🔵 Dollars (1 = $1) ✓      │
├─────────────────────────────┤
│ 💬 Comments:                │
│ [Optional notes field]      │
├─────────────────────────────┤
│ ☑️ Coins brought to office  │
├─────────────────────────────┤
│ [❌ Cancel] [✅ Submit & SMS] │
└─────────────────────────────┘
```

### Voice To-Do Entry
```
┌─────────────────────────────┐
│ Voice Task Entry            │
├─────────────────────────────┤
│                             │
│     🎤 TAP TO SPEAK         │
│       [Recording...]        │
│                             │
│ "Replace filter at Dover    │
│  changer 2 next Friday"     │
│                             │
├─────────────────────────────┤
│ ✅ Parsed Successfully:     │
│ Task: Replace filter        │
│ Location: Dover Ch.2        │
│ Due: Next Friday           │
│ Assigned: Brian            │
├─────────────────────────────┤
│ [🎤 Re-record] [✏️ Edit] [✅ Save] │
└─────────────────────────────┘
```

---

## Design System

### Color Palette
```css
:root {
  /* Primary Colors */
  --primary-blue: #2563EB;
  --success-green: #16A34A;
  --warning-orange: #EA580C; 
  --error-red: #DC2626;
  
  /* Functional Colors */
  --money-collection: #059669; /* Teal */
  --parts-management: #7C3AED; /* Purple */
  --communications: #DB2777;   /* Pink */
  --tasks: #2563EB;           /* Blue */
  --security-portal: #059669;  /* Teal */
  --climate-control: #EA580C;  /* Orange */
  
  /* Neutral Scale */
  --text-primary: #1F2937;
  --text-secondary: #6B7280;
  --background: #F9FAFB;
  --surface: #FFFFFF;
  --border: #E5E7EB;
}
```

### Typography Scale
```css
/* Mobile-optimized type scale */
--text-xs: 12px;   /* Captions */
--text-sm: 14px;   /* Small text */
--text-base: 16px; /* Body text */
--text-lg: 18px;   /* Subheadings */
--text-xl: 20px;   /* Section headers */
--text-2xl: 24px;  /* Page titles */

/* Line heights for readability */
--leading-tight: 1.2;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

### Component Library

#### Buttons
```css
/* Primary Action Button */
.btn-primary {
  background: var(--primary-blue);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  min-height: 48px;
  font-weight: 600;
  touch-action: manipulation;
}

/* Large Action Button (Money Collection) */
.btn-large {
  min-height: 64px;
  font-size: 18px;
  padding: 16px 32px;
}

/* Icon Button */
.btn-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Voice Button (Special) */
.btn-voice {
  background: var(--error-red);
  border-radius: 50%;
  width: 80px;
  height: 80px;
  animation: pulse 2s infinite;
}

.btn-voice.recording {
  animation: pulse-fast 0.5s infinite;
}
```

#### Form Elements
```css
/* Touch-optimized inputs */
.form-input {
  width: 100%;
  padding: 16px;
  border: 2px solid var(--border);
  border-radius: 8px;
  font-size: 16px; /* Prevents zoom on iOS */
  min-height: 48px;
}

/* Radio buttons for counting mode */
.radio-large {
  width: 24px;
  height: 24px;
  margin-right: 12px;
  accent-color: var(--primary-blue);
}

/* Checkbox for confirmations */
.checkbox-large {
  width: 20px;
  height: 20px;
  margin-right: 12px;
  accent-color: var(--primary-blue);
}
```

#### Cards & Layout
```css
/* Content cards */
.card {
  background: var(--surface);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--border);
  margin-bottom: 16px;
}

/* Status cards with left border */
.card-status {
  border-left: 4px solid;
}

.card-success { border-left-color: var(--success-green); }
.card-warning { border-left-color: var(--warning-orange); }
.card-error { border-left-color: var(--error-red); }
```

---

## Interaction Patterns

### Touch Gestures
- **Single Tap**: Primary action (select, confirm, open)
- **Long Press**: Context menu or additional options  
- **Swipe Right**: Mark as complete (tasks)
- **Swipe Left**: Delete or remove
- **Pull to Refresh**: Update data

### Voice Interactions
- **Tap Microphone**: Start voice recording
- **Commands**: "Add task", "Complete", "Call supplier"
- **Feedback**: Audio confirmation of voice actions

### Visual Feedback
- **Button Press**: Scale down to 98% with haptic feedback
- **Loading States**: Spinner with descriptive text
- **Success**: Green checkmark animation
- **Error**: Red shake animation with clear message

---

## Responsive Breakpoints

```css
/* Mobile First (320px - 767px) */
.container {
  padding: 16px;
  max-width: 100%;
}

/* Tablet (768px - 1023px) */
@media (min-width: 768px) {
  .container {
    max-width: 768px;
    margin: 0 auto;
    padding: 24px;
  }
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
  .container {
    max-width: 1024px;
    padding: 32px;
  }
  
  /* Two-column layout */
  .desktop-grid {
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: 32px;
  }
}
```

---

## Accessibility Features

### WCAG 2.1 AA Compliance
- **Color Contrast**: 4.5:1 minimum ratio
- **Touch Targets**: 44px minimum size
- **Focus Indicators**: Visible focus rings
- **Screen Reader**: Proper ARIA labels and roles
- **Keyboard Navigation**: Tab order and shortcuts

### Voice Accessibility
- **Voice Commands**: All primary functions
- **Audio Feedback**: Confirmation of actions
- **Screen Reader**: Optimized announcements

### Field Work Considerations  
- **High Contrast**: Readable in bright sunlight
- **Large Text**: Support for enlarged system fonts
- **Glove-Friendly**: Large touch targets work with work gloves
- **One-Handed**: All functions reachable with thumb

---

## Animation & Micro-interactions

```css
/* Smooth transitions */
:root {
  --transition-fast: 150ms ease;
  --transition-base: 250ms ease;
  --transition-slow: 350ms ease;
}

/* Button interactions */
.btn:active {
  transform: scale(0.98);
  transition: transform 100ms ease;
}

/* Success animation */
@keyframes checkmark {
  0% { stroke-dashoffset: 100; }
  100% { stroke-dashoffset: 0; }
}

/* Loading pulse */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Recording indicator */
@keyframes pulse-fast {
  0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(220, 38, 38, 0); }
  100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
}
```

---

## Progressive Web App Features

### PWA Manifest
```json
{
  "name": "BTM Utility",
  "short_name": "BTM",
  "description": "Laundromat management utility",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#F9FAFB",
  "theme_color": "#2563EB",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

### Offline Experience
- **Service Worker**: Cache critical assets
- **Local Storage**: Offline form data
- **Sync Indicators**: Show when data needs to sync
- **Offline Banner**: Notify users of connection status

This design specification provides the foundation for creating a mobile-first, field-ready application that meets the specific needs of BTM Inc.'s laundromat operations while following modern UX/UI best practices.100ms ease;
}

/* Success Checkmark Animation */
@keyframes checkmark {
  0% { stroke-dashoffset: 100; }
  100% { stroke-dashoffset: 0; }
}

.checkmark-animation {
  stroke-dasharray: 100;
  animation: checkmark 0.6s ease-in-out;
}
```

### **11.2 Loading Animations**
```css
/* Pulse Animation for Loading States */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.loading-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Shimmer Effect for Skeleton Loading */
@keyframes shimmer {
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
}

.skeleton-shimmer {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200px 100%;
  animation: shimmer 1.5s infinite;
}
```

---

## **12. Voice Interface Design**

### **12.1 Voice Interaction Patterns**
```
Voice Commands Structure:
- Wake phrase: "Hey BTM" (optional)
- Action phrase: "Add task", "Complete", "Call"
- Context: Location, item, or person
- Confirmation: "Yes", "No", "Cancel"

Example Flows:
1. "Add task replace filter at Dover"
   → "Task added: Replace filter at Dover. When should this be done?"
   → "Next Friday"
   → "Task scheduled for Friday. Anything else?"

2. "Mark complete water valve repair"
   → "Marked complete: Water valve repair. Good job!"

3. "Call Parts Town"
   → "Calling Parts Town at 555-0123"
```

### **12.2 Voice Feedback Design**
```css
/* Voice Recording Indicator */
.voice-recording {
  position: relative;
  background: #DC2626;
  border-radius: 50%;
  animation: pulse-red 1s infinite;
}

@keyframes pulse-red {
  0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(220, 38, 38, 0); }
  100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
}

/* Voice Waveform Visualization */
.voice-waveform {
  display: flex;
  align-items: center;
  gap: 2px;
  height: 32px;
}

.waveform-bar {
  width: 3px;
  background: var(--color-primary);
  border-radius: 2px;
  animation: waveform 1.2s ease-in-out infinite;
}

@keyframes waveform {
  0%, 100% { height: 4px; }
  50% { height: 24px; }
}
```

---

## **13. Error Handling & Edge Cases**

### **13.1 Error State Design**
```css
/* Error Message Component */
.error-message {
  background: #FEF2F2;
  border: 1px solid #FECACA;
  color: #991B1B;
  padding: 12px 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.error-icon {
  color: #DC2626;
  flex-shrink: 0;
}

/* Network Offline Indicator */
.offline-banner {
  background: #FCD34D;
  color: #92400E;
  text-align: center;
  padding: 8px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: var(--z-notification);
}
```

### **13.2 Empty States**
```html
<!-- Empty To-Do List -->
<div class="empty-state">
  <div class="empty-icon">📝</div>
  <h3>No tasks yet</h3>
  <p>Tap the microphone to add your first task</p>
  <button class="btn-primary">Add Task</button>
</div>

<!-- No Parts Found -->
<div class="empty-state">
  <div class="empty-icon">🔧</div>
  <h3>No parts found</h3>
  <p>Try adjusting your search or check inventory</p>
  <button class="btn-secondary">View All Parts</button>
</div>
```

---

## **14. Progressive Web App Features**

### **14.1 PWA Manifest**
```json
{
  "name": "BTM Utility",
  "short_name": "BTM",
  "description": "Laundromat management and collection utility",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#F9FAFB",
  "theme_color": "#2563EB",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### **14.2 Offline Experience**
```css
/* Offline Mode Styling */
.offline-mode {
  opacity: 0.7;
  pointer-events: none;
}

.offline-mode::after {
  content: "Offline";
  position: absolute;
  top: 8px;
  right: 8px;
  background: #6B7280;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

/* Sync Pending Indicator */
.sync-pending {
  border-left: 4px solid #F59E0B;
}

.sync-pending::before {
  content: "⏳";
  margin-right: 8px;
}
```

---

## **15. Testing & Quality Assurance**

### **15.1 Usability Testing Checklist**
```
Mobile Device Testing:
□ iPhone Safari (iOS 15+)
□ Android Chrome (Android 10+)
□ Samsung Internet
□ Mobile Firefox

Touch Interaction Testing:
□ All buttons minimum 44px
□ No accidental touches
□ Swipe gestures work correctly
□ Voice commands recognized
□ Camera access functions

Field Testing Scenarios:
□ Bright sunlight readability
□ One-handed operation
□ Gloved hands interaction
□ Voice recognition in noisy environments
□ Poor network connectivity
```

### **15.2 Accessibility Testing**
```
Screen Reader Testing:
□ VoiceOver (iOS)
□ TalkBack (Android)
□ NVDA (Windows)

Keyboard Navigation:
□ Tab order logical
□ All functions accessible
□ Focus indicators visible
□ Skip links provided

Color & Contrast:
□ 4.5:1 contrast ratio minimum
□ Color not sole indicator
□ High contrast mode support
□ Color blindness simulation
```

This completes the comprehensive UX/UI design document. Now I'll create the API contract document.