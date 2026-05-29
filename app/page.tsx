'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  PlusIcon as Plus,
  TrashIcon as Trash2,
  DocumentDuplicateIcon as Copy,
  PencilSquareIcon as Edit3,
  MagnifyingGlassIcon as Search,
  ClockIcon as Clock,
  Cog6ToothIcon as Settings,
  BriefcaseIcon as Briefcase,
  UserIcon as User,
  ArrowTopRightOnSquareIcon as ExternalLink,
  SparklesIcon as Wand2,
  CheckIcon as Check
} from '@heroicons/react/24/outline'
import ThemeSwitcher from '@/components/ThemeSwitcher'
import { CV, CVTemplate } from '@/lib/types'
import getCVs from '@/lib/getCVs'
import saveCV from '@/lib/saveCV'
import createCV from '@/lib/createCV'
import deleteCV from '@/lib/deleteCV'
import formatTimeAgo from '@/lib/formatTimeAgo'
import { getSampleData } from '@/lib/samples'
import { getActivePalette, resolveAppAccentColor } from '@/lib/displaySettings'

const TEMPLATE_OPTIONS = [
  { id: 'classic', title: 'Classic Serif', desc: 'Centered, highly academic' },
  { id: 'classic-ats', title: 'Classic ATS', desc: 'Plain single-column parser-friendly layout' },
  { id: 'modern', title: 'Modern Split', desc: 'Two-column sidebar structure' },
  { id: 'minimalist', title: 'Minimalist', desc: 'Sleek, low padding, single page' },
  { id: 'creative', title: 'Creative Banner', desc: 'Colored accent, bold titles' },
  { id: 'executive', title: 'Executive Brief', desc: 'Boardroom header, polished hierarchy' },
  { id: 'editorial', title: 'Editorial Profile', desc: 'Magazine-style identity treatment' },
  { id: 'technical', title: 'Technical Matrix', desc: 'Dense, skills-forward engineering layout' }
] satisfies Array<{ id: CVTemplate; title: string; desc: string }>

/**
 * The Library Page of the AI CV Builder.
 * Serves as the dashboard where users can see, search, duplicate, rename,
 * delete, and create multiple CVs.
 * 
 * @returns {JSX.Element | null} The rendered library page dashboard.
 */
