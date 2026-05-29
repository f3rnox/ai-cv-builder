'use client'

import getCVs from '@/lib/getCVs'
import createCV from '@/lib/createCV'
import saveCVs from '@/lib/saveCVs'
import { applyDisplaySettings, DisplaySettings, getActivePalette, getDisplaySettings, saveDisplaySettings } from '@/lib/displaySettings'
import { AppSettings, getSettings, saveSettings } from '@/lib/settings'
import { CV, CVData } from '@/lib/types'
import { normalizeCVData } from '@/lib/cvDefaults'
import { ArrowDownTrayIcon, ArrowLeftIcon as ArrowLeft, ArrowUpTrayIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { ChangeEvent, useEffect, useRef, useState } from 'react'
import ThemeSwitcher from '@/components/ThemeSwitcher'
import SettingsNavSidebar from '@/components/SettingsNavSidebar'

export default function GeneralSettingsPage() {
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
  const [backupStatus, setBackupStatus] = useState<boolean>(false)
  const [importStatus, setImportStatus] = useState<string | null>(null)
  const importInputRef = useRef<HTMLInputElement | null>(null)
  const saveDebounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedStatusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const backupStatusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const importStatusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
      if (backupStatusTimeoutRef.current) {
        clearTimeout(backupStatusTimeoutRef.current)
      }
      if (importStatusTimeoutRef.current) {
        clearTimeout(importStatusTimeoutRef.current)
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

  const handleExportBackup = () => {
    const backup = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      cvs: getCVs(),
      settings: getSettings(),
      displaySettings: getDisplaySettings(),
      theme: globalThis.localStorage.getItem('theme') || 'light'
    }
    const backupJson = JSON.stringify(backup, null, 2)
    const blob = new Blob([backupJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const downloadAnchor = document.createElement('a')

    downloadAnchor.href = url
    downloadAnchor.download = `ai-cv-builder-backup-${timestamp}.json`
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
    URL.revokeObjectURL(url)

    setBackupStatus(true)
    if (backupStatusTimeoutRef.current) {
      clearTimeout(backupStatusTimeoutRef.current)
    }
    backupStatusTimeoutRef.current = setTimeout(() => {
      setBackupStatus(false)
    }, 1800)
  }

  const showImportStatus = (message: string) => {
    setImportStatus(message)
    if (importStatusTimeoutRef.current) {
      clearTimeout(importStatusTimeoutRef.current)
    }
    importStatusTimeoutRef.current = setTimeout(() => {
      setImportStatus(null)
    }, 2200)
  }

  const hasCVDataShape = (value: unknown): value is CVData => {
    if (typeof value !== 'object' || value === null) return false
    const candidate = value as Partial<CVData>
    return Boolean(candidate.personalInfo && candidate.experience && candidate.education && candidate.skills)
  }

  const handleImportBackup = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const fileReader = new FileReader()
    fileReader.readAsText(file, 'UTF-8')
    fileReader.onload = (loadEvent) => {
      try {
        const raw = loadEvent.target?.result
        if (typeof raw !== 'string') {
          throw new Error('Backup file is empty.')
        }

        const parsed = JSON.parse(raw) as {
          cvs?: CV[]
          settings?: AppSettings
          displaySettings?: DisplaySettings
          theme?: string
        } | CVData

        if ('cvs' in parsed && Array.isArray(parsed.cvs)) {
          saveCVs(parsed.cvs)
          if (parsed.settings) {
            saveSettings(parsed.settings)
            setSettings({ ...getSettings(), ...parsed.settings })
          }
          if (parsed.displaySettings) {
            saveDisplaySettings(parsed.displaySettings)
          }
          if (typeof parsed.theme === 'string') {
            localStorage.setItem('theme', parsed.theme)
          }
          applyDisplaySettings()
          showImportStatus('Backup imported')
          return
        }

        if (hasCVDataShape(parsed)) {
          const cvData = normalizeCVData(parsed)
          if (!cvData.metadata) {
            cvData.metadata = {
              template: 'classic',
              accentColor: getActivePalette().primary,
              fontFamily: 'serif'
            }
          }
          const importTitle = cvData.personalInfo.name
            ? `${cvData.personalInfo.name}'s Imported CV`
            : 'Imported CV'
          createCV(importTitle, cvData)
          showImportStatus('CV backup imported')
          return
        }

        throw new Error('Invalid backup file format.')
      } catch (error) {
        console.error(error)
        alert(error instanceof Error ? error.message : 'Failed to import backup file.')
      }
    }
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

      <main className="flex-1 py-12 px-6">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 lg:flex-row lg:items-start">
          <SettingsNavSidebar active="general" />

          <section className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm p-8 w-full flex-1">
            <div className="border-b border-gray-100 dark:border-gray-800 pb-4 mb-6">
              <h2 className="text-2xl font-black text-gray-800 dark:text-white">General</h2>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Configure app-level behavior and diagnostics.
              </p>
            </div>

            <div className="flex flex-col gap-6">
              <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.debugLogging}
                    onChange={(e) => persistSettings({ ...settings, debugLogging: e.target.checked })}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
                  />
                  <span>
                    <span className="block text-sm font-bold text-gray-800 dark:text-gray-100">Enable AI debug console logging</span>
                    <span className="mt-1 block text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                      Logs provider, model, prompt text, system instructions, and PDF file metadata for AI requests. API keys are never logged.
                    </span>
                  </span>
                </label>
              </div>

              <div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">Export backup</h3>
                    <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                      Download CVs, settings, display preferences, and locally stored API keys as JSON.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                    Export Backup
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">Import backup</h3>
                    <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                      Restore a full app backup or import an older single-CV JSON backup.
                    </p>
                  </div>
                  <input
                    ref={importInputRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => importInputRef.current?.click()}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    <ArrowUpTrayIcon className="h-4 w-4" />
                    Import Backup
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {savedStatus && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl border border-green-100 bg-white px-4 py-3 shadow-2xl transition duration-200 ease-out dark:border-green-950/50 dark:bg-gray-900">
          <p className="text-xs font-bold text-gray-900 dark:text-white">General settings saved</p>
          <p className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">Your preferences were saved automatically.</p>
        </div>
      )}

      {backupStatus && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl border border-green-100 bg-white px-4 py-3 shadow-2xl transition duration-200 ease-out dark:border-green-950/50 dark:bg-gray-900">
          <p className="text-xs font-bold text-gray-900 dark:text-white">Backup exported</p>
          <p className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">Your JSON backup download has started.</p>
        </div>
      )}

      {importStatus && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl border border-green-100 bg-white px-4 py-3 shadow-2xl transition duration-200 ease-out dark:border-green-950/50 dark:bg-gray-900">
          <p className="text-xs font-bold text-gray-900 dark:text-white">{importStatus}</p>
          <p className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">Your imported data is now available in the app.</p>
        </div>
      )}
    </div>
  )
}
