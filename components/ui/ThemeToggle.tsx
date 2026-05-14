'use client'

import * as React from 'react'
import { useTheme } from 'next-themes'

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Avoid hydration mismatch by only rendering after mount
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-full h-10 bg-foreground/5 rounded-lg border border-border-custom animate-pulse" />
    )
  }

  return (
    <div className="flex items-center gap-1 p-1 bg-foreground/5 rounded-xl border border-border-custom w-full">
      <button
        onClick={() => setTheme('light')}
        className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-bold transition-all
          ${theme === 'light' 
            ? 'bg-white text-blue-600 shadow-sm' 
            : 'text-foreground/40 hover:text-foreground hover:bg-foreground/5'
          }`}
      >
        <span>☀️</span>
        <span className="hidden lg:inline">Light</span>
      </button>
      
      <button
        onClick={() => setTheme('system')}
        className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-bold transition-all
          ${theme === 'system' 
            ? 'bg-foreground/10 text-foreground shadow-sm border border-border-custom' 
            : 'text-foreground/40 hover:text-foreground hover:bg-foreground/5'
          }`}
      >
        <span>💻</span>
      </button>

      <button
        onClick={() => setTheme('dark')}
        className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-bold transition-all
          ${theme === 'dark' 
            ? 'bg-slate-800 text-blue-400 shadow-sm ring-1 ring-white/10' 
            : 'text-foreground/40 hover:text-foreground hover:bg-foreground/5'
          }`}
      >
        <span>🌙</span>
        <span className="hidden lg:inline">Dark</span>
      </button>
    </div>
  )
}
