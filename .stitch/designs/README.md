# Stitch Designs - Aesty Inspo Screen

## Project: Aesty Inspo Screen
**ID:** `2130669729540096352`
**Device:** Mobile (iOS/Android)

---

## Screen: Inspo Screen - Layered Design V3
**ID:** `30c2f61ef4314aedb7ae43963fdcbd6e`
**Dimensions:** 688 x 1559 (Mobile)

### Design Description
A layered mobile fashion inspiration screen featuring:
- **Top Section:** Clean header with title and action buttons
- **Main Content:** Swipeable model carousel with 3D perspective
- **Bottom Sheet:** Two horizontally swipeable sub-screens with dot indicator

### Key Features
1. **Two Sub-Screens Inside Bottom Sheet**
   - Sub-screen 1: Model Carousel (3D perspective scroll)
   - Sub-screen 2: (To be implemented)
   - Dot indicator at top shows active sub-screen

2. **Model Carousel (3D Perspective)**
   - Center card: Full size, opacity 1.0, scale 1.0
   - Side cards: Scale 0.82, opacity 0.55, partially hidden
   - 3D depth/parallax feel (iOS cover flow style)

### Implementation Files
- `components/inspo/ModelCarousel.tsx` - 3D perspective carousel
- `types/inspo.ts` - ModelCard interface

### Design Tokens
```
Background: #F5F2EE
Surface: #FFFFFF
Text Primary: #1A1A1A
Text Secondary: #6B6B6B
Accent: #8B7355
Accent Light: #D4C5B0
Error: #C0392B
Success: #27AE60
```

### Card Dimensions
- Card Width: 72% screen width
- Card Height: Width × 1.35 (aspect ratio ~3:4)
- Card Spacing: 16px
- Corner Radius: 24px

### Note
Stitch screenshots require Google authentication. The design reference above documents the key specifications from the Stitch project metadata.
