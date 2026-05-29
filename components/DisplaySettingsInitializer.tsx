'use client'

import { useEffect } from 'react'
import { applyDisplaySettings } from '@/lib/displaySettings'

/**
 * DisplaySettingsInitializer is a lightweight client-side helper component
 * that initializes and applies user-selected display settings (theme, custom palette)
 * once on application mount and listens to system theme changes.
 * 
 * @returns {null} Renders no UI.
 */
export default function DisplaySettingsInitializer() {
  useEffect(() => {
    // Apply on first mount
    applyDisplaySettings()

    // Add listener for system theme changes if theme is set to 'system'
    const mediaQuery = globalThis.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemThemeChange = () => {
      applyDisplaySettings()
    }

    mediaQuery.addEventListener('change', handleSystemThemeChange)
    
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange)
    }
  }, [])

  return null
}
