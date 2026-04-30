# Design System Specification: The Curated Spotlight — Remix v2.1

## 1. Overview & Creative North Star

**Creative North Star: The Digital Curator, Remixed**

This is a forward evolution of the original Curated Spotlight system. The theatrical DNA is preserved — deep, immersive surfaces, dramatic Manrope typography, and a no-hard-borders philosophy — but the system is now more energetic, more expressive, and more alive.

v2.1 extends the system with a **Light Mode** — a state that transforms the theatrical "backstage" atmosphere into a bright, airy gallery. The system retains its editorial authority through extreme typographic scale and a no-border philosophy, but uses subtle purple-toned whites to create depth in daylight.

Key departures from v1:
- **Purple-tinted surfaces** replace neutral grays, adding warmth and depth across all layers — in both modes
- **Richer primary purple** with higher chroma for more presence and glow
- **New Live accent** (coral/red) for on-air, urgent, and real-time states
- **Generous base radius** (1rem) for a modern, approachable feel without being bubbly
- **Manrope pushed harder** at display scale — tighter tracking, bolder weight contrast
- **Light Mode (v2.1):** Pure white cards against lightly toned backgrounds — elevation through inversion rather than darkness

---

## 2. Colors: Light, Shadow, and Energy

All surfaces in both modes carry a subtle purple hue (`hue 282`) to avoid flat grays and maintain cohesion with the primary accent.

### Surface Hierarchy

| Token | Dark Mode | Light Mode | Usage |
|---|---|---|---|
| `--surface` | `oklch(0.08 0.016 282)` | `oklch(0.98 0.008 282)` | Base stage — page background |
| `--surface-container-low` | `oklch(0.10 0.016 282)` | `oklch(0.96 0.012 282)` | Sidebar, structural blocks |
| `--surface-container` | `oklch(0.13 0.016 282)` | `oklch(1.00 0 0)` | **Pure white in light.** Cards, panels |
| `--surface-container-high` | `oklch(0.16 0.016 282)` | `oklch(0.94 0.016 282)` | Inputs, hover states |
| `--surface-container-highest` | `oklch(0.21 0.016 282)` | `oklch(0.90 0.020 282)` | Active states, tooltips |

**Light Mode elevation logic:** Pure white (`--surface-container`) is the highest point for cards, while the background is slightly toned — the inverse of dark mode. Cards float off the background through brightness, not darkness.

### Brand Accents

**Primary — Stage Light Purple**
- Dark: `oklch(0.68 0.26 292)` — rich, saturated. Gradient CTAs go from `primary` → `stage-purple-dim` (`oklch(0.58 0.20 292)`).
- Light: `oklch(0.55 0.22 292)` — slightly darker for WCAG contrast on white backgrounds. Same gradient range applies.

**Secondary — Spotlight Cold**
- Dark: `oklch(0.85 0.15 220)`
- Light: `oklch(0.45 0.12 220)` — darkened for text and icon use on light surfaces.

**Third — Spotlight Gold**
`oklch(0.82 0.17 82)` — Reserved for premium status and VIP indicators. Never use for body text.

**Live — On-Air Coral**
- Dark: `oklch(0.68 0.22 14)`
- Light: `oklch(0.60 0.20 14)` — slightly deeper for contrast. Always paired with `--live-subtle` fill (`oklch(0.68 0.22 14 / 12%)`).

### Foreground / Text

| Role | Dark Mode | Light Mode |
|---|---|---|
| Primary foreground | `oklch(0.97 0.005 282)` | `oklch(0.25 0.02 282)` — deep purple-tinted near-black |
| Body text | `oklch(0.97 0.005 282)` | `oklch(0.35 0.015 282)` — softer contrast for long-form reading |
| Muted foreground | `oklch(0.55 0.010 282)` | `oklch(0.55 0.010 282)` — same; sits naturally in both modes |

Never use pure black (`oklch(0 0 0)`) or pure neutral grays in light mode — everything carries a touch of purple.

### The "No-Line" Rule (preserved across both modes)
**1px solid borders are prohibited for sectioning.** Use background shifts between surface tiers instead. Exceptions:
- `border-input` (form ghost border at 12% opacity) for accessibility
- `border-live/25` on live-state components

---

## 3. Typography: Editorial Authority

Dual-font strategy: Manrope for display/headings, Inter for body/UI. Scale is unchanged between modes.

| Scale | Font | Size | Weight | Tracking |
|---|---|---|---|---|
| Display | Manrope | 3.5rem | 800 | -0.04em |
| H1 | Manrope | 2.25rem | 800 | -0.03em |
| H2 | Manrope | 1.5rem | 700 | -0.025em |
| H3 | Manrope | 1.125rem | 700 | -0.015em |
| Title | Manrope | 1rem | 600 | -0.01em |
| Body LG | Inter | 1rem | 400 | 0 |
| Body | Inter | 0.9375rem | 400 | 0 |
| Body SM | Inter | 0.875rem | 400 | 0 |
| Label | Inter | 0.8125rem | 500 | 0 |
| Caption | Inter | 0.75rem | 400 | 0 |
| Micro | Inter | 0.6875rem | 600 | 0.08em |

