# Design System Specification: The Curated Spotlight

## 1. Overview & Creative North Star
**Creative North Star: The Digital Curator**
This design system is built to move beyond the utilitarian "grid of boxes" typical of event platforms. Instead, we treat the interface as a high-end editorial stage. Inspired by theatrical lighting and premium gallery catalogs, the system uses depth, light, and dramatic typography to guide the user through a curated journey.

We break the "template" look by embracing **intentional asymmetry** and **tonal layering**. Elements don't just sit on a page; they emerge from the shadows. By leveraging deep charcoals against vibrant stage-light accents, we create a sense of prestige and exclusivity suitable for world-class theater and conferences.

---

## 2. Colors: Light and Shadow
The palette is rooted in the "backstage" atmosphere—deep, immersive, and high-contrast.

*   **Primary (`#c59aff`):** Our "Stage Light Purple." This is used for high-importance actions and focal points.
*   **Secondary (`#feb700`):** Our "Spotlight Gold." Reserved for highlights, premium status, and secondary CTA accents.
*   **Neutral Foundation:** The core of the system is the `surface` (`#0e0e0e`). We avoid pure black to maintain a sophisticated, ink-like depth.

### The "No-Line" Rule
To achieve a signature premium feel, **1px solid borders are strictly prohibited for sectioning.** Boundaries must be defined through:
1.  **Background Shifts:** Placing a `surface-container-low` (`#131313`) element against a `surface` (`#0e0e0e`) background.
2.  **Tonal Transitions:** Using subtle shifts in the surface-container tiers to imply structure.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. Use the `surface-container` tiers to create "nested" depth:
*   **Surface:** The base stage.
*   **Surface-Container-Low:** For large structural blocks or section dividers.
*   **Surface-Container-Highest:** For high-priority interactive components like active cards or modals.

### The Glass & Gradient Rule
For floating elements (like navigation bars or hovering info chips), use **Glassmorphism**: 
*   **Tokens:** Use `surface_variant` at 60% opacity with a `20px` backdrop blur. 
*   **Signature Textures:** Apply a linear gradient from `primary` (`#c59aff`) to `primary_container` (`#ba88ff`) on main CTAs to provide a "glow" that mimics the soft falloff of a stage light.

---

## 3. Typography: Editorial Authority
The system utilizes a dual-font strategy to balance character with readability.

*   **Display & Headlines (Manrope):** Chosen for its geometric, architectural feel. Use `display-lg` (3.5rem) for hero event titles to create an "editorial poster" look. High tracking should be avoided; let the letterforms breathe through generous line-height.
*   **Body & Labels (Inter):** The workhorse. Inter provides crisp, functional clarity for event details, dates, and ticket information. 
*   **Hierarchy Note:** Use `title-lg` (Inter, 1.375rem) for card headers to ensure high scannability in dense event listings.

---

## 4. Elevation & Depth: Tonal Layering
Traditional shadows and borders create "visual noise." We achieve hierarchy through **The Layering Principle**.

*   **Stacking:** Instead of a shadow, place a `surface-container-lowest` card on a `surface-container-low` section. The subtle difference in charcoal tones creates a natural, soft lift.
*   **Ambient Shadows:** When a "floating" effect is required (e.g., a ticket checkout modal), use an extra-diffused shadow:
    *   **Blur:** 40px - 60px.
    *   **Opacity:** 6% of the `on-surface` color.
    *   **Tint:** Ensure the shadow is slightly tinted toward the background color to mimic natural ambient occlusion.
*   **The "Ghost Border" Fallback:** For accessibility in forms, use the `outline_variant` at 15% opacity. It should feel like a suggestion of a line, not a hard barrier.

---

## 5. Components

### Event Cards
*   **Structure:** No containers or borders. Use a large image with a `0.75rem` (xl) radius.
*   **Separation:** Content within the card is separated by vertical white space (8px or 16px increments), never divider lines.
*   **States:** On hover, the image should subtly scale (1.02x) and the background shift to `surface_container_high`.

### Buttons
*   **Primary:** A gradient fill (`primary` to `primary_container`) with `on_primary` text. `0.375rem` (md) corner radius.
*   **Secondary:** Ghost-style. No fill, `0.75rem` (xl) roundedness, using the "Ghost Border" fallback.
*   **Tertiary:** Text-only, using `secondary_fixed` (`#ffc965`) to highlight specific high-value actions like "VIP Access."

### Status Badges
*   **Execution:** Use `tertiary_container` (`#f67992`) for "Sold Out" or "Limited" alerts. 
*   **Styling:** Pills with `full` roundedness. The typography must be `label-sm` in all-caps with `0.05em` letter spacing for an authoritative, "official" look.

### Navigation (ABC Studio Branding)
*   **Branding:** The 'ABC Studio' logo should be anchored in the top-left, utilizing `on_surface` (pure white) for maximum contrast against the `surface`.
*   **Items:** Use `title-sm` with `on_surface_variant` for inactive states, transitioning to `primary` on hover with a subtle 2px bottom "glow" bar (using Glassmorphism).

---

## 6. Do's and Don'ts

### Do
*   **Do** use extreme scale in typography. A 3.5rem headline next to a 0.875rem body creates a sophisticated hierarchy.
*   **Do** use the Spacing Scale to create "breathing room." High-end design feels expensive because it isn't crowded.
*   **Do** use `primary_dim` and `secondary_dim` for pressed or disabled states to maintain tonal consistency.

### Don't
*   **Don't** use 1px white lines to separate content. It breaks the immersive "dark mode" experience.
*   **Don't** use standard "Material Design" blue or red. Always stick to the Stage Light Purple and Gold.
*   **Don't** use harsh, 100% opaque shadows. They look "cheap" and dated.
*   **Don't** use `surface_bright` for large backgrounds; keep it reserved for small interactive highlights to avoid washing out the high-contrast aesthetic.