import { CVData, Education, Experience } from '@/lib/types'

export const maxDuration = 60

type Provider = 'openai' | 'google' | 'anthropic'

const DEFAULT_MODEL_BY_PROVIDER: Record<Provider, string> = {
  openai: 'gpt-4o-mini',
  google: 'gemini-2.5-pro',
  anthropic: 'claude-sonnet-4-5-20250929'
}

function isDebugLoggingEnabled(value: unknown): boolean {
  return value === true || value === 'true'
}

interface ParsedExperience {
  company?: string
  role?: string
  startDate?: string
  endDate?: string
  description?: string
}

interface ParsedEducation {
  school?: string
  degree?: string
  year?: string
}

interface ParsedCVPayload {
  personalInfo?: {
    name?: string
    title?: string
    email?: string
    phone?: string
    location?: string
    summary?: string
  }
  experience?: ParsedExperience[]
  education?: ParsedEducation[]
  skills?: string[]
}

const CV_EXTRACTION_PROMPT = [
  'Extract structured CV data from the uploaded PDF.',
  'Return only valid JSON. Do not wrap it in markdown.',
  'Do not invent missing facts. Use empty strings or empty arrays when information is absent.',
  '',
  'Required JSON shape:',
  '{',
  '  "personalInfo": { "name": "", "title": "", "email": "", "phone": "", "location": "", "summary": "" },',
  '  "experience": [{ "company": "", "role": "", "startDate": "", "endDate": "", "description": "" }],',
  '  "education": [{ "school": "", "degree": "", "year": "" }],',
  '  "skills": [""]',
  '}',
  '',
  'For experience descriptions, keep concise achievement-oriented bullet lines separated by newlines.',
  'For summary, write a concise professional summary based only on the CV.'
].join('\n')

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function parseModelJson(text: string): ParsedCVPayload {
  const trimmed = text.trim()
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  const jsonText = fencedMatch?.[1] || trimmed
  return JSON.parse(jsonText) as ParsedCVPayload
}

function normalizeParsedCV(payload: ParsedCVPayload): Omit<CVData, 'metadata'> {
  const now = Date.now()
  const experience: Experience[] = Array.isArray(payload.experience)
    ? payload.experience.map((item, index) => ({
        id: `${now}-exp-${index}`,
        company: asString(item.company),
        role: asString(item.role),
        startDate: asString(item.startDate),
        endDate: asString(item.endDate),
        description: asString(item.description)
      })).filter((item) => item.company || item.role || item.description)
    : []

  const education: Education[] = Array.isArray(payload.education)
    ? payload.education.map((item, index) => ({
        id: `${now}-edu-${index}`,
        school: asString(item.school),
        degree: asString(item.degree),
        year: asString(item.year)
      })).filter((item) => item.school || item.degree || item.year)
    : []

  const skills = Array.isArray(payload.skills)
    ? payload.skills.map((skill) => asString(skill)).filter(Boolean)
    : []

  return {
    personalInfo: {
      name: asString(payload.personalInfo?.name),
      title: asString(payload.personalInfo?.title),
      email: asString(payload.personalInfo?.email),
      phone: asString(payload.personalInfo?.phone),
      location: asString(payload.personalInfo?.location),
      summary: asString(payload.personalInfo?.summary)
    },
    experience: experience.length > 0 ? experience : [{
      id: `${now}-exp-empty`,
      company: '',
      role: '',
      startDate: '',
      endDate: '',
      description: ''
    }],
    education: education.length > 0 ? education : [{
      id: `${now}-edu-empty`,
      school: '',
      degree: '',
      year: ''
    }],
    skills
  }
}

function getOpenAIText(payload: unknown): string {
  if (typeof payload !== 'object' || payload === null) return ''

  const response = payload as {
    output_text?: unknown
    output?: Array<{
      content?: Array<{
        text?: unknown
      }>
    }>
  }

  if (typeof response.output_text === 'string') {
    return response.output_text
  }

  return response.output
    ?.flatMap((item) => item.content || [])
    .map((content) => content.text)
    .filter((text): text is string => typeof text === 'string')
    .join('\n') || ''
}

function getGoogleText(payload: unknown): string {
  if (typeof payload !== 'object' || payload === null) return ''

  const response = payload as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          text?: unknown
        }>
      }
    }>
  }

  return response.candidates
    ?.flatMap((candidate) => candidate.content?.parts || [])
    .map((part) => part.text)
    .filter((text): text is string => typeof text === 'string')
    .join('\n') || ''
}

