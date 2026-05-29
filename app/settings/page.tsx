'use client'

import { AppSettings, getSettings, saveSettings, Provider } from '@/lib/settings'
import { ArrowLeftIcon as ArrowLeft, BookmarkSquareIcon as Save } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import ThemeSwitcher from '@/components/ThemeSwitcher'

/**
 * SettingsPage renders the form to manage AI providers (OpenAI or Gemini)
 * and configure API keys. It persists configuration in local storage.
 * Fully supports dark mode.
 * 
 * @returns {JSX.Element} The rendered settings page structure.
 */
export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>({
    provider: 'openai',
    openaiKey: '',
    googleKey: ''
  })
  const [mounted, setMounted] = useState<boolean>(false)
  const [savedStatus, setSavedStatus] = useState<boolean>(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSettings(getSettings())
    setMounted(true)
  }, [])

  const handleSave = () => {
    saveSettings(settings)
    setSavedStatus(true)
    setTimeout(() => setSavedStatus(false), 2000)
  }

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

      <main className="flex-1 flex justify-center py-12 px-6">
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm p-8 w-full max-w-lg">
          
          {/* Subpage Tabs */}
          <div className="border-b border-gray-100 dark:border-gray-800 pb-4 mb-6">
            <h1 className="text-2xl font-black text-gray-800 dark:text-white mb-4">Settings</h1>
            <div className="flex bg-gray-50/50 dark:bg-gray-950 p-1 rounded-xl border border-gray-200/50 dark:border-gray-800/80">
              <Link
                href="/settings"
                className="flex-1 py-2.5 text-center text-xs font-bold rounded-lg bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-xs border border-gray-100 dark:border-gray-800/30"
              >
                AI Keys
              </Link>
              <Link
                href="/settings/display"
                className="flex-1 py-2.5 text-center text-xs font-semibold rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Display & Theme
              </Link>
            </div>
          </div>
          
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">AI Provider</label>
              <select 
                value={settings.provider}
                onChange={(e) => setSettings({ ...settings, provider: e.target.value as Provider })}
                className="p-3 border rounded-lg bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 dark:text-gray-100 transition-all"
              >
                <option value="openai">OpenAI (GPT-4o-mini)</option>
                <option value="google">Google (Gemini 2.5 Pro)</option>
              </select>
            </div>

            <div className={`flex flex-col gap-2 transition-opacity duration-200 ${settings.provider !== 'openai' ? 'opacity-40' : ''}`}>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">OpenAI API Key</label>
              <input 
                type="password"
                placeholder="sk-..."
                value={settings.openaiKey}
                onChange={(e) => setSettings({ ...settings, openaiKey: e.target.value })}
                className="p-3 border rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 dark:text-gray-100 transition-all placeholder-gray-400"
                disabled={settings.provider !== 'openai'}
              />
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Your key is stored locally in your browser and never saved to a database.
              </p>
            </div>

            <div className={`flex flex-col gap-2 transition-opacity duration-200 ${settings.provider !== 'google' ? 'opacity-40' : ''}`}>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Google Gemini API Key</label>
              <input 
                type="password"
                placeholder="AIza..."
                value={settings.googleKey}
                onChange={(e) => setSettings({ ...settings, googleKey: e.target.value })}
                className="p-3 border rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 dark:text-gray-100 transition-all placeholder-gray-400"
                disabled={settings.provider !== 'google'}
              />
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Get your key from Google AI Studio. Stored locally in your browser.
              </p>
            </div>

            <button 
              onClick={handleSave}
              className="mt-4 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white p-3 rounded-lg font-semibold text-sm shadow-sm transition-colors"
            >
              <Save width={16} height={16} />
              {savedStatus ? 'Saved!' : 'Save Settings'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
