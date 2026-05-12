import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { buildSystemPrompt, buildUserPrompt } from '@/lib/ai/prompts'
import { streamGeneration } from '@/lib/ai/provider'
import { parseGenerationResponse } from '@/lib/ai/response-parser'
import { selectChunksWithinBudget, estimateTokens } from '@/lib/utils/chunk-text'
import type { DocumentChunk } from '@/types/upload'
import type { SSEEvent } from '@/types/generation'

export const dynamic = 'force-dynamic'

const MAX_INPUT_TOKENS = 140000

function sseEvent(event: SSEEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`
}

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: SSEEvent) => {
        try {
          controller.enqueue(encoder.encode(sseEvent(event)))
        } catch {}
      }

      const supabase = createServiceClient()

      try {
        const { session_id } = await req.json()
        if (!session_id) throw new Error('session_id required')

        // Load session
        const { data: session, error: sessionErr } = await supabase
          .from('sessions')
          .select('*')
          .eq('id', session_id)
          .single()
        if (sessionErr || !session) throw new Error('Session not found')

        await supabase
          .from('sessions')
          .update({ status: 'generating', updated_at: new Date().toISOString() })
          .eq('id', session_id)

        // Load all chunks for this session
        send({ type: 'status', message: 'Loading course materials...' })
        const { data: uploads } = await supabase
          .from('uploads')
          .select('id')
          .eq('session_id', session_id)

        const uploadIds = (uploads ?? []).map((u: { id: string }) => u.id)
        let chunks: DocumentChunk[] = []

        if (uploadIds.length > 0) {
          const { data: chunkData } = await supabase
            .from('document_chunks')
            .select('*')
            .in('upload_id', uploadIds)
            .order('chunk_index', { ascending: true })
          chunks = (chunkData ?? []) as DocumentChunk[]
        }

        // Web search (Phase 2 — graceful skip if no API key)
        send({ type: 'status', message: 'Searching web for course information...' })
        const webResults: Array<{ query: string; results: Array<{ title: string; url: string; content: string }> }> = []

        if (process.env.TAVILY_API_KEY) {
          try {
            const queries = [
              `${session.course_name} ${session.university_name} syllabus`,
              `${session.course_name} ${session.university_name} exam format`,
              session.course_code
                ? `${session.course_code} ${session.university_name} lecture notes`
                : `${session.course_name} ${session.university_name} study guide`,
            ]

            const searchPromises = queries.map(async (query) => {
              const res = await fetch('https://api.tavily.com/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  api_key: process.env.TAVILY_API_KEY,
                  query,
                  max_results: 3,
                  include_raw_content: false,
                }),
              })
              if (!res.ok) return null
              const data = await res.json()
              return { query, results: (data.results ?? []).map((r: { title: string; url: string; content: string }) => ({
                title: r.title,
                url: r.url,
                content: r.content?.slice(0, 400) ?? '',
              }))}
            })

            const results = await Promise.allSettled(searchPromises)
            for (const r of results) {
              if (r.status === 'fulfilled' && r.value) {
                webResults.push(r.value)
                await supabase.from('web_search_results').insert({
                  session_id,
                  query: r.value.query,
                  provider: 'tavily',
                  results: r.value.results,
                })
              }
            }
          } catch {
            // Web search failure is non-fatal
          }
        }

        // Token budget management
        send({ type: 'status', message: 'Preparing AI generation...' })
        const systemPrompt = buildSystemPrompt()

        const scored = chunks.map((c, i) => ({
          content: c.content,
          chunkIndex: i,
          totalChunks: chunks.length,
          isPastPaper: !!c.metadata?.is_past_paper,
        }))

        const webTokens = estimateTokens(JSON.stringify(webResults))
        const systemTokens = estimateTokens(systemPrompt)
        const budgetForChunks = MAX_INPUT_TOKENS - systemTokens - webTokens - 2000
        const selected = selectChunksWithinBudget(scored, budgetForChunks)

        // Map selected back to original chunks
        const selectedChunks = chunks.filter((_, i) => selected.some((s) => s.chunkIndex === i))

        const userPrompt = buildUserPrompt({
          universityName: session.university_name,
          courseName: session.course_name,
          courseCode: session.course_code,
          webResults,
          chunks: selectedChunks,
        })

        // Stream AI generation
        send({ type: 'status', message: 'Generating study notes, questions, and quiz...' })

        const startTime = Date.now()
        let fullResponse = ''

        await streamGeneration(systemPrompt, userPrompt, (delta) => {
          fullResponse += delta
          send({ type: 'content', delta })
        })

        const generationTime = Date.now() - startTime

        // Parse and persist
        const parsed = parseGenerationResponse(fullResponse)

        await supabase
          .from('generated_notes')
          .insert({
            session_id,
            model_used: process.env.OLLAMA_MODEL ?? 'qwen2.5:14b',
            sections: parsed.notes.sections,
            summary: parsed.notes.summary,
            key_concepts: parsed.notes.key_concepts,
            generation_time_ms: generationTime,
          })
          .select('id')
          .single()

        if (parsed.expected_questions.length > 0) {
          await supabase.from('expected_questions').insert(
            parsed.expected_questions.map((q) => ({
              session_id,
              question_text: q.question,
              type: q.type,
              topic_tag: q.topic,
              difficulty: q.difficulty,
              model_answer: q.model_answer,
              source_hint: 'from_slides',
            })),
          )
        }

        if (parsed.quiz.length > 0) {
          const { data: quizRow } = await supabase
            .from('quizzes')
            .insert({
              session_id,
              title: `${session.course_name} Quiz`,
              total_questions: parsed.quiz.length,
            })
            .select('id')
            .single()

          if (quizRow) {
            await supabase.from('quiz_questions').insert(
              parsed.quiz.map((q, i) => ({
                quiz_id: quizRow.id,
                question_index: i,
                question_type: q.type,
                question_text: q.question,
                options: q.options ?? null,
                correct_answer: q.correct_answer,
                explanation: q.explanation,
                topic_tag: q.topic,
              })),
            )
          }
        }

        await supabase
          .from('sessions')
          .update({ status: 'complete', updated_at: new Date().toISOString() })
          .eq('id', session_id)

        send({ type: 'complete', sessionId: session_id })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Generation failed'
        send({ type: 'error', message: msg })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
