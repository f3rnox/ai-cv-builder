'use client'

import { CVData, Experience, Education, CVMetadata } from '@/lib/types'
import { getSettings } from '@/lib/settings'
import { getActivePalette, resolveAppAccentColor } from '@/lib/displaySettings'
import { useCompletion } from '@ai-sdk/react'
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  User, 
  Briefcase, 
  GraduationCap, 
  Wrench, 
  Palette, 
  Check, 
  RotateCcw,
  Sparkle
} from 'lucide-react'
import { useState, KeyboardEvent } from 'react'

/**
 * Properties for the CVForm component.
 */
interface CVFormProps {
  data: CVData
  onChange: (data: CVData) => void
  onLoadSample: () => void
  onClear: () => void
}

const COLOR_PRESETS = [
  { name: 'Sapphire', value: '#2563eb' },
  { name: 'Emerald', value: '#059669' },
  { name: 'Indigo', value: '#4f46e5' },
  { name: 'Crimson', value: '#dc2626' },
  { name: 'Amber', value: '#d97706' },
  { name: 'Graphite', value: '#374151' }
]

/**
 * CVForm component provides an interactive, tabbed editing interface for
 * updating personal details, experiences, education, skills, and layout design.
 * Includes AI-powered description enhancing.
 * 
 * @param {CVFormProps} props - Component properties.
 * @returns {JSX.Element} The rendered form interface.
 */
