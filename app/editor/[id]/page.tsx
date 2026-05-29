'use client'

import { use, useCallback, useDeferredValue, useEffect, useRef, useState, ChangeEvent } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { CV, CVData } from '@/lib/types'
import getCVById from '@/lib/getCVById'
import saveCV from '@/lib/saveCV'
import { createEmptyCVData, normalizeCVData } from '@/lib/cvDefaults'
import {
  Cog6ToothIcon as Settings,
  PrinterIcon as Printer,
  ArrowDownTrayIcon as Download,
  ArrowUpTrayIcon as Upload,
  ArrowLeftIcon as ArrowLeft,
  PencilSquareIcon as Edit3,
  CheckIcon as Check,
  XMarkIcon as X
} from '@heroicons/react/24/outline'
import ThemeSwitcher from '@/components/ThemeSwitcher'
import { getActivePalette } from '@/lib/displaySettings'

const PanelFallback = () => (
  <div className="h-full min-h-[320px] w-full animate-pulse rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
    <div className="h-5 w-36 rounded bg-gray-100 dark:bg-gray-800" />
    <div className="mt-6 space-y-4">
      <div className="h-10 rounded-lg bg-gray-100 dark:bg-gray-800" />
      <div className="h-10 rounded-lg bg-gray-100 dark:bg-gray-800" />
      <div className="h-28 rounded-lg bg-gray-100 dark:bg-gray-800" />
    </div>
  </div>
)

const PreviewFallback = () => (
  <div className="min-h-[842px] w-full animate-pulse bg-white dark:bg-gray-800" />
)

const CVForm = dynamic(() => import('@/components/CVForm'), {
  loading: () => <PanelFallback />,
  ssr: false
})

const CVPreview = dynamic(() => import('@/components/CVPreview'), {
  loading: () => <PreviewFallback />,
  ssr: false
})

interface EditorPageProps {
  readonly params: Promise<{ id: string }>
}

/**
 * The CV Editor Workspace Page.
 * Manages the editing, preview, and export operations for a single CV loaded from local storage.
 * 
 * @param {EditorPageProps} props - The component props containing the params promise.
 * @returns {JSX.Element | null} The rendered editor page workspace.
 */
