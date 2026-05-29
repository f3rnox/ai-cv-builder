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

/**
 * Represents the customization metadata for the CV.
 */
export type CVTemplate = 'classic' | 'classic-ats' | 'modern' | 'minimalist' | 'creative' | 'executive' | 'editorial' | 'technical'

export interface CVMetadata {
  template: CVTemplate
  accentColor: string
  fontFamily: 'serif' | 'sans' | 'mono'
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
