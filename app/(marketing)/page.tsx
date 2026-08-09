import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { BookOpen, Globe, Zap, CheckCircle } from 'lucide-react'

const features = [
  {
    icon: BookOpen,
    title: 'Parse Your Slides',
    description: 'Upload PDF, PPTX, or DOCX lecture files. We extract and understand every page and slide.',
  },
  {
    icon: Globe,
    title: 'Web-Augmented Context',
    description: 'We search the internet for your specific course at your university — syllabi, past papers, exam formats.',
  },
  {
    icon: Zap,
    title: 'Instant Study Pack',
    description: 'Get structured notes, expected exam questions, and an interactive quiz — streamed in real time.',
  },
]

export default function LandingPage() {
  return (
    <main className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-semibold text-lg tracking-tight">
            Study<span className="text-orange-500">Forge</span>
          </span>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/create">
              <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs text-orange-700 mb-6 dark:border-orange-900 dark:bg-orange-950/30 dark:text-orange-400">
          <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
          Open Source · AGPL-3.0 License
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 dark:text-gray-50 max-w-3xl mb-4">
          Turn your lecture slides into{' '}
          <span className="text-orange-500">exam-ready notes</span>{' '}
          in minutes
        </h1>

        <p className="text-lg text-gray-500 dark:text-gray-400 max-w-xl mb-8">
          Upload your course materials, tell us your university and course — StudyForge generates
          structured notes, expected questions, and a quiz tailored to <em>your</em> institution.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/create">
            <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white px-8">
              Generate my study pack
            </Button>
          </Link>
          <a
            href="https://github.com/RishavRajSingh44/StudyForge"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="lg" variant="outline">
              View on GitHub
            </Button>
          </a>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-800 py-16 px-6">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-3 gap-8">
          {features.map((f) => (
            <div key={f.title} className="flex flex-col gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-950/50 flex items-center justify-center">
                <f.icon className="w-5 h-5 text-orange-500" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-50">{f.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Social proof strip */}
      <section className="py-8 px-6 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto flex flex-wrap gap-x-8 gap-y-2 items-center justify-center text-sm text-gray-500 dark:text-gray-400">
          {['PDF · PPTX · DOCX support', 'No account required', 'Runs without login', 'Self-hostable'].map((item) => (
            <span key={item} className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-orange-500" />
              {item}
            </span>
          ))}
        </div>
      </section>
    </main>
  )
}
