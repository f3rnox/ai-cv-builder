export interface ColorPalette {
  id: string
  name: string
  primary: string // Hex color
  hover: string // Hex color
  light: string // Hex color (light background)
  border: string // Hex color (light border)
}

export interface DisplaySettings {
  theme: 'light' | 'dark' | 'system'
  paletteId: string // 'sapphire' | 'emerald' | 'amethyst' | 'crimson' | 'amber' | 'slate' | 'teal' | 'custom'
  customPalette?: ColorPalette
  fontSize: 'sm' | 'base' | 'lg'
  cardStyle: 'flat' | 'bordered' | 'shadowed'
}

export const COLOR_PALETTES: ColorPalette[] = [
  {
    id: 'sapphire',
    name: 'Sapphire Blue',
    primary: '#2563eb',
    hover: '#1d4ed8',
    light: '#eff6ff',
    border: '#dbeafe'
  },
  {
    id: 'emerald',
    name: 'Emerald Green',
    primary: '#059669',
    hover: '#047857',
    light: '#ecfdf5',
    border: '#d1fae5'
  },
  {
    id: 'amethyst',
    name: 'Royal Amethyst',
    primary: '#7c3aed',
    hover: '#6d28d9',
    light: '#f5f3ff',
    border: '#ede9fe'
  },
  {
    id: 'crimson',
    name: 'Crimson Velvet',
    primary: '#dc2626',
    hover: '#b91c1c',
    light: '#fef2f2',
    border: '#fee2e2'
  },
  {
    id: 'amber',
    name: 'Sunset Amber',
    primary: '#d97706',
    hover: '#b45309',
    light: '#fffbeb',
    border: '#fef3c7'
  },
  {
    id: 'slate',
    name: 'Charcoal Slate',
    primary: '#4b5563',
    hover: '#374151',
    light: '#f9fafb',
    border: '#f3f4f6'
  },
  {
    id: 'teal',
    name: 'Midnight Teal',
    primary: '#0d9488',
    hover: '#0f766e',
    light: '#f0fdfa',
    border: '#ccfbf1'
  }
]

export const defaultDisplaySettings: DisplaySettings = {
  theme: 'system',
  paletteId: 'sapphire',
  fontSize: 'base',
  cardStyle: 'bordered'
}

const APP_MANAGED_ACCENT_COLORS = new Set(['#2563eb', '#3b82f6'])

/**
 * Helper to convert hex to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: Number.parseInt(result[1], 16),
        g: Number.parseInt(result[2], 16),
        b: Number.parseInt(result[3], 16)
      }
    : null
}

/**
 * Helper to convert RGB to hex
 */
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
}

/**
 * Dynamically generates a complete cohesive ColorPalette from a single custom hex color.
 * Generates secondary hover state, extremely light background, and soft border colors.
 * 
 * @param {string} hex - The primary custom hex color.
 * @returns {ColorPalette} A full ColorPalette object.
 */
export function generatePaletteFromHex(hex: string): ColorPalette {
  const rgb = hexToRgb(hex) || { r: 37, g: 99, b: 235 }
  
  // Calculate hover (darken by ~15%)
  const hoverR = Math.max(0, Math.floor(rgb.r * 0.85))
  const hoverG = Math.max(0, Math.floor(rgb.g * 0.85))
  const hoverB = Math.max(0, Math.floor(rgb.b * 0.85))
  const hoverHex = rgbToHex(hoverR, hoverG, hoverB)

  // Calculate light background (mix with white: 95% white, 5% primary)
  const lightR = Math.min(255, Math.floor(255 * 0.95 + rgb.r * 0.05))
  const lightG = Math.min(255, Math.floor(255 * 0.95 + rgb.g * 0.05))
  const lightB = Math.min(255, Math.floor(255 * 0.95 + rgb.b * 0.05))
  const lightHex = rgbToHex(lightR, lightG, lightB)

  // Calculate light border (mix with white: 85% white, 15% primary)
  const borderR = Math.min(255, Math.floor(255 * 0.85 + rgb.r * 0.15))
  const borderG = Math.min(255, Math.floor(255 * 0.85 + rgb.g * 0.15))
  const borderB = Math.min(255, Math.floor(255 * 0.85 + rgb.b * 0.15))
  const borderHex = rgbToHex(borderR, borderG, borderB)

  return {
    id: 'custom',
    name: 'Custom Palette',
    primary: hex,
    hover: hoverHex,
    light: lightHex,
    border: borderHex
  }
}

