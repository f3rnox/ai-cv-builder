import { CVData, CVMetadata, CVSectionId, CVTemplate } from '@/lib/types'
import { getActivePalette } from '@/lib/displaySettings'

export const DEFAULT_SECTION_ORDER: CVSectionId[] = [
  'summary',
  'skills',
  'experience',
  'education',
  'projects',
  'certifications',
  'languages',
  'awards',
  'publications',
  'volunteering',
  'links'
]

export const SECTION_LABELS: Record<CVSectionId, string> = {
  summary: 'Summary',
  skills: 'Skills',
  experience: 'Experience',
  education: 'Education',
  projects: 'Projects',
  certifications: 'Certifications',
  languages: 'Languages',
  awards: 'Awards',
  publications: 'Publications',
  volunteering: 'Volunteering',
  links: 'Links'
}

export function normalizeSectionOrder(order?: CVSectionId[]): CVSectionId[] {
  const known = new Set(DEFAULT_SECTION_ORDER)
  const provided = Array.isArray(order) ? order.filter((item): item is CVSectionId => known.has(item as CVSectionId)) : []
  const missing = DEFAULT_SECTION_ORDER.filter((item) => !provided.includes(item))
  return [...provided, ...missing]
}

export function createDefaultMetadata(metadata?: Partial<CVMetadata>): CVMetadata {
  return {
    template: (metadata?.template || 'classic') as CVTemplate,
    accentColor: metadata?.accentColor || getActivePalette().primary,
    fontFamily: metadata?.fontFamily || 'sans',
    sectionOrder: normalizeSectionOrder(metadata?.sectionOrder)
  }
}

export function createEmptyCVData(customData?: Partial<CVData>): CVData {
  return normalizeCVData({
    personalInfo: {
      name: '',
      title: '',
      email: '',
      phone: '',
      location: '',
      summary: ''
    },
    experience: [
      {
        id: '1',
        company: '',
        role: '',
        startDate: '',
        endDate: '',
        description: ''
      }
    ],
    education: [
      {
        id: '1',
        school: '',
        degree: '',
        year: ''
      }
    ],
    skills: [],
    projects: [],
    certifications: [],
    languages: [],
    awards: [],
    publications: [],
    volunteering: [],
    links: [],
    metadata: createDefaultMetadata(),
    ...customData
  })
}

export function normalizeCVData(data: Partial<CVData>): CVData {
  return {
    personalInfo: {
      name: data.personalInfo?.name || '',
      title: data.personalInfo?.title || '',
      email: data.personalInfo?.email || '',
      phone: data.personalInfo?.phone || '',
      location: data.personalInfo?.location || '',
      summary: data.personalInfo?.summary || ''
    },
    experience: Array.isArray(data.experience) ? data.experience : [],
    education: Array.isArray(data.education) ? data.education : [],
    skills: Array.isArray(data.skills) ? data.skills : [],
    projects: Array.isArray(data.projects) ? data.projects : [],
    certifications: Array.isArray(data.certifications) ? data.certifications : [],
    languages: Array.isArray(data.languages) ? data.languages : [],
    awards: Array.isArray(data.awards) ? data.awards : [],
    publications: Array.isArray(data.publications) ? data.publications : [],
    volunteering: Array.isArray(data.volunteering) ? data.volunteering : [],
    links: Array.isArray(data.links) ? data.links : [],
    metadata: createDefaultMetadata(data.metadata)
  }
}
