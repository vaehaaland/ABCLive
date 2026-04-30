# ABCLive Design System

> **"The Curated Spotlight — Remix v2.1"**
> A theatrical, editorial design language for live-sound production tooling.

## Product Overview

**ABCLive** is ABC Studio's internal planning tool for live sound assignments. It supports gig planning for single-day assignments and multi-day festivals, festival program scheduling, personnel and equipment assignment, file attachments, flat-threaded gig comments, mention-driven in-app notifications, public password-protected festival reports, and superadmin user management.

The app is written in **Norwegian (Nynorsk)** — copy uses words like *Oppdrag* (assignments), *Personell*, *Kalender*, *Ressursar*.

### Products / Surfaces
| Surface | Description |
|---|---|
| **Dashboard App** | Authenticated SPA — gigs, calendar, equipment, admin |
| **Public Festival Reports** | Password-protected, print-ready PDF report views |
| **Login / Auth** | Minimal auth pages (login, forgot password, reset password) |

---

## Sources

| Source | Path / URL |
|---|---|
| Codebase | `ABCLive/` (mounted via File System Access API) |
| GitHub repo | `github.com/AVH-Production/ABCLive` (branch: `master`) |
| Design specification | `ABCLive/DESIGN.md` |
| Gem icon | `uploads/gemIcon.png` → `assets/gemIcon.png` |

---

## CONTENT FUNDAMENTALS

### Language & Tone
- **Language**: Norwegian Nynorsk. UI copy is terse and functional. No fluff.
- **Casing**: Title case for navigation labels (*Oppdrag, Kalender, Ressursar*). Sentence case for descriptions and labels. All-caps + wide tracking for micro labels and badge text.
- **Voice**: Institutional but direct — no "you" or "I", just task-oriented labels. Think backstage production sheet, not consumer app.
- **Emoji**: Never used in the UI. Emoji-free.
- **Numbers**: Dates in Norwegian `d. MMM yyyy` format (e.g., *3. jan 2025*).
- **Status labels**: `draft` → *Utkast*, `confirmed` → *Bekrefta*, `completed` → *Fullført*, `cancelled` → *Avlyst*.
- **Week groupings**: *Denne veka*, *Neste veke*, *Seinare* — temporal, not hierarchical.

### Copy Examples
- `"Nytt arrangement"` — New gig CTA
- `"Ingen personell"` — Warning badge for unstaffed gigs
- `"Oppdragsplanlegging for ABC Studio og Alvsvåg AS"` — App tagline
- `"Denne veka"`, `"Neste veke"` — Timeline group headers

---

## VISUAL FOUNDATIONS

### Philosophy: The Curated Spotlight
Deep, immersive dark surfaces evoke a backstage environment. Everything is lit deliberately — purple-tinted surfaces avoid flat grays, maintaining cohesion with the primary accent. Dramatic Manrope display typography creates editorial authority.

### Color System
- **Hue 282** — all surfaces carry a subtle purple tint. Never neutral gray.
- **Primary**: Stage Light Purple `oklch(0.68 0.26 292)` — rich, saturated. Gradient CTAs from `primary → stage-purple-dim`.
- **Gold**: Spotlight Gold `oklch(0.82 0.17 82)` — reserved for premium/VIP indicators. Never body text.
- **Cold**: Spotlight Cold Blue `oklch(0.85 0.15 220)` — secondary accent.
- **Live / On-Air Coral**: `oklch(0.68 0.22 14)` — urgency only. Animated pulse dot.
- **Destructive**: `oklch(0.65 0.22 20)` — errors, delete actions.
- **Success**: `oklch(0.75 0.18 158)` — completed states.

### Typography
- **Display font**: Manrope — extrabold (800) at large scale, pushed hard with tight negative tracking.
- **Body font**: Inter — clean, neutral, comfortable at small sizes.
- No serif fonts. No decorative type.

### Backgrounds & Surfaces
- Five-tier tonal elevation system: `surface` → `surface-low` → `surface-container` → `surface-high` → `surface-highest`
- **No 1px dividers between sections** — background tonal shifts only.
- Dark mode: deep purple-tinted blacks, stage-like.
- Light mode: pure white cards on slightly purple-toned backgrounds (elevation through inversion).
- Floating elements: `backdrop-blur-xl` + semi-transparent surface.

