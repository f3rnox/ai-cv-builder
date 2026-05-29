'use client'

import { CVData, CVSectionId } from '@/lib/types'
import { normalizeCVData, normalizeSectionOrder, SECTION_LABELS } from '@/lib/cvDefaults'
import { EnvelopeIcon as Mail, MapPinIcon as MapPin, PhoneIcon as Phone } from '@heroicons/react/24/outline'
import { resolveAppAccentColor } from '@/lib/displaySettings'

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

const fontClassMap = {
  serif: 'font-serif',
  sans: 'font-sans',
  mono: 'font-mono'
}

function textLines(text: string) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

export default function CVPreview({ data }: CVPreviewProps) {
  const cv = normalizeCVData(data || {})
  const { personalInfo, metadata } = cv
  const template = metadata?.template || 'classic'
  const accentColor = resolveAppAccentColor(metadata?.accentColor)
  const sectionOrder = normalizeSectionOrder(metadata?.sectionOrder)
  const fontClass = fontClassMap[metadata?.fontFamily || 'sans']

  const hasSection = (sectionId: CVSectionId) => {
    if (sectionId === 'summary') return Boolean(personalInfo.summary.trim())
    if (sectionId === 'skills') return cv.skills.length > 0
    if (sectionId === 'experience') return cv.experience.some((item) => item.company || item.role || item.description)
    if (sectionId === 'education') return cv.education.some((item) => item.school || item.degree || item.year)
    if (sectionId === 'projects') return cv.projects.some((item) => item.name || item.description || item.technologies)
    if (sectionId === 'certifications') return cv.certifications.some((item) => item.name || item.issuer)
    if (sectionId === 'languages') return cv.languages.some((item) => item.name)
    if (sectionId === 'awards') return cv.awards.some((item) => item.title || item.description)
    if (sectionId === 'publications') return cv.publications.some((item) => item.title || item.publisher)
    if (sectionId === 'volunteering') return cv.volunteering.some((item) => item.organization || item.role || item.description)
    if (sectionId === 'links') return cv.links.some((item) => item.label || item.url)
    return false
  }

  const SectionHeading = ({ sectionId }: { sectionId: CVSectionId }) => (
    <h2
      className="mb-2 border-b pb-1 text-[11px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400"
      style={{ borderColor: `${accentColor}30`, color: template === 'classic-ats' ? undefined : accentColor }}
    >
      {SECTION_LABELS[sectionId]}
    </h2>
  )

  const renderDescription = (text: string) => {
    const lines = textLines(text)
    if (lines.length === 0) return null

    return (
      <div className="space-y-1 text-[12px] leading-relaxed text-gray-700 dark:text-gray-300">
        {lines.map((line) => {
          const isBullet = line.startsWith('-') || line.startsWith('*')
          const content = isBullet ? line.slice(1).trim() : line
          return isBullet ? (
            <div key={line} className="flex items-start gap-1.5">
              <span className="mt-1 text-[10px]" style={{ color: accentColor }}>•</span>
              <span className="flex-1">{content}</span>
            </div>
          ) : (
            <p key={line}>{content}</p>
          )
        })}
      </div>
    )
  }

  const renderSection = (sectionId: CVSectionId) => {
    if (!hasSection(sectionId)) return null

    if (sectionId === 'summary') {
      return (
        <section key={sectionId}>
          <SectionHeading sectionId={sectionId} />
          <p className="text-[12px] leading-relaxed text-gray-700 dark:text-gray-300">{personalInfo.summary}</p>
        </section>
      )
    }

    if (sectionId === 'skills') {
      return (
        <section key={sectionId}>
          <SectionHeading sectionId={sectionId} />
          <div className={template === 'technical' ? 'grid grid-cols-2 gap-1.5 sm:grid-cols-3' : 'flex flex-wrap gap-1.5'}>
            {cv.skills.map((skill) => (
              <span
                key={skill}
                className={template === 'classic-ats'
                  ? 'text-[12px] text-gray-800 dark:text-gray-200'
                  : 'rounded border px-2 py-0.5 text-[10.5px] font-bold text-gray-700 dark:text-gray-300'}
                style={template === 'classic-ats' ? undefined : { borderColor: `${accentColor}30`, backgroundColor: `${accentColor}0d` }}
              >
                {skill}
              </span>
            ))}
          </div>
        </section>
      )
    }

    if (sectionId === 'experience') {
      return (
        <section key={sectionId}>
          <SectionHeading sectionId={sectionId} />
          <div className="space-y-4">
            {cv.experience.filter((item) => item.company || item.role || item.description).map((exp) => (
              <div key={exp.id}>
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-[13px] font-black text-gray-950 dark:text-gray-100">{exp.role || 'Position Title'}</h3>
                  <span className="shrink-0 text-[10.5px] font-semibold text-gray-500 dark:text-gray-400">
                    {[exp.startDate, exp.endDate].filter(Boolean).join(' - ')}
                  </span>
                </div>
                <p className="mb-1 text-[11.5px] font-bold uppercase" style={{ color: accentColor }}>{exp.company || 'Company'}</p>
                {renderDescription(exp.description)}
              </div>
            ))}
          </div>
        </section>
      )
    }

    if (sectionId === 'education') {
      return (
        <section key={sectionId}>
          <SectionHeading sectionId={sectionId} />
          <div className="space-y-2.5">
            {cv.education.filter((item) => item.school || item.degree || item.year).map((edu) => (
              <div key={edu.id} className="flex items-baseline justify-between gap-3">
                <div>
                  <h3 className="text-[12px] font-bold text-gray-950 dark:text-gray-100">{edu.school || 'School'}</h3>
                  <p className="text-[11.5px] text-gray-600 dark:text-gray-400">{edu.degree || 'Degree'}</p>
                </div>
                <span className="shrink-0 text-[10.5px] font-semibold text-gray-500 dark:text-gray-400">{edu.year}</span>
              </div>
            ))}
          </div>
        </section>
      )
    }

    if (sectionId === 'projects') {
      return (
        <section key={sectionId}>
          <SectionHeading sectionId={sectionId} />
          <div className="space-y-4">
            {cv.projects.filter((item) => item.name || item.description || item.technologies).map((project) => (
              <div key={project.id}>
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-[13px] font-black text-gray-950 dark:text-gray-100">{project.name || 'Project'}</h3>
                  <span className="shrink-0 text-[10.5px] font-semibold text-gray-500 dark:text-gray-400">{project.date}</span>
                </div>
                <p className="mb-1 text-[11.5px] font-bold" style={{ color: accentColor }}>
                  {[project.role, project.technologies].filter(Boolean).join(' | ')}
                </p>
                {project.url && <p className="mb-1 text-[10.5px] text-gray-500 dark:text-gray-400">{project.url}</p>}
                {renderDescription(project.description)}
              </div>
            ))}
          </div>
        </section>
      )
    }

    if (sectionId === 'certifications') {
      return (
        <section key={sectionId}>
          <SectionHeading sectionId={sectionId} />
          <div className="space-y-2">
            {cv.certifications.filter((item) => item.name || item.issuer).map((cert) => (
              <div key={cert.id} className="flex items-baseline justify-between gap-3 text-[12px]">
                <span><strong>{cert.name || 'Certification'}</strong>{cert.issuer && `, ${cert.issuer}`}</span>
                <span className="shrink-0 text-[10.5px] text-gray-500 dark:text-gray-400">{cert.date}</span>
              </div>
            ))}
          </div>
        </section>
      )
    }

    if (sectionId === 'languages') {
      return (
        <section key={sectionId}>
          <SectionHeading sectionId={sectionId} />
          <p className="text-[12px] leading-relaxed text-gray-700 dark:text-gray-300">
            {cv.languages.filter((item) => item.name).map((item) => [item.name, item.proficiency].filter(Boolean).join(' - ')).join(', ')}
          </p>
        </section>
      )
    }

    if (sectionId === 'awards') {
      return (
        <section key={sectionId}>
          <SectionHeading sectionId={sectionId} />
          <div className="space-y-3">
            {cv.awards.filter((item) => item.title || item.description).map((award) => (
              <div key={award.id}>
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-[12px] font-bold text-gray-950 dark:text-gray-100">{award.title || 'Award'}</h3>
                  <span className="shrink-0 text-[10.5px] text-gray-500 dark:text-gray-400">{award.date}</span>
                </div>
                {award.issuer && <p className="text-[11px] font-semibold" style={{ color: accentColor }}>{award.issuer}</p>}
                {renderDescription(award.description)}
              </div>
            ))}
          </div>
        </section>
      )
    }

    if (sectionId === 'publications') {
      return (
        <section key={sectionId}>
          <SectionHeading sectionId={sectionId} />
          <div className="space-y-3">
            {cv.publications.filter((item) => item.title || item.publisher).map((publication) => (
              <div key={publication.id}>
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-[12px] font-bold text-gray-950 dark:text-gray-100">{publication.title || 'Publication'}</h3>
                  <span className="shrink-0 text-[10.5px] text-gray-500 dark:text-gray-400">{publication.date}</span>
                </div>
                <p className="text-[11px] font-semibold" style={{ color: accentColor }}>{publication.publisher}</p>
                {publication.url && <p className="text-[10.5px] text-gray-500 dark:text-gray-400">{publication.url}</p>}
                {renderDescription(publication.description)}
              </div>
            ))}
          </div>
        </section>
      )
    }

    if (sectionId === 'volunteering') {
      return (
        <section key={sectionId}>
          <SectionHeading sectionId={sectionId} />
          <div className="space-y-3">
            {cv.volunteering.filter((item) => item.organization || item.role || item.description).map((item) => (
              <div key={item.id}>
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-[12px] font-bold text-gray-950 dark:text-gray-100">{item.role || 'Volunteer'}</h3>
                  <span className="shrink-0 text-[10.5px] text-gray-500 dark:text-gray-400">{[item.startDate, item.endDate].filter(Boolean).join(' - ')}</span>
                </div>
                <p className="text-[11px] font-semibold" style={{ color: accentColor }}>{item.organization}</p>
                {renderDescription(item.description)}
              </div>
            ))}
          </div>
        </section>
      )
    }

    if (sectionId === 'links') {
      return (
        <section key={sectionId}>
          <SectionHeading sectionId={sectionId} />
          <p className="text-[12px] leading-relaxed text-gray-700 dark:text-gray-300">
            {cv.links.filter((item) => item.label || item.url).map((item) => [item.label, item.url].filter(Boolean).join(': ')).join(' | ')}
          </p>
        </section>
      )
    }

    return null
  }

  const sectionList = (
    <div className="space-y-5">
      {sectionOrder.map((sectionId) => renderSection(sectionId))}
    </div>
  )

  const contactRow = (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] font-medium text-gray-500 dark:text-gray-400">
      {personalInfo.email && <span className="flex items-center gap-1"><Mail width={11} height={11} style={{ color: accentColor }} />{personalInfo.email}</span>}
      {personalInfo.phone && <span className="flex items-center gap-1"><Phone width={11} height={11} style={{ color: accentColor }} />{personalInfo.phone}</span>}
      {personalInfo.location && <span className="flex items-center gap-1"><MapPin width={11} height={11} style={{ color: accentColor }} />{personalInfo.location}</span>}
    </div>
  )

  if (template === 'modern') {
    return (
      <div id="cv-printable-area" className={`flex min-h-[842px] w-full bg-white text-gray-800 transition-all dark:bg-gray-800 dark:text-gray-200 ${fontClass} ${CV_PRINT_CLASSES}`}>
        <aside className="w-[205px] shrink-0 border-r border-slate-100 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900/40 print:!bg-slate-50">
          <h1 className="text-xl font-black leading-tight text-gray-950 dark:text-gray-100">{personalInfo.name || 'Your Name'}</h1>
          <p className="mt-1 text-[11px] font-bold uppercase tracking-wider" style={{ color: accentColor }}>{personalInfo.title || 'Professional Title'}</p>
          <div className="mt-5 space-y-2 border-t border-slate-200 pt-4 text-[10.5px] text-slate-600 dark:border-slate-700 dark:text-slate-300">
            {personalInfo.email && <p className="break-all">{personalInfo.email}</p>}
            {personalInfo.phone && <p>{personalInfo.phone}</p>}
            {personalInfo.location && <p>{personalInfo.location}</p>}
          </div>
        </aside>
        <main className="flex-1 p-8">{sectionList}</main>
      </div>
    )
  }

  if (template === 'creative' || template === 'editorial') {
    return (
      <div id="cv-printable-area" className={`min-h-[842px] w-full overflow-hidden bg-white text-gray-800 transition-all dark:bg-gray-800 dark:text-gray-200 ${fontClass} ${CV_PRINT_CLASSES}`}>
        <header className="p-8 text-white" style={{ backgroundColor: accentColor }}>
          <h1 className="text-3xl font-black uppercase leading-tight">{personalInfo.name || 'Your Name'}</h1>
          <p className="mt-1 text-xs font-bold uppercase tracking-widest opacity-90">{personalInfo.title || 'Professional Title'}</p>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-white/20 pt-3 text-[11px] font-medium opacity-90">
            {personalInfo.email && <span>{personalInfo.email}</span>}
            {personalInfo.phone && <span>{personalInfo.phone}</span>}
            {personalInfo.location && <span>{personalInfo.location}</span>}
          </div>
        </header>
        <main className="p-8">{sectionList}</main>
      </div>
    )
  }

  if (template === 'executive') {
    return (
      <div id="cv-printable-area" className={`min-h-[842px] w-full bg-white text-gray-800 transition-all dark:bg-gray-800 dark:text-gray-200 ${fontClass} ${CV_PRINT_CLASSES}`}>
        <header className="border-b-[6px] p-9 pb-6" style={{ borderColor: accentColor }}>
          <p className="text-[10px] font-bold uppercase text-gray-400">Executive Curriculum Vitae</p>
          <h1 className="mt-1 text-3xl font-black uppercase text-gray-950 dark:text-gray-100">{personalInfo.name || 'Your Name'}</h1>
          <p className="mt-1 text-sm font-bold uppercase" style={{ color: accentColor }}>{personalInfo.title || 'Professional Title'}</p>
          <div className="mt-3">{contactRow}</div>
        </header>
        <main className="p-9">{sectionList}</main>
      </div>
    )
  }

  return (
    <div id="cv-printable-area" className={`min-h-[842px] w-full border border-gray-100 bg-white p-9 text-gray-800 transition-all dark:border-gray-800 dark:bg-gray-800 dark:text-gray-200 ${fontClass} ${CV_PRINT_CLASSES}`}>
      <header className={template === 'classic' ? 'mb-5 border-b-2 pb-5 text-center' : 'mb-5 border-b border-gray-200 pb-4'} style={{ borderColor: template === 'classic' ? `${accentColor}25` : undefined }}>
        <h1 className={template === 'minimalist' ? 'text-xl font-black text-gray-950 dark:text-gray-100' : 'text-2xl font-black uppercase tracking-wide text-gray-950 dark:text-gray-100'}>
          {personalInfo.name || 'Your Name'}
        </h1>
        <p className="mt-1 text-sm font-bold uppercase tracking-wide" style={{ color: accentColor }}>{personalInfo.title || 'Professional Title'}</p>
        <div className={`mt-3 ${template === 'classic' ? 'flex justify-center' : ''}`}>{contactRow}</div>
      </header>
      {sectionList}
    </div>
  )
}
