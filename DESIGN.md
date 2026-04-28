# Design System Specification: The Curated Spotlight — Remix v2

## 1. Overview & Creative North Star

**Creative North Star: The Digital Curator, Remixed**

This is a forward evolution of the original Curated Spotlight system. The theatrical DNA is preserved — deep, immersive surfaces, dramatic Manrope typography, and a no-hard-borders philosophy — but the system is now more energetic, more expressive, and more alive.

Key departures from v1:
- **Purple-tinted surfaces** replace neutral grays, adding warmth and depth across all layers
- **Richer primary purple** with higher chroma for more presence and glow
- **New Live accent** (coral/red) for on-air, urgent, and real-time states
- **Generous base radius** (1rem) for a modern, approachable feel without being bubbly
- **Manrope pushed harder** at display scale — tighter tracking, bolder weight contrast

---

## 2. Colors: Light, Shadow, and Energy

The palette extends the "backstage atmosphere" with three distinct accent families, each with a `*-subtle` fill variant for contained/tinted states.

### Surface Hierarchy (purple-tinted)
All surfaces carry a subtle purple hue (`oklch(… 0.016 282)`) instead of neutral grays. This creates cohesion with the primary accent and gives depth a warmth that pure black lacks.

| Token | Value | Usage |
|---|---|---|
| `--surface` | `oklch(0.08 0.016 282)` | Base stage — page background |
| `--surface-container-low` | `oklch(0.10 0.016 282)` | Sidebar, structural blocks |
| `--surface-container` | `oklch(0.13 0.016 282)` | Cards, panels |
| `--surface-container-high` | `oklch(0.16 0.016 282)` | Inputs, hover states |
| `--surface-container-highest` | `oklch(0.21 0.016 282)` | Active states, tooltips |

### Brand Accents

**Primary — Stage Light Purple**
`oklch(0.68 0.26 292)` — Richer, more saturated than v1. Used for primary CTAs, active nav, focus rings, and key focal points. Gradient CTAs go from `primary` → `stage-purple-dim` (`oklch(0.58 0.20 292)`).

**Secondary — Spotlight Cold**
`oklch(0.85 0.15 220)` — Secondary colour, nice cold contrast to stage light purple.

**Third — Spotlight Gold**
`oklch(0.82 0.17 82)` — Reserved for premium status, VIP indicators, and the `tertiary` button variant. Never use for body text.

**Live — On-Air Coral** *(new in v2)*
`oklch(0.68 0.22 14)` — Used exclusively for real-time / on-air states: live badge, live button variant, equipment conflicts, and overdue alerts. Always paired with its `--live-subtle` fill (`oklch(0.68 0.22 14 / 12%)`).

### The "No-Line" Rule (preserved)
**1px solid borders are prohibited for sectioning.** Use background shifts between surface tiers instead. The only exceptions are:
- `border-input` (form ghost border at 12% opacity) for accessibility
- `border-live/25` on live-state components

---

## 3. Typography: Editorial Authority

Dual-font strategy: Manrope for display/headings, Inter for body/UI.

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

**Card titles** use `font-heading font-semibold` (Manrope 600) for more presence than v1's `font-medium`.

---

## 4. Elevation & Depth: Tonal Layering

No hard shadows. Hierarchy through surface tier progression. Purple tinting in the surfaces means each layer feels physically separated — like stage lighting falling off across depth.

**Floating elements** (modals, nav bar): `backdrop-blur-xl` + surface at 70–80% opacity.

**Ambient shadow** (when truly needed for modals): `box-shadow: 0 40px 60px oklch(0 0 0 / 0.35)` — never pure black, generous blur.

---

## 5. Radius Scale

Base radius bumped from `0.625rem` to **`1rem`** in v2. All scale tokens are derived from this base.

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
- **Default (primary):** Gradient `primary → stage-purple-dim`. Hover adds a `0 4px 20px oklch(0.68 0.26 292 / 0.25)` glow. `font-semibold`.
- **Secondary:** Ghost with `border-white/15` and `rounded-2xl`. More generous rounding than primary.
- **Outline:** `bg-surface-high` fill — for inline tertiary actions.
- **Ghost:** No background, hover to `bg-surface-high`. Nav items and icon buttons.
- **Tertiary:** Gold text-only (`text-spotlight-gold`), no background. VIP, premium, or high-value text links.
- **Live (new):** `bg-live-subtle text-live border-live/25`. For "Go Live", "Start broadcast", urgent actions.
- **Destructive:** `bg-destructive/10` tint. Always provide a confirmation step before executing.
- **Size xl (new):** `h-11 px-6 rounded-xl` — for hero CTAs.

### Badges / Status Pills
All-caps, 0.05em tracking, `rounded-full`. The `live` variant supports an animated pulse dot:

```tsx
<Badge variant="live">
  <span className="inline-block size-1.5 rounded-full bg-live animate-pulse mr-0.5" />
  Live now
</Badge>
```

### Cards
- `rounded-2xl` (up from `rounded-xl` in v1)
- `hover:bg-surface-high` transition — no border, no shadow
- `CardTitle` uses `font-heading font-semibold`
- `CardFooter` uses `bg-surface-high` as a subtle footer tray

### Inputs
- Height bumped to `h-9` (up from `h-8`) for better touch targets
- `bg-surface-high` base — clearly elevated above card backgrounds
- `rounded-lg` (1rem) — matches the new base radius
- Placeholder at 60% muted opacity (`placeholder:text-muted-foreground/60`)
- Focus: `border-ring` + `ring-ring/20` — softer ring than before

### Navigation (NavLink)
- `rounded-lg` on hover state (was `rounded-md`)
- Active glow bar updated to new primary: `oklch(0.68 0.26 292 / 0.45)`
- Inactive hover: `text-foreground` (was `text-primary`) — less aggressive

---

## 7. Live Dot Animation

The live pulse dot should use Tailwind's `animate-pulse` or a custom keyframe:

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
- **Do** let surfaces breathe. The tonal layering only works with generous spacing.
- **Do** use gradient CTAs for primary actions. The glow is the signature.
- **Do** use `rounded-2xl` for cards and `rounded-lg` for inputs consistently.

### Don't
- **Don't** use 1px borders to separate sections. Background shifts only.
- **Don't** use `--live` for generic "delete" or "error" states — use `--destructive`. Live = on-air urgency.
- **Don't** use neutral `oklch(0.x 0 0)` surfaces — always use the purple-tinted equivalents.
- **Don't** use harsh, 100% opaque shadows.
- **Don't** use `surface_bright` for large backgrounds.
- **Don't** invent new accent colors — use primary, gold, or live. If none fit, use muted.
