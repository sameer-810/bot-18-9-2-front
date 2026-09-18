# Design direction — WhatsApp AI Agent admin

This console follows the design system of the team's production CRM
(`generator-company-both-fiveM/15-jun-26-gen-front`, see its `DESIGN.md` for the
full reasoning). The rules below are the ones code comments in this project refer
to.

## Governing principle

> **Density with discipline beats decoration.**

Does a change help someone find a number or act faster? If it only looks nicer
in a screenshot, revert it.

## Typography

- UI in **IBM Plex Sans**, data in **IBM Plex Mono**. No third family.
- Every count, token figure, phone number, date, ID and pairing code is
  `font-mono tabular-nums`.

## Colour

- **Cobalt is for interaction only** — primary actions, active nav, focus rings,
  links (and the AI's chat bubble tint, which marks what the product itself sent).
- **Status colour is reserved**: success, warning, destructive. A stat or badge is
  neutral by default and coloured only when its value is the signal (AI failures
  > 0, a disconnected number, a banned session).
- No gradients as decoration, no glow shadows, no gradient text, no glassmorphism.
- Dark mode is first-class.

## Surfaces

| Class         | Use                                     | Elevation    |
| ------------- | --------------------------------------- | ------------ |
| `.pg-panel`   | In-page container (tables, stat tiles)  | none         |
| `.pg-tile`    | Padded panel — forms, charts, prose     | none         |
| `.pg-overlay` | Floats: dialogs, menus, command palette | `shadow-2xl` |

`rounded-2xl` + `shadow-xl` cards are banned. Shadow means "above the page".

## Layout

- Do not redesign the shell (`Sidebar`, `Topbar`, `AppLayout`, `MobileTabBar`).
- Tables: pinned header, identifying column first, actions last, quiet icon
  buttons, confirm dialogs for destructive actions, whole row opens the record
  while the name stays a real link.

## Login

No marketing copy, no stock photography, submit never disabled by validation —
only while the request is in flight.

## Mobile (below `md`, `useIsMobile()`)

- Lists become cards (`RecordCard`), not squeezed tables.
- Navigation is the bottom tab bar (max four tabs + More), a view onto `menu.ts`.
- Touch targets ≥ 44px (`.pg-tap`). One FAB per screen for the primary create.
- Forms become bottom sheets (`FormDialog` switches automatically).
- Chip strips scroll, they do not wrap (`.pg-chips`) — used for the tenant tabs.
- Two-pane views (Conversations) stack: list, or thread with a back button.

## Motion

Colour/transform transitions only, 150–200ms. No fade-and-rise on mount. The only
keyframe is `animate-overlay-in` for things that appear over the page.
