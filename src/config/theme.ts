export interface ThemeColors {
  primary: string
  secondary: string
  accent: string
  success: string
  warning: string
  error: string
  info: string
  light: string
  dark: string
}

export interface ThemeConfig {
  colors: ThemeColors
  shadows: {
    sm: string
    md: string
    lg: string
    xl: string
  }
  borderRadius: {
    sm: string
    md: string
    lg: string
    xl: string
  }
}

const theme: ThemeConfig = {
  colors: {
    primary: '#6366f1',
    secondary: '#64748b',
    accent: '#f59e0b',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    light: '#f8fafc',
    dark: '#0f172a',
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },
  borderRadius: {
    sm: '0.125rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
  },
}

export function applyThemeVariables(): void {
  const root = document.documentElement
  const { colors, shadows, borderRadius } = theme

  // Apply colors
  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value)
  })

  // Apply shadows
  Object.entries(shadows).forEach(([key, value]) => {
    root.style.setProperty(`--shadow-${key}`, value)
  })

  // Apply border radius
  Object.entries(borderRadius).forEach(([key, value]) => {
    root.style.setProperty(`--radius-${key}`, value)
  })
}

export default theme
