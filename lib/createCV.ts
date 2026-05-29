import { CV, CVData } from '@/lib/types'
import saveCV from '@/lib/saveCV'
import { createEmptyCVData } from '@/lib/cvDefaults'

/**
 * Creates and saves a new CV with the given title and returns it.
 * 
 * @param {string} title - The title/name of the CV (e.g., 'Software Engineer CV').
 * @param {Partial<CVData>} [customData] - Optional initial data to pre-populate the CV.
 * @returns {CV} The newly created CV object.
 */
export default function createCV(title: string, customData?: Partial<CVData>): CV {
  const id = Date.now().toString()
  const newCV: CV = {
    id,
    title,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    data: createEmptyCVData(customData)
  }

  saveCV(newCV)
  return newCV
}
