'use client'
import { useState } from 'react'
import { generateAnonToken } from '@/lib/utils/format'

const KEY = 'studyforge_anon_token'

export function useAnonymousSession() {
  const [token] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    let t = localStorage.getItem(KEY)
    if (!t) {
      t = generateAnonToken()
      localStorage.setItem(KEY, t)
    }
    return t
  })

  return token
}
