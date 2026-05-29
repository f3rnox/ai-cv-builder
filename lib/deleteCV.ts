import getCVs from '@/lib/getCVs'
import saveCVs from '@/lib/saveCVs'

/**
 * Deletes a CV by its unique identifier from the local storage list.
 * 
 * @param {string} id - The unique identifier of the CV to delete.
 * @returns {void}
 */
export default function deleteCV(id: string): void {
  const cvs = getCVs()
  const filtered = cvs.filter((cv) => cv.id !== id)
  saveCVs(filtered)
}
