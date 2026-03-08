export interface ThemeConfig {
  fontFamily: string
  colors: Record<string, string>
}

export const themeConfig: ThemeConfig = {
  fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif",
  colors: {
    bg: '#0b0b0d',
    bg2: '#141417',
    surface: 'rgba(28, 28, 33, 0.76)',
    surface2: 'rgba(43, 43, 49, 0.64)',
    border: 'rgba(255, 255, 255, 0.12)',
    text: '#f6f6f7',
    muted: '#b4b4bc',
    accent: '#f97316',
    accent2: '#fb923c',
    accentInk: '#240f02',
    success: '#22c55e',
    warning: '#facc15',
    disabled: '#71717a',
  },
}

export const applyThemeVariables = (theme = themeConfig) => {
  const root = document.documentElement
  root.style.setProperty('--font-family', theme.fontFamily)

  Object.entries(theme.colors).forEach(([key, value]) => {
    const varName = `--${key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}`
    root.style.setProperty(varName, value)
  })
}
