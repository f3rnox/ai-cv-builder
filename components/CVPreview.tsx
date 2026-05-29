'use client'

import { CVData } from '@/lib/types'
import {
  EnvelopeIcon as Mail,
  PhoneIcon as Phone,
  MapPinIcon as MapPin,
  TrophyIcon as Award
} from '@heroicons/react/24/outline'
import { resolveAppAccentColor } from '@/lib/displaySettings'

/**
 * Properties for the CVPreview component.
 */
interface CVPreviewProps {
  readonly data: CVData
}

const CV_PRINT_CLASSES = [
  '[-webkit-print-color-adjust:exact]',
  '[print-color-adjust:exact]',
  'print:relative',
  'print:mx-auto',
  'print:w-[210mm]',
  'print:min-h-[297mm]',
  'print:max-w-full',
  'print:overflow-visible',
  'print:border-0',
  'print:bg-white',
  'print:p-[20mm]',
  'print:text-[#111111]',
  'print:shadow-none',
  'print:[&_h1]:!text-[#111111]',
  'print:[&_h2]:!text-[#111111]',
  'print:[&_h3]:!text-[#111111]',
  'print:[&_h4]:!text-[#111111]',
  'print:[&_li]:!text-[#111111]',
  'print:[&_p]:!text-[#111111]',
  'print:[&_span]:!text-[#111111]'
].join(' ')

/**
 * CVPreview component renders a high-fidelity, real-time preview of the CV.
 * It supports multiple templates (Classic, Modern, Minimalist, Creative, Executive, Editorial, Technical),
 * customizable accent colors, and custom fonts.
 * Optimized for screen rendering and paper printing.
 * 
 * @param {CVPreviewProps} props - Component properties.
 * @returns {JSX.Element} The rendered preview interface.
 */
