'use client'

import { AI_MODEL_OPTIONS, AppSettings, getProviderModel, getSettings, saveSettings, Provider } from '@/lib/settings'
import { ArrowLeftIcon as ArrowLeft } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import ThemeSwitcher from '@/components/ThemeSwitcher'
import SettingsNavSidebar from '@/components/SettingsNavSidebar'

/**
 * SettingsPage renders the form to manage AI providers, models, and API keys.
 * and configure API keys. It persists configuration in local storage.
 * Fully supports dark mode.
 * 
 * @returns {JSX.Element} The rendered settings page structure.
 */
export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>({
    provider: 'openai',
    openaiKey: '',
    googleKey: '',
    anthropicKey: '',
    openaiModel: 'gpt-4o-mini',
    googleModel: 'gemini-2.5-pro',
    anthropicModel: 'claude-sonnet-4-5-20250929',
    debugLogging: false
  })
  const [mounted, setMounted] = useState<boolean>(false)
  const [savedStatus, setSavedStatus] = useState<boolean>(false)
  const saveDebounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedStatusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSettings(getSettings())
    setMounted(true)

    return () => {
      if (saveDebounceTimeoutRef.current) {
        clearTimeout(saveDebounceTimeoutRef.current)
      }
      if (savedStatusTimeoutRef.current) {
        clearTimeout(savedStatusTimeoutRef.current)
      }
    }
  }, [])

  const persistSettings = (updatedSettings: AppSettings) => {
    setSettings(updatedSettings)

    if (saveDebounceTimeoutRef.current) {
      clearTimeout(saveDebounceTimeoutRef.current)
    }

    saveDebounceTimeoutRef.current = setTimeout(() => {
      saveSettings(updatedSettings)
      setSavedStatus(true)

      if (savedStatusTimeoutRef.current) {
        clearTimeout(savedStatusTimeoutRef.current)
      }

      savedStatusTimeoutRef.current = setTimeout(() => {
        setSavedStatus(false)
      }, 1800)
    }, 250)
  }

  const activeModelKey = `${settings.provider}Model` as const

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col font-sans">
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
          <SettingsNavSidebar active="ai" />

          <section className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm p-8 w-full flex-1">
          <div className="border-b border-gray-100 dark:border-gray-800 pb-4 mb-6">
            <h2 className="text-2xl font-black text-gray-800 dark:text-white">AI & Models</h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Select the provider, model, and API keys used for AI requests.
            </p>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">AI Provider</label>
              <select 
                value={settings.provider}
                onChange={(e) => persistSettings({ ...settings, provider: e.target.value as Provider })}
                className="p-3 border rounded-lg bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 dark:text-gray-100 transition-all"
              >
                <option value="openai">OpenAI (GPT-4o-mini)</option>
                <option value="google">Google (Gemini 2.5 Pro)</option>
                <option value="anthropic">Anthropic (Claude)</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">AI Model</label>
              <input
                list="ai-model-options"
                value={getProviderModel(settings)}
                onChange={(e) => persistSettings({ ...settings, [activeModelKey]: e.target.value } as AppSettings)}
                className="p-3 border rounded-lg bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 dark:text-gray-100 transition-all"
                placeholder="Enter a model ID"
              />
              <datalist id="ai-model-options">
                {AI_MODEL_OPTIONS[settings.provider].map((model) => (
                  <option key={model.value} value={model.value}>
                    {model.label}
                  </option>
                ))}
              </datalist>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Model IDs are provider-specific. Pick a suggested model or enter a newer compatible model ID.
              </p>
            </div>

            <div className={`flex flex-col gap-2 transition-opacity duration-200 ${settings.provider !== 'openai' ? 'opacity-60' : ''}`}>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">OpenAI API Key</label>
              <input 
                type="password"
                placeholder="sk-..."
                value={settings.openaiKey}
                onChange={(e) => persistSettings({ ...settings, openaiKey: e.target.value })}
                className="p-3 border rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 dark:text-gray-100 transition-all placeholder-gray-400"
              />
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Your key is stored locally in your browser and never saved to a database.
              </p>
            </div>

            <div className={`flex flex-col gap-2 transition-opacity duration-200 ${settings.provider !== 'google' ? 'opacity-60' : ''}`}>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Google Gemini API Key</label>
              <input 
                type="password"
                placeholder="AIza..."
                value={settings.googleKey}
                onChange={(e) => persistSettings({ ...settings, googleKey: e.target.value })}
                className="p-3 border rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 dark:text-gray-100 transition-all placeholder-gray-400"
              />
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Get your key from Google AI Studio. Stored locally in your browser.
              </p>
            </div>

            <div className={`flex flex-col gap-2 transition-opacity duration-200 ${settings.provider !== 'anthropic' ? 'opacity-60' : ''}`}>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Anthropic API Key</label>
              <input
                type="password"
                placeholder="sk-ant-..."
                value={settings.anthropicKey}
                onChange={(e) => persistSettings({ ...settings, anthropicKey: e.target.value })}
                className="p-3 border rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 dark:text-gray-100 transition-all placeholder-gray-400"
              />
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Create a key in the Anthropic Console. Stored locally in your browser.
              </p>
            </div>

          </div>
          </section>
        </div>
      </main>

      {savedStatus && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl border border-green-100 bg-white px-4 py-3 shadow-2xl transition duration-200 ease-out dark:border-green-950/50 dark:bg-gray-900">
          <p className="text-xs font-bold text-gray-900 dark:text-white">AI settings saved</p>
          <p className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">Your provider and model preferences were saved automatically.</p>
        </div>
      )}
    </div>
  )
}
