/**
 * Represents a single work experience entry in a CV.
 */
export interface Experience {
  id: string
  company: string
  role: string
  startDate: string
  endDate: string
  description: string
}

/**
 * Represents a single education entry in a CV.
 */
export interface Education {
  id: string
  school: string
  degree: string
  year: string
}

export interface Project {
  id: string
  name: string
  role: string
  technologies: string
  date: string
  url: string
  description: string
}

export interface Certification {
  id: string
  name: string
  issuer: string
  date: string
  url: string
}

export interface Language {
  id: string
  name: string
  proficiency: string
}

export interface Award {
  id: string
  title: string
  issuer: string
  date: string
  description: string
}

export interface Publication {
  id: string
  title: string
  publisher: string
  date: string
  url: string
  description: string
}

export interface Volunteering {
  id: string
  organization: string
  role: string
  startDate: string
  endDate: string
  description: string
}

export interface ProfessionalLink {
  id: string
  label: string
  url: string
}

/**
 * Represents the customization metadata for the CV.
 */
export type CVTemplate = 'classic' | 'classic-ats' | 'modern' | 'minimalist' | 'creative' | 'executive' | 'editorial' | 'technical'
export type CVSectionId =
  | 'summary'
  | 'skills'
  | 'experience'
  | 'education'
  | 'projects'
  | 'certifications'
  | 'languages'
  | 'awards'
  | 'publications'
  | 'volunteering'
  | 'links'

export interface CVMetadata {
  template: CVTemplate
  accentColor: string
  fontFamily: 'serif' | 'sans' | 'mono'
  sectionOrder?: CVSectionId[]
}

/**
 * Represents the complete CV data structure including personal information,
 * work experience, education history, skills, and layout metadata.
 */
export interface CVData {
  personalInfo: {
    name: string
    title: string
    email: string
    phone: string
    location: string
    summary: string
  }
  experience: Experience[]
  education: Education[]
  skills: string[]
  projects: Project[]
  certifications: Certification[]
  languages: Language[]
  awards: Award[]
  publications: Publication[]
  volunteering: Volunteering[]
  links: ProfessionalLink[]
  metadata?: CVMetadata
}

/**
 * Represents a saved CV with metadata for organization and library management.
 */
export interface CV {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  data: CVData
}
