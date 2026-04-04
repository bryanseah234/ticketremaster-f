export interface ThemePalette {
  background: string
  surface: string
  surfaceLow: string
  surfaceHigh: string
  surfaceHighest: string
  surfaceVariant: string
  text: string
  textMuted: string
  primary: string
  primarySoft: string
  secondary: string
  tertiary: string
  success: string
  warning: string
  error: string
  outline: string
  outlineSoft: string
}

export interface ThemeConfig {
  palette: ThemePalette
  colors: Record<string, string>
  shadows: Record<string, string>
  radii: Record<string, string>
}

const theme: ThemeConfig = {
  palette: {
    background: '#191210',
    surface: '#211a18',
    surfaceLow: '#261e1c',
    surfaceHigh: '#302826',
    surfaceHighest: '#3c3331',
    surfaceVariant: 'rgba(60, 51, 49, 0.68)',
    text: '#eedfdc',
    textMuted: '#c9b2a7',
    primary: '#f97316',
    primarySoft: '#ffb690',
    secondary: '#e8a75c',
    tertiary: '#ffb800',
    success: '#52d18c',
    warning: '#ffb020',
    error: '#ff8c7a',
    outline: '#a78b7d',
    outlineSoft: 'rgba(88, 66, 55, 0.25)',
  },
  colors: {
    primary: '#f97316',
    secondary: '#e8a75c',
    tertiary: '#ffb800',
    background: '#191210',
    surface: '#211a18',
    surfaceLow: '#261e1c',
    surfaceHigh: '#302826',
    surfaceHighest: '#3c3331',
    text: '#eedfdc',
    textMuted: '#c9b2a7',
    success: '#52d18c',
    warning: '#ffb020',
    error: '#ff8c7a',
    outline: '#a78b7d',
  },
  shadows: {
    sm: '0 12px 24px rgba(0, 0, 0, 0.22)',
    md: '0 20px 40px rgba(0, 0, 0, 0.32)',
    lg: '0 28px 56px rgba(0, 0, 0, 0.38)',
    xl: '0 36px 72px rgba(0, 0, 0, 0.44)',
  },
  radii: {
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    pill: '999px',
  },
}

export function applyThemeVariables(): void {
  const root = document.documentElement

  Object.entries(theme.palette).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value)
  })

  Object.entries(theme.shadows).forEach(([key, value]) => {
    root.style.setProperty(`--shadow-${key}`, value)
  })

  Object.entries(theme.radii).forEach(([key, value]) => {
    root.style.setProperty(`--radius-${key}`, value)
  })
}

export default theme
