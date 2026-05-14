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
    <div className="flex items-center gap-0.5 p-0.5 bg-slate-950/50 rounded-lg border border-slate-800/50 w-full backdrop-blur-sm">
      <button
        onClick={() => setTheme('light')}
        className={`flex-1 flex items-center justify-center py-1.5 rounded text-xs transition-all duration-300
          ${theme === 'light' 
            ? 'bg-slate-800 text-amber-500 shadow-inner' 
            : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
          }`}
        title="Ligh Mode"
      >
        <span>☀️</span>
      </button>
      
      <button
        onClick={() => setTheme('system')}
        className={`flex-1 flex items-center justify-center py-1.5 rounded text-xs transition-all duration-300
          ${theme === 'system' 
            ? 'bg-slate-800 text-blue-500 shadow-inner' 
            : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
          }`}
        title="Auto System"
      >
        <span>💻</span>
      </button>

      <button
        onClick={() => setTheme('dark')}
        className={`flex-1 flex items-center justify-center py-1.5 rounded text-xs transition-all duration-300
          ${theme === 'dark' 
            ? 'bg-slate-800 text-blue-400 shadow-inner' 
            : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
          }`}
        title="Dark Mode"
      >
        <span>🌙</span>
      </button>
    </div>
  )
}
