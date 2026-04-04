# Design System Specification: Editorial Glass & Ember

## 1. Overview & Creative North Star
**Creative North Star: "The Obsidian Hearth"**

This design system rejects the "flat web" in favor of a high-end, editorial experience that feels like a curated gallery. We achieve this through **Obsidian Layering**—a philosophy where the UI is not a single plane, but a series of semi-transparent, dark-glass surfaces floating over a deep, infinite void. 

By leveraging intentional asymmetry, high-contrast typography, and "breathing" white space, we break the traditional grid. The experience should feel like a premium physical artifact: heavy, intentional, and glowing from within.

---

## 2. Colors & Surface Philosophy

Our palette is anchored in deep blacks and "Ember" oranges. We move beyond standard UI by treating color as light and material rather than just a fill.

### The "No-Line" Rule
**Prohibit 1px solid borders for sectioning.** Boundaries must be defined solely through background tonal shifts or glassmorphic blurs. Use `surface-container-low` on a `background` to define areas. If a boundary feels missing, increase the contrast between container tiers rather than adding a stroke.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of frosted obsidian. 
- **Base Layer:** `background` (#0e0e0e).
- **Secondary Sections:** `surface-container-low` (#131313).
- **Floating Cards/Nav:** `surface-container-highest` (#262626) at 70% opacity with a 24px backdrop-blur.

### The Glass & Gradient Rule
To provide "soul," primary CTAs and active states should use a **Linear Gradient** (135deg) from `primary` (#ff9153) to `primary-container` (#ff7a23). This mimics the flickering heat of an ember.

---

## 3. Typography
We utilize **Plus Jakarta Sans** to bridge the gap between technical precision and editorial elegance.

*   **Display (Large/Medium):** Reserved for hero moments. Use tight letter-spacing (-0.02em) to create an authoritative, "magazine-cover" feel.
*   **Headlines:** The primary narrative voice. Use `headline-lg` to break sections with significant breathing room above and below.
*   **Body:** `body-lg` (1rem) is our workhorse. Ensure a line-height of 1.6 to maintain a premium, readable feel against the dark background.
*   **Labels:** Use `label-md` for metadata. In dark mode, use `on-surface-variant` (#adaaaa) to ensure they recede visually compared to primary content.

---

## 4. Elevation & Depth

### The Layering Principle
Depth is achieved through **Tonal Layering**. Instead of drop shadows, place a `surface-container-lowest` (#000000) card inside a `surface-container-high` (#201f1f) section to create a "recessed" or "inset" look. 

### Floating Navigation (The Mobbin-Style Nav)
The navigation bar is the "signature" piece of this system:
- **Geometry:** Centered, width restricted to max-content or 80% of viewport. Use `rounded-full` (9999px) for the outer container.
- **Material:** `surface-container-highest` (#262626) with 60% alpha and `backdrop-filter: blur(20px)`.
- **Shadow:** Use an **Ambient Shadow**. Color: `on-surface` (#ffffff) at 4% opacity. Blur: 40px. Y-offset: 12px. This creates a soft, natural lift.
- **Ghost Border Fallback:** A 1px "Ghost Border" using `outline-variant` (#494847) at 20% opacity is permitted *only* on floating glass elements to define the edge against complex backgrounds.

---

## 5. Components

### Navigation Bar (Floating)
*   **Structure:** A pill-shaped container.
*   **Active State:** The active link should be encased in a secondary "pill" using the `primary` gradient or a subtle `surface-bright` fill to highlight the user's location.

### Buttons
*   **Primary:** Full `primary` to `primary-container` gradient. Text color: `on-primary` (#511f00). Shape: `rounded-md` (1.5rem) for a modern, friendly feel.
*   **Secondary:** Glassmorphic background (`surface-variant` at 20% opacity) with a `Ghost Border`.

### Cards & Lists
*   **The Divider Ban:** Strictly forbid 1px dividers. Separate list items using 12px of vertical white space and a subtle `surface-container-low` background on hover.
*   **Images:** All images within cards must have a `rounded-DEFAULT` (1rem) corner radius to match the system's softness.

### Input Fields
*   **Surface:** `surface-container-highest` (#262626).
*   **Focus State:** Do not use a blue glow. Use a 1px `primary` (#ff9153) "Ghost Border" at 50% opacity and a subtle inner glow.

---

## 6. Do's and Don'ts

### Do
*   **DO** use extreme white space (48px, 64px, 80px) to separate editorial sections.
*   **DO** use `Plus Jakarta Sans` for all weights; let the scale do the work, not a change in typeface.
*   **DO** apply `backdrop-filter: blur` to any element that floats above content.

### Don't
*   **DON'T** use 100% opaque, high-contrast borders. They break the "Glass" illusion.
*   **DON'T** use pure grey shadows. Always tint shadows with a hint of the background or primary hue to keep the "Ember" warmth.
*   **DON'T** span the navigation bar 100% width on desktop. It must feel like a floating tool, not a header.