/**
 * Retrieves display settings from local storage.
 * 
 * @returns {DisplaySettings} The saved or default display settings.
 */
export function getDisplaySettings(): DisplaySettings {
  if (globalThis.window === undefined) return defaultDisplaySettings
  const stored = localStorage.getItem('ai-cv-display-settings')
  if (stored) {
    try {
      return { ...defaultDisplaySettings, ...JSON.parse(stored) }
    } catch (e) {
      console.error('Failed to parse display settings', e)
    }
  }
  return defaultDisplaySettings
}

export function getActivePalette(settings?: DisplaySettings): ColorPalette {
  const activeSettings = settings || getDisplaySettings()
  let palette = COLOR_PALETTES.find((p) => p.id === activeSettings.paletteId)
  if (activeSettings.paletteId === 'custom' && activeSettings.customPalette) {
    palette = activeSettings.customPalette
  }
  return palette || COLOR_PALETTES[0]
}

export function resolveAppAccentColor(accentColor?: string): string {
  if (!accentColor || APP_MANAGED_ACCENT_COLORS.has(accentColor.toLowerCase())) {
    return getActivePalette().primary
  }
  return accentColor
}

/**
 * Saves display settings to local storage and updates CSS variables on document.documentElement.
 * 
 * @param {DisplaySettings} settings - The display settings to persist.
 * @returns {void}
 */
export function saveDisplaySettings(settings: DisplaySettings): void {
  if (globalThis.window === undefined) return
  localStorage.setItem('ai-cv-display-settings', JSON.stringify(settings))
  applyDisplaySettings(settings)
}

/**
 * Applies the active display settings (theme, custom palette, font size) to the browser document.
 * 
 * @param {DisplaySettings} [settings] - The display settings to apply. If omitted, loads from storage.
 * @returns {void}
 */
export function applyDisplaySettings(settings?: DisplaySettings): void {
  if (globalThis.window === undefined) return
  
  const activeSettings = settings || getDisplaySettings()
  
  // 1. Theme Configuration
  let isDark = false
  if (activeSettings.theme === 'dark') {
    isDark = true
  } else if (activeSettings.theme === 'system') {
    isDark = globalThis.window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  document.documentElement.classList.toggle('dark', isDark)
  
  // 2. Palette Configuration
  const palette = getActivePalette(activeSettings)

  const root = document.documentElement
  root.style.setProperty('--app-primary', palette.primary)
  root.style.setProperty('--app-primary-hover', palette.hover)
  root.style.setProperty('--app-primary-light', palette.light)
  root.style.setProperty('--app-primary-light-border', palette.border)

  // Add a very subtle dark mode version of light/border backgrounds if theme is dark
  if (isDark) {
    // Generate translucent hex for dark mode backgrounds so they look awesome on dark
    root.style.setProperty('--app-primary-light', `${palette.primary}12`) // ~7% opacity
    root.style.setProperty('--app-primary-light-border', `${palette.primary}33`) // ~20% opacity
  }

  // 3. Font Size configuration
  let multiplier = '1.0'
  if (activeSettings.fontSize === 'sm') {
    multiplier = '0.92'
  } else if (activeSettings.fontSize === 'lg') {
    multiplier = '1.08'
  }
  root.style.setProperty('--app-font-size-multiplier', multiplier)
}
