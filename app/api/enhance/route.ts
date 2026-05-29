import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { prompt, type, provider, apiKey } = await req.json();

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
    } else {
      systemPrompt += " Enhance the provided text to be more professional and suitable for a CV. Output ONLY the enhanced text.";
    }

    let model;
    if (provider === 'google') {
      const google = createGoogleGenerativeAI({ apiKey });
      model = google('gemini-2.5-pro');
    } else {
      const openai = createOpenAI({ apiKey });
      model = openai('gpt-4o-mini');
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
