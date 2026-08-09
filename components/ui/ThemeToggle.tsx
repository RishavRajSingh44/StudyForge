'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const isDark = theme === 'dark'

  return (
    <Button
      variant="ghost"
      size="icon"
      suppressHydrationWarning
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <Sun
        size={16}
        suppressHydrationWarning
        className={isDark ? 'block text-gray-400' : 'hidden'}
      />
      <Moon
        size={16}
        suppressHydrationWarning
        className={isDark ? 'hidden' : 'block text-gray-500'}
      />
    </Button>
  )
}
