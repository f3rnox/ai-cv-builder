'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeftIcon as ArrowLeft, SwatchIcon as Palette } from '@heroicons/react/24/outline'
import ThemeSwitcher from '@/components/ThemeSwitcher'
import SettingsNavSidebar from '@/components/SettingsNavSidebar'
import { 
  DisplaySettings, 
  COLOR_PALETTES, 
  getDisplaySettings, 
  saveDisplaySettings, 
  generatePaletteFromHex
} from '@/lib/displaySettings'

/**
 * DisplaySettingsPage renders the display and theme configurations, including theme toggles,
 * font sizes, and a highly interactive, custom color palette selector that dynamically updates 
 * the application's global colors on save.
 * 
 * @returns {JSX.Element} Renders the display settings page.
 */
export default function DisplaySettingsPage() {
  const [settings, setSettings] = useState<DisplaySettings>({
    theme: 'system',
    paletteId: 'sapphire',
    fontSize: 'base',
    cardStyle: 'bordered'
  })
  
  const [mounted, setMounted] = useState<boolean>(false)
  const [savedStatus, setSavedStatus] = useState<boolean>(false)
  const [customColor, setCustomColor] = useState<string>('#2563eb')
  const savedStatusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const loadedSettings = getDisplaySettings()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSettings(loadedSettings)
    if (loadedSettings.customPalette) {
      setCustomColor(loadedSettings.customPalette.primary)
    }
    setMounted(true)

    return () => {
      if (savedStatusTimeoutRef.current) {
        clearTimeout(savedStatusTimeoutRef.current)
      }
    }
  }, [])

  const persistDisplaySettings = (updatedSettings: DisplaySettings) => {
    saveDisplaySettings(updatedSettings)
    setSavedStatus(true)

    if (savedStatusTimeoutRef.current) {
      clearTimeout(savedStatusTimeoutRef.current)
    }

    savedStatusTimeoutRef.current = setTimeout(() => {
      setSavedStatus(false)
    }, 1800)
  }

  const handlePaletteSelect = (paletteId: string) => {
    const updatedSettings = { ...settings, paletteId }
    if (paletteId === 'custom') {
      const generated = generatePaletteFromHex(customColor)
      updatedSettings.customPalette = generated
    }
    setSettings(updatedSettings)
    persistDisplaySettings(updatedSettings)
  }

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value
    setCustomColor(color)
    if (settings.paletteId === 'custom') {
      const generated = generatePaletteFromHex(color)
      const updatedSettings = {
        ...settings,
        customPalette: generated
      }
      setSettings(updatedSettings)
      persistDisplaySettings(updatedSettings)
    }
  }

  if (!mounted) return null

  const isCustomSelected = settings.paletteId === 'custom'

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col font-sans">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800/80 py-4 px-6 flex items-center justify-between shadow-sm">
        <Link 
          href="/"
          className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft width={16} height={16} />
          Back to Builder
        </Link>
        <ThemeSwitcher />
      </header>

      <main className="flex-1 py-12 px-6">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 lg:flex-row lg:items-start">
          <SettingsNavSidebar active="display" />

          <section className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm p-8 w-full flex-1">
          <div className="border-b border-gray-100 dark:border-gray-800 pb-4 mb-6">
            <h2 className="text-2xl font-black text-gray-800 dark:text-white">Display & Theme</h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Tune the application theme, accent palette, and document scale.
            </p>
          </div>

          <div className="flex flex-col gap-6">
            
            {/* 1. Theme Selection */}
            <div className="flex flex-col gap-2.5">
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Application Theme</span>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'light', name: '☀️ Light' },
                  { id: 'dark', name: '🌙 Dark' },
                  { id: 'system', name: '💻 System' }
                ].map((item) => {
                  const isSelected = settings.theme === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        const updated = { ...settings, theme: item.id as DisplaySettings['theme'] }
                        setSettings(updated)
                        persistDisplaySettings(updated)
                      }}
                      className={`py-3 border rounded-xl text-center text-xs font-semibold transition-all cursor-pointer ${
                        isSelected 
                          ? 'border-blue-600 bg-blue-50/5 dark:border-blue-500 dark:bg-blue-950/10 ring-2 ring-blue-500/10'
                          : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-800'
                      }`}
                    >
                      {item.name}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 2. Custom Color Palette Selector */}
            <div className="flex flex-col gap-2.5 pt-2 border-t border-gray-100 dark:border-gray-800">
              <div>
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                  <Palette width={14} height={14} />
                  Custom Color Palette
                </label>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">Select a primary color scheme for the application dashboard and editor</p>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {COLOR_PALETTES.map((palette) => {
                  const isSelected = settings.paletteId === palette.id
                  return (
                    <button
                      key={palette.id}
                      onClick={() => handlePaletteSelect(palette.id)}
                      className={`p-2.5 border rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all text-center cursor-pointer ${
                        isSelected 
                          ? 'border-blue-600 bg-blue-50/10 dark:border-blue-500 dark:bg-blue-950/20 ring-2 ring-blue-500/10'
                          : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-800'
                      }`}
                    >
                      <span 
                        className="w-5 h-5 rounded-full border border-black/5 dark:border-white/5 shadow-inner"
                        style={{ backgroundColor: palette.primary }}
                      />
                      <span className="text-[9px] font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap truncate w-full">
                        {palette.name.split(' ')[0]}
                      </span>
                    </button>
                  )
                })}

                {/* Custom Color Option */}
                <button
                  onClick={() => handlePaletteSelect('custom')}
                  className={`p-2.5 border rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all text-center cursor-pointer ${
                    isCustomSelected 
                      ? 'border-blue-600 bg-blue-50/10 dark:border-blue-500 dark:bg-blue-950/20 ring-2 ring-blue-500/10'
                      : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-800'
                  }`}
                >
                  <span 
                    className="w-5 h-5 rounded-full border border-dashed border-gray-400 dark:border-gray-500 flex items-center justify-center text-xs font-black"
                    style={{ backgroundColor: isCustomSelected ? customColor : 'transparent' }}
                  >
                    {!isCustomSelected && '+'}
                  </span>
                  <span className="text-[9px] font-bold text-gray-700 dark:text-gray-300">
                    Custom
                  </span>
                </button>
              </div>

              {/* Custom Color Input Field */}
              {isCustomSelected && (
                <div className="mt-2.5 p-4 bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-xl flex items-center justify-between gap-4 transition duration-200 ease-out">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Select Custom Color</span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">Pick any custom hex color</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={customColor}
                      onChange={handleCustomColorChange}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200 dark:border-gray-700 p-0"
                    />
                    <input
                      type="text"
                      value={customColor}
                      onChange={(e) => {
                        const val = e.target.value
                        if (val.startsWith('#') && val.length <= 7) {
                          setCustomColor(val)
                          if (val.length === 7) {
                            const generated = generatePaletteFromHex(val)
                            const updatedSettings = {
                              ...settings,
                              customPalette: generated
                            }
                            setSettings(updatedSettings)
                            persistDisplaySettings(updatedSettings)
                          }
                        }
                      }}
                      className="w-24 px-2.5 py-1.5 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 rounded-lg text-xs font-mono text-center outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 3. Font Size configuration */}
            <div className="flex flex-col gap-2.5 pt-2 border-t border-gray-100 dark:border-gray-800">
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Sidebar / Document Font Scale</span>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'sm', name: 'Small', label: 'Aa' },
                  { id: 'base', name: 'Regular', label: 'Aa' },
                  { id: 'lg', name: 'Large', label: 'Aa' }
                ].map((item) => {
                  const isSelected = settings.fontSize === item.id
                  const sizeMap: Record<string, string> = {
                    sm: 'text-xs',
                    lg: 'text-lg',
                    base: 'text-sm'
                  }
                  const sizeClass = sizeMap[item.id] || 'text-sm'
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        const updated = { ...settings, fontSize: item.id as DisplaySettings['fontSize'] }
                        setSettings(updated)
                        persistDisplaySettings(updated)
                      }}
                      className={`py-3.5 border rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        isSelected 
                          ? 'border-blue-600 bg-blue-50/5 dark:border-blue-500 dark:bg-blue-950/10 ring-2 ring-blue-500/10'
                          : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-800'
                      }`}
                    >
                      <span className={`font-bold leading-none ${sizeClass}`}>{item.label}</span>
                      <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mt-1">{item.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>

          </div>
          </section>
        </div>
      </main>

      {savedStatus && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl border border-green-100 bg-white px-4 py-3 shadow-2xl transition duration-200 ease-out dark:border-green-950/50 dark:bg-gray-900">
          <p className="text-xs font-bold text-gray-900 dark:text-white">Display settings saved</p>
          <p className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">Your preferences were applied automatically.</p>
        </div>
      )}
    </div>
  )
}