function getAnthropicText(payload: unknown): string {
  if (typeof payload !== 'object' || payload === null) return ''

  const response = payload as {
    content?: Array<{
      type?: unknown
      text?: unknown
    }>
  }

  return response.content
    ?.filter((content) => content.type === 'text')
    .map((content) => content.text)
    .filter((text): text is string => typeof text === 'string')
    .join('\n') || ''
}

async function parseWithOpenAI(base64Pdf: string, filename: string, apiKey: string, model: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      input: [{
        role: 'user',
        content: [
          {
            type: 'input_file',
            filename,
            file_data: `data:application/pdf;base64,${base64Pdf}`
          },
          {
            type: 'input_text',
            text: CV_EXTRACTION_PROMPT
          }
        ]
      }]
    })
  })

  const payload = await response.json()

  if (!response.ok) {
    const message = typeof payload?.error?.message === 'string'
      ? payload.error.message
      : 'OpenAI failed to parse the PDF.'
    throw new Error(message)
  }

  return getOpenAIText(payload)
}

async function parseWithGoogle(base64Pdf: string, apiKey: string, model: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [
            {
              inline_data: {
                mime_type: 'application/pdf',
                data: base64Pdf
              }
            },
            {
              text: CV_EXTRACTION_PROMPT
            }
          ]
        }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1
        }
      })
    }
  )

  const payload = await response.json()

  if (!response.ok) {
    const message = typeof payload?.error?.message === 'string'
      ? payload.error.message
      : 'Google AI failed to parse the PDF.'
    throw new Error(message)
  }

  return getGoogleText(payload)
}

async function parseWithAnthropic(base64Pdf: string, apiKey: string, model: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      max_tokens: 4000,
      system: 'You extract structured CV data and return only valid JSON.',
      messages: [{
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: base64Pdf
            }
          },
          {
            type: 'text',
            text: CV_EXTRACTION_PROMPT
          }
        ]
      }]
    })
  })

  const payload = await response.json()

  if (!response.ok) {
    const message = typeof payload?.error?.message === 'string'
      ? payload.error.message
      : 'Anthropic failed to parse the PDF.'
    throw new Error(message)
  }

  return getAnthropicText(payload)
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file')
    const provider = formData.get('provider')
    const apiKey = formData.get('apiKey')
    const requestedModel = formData.get('model')
    const debugLogging = formData.get('debugLogging')

    if (!(file instanceof File)) {
      return Response.json({ error: 'A PDF file is required.' }, { status: 400 })
    }

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return Response.json({ error: 'Please upload a valid PDF file.' }, { status: 400 })
    }

    if (file.size > 20 * 1024 * 1024) {
      return Response.json({ error: 'PDF files must be 20MB or smaller.' }, { status: 400 })
    }

    if (typeof apiKey !== 'string' || !apiKey.trim()) {
      return Response.json({ error: 'API key is required. Please configure it in Settings.' }, { status: 400 })
    }

    const selectedProvider: Provider = provider === 'google'
      ? 'google'
      : provider === 'anthropic'
        ? 'anthropic'
        : 'openai'
    const model = typeof requestedModel === 'string' && requestedModel.trim()
      ? requestedModel.trim()
      : DEFAULT_MODEL_BY_PROVIDER[selectedProvider]
    const base64Pdf = Buffer.from(await file.arrayBuffer()).toString('base64')
    const filename = file.name || 'cv.pdf'

    if (isDebugLoggingEnabled(debugLogging)) {
      console.info('[AI Debug] PDF parse request', {
        provider: selectedProvider,
        model,
        filename,
        fileSizeBytes: file.size,
        fileType: file.type,
        prompt: CV_EXTRACTION_PROMPT,
        document: '[PDF bytes omitted from debug log]'
      })
    }

    const text = selectedProvider === 'google'
      ? await parseWithGoogle(base64Pdf, apiKey.trim(), model)
      : selectedProvider === 'anthropic'
        ? await parseWithAnthropic(base64Pdf, apiKey.trim(), model)
        : await parseWithOpenAI(base64Pdf, filename, apiKey.trim(), model)

    if (!text.trim()) {
      return Response.json({ error: 'The model did not return parsable CV data.' }, { status: 502 })
    }

    const parsed = normalizeParsedCV(parseModelJson(text))
    return Response.json({ data: parsed })
  } catch (error) {
    console.error('Parse CV PDF API error:', error)
    return Response.json({
      error: error instanceof Error ? error.message : 'Failed to parse the PDF CV.'
    }, { status: 500 })
  }
}
