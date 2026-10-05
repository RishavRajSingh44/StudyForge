import { env } from '@/lib/env'

export async function streamGeneration(
  systemPrompt: string,
  userPrompt: string,
  onDelta: (delta: string) => void,
): Promise<string> {
  // Universal OpenAI-compatible provider (e.g. Groq) takes top priority when configured
  if (env.AI_API_KEY && env.AI_MODEL) {
    try {
      const { streamWithUniversal } = await import('./universal')
      return await streamWithUniversal(systemPrompt, userPrompt, onDelta)
    } catch (universalErr) {
      console.warn('[provider] Universal provider failed, trying fallbacks:', (universalErr as Error).message)
    }
  }

  // OpenAI takes priority as the default provider
  if (env.OPENAI_API_KEY) {
    try {
      const { streamWithOpenAI } = await import('./openai')
      return await streamWithOpenAI(systemPrompt, userPrompt, onDelta)
    } catch (openaiErr) {
      console.warn('[provider] OpenAI failed, trying fallbacks:', (openaiErr as Error).message)
    }
  }

  // Ollama (local) — free, no quota
  try {
    const { streamWithOllama } = await import('./ollama')
    return await streamWithOllama(systemPrompt, userPrompt, onDelta)
  } catch (ollamaErr) {
    console.warn('[provider] Ollama unavailable, trying cloud fallbacks:', (ollamaErr as Error).message)
  }

  if (env.GEMINI_API_KEY) {
    try {
      const { streamWithGemini } = await import('./gemini')
      return await streamWithGemini(systemPrompt, userPrompt, onDelta)
    } catch (geminiErr) {
      console.warn('[provider] Gemini failed, trying next fallback:', (geminiErr as Error).message)
    }
  }

  if (env.ANTHROPIC_API_KEY) {
    try {
      const { streamWithClaude } = await import('./claude')
      return await streamWithClaude(systemPrompt, userPrompt, onDelta)
    } catch (claudeErr) {
      console.warn('[provider] Claude failed, trying next fallback:', (claudeErr as Error).message)
    }
  }

  throw new Error('No AI provider available. Configure at least one of: AI_API_KEY+AI_MODEL, OPENAI_API_KEY, OLLAMA, GEMINI_API_KEY, ANTHROPIC_API_KEY')
}
