'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Upload, X, FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { useAnonymousSession } from '@/lib/hooks/useAnonymousSession'

const schema = z.object({
  university_name: z.string().min(2, 'Enter your university name'),
  course_name: z.string().min(2, 'Enter the course name'),
  course_code: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

const ACCEPTED = ['.pdf', '.pptx', '.ppt', '.docx']
const MAX_SIZE = 50 * 1024 * 1024

export default function CreatePage() {
  const router = useRouter()
  const anonToken = useAnonymousSession()

  const [files, setFiles] = useState<File[]>([])
  const [pastFiles, setPastFiles] = useState<File[]>([])
  const [includePast, setIncludePast] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const addFiles = useCallback((incoming: FileList | null, target: 'slides' | 'past') => {
    if (!incoming) return
    const valid = Array.from(incoming).filter((f) => {
      const ext = '.' + f.name.split('.').pop()?.toLowerCase()
      return ACCEPTED.includes(ext) && f.size <= MAX_SIZE
    })
    if (target === 'slides') setFiles((prev) => [...prev, ...valid].slice(0, 20))
    else setPastFiles((prev) => [...prev, ...valid].slice(0, 20))
  }, [])

  const onSubmit = async (values: FormValues) => {
    if (!anonToken) return
    if (!files.length) { setError('Add at least one lecture file'); return }
    setError(null)
    setUploading(true)
    setProgress(10)

    try {
      // 1. Create session
      const sessionRes = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, anon_token: anonToken }),
      })
      const { session_id, error: sErr } = await sessionRes.json()
      if (sErr) throw new Error(sErr)
      setProgress(25)

      // 2. Upload slides
      const fd = new FormData()
      fd.append('session_id', session_id)
      fd.append('is_past_paper', 'false')
      files.forEach((f) => fd.append('files', f))
      const upRes = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!upRes.ok) throw new Error('Upload failed')
      setProgress(60)

      // 3. Upload past papers if any
      if (includePast && pastFiles.length > 0) {
        const fd2 = new FormData()
        fd2.append('session_id', session_id)
        fd2.append('is_past_paper', 'true')
        pastFiles.forEach((f) => fd2.append('files', f))
        await fetch('/api/upload', { method: 'POST', body: fd2 })
      }
      setProgress(80)

      // Redirect to session page — generation starts there
      router.push(`/session/${session_id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setUploading(false)
      setProgress(0)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4">
      <div className="max-w-xl mx-auto">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="font-semibold text-xl tracking-tight">
            Study<span className="text-orange-500">Forge</span>
          </Link>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create your study pack</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* University */}
            <div className="space-y-1.5">
              <Label htmlFor="university_name">University / College</Label>
              <Input
                id="university_name"
                placeholder="e.g. MIT, Oxford, IIT Delhi"
                {...register('university_name')}
              />
              {errors.university_name && (
                <p className="text-xs text-red-500">{errors.university_name.message}</p>
              )}
            </div>

            {/* Course name */}
            <div className="space-y-1.5">
              <Label htmlFor="course_name">Course Name</Label>
              <Input
                id="course_name"
                placeholder="e.g. Data Structures and Algorithms"
                {...register('course_name')}
              />
              {errors.course_name && (
                <p className="text-xs text-red-500">{errors.course_name.message}</p>
              )}
            </div>

            {/* Course code */}
            <div className="space-y-1.5">
              <Label htmlFor="course_code">
                Course Code <span className="text-gray-400 font-normal">(optional)</span>
              </Label>
              <Input
                id="course_code"
                placeholder="e.g. CS301"
                {...register('course_code')}
              />
            </div>

            {/* Slide files */}
            <div className="space-y-1.5">
              <Label>Lecture Slides</Label>
              <Dropzone
                files={files}
                onAdd={(fl) => addFiles(fl, 'slides')}
                onRemove={(i) => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                label="Drop PDF, PPTX, or DOCX files here"
              />
            </div>

            {/* Past papers toggle */}
            <div>
              <button
                type="button"
                onClick={() => setIncludePast((v) => !v)}
                className="text-sm text-orange-500 hover:text-orange-600 font-medium"
              >
                {includePast ? '− Remove past papers' : '+ Include past exam papers (optional)'}
              </button>

              {includePast && (
                <div className="mt-3 space-y-1.5">
                  <Label>Past Exam Papers</Label>
                  <Dropzone
                    files={pastFiles}
                    onAdd={(fl) => addFiles(fl, 'past')}
                    onRemove={(i) => setPastFiles((prev) => prev.filter((_, idx) => idx !== i))}
                    label="Drop past paper PDFs here"
                  />
                </div>
              )}
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            {uploading && <Progress value={progress} className="h-1.5" />}

            <Button
              type="submit"
              disabled={uploading || !anonToken}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              size="lg"
            >
              {uploading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading & processing…</>
              ) : (
                'Generate my study pack →'
              )}
            </Button>
          </form>
        </div>
      </div>
    </main>
  )
}

function Dropzone({
  files,
  onAdd,
  onRemove,
  label,
}: {
  files: File[]
  onAdd: (fl: FileList) => void
  onRemove: (i: number) => void
  label: string
}) {
  const [drag, setDrag] = useState(false)

  return (
    <div className="space-y-2">
      <label
        className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl px-4 py-6 cursor-pointer transition-colors ${
          drag
            ? 'border-orange-400 bg-orange-50 dark:bg-orange-950/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); onAdd(e.dataTransfer.files) }}
      >
        <Upload className="w-5 h-5 text-gray-400 mb-2" />
        <span className="text-sm text-gray-500 dark:text-gray-400 text-center">{label}</span>
        <span className="text-xs text-gray-400 mt-1">.pdf .pptx .ppt .docx · max 50 MB</span>
        <input
          type="file"
          multiple
          accept=".pdf,.pptx,.ppt,.docx"
          className="hidden"
          onChange={(e) => e.target.files && onAdd(e.target.files)}
        />
      </label>

      {files.length > 0 && (
        <ul className="space-y-1">
          {files.map((f, i) => (
            <li key={i} className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm">
              <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300 truncate">
                <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="truncate">{f.name}</span>
              </span>
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="text-gray-400 hover:text-gray-600 ml-2 shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