export default function CVPreview({ data }: CVPreviewProps) {
  // Safe default fallbacks to prevent any runtime crashes
  const personalInfo = data?.personalInfo || {
    name: '',
    title: '',
    email: '',
    phone: '',
    location: '',
    summary: ''
  }
  const experience = Array.isArray(data?.experience) ? data.experience : []
  const education = Array.isArray(data?.education) ? data.education : []
  const skills = Array.isArray(data?.skills) ? data.skills : []
  const metadata = data?.metadata || {
    template: 'classic',
    accentColor: '#2563eb',
    fontFamily: 'sans'
  }

  // Sensible default styling variables
  const template = metadata?.template || 'classic'
  const accentColor = resolveAppAccentColor(metadata?.accentColor)

  // Map to the same font family as the rest of the UI (font-sans)
  const fontClass = 'font-sans'

  // Helper to render descriptions with newlines or bullet points
  const renderDescription = (text: string) => {
    if (!text) return null
    return (
      <div className="text-[12px] leading-relaxed text-gray-700 dark:text-gray-300 space-y-1">
        {text.split('\n').map((line) => {
          const trimmed = line.trim()
          if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
            const bulletContent = trimmed.substring(1).trim()
            return (
              <div key={bulletContent} className="flex items-start gap-1.5 ml-1">
                <span className="text-[10px] mt-1 shrink-0" style={{ color: accentColor }}>•</span>
                <span className="flex-1">{bulletContent}</span>
              </div>
            )
          }
          return trimmed ? <p key={trimmed} className="mb-0.5">{trimmed}</p> : null
        })}
      </div>
    )
  }

  // ==========================================
  // TEMPLATE 1: CLASSIC (Academic & Formal)
  // ==========================================
  if (template === 'classic') {
    return (
      <div 
        id="cv-printable-area"
        className={`bg-white dark:bg-gray-800 p-10 min-h-[842px] w-full text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-800 transition-all ${fontClass} ${CV_PRINT_CLASSES}`}
      >
        {/* Centered Formal Header */}
        <div className="text-center border-b-2 pb-5 mb-5" style={{ borderColor: `${accentColor}20` }}>
          <h1 className="text-2xl font-bold uppercase tracking-wider text-gray-900 dark:text-gray-100 mb-1">
            {personalInfo.name || 'Your Name'}
          </h1>
          <p className="text-sm font-semibold tracking-wide uppercase" style={{ color: accentColor }}>
            {personalInfo.title || 'Professional Title'}
          </p>
          
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-3 text-xs text-gray-500 dark:text-gray-400 font-medium">
            {personalInfo.email && (
              <span className="flex items-center gap-1">
                <Mail width={11} height={11} style={{ color: accentColor }} />
                {personalInfo.email}
              </span>
            )}
            {personalInfo.phone && (
              <span className="flex items-center gap-1">
                <Phone width={11} height={11} style={{ color: accentColor }} />
                {personalInfo.phone}
              </span>
            )}
            {personalInfo.location && (
              <span className="flex items-center gap-1">
                <MapPin width={11} height={11} style={{ color: accentColor }} />
                {personalInfo.location}
              </span>
            )}
          </div>
        </div>

        {/* Summary */}
        {personalInfo.summary && (
          <div className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-widest border-b pb-1 mb-2" style={{ color: accentColor, borderColor: `${accentColor}30` }}>
              Professional Summary
            </h2>
            <p className="text-[12px] leading-relaxed text-gray-700 dark:text-gray-300 text-justify">
              {personalInfo.summary}
            </p>
          </div>
        )}

        {/* Work Experience */}
        {experience.length > 0 && (
          <div className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-widest border-b pb-1 mb-3.5" style={{ color: accentColor, borderColor: `${accentColor}30` }}>
              Experience
            </h2>
            <div className="space-y-4">
              {experience.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-bold text-[13px] text-gray-950 dark:text-gray-100">{exp.role || 'Position Title'}</h3>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium italic">
                      {exp.startDate} {exp.startDate && exp.endDate ? '–' : ''} {exp.endDate}
                    </span>
                  </div>
                  <div className="text-[12px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">{exp.company || 'Company'}</div>
                  {renderDescription(exp.description)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {education.length > 0 && (
          <div className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-widest border-b pb-1 mb-3" style={{ color: accentColor, borderColor: `${accentColor}30` }}>
              Education
            </h2>
            <div className="space-y-3">
              {education.map((edu) => (
                <div key={edu.id} className="flex justify-between items-baseline">
                  <div>
                    <h3 className="font-bold text-[13px] text-gray-950 dark:text-gray-100">{edu.school || 'University'}</h3>
                    <div className="text-[12px] text-gray-600 dark:text-gray-400">{edu.degree || 'Degree / Major'}</div>
                  </div>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">{edu.year}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest border-b pb-1 mb-2.5" style={{ color: accentColor, borderColor: `${accentColor}30` }}>
              Skills
            </h2>
            <p className="text-[12px] leading-relaxed text-gray-700 dark:text-gray-300">
              {skills.join('  •  ')}
            </p>
          </div>
        )}
      </div>
    )
  }

  // ==========================================
  // TEMPLATE 2: CLASSIC ATS (Plain & Parser-Friendly)
  // ==========================================
  if (template === 'classic-ats') {
    return (
      <div
        id="cv-printable-area"
        className={`bg-white dark:bg-gray-800 p-9 min-h-[842px] w-full text-gray-900 dark:text-gray-100 border border-gray-100 dark:border-gray-800 transition-all ${fontClass} ${CV_PRINT_CLASSES}`}
      >
        <header className="border-b border-gray-300 pb-3">
          <h1 className="text-2xl font-bold text-gray-950 dark:text-gray-100">
            {personalInfo.name || 'Your Name'}
          </h1>
          <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-gray-200">
            {personalInfo.title || 'Professional Title'}
          </p>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-600 dark:text-gray-400">
            {personalInfo.email && <span>{personalInfo.email}</span>}
            {personalInfo.phone && <span>{personalInfo.phone}</span>}
            {personalInfo.location && <span>{personalInfo.location}</span>}
          </div>
        </header>

        {personalInfo.summary && (
          <section className="mt-5">
            <h2 className="mb-2 border-b border-gray-200 pb-1 text-[12px] font-bold uppercase text-gray-900 dark:text-gray-100">
              Professional Summary
            </h2>
            <p className="text-[12px] leading-relaxed text-gray-800 dark:text-gray-200">
              {personalInfo.summary}
            </p>
          </section>
        )}

        {experience.length > 0 && (
          <section className="mt-5">
            <h2 className="mb-3 border-b border-gray-200 pb-1 text-[12px] font-bold uppercase text-gray-900 dark:text-gray-100">
              Experience
            </h2>
            <div className="space-y-4">
              {experience.map((exp) => (
                <div key={exp.id}>
                  <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between">
                    <h3 className="text-[13px] font-bold text-gray-950 dark:text-gray-100">{exp.role || 'Position Title'}</h3>
                    <span className="text-[11px] text-gray-600 dark:text-gray-400">{exp.startDate} - {exp.endDate}</span>
                  </div>
                  <p className="mb-1 text-[12px] font-semibold text-gray-800 dark:text-gray-200">{exp.company || 'Company'}</p>
                  {renderDescription(exp.description)}
                </div>
              ))}
            </div>
          </section>
        )}

        {education.length > 0 && (
          <section className="mt-5">
            <h2 className="mb-3 border-b border-gray-200 pb-1 text-[12px] font-bold uppercase text-gray-900 dark:text-gray-100">
              Education
            </h2>
            <div className="space-y-2">
              {education.map((edu) => (
                <div key={edu.id} className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between">
                  <div>
                    <h3 className="text-[12px] font-bold text-gray-950 dark:text-gray-100">{edu.school || 'School'}</h3>
                    <p className="text-[12px] text-gray-700 dark:text-gray-300">{edu.degree || 'Degree'}</p>
                  </div>
                  <span className="text-[11px] text-gray-600 dark:text-gray-400">{edu.year}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {skills.length > 0 && (
          <section className="mt-5">
            <h2 className="mb-2 border-b border-gray-200 pb-1 text-[12px] font-bold uppercase text-gray-900 dark:text-gray-100">
              Skills
            </h2>
            <p className="text-[12px] leading-relaxed text-gray-800 dark:text-gray-200">
              {skills.join(', ')}
            </p>
          </section>
        )}
      </div>
    )
  }

  // ==========================================
  // TEMPLATE 3: MODERN SPLIT (2-Column Sidebar)
  // ==========================================
  if (template === 'modern') {
    return (
      <div 
        id="cv-printable-area"
        className={`bg-white dark:bg-gray-800 min-h-[842px] w-full text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-800 flex transition-all ${fontClass} ${CV_PRINT_CLASSES}`}
      >
        {/* Left Column (Sidebar) */}
        <div className="w-[195px] bg-slate-50 dark:bg-slate-900/40 p-6 border-r border-slate-100 dark:border-slate-800 shrink-0 flex flex-col gap-6 print:!bg-slate-50">
          
          {/* Identity */}
          <div>
            <h1 className="text-lg font-extrabold text-gray-950 dark:text-gray-100 leading-tight">
              {personalInfo.name || 'Your Name'}
            </h1>
            <p className="text-[11px] font-bold mt-1 tracking-wider uppercase" style={{ color: accentColor }}>
              {personalInfo.title || 'Professional Title'}
            </p>
          </div>

          {/* Contact details */}
          <div className="flex flex-col gap-3 pt-3 border-t border-slate-200/50 dark:border-slate-700/50">
            <h2 className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Contact</h2>
            
            {personalInfo.email && (
              <div className="flex items-start gap-2 text-[11px]">
                <Mail width={12} height={12} className="mt-0.5 shrink-0" style={{ color: accentColor }} />
                <span className="break-all text-slate-600 dark:text-slate-300">{personalInfo.email}</span>
              </div>
            )}
            
            {personalInfo.phone && (
              <div className="flex items-start gap-2 text-[11px]">
                <Phone width={12} height={12} className="mt-0.5 shrink-0" style={{ color: accentColor }} />
                <span className="text-slate-600 dark:text-slate-300">{personalInfo.phone}</span>
              </div>
            )}

            {personalInfo.location && (
              <div className="flex items-start gap-2 text-[11px]">
                <MapPin width={12} height={12} className="mt-0.5 shrink-0" style={{ color: accentColor }} />
                <span className="text-slate-600 dark:text-slate-300">{personalInfo.location}</span>
              </div>
            )}
          </div>

          {/* Skills */}
          {skills.length > 0 && (
            <div className="flex flex-col gap-2.5 pt-3 border-t border-slate-200/50 dark:border-slate-700/50">
              <h2 className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Expertise</h2>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((skill) => (
                  <span 
                    key={skill} 
                    className="text-[10px] px-2 py-0.5 rounded font-medium bg-slate-200/50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300/10"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (Main content) */}
        <div className="flex-1 p-8 flex flex-col gap-6">
          
          {/* Summary */}
          {personalInfo.summary && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest border-b pb-1 mb-2.5 text-gray-400 flex items-center gap-1.5">
                <span className="w-1 h-3 rounded" style={{ backgroundColor: accentColor }} /> Profile Summary
              </h2>
              <p className="text-[11.5px] leading-relaxed text-gray-700 dark:text-gray-300">
                {personalInfo.summary}
              </p>
            </div>
          )}

          {/* Experience */}
          {experience.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest border-b pb-1 mb-4 text-gray-400 flex items-center gap-1.5">
                <span className="w-1 h-3 rounded" style={{ backgroundColor: accentColor }} /> Professional History
              </h2>
              <div className="space-y-4">
                {experience.map((exp) => (
                  <div key={exp.id} className="relative pl-1.5">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h3 className="font-extrabold text-[12.5px] text-gray-950 dark:text-gray-100">{exp.role || 'Position Title'}</h3>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold tracking-tight shrink-0 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        {exp.startDate} – {exp.endDate}
                      </span>
                    </div>
                    <div className="text-[11px] font-bold mb-2 uppercase tracking-wide text-slate-500" style={{ color: accentColor }}>
                      {exp.company || 'Company'}
                    </div>
                    {renderDescription(exp.description)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {education.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest border-b pb-1 mb-3 text-gray-400 flex items-center gap-1.5">
                <span className="w-1 h-3 rounded" style={{ backgroundColor: accentColor }} /> Education
              </h2>
              <div className="space-y-3.5">
                {education.map((edu) => (
                  <div key={edu.id} className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-[12px] text-gray-950 dark:text-gray-100">{edu.school || 'School'}</h3>
                      <div className="text-[11px] text-slate-500 mt-0.5">{edu.degree || 'Degree'}</div>
                    </div>
                    <span className="text-[11px] text-gray-400 font-bold shrink-0">{edu.year}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ==========================================
  // TEMPLATE 3: MINIMALIST (Clean & Compact)
  // ==========================================
  if (template === 'minimalist') {
    return (
      <div 
        id="cv-printable-area"
        className={`bg-white dark:bg-gray-800 p-8 min-h-[842px] w-full text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-800 transition-all ${fontClass} ${CV_PRINT_CLASSES}`}
      >
        {/* Low Profile Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end border-b pb-3 mb-4 border-slate-100 dark:border-slate-800">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-950 dark:text-gray-100">
              {personalInfo.name || 'Your Name'}
            </h1>
            <p className="text-xs font-medium mt-0.5" style={{ color: accentColor }}>
              {personalInfo.title || 'Professional Title'}
            </p>
          </div>
          <div className="flex flex-col items-start sm:items-end text-[10px] text-gray-400 gap-0.5 mt-2 sm:mt-0">
            {personalInfo.email && <span>{personalInfo.email}</span>}
            {personalInfo.phone && <span>{personalInfo.phone}</span>}
            {personalInfo.location && <span>{personalInfo.location}</span>}
          </div>
        </div>

        {/* Summary */}
        {personalInfo.summary && (
          <div className="mb-4">
            <p className="text-[11px] leading-relaxed text-gray-600 dark:text-gray-400 text-justify">
              {personalInfo.summary}
            </p>
          </div>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <div className="mb-4">
            <h2 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2 border-b pb-0.5 border-slate-100 dark:border-slate-800">
              Experience
            </h2>
            <div className="space-y-3.5">
              {experience.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline">
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-[11.5px] text-gray-900 dark:text-gray-100">{exp.role || 'Position'}</span>
                      <span className="text-[10px] text-gray-400">—</span>
                      <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">{exp.company || 'Company'}</span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium">
                      {exp.startDate} – {exp.endDate}
                    </span>
                  </div>
                  <div className="mt-1">
                    {renderDescription(exp.description)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {education.length > 0 && (
          <div className="mb-4">
            <h2 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2 border-b pb-0.5 border-slate-100 dark:border-slate-800">
              Education
            </h2>
            <div className="space-y-2">
              {education.map((edu) => (
                <div key={edu.id} className="flex justify-between items-baseline text-[11px]">
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-gray-900 dark:text-gray-100">{edu.school || 'School'}</span>
                    <span className="text-gray-400 text-[10px]">—</span>
                    <span className="text-gray-500">{edu.degree || 'Degree'}</span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium">{edu.year}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div>
            <h2 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5 border-b pb-0.5 border-slate-100 dark:border-slate-800">
              Skills
            </h2>
            <p className="text-[11px] leading-relaxed text-gray-600 dark:text-gray-400">
              {skills.join(', ')}
            </p>
          </div>
        )}
      </div>
    )
  }

  // ==========================================
  // TEMPLATE 4: EXECUTIVE BRIEF (Premium & Formal)
  // ==========================================
  if (template === 'executive') {
    return (
      <div
        id="cv-printable-area"
        className={`bg-white dark:bg-gray-800 min-h-[842px] w-full text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-800 transition-all ${fontClass} ${CV_PRINT_CLASSES}`}
      >
        <div className="p-9 pb-6 border-b-[6px]" style={{ borderColor: accentColor }}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase text-gray-400">Executive Curriculum Vitae</p>
              <h1 className="mt-1 text-3xl font-black uppercase text-gray-950 dark:text-gray-100">
                {personalInfo.name || 'Your Name'}
              </h1>
              <p className="mt-1 text-sm font-bold uppercase" style={{ color: accentColor }}>
                {personalInfo.title || 'Professional Title'}
              </p>
            </div>
            <div className="flex flex-col gap-1 text-[11px] text-gray-500 dark:text-gray-400 sm:text-right">
              {personalInfo.email && <span>{personalInfo.email}</span>}
              {personalInfo.phone && <span>{personalInfo.phone}</span>}
              {personalInfo.location && <span>{personalInfo.location}</span>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-7 p-9 md:grid-cols-[1fr_170px]">
          <div className="space-y-6">
            {personalInfo.summary && (
              <section>
                <h2 className="mb-2 text-[11px] font-black uppercase text-gray-400">Leadership Profile</h2>
                <p className="text-[12px] leading-relaxed text-gray-700 dark:text-gray-300">{personalInfo.summary}</p>
              </section>
            )}

            {experience.length > 0 && (
              <section>
                <h2 className="mb-3 text-[11px] font-black uppercase text-gray-400">Executive Experience</h2>
                <div className="space-y-4">
                  {experience.map((exp) => (
                    <div key={exp.id} className="border-t pt-3 border-gray-100 dark:border-gray-700">
                      <div className="flex items-baseline justify-between gap-3">
                        <h3 className="text-[13px] font-black text-gray-950 dark:text-gray-100">{exp.role || 'Position Title'}</h3>
                        <span className="shrink-0 text-[10px] font-bold text-gray-400">{exp.startDate} - {exp.endDate}</span>
                      </div>
                      <p className="mb-1.5 text-[11px] font-bold uppercase" style={{ color: accentColor }}>{exp.company || 'Company'}</p>
                      {renderDescription(exp.description)}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-5 border-l border-gray-100 pl-5 dark:border-gray-700">
            {skills.length > 0 && (
              <section>
                <h2 className="mb-2 text-[10px] font-black uppercase text-gray-400">Core Strengths</h2>
                <div className="flex flex-col gap-1.5">
                  {skills.map((skill) => (
                    <span key={skill} className="text-[10.5px] font-bold text-gray-700 dark:text-gray-300">{skill}</span>
                  ))}
                </div>
              </section>
            )}
            {education.length > 0 && (
              <section>
                <h2 className="mb-2 text-[10px] font-black uppercase text-gray-400">Education</h2>
                <div className="space-y-3">
                  {education.map((edu) => (
                    <div key={edu.id}>
                      <h3 className="text-[11px] font-bold text-gray-900 dark:text-gray-100">{edu.school || 'School'}</h3>
                      <p className="text-[10.5px] text-gray-500">{edu.degree || 'Degree'}</p>
                      <p className="text-[10px] font-bold" style={{ color: accentColor }}>{edu.year}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </aside>
        </div>
      </div>
    )
  }

  // ==========================================
  // TEMPLATE 5: EDITORIAL PROFILE (Magazine Inspired)
  // ==========================================
  if (template === 'editorial') {
    return (
      <div
        id="cv-printable-area"
        className={`bg-white dark:bg-gray-800 min-h-[842px] w-full text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-800 transition-all ${fontClass} ${CV_PRINT_CLASSES}`}
      >
        <div className="grid grid-cols-1 md:grid-cols-[210px_1fr]">
          <div className="p-8 text-white" style={{ backgroundColor: accentColor }}>
            <h1 className="text-3xl font-black leading-none uppercase">{personalInfo.name || 'Your Name'}</h1>
            <p className="mt-4 text-[11px] font-bold uppercase opacity-85">{personalInfo.title || 'Professional Title'}</p>
            <div className="mt-7 space-y-2 border-t border-white/25 pt-4 text-[10.5px] opacity-90">
              {personalInfo.email && <p className="break-all">{personalInfo.email}</p>}
              {personalInfo.phone && <p>{personalInfo.phone}</p>}
              {personalInfo.location && <p>{personalInfo.location}</p>}
            </div>
          </div>

          <div className="p-8 space-y-6">
            {personalInfo.summary && (
              <section>
                <h2 className="mb-2 text-[10px] font-black uppercase text-gray-400">Profile</h2>
                <p className="text-[13px] leading-relaxed text-gray-700 dark:text-gray-300">{personalInfo.summary}</p>
              </section>
            )}

            {experience.length > 0 && (
              <section>
                <h2 className="mb-3 text-[10px] font-black uppercase text-gray-400">Work</h2>
                <div className="space-y-4">
                  {experience.map((exp) => (
                    <div key={exp.id} className="grid grid-cols-1 gap-1 border-b border-gray-100 pb-4 last:border-0 md:grid-cols-[95px_1fr] dark:border-gray-700">
                      <span className="text-[10px] font-bold uppercase text-gray-400">{exp.startDate} - {exp.endDate}</span>
                      <div>
                        <h3 className="text-[13px] font-black text-gray-950 dark:text-gray-100">{exp.role || 'Position'}</h3>
                        <p className="mb-1.5 text-[11px] font-bold" style={{ color: accentColor }}>{exp.company || 'Company'}</p>
                        {renderDescription(exp.description)}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {education.length > 0 && (
                <section>
                  <h2 className="mb-2 text-[10px] font-black uppercase text-gray-400">Education</h2>
                  <div className="space-y-2">
                    {education.map((edu) => (
                      <div key={edu.id}>
                        <h3 className="text-[11.5px] font-bold text-gray-900 dark:text-gray-100">{edu.school || 'School'}</h3>
                        <p className="text-[10.5px] text-gray-500">{edu.degree || 'Degree'} {edu.year && `- ${edu.year}`}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {skills.length > 0 && (
                <section>
                  <h2 className="mb-2 text-[10px] font-black uppercase text-gray-400">Skills</h2>
                  <p className="text-[11px] leading-relaxed text-gray-600 dark:text-gray-400">{skills.join(' / ')}</p>
                </section>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ==========================================
  // TEMPLATE 6: TECHNICAL MATRIX (Dense & Skills-Forward)
  // ==========================================
  if (template === 'technical') {
    return (
      <div
        id="cv-printable-area"
        className={`bg-white dark:bg-gray-800 p-8 min-h-[842px] w-full text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-800 transition-all ${fontClass} ${CV_PRINT_CLASSES}`}
      >
        <header className="border-b-2 pb-4" style={{ borderColor: accentColor }}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-black text-gray-950 dark:text-gray-100">{personalInfo.name || 'Your Name'}</h1>
              <p className="text-[12px] font-bold" style={{ color: accentColor }}>{personalInfo.title || 'Professional Title'}</p>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10.5px] text-gray-500 dark:text-gray-400 sm:justify-end">
              {personalInfo.email && <span>{personalInfo.email}</span>}
              {personalInfo.phone && <span>{personalInfo.phone}</span>}
              {personalInfo.location && <span>{personalInfo.location}</span>}
            </div>
          </div>
        </header>

        {skills.length > 0 && (
          <section className="mt-5 rounded border border-gray-100 p-3 dark:border-gray-700">
            <h2 className="mb-2 text-[10px] font-black uppercase text-gray-400">Technical Matrix</h2>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {skills.map((skill) => (
                <span key={skill} className="border-l-2 bg-gray-50 px-2 py-1 text-[10.5px] font-bold text-gray-700 dark:bg-gray-900 dark:text-gray-300" style={{ borderColor: accentColor }}>
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}

        {personalInfo.summary && (
          <section className="mt-5">
            <h2 className="mb-2 text-[10px] font-black uppercase text-gray-400">Summary</h2>
            <p className="text-[11.5px] leading-relaxed text-gray-700 dark:text-gray-300">{personalInfo.summary}</p>
          </section>
        )}

        {experience.length > 0 && (
          <section className="mt-5">
            <h2 className="mb-3 text-[10px] font-black uppercase text-gray-400">Experience</h2>
            <div className="space-y-3">
              {experience.map((exp) => (
                <div key={exp.id} className="rounded border border-gray-100 p-3 dark:border-gray-700">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-[12px] font-black text-gray-950 dark:text-gray-100">{exp.role || 'Position'}</h3>
                    <span className="text-[10px] font-mono text-gray-400">{exp.startDate} - {exp.endDate}</span>
                  </div>
                  <p className="mb-1.5 text-[10.5px] font-bold uppercase" style={{ color: accentColor }}>{exp.company || 'Company'}</p>
                  {renderDescription(exp.description)}
                </div>
              ))}
            </div>
          </section>
        )}

        {education.length > 0 && (
          <section className="mt-5">
            <h2 className="mb-2 text-[10px] font-black uppercase text-gray-400">Education</h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {education.map((edu) => (
                <div key={edu.id} className="text-[11px]">
                  <span className="font-bold text-gray-900 dark:text-gray-100">{edu.school || 'School'}</span>
                  <span className="text-gray-500"> - {edu.degree || 'Degree'} {edu.year && `(${edu.year})`}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    )
  }

  // ==========================================
  // TEMPLATE 7: CREATIVE (Header Banner)
  // ==========================================
  return (
    <div 
      id="cv-printable-area"
      className={`bg-white dark:bg-gray-800 min-h-[842px] w-full text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-800 transition-all overflow-hidden ${fontClass} ${CV_PRINT_CLASSES}`}
    >
      {/* Sleek Top Accent Banner */}
      <div className="p-8 text-white relative flex flex-col gap-1" style={{ backgroundColor: accentColor }}>
        <h1 className="text-2xl font-black uppercase tracking-wider">
          {personalInfo.name || 'Your Name'}
        </h1>
        <p className="text-xs font-bold tracking-widest uppercase opacity-90">
          {personalInfo.title || 'Professional Title'}
        </p>

        {/* Banner Details */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4 text-[11px] font-medium opacity-85 pt-3 border-t border-white/20">
          {personalInfo.email && (
            <span className="flex items-center gap-1.5">
              <Mail width={11} height={11} />
              {personalInfo.email}
            </span>
          )}
          {personalInfo.phone && (
            <span className="flex items-center gap-1.5">
              <Phone width={11} height={11} />
              {personalInfo.phone}
            </span>
          )}
          {personalInfo.location && (
            <span className="flex items-center gap-1.5">
              <MapPin width={11} height={11} />
              {personalInfo.location}
            </span>
          )}
        </div>
      </div>

      <div className="p-8 flex flex-col gap-5.5">
        
        {/* Summary */}
        {personalInfo.summary && (
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-widest mb-2 flex items-center gap-1" style={{ color: accentColor }}>
              <Award width={13} height={13} />
              About Me
            </h2>
            <p className="text-[12px] leading-relaxed text-gray-700 dark:text-gray-300">
              {personalInfo.summary}
            </p>
          </div>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-widest mb-3.5 flex items-center gap-1" style={{ color: accentColor }}>
              <Award width={13} height={13} />
              Professional Experience
            </h2>
            <div className="space-y-4">
              {experience.map((exp) => (
                <div key={exp.id} className="border-l-2 pl-3.5 relative" style={{ borderColor: `${accentColor}40` }}>
                  {/* Timeline dot */}
                  <div className="absolute w-2 h-2 rounded-full left-[-5px] top-1.5" style={{ backgroundColor: accentColor }} />
                  
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className="font-extrabold text-[12.5px] text-gray-900 dark:text-gray-100">{exp.role || 'Position'}</h3>
                    <span className="text-[10px] text-gray-400 font-bold">
                      {exp.startDate} – {exp.endDate}
                    </span>
                  </div>
                  <div className="text-[11.5px] font-semibold text-gray-500 mb-2">{exp.company || 'Company'}</div>
                  {renderDescription(exp.description)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {education.length > 0 && (
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-widest mb-2.5 flex items-center gap-1" style={{ color: accentColor }}>
              <Award width={13} height={13} />
              Education
            </h2>
            <div className="space-y-3">
              {education.map((edu) => (
                <div key={edu.id} className="flex justify-between items-baseline">
                  <div>
                    <h3 className="font-extrabold text-[12px] text-gray-900 dark:text-gray-100">{edu.school || 'School'}</h3>
                    <div className="text-[11.5px] text-gray-600 dark:text-gray-400">{edu.degree || 'Degree'}</div>
                  </div>
                  <span className="text-[10px] text-gray-400 font-bold">{edu.year}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-widest mb-2 flex items-center gap-1" style={{ color: accentColor }}>
              <Award width={13} height={13} />
              Skills & Expertise
            </h2>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {skills.map((skill) => (
                <span 
                  key={skill} 
                  className="text-[10.5px] px-2.5 py-0.5 rounded-full font-medium text-white shadow-sm"
                  style={{ backgroundColor: `${accentColor}ee` }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
