# Threadline design system

Threadline should feel like a precise instrument, not a dark “hacker dashboard.” Hierarchy comes from spacing, typography, and restrained surfaces. Color is reserved for meaning.

## Palette

| Token | Value | Use |
| --- | --- | --- |
| Background | `#080B0D` | Workspace canvas |
| Panel | `#0D1215` | Primary surface |
| Elevated | `#131A1E` | Selected and floating surfaces |
| Foreground | `#F2F5EF` | Primary text |
| Muted | `#88949A` | Secondary text and metadata |
| Thread lime | `#B8F66A` | Brand, observed relationships, focus |
| Signal cyan | `#63D8EE` | Telemetry and source evidence |
| Inference violet | `#A99AF8` | AI-derived claims and proposed actions |
| Success | `#65D6A4` | Healthy and verified |
| Warning | `#EFBD62` | At risk and degraded |
| Danger | `#FF7585` | Incident and customer harm |

All state meaning is repeated in copy and icons. Lines additionally use solid, dashed, or stronger weights.

## Typography

- Geist Sans: interface, narrative, headings
- Geist Mono: IDs, times, commits, metrics, status metadata
- Headlines use tight tracking and balanced wrapping.
- Product surfaces remain compact; marketing surfaces gain space rather than oversized decoration.

## Surface rules

- One elevation per region; no deeply nested cards.
- Radius is 12 px by default, smaller for controls.
- A panel receives one subtle top highlight and one border.
- Gradients are limited to ambient background light and data fills.
- Grid and dot textures communicate system structure and recede below content.

## Interaction rules

- Motion lasts 150–220 ms for controls and up to 560 ms for page entrance.
- Continuous motion is limited to one live indicator and observed graph flow.
- `prefers-reduced-motion` removes replay-independent animation.
- Hover behavior always has a keyboard-focus equivalent.
- Minimum interactive height is 40 px on dense desktop surfaces and 44 px on mobile.
- Selection, filter, and replay state remain visible in text.

## Accessibility contract

- WCAG 2.2 AA contrast targets
- Skip link and semantic landmarks
- One specific `h1` per route
- Native dialog semantics for command and approval flows
- Explicit labels for sliders, icon buttons, metrics, and charts
- Graph content duplicated in timeline/table forms
- `aria-live="polite"` only for meaningful state transitions
- Focus is never conveyed by color alone
- Mobile flow remains usable at 320 CSS px and 200% zoom

## Voice

Threadline is calm, precise, and falsifiable.

Prefer:

- “Leading explanation”
- “7 supporting signals · 1 conflicting signal”
- “Recovery verified for five minutes”
- “Not enough evidence supports a conclusion in this window”

Avoid:

- “AI found the root cause” before verification
- “Magic” or “autonomous everything”
- Opaque universal health scores
- Confidence percentages without a reason