export default function EditorPage({ params }: EditorPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const [cv, setCv] = useState<CV | null>(null)
  const [mounted, setMounted] = useState<boolean>(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false)
  const [showResetModal, setShowResetModal] = useState<boolean>(false)
  const [isRenaming, setIsRenaming] = useState<boolean>(false)
  const [newTitle, setNewTitle] = useState<string>('')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingSaveRef = useRef<CV | null>(null)
  const deferredCVData = useDeferredValue(cv?.data)

  const flushPendingSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }

    if (!pendingSaveRef.current) return

    saveCV(pendingSaveRef.current)
    pendingSaveRef.current = null
    setSaveStatus('saved')
  }, [])

  // Load CV on mount
  useEffect(() => {
    const loadedCV = getCVById(id)
    Promise.resolve().then(() => {
      if (loadedCV) {
        setCv(loadedCV)
        setNewTitle(loadedCV.title)
      } else {
        // If CV not found, redirect to library
        router.push('/')
      }
      setMounted(true)
    })
  }, [id, router])

  useEffect(() => {
    const handleBeforeUnload = () => {
      flushPendingSave()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      flushPendingSave()
    }
  }, [flushPendingSave])

  useEffect(() => {
    if (saveStatus === 'saved') {
      const timer = setTimeout(() => {
        setSaveStatus('idle')
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [saveStatus])

  useEffect(() => {
    if (!isPreviewOpen) return

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsPreviewOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isPreviewOpen])

  const handleDataChange = useCallback((newData: CVData) => {
    if (!cv) return
    setSaveStatus('saving')
    const updatedCV: CV = {
      ...cv,
      data: newData,
      updatedAt: new Date().toISOString()
    }
    setCv(updatedCV)
    pendingSaveRef.current = updatedCV

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      flushPendingSave()
    }, 400)
  }, [cv, flushPendingSave])

  const handleRenameSave = () => {
    if (!cv || !newTitle.trim()) return
    const updatedCV: CV = {
      ...cv,
      title: newTitle.trim(),
      updatedAt: new Date().toISOString()
    }
    setCv(updatedCV)
    pendingSaveRef.current = null
    saveCV(updatedCV)
    setSaveStatus('saved')
    setIsRenaming(false)
  }

  const handleClear = () => {
    setShowResetModal(true)
  }

  const confirmClear = () => {
    const initialData: CVData = createEmptyCVData({
      metadata: {
        template: 'classic',
        accentColor: getActivePalette().primary,
        fontFamily: 'sans'
      }
    })
    handleDataChange(initialData)
    setShowResetModal(false)
  }

  const getDownloadBaseName = () => {
    const sourceName = cv?.title || cv?.data.personalInfo.name || 'cv'
    return sourceName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'cv'
  }

  const handleDownloadPdf = async () => {
    if (!cv || isGeneratingPdf) return

    const printableArea = document.getElementById('cv-printable-area')
    if (!printableArea) return

    flushPendingSave()
    setIsGeneratingPdf(true)
    let shouldRestoreDarkClass = false

    try {
      const [{ toCanvas }, { jsPDF }] = await Promise.all([
        import('html-to-image'),
        import('jspdf')
      ])
      shouldRestoreDarkClass = document.documentElement.classList.contains('dark')
      document.documentElement.classList.remove('dark')
      await new Promise((resolve) => requestAnimationFrame(resolve))

      const canvas = await toCanvas(printableArea, {
        backgroundColor: '#ffffff',
        cacheBust: true,
        pixelRatio: 2,
        style: {
          backgroundColor: '#ffffff',
          color: '#111111'
        }
      })

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const imageWidth = pageWidth
      const imageHeight = (canvas.height * imageWidth) / canvas.width
      const imageData = canvas.toDataURL('image/png')

      let yPosition = 0
      let remainingHeight = imageHeight

      pdf.addImage(imageData, 'PNG', 0, yPosition, imageWidth, imageHeight)
      remainingHeight -= pageHeight

      while (remainingHeight > 0.5) {
        yPosition -= pageHeight
        pdf.addPage()
        pdf.addImage(imageData, 'PNG', 0, yPosition, imageWidth, imageHeight)
        remainingHeight -= pageHeight
      }

      pdf.save(`${getDownloadBaseName()}.pdf`)
    } catch (error) {
      console.error('Failed to generate PDF', error)
      alert('Failed to generate the PDF. Please try again.')
    } finally {
      if (shouldRestoreDarkClass) {
        document.documentElement.classList.add('dark')
      }
      setIsGeneratingPdf(false)
    }
  }

  const handleExportJSON = () => {
    if (!cv) return
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(cv.data, null, 2)
    )}`
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', jsonString)
    
    downloadAnchor.setAttribute('download', `${getDownloadBaseName()}_backup.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  const handleImportJSON = (e: ChangeEvent<HTMLInputElement>) => {
    if (!cv) return
    const file = e.target.files?.[0]
    if (!file) return

    const fileReader = new FileReader()
    fileReader.readAsText(file, 'UTF-8')
    fileReader.onload = (event) => {
      try {
        if (event.target?.result) {
          const parsed = JSON.parse(event.target.result as string)
          if (parsed.personalInfo && parsed.experience && parsed.education && parsed.skills) {
            // Guarantee layout fields
            if (!parsed.metadata) {
              parsed.metadata = {
                template: 'classic',
                accentColor: getActivePalette().primary,
                fontFamily: 'serif'
              }
            }
            handleDataChange(normalizeCVData(parsed))
          } else {
            alert('Invalid backup file format. Make sure it is a valid AI CV Builder JSON.')
          }
        }
      } catch (err) {
        console.error(err)
        alert('Failed to parse backup file.')
      }
    }
    // Reset file input value so same file can be imported again
    e.target.value = ''
  }

  if (!mounted || !cv) return null

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col font-sans">
      
      {/* Top Navigation Bar */}
      <header className="print:hidden bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800/80 py-3 px-6 sticky top-0 z-20 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4 flex-1">
          <Link 
            href="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white bg-gray-50 hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800 border border-gray-200/50 dark:border-gray-800/50 px-3 py-2 rounded-lg transition-colors"
          >
            <ArrowLeft width={14} height={14} />
            Library
          </Link>
          
          <div className="h-5 w-px bg-gray-200 dark:bg-gray-800" />
          
          {/* Editable CV Title */}
          {isRenaming ? (
            <div className="flex items-center gap-2 max-w-xs sm:max-w-md">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameSave()
                  if (e.key === 'Escape') {
                    setNewTitle(cv.title)
                    setIsRenaming(false)
                  }
                }}
                className="px-2.5 py-1 text-sm border rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                autoFocus
              />
              <button
                onClick={handleRenameSave}
                className="p-1.5 text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950/30 rounded-lg transition-colors"
                title="Save Title"
              >
                <Check width={14} height={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group max-w-[200px] sm:max-w-md overflow-hidden">
              <span className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">
                {cv.title}
              </span>
              <button
                onClick={() => setIsRenaming(true)}
                className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity rounded"
                title="Rename CV"
              >
                <Edit3 width={13} height={13} />
              </button>
            </div>
          )}

          {/* Save Status Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 font-medium">
            <div className="h-4 w-px bg-gray-200 dark:bg-gray-800" />
            {saveStatus === 'saving' && (
              <span className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Saving...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400 relative">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping absolute inline-flex" />
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 relative inline-flex" /> Saved
              </span>
            )}
            {saveStatus === 'idle' && (
              <span className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700" /> Autosaved
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <ThemeSwitcher />
          <Link 
            href="/settings"
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white bg-gray-50 hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800 border border-gray-200/50 dark:border-gray-800/50 px-3.5 py-2 rounded-lg transition-colors"
          >
            <Settings width={14} height={14} />
            Settings
          </Link>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 px-4 py-4 md:px-6 md:py-6 print:m-0 print:block print:h-auto print:overflow-visible print:p-0">
        <div className="print:hidden">
          <CVForm 
            data={cv.data} 
            onChange={handleDataChange} 
            onClear={handleClear} 
            onPreview={() => setIsPreviewOpen(true)}
          />
        </div>
      </main>

      <button
        type="button"
        aria-label="Close preview"
        aria-hidden={!isPreviewOpen}
        tabIndex={isPreviewOpen ? 0 : -1}
        onClick={() => setIsPreviewOpen(false)}
        className={`fixed inset-0 z-30 bg-gray-950/45 backdrop-blur-[2px] transition-opacity duration-300 print:hidden ${
          isPreviewOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        aria-hidden={!isPreviewOpen}
        className={`fixed inset-y-0 right-0 z-40 flex w-full flex-col overflow-hidden border-l border-gray-100 bg-white shadow-2xl transition-transform duration-300 ease-out dark:border-gray-800 dark:bg-gray-900 md:w-[min(1040px,calc(100vw-48px))] print:static print:z-auto print:block print:h-auto print:w-full print:translate-x-0 print:overflow-visible print:border-0 print:bg-white print:shadow-none ${
          isPreviewOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Preview Panel Action Bar */}
        <div className="print:hidden px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md flex flex-wrap justify-between items-center gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPreviewOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200/70 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
              title="Close Preview"
            >
              <X width={16} height={16} />
            </button>
            <div>
              <h2 className="font-semibold text-xs text-gray-800 dark:text-gray-200 tracking-wide uppercase">Print & Export</h2>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">Generate your final document layout</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJSON}
              className="flex items-center justify-center p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-blue-950/30 rounded-lg border border-gray-200/50 dark:border-gray-800/50 transition-colors"
              title="Export Backup (JSON)"
            >
              <Download width={14} height={14} />
            </button>

            <label 
              className="flex items-center justify-center p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-blue-950/30 rounded-lg border border-gray-200/50 dark:border-gray-800/50 cursor-pointer transition-colors"
              title="Import Backup (JSON)"
            >
              <Upload width={14} height={14} />
              <input 
                type="file" 
                accept=".json" 
                onChange={handleImportJSON} 
                className="hidden" 
              />
            </label>

            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 text-xs font-bold bg-gray-900 hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500 text-white px-4 py-2 rounded-lg shadow-sm transition-colors"
            >
              <Printer width={13} height={13} />
              {isGeneratingPdf ? 'Generating...' : 'Download PDF'}
            </button>
          </div>
        </div>

        {/* Interactive Preview Viewport */}
        <div className="flex-1 overflow-y-auto p-0 flex items-start relative [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-[10px] [&::-webkit-scrollbar-thumb]:bg-gray-400/25 hover:[&::-webkit-scrollbar-thumb]:bg-gray-400/45 print:block print:overflow-visible print:bg-white print:bg-none print:p-0">
          <div className="w-full transition-all duration-300 print:max-w-none print:overflow-visible">
            <CVPreview data={deferredCVData || cv.data} />
          </div>
        </div>
      </aside>

      {/* Confirmation Modals */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-x-hidden overflow-y-auto transition duration-200 ease-out">
          <button 
            onClick={() => setShowResetModal(false)}
            className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-xs transition-opacity w-full h-full border-0 cursor-default" 
            aria-label="Close Modal"
          />
          <div className="relative w-full max-w-md bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-2xl p-6 overflow-hidden transition-all text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-4 text-xl">
              ⚠️
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Reset CV Data?
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              Are you sure you want to reset all CV fields? All information will be cleared. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmClear}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500 text-white rounded-xl font-semibold text-sm shadow-sm transition-colors cursor-pointer"
              >
                Reset Fields
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Save Completed Toast Notification */}
      {saveStatus === 'saved' && (
        <div className="fixed bottom-6 right-6 z-50 print:hidden transition duration-200 ease-out">
          <div className="bg-white dark:bg-gray-900 border border-green-100 dark:border-green-950/50 shadow-2xl px-4.5 py-3.5 rounded-2xl flex items-center gap-3 max-w-sm">
            <div className="w-8 h-8 rounded-full bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 flex items-center justify-center text-sm shrink-0">
              ✓
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900 dark:text-white">Changes Saved!</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Your CV has been successfully updated in browser storage.</p>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
