'use client'
import { useEffect, useRef } from 'react'
import type { SSEEvent } from '@/types/generation'

export function useSSE(
  url: string | null,
  handlers: {
    onStatus?: (msg: string) => void
    onDelta?: (delta: string) => void
    onComplete?: (sessionId: string) => void
    onError?: (msg: string) => void
  },
) {
  const handlersRef = useRef(handlers)

  useEffect(() => {
    handlersRef.current = handlers
  })

  useEffect(() => {
    if (!url) return

    const controller = new AbortController()

    async function connect() {
      try {
        const res = await fetch(url!, { signal: controller.signal })
        if (!res.ok || !res.body) throw new Error('SSE connection failed')

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buf = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buf += decoder.decode(value, { stream: true })

          const lines = buf.split('\n')
          buf = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            try {
              const event = JSON.parse(line.slice(6)) as SSEEvent
              const h = handlersRef.current
              if (event.type === 'status') h.onStatus?.(event.message)
              else if (event.type === 'content') h.onDelta?.(event.delta)
              else if (event.type === 'complete') h.onComplete?.(event.sessionId)
              else if (event.type === 'error') h.onError?.(event.message)
            } catch {}
          }
        }
      } catch {
        if (!controller.signal.aborted) {
          handlersRef.current.onError?.('Connection lost')
        }
      }
    }

    connect()
    return () => controller.abort()
  }, [url])
}
