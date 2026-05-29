import { CV, CVData } from '@/lib/types'
import { getActivePalette } from '@/lib/displaySettings'
import { normalizeCVData } from '@/lib/cvDefaults'

/**
 * Retrieves all saved CVs from local storage, handles schema migration from legacy single-CV data,
 * and returns the list of CVs sorted by their last updated timestamp.
 * 
 * @returns {CV[]} An array of saved CVs, or an empty array if none exist.
 */
export default function getCVs(): CV[] {
  if (globalThis.window === undefined) {
    return []
  }

  const stored = localStorage.getItem('ai-cvs')
  if (stored) {
    try {
      const cvs: CV[] = JSON.parse(stored)
      return cvs
        .map((cv) => ({
          ...cv,
          data: normalizeCVData(cv.data)
        }))
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    } catch (e) {
      console.error('Failed to parse saved CVs list:', e)
    }
  }

  // Fallback / Migration: Check if there's a legacy single CV saved
  const legacySaved = localStorage.getItem('cv-data')
  if (legacySaved) {
    try {
      const parsed = JSON.parse(legacySaved)
      if (parsed.personalInfo || parsed.experience || parsed.education || parsed.skills) {
        // Formulate a robust legacy CV structure
        const legacyCVData: CVData = {
          personalInfo: {
            name: parsed.personalInfo?.name || '',
            title: parsed.personalInfo?.title || '',
            email: parsed.personalInfo?.email || '',
            phone: parsed.personalInfo?.phone || '',
            location: parsed.personalInfo?.location || '',
            summary: parsed.personalInfo?.summary || ''
          },
          experience: Array.isArray(parsed.experience) ? parsed.experience : [],
          education: Array.isArray(parsed.education) ? parsed.education : [],
          skills: Array.isArray(parsed.skills) ? parsed.skills : [],
          projects: Array.isArray(parsed.projects) ? parsed.projects : [],
          certifications: Array.isArray(parsed.certifications) ? parsed.certifications : [],
          languages: Array.isArray(parsed.languages) ? parsed.languages : [],
          awards: Array.isArray(parsed.awards) ? parsed.awards : [],
          publications: Array.isArray(parsed.publications) ? parsed.publications : [],
          volunteering: Array.isArray(parsed.volunteering) ? parsed.volunteering : [],
          links: Array.isArray(parsed.links) ? parsed.links : [],
          metadata: {
            template: parsed.metadata?.template || 'classic',
            accentColor: parsed.metadata?.accentColor || getActivePalette().primary,
            fontFamily: parsed.metadata?.fontFamily || 'serif',
            sectionOrder: parsed.metadata?.sectionOrder
          }
        }

        const legacyCV: CV = {
          id: 'migrated-legacy',
          title: legacyCVData.personalInfo.name ? `${legacyCVData.personalInfo.name}'s CV` : 'My First CV',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          data: legacyCVData
        }

        localStorage.setItem('ai-cvs', JSON.stringify([legacyCV]))
        // Remove legacy key to prevent repeating migration
        localStorage.removeItem('cv-data')
        return [legacyCV]
      }
    } catch (e) {
      console.error('Failed to migrate legacy single-CV data:', e)
    }
  }

  return []
}
