import { CV } from '@/lib/types'
import getCVs from '@/lib/getCVs'
import saveCVs from '@/lib/saveCVs'

/**
 * Saves or updates a single CV in the saved CVs list in local storage.
 * 
 * @param {CV} cv - The CV object to update or insert.
 * @returns {void}
 */
export default function saveCV(cv: CV): void {
  const cvs = getCVs()
  const index = cvs.findIndex((item) => item.id === cv.id)

  const updatedCV: CV = {
    ...cv,
    updatedAt: new Date().toISOString()
  }

  if (index >= 0) {
    cvs[index] = updatedCV
  } else {
    cvs.push(updatedCV)
  }

  saveCVs(cvs)
}
