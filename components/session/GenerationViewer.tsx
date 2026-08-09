'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { motion, AnimatePresence } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ChevronRight, AlertCircle, RefreshCw, Download } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { useGenerationStore } from '@/lib/stores/generation-store'
import { parseGenerationResponse } from '@/lib/ai/response-parser'
import { downloadNotesPDF, downloadQuestionsPDF, downloadQuizPDF } from '@/lib/utils/pdf-export'
import type { NoteSection, ExpectedQuestion, QuizQuestion } from '@/types/generation'

interface Props {
  sessionId: string
  initialStatus: string
}

export default function GenerationViewer({ sessionId, initialStatus }: Props) {
  const {
    status, statusMessage, progress, rawBuffer,
    loadedSessionId, sections, expectedQuestions, quizTitle, quizQuestions,
    error, setStatus, setLoadedSessionId, appendDelta, setSections,
    setExpectedQuestions, setQuiz, setError, reset,
  } = useGenerationStore()

  const [activeSection, setActiveSection] = useState<string | null>(null)
  const hasStarted = useRef(false)

  useEffect(() => {
    // Already loaded this session in the store — back navigation, no re-fetch needed
    if (loadedSessionId === sessionId && status === 'complete') return

    if (hasStarted.current) return
    hasStarted.current = true
    reset()

    // If already generated, load from DB instead of re-running generation
    if (initialStatus === 'complete') {
      fetch(`/api/session/${sessionId}/results`)
        .then((r) => r.json())
        .then((d) => {
          const hasSections = Array.isArray(d.sections) && d.sections.length > 0
          if (hasSections) {
            setSections(d.sections)
            if (Array.isArray(d.expectedQuestions)) setExpectedQuestions(d.expectedQuestions)
            if (Array.isArray(d.quiz)) setQuiz(d.quizTitle ?? 'Quiz', d.quiz)
            setLoadedSessionId(sessionId)
            setStatus('complete', 'Done!', 100)
          } else {
            startGeneration()
          }
        })
        .catch(() => startGeneration())
      return
    }

    startGeneration()

    function startGeneration() {
      fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      }).then((res) => {
        if (!res.ok || !res.body) {
          setError('Failed to start generation')
          return
        }
        setStatus('generating', 'Starting generation...', 5)
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buf = ''

        const read = async () => {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            buf += decoder.decode(value, { stream: true })
            const lines = buf.split('\n')
            buf = lines.pop() ?? ''
            for (const line of lines) {
              if (!line.startsWith('data: ')) continue
              try {
                const event = JSON.parse(line.slice(6))
                if (event.type === 'status') setStatus('generating', event.message, event.progress ?? 0)
                else if (event.type === 'content') appendDelta(event.delta)
                else if (event.type === 'complete') setStatus('complete', 'Done!', 100)
                else if (event.type === 'error') setError(event.message)
              } catch {}
            }
          }
        }
        read()
      }).catch(() => setError('Network error'))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  // Parse all content at once only when generation is complete
  useEffect(() => {
    if (status !== 'complete' || !rawBuffer) return
    try {
      const parsed = parseGenerationResponse(rawBuffer)
      if (parsed.notes?.sections) setSections(parsed.notes.sections)
      if (parsed.expected_questions) setExpectedQuestions(parsed.expected_questions)
      if (parsed.quiz) setQuiz('Quiz', parsed.quiz)
      setLoadedSessionId(sessionId)
    } catch {
      setError('Failed to parse AI response. Please try again.')
    }
  }, [status]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 px-6 h-14 flex items-center justify-between shrink-0">
        <Link href="/" className="font-semibold text-base tracking-tight">
          Study<span className="text-orange-500">Forge</span>
        </Link>
        <div className="flex items-center gap-2">
          {status === 'generating' && (
            <span className="text-sm text-gray-500 dark:text-gray-400 tabular-nums">
              {progress}%
            </span>
          )}
          <ThemeToggle />
        </div>
      </header>

      {/* Progress bar — full width, sits just below header */}
      {status === 'generating' && (
        <div className="h-1 w-full bg-gray-100 dark:bg-gray-800 shrink-0">
          <div
            className="h-full bg-orange-500 transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Loading overlay while AI is generating */}
      {status === 'generating' && (
        <div className="flex flex-col items-center justify-center flex-1 gap-6 px-6">
          <div className="w-full max-w-sm">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600 dark:text-gray-400">{statusMessage}</span>
              <span className="text-orange-500 font-medium tabular-nums">{progress}%</span>
            </div>
            <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-600">
            Your topics, expected questions, and quiz are being generated — this takes 2–5 minutes.
          </p>
        </div>
      )}

      {/* Error state */}
      {status !== 'generating' && error && (
        <div className="flex flex-col items-center justify-center flex-1 gap-4">
          <AlertCircle className="w-8 h-8 text-red-400" />
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try again
          </Button>
        </div>
      )}

      {/* Content — only shown after generation completes */}
      {status === 'complete' && !error && (
        <div className="flex flex-1 overflow-hidden">
          {sections.length > 0 && (
            <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-gray-200 dark:border-gray-800 py-4 overflow-y-auto">
              <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Contents</p>
              {sections.map((s, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setActiveSection(String(i))
                    document.getElementById(`section-${i}`)?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className={`text-left px-4 py-1.5 text-sm rounded-lg mx-2 transition-colors ${
                    activeSection === String(i)
                      ? 'bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400'
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  {s.title}
                </button>
              ))}
            </aside>
          )}

          <main className="flex-1 overflow-y-auto">
            <Tabs defaultValue="notes" className="h-full flex flex-col">
              <div className="border-b border-gray-200 dark:border-gray-800 px-6">
                <TabsList className="h-12 bg-transparent gap-1">
                  <TabsTrigger value="notes" className="data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none">
                    Topics
                  </TabsTrigger>
                  <TabsTrigger value="questions" className="data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none">
                    Expected Questions
                    {expectedQuestions.length > 0 && (
                      <Badge variant="secondary" className="ml-1.5 text-xs">{expectedQuestions.length}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="quiz" className="data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none">
                    Quiz
                    {quizQuestions.length > 0 && (
                      <Badge variant="secondary" className="ml-1.5 text-xs">{quizQuestions.length}</Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="notes" className="flex-1 overflow-y-auto px-6 py-6">
                <div className="max-w-3xl mx-auto">
                  <NotesTab sections={sections} isGenerating={false} />
                </div>
              </TabsContent>

              <TabsContent value="questions" className="flex-1 overflow-y-auto px-6 py-6">
                <div className="max-w-3xl mx-auto">
                  <QuestionsTab questions={expectedQuestions} isGenerating={false} />
                </div>
              </TabsContent>

              <TabsContent value="quiz" className="flex-1 overflow-y-auto px-6 py-6">
                <div className="max-w-3xl mx-auto">
                  <QuizTab
                    title={quizTitle}
                    questions={quizQuestions}
                    sessionId={sessionId}
                    isGenerating={false}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      )}

      {/* Idle state — shouldn't normally be visible */}
      {status === 'idle' && !error && (
        <div className="flex items-center justify-center flex-1">
          <p className="text-gray-400 text-sm">Preparing generation…</p>
        </div>
      )}
    </div>
  )
}

function NotesTab({ sections, isGenerating }: { sections: NoteSection[]; isGenerating: boolean }) {
  if (!sections.length) {
    return (
      <div className="space-y-4">
        {isGenerating ? (
          <>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </>
        ) : (
          <p className="text-gray-400 text-sm">Topics will appear here as they generate.</p>
        )}
      </div>
    )
  }

  return (
    <AnimatePresence>
      <div className="flex justify-end mb-4">
        <Button
          size="sm"
          variant="outline"
          onClick={() => downloadNotesPDF(sections)}
        >
          <Download className="w-4 h-4 mr-1.5" />
          Download Topics
        </Button>
      </div>
      {sections.map((s, i) => (
        <motion.div
          key={i}
          id={`section-${i}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-3">{s.title}</h2>
          <div className="prose prose-sm prose-gray dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{s.content}</ReactMarkdown>
          </div>
          {Array.isArray(s.exam_tips) && s.exam_tips.length > 0 && (
            <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-100 dark:border-orange-900/30">
              <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 mb-1">Exam Tips</p>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1 list-disc list-inside">
                {s.exam_tips.map((tip, j) => <li key={j}>{tip}</li>)}
              </ul>
            </div>
          )}
        </motion.div>
      ))}
    </AnimatePresence>
  )
}

const DIFFICULTY_COLOR: Record<string, string> = {
  easy: 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-400',
  hard: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400',
}

function QuestionsTab({ questions, isGenerating }: { questions: ExpectedQuestion[]; isGenerating: boolean }) {
  const [open, setOpen] = useState<string | null>(null)

  if (!questions.length) {
    return (
      <div className="space-y-3">
        {isGenerating ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)
        ) : (
          <p className="text-gray-400 text-sm">Expected questions will appear here.</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="outline"
          onClick={() => downloadQuestionsPDF(questions)}
        >
          <Download className="w-4 h-4 mr-1.5" />
          Download Questions
        </Button>
      </div>
      {questions.map((q, i) => (
        <div key={i} className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <button
            onClick={() => setOpen(open === String(i) ? null : String(i))}
            className="w-full flex items-start justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
          >
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-relaxed">{q.question}</span>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DIFFICULTY_COLOR[q.difficulty] ?? ''}`}>
                {q.difficulty}
              </span>
              <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${open === String(i) ? 'rotate-90' : ''}`} />
            </div>
          </button>
          {open === String(i) && (
            <div className="px-4 pb-4 text-sm text-gray-600 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800 pt-3">
              <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Model answer:</p>
              <p className="leading-relaxed">{q.model_answer}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function QuizTab({
  title, questions, sessionId, isGenerating,
}: {
  title: string; questions: QuizQuestion[]; sessionId: string; isGenerating: boolean
}) {
  const count = questions.length
  if (!count) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        {isGenerating ? (
          <>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-56" />
          </>
        ) : (
          <p className="text-gray-400 text-sm">Quiz will appear here once generation completes.</p>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center py-12 gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center text-2xl">
        📝
      </div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50">{title}</h2>
      <p className="text-gray-500 dark:text-gray-400">{count} questions · test your knowledge</p>
      <div className="flex gap-3 mt-2">
        <Link href={`/quiz/${sessionId}`}>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white">
            Start Quiz →
          </Button>
        </Link>
        <Button
          variant="outline"
          onClick={() => downloadQuizPDF(title, questions)}
        >
          <Download className="w-4 h-4 mr-1.5" />
          Download Quiz
        </Button>
      </div>
    </div>
  )
}
