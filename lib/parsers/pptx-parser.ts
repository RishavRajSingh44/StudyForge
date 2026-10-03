import { cleanText, truncateChunk } from '@/lib/utils/chunk-text'
import type { ParsedChunk } from './pdf-parser'

export async function parsePptx(
  buffer: Buffer,
  isPastPaper = false,
): Promise<ParsedChunk[]> {
  const officeparser = await import('officeparser')

  const ast = await officeparser.parseOffice(buffer, {
    outputErrorToConsole: true,
  })

  // Convert the AST to plain text before using string operations.
  const { value: raw } = await (ast as typeof ast & {
    to: (format: 'text') => Promise<{ value: string }>
  }).to('text')

  const slides = raw
    .split(/\n{3,}|\f/)
    .filter((slide) => slide.trim().length > 0)

  return slides.map((slide, i) => {
    const cleaned = cleanText(truncateChunk(slide))
    const words = cleaned.split(/\s+/).filter(Boolean)
    return {
      chunkIndex: i,
      chunkType: 'slide' as const,
      content: cleaned,
      metadata: {
        has_image: cleaned.length < 80,
        is_past_paper: isPastPaper,
        word_count: words.length,
      },
    }
  })
}
