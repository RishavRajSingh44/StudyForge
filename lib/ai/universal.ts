import OpenAI from 'openai'
import { env } from '@/lib/env'

export async function streamWithUniversal(
  systemPrompt: string,
  userPrompt: string,
  onDelta: (delta: string) => void,
): Promise<string> {
  if (!env.AI_MODEL) {
    throw new Error('AI_MODEL is not configured')
  }

  const client = new OpenAI({
    apiKey: env.AI_API_KEY,
    baseURL: env.AI_BASE_URL,
  })
  const stream = await client.chat.completions.create({
    model: env.AI_MODEL,
    max_tokens: 16000,
    stream: true,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  })

  let full = ''
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content ?? ''
    if (delta) {
      full += delta
      onDelta(delta)
    }
  }
  return full
}
