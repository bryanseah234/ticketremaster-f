# TicketRemaster Style Guide

This project uses a dark glassmorphism aesthetic with orange accents.

## Source of Truth

Theme tokens live in `src/config/theme.ts`.
- Update hex/rgba values there to globally re-theme the app.
- Runtime mapping to CSS variables happens in `applyThemeVariables()` from `src/main.ts`.

## CSS Variables

- `--bg`, `--bg-2`: background layers
- `--surface`, `--surface-2`: glass panels/cards
- `--border`: subtle 1px borders
- `--text`, `--muted`: text hierarchy
- `--accent`, `--accent-2`, `--accent-ink`: brand/action colors
- `--success`, `--warning`, `--disabled`: semantic states

## Visual Language

- Glass cards: border + blur + soft shadow.
- Buttons:
  - Primary = orange gradient
  - Secondary = neutral glass
  - Ghost = transparent + border
- Inputs/select/textarea inherit dark surfaces and border tokens.
- Radius scale:
  - pills: `999px`
  - controls: `0.75rem`
  - cards: `1rem+`

## Typography

- Font stack from `themeConfig.fontFamily`.
- High contrast with muted secondary copy (`--muted`).

## Layout Patterns

- Page container uses `.page` max-width and padding from `src/assets/main.css`.
- Grid helpers: `.grid-2`, `.grid-3`, `.grid-4`.
- Reusable utility classes:
  - `.glass`
  - `.panel`
  - `.badge`
  - `.small`

## Design Preview Route

Visit `/design` to see a live preview of:
- color tokens
- form controls
- button variants
- badges
- typography and panel samples