### Borders
- Ghost borders only: `oklch(1 0 0 / 9%)` dark / `oklch(0 0 0 / 9%)` light.
- Inputs: `oklch(1 0 0 / 12%)` ghost border for accessibility.
- **No solid section dividers**.

### Shadows & Elevation
- Dark: `box-shadow: 0 40px 60px oklch(0 0 0 / 0.35)` — generous blur, never pure black.
- Light: `box-shadow: 0 20px 40px oklch(0.20 0.02 282 / 0.06)` — soft purple-tinted.
- Card hover: `0 8px 24px oklch(0 0 0 / 0.25)` + subtle `translateY(-1px)`.
- Primary button glow: `0 4px 20px oklch(0.68 0.26 292 / 0.25)`.

### Corner Radii
- Base: `1rem`. Cards: `rounded-2xl` (2rem). Inputs: `rounded-lg` (1rem). Buttons: `rounded-md` (~0.625rem). Badges/pills: `rounded-full`.

### Animation & Motion
- Subtle `transition-colors` on almost all interactive elements.
- Card hover: `transition-all`, slight lift (`-translate-y-px`) + shadow.
- Live dot: `live-pulse` keyframe animation — radial shadow bloom on coral dot.
- No bouncy spring animations. No aggressive motion. Easing is implicit (CSS default).

### Hover / Press States
- Hover: surface tier upgrade (`surface-container` → `surface-high`).
- Primary button hover: `opacity-90` + purple glow.
- Card hover: `surface-high` fill + lift + shadow.
- Nav item hover: `surface-high` tint.

### Iconography
Lucide icons throughout — see ICONOGRAPHY section below.

### Color Vibe of Imagery
Dark, moody, stage-lit. Purple and blue tones dominate. No warm or bright photography. Think concert photography: deep shadows, colored stage lights, theatrical contrast.

### Cards
- `rounded-2xl`, `bg-surface-container`, hover to `surface-high`.
- Left accent bar (3px, full height) color-coded by gig status.
- Card footer: `bg-surface-high` as a subtle tray.
- No card border in dark mode; soft shadow in light mode.

### Layout Rules
- Sticky top nav: `h-[52px]`, `backdrop-blur-xl`, `bg-surface-low/85`.
- Main content: `px-4 py-8`.
- Grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` for card grids.
- Stats bar: `flex gap-px rounded-[0.875rem] overflow-hidden bg-border` — segments separated by 1px border gap.

### Use of Transparency & Blur
- Nav header: `bg-surface-low/85 backdrop-blur-xl`.
- Modals/floating: `bg-white/70` (light) or `bg-surface/80` (dark) + `backdrop-blur-xl`.
- Live badge fill: `oklch(0.68 0.22 14 / 12%)` — very subtle tint.

---

## ICONOGRAPHY

**Icon library**: [Lucide](https://lucide.dev) — stroke-weight icons, consistent 1.5px stroke.

Usage patterns:
- Icons always paired with text in buttons (size `size-4`).
- Inline with metadata: `size-3` with `text-muted-foreground`.
- Used icons: `CalendarIcon`, `MapPinIcon`, `BuildingIcon`, `LayoutGridIcon`, `ListIcon`, `PlusIcon`, `CloudUploadIcon`, `Cloud`, `SearchIcon`, `BellIcon`, `ChevronDownIcon`, `LogOutIcon`, `SunIcon`, `MoonIcon`.
- No icon fonts or SVG sprites — all imported as React components from `lucide-react`.
- Emoji: never used.
- Unicode chars: never used as icons.

**Brand icon**: `assets/gemIcon.png` — A dark circular icon with a cream/off-white calendar+people+clock motif. Used in the nav header at 28×28px, `rounded-full`.

---

## File Index

| Path | Description |
|---|---|
| `README.md` | This file — overview and design documentation |
| `colors_and_type.css` | All CSS custom properties for color + typography |
| `SKILL.md` | Agent skill definition for Claude Code |
| `assets/gemIcon.png` | App icon (gem calendar icon) |
| `preview/` | Design system preview cards (registered in Design System tab) |
| `ui_kits/abclive/` | High-fidelity UI kit — dashboard app |

### UI Kits
| Kit | Description |
|---|---|
| `ui_kits/abclive/index.html` | Interactive ABCLive dashboard prototype |

---

*Generated from: `ABCLive/` codebase + `ABCLive/DESIGN.md` + `uploads/gemIcon.png`*
