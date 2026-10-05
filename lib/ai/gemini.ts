import { GoogleGenAI } from '@google/genai'
import { env } from '@/lib/env'

export async function streamWithGemini(
  systemPrompt: string,
  userPrompt: string,
  onDelta: (delta: string) => void,
): Promise<string> {
  const client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY! })

  const response = await client.models.generateContentStream({
    model: 'gemini-2.0-flash',
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    config: {
      systemInstruction: systemPrompt,
      maxOutputTokens: 16000,
    },
  })

  let full = ''
  for await (const chunk of response) {
    const delta = chunk.text ?? ''
    if (delta) {
      full += delta
      onDelta(delta)
    }
  }
  return full
}
