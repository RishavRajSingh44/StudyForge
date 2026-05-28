import { describe, it, expect } from 'vitest'
import { parseGenerationResponse } from './response-parser'

const minimalOutput = {
  metadata: {
    subject: 'CS',
    topic: 'Arrays',
    difficulty_level: 'medium',
    detected_exam_focus: [],
    retrieval_sources_used: [],
    high_weightage_topics: [],
    estimated_bloom_levels: [],
    confidence_score: 0.9,
  },
  notes: {
    title: 'Arrays',
    summary: 'Basic array concepts',
    learning_objectives: [],
    key_concepts: [],
    sections: [],
    revision_sheet: {
      formulae: [],
      definitions: [],
      one_liners: [],
      mnemonics: [],
      last_minute_revision: [],
    },
  },
  expected_questions: [],
  quiz: [],
}

describe('parseGenerationResponse', () => {
  it('parses clean JSON', () => {
    const result = parseGenerationResponse(JSON.stringify(minimalOutput))
    expect(result.metadata.subject).toBe('CS')
    expect(result.notes.title).toBe('Arrays')
  })

  it('strips markdown code fences', () => {
    const fenced = '```json\n' + JSON.stringify(minimalOutput) + '\n```'
    const result = parseGenerationResponse(fenced)
    expect(result.metadata.topic).toBe('Arrays')
  })

  it('strips markdown fences without language tag', () => {
    const fenced = '```\n' + JSON.stringify(minimalOutput) + '\n```'
    const result = parseGenerationResponse(fenced)
    expect(result.metadata.topic).toBe('Arrays')
  })

  it('strips <think> blocks from reasoning models', () => {
    const raw = '<think>\nsome internal reasoning\n</think>\n' + JSON.stringify(minimalOutput)
    const result = parseGenerationResponse(raw)
    expect(result.metadata.subject).toBe('CS')
  })

  it('strips multiple <think> blocks', () => {
    const raw =
      '<think>first</think>\n<think>second</think>\n' + JSON.stringify(minimalOutput)
    const result = parseGenerationResponse(raw)
    expect(result.notes.summary).toBe('Basic array concepts')
  })

  it('extracts JSON when surrounded by prose text', () => {
    const raw = 'Here is the output:\n' + JSON.stringify(minimalOutput) + '\nEnd of response.'
    const result = parseGenerationResponse(raw)
    expect(result.metadata.confidence_score).toBe(0.9)
  })

  it('repairs truncated JSON via jsonrepair', () => {
    // Missing closing braces — jsonrepair should close them
    const truncated = JSON.stringify(minimalOutput).slice(0, -10)
    const result = parseGenerationResponse(truncated)
    expect(result.metadata).toBeDefined()
  })

  it('handles extra whitespace and newlines', () => {
    const raw = '   \n\n' + JSON.stringify(minimalOutput) + '\n\n   '
    const result = parseGenerationResponse(raw)
    expect(result.quiz).toEqual([])
  })

  it('preserves arrays in parsed output', () => {
    const withData = {
      ...minimalOutput,
      metadata: {
        ...minimalOutput.metadata,
        detected_exam_focus: ['recursion', 'sorting'],
      },
    }
    const result = parseGenerationResponse(JSON.stringify(withData))
    expect(result.metadata.detected_exam_focus).toEqual(['recursion', 'sorting'])
  })

  it('handles think block combined with markdown fence', () => {
    const raw =
      '<think>reasoning</think>\n```json\n' + JSON.stringify(minimalOutput) + '\n```'
    const result = parseGenerationResponse(raw)
    expect(result.metadata.subject).toBe('CS')
  })
})