**Light Mode heading color:** `oklch(0.25 0.02 282)` — deep purple-tinted near-black instead of pure black for a premium feel.

**Card titles** use `font-heading font-semibold` (Manrope 600) in both modes.

---

## 4. Elevation & Depth: Tonal Layering

**Dark Mode:** No hard shadows. Hierarchy through surface tier progression — each layer feels physically separated, like stage lighting falling off across depth.

**Light Mode:** Same no-border philosophy, but elevation inverts — cards are brighter (pure white) against a toned background. Depth is implied through the background color rather than through shadow.

**Ambient shadow:**
- Dark: `box-shadow: 0 40px 60px oklch(0 0 0 / 0.35)` — generous blur, never pure black
- Light: `box-shadow: 0 20px 40px oklch(0.20 0.02 282 / 0.06)` — very soft, purple-tinted

**Floating elements** (modals, nav bar): `bg-white/70` + `backdrop-blur-xl` in light mode; `bg-surface/80` + `backdrop-blur-xl` in dark mode.

---

## 5. Radius Scale

Base radius: **`1rem`** in both modes. All scale tokens derive from this base.

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | ~0.375rem | Tags, small chips |
| `--radius-md` | ~0.625rem | Buttons (default), form elements |
| `--radius-lg` | 1rem | Inputs, nav items |
| `--radius-xl` | 1.5rem | Cards, panels |
| `--radius-2xl` | 2rem | Large cards, modals |
| `--radius-full` | 9999px | Badges, avatars, pills |

---

## 6. Components

### Buttons
- **Default (primary):** Gradient `primary → stage-purple-dim`. Hover adds a `0 4px 20px oklch(0.68 0.26 292 / 0.25)` glow. `font-semibold`. Light mode uses the adjusted primary (`0.55 0.22 292`) with white text.
- **Secondary:** Ghost with `border-white/15` in dark; `border-black/10` in light. `rounded-2xl`.
- **Outline:** `bg-surface-high` fill — for inline tertiary actions.
- **Ghost:** No background, hover to `bg-surface-high`. Nav items and icon buttons.
- **Tertiary:** Gold text-only (`text-spotlight-gold`), no background. VIP, premium, or high-value text links.
- **Live:** `bg-live-subtle text-live border-live/25`. For urgent, real-time actions.
- **Destructive:** `bg-destructive/10` tint. Always provide a confirmation step before executing.
- **Size xl:** `h-11 px-6 rounded-xl` — for hero CTAs.

### Badges / Status Pills
All-caps, 0.05em tracking, `rounded-full`. The `live` variant supports an animated pulse dot:

```tsx
<Badge variant="live">
  <span className="inline-block size-1.5 rounded-full bg-live animate-pulse mr-0.5" />
  Live now
</Badge>
```

### Cards
- `rounded-2xl`
- Dark: `hover:bg-surface-high` — no border, no shadow
- Light: `bg-white` with soft purple-tinted shadow (`0 20px 40px oklch(0.20 0.02 282 / 0.06)`) — no border
- `CardTitle` uses `font-heading font-semibold`
- `CardFooter` uses `bg-surface-high` as a subtle footer tray

### Inputs
- Height: `h-9`
- `bg-surface-high` base — clearly elevated above card backgrounds in dark; "inset" effect on white cards in light
- `rounded-lg` (1rem)
- Placeholder at 60% muted opacity (`placeholder:text-muted-foreground/60`)
- Focus: `border-ring` + `ring-ring/20`

### Navigation (NavLink)
- `rounded-lg` on hover state
- Active glow bar: `oklch(0.68 0.26 292 / 0.45)` in dark; `oklch(0.55 0.22 292 / 0.35)` in light
- Inactive hover: `text-foreground`

---

## 7. Live Dot Animation

```css
@keyframes live-pulse {
  0%, 100% { box-shadow: 0 0 0 0 oklch(0.68 0.22 14 / 0.6); }
  50%       { box-shadow: 0 0 0 4px oklch(0.68 0.22 14 / 0); }
}
```

Use on any `size-1.5 rounded-full bg-live` element inside a `live` badge or nav indicator.

---

## 8. Do's and Don'ts

### Do
- **Do** use extreme typographic scale. 3.5rem display next to 0.75rem caption = editorial authority.
- **Do** use `--live` for anything real-time. It's the system's urgency signal — keep it meaningful.
- **Do** let surfaces breathe. Tonal layering only works with generous spacing.
- **Do** use gradient CTAs for primary actions. The glow is the signature.
- **Do** use `rounded-2xl` for cards and `rounded-lg` for inputs consistently.
- **Do** use pure white on cards in light mode — maximum separation from the toned background.
- **Do** let the purple undertone live in shadows in light mode — avoids "dirty" grays.

### Don't
- **Don't** use 1px borders to separate sections. Background shifts only.
- **Don't** use `--live` for generic "delete" or "error" states — use `--destructive`. Live = on-air urgency.
- **Don't** use neutral `oklch(0.x 0 0)` surfaces — always use the purple-tinted equivalents.
- **Don't** use harsh, 100% opaque shadows.
- **Don't** use pure black (`oklch(0 0 0)`) text in light mode — it breaks the soft purple palette.
- **Don't** invent new accent colors — use primary, gold, or live. If none fit, use muted.