export default function LibraryPage() {
  const router = useRouter()
  const [cvs, setCvs] = useState<CV[]>([])
  const [mounted, setMounted] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>('')
  
  // Modals / Action States
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false)
  const [newCvTitle, setNewCvTitle] = useState<string>('')
  const [newCvTemplate, setNewCvTemplate] = useState<CVTemplate>('classic')
  
  const [deleteCandidate, setDeleteCandidate] = useState<CV | null>(null)
  const [renameCandidate, setRenameCandidate] = useState<CV | null>(null)
  const [renameTitle, setRenameTitle] = useState<string>('')

  // Load CVs list on mount
  useEffect(() => {
    const list = getCVs()
    Promise.resolve().then(() => {
      setCvs(list)
      setMounted(true)
    })
  }, [])

  const refreshList = () => {
    setCvs(getCVs())
  }

  const handleCreateCV = () => {
    if (!newCvTitle.trim()) return
    const palette = getActivePalette()
    const newCV = createCV(newCvTitle.trim(), {
      metadata: {
        template: newCvTemplate,
        accentColor: palette.primary,
        fontFamily: 'sans'
      }
    })
    setShowCreateModal(false)
    setNewCvTitle('')
    router.push(`/editor/${newCV.id}`)
  }

  const handleCreateSample = () => {
    const sampleData = getSampleData()
    sampleData.metadata = {
      template: sampleData.metadata?.template || 'classic',
      accentColor: getActivePalette().primary,
      fontFamily: sampleData.metadata?.fontFamily || 'sans'
    }
    const title = sampleData.personalInfo.name ? `${sampleData.personalInfo.name}'s Sample CV` : 'Sample CV'
    createCV(title, sampleData)
    refreshList()
  }

  const handleDuplicateCV = (cv: CV) => {
    const title = `${cv.title} (Copy)`
    createCV(title, cv.data)
    refreshList()
  }

  const handleDeleteConfirm = () => {
    if (!deleteCandidate) return
    deleteCV(deleteCandidate.id)
    setDeleteCandidate(null)
    refreshList()
  }

  const handleRenameSave = () => {
    if (!renameCandidate || !renameTitle.trim()) return
    const updatedCV: CV = {
      ...renameCandidate,
      title: renameTitle.trim(),
      updatedAt: new Date().toISOString()
    }
    saveCV(updatedCV)
    setRenameCandidate(null)
    setRenameTitle('')
    refreshList()
  }

  // Filter CVs based on search query
  const filteredCvs = useMemo(() => cvs.filter((cv) => {
    const titleMatch = cv.title.toLowerCase().includes(searchQuery.toLowerCase())
    const nameMatch = cv.data.personalInfo.name.toLowerCase().includes(searchQuery.toLowerCase())
    const roleMatch = cv.data.personalInfo.title.toLowerCase().includes(searchQuery.toLowerCase())
    return titleMatch || nameMatch || roleMatch
  }), [cvs, searchQuery])

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col font-sans">
      
      {/* Navigation Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800/80 py-3.5 px-6 sticky top-0 z-20 flex justify-between items-center shadow-sm">
        <h1 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
          <span className="bg-linear-to-tr from-blue-600 to-indigo-600 text-white p-1.5 rounded-lg text-sm font-black flex items-center justify-center">
            AI
          </span>
          <span className="bg-linear-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
            CV Builder
          </span>
        </h1>
        
        <div className="flex items-center gap-4">
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

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10 flex flex-col gap-8">
        
        {/* Header / Intro Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Your CV Library</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create, organize, and manage multiple resumes tailored to different roles</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Create New CV */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl shadow-md shadow-blue-500/10 transition-colors"
            >
              <Plus width={15} height={15} />
              Create New CV
            </button>
          </div>
        </div>

        {/* Search & Statistics Filter Bar */}
        {cvs.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 rounded-2xl shadow-xs">
            <div className="relative w-full sm:max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Search width={16} height={16} />
              </span>
              <input
                type="text"
                placeholder="Search CVs by title, your name, or professional title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-xl border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/50 text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-gray-900 dark:text-gray-100 transition-all placeholder-gray-400"
              />
            </div>
            
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 shrink-0">
              Showing {filteredCvs.length} of {cvs.length} documents
            </div>
          </div>
        )}

        {/* CV Grid Layout */}
        {filteredCvs.length === 0 ? (
          /* Empty / Unfound State */
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-12 text-center flex flex-col items-center justify-center max-w-2xl mx-auto w-full shadow-sm">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6 text-2xl shadow-inner">
              📄
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {cvs.length === 0 ? "Let's build your professional story!" : "No matches found"}
            </h3>
            
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 max-w-md leading-relaxed">
              {cvs.length === 0 
                ? 'Create custom professional resumes tailored for specific roles. Generate your content with AI, pick style templates, and download print-ready PDFs.'
                : 'We couldn’t find any CVs matching your search query. Try typing something else or clear the input.'
              }
            </p>

            {cvs.length === 0 ? (
              <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                <button
                  onClick={handleCreateSample}
                  className="px-6 py-3 bg-blue-50 hover:bg-blue-100/80 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl font-semibold text-sm transition-colors border border-blue-100 dark:border-blue-900/50 flex items-center justify-center gap-1.5"
                >
                  <Wand2 width={14} height={14} />
                  Load Rich Sample CV
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/10 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus width={16} height={16} />
                  Create From Scratch
                </button>
              </div>
            ) : (
              <button
                onClick={() => setSearchQuery('')}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-xs transition-colors"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          /* Active CV Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition duration-200 ease-out">
            {filteredCvs.map((cv) => {
              const personalName = cv.data.personalInfo.name.trim()
              const professionalTitle = cv.data.personalInfo.title.trim()
              const templateObj = TEMPLATE_OPTIONS.find((t) => t.id === cv.data.metadata?.template)
              
              return (
                <div 
                  key={cv.id}
                  className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 rounded-2xl shadow-xs hover:shadow-lg hover:border-blue-500/20 dark:hover:border-blue-500/20 transition-all flex flex-col overflow-hidden group"
                >
                  {/* Card Visual Header Accent */}
                  <div 
                    className="h-2 w-full transition-all"
                    style={{ backgroundColor: resolveAppAccentColor(cv.data.metadata?.accentColor) }}
                  />

                  {/* Card Core Info */}
                  <div className="p-6 flex-1 flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 dark:text-white truncate text-base" title={cv.title}>
                          {cv.title}
                        </h4>
                        <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500 text-[11px] mt-1 font-medium">
                          <Clock width={11} height={11} />
                          <span>Updated {formatTimeAgo(cv.updatedAt)}</span>
                        </div>
                      </div>
                      
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400 border border-gray-100 dark:border-gray-700 shrink-0">
                        {templateObj?.title || 'Classic'}
                      </span>
                    </div>

                    <div className="h-px bg-gray-100 dark:bg-gray-800" />

                    {/* Metadata Content Summary */}
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-xs">
                        <User width={13} height={13} className="text-gray-400 dark:text-gray-500" />
                        <span className="font-semibold text-gray-700 dark:text-gray-300 truncate">
                          {personalName || <span className="text-gray-300 dark:text-gray-700 italic">No Name Added</span>}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Briefcase width={13} height={13} className="text-gray-400 dark:text-gray-500" />
                        <span className="text-gray-500 dark:text-gray-400 truncate">
                          {professionalTitle || <span className="text-gray-300 dark:text-gray-700 italic">No Title Added</span>}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions Bottom Panel */}
                  <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-900/40 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1">
                      {/* Rename CV */}
                      <button
                        onClick={() => {
                          setRenameCandidate(cv)
                          setRenameTitle(cv.title)
                        }}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-blue-950/30 rounded-lg transition-colors"
                        title="Rename CV"
                      >
                        <Edit3 width={14} height={14} />
                      </button>

                      {/* Duplicate CV */}
                      <button
                        onClick={() => handleDuplicateCV(cv)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-blue-950/30 rounded-lg transition-colors"
                        title="Duplicate CV"
                      >
                        <Copy width={14} height={14} />
                      </button>

                      {/* Delete CV */}
                      <button
                        onClick={() => setDeleteCandidate(cv)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                        title="Delete CV"
                      >
                        <Trash2 width={14} height={14} />
                      </button>
                    </div>

                    <Link
                      href={`/editor/${cv.id}`}
                      className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                    >
                      <span>Edit & Design</span>
                      <ExternalLink width={12} height={12} />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </main>

      {/* 1. CREATE NEW CV MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-x-hidden overflow-y-auto transition duration-200 ease-out">
          <button 
            onClick={() => setShowCreateModal(false)}
            className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-xs transition-opacity w-full h-full border-0 cursor-default" 
            aria-label="Close Modal"
          />
          
          <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-2xl p-6 overflow-hidden transition-all">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              Create New CV
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
              Enter a name and pick a visual template to kickstart your CV
            </p>
            
            <div className="space-y-5">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="new-cv-title" className="text-xs font-semibold text-gray-600 dark:text-gray-400">CV Document Title</label>
                <input
                  id="new-cv-title"
                  type="text"
                  placeholder="e.g. Senior Frontend Engineer CV"
                  value={newCvTitle}
                  onChange={(e) => setNewCvTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateCV()
                  }}
                  className="px-3.5 py-2.5 border rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 dark:text-gray-100 transition-all placeholder-gray-400"
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Starting Template</span>
                <div className="grid grid-cols-2 gap-3">
                  {TEMPLATE_OPTIONS.map((tpl) => {
                    const isSelected = newCvTemplate === tpl.id
                    return (
                      <button
                        key={tpl.id}
                        onClick={() => setNewCvTemplate(tpl.id)}
                        className={`p-3 border rounded-xl text-left transition-all ${
                          isSelected 
                            ? 'border-blue-600 bg-blue-50/5 dark:border-blue-500 dark:bg-blue-950/10 ring-2 ring-blue-500/10'
                            : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-gray-900 dark:text-gray-100">{tpl.title}</span>
                          {isSelected && (
                            <div className="w-3.5 h-3.5 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center text-white text-[9px]">
                              <Check width={9} height={9} strokeWidth={3} />
                            </div>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">{tpl.desc}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCV}
                  disabled={!newCvTitle.trim()}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-sm transition-colors cursor-pointer disabled:opacity-45"
                >
                  Create Document
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. RENAME CV MODAL */}
      {renameCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-x-hidden overflow-y-auto transition duration-200 ease-out">
          <button 
            onClick={() => setRenameCandidate(null)}
            className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-xs transition-opacity w-full h-full border-0 cursor-default" 
            aria-label="Close Modal"
          />
          
          <div className="relative w-full max-w-md bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-2xl p-6 overflow-hidden transition-all">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              Rename CV
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
              Change the title of your CV document
            </p>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Enter CV title..."
                value={renameTitle}
                onChange={(e) => setRenameTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameSave()
                }}
                className="w-full px-3.5 py-2.5 border rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 dark:text-gray-100 transition-all placeholder-gray-400"
                autoFocus
              />

              <div className="flex gap-3 justify-end pt-2">
                <button
                  onClick={() => setRenameCandidate(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRenameSave}
                  disabled={!renameTitle.trim()}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-sm transition-colors cursor-pointer disabled:opacity-45"
                >
                  Save Title
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. DELETE CV MODAL */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-x-hidden overflow-y-auto transition duration-200 ease-out">
          <button 
            onClick={() => setDeleteCandidate(null)}
            className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-xs transition-opacity w-full h-full border-0 cursor-default" 
            aria-label="Close Modal"
          />
          
          <div className="relative w-full max-w-md bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-2xl p-6 overflow-hidden transition-all text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-4 text-xl">
              ⚠️
            </div>
            
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Delete CV Document?
            </h3>
            
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-gray-800 dark:text-gray-200">“{deleteCandidate.title}”</span>? All data in this CV will be permanently deleted. This action cannot be undone.
            </p>
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setDeleteCandidate(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500 text-white rounded-xl font-bold text-sm shadow-sm transition-colors cursor-pointer"
              >
                Delete Document
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