export default function CVForm({ data, onChange, onLoadSample, onClear }: CVFormProps) {
  const [activeTab, setActiveTab] = useState<'personal' | 'experience' | 'education' | 'skills' | 'design'>('personal')
  const [skillInput, setSkillInput] = useState('')
  const [enhancingField, setEnhancingField] = useState<{ type: string; id?: string } | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const appPalette = getActivePalette()
  const colorPresets = [
    { name: 'App Palette', value: appPalette.primary },
    ...COLOR_PRESETS.filter((color) => color.value.toLowerCase() !== appPalette.primary.toLowerCase())
  ]

  const { complete, isLoading } = useCompletion({
    api: '/api/enhance',
    onError: (error: Error) => {
      let msg = error.message
      try {
        const parsed = JSON.parse(error.message)
        if (parsed.error) msg = parsed.error
      } catch (e) {
        console.error(e)
      }
      setErrorMsg(msg)
      setEnhancingField(null)
    },
    onFinish: (_prompt: string, completion: string) => {
      if (!enhancingField) return

      if (enhancingField.type === 'summary') {
        updatePersonalInfo('summary', completion)
      } else if (enhancingField.type === 'experience' && enhancingField.id) {
        updateExperience(enhancingField.id, 'description', completion)
      }
      setEnhancingField(null)
      setErrorMsg(null)
    }
  })

  const handleEnhance = async (text: string, type: string, id?: string) => {
    if (!text.trim()) return
    
    const settings = getSettings()
    const apiKey = settings.provider === 'google' ? settings.googleKey : settings.openaiKey
    
    if (!apiKey) {
      setErrorMsg(`API key for ${settings.provider} is not configured. Please configure it in Settings.`)
      return
    }

    setEnhancingField({ type, id })
    setErrorMsg(null)
    await complete(text, { 
      body: { 
        type,
        provider: settings.provider,
        apiKey
      } 
    })
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

  const updateMetadata = (field: keyof CVMetadata, value: string) => {
    const currentMetadata: CVMetadata = data.metadata || {
      template: 'classic',
                  accentColor: appPalette.primary,
      fontFamily: 'serif'
    }
    onChange({
      ...data,
      metadata: {
        ...currentMetadata,
        [field]: value
      }
    })
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
    return score
  }

  const completeness = calculateCompleteness()

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800">
      
      {/* Form Utility Header */}
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className="font-semibold text-gray-800 dark:text-gray-200">Interactive Editor</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Customize your CV content and styling</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onLoadSample}
            className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 border border-blue-200 dark:border-blue-900 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Sparkle size={13} />
            Load Sample
          </button>
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg transition-colors"
          >
            <RotateCcw size={13} />
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
          <User size={16} />
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
          <Briefcase size={16} />
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
          <GraduationCap size={16} />
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
          <Wrench size={16} />
          <span>Skills</span>
          {data.skills.length > 0 && (
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
          <Palette size={16} />
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
                  disabled={isLoading || !data.personalInfo.summary.trim()}
                  className="flex items-center gap-1.5 text-xs bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 px-3 py-1.5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 disabled:opacity-40 transition-all font-medium"
                >
                  <Sparkles size={13} className={isLoading && enhancingField?.type === 'summary' ? 'animate-spin' : ''} />
                  {isLoading && enhancingField?.type === 'summary' ? 'Enhancing...' : 'AI Refine'}
                </button>
              </div>
              <textarea
                className="px-3.5 py-2.5 border rounded-lg h-40 resize-none border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 dark:text-gray-100 transition-all placeholder-gray-400 leading-relaxed"
                placeholder="Write a brief overview of your background, or write raw notes and click 'AI Refine' to generate a beautiful summary..."
                value={data.personalInfo.summary}
                onChange={(e) => updatePersonalInfo('summary', e.target.value)}
              />
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
                <Plus size={14} /> Add Role
              </button>
            </div>

            {data.experience.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-xl border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center">
                <Briefcase size={32} className="text-gray-300 dark:text-gray-600 mb-3" />
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
                        <ArrowUp size={15} />
                      </button>
                      <button
                        onClick={() => moveExperience(index, 'down')}
                        disabled={index === data.experience.length - 1}
                        className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-20 transition-colors"
                        title="Move Down"
                      >
                        <ArrowDown size={15} />
                      </button>
                      <button
                        onClick={() => removeExperience(exp.id)}
                        className="p-1 text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded transition-colors"
                        title="Delete Entry"
                      >
                        <Trash2 size={15} />
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
                          disabled={isLoading || !exp.description.trim()}
                          className="flex items-center gap-1.5 text-xs bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 px-3 py-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 disabled:opacity-40 transition-all font-medium"
                        >
                          <Sparkles size={12} className={isLoading && enhancingField?.id === exp.id ? 'animate-spin' : ''} />
                          {isLoading && enhancingField?.id === exp.id ? 'Enhancing...' : 'AI Professional Rewrite'}
                        </button>
                      </div>
                      <textarea
                        className="px-3 py-2 border rounded-lg h-28 resize-none border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 dark:text-gray-100 transition-all placeholder-gray-400 leading-relaxed"
                        placeholder="List your responsibilities, tasks, and key impacts. Bullet points are rendered automatically if you start lines with '-' or '*'."
                        value={exp.description}
                        onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                      />
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
                <Plus size={14} /> Add Degree
              </button>
            </div>

            {data.education.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-xl border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center">
                <GraduationCap size={32} className="text-gray-300 dark:text-gray-600 mb-3" />
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
                        <ArrowUp size={15} />
                      </button>
                      <button
                        onClick={() => moveEducation(index, 'down')}
                        disabled={index === data.education.length - 1}
                        className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-20 transition-colors"
                        title="Move Down"
                      >
                        <ArrowDown size={15} />
                      </button>
                      <button
                        onClick={() => removeEducation(edu.id)}
                        className="p-1 text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded transition-colors"
                        title="Delete Degree"
                      >
                        <Trash2 size={15} />
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

        {/* 5. DESIGN & TEMPLATES */}
        {activeTab === 'design' && (
          <div className="space-y-6 transition duration-200 ease-out">
            <div>
              <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-1">Visual Styles</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Select templates, brand colors, and gorgeous fonts</p>
            </div>

            {/* Template Selector */}
            <div className="flex flex-col gap-2.5">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Choose Template Theme</label>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: 'classic', title: 'Classic Serif', desc: 'Centered, highly academic' },
                  { id: 'modern', title: 'Modern Split', desc: 'Two-column sidebar structure' },
                  { id: 'minimalist', title: 'Minimalist', desc: 'Sleek, low padding, single page' },
                  { id: 'creative', title: 'Creative Banner', desc: 'Colored accent, bold titles' }
                ].map((tpl) => {
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
                            <Check size={10} strokeWidth={3} />
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
                  const currentColor = resolveAppAccentColor(data.metadata?.accentColor)
                  const isSelected = currentColor.toLowerCase() === color.value.toLowerCase()
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
                          <Check size={12} className="text-white drop-shadow-md" strokeWidth={3} />
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
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Typography Font Family</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'serif', title: 'Serif Elegant', family: 'font-serif' },
                  { id: 'sans', title: 'Modern Sans', family: 'font-sans' },
                  { id: 'mono', title: 'Technical Mono', family: 'font-mono' }
                ].map((font) => {
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
