# TicketRemaster Frontend Style Guide

This document establishes the design system, coding conventions, and component patterns for the TicketRemaster frontend application.

## Table of Contents

1. [Design System](#design-system)
2. [Color Palette](#color-palette)
3. [Typography](#typography)
4. [Component Patterns](#component-patterns)
5. [Code Conventions](#code-conventions)
6. [Accessibility](#accessibility)
7. [File Structure](#file-structure)

---

## Design System

### Design Principles

- **Trust First**: Every interaction should reinforce user confidence in the platform
- **Clarity Over Cleverness**: Prefer obvious, predictable patterns over novel solutions
- **Responsive by Default**: All components must work across mobile, tablet, and desktop
- **Accessible to All**: WCAG 2.1 AA compliance is mandatory, not optional

### Layout System

- Use CSS Grid for page-level layouts
- Use Flexbox for component-level layouts
- Mobile-first breakpoint system:
  - Mobile: < 640px
  - Tablet: 640px - 1024px
  - Desktop: > 1024px

---

## Color Palette

### Primary Colors

| Name | Hex | Usage |
|------|-----|-------|
| Primary | `#f97316` | Primary actions, links, highlights |
| Primary Hover | `#ea580c` | Hover states for primary elements |
| Primary Light | `#fed7aa` | Backgrounds, subtle accents |

### Neutral Colors

| Name | Hex | Usage |
|------|-----|-------|
| Gray 900 | `#111827` | Primary text |
| Gray 700 | `#374151` | Secondary text |
| Gray 500 | `#6b7280` | Tertiary text, borders |
| Gray 300 | `#d1d5db` | Dividers, inactive states |
| Gray 100 | `#f3f4f6` | Backgrounds |
| White | `#ffffff` | Cards, surfaces |

### Semantic Colors

| Name | Hex | Usage |
|------|-----|-------|
| Success | `#10b981` | Success messages, confirmed states |
| Warning | `#f59e0b` | Warning messages, pending states |
| Error | `#ef4444` | Error messages, destructive actions |
| Info | `#3b82f6` | Informational messages, links |

### Usage Examples

```vue
<template>
  <!-- Primary button -->
  <button class="btn btn-primary">Primary Action</button>
  
  <!-- Error state -->
  <div class="alert alert-error">Error message</div>
  
  <!-- Success state -->
  <div class="alert alert-success">Success message</div>
</template>
```

---

## Typography

### Font Families

- **Primary**: `Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Monospace**: `Fira Code, 'Consolas', 'Monaco', monospace`

### Font Scale

| Name | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| Display | 3rem (48px) | 700 | 1.1 | Page headers |
| H1 | 2.25rem (36px) | 700 | 1.2 | Section headers |
| H2 | 1.875rem (30px) | 600 | 1.25 | Subsection headers |
| H3 | 1.5rem (24px) | 600 | 1.3 | Card titles |
| H4 | 1.25rem (20px) | 600 | 1.4 | Group headers |
| Body | 1rem (16px) | 400 | 1.5 | Body text |
| Small | 0.875rem (14px) | 400 | 1.5 | Captions, labels |
| XSmall | 0.75rem (12px) | 400 | 1.5 | Helper text |

### Text Styles

```vue
<template>
  <h1 class="text-display">Display Text</h1>
  <h2 class="text-h1">Heading 1</h2>
  <h3 class="text-h2">Heading 2</h3>
  <p class="text-body">Body text</p>
  <span class="text-small">Small text</span>
</template>

<style scoped>
.text-display {
  font-size: 3rem;
  font-weight: 700;
  line-height: 1.1;
}

.text-h1 {
  font-size: 2.25rem;
  font-weight: 700;
  line-height: 1.2;
}

.text-body {
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.5;
}
</style>
```

---

## Component Patterns

### Button Variants

```vue
<template>
  <!-- Primary button -->
  <button class="btn btn-primary">Primary</button>
  
  <!-- Secondary button -->
  <button class="btn btn-secondary">Secondary</button>
  
  <!-- Outline button -->
  <button class="btn btn-outline">Outline</button>
  
  <!-- Ghost button -->
  <button class="btn btn-ghost">Ghost</button>
  
  <!-- Danger button -->
  <button class="btn btn-danger">Danger</button>
  
  <!-- Disabled button -->
  <button class="btn btn-primary" disabled>Disabled</button>
  
  <!-- Loading button -->
  <button class="btn btn-primary" :disabled="loading">
    <span v-if="loading" class="spinner"></span>
    {{ loading ? 'Loading...' : 'Submit' }}
  </button>
</template>
```

### Form Inputs

```vue
<template>
  <div class="form-group">
    <label class="form-label" for="email">Email</label>
    <input
      type="email"
      id="email"
      class="form-input"
      :class="{ 'form-input-error': hasError }"
      v-model="email"
      placeholder="Enter your email"
    />
    <span v-if="hasError" class="form-error">{{ errorMessage }}</span>
    <span class="form-hint">We'll never share your email</span>
  </div>
</template>
```

### Cards

```vue
<template>
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">Card Title</h3>
    </div>
    <div class="card-body">
      <p>Card content goes here</p>
    </div>
    <div class="card-footer">
      <button class="btn btn-primary">Action</button>
    </div>
  </div>
</template>
```

### Alerts

```vue
<template>
  <div class="alert alert-info" role="alert">
    <span class="alert-icon">ℹ️</span>
    <span class="alert-message">Information message</span>
  </div>
  
  <div class="alert alert-success" role="alert">
    <span class="alert-icon">✅</span>
    <span class="alert-message">Success message</span>
  </div>
  
  <div class="alert alert-warning" role="alert">
    <span class="alert-icon">⚠️</span>
    <span class="alert-message">Warning message</span>
  </div>
  
  <div class="alert alert-error" role="alert">
    <span class="alert-icon">❌</span>
    <span class="alert-message">Error message</span>
  </div>
</template>
```

### Loading States

```vue
<template>
  <!-- Spinner -->
  <div class="spinner" role="status">
    <span class="sr-only">Loading...</span>
  </div>
  
  <!-- Skeleton -->
  <div class="skeleton skeleton-text"></div>
  <div class="skeleton skeleton-text skeleton-text-short"></div>
  
  <!-- Page loader -->
  <div class="page-loader">
    <div class="spinner"></div>
    <p>Loading...</p>
  </div>
</template>
```

---

## Code Conventions

### Vue Component Structure

```vue
<script setup lang="ts">
// 1. Imports
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { Event } from '@/types'

// 2. Props
const props = defineProps<{
  eventId: string
  title?: string
}>()

// 3. Emits
const emit = defineEmits<{
  (e: 'update', value: Event): void
  (e: 'close'): void
}>()

// 4. State
const loading = ref(false)
const error = ref<string | null>(null)

// 5. Computed
const formattedDate = computed(() => {
  return new Date(props.eventId).toLocaleDateString()
})

// 6. Methods
async function fetchData() {
  loading.value = true
  error.value = null
  try {
    // API call
  } catch (err) {
    error.value = 'Failed to fetch data'
  } finally {
    loading.value = false
  }
}

// 7. Lifecycle
onMounted(() => {
  fetchData()
})
</script>

<template>
  <!-- Template content -->
</template>

<style scoped>
/* Component styles */
</style>
```

### Naming Conventions

- **Components**: PascalCase (e.g., `EventCard.vue`, `SeatMap.vue`)
- **Composables**: camelCase with `use` prefix (e.g., `useToast.ts`, `useWebSocket.ts`)
- **Stores**: camelCase (e.g., `auth.ts`, `events.ts`)
- **Types**: PascalCase (e.g., `Event`, `SeatInventory`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`, `MAX_RETRIES`)
- **CSS Classes**: kebab-case (e.g., `.event-card`, `.seat-map`)

### TypeScript Guidelines

```typescript
// Always define types for API responses
interface ApiResponse<T> {
  data: T
  message?: string
}

// Use type guards for runtime validation
function isEvent(data: unknown): data is Event {
  return (
    typeof data === 'object' &&
    data !== null &&
    'eventId' in data &&
    'name' in data
  )
}

// Prefer interfaces for object shapes
interface EventFilters {
  type?: EventType
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}

// Use enums for fixed sets
enum TicketStatus {
  Valid = 'valid',
  Used = 'used',
  Cancelled = 'cancelled',
  Transferred = 'transferred'
}
```

### API Call Patterns

```typescript
// Use the centralized API client
import api from '@/api/client'

// Always handle errors
async function fetchEvents(filters: EventFilters) {
  try {
    const response = await api.get<ApiResponse<Event[]>>('/events', { params: filters })
    return response.data.data
  } catch (error) {
    if (isAxiosError(error)) {
      // Handle specific error codes
      if (error.response?.status === 429) {
        throw new Error('Rate limited')
      }
    }
    throw error
  }
}
```

---

## Accessibility

### Keyboard Navigation

- All interactive elements must be focusable
- Focus order must be logical and predictable
- Focus states must be visible
- Custom components must support keyboard interaction

```vue
<template>
  <!-- Use semantic HTML -->
  <button @click="handleClick">Click me</button>
  
  <!-- For custom interactive elements -->
  <div
    role="button"
    tabindex="0"
    @click="handleClick"
    @keydown.enter="handleClick"
    @keydown.space.prevent="handleClick"
  >
    Custom button
  </div>
</template>
```

### ARIA Attributes

```vue
<template>
  <!-- Loading states -->
  <div role="status" aria-live="polite">
    Loading...
  </div>
  
  <!-- Error messages -->
  <div role="alert" aria-live="assertive">
    Error message
  </div>
  
  <!-- Expandable sections -->
  <button
    :aria-expanded="isOpen"
    :aria-controls="`section-${id}`"
  >
    Toggle
  </button>
  <div :id="`section-${id}`" v-show="isOpen">
    Content
  </div>
</template>
```

### Screen Reader Support

- Use `sr-only` class for visually hidden but screen-reader accessible text
- Provide alt text for all images
- Use aria-label for icon-only buttons
- Ensure link text is descriptive

```vue
<template>
  <!-- Icon button with label -->
  <button class="icon-btn" aria-label="Close dialog">
    <XIcon />
  </button>
  
  <!-- Image with alt text -->
  <img src="event.jpg" alt="Taylor Swift concert at Madison Square Garden" />
  
  <!-- Visually hidden text -->
  <span class="sr-only">Skip to main content</span>
</template>

<style>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
```

---

## File Structure

```
src/
├── api/                    # API client and interceptors
│   └── client.ts          # Axios instance with interceptors
├── assets/                # Static assets (images, fonts)
├── components/            # Reusable Vue components
│   ├── common/            # Common components (navbar, toast)
│   ├── layout/            # Layout components (footer)
│   ├── sections/          # Section components
│   └── ui/                # UI components (card, button)
├── composables/           # Vue composables (hooks)
│   ├── useAccessibility.ts
│   ├── useToast.ts
│   └── useWebSocket.ts
├── config/                # Configuration files
│   └── constants.ts
├── locales/               # i18n translations
├── router/                # Route definitions
├── services/              # Business logic services
│   └── mockData.ts        # Demo mode mock data
├── stores/                # Pinia stores
│   └── auth.ts
├── types/                 # TypeScript type definitions
│   └── index.ts
└── views/                 # Page components
    └── app/               # Application views
```

### Component Organization

Each component should follow this structure:

```
ComponentName/
├── ComponentName.vue      # Main component file
├── ComponentName.stories.ts  # Storybook stories (if applicable)
└── ComponentName.test.ts  # Unit tests
```

---

## Performance Guidelines

### Code Splitting

- Use dynamic imports for route-based code splitting
- Lazy load heavy components
- Preload critical resources

```typescript
// router/index.ts
const routes = [
  {
    path: '/events',
    component: () => import('@/views/app/EventListView.vue')
  }
]
```

### Image Optimization

- Use WebP format with fallbacks
- Implement lazy loading for images
- Use responsive image sizes

```vue
<template>
  <img
    src="image.webp"
    srcset="image-400.webp 400w, image-800.webp 800w"
    sizes="(max-width: 600px) 400px, 800px"
    loading="lazy"
    alt="Description"
  />
</template>
```

### Bundle Analysis

Run bundle analysis to identify large dependencies:

```bash
npm run build
# Opens dist/stats.html with bundle visualization
```

---

## Testing Guidelines

### Unit Tests

```typescript
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import MyComponent from './MyComponent.vue'

describe('MyComponent', () => {
  it('renders correctly', () => {
    const wrapper = mount(MyComponent, {
      props: { title: 'Test' }
    })
    expect(wrapper.text()).toContain('Test')
  })
})
```

### E2E Tests

```typescript
import { test, expect } from '@playwright/test'

test('user can login', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[name="email"]', 'test@example.com')
  await page.fill('[name="password"]', 'password123')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL('/events')
})
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-03-30 | Initial style guide creation |
