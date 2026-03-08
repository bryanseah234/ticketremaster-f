# TicketRemaster Frontend

> Vue 3 SPA for event ticketing, talking to backend via Kong API Gateway (`localhost:8000`).

## Overview

TicketRemaster is a modern event ticketing frontend built with Vue 3 + Vite. The landing page currently includes:
- Parallax hero with frosted search bar
- Featured events carousel with modal details
- Global reach section with interactive globe-style CTA
- Multi-column footer

## Dependency Requirements (for Vercel / CI)

The landing implementation expects these packages to be installed from npm:

```bash
npm install
```

Key required dependencies now explicitly listed in `package.json`:
- `@vueuse/core`
- `@vueuse/motion`
- `lucide-vue-next`
- `three`
- `@tresjs/core`
- `@tresjs/cientos`
- `tailwindcss` + `@tailwindcss/vite`

If your Vercel build has normal npm registry access, these should install automatically during the build step.

## Why install failed in this agent environment

Install failed here with HTTP `403 Forbidden` from npm registry endpoints, which indicates an environment policy/proxy restriction rather than project code issues. Example from this run:
- `GET https://registry.npmjs.org/@vueuse%2fcore -> 403`
- `GET https://registry.npmjs.org/@tailwindcss%2fvite -> 403`

So the dependency list is now in source control, but actual install must run in an environment with npm registry access (e.g., your Vercel build machine or local dev machine).

## Setup & Development

### 1. Install dependencies
```bash
npm install
```

### 2. Start development server
```bash
npm run dev
```

### 3. Build for production
```bash
npm run build
```

### 4. Preview production build
```bash
npm run preview
```

## Notes
- All business logic and API details are in `INSTRUCTIONS.md`
- OutSystems QR scanner is a separate app (see `outsystems/README.md`)
