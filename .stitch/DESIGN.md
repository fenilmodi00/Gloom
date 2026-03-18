# DESIGN.md — StyleAI Visual System

**Generated:** 2026-03-18
**Source:** Stitch Project `2130669729540096352`

---

## 1. Design Overview

Mobile-first fashion inspiration app with clean, modern aesthetic. The design uses a layered approach with:
- Light, airy backgrounds
- Bold accent color (#91bd0f - lime green)
- Rounded corners (12px radius)
- Manrope font family

---

## 2. Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| Background | #F5F2EE | Main app background |
| Surface | #FFFFFF | Cards, sheets |
| Text Primary | #1A1A1A | Headlines, body text |
| Text Secondary | #6B6B6B | Captions, metadata |
| Accent | #91bd0f | Primary actions, highlights |
| Accent Light | #D4C5B0 | Subtle backgrounds |
| Error | #C0392B | Error states |
| Success | #27AE60 | Success states |

---

## 3. Typography

**Font Family:** Manrope

| Style | Weight | Size | Line Height |
|-------|--------|------|-------------|
| H1 | Bold | 28px | 1.2 |
| H2 | Bold | 24px | 1.3 |
| H3 | SemiBold | 20px | 1.4 |
| Body | Regular | 16px | 1.5 |
| Caption | Regular | 14px | 1.4 |
| Small | Regular | 12px | 1.3 |

---

## 4. Spacing

| Token | Value |
|-------|-------|
| xs | 4px |
| sm | 8px |
| md | 16px |
| lg | 24px |
| xl | 32px |
| 2xl | 48px |

---

## 5. Border Radius

| Token | Value |
|-------|-------|
| sm | 8px |
| md | 12px |
| lg | 16px |
| xl | 24px |
| full | 9999px |

---

## 6. Component Patterns

### Cards
- Background: Surface (#FFFFFF)
- Border Radius: xl (24px)
- Shadow: Subtle drop shadow
- Padding: lg (24px)

### Buttons
- Primary: Accent background, white text
- Secondary: Surface background, Accent border
- Border Radius: full (pill shape)

### Bottom Sheet
- Background: Surface (#FFFFFF)
- Top corners: xl (24px)
- Drag handle: Centered, muted color

---

## 7. Design System Notes for Stitch Generation

When generating new screens with Stitch, include this design system block:

```
**DESIGN SYSTEM:**
- Color Mode: LIGHT
- Primary Color: #91bd0f (lime green)
- Background: #F5F2EE
- Surface: #FFFFFF
- Text Primary: #1A1A1A
- Text Secondary: #6B6B6B
- Font: MANROPE
- Border Radius: 12px (ROUND_TWELVE)
- Card Radius: 24px
- Style: Modern, clean, fashion-focused
- Mobile-first design
- Use subtle shadows, avoid heavy effects
- Accent color for CTAs and highlights
```

---

## 8. Mobile Layout Guidelines

### Screen Dimensions
- Target: 390 x 844 (iPhone 14 standard)
- Safe areas: 47px top, 34px bottom

### Navigation
- Bottom tab bar with 4-5 items
- Icon + label format
- Active state: Accent color

### Content
- Full-width cards with 16px margins
- Horizontal scroll sections for carousels
- Vertical scroll for main content
