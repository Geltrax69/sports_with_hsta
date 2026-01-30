import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { DEFAULT_SITE_CONTENT } from './defaultContent'
import type { NewsItem, SiteContent, TournamentItem } from './types'

const STORAGE_KEY = 'stfi.siteContent.v1'

function loadFromStorage(): SiteContent {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SITE_CONTENT
    const parsed = JSON.parse(raw) as SiteContent
    if (!parsed?.news || !parsed?.tournaments) return DEFAULT_SITE_CONTENT
    return parsed
  } catch {
    return DEFAULT_SITE_CONTENT
  }
}

function saveToStorage(content: SiteContent) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(content))
  } catch (error) {
    console.error('Failed to save content to storage:', error)
  }
}

type SiteContentContextValue = {
  content: SiteContent
  setContent: (next: SiteContent) => void
  updateNews: (items: NewsItem[]) => void
  updateTournaments: (items: TournamentItem[]) => void
  reset: () => void
  resetToDefaults: () => void
  importFromJson: (json: string) => void
}

const SiteContentContext = createContext<SiteContentContextValue | null>(null)

export function SiteContentProvider({ children }: { children: React.ReactNode }) {
  const [content, setContentState] = useState<SiteContent>(() => loadFromStorage())

  const setContent = useCallback((next: SiteContent) => {
    setContentState(next)
    saveToStorage(next)
  }, [])

  const updateNews = useCallback(
    (items: NewsItem[]) => {
      setContent({ ...content, news: items })
    },
    [content, setContent],
  )

  const updateTournaments = useCallback(
    (items: TournamentItem[]) => {
      setContent({ ...content, tournaments: items })
    },
    [content, setContent],
  )

  const reset = useCallback(() => {
    setContent(DEFAULT_SITE_CONTENT)
  }, [setContent])

  const resetToDefaults = reset

  const importFromJson = useCallback(
    (json: string) => {
      const trimmed = json.trim()
      if (!trimmed) return

      try {
        const parsed = JSON.parse(trimmed) as SiteContent
        if (!parsed?.news || !parsed?.tournaments) return
        if (!Array.isArray(parsed.news) || !Array.isArray(parsed.tournaments)) return
        setContent(parsed)
      } catch {
        // ignore invalid JSON
      }
    },
    [setContent],
  )

  const value = useMemo<SiteContentContextValue>(
    () => ({ content, setContent, updateNews, updateTournaments, reset, resetToDefaults, importFromJson }),
    [content, importFromJson, reset, resetToDefaults, setContent, updateNews, updateTournaments],
  )

  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSiteContent() {
  const ctx = useContext(SiteContentContext)
  if (!ctx) throw new Error('useSiteContent must be used within SiteContentProvider')
  return ctx
}
