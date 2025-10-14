'use client'

/**
 * Theme Context
 * Gerencia o tema da aplicação (light/dark) com persistência no localStorage
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')

  // Inicializar tema do localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('sati-theme') as Theme
    if (savedTheme) {
      setThemeState(savedTheme)
    }
  }, [])

  // Atualizar tema e aplicar no DOM
  useEffect(() => {
    const root = document.documentElement
    
    // Determinar tema final
    let finalTheme: 'light' | 'dark' = 'light'
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      finalTheme = systemTheme
    } else {
      finalTheme = theme
    }

    // Aplicar classe ao root
    root.classList.remove('light', 'dark')
    root.classList.add(finalTheme)
    
    setResolvedTheme(finalTheme)
  }, [theme])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('sati-theme', newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

