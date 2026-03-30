import { ref, onMounted, type Ref } from 'vue'

interface FocusTrapOptions {
  initialFocus?: HTMLElement | null
  escapeDeactivates?: boolean
  clickOutsideDeactivates?: boolean
}

/**
 * Composable for managing focus trap in modals and dialogs (WCAG 2.1 AA compliance)
 */
export function useFocusTrap(
  containerRef: Ref<HTMLElement | null>,
  options: FocusTrapOptions = {}
) {
  const {
    escapeDeactivates = true,
    clickOutsideDeactivates = false,
  } = options

  const isActive = ref(false)
  const previousFocus = ref<HTMLElement | null>(null)

  const FOCUSABLE_SELECTORS = [
    'button:not([disabled])',
    'a[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ')

  const getFocusableElements = (): HTMLElement[] => {
    if (!containerRef.value) return []
    return Array.from(
      containerRef.value.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
    ).filter(el => el.offsetParent !== null)
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!isActive.value || !containerRef.value) return

    const focusableElements = getFocusableElements()
    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    // Handle Tab key for focus cycling
    if (event.key === 'Tab') {
      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault()
          lastElement.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault()
          firstElement.focus()
        }
      }
    }

    // Handle Escape key
    if (escapeDeactivates && event.key === 'Escape') {
      deactivate()
    }
  }

  const handleClickOutside = (event: MouseEvent) => {
    if (!isActive.value || !containerRef.value) return

    if (
      clickOutsideDeactivates &&
      !containerRef.value.contains(event.target as Node)
    ) {
      deactivate()
    }
  }

  const activate = () => {
    previousFocus.value = document.activeElement as HTMLElement
    isActive.value = true

    // Focus the first focusable element or the container itself
    const focusableElements = getFocusableElements()
    if (focusableElements.length > 0) {
      focusableElements[0].focus()
    } else {
      containerRef.value?.focus()
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('click', handleClickOutside)

    // Prevent body scroll
    document.body.style.overflow = 'hidden'
  }

  const deactivate = () => {
    isActive.value = false

    document.removeEventListener('keydown', handleKeyDown)
    document.removeEventListener('click', handleClickOutside)

    // Restore body scroll
    document.body.style.overflow = ''

    // Restore previous focus
    previousFocus.value?.focus()
  }

  onMounted(() => {
    // Cleanup on unmount
    return () => {
      if (isActive.value) {
        deactivate()
      }
    }
  })

  return {
    isActive,
    activate,
    deactivate,
    focusFirst: () => {
      const focusableElements = getFocusableElements()
      if (focusableElements.length > 0) {
        focusableElements[0].focus()
      }
    },
  }
}

/**
 * Composable for managing live region announcements (screen reader support)
 */
export function useLiveRegion() {
  const liveRegionRef = ref<HTMLElement | null>(null)

  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (liveRegionRef.value) {
      liveRegionRef.value.setAttribute('aria-live', priority)
      liveRegionRef.value.textContent = message
    }
  }

  const clear = () => {
    if (liveRegionRef.value) {
      liveRegionRef.value.textContent = ''
    }
  }

  return {
    liveRegionRef,
    announce,
    clear,
  }
}

/**
 * Composable for managing skip links
 */
export function useSkipLink(targetId: string) {
  const skipToContent = () => {
    const target = document.getElementById(targetId)
    if (target) {
      target.tabIndex = -1
      target.focus()
      target.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return { skipToContent }
}
