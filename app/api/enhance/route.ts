import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createAnthropic } from '@ai-sdk/anthropic';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

type Provider = 'openai' | 'google' | 'anthropic';

const DEFAULT_MODEL_BY_PROVIDER: Record<Provider, string> = {
  openai: 'gpt-4o-mini',
  google: 'gemini-2.5-pro',
  anthropic: 'claude-sonnet-4-5-20250929',
};

function resolveProvider(value: unknown): Provider {
  if (value === 'google' || value === 'anthropic') return value;
  return 'openai';
}

function isDebugLoggingEnabled(value: unknown): boolean {
  return value === true || value === 'true';
}

export async function POST(req: Request) {
  try {
    const { prompt, type, provider, apiKey, model: requestedModel, debugLogging } = await req.json();
    const selectedProvider = resolveProvider(provider);
    const modelId = typeof requestedModel === 'string' && requestedModel.trim()
      ? requestedModel.trim()
      : DEFAULT_MODEL_BY_PROVIDER[selectedProvider];

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key is required. Please configure it in Settings.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let systemPrompt = "You are an expert resume writer.";
    if (type === 'summary') {
      systemPrompt += " Write a professional summary based on the provided notes. Make it concise, impactful, and written in the first person (implied, avoiding 'I' where possible). Output ONLY the summary text.";
    } else if (type === 'experience') {
      systemPrompt += " Rewrite the provided work experience into professional, impactful bullet points. Use strong action verbs. Output ONLY the bullet points, formatted with markdown bullets.";
    } else if (type === 'project') {
      systemPrompt += " Rewrite the provided project description into concise CV-ready bullet points. Emphasize ownership, technologies, and measurable impact. Output ONLY the bullet points, formatted with markdown bullets.";
    } else {
      systemPrompt += " Enhance the provided text to be more professional and suitable for a CV. Output ONLY the enhanced text.";
    }

    if (isDebugLoggingEnabled(debugLogging)) {
      console.info('[AI Debug] Enhance request', {
        provider: selectedProvider,
        model: modelId,
        type,
        system: systemPrompt,
        prompt,
      });
    }

    let model;
    if (selectedProvider === 'google') {
      const google = createGoogleGenerativeAI({ apiKey });
      model = google(modelId);
    } else if (selectedProvider === 'anthropic') {
      const anthropic = createAnthropic({ apiKey });
      model = anthropic(modelId);
    } else {
      const openai = createOpenAI({ apiKey });
      model = openai(modelId);
    }

    const result = streamText({
      model,
      system: systemPrompt,
      prompt,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Enhance API error:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate text' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
