import { CV } from '@/lib/types'
import getCVs from '@/lib/getCVs'

/**
 * Finds and returns a saved CV by its unique identifier.
 * 
 * @param {string} id - The unique identifier of the CV.
 * @returns {CV | null} The CV object if found, or null otherwise.
 */
export default function getCVById(id: string): CV | null {
  const cvs = getCVs()
  return cvs.find((cv) => cv.id === id) || null
}
