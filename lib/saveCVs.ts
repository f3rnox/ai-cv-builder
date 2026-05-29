import { CV } from '@/lib/types'

/**
 * Persists the complete list of CVs to local storage.
 * 
 * @param {CV[]} cvs - The array of CVs to be saved.
 * @returns {void}
 */
export default function saveCVs(cvs: CV[]): void {
  if (globalThis.window === undefined) {
    return
  }

  try {
    localStorage.setItem('ai-cvs', JSON.stringify(cvs))
  } catch (e) {
    console.error('Failed to save CVs list to local storage:', e)
  }
}
