'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, ChevronRight, ChevronLeft } from 'lucide-react'
import { useQuizStore } from '@/lib/stores/quiz-store'

interface QuizQuestion {
  id: string
  question_index: number
  question_type: 'mcq' | 'short_answer'
  question_text: string
  options?: string[]
  correct_answer: string
  explanation: string
  topic_tag: string
}

interface Quiz {
  id: string
  title: string
  total_questions: number
  quiz_questions: QuizQuestion[]
}

export default function QuizPage() {
  const params = useParams<{ id: string }>()
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [revealed, setRevealed] = useState<Record<number, boolean>>({})

  const { currentIndex, answers, submitted, score, setAnswer, nextQuestion, prevQuestion, submit, reset } =
    useQuizStore()

  useEffect(() => {
    reset()
    fetch(`/api/quiz/${params.id}`)
      .then((r) => r.json())
      .then((d) => { setQuiz(d); setLoading(false) })
  }, [params.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <div className="flex items-center justify-center h-screen text-gray-400">Loading quiz…</div>
  if (!quiz || !quiz.quiz_questions) return <div className="flex items-center justify-center h-screen text-red-400">Quiz not found</div>

  const questions = quiz.quiz_questions.sort((a, b) => a.question_index - b.question_index)
  const current = questions[currentIndex]
  const total = questions.length
  const isLast = currentIndex === total - 1

  const handleSubmit = () => {
    let s = 0
    for (const q of questions) {
      const userAnswer = (answers[q.id] ?? '').trim().toUpperCase()
      const correctAnswer = q.correct_answer.trim().toUpperCase()
      if (userAnswer === correctAnswer) s++
    }
    submit(s)
  }

  if (submitted && score !== null) {
    const pct = Math.round((score / total) * 100)
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 max-w-md w-full text-center shadow-sm">
          <div className="text-5xl mb-4">{pct >= 70 ? '🎉' : '📚'}</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-1">
            {score} / {total} correct
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{pct}% — {pct >= 80 ? 'Excellent!' : pct >= 60 ? 'Good effort!' : 'Keep studying!'}</p>
          <div className="mb-6 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => { reset(); setRevealed({}) }}>Retry</Button>
            <a href="/create">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white">New study pack</Button>
            </a>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Link href="/" className="font-semibold text-base tracking-tight">
            Study<span className="text-orange-500">Forge</span>
          </Link>
          <span className="text-sm text-gray-400">{currentIndex + 1} / {total}</span>
        </div>

        <Progress value={((currentIndex + 1) / total) * 100} className="h-1.5 mb-6" />

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
          {/* Topic tag */}
          {current.topic_tag && (
            <Badge variant="secondary" className="mb-3 text-xs">{current.topic_tag}</Badge>
          )}

          <p className="text-base font-medium text-gray-900 dark:text-gray-50 mb-5 leading-relaxed">
            {current.question_text}
          </p>

          {/* MCQ options */}
          {current.question_type === 'mcq' && current.options && (
            <div className="space-y-2">
              {current.options.map((opt) => {
                const letter = opt.match(/^([A-D])[.)]\s/i)?.[1]?.toUpperCase() ?? opt
                const selected = answers[current.id] === letter
                const correctNorm = current.correct_answer.trim().toUpperCase()
                const isCorrect = letter === correctNorm ||
                  opt.trim().toUpperCase() === correctNorm ||
                  opt.trim().toUpperCase().startsWith(correctNorm + '.') ||
                  opt.trim().toUpperCase().startsWith(correctNorm + ')')
                const showResult = revealed[currentIndex]

                return (
                  <button
                    key={opt}
                    onClick={() => {
                      if (!revealed[currentIndex]) {
                        setAnswer(current.id, letter)
                        setRevealed((r) => ({ ...r, [currentIndex]: true }))
                      }
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                      showResult
                        ? isCorrect
                          ? 'border-green-400 bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-300'
                          : selected
                            ? 'border-red-400 bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-300'
                            : 'border-gray-200 dark:border-gray-700 opacity-50'
                        : selected
                          ? 'border-orange-400 bg-orange-50 dark:bg-orange-950/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {showResult && (isCorrect ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0" /> : selected ? <XCircle className="w-4 h-4 text-red-500 shrink-0" /> : null)}
                      {opt}
                    </span>
                  </button>
                )
              })}

              {revealed[currentIndex] && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 px-1">{current.explanation}</p>
              )}
            </div>
          )}

          {/* Short answer */}
          {current.question_type === 'short_answer' && (
            <div className="space-y-3">
              <textarea
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
                rows={3}
                placeholder="Type your answer…"
                value={answers[current.id] ?? ''}
                onChange={(e) => setAnswer(current.id, e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={currentIndex === 0}
            onClick={prevQuestion}
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>

          {isLast ? (
            <Button
              size="sm"
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={handleSubmit}
            >
              Submit Quiz
            </Button>
          ) : (
            <Button
              size="sm"
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={nextQuestion}
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </main>
  )
}
