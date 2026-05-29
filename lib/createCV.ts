import { CV, CVData } from '@/lib/types'
import saveCV from '@/lib/saveCV'
import { getActivePalette } from '@/lib/displaySettings'

function getInitialCVData(): CVData {
  return {
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
    metadata: {
      template: 'classic',
      accentColor: getActivePalette().primary,
      fontFamily: 'sans'
    }
  }
}

/**
 * Creates and saves a new CV with the given title and returns it.
 * 
 * @param {string} title - The title/name of the CV (e.g., 'Software Engineer CV').
 * @param {Partial<CVData>} [customData] - Optional initial data to pre-populate the CV.
 * @returns {CV} The newly created CV object.
 */
export default function createCV(title: string, customData?: Partial<CVData>): CV {
  const id = Date.now().toString()
  const initialCVData = getInitialCVData()
  const initialMetadata = initialCVData.metadata!
  const customMetadata = customData?.metadata
  const newCV: CV = {
    id,
    title,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    data: {
      ...initialCVData,
      ...customData,
      metadata: {
        template: customMetadata?.template || initialMetadata.template,
        accentColor: customMetadata?.accentColor || initialMetadata.accentColor,
        fontFamily: customMetadata?.fontFamily || initialMetadata.fontFamily
      }
    }
  }

  saveCV(newCV)
  return newCV
}
