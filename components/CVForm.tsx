'use client'

import {
  Award,
  CVData,
  CVMetadata,
  CVSectionId,
  CVTemplate,
  Certification,
  Education,
  Experience,
  Language,
  ProfessionalLink,
  Project,
  Publication,
  Volunteering
} from '@/lib/types'
import { getProviderApiKey, getProviderModel, getSettings } from '@/lib/settings'
import { getActivePalette, resolveAppAccentColor } from '@/lib/displaySettings'
import { DEFAULT_SECTION_ORDER, SECTION_LABELS, normalizeSectionOrder } from '@/lib/cvDefaults'
import {
  SparklesIcon,
  ArrowUpTrayIcon,
  EyeIcon,
  PlusIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  UserIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  Cog6ToothIcon,
  PaintBrushIcon,
  CheckIcon,
  ArrowPathIcon,
  FolderIcon,
  EllipsisHorizontalCircleIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline'
import { useRef, useState, KeyboardEvent, ChangeEvent } from 'react'

/**
 * Properties for the CVForm component.
 */
interface CVFormProps {
  data: CVData
  onChange: (data: CVData) => void
  onClear: () => void
  onPreview?: () => void
}

const COLOR_PRESETS = [
  { name: 'Sapphire', value: '#2563eb' },
  { name: 'Emerald', value: '#059669' },
  { name: 'Indigo', value: '#4f46e5' },
  { name: 'Crimson', value: '#dc2626' },
  { name: 'Amber', value: '#d97706' },
  { name: 'Graphite', value: '#374151' }
]

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

const LANGUAGE_PROFICIENCY_OPTIONS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Native']

type ActiveTab = 'personal' | 'experience' | 'education' | 'skills' | 'projects' | 'more' | 'design'
type SuggestionTarget = 'summary' | 'experience' | 'project'

interface PendingSuggestion {
  type: SuggestionTarget
  id?: string
  text: string
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

function isValidPhone(phone: string) {
  const cleaned = phone.replace(/[^\d+]/g, '')
  return cleaned.length >= 7 && /^[+\d]+$/.test(cleaned)
}

function parseYear(value: string): number | null {
  const match = value.match(/\b(19|20)\d{2}\b/)
  return match ? Number(match[0]) : null
}

function hasDateInconsistency(startDate: string, endDate: string) {
  const startYear = parseYear(startDate)
  const endYear = parseYear(endDate)
  if (!startYear || !endYear || /present|current|now/i.test(endDate)) return false
  return startYear > endYear
}

function hasMeaningfulExperience(exp: Experience) {
  return Boolean(exp.company.trim() || exp.role.trim() || exp.description.trim())
}

function hasEmptyExperienceEntry(exp: Experience) {
  return !exp.company.trim() || !exp.role.trim() || !exp.description.trim()
}

/**
 * CVForm component provides an interactive, tabbed editing interface for
 * updating personal details, experiences, education, skills, and layout design.
 * Includes AI-powered description enhancing.
 * 
 * @param {CVFormProps} props - Component properties.
 * @returns {JSX.Element} The rendered form interface.
 */
export default function CVForm({ data, onChange, onClear, onPreview }: CVFormProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('personal')
  const [skillInput, setSkillInput] = useState('')
  const [enhancingField, setEnhancingField] = useState<{ type: string; id?: string } | null>(null)
  const [pendingSuggestion, setPendingSuggestion] = useState<PendingSuggestion | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isParsingPdf, setIsParsingPdf] = useState(false)
  const pdfInputRef = useRef<HTMLInputElement | null>(null)
  const appPalette = getActivePalette()
  const colorPresets = [
    { name: 'App Palette', value: appPalette.primary },
    ...COLOR_PRESETS.filter((color) => color.value.toLowerCase() !== appPalette.primary.toLowerCase())
  ]

  const isEnhancing = enhancingField !== null

  const handleEnhance = async (text: string, type: SuggestionTarget, id?: string) => {
    if (!text.trim()) return
    
    const settings = getSettings()
    const apiKey = getProviderApiKey(settings)
    const model = getProviderModel(settings)
    const refinePrompt = [
      'Refine the following CV text.',
      'Keep all original facts accurate. Improve clarity, professionalism, and impact.',
      'Return only the refined text content.',
      '',
      `Text type: ${type}`,
      'Text:',
      text
    ].join('\n')
    
    if (!apiKey) {
      setErrorMsg(`API key for ${settings.provider} is not configured. Please configure it in Settings.`)
      return
    }

    setEnhancingField({ type, id })
    setErrorMsg(null)
    if (settings.debugLogging) {
      console.info('[AI Debug][Client] CV refine request', {
        provider: settings.provider,
        model,
        type,
        targetId: id || null,
        prompt: refinePrompt
      })
    }
    try {
      const response = await fetch('/api/enhance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: refinePrompt,
          type,
          provider: settings.provider,
          apiKey,
          model,
          debugLogging: settings.debugLogging
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = errorText || 'Failed to refine text.'
        try {
          const parsed = JSON.parse(errorText) as { error?: string }
          errorMessage = parsed.error || errorMessage
        } catch {
          // Keep the raw response text when the error body is not JSON.
        }
        throw new Error(errorMessage)
      }

      const refinedText = (await response.text()).trim()
      if (!refinedText) return

      setPendingSuggestion({ type, id, text: refinedText })
      setErrorMsg(null)
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Failed to refine text.')
    } finally {
      setEnhancingField(null)
    }
  }

  const acceptSuggestion = () => {
    if (!pendingSuggestion) return
    if (pendingSuggestion.type === 'summary') {
      updatePersonalInfo('summary', pendingSuggestion.text)
    } else if (pendingSuggestion.type === 'experience' && pendingSuggestion.id) {
      updateExperience(pendingSuggestion.id, 'description', pendingSuggestion.text)
    } else if (pendingSuggestion.type === 'project' && pendingSuggestion.id) {
      updateProject(pendingSuggestion.id, 'description', pendingSuggestion.text)
    }
    setPendingSuggestion(null)
  }

  const rejectSuggestion = () => {
    setPendingSuggestion(null)
  }

  const renderSuggestionReview = (type: SuggestionTarget, id?: string) => {
    if (!pendingSuggestion || pendingSuggestion.type !== type || pendingSuggestion.id !== id) return null

    return (
      <div className="mt-2 rounded-xl border border-blue-100 bg-blue-50/60 p-3 dark:border-blue-900/50 dark:bg-blue-950/20">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-xs font-bold text-blue-700 dark:text-blue-300">AI suggestion</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={rejectSuggestion}
              className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-bold text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Reject
            </button>
            <button
              type="button"
              onClick={acceptSuggestion}
              className="rounded-lg bg-blue-600 px-2.5 py-1 text-[11px] font-bold text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              Accept
            </button>
          </div>
        </div>
        <pre className="whitespace-pre-wrap rounded-lg bg-white p-3 text-xs leading-relaxed text-gray-700 dark:bg-gray-900 dark:text-gray-300">
          {pendingSuggestion.text}
        </pre>
      </div>
    )
  }

  const handlePdfImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (file.type !== 'application/pdf') {
      setErrorMsg('Please upload a PDF file.')
      return
    }

    const settings = getSettings()
    const provider = settings.provider
    const apiKey = getProviderApiKey(settings)
    const model = getProviderModel(settings)

    if (!apiKey) {
      setErrorMsg('Configure an OpenAI, Google Gemini, or Anthropic API key in Settings before uploading a PDF CV.')
      return
    }

    setIsParsingPdf(true)
    setErrorMsg(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('provider', provider)
      formData.append('apiKey', apiKey)
      formData.append('model', model)
      formData.append('debugLogging', String(settings.debugLogging))

      const response = await fetch('/api/parse-cv-pdf', {
        method: 'POST',
        body: formData
      })
      const payload = await response.json() as { data?: Omit<CVData, 'metadata'>; error?: string }

      if (!response.ok || !payload.data) {
        throw new Error(payload.error || 'Failed to parse PDF CV.')
      }

      onChange({
        ...payload.data,
        metadata: data.metadata || {
          template: 'classic',
          accentColor: appPalette.primary,
          fontFamily: 'sans'
        }
      })
      setActiveTab('personal')
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Failed to parse PDF CV.')
    } finally {
      setIsParsingPdf(false)
    }
  }

  const updatePersonalInfo = (field: string, value: string) => {
    onChange({
      ...data,
      personalInfo: { ...data.personalInfo, [field]: value }
    })
  }

  const updateExperience = (id: string, field: keyof Experience, value: string) => {
    onChange({
      ...data,
      experience: data.experience.map((exp) =>
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    })
  }

  const addExperience = () => {
    const newExp: Experience = {
      id: Date.now().toString(),
      company: '',
      role: '',
      startDate: '',
      endDate: '',
      description: ''
    }
    onChange({
      ...data,
      experience: [...data.experience, newExp]
    })
  }

  const removeExperience = (id: string) => {
    onChange({
      ...data,
      experience: data.experience.filter((exp) => exp.id !== id)
    })
  }

  const moveExperience = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= data.experience.length) return
    const updated = [...data.experience]
    const temp = updated[index]
    updated[index] = updated[newIndex]
    updated[newIndex] = temp
    onChange({ ...data, experience: updated })
  }

  const updateEducation = (id: string, field: keyof Education, value: string) => {
    onChange({
      ...data,
      education: data.education.map((edu) =>
        edu.id === id ? { ...edu, [field]: value } : edu
      )
    })
  }

  const addEducation = () => {
    const newEdu: Education = {
      id: Date.now().toString(),
      school: '',
      degree: '',
      year: ''
    }
    onChange({
      ...data,
      education: [...data.education, newEdu]
    })
  }

  const removeEducation = (id: string) => {
    onChange({
      ...data,
      education: data.education.filter((edu) => edu.id !== id)
    })
  }

  const moveEducation = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= data.education.length) return
    const updated = [...data.education]
    const temp = updated[index]
    updated[index] = updated[newIndex]
    updated[newIndex] = temp
    onChange({ ...data, education: updated })
  }

  const updateProject = (id: string, field: keyof Project, value: string) => {
    onChange({
      ...data,
      projects: data.projects.map((project) =>
        project.id === id ? { ...project, [field]: value } : project
      )
    })
  }

  const addProject = () => {
    const newProject: Project = {
      id: createId('project'),
      name: '',
      role: '',
      technologies: '',
      date: '',
      url: '',
      description: ''
    }
    onChange({ ...data, projects: [...data.projects, newProject] })
  }

  const removeProject = (id: string) => {
    onChange({ ...data, projects: data.projects.filter((project) => project.id !== id) })
  }

  const moveProject = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= data.projects.length) return
    const updated = [...data.projects]
    const temp = updated[index]
    updated[index] = updated[newIndex]
    updated[newIndex] = temp
    onChange({ ...data, projects: updated })
  }

  const updateCertification = (id: string, field: keyof Certification, value: string) => {
    onChange({
      ...data,
      certifications: data.certifications.map((item) => item.id === id ? { ...item, [field]: value } : item)
    })
  }

  const addCertification = () => {
    onChange({
      ...data,
      certifications: [...data.certifications, { id: createId('cert'), name: '', issuer: '', date: '', url: '' }]
    })
  }

  const removeCertification = (id: string) => {
    onChange({ ...data, certifications: data.certifications.filter((item) => item.id !== id) })
  }

  const updateLanguage = (id: string, field: keyof Language, value: string) => {
    onChange({
      ...data,
      languages: data.languages.map((item) => item.id === id ? { ...item, [field]: value } : item)
    })
  }

  const addLanguage = () => {
    onChange({ ...data, languages: [...data.languages, { id: createId('lang'), name: '', proficiency: '' }] })
  }

  const removeLanguage = (id: string) => {
    onChange({ ...data, languages: data.languages.filter((item) => item.id !== id) })
  }

  const moveLanguage = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= data.languages.length) return
    const updated = [...data.languages]
    const temp = updated[index]
    updated[index] = updated[newIndex]
    updated[newIndex] = temp
    onChange({ ...data, languages: updated })
  }

  const updateAward = (id: string, field: keyof Award, value: string) => {
    onChange({
      ...data,
      awards: data.awards.map((item) => item.id === id ? { ...item, [field]: value } : item)
    })
  }

  const addAward = () => {
    onChange({ ...data, awards: [...data.awards, { id: createId('award'), title: '', issuer: '', date: '', description: '' }] })
  }

  const removeAward = (id: string) => {
    onChange({ ...data, awards: data.awards.filter((item) => item.id !== id) })
  }

  const updatePublication = (id: string, field: keyof Publication, value: string) => {
    onChange({
      ...data,
      publications: data.publications.map((item) => item.id === id ? { ...item, [field]: value } : item)
    })
  }

  const addPublication = () => {
    onChange({
      ...data,
      publications: [...data.publications, { id: createId('pub'), title: '', publisher: '', date: '', url: '', description: '' }]
    })
  }

  const removePublication = (id: string) => {
    onChange({ ...data, publications: data.publications.filter((item) => item.id !== id) })
  }

  const updateVolunteering = (id: string, field: keyof Volunteering, value: string) => {
    onChange({
      ...data,
      volunteering: data.volunteering.map((item) => item.id === id ? { ...item, [field]: value } : item)
    })
  }

  const addVolunteering = () => {
    onChange({
      ...data,
      volunteering: [...data.volunteering, { id: createId('vol'), organization: '', role: '', startDate: '', endDate: '', description: '' }]
    })
  }

  const removeVolunteering = (id: string) => {
    onChange({ ...data, volunteering: data.volunteering.filter((item) => item.id !== id) })
  }

  const updateLink = (id: string, field: keyof ProfessionalLink, value: string) => {
    onChange({
      ...data,
      links: data.links.map((item) => item.id === id ? { ...item, [field]: value } : item)
    })
  }

  const addLink = () => {
    onChange({ ...data, links: [...data.links, { id: createId('link'), label: '', url: '' }] })
  }

  const removeLink = (id: string) => {
    onChange({ ...data, links: data.links.filter((item) => item.id !== id) })
  }

  const handleAddSkill = () => {
    const clean = skillInput.trim()
    if (!clean) return
    
    // Split by commas if multiple
    const parts = clean.split(',').map((s) => s.trim()).filter((s) => s && !data.skills.includes(s))
    if (parts.length > 0) {
      onChange({
        ...data,
        skills: [...data.skills, ...parts]
      })
    }
    setSkillInput('')
  }

  const handleSkillKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      handleAddSkill()
    }
  }

  const removeSkill = (indexToRemove: number) => {
    onChange({
      ...data,
      skills: data.skills.filter((_, idx) => idx !== indexToRemove)
    })
  }

  const updateMetadata = <K extends keyof CVMetadata>(field: K, value: CVMetadata[K]) => {
    const currentMetadata: CVMetadata = data.metadata || {
      template: 'classic',
      accentColor: appPalette.primary,
      fontFamily: 'serif',
      sectionOrder: DEFAULT_SECTION_ORDER
    }
    onChange({
      ...data,
      metadata: {
        ...currentMetadata,
        [field]: value
      }
    })
  }

  const moveSection = (sectionId: CVSectionId, direction: 'up' | 'down') => {
    const sectionOrder = normalizeSectionOrder(data.metadata?.sectionOrder)
    const index = sectionOrder.indexOf(sectionId)
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (index < 0 || newIndex < 0 || newIndex >= sectionOrder.length) return
    const updated = [...sectionOrder]
    const temp = updated[index]
    updated[index] = updated[newIndex]
    updated[newIndex] = temp
    updateMetadata('sectionOrder', updated)
  }

  // Completeness check
  const calculateCompleteness = () => {
    let score = 0
    if (data.personalInfo.name.trim()) score += 15
    if (data.personalInfo.title.trim()) score += 10
    if (data.personalInfo.email.trim()) score += 10
    if (data.personalInfo.phone.trim()) score += 10
    if (data.personalInfo.location.trim()) score += 10
    if (data.personalInfo.summary.trim()) score += 15
    
    const hasExp = data.experience.some(e => e.company.trim() || e.role.trim() || e.description.trim())
    if (hasExp) score += 15
    
    const hasEdu = data.education.some(e => e.school.trim() || e.degree.trim())
    if (hasEdu) score += 10
    
    if (data.skills.length > 0) score += 5
    if (data.projects.some((project) => project.name.trim() || project.description.trim())) score += 5
    return Math.min(score, 100)
  }

  const completeness = calculateCompleteness()
  const normalizedSectionOrder = normalizeSectionOrder(data.metadata?.sectionOrder)
  const duplicateSkills = Array.from(
    new Set(
      data.skills
        .map((skill) => skill.trim().toLowerCase())
        .filter((skill, index, all) => skill && all.indexOf(skill) !== index)
    )
  )
  const validationIssues = [
    !data.personalInfo.email.trim() ? 'Email is missing.' : null,
    data.personalInfo.email.trim() && !isValidEmail(data.personalInfo.email) ? 'Email format looks invalid.' : null,
    data.personalInfo.phone.trim() && !isValidPhone(data.personalInfo.phone) ? 'Phone format looks invalid.' : null,
    data.personalInfo.summary.length > 700 ? 'Summary is long; aim for 3-5 tight sentences.' : null,
    duplicateSkills.length > 0 ? `Repeated skills: ${duplicateSkills.join(', ')}.` : null,
    data.experience.some((exp) => hasMeaningfulExperience(exp) && hasEmptyExperienceEntry(exp)) ? 'One or more experience entries are missing company, role, or achievements.' : null,
    data.experience.some((exp) => hasDateInconsistency(exp.startDate, exp.endDate)) ? 'One or more experience date ranges look inconsistent.' : null,
    data.volunteering.some((item) => hasDateInconsistency(item.startDate, item.endDate)) ? 'One or more volunteering date ranges look inconsistent.' : null
  ].filter((issue): issue is string => Boolean(issue))

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800">
      
      {/* Form Utility Header */}
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className="font-semibold text-gray-800 dark:text-gray-200">Interactive Editor</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Customize your CV content and styling</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={pdfInputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={handlePdfImport}
          />
          {onPreview && (
            <button
              onClick={onPreview}
              className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 border border-blue-200 dark:border-blue-900 px-3 py-1.5 rounded-lg transition-colors"
            >
              <EyeIcon className="h-3.5 w-3.5" />
              Preview
            </button>
          )}
          <button
            onClick={() => pdfInputRef.current?.click()}
            disabled={isParsingPdf}
            className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 border border-blue-200 dark:border-blue-900 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            <ArrowUpTrayIcon className="h-3.5 w-3.5" />
            {isParsingPdf ? 'Parsing PDF...' : 'Upload PDF CV'}
          </button>
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg transition-colors"
          >
            <ArrowPathIcon width={13} height={13} />
            Reset
          </button>
        </div>
      </div>

      {/* Completeness Section */}
      <div className="px-6 py-3 bg-blue-50/30 dark:bg-blue-950/10 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">
            <span>Profile Strength</span>
            <span className={completeness === 100 ? 'text-green-600 dark:text-green-400 font-bold' : ''}>
              {completeness}%
            </span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-500 ease-out" 
              style={{ width: `${completeness}%` }}
            />
          </div>
        </div>
        <div className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
          {completeness < 40 ? 'Draft' : completeness < 75 ? 'Good' : completeness < 100 ? 'Strong' : 'Perfect!'}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 dark:border-gray-800 overflow-x-auto bg-white dark:bg-gray-900 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <button
          onClick={() => setActiveTab('personal')}
          className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-all shrink-0 ${
            activeTab === 'personal'
              ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400 bg-blue-50/10'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50/50'
          }`}
        >
          <UserIcon className="h-4 w-4" />
          <span>Personal</span>
          {data.personalInfo.name.trim() && (
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('experience')}
          className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-all shrink-0 ${
            activeTab === 'experience'
              ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400 bg-blue-50/10'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50/50'
          }`}
        >
          <BriefcaseIcon className="h-4 w-4" />
          <span>Experience</span>
          {data.experience.some((e) => e.company.trim() || e.role.trim()) && (
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('education')}
          className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-all shrink-0 ${
            activeTab === 'education'
              ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400 bg-blue-50/10'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50/50'
          }`}
        >
          <AcademicCapIcon className="h-4 w-4" />
          <span>Education</span>
          {data.education.some((e) => e.school.trim() || e.degree.trim()) && (
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('skills')}
          className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-all shrink-0 ${
            activeTab === 'skills'
              ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400 bg-blue-50/10'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50/50'
          }`}
        >
          <Cog6ToothIcon className="h-4 w-4" />
          <span>Skills</span>
          {data.skills.length > 0 && (
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('projects')}
          className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-all shrink-0 ${
            activeTab === 'projects'
              ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400 bg-blue-50/10'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50/50'
          }`}
        >
          <FolderIcon className="h-4 w-4" />
          <span>Projects</span>
          {data.projects.some((project) => project.name.trim() || project.description.trim()) && (
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('more')}
          className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-all shrink-0 ${
            activeTab === 'more'
              ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400 bg-blue-50/10'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50/50'
          }`}
        >
          <EllipsisHorizontalCircleIcon className="h-4 w-4" />
          <span>More</span>
          {[data.certifications, data.languages, data.awards, data.publications, data.volunteering, data.links].some((items) => items.length > 0) && (
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('design')}
          className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-all shrink-0 ${
            activeTab === 'design'
              ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400 bg-blue-50/10'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50/50'
          }`}
        >
          <PaintBrushIcon className="h-4 w-4" />
          <span>Design</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 p-6 overflow-y-auto bg-white dark:bg-gray-900">
        
        {errorMsg && (
          <div className="mb-5 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 p-4 rounded-xl border border-red-100 dark:border-red-900/50 text-sm flex items-start gap-2.5">
            <span className="font-bold shrink-0">⚠️</span>
            <div>{errorMsg}</div>
          </div>
        )}

        {validationIssues.length > 0 && (
          <div className="mb-5 rounded-xl border border-amber-100 bg-amber-50/60 p-4 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
            <div className="mb-2 text-xs font-bold uppercase tracking-wide">Smart validation</div>
            <ul className="list-disc space-y-1 pl-5 text-xs leading-relaxed">
              {validationIssues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 1. PERSONAL INFORMATION */}
        {activeTab === 'personal' && (
          <div className="space-y-6 transition duration-200 ease-out">
            <div>
              <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-1">Contact Information</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Let employers know who you are and how to reach you</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Full Name</label>
                <input
                  className="px-3.5 py-2.5 border rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 dark:text-gray-100 transition-all placeholder-gray-400"
                  placeholder="e.g. Alex Rivera"
                  value={data.personalInfo.name}
                  onChange={(e) => updatePersonalInfo('name', e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Professional Title</label>
                <input
                  className="px-3.5 py-2.5 border rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 dark:text-gray-100 transition-all placeholder-gray-400"
                  placeholder="e.g. Senior Software Engineer"
                  value={data.personalInfo.title}
                  onChange={(e) => updatePersonalInfo('title', e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Email Address</label>
                <input
                  type="email"
                  className="px-3.5 py-2.5 border rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 dark:text-gray-100 transition-all placeholder-gray-400"
                  placeholder="e.g. alex@example.com"
                  value={data.personalInfo.email}
                  onChange={(e) => updatePersonalInfo('email', e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Phone Number</label>
                <input
                  className="px-3.5 py-2.5 border rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 dark:text-gray-100 transition-all placeholder-gray-400"
                  placeholder="e.g. +1 (555) 000-0000"
                  value={data.personalInfo.phone}
                  onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Location</label>
                <input
                  className="px-3.5 py-2.5 border rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 dark:text-gray-100 transition-all placeholder-gray-400"
                  placeholder="e.g. San Francisco, CA"
                  value={data.personalInfo.location}
                  onChange={(e) => updatePersonalInfo('location', e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <div className="flex justify-between items-center">
                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Professional Summary</label>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Briefly outline your key accomplishments and experience</p>
                </div>
                <button
                  onClick={() => handleEnhance(data.personalInfo.summary, 'summary')}
                  disabled={isEnhancing || !data.personalInfo.summary.trim()}
                  className="flex items-center gap-1.5 text-xs bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 px-3 py-1.5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 disabled:opacity-40 transition-all font-medium"
                >
                  {isEnhancing && enhancingField?.type === 'summary' ? (
                    <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <SparklesIcon className="h-3.5 w-3.5" />
                  )}
                  {isEnhancing && enhancingField?.type === 'summary' ? 'Enhancing...' : 'AI Refine'}
                </button>
              </div>
              <textarea
                className="px-3.5 py-2.5 border rounded-lg h-40 resize-none border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 dark:text-gray-100 transition-all placeholder-gray-400 leading-relaxed"
                placeholder="Write a brief overview of your background, or write raw notes and click 'AI Refine' to generate a beautiful summary..."
                value={data.personalInfo.summary}
                onChange={(e) => updatePersonalInfo('summary', e.target.value)}
              />
              {renderSuggestionReview('summary')}
            </div>
          </div>
        )}

        {/* 2. WORK EXPERIENCE */}
        {activeTab === 'experience' && (
          <div className="space-y-6 transition duration-200 ease-out">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-1">Employment History</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Detail your relevant work and achievements</p>
              </div>
              <button
                onClick={addExperience}
                className="flex items-center gap-1.5 text-xs font-semibold bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white px-3.5 py-1.5 rounded-lg shadow-sm transition-colors"
              >
                <PlusIcon className="h-4 w-4" /> Add Role
              </button>
            </div>

            {data.experience.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-xl border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center">
                <BriefcaseIcon className="h-8 w-8 text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No work experience added yet.</p>
                <button
                  onClick={addExperience}
                  className="mt-3 text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                >
                  Add your first job entry
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {data.experience.map((exp, index) => (
                  <div 
                    key={exp.id} 
                    className="flex flex-col gap-4 p-5 border rounded-xl bg-gray-50/40 dark:bg-gray-800/20 border-gray-100 dark:border-gray-800/80 hover:shadow-md/5 transition-all relative group"
                  >
                    
                    {/* Action Toolbar on Job Card */}
                    <div className="absolute right-4 top-4 flex items-center gap-1">
                      <button
                        onClick={() => moveExperience(index, 'up')}
                        disabled={index === 0}
                        className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-20 transition-colors"
                        title="Move Up"
                      >
                        <ArrowUpIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => moveExperience(index, 'down')}
                        disabled={index === data.experience.length - 1}
                        className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-20 transition-colors"
                        title="Move Down"
                      >
                        <ArrowDownIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => removeExperience(exp.id)}
                        className="p-1 text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded transition-colors"
                        title="Delete Entry"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mr-20">
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Company</label>
                        <input
                          className="px-3 py-2 border rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 dark:text-gray-100 transition-all placeholder-gray-400"
                          placeholder="e.g. Acme Corp"
                          value={exp.company}
                          onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Role / Position</label>
                        <input
                          className="px-3 py-2 border rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 dark:text-gray-100 transition-all placeholder-gray-400"
                          placeholder="e.g. Software Engineer"
                          value={exp.role}
                          onChange={(e) => updateExperience(exp.id, 'role', e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Start Date</label>
                        <input
                          className="px-3 py-2 border rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 dark:text-gray-100 transition-all placeholder-gray-400"
                          placeholder="e.g. Jan 2020"
                          value={exp.startDate}
                          onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">End Date</label>
                        <input
                          className="px-3 py-2 border rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 dark:text-gray-100 transition-all placeholder-gray-400"
                          placeholder="e.g. Present"
                          value={exp.endDate}
                          onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 pt-2 border-t border-gray-100 dark:border-gray-800">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Responsibilities & Achievements</label>
                        <button
                          onClick={() => handleEnhance(exp.description, 'experience', exp.id)}
                          disabled={isEnhancing || !exp.description.trim()}
                          className="flex items-center gap-1.5 text-xs bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 px-3 py-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 disabled:opacity-40 transition-all font-medium"
                        >
                          {isEnhancing && enhancingField?.id === exp.id ? (
                            <ArrowPathIcon className="h-3 w-3 animate-spin" />
                          ) : (
                            <SparklesIcon className="h-3 w-3" />
                          )}
                          {isEnhancing && enhancingField?.id === exp.id ? 'Enhancing...' : 'AI Professional Rewrite'}
                        </button>
                      </div>
                      <textarea
                        className="px-3 py-2 border rounded-lg h-28 resize-none border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 dark:text-gray-100 transition-all placeholder-gray-400 leading-relaxed"
                        placeholder="List your responsibilities, tasks, and key impacts. Bullet points are rendered automatically if you start lines with '-' or '*'."
                        value={exp.description}
                        onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                      />
                      {renderSuggestionReview('experience', exp.id)}
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. EDUCATION */}
        {activeTab === 'education' && (
          <div className="space-y-6 transition duration-200 ease-out">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-1">Academic Credentials</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">List schools, colleges, or key certifications</p>
              </div>
              <button
                onClick={addEducation}
                className="flex items-center gap-1.5 text-xs font-semibold bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white px-3.5 py-1.5 rounded-lg shadow-sm transition-colors"
              >
                <PlusIcon className="h-4 w-4" /> Add Degree
              </button>
            </div>

            {data.education.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-xl border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center">
                <AcademicCapIcon className="h-8 w-8 text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No education entries yet.</p>
                <button
                  onClick={addEducation}
                  className="mt-3 text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                >
                  Add your first academic entry
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {data.education.map((edu, index) => (
                  <div 
                    key={edu.id} 
                    className="flex flex-col sm:flex-row gap-3 p-4 border rounded-xl bg-gray-50/40 dark:bg-gray-800/20 border-gray-100 dark:border-gray-800/80 items-stretch sm:items-center relative group"
                  >
                    
                    {/* Education Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 flex-1 pr-14 sm:pr-24">
                      <div className="col-span-1 sm:col-span-5 flex flex-col gap-1">
                        <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">School / University</label>
                        <input
                          className="px-3 py-2 border rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 dark:text-gray-100 transition-all placeholder-gray-400"
                          placeholder="e.g. Stanford University"
                          value={edu.school}
                          onChange={(e) => updateEducation(edu.id, 'school', e.target.value)}
                        />
                      </div>
                      <div className="col-span-1 sm:col-span-5 flex flex-col gap-1">
                        <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">Degree / Major</label>
                        <input
                          className="px-3 py-2 border rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 dark:text-gray-100 transition-all placeholder-gray-400"
                          placeholder="e.g. B.S. in Computer Science"
                          value={edu.degree}
                          onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                        />
                      </div>
                      <div className="col-span-1 sm:col-span-2 flex flex-col gap-1">
                        <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">Graduation Year</label>
                        <input
                          className="px-3 py-2 border rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 dark:text-gray-100 transition-all placeholder-gray-400"
                          placeholder="e.g. 2021"
                          value={edu.year}
                          onChange={(e) => updateEducation(edu.id, 'year', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Sorting & Deletion Bar */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                      <button
                        onClick={() => moveEducation(index, 'up')}
                        disabled={index === 0}
                        className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-20 transition-colors"
                        title="Move Up"
                      >
                        <ArrowUpIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => moveEducation(index, 'down')}
                        disabled={index === data.education.length - 1}
                        className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-20 transition-colors"
                        title="Move Down"
                      >
                        <ArrowDownIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => removeEducation(edu.id)}
                        className="p-1 text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded transition-colors"
                        title="Delete Degree"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. SKILLS */}
        {activeTab === 'skills' && (
          <div className="space-y-6 transition duration-200 ease-out">
            <div>
              <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-1">Core Competencies</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Add technical and soft skills (comma-separated or press Enter)</p>
            </div>

            <div className="flex gap-2">
              <input
                className="px-3.5 py-2.5 border rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 dark:text-gray-100 transition-all placeholder-gray-400 flex-1"
                placeholder="e.g. React, Next.js, Product Design..."
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleSkillKeyDown}
              />
              <button
                onClick={handleAddSkill}
                className="px-5 py-2.5 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg font-semibold text-sm shadow-sm transition-colors"
              >
                Add
              </button>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Current Skills Tag Cloud</label>
              
              {data.skills.length === 0 ? (
                <div className="py-8 text-center border rounded-xl border-gray-100 dark:border-gray-800 text-sm text-gray-400 dark:text-gray-500">
                  No skills tags created yet. Type above and press Enter.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 p-4 border rounded-xl bg-gray-50/20 dark:bg-gray-800/10 border-gray-100 dark:border-gray-800">
                  {data.skills.map((skill, idx) => (
                    <span 
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-100/50 dark:border-blue-900/30 group"
                    >
                      {skill}
                      <button
                        onClick={() => removeSkill(idx)}
                        className="text-blue-400 hover:text-blue-600 dark:hover:text-blue-200 transition-colors shrink-0"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. PROJECTS */}
        {activeTab === 'projects' && (
          <div className="space-y-6 transition duration-200 ease-out">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-1">Projects</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Show shipped work, portfolio projects, and technical initiatives</p>
              </div>
              <button
                onClick={addProject}
                className="flex items-center gap-1.5 text-xs font-semibold bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white px-3.5 py-1.5 rounded-lg shadow-sm transition-colors"
              >
                <PlusIcon className="h-4 w-4" /> Add Project
              </button>
            </div>

            {data.projects.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-xl border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center">
                <FolderIcon className="h-8 w-8 text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No projects added yet.</p>
                <button onClick={addProject} className="mt-3 text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                  Add your first project
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {data.projects.map((project, index) => (
                  <div key={project.id} className="relative flex flex-col gap-4 rounded-xl border border-gray-100 bg-gray-50/40 p-5 transition-all hover:shadow-md/5 dark:border-gray-800/80 dark:bg-gray-800/20">
                    <div className="absolute right-4 top-4 flex items-center gap-1">
                      <button onClick={() => moveProject(index, 'up')} disabled={index === 0} className="p-1 text-gray-400 transition-colors hover:text-gray-700 disabled:opacity-20 dark:text-gray-500 dark:hover:text-gray-300" title="Move Up">
                        <ArrowUpIcon className="h-4 w-4" />
                      </button>
                      <button onClick={() => moveProject(index, 'down')} disabled={index === data.projects.length - 1} className="p-1 text-gray-400 transition-colors hover:text-gray-700 disabled:opacity-20 dark:text-gray-500 dark:hover:text-gray-300" title="Move Down">
                        <ArrowDownIcon className="h-4 w-4" />
                      </button>
                      <button onClick={() => removeProject(project.id)} className="rounded p-1 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-red-500 dark:hover:bg-red-950/50 dark:hover:text-red-400" title="Delete Project">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mr-20 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Project Name</label>
                        <input className="px-3 py-2 border rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 dark:text-gray-100 transition-all placeholder-gray-400" placeholder="e.g. Analytics Platform" value={project.name} onChange={(e) => updateProject(project.id, 'name', e.target.value)} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Role</label>
                        <input className="px-3 py-2 border rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 dark:text-gray-100 transition-all placeholder-gray-400" placeholder="e.g. Lead Developer" value={project.role} onChange={(e) => updateProject(project.id, 'role', e.target.value)} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Technologies</label>
                        <input className="px-3 py-2 border rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 dark:text-gray-100 transition-all placeholder-gray-400" placeholder="e.g. Next.js, PostgreSQL, AWS" value={project.technologies} onChange={(e) => updateProject(project.id, 'technologies', e.target.value)} />
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Date</label>
                          <input className="px-3 py-2 border rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 dark:text-gray-100 transition-all placeholder-gray-400" placeholder="e.g. 2024" value={project.date} onChange={(e) => updateProject(project.id, 'date', e.target.value)} />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">URL</label>
                          <input className="px-3 py-2 border rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 dark:text-gray-100 transition-all placeholder-gray-400" placeholder="https://..." value={project.url} onChange={(e) => updateProject(project.id, 'url', e.target.value)} />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 border-t border-gray-100 pt-2 dark:border-gray-800">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Project Impact</label>
                        <button
                          onClick={() => handleEnhance(project.description, 'project', project.id)}
                          disabled={isEnhancing || !project.description.trim()}
                          className="flex items-center gap-1.5 text-xs bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 px-3 py-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 disabled:opacity-40 transition-all font-medium"
                        >
                          {isEnhancing && enhancingField?.id === project.id ? <ArrowPathIcon className="h-3 w-3 animate-spin" /> : <SparklesIcon className="h-3 w-3" />}
                          {isEnhancing && enhancingField?.id === project.id ? 'Enhancing...' : 'AI Rewrite'}
                        </button>
                      </div>
                      <textarea className="px-3 py-2 border rounded-lg h-28 resize-none border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 dark:text-gray-100 transition-all placeholder-gray-400 leading-relaxed" placeholder="Describe the problem, your contribution, and measurable impact." value={project.description} onChange={(e) => updateProject(project.id, 'description', e.target.value)} />
                      {renderSuggestionReview('project', project.id)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 6. EXTRA SECTIONS */}
        {activeTab === 'more' && (
          <div className="space-y-7 transition duration-200 ease-out">
            <div>
              <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-1">Additional Sections</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Add credentials and supporting details when they strengthen the CV</p>
            </div>

            <div className="space-y-4 rounded-xl border border-gray-100 p-4 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-100">Certifications</h4>
                <button onClick={addCertification} className="text-xs font-bold text-blue-600 hover:underline dark:text-blue-400">Add</button>
              </div>
              {data.certifications.map((item) => (
                <div key={item.id} className="grid grid-cols-1 gap-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/40 sm:grid-cols-4">
                  <input className="px-3 py-2 border rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm outline-none" placeholder="Certification" value={item.name} onChange={(e) => updateCertification(item.id, 'name', e.target.value)} />
                  <input className="px-3 py-2 border rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm outline-none" placeholder="Issuer" value={item.issuer} onChange={(e) => updateCertification(item.id, 'issuer', e.target.value)} />
                  <input className="px-3 py-2 border rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm outline-none" placeholder="Date" value={item.date} onChange={(e) => updateCertification(item.id, 'date', e.target.value)} />
                  <div className="flex gap-2">
                    <input className="min-w-0 flex-1 px-3 py-2 border rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm outline-none" placeholder="URL" value={item.url} onChange={(e) => updateCertification(item.id, 'url', e.target.value)} />
                    <button onClick={() => removeCertification(item.id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"><TrashIcon className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4 rounded-xl border border-gray-100 p-4 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-100">Languages</h4>
                <button onClick={addLanguage} className="text-xs font-bold text-blue-600 hover:underline dark:text-blue-400">Add</button>
              </div>
              {data.languages.map((item, index) => (
                <div key={item.id} className="grid grid-cols-1 gap-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/40 sm:grid-cols-[1fr_1fr_auto]">
                  <input className="px-3 py-2 border rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm outline-none" placeholder="Language" value={item.name} onChange={(e) => updateLanguage(item.id, 'name', e.target.value)} />
                  <div className="relative">
                    <select
                      className="w-full appearance-none px-3 py-2 pr-9 border rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm outline-none"
                      value={item.proficiency}
                      onChange={(e) => updateLanguage(item.id, 'proficiency', e.target.value)}
                    >
                      <option value="">Proficiency</option>
                      {LANGUAGE_PROFICIENCY_OPTIONS.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => moveLanguage(index, 'up')}
                      disabled={index === 0}
                      className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-30 dark:text-gray-400 dark:hover:bg-gray-700/50"
                      title="Move Up"
                    >
                      <ArrowUpIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => moveLanguage(index, 'down')}
                      disabled={index === data.languages.length - 1}
                      className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-30 dark:text-gray-400 dark:hover:bg-gray-700/50"
                      title="Move Down"
                    >
                      <ArrowDownIcon className="h-4 w-4" />
                    </button>
                    <button onClick={() => removeLanguage(item.id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"><TrashIcon className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4 rounded-xl border border-gray-100 p-4 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-100">Awards</h4>
                <button onClick={addAward} className="text-xs font-bold text-blue-600 hover:underline dark:text-blue-400">Add</button>
              </div>
              {data.awards.map((item) => (
                <div key={item.id} className="grid grid-cols-1 gap-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/40 sm:grid-cols-4">
                  <input className="px-3 py-2 border rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm outline-none" placeholder="Award" value={item.title} onChange={(e) => updateAward(item.id, 'title', e.target.value)} />
                  <input className="px-3 py-2 border rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm outline-none" placeholder="Issuer" value={item.issuer} onChange={(e) => updateAward(item.id, 'issuer', e.target.value)} />
                  <input className="px-3 py-2 border rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm outline-none" placeholder="Date" value={item.date} onChange={(e) => updateAward(item.id, 'date', e.target.value)} />
                  <button onClick={() => removeAward(item.id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"><TrashIcon className="h-4 w-4" /></button>
                  <textarea className="sm:col-span-4 px-3 py-2 border rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm outline-none" placeholder="Description" value={item.description} onChange={(e) => updateAward(item.id, 'description', e.target.value)} />
                </div>
              ))}
            </div>

            <div className="space-y-4 rounded-xl border border-gray-100 p-4 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-100">Publications</h4>
                <button onClick={addPublication} className="text-xs font-bold text-blue-600 hover:underline dark:text-blue-400">Add</button>
              </div>
              {data.publications.map((item) => (
                <div key={item.id} className="grid grid-cols-1 gap-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/40 sm:grid-cols-5">
                  <input className="px-3 py-2 border rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm outline-none" placeholder="Title" value={item.title} onChange={(e) => updatePublication(item.id, 'title', e.target.value)} />
                  <input className="px-3 py-2 border rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm outline-none" placeholder="Publisher" value={item.publisher} onChange={(e) => updatePublication(item.id, 'publisher', e.target.value)} />
                  <input className="px-3 py-2 border rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm outline-none" placeholder="Date" value={item.date} onChange={(e) => updatePublication(item.id, 'date', e.target.value)} />
                  <input className="px-3 py-2 border rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm outline-none" placeholder="URL" value={item.url} onChange={(e) => updatePublication(item.id, 'url', e.target.value)} />
                  <button onClick={() => removePublication(item.id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"><TrashIcon className="h-4 w-4" /></button>
                  <textarea className="sm:col-span-5 px-3 py-2 border rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm outline-none" placeholder="Description" value={item.description} onChange={(e) => updatePublication(item.id, 'description', e.target.value)} />
                </div>
              ))}
            </div>

            <div className="space-y-4 rounded-xl border border-gray-100 p-4 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-100">Volunteering</h4>
                <button onClick={addVolunteering} className="text-xs font-bold text-blue-600 hover:underline dark:text-blue-400">Add</button>
              </div>
              {data.volunteering.map((item) => (
                <div key={item.id} className="grid grid-cols-1 gap-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/40 sm:grid-cols-4">
                  <input className="px-3 py-2 border rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm outline-none" placeholder="Organization" value={item.organization} onChange={(e) => updateVolunteering(item.id, 'organization', e.target.value)} />
                  <input className="px-3 py-2 border rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm outline-none" placeholder="Role" value={item.role} onChange={(e) => updateVolunteering(item.id, 'role', e.target.value)} />
                  <input className="px-3 py-2 border rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm outline-none" placeholder="Start" value={item.startDate} onChange={(e) => updateVolunteering(item.id, 'startDate', e.target.value)} />
                  <div className="flex gap-2">
                    <input className="min-w-0 flex-1 px-3 py-2 border rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm outline-none" placeholder="End" value={item.endDate} onChange={(e) => updateVolunteering(item.id, 'endDate', e.target.value)} />
                    <button onClick={() => removeVolunteering(item.id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"><TrashIcon className="h-4 w-4" /></button>
                  </div>
                  <textarea className="sm:col-span-4 px-3 py-2 border rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm outline-none" placeholder="Description" value={item.description} onChange={(e) => updateVolunteering(item.id, 'description', e.target.value)} />
                </div>
              ))}
            </div>

            <div className="space-y-4 rounded-xl border border-gray-100 p-4 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-100">Links</h4>
                <button onClick={addLink} className="text-xs font-bold text-blue-600 hover:underline dark:text-blue-400">Add</button>
              </div>
              {data.links.map((item) => (
                <div key={item.id} className="grid grid-cols-1 gap-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/40 sm:grid-cols-[1fr_2fr_auto]">
                  <input className="px-3 py-2 border rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm outline-none" placeholder="Label" value={item.label} onChange={(e) => updateLink(item.id, 'label', e.target.value)} />
                  <input className="px-3 py-2 border rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm outline-none" placeholder="https://..." value={item.url} onChange={(e) => updateLink(item.id, 'url', e.target.value)} />
                  <button onClick={() => removeLink(item.id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"><TrashIcon className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. DESIGN & TEMPLATES */}
        {activeTab === 'design' && (
          <div className="space-y-6 transition duration-200 ease-out">
            <div>
              <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-1">Visual Styles</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Select templates, brand colors, and gorgeous fonts</p>
            </div>

            {/* Template Selector */}
            <div className="flex flex-col gap-2.5">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Choose Template Theme</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {TEMPLATE_OPTIONS.map((tpl) => {
                  const currentTpl = data.metadata?.template || 'classic'
                  const isSelected = currentTpl === tpl.id
                  return (
                    <button
                      key={tpl.id}
                      onClick={() => updateMetadata('template', tpl.id)}
                      className={`p-4 border rounded-xl text-left transition-all ${
                        isSelected 
                          ? 'border-blue-600 bg-blue-50/5 dark:border-blue-500 dark:bg-blue-950/10 ring-2 ring-blue-500/10'
                          : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-gray-900 dark:text-gray-100">{tpl.title}</span>
                        {isSelected && (
                          <div className="w-4 h-4 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center text-white text-[10px]">
                            <CheckIcon className="h-2.5 w-2.5 stroke-3" />
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">{tpl.desc}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Accent Color Picker */}
            <div className="flex flex-col gap-2.5 pt-2 border-t border-gray-100 dark:border-gray-800">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Template Accent Color</label>
              <div className="flex flex-wrap gap-3 items-center">
                {colorPresets.map((color) => {
                  const rawAccentColor = data.metadata?.accentColor
                  const currentColor = resolveAppAccentColor(rawAccentColor)
                  const isSelected = rawAccentColor
                    ? rawAccentColor.toLowerCase() === color.value.toLowerCase()
                    : currentColor.toLowerCase() === color.value.toLowerCase()
                  return (
                    <button
                      key={color.name}
                      onClick={() => updateMetadata('accentColor', color.value)}
                      className="w-9 h-9 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95 shadow-sm border border-black/5 dark:border-white/5 relative"
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    >
                      {isSelected && (
                        <div className="w-5 h-5 bg-white/30 backdrop-blur-[1px] rounded-full flex items-center justify-center">
                          <CheckIcon className="h-3 w-3 text-white drop-shadow-md stroke-3" />
                        </div>
                      )}
                    </button>
                  )
                })}
                <div className="w-[1px] h-6 bg-gray-200 dark:bg-gray-800 mx-1" />
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={resolveAppAccentColor(data.metadata?.accentColor)}
                    onChange={(e) => updateMetadata('accentColor', e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                  />
                  <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                    {resolveAppAccentColor(data.metadata?.accentColor)}
                  </span>
                </div>
              </div>
            </div>

            {/* Typography */}
            <div className="flex flex-col gap-2.5 pt-2 border-t border-gray-100 dark:border-gray-800">
              <div>
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Document Section Order</label>
                <p className="mt-0.5 text-[10px] text-gray-400 dark:text-gray-500">Move sections up or down to match the target role.</p>
              </div>
              <div className="space-y-2 rounded-xl border border-gray-100 p-3 dark:border-gray-800">
                {normalizedSectionOrder.map((sectionId, index) => (
                  <div key={sectionId} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800/40">
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{SECTION_LABELS[sectionId]}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveSection(sectionId, 'up')}
                        disabled={index === 0}
                        className="p-1 text-gray-400 transition-colors hover:text-gray-700 disabled:opacity-20 dark:text-gray-500 dark:hover:text-gray-300"
                        title="Move Up"
                      >
                        <ArrowUpIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => moveSection(sectionId, 'down')}
                        disabled={index === normalizedSectionOrder.length - 1}
                        className="p-1 text-gray-400 transition-colors hover:text-gray-700 disabled:opacity-20 dark:text-gray-500 dark:hover:text-gray-300"
                        title="Move Down"
                      >
                        <ArrowDownIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Typography */}
            <div className="flex flex-col gap-2.5 pt-2 border-t border-gray-100 dark:border-gray-800">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Typography Font Family</label>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { id: 'serif', title: 'Serif Elegant', family: 'font-serif' },
                  { id: 'sans', title: 'Modern Sans', family: 'font-sans' },
                  { id: 'mono', title: 'Technical Mono', family: 'font-mono' }
                ] satisfies Array<{ id: CVMetadata['fontFamily']; title: string; family: string }>)
                  .map((font) => {
                  const currentFont = data.metadata?.fontFamily || 'serif'
                  const isSelected = currentFont === font.id
                  return (
                    <button
                      key={font.id}
                      onClick={() => updateMetadata('fontFamily', font.id)}
                      className={`p-3 border rounded-xl text-center transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/5 dark:border-blue-500 dark:bg-blue-950/10 ring-2 ring-blue-500/10'
                          : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-800'
                      }`}
                    >
                      <div className={`text-base font-bold mb-0.5 ${font.family}`}>Aa</div>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">{font.title}</span>
                    </button>
                  )
                })}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  )
}
