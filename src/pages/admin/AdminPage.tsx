import { useMemo, useState } from 'react'
import { useSiteContent } from '../../content/SiteContentContext'
import type { NewsItem, TournamentItem, TournamentStatus } from '../../content/types'

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function move<T>(arr: T[], from: number, to: number) {
  const next = [...arr]
  const start = clamp(from, 0, next.length - 1)
  const end = clamp(to, 0, next.length - 1)
  const [item] = next.splice(start, 1)
  next.splice(end, 0, item)
  return next
}

export function AdminPage() {
  const { content, setContent, resetToDefaults, importFromJson } = useSiteContent()
  const [importText, setImportText] = useState('')

  const newsSorted = useMemo(() => {
    const items = [...content.news]
    items.sort((a, b) => Number(b.pinned) - Number(a.pinned))
    return items
  }, [content.news])

  const tournamentsSorted = useMemo(() => {
    const items = [...content.tournaments]
    items.sort((a, b) => Number(b.pinned) - Number(a.pinned))
    return items
  }, [content.tournaments])

  const addNews = () => {
    const now = new Date()
    const next: NewsItem = {
      id: uid('news'),
      title: 'New news item',
      date: now.toISOString(),
      dateText: now.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: '2-digit' }),
      badge: 'UPDATE',
      excerpt: 'Write a short excerpt…',
      imageUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBQkZ3uNiS3toCeitYMgI3en60sbHGrCFfS_mrSJR_zBr25ZEpm3jApXKID8GmpUBbzhJGl3Rlpwm0TnepehtJcUJ-zfEx3ky6DecBLi6sXU4qbvE8n_TewEKhZBFUqp28mnYd_FWOSl9pdfv-Df3FEkrwCka2vaLflSvMhRjbQfsc8vbcockhtk-wV1GBDI5oYK_gIYb8YmUbBBr0LJTsSHf5x-ow8cJ-6tozDP1aDYmSNn6NJFUZiZqCbftjCQlDZ18Nk1PaopU0',
      pinned: false,
      featured: false,
    }

    setContent({ ...content, news: [next, ...content.news] })
  }

  const updateNews = (id: string, patch: Partial<NewsItem>) => {
    setContent({
      ...content,
      news: content.news.map((n) => (n.id === id ? { ...n, ...patch } : n)),
    })
  }

  const removeNews = (id: string) => {
    setContent({ ...content, news: content.news.filter((n) => n.id !== id) })
  }

  const reorderNewsByPinnedFirst = (id: string, direction: -1 | 1) => {
    const idx = newsSorted.findIndex((n) => n.id === id)
    if (idx < 0) return
    const moved = move(newsSorted, idx, idx + direction)
    const ids = new Set(moved.map((n) => n.id))
    const rebuilt = [...moved, ...content.news.filter((n) => !ids.has(n.id))]
    setContent({ ...content, news: rebuilt })
  }

  const setFeatured = (id: string) => {
    setContent({
      ...content,
      news: content.news.map((n) => ({ ...n, featured: n.id === id })),
    })
  }

  const addTournament = () => {
    const next: TournamentItem = {
      id: uid('tournament'),
      title: 'New tournament',
      location: 'Location',
      month: 'JAN',
      day: '01',
      status: 'CONFIRMED',
      pinned: false,
    }

    setContent({ ...content, tournaments: [next, ...content.tournaments] })
  }

  const updateTournament = (id: string, patch: Partial<TournamentItem>) => {
    setContent({
      ...content,
      tournaments: content.tournaments.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    })
  }

  const removeTournament = (id: string) => {
    setContent({ ...content, tournaments: content.tournaments.filter((t) => t.id !== id) })
  }

  const reorderTournamentsByPinnedFirst = (id: string, direction: -1 | 1) => {
    const idx = tournamentsSorted.findIndex((t) => t.id === id)
    if (idx < 0) return
    const moved = move(tournamentsSorted, idx, idx + direction)
    const ids = new Set(moved.map((t) => t.id))
    const rebuilt = [...moved, ...content.tournaments.filter((t) => !ids.has(t.id))]
    setContent({ ...content, tournaments: rebuilt })
  }

  const exportJson = () => {
    const json = JSON.stringify(content, null, 2)
    void navigator.clipboard.writeText(json)
  }

  const doImport = () => {
    importFromJson(importText)
    setImportText('')
  }

  return (
    <main id="page-content" className="w-full overflow-x-hidden relative">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-8">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">Admin</h1>
          <div className="flex flex-wrap gap-2">
            <button
              className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90"
              onClick={addNews}
            >
              Add News
            </button>
            <button
              className="px-4 py-2 rounded-lg bg-secondary text-white text-sm font-bold hover:bg-secondary/90"
              onClick={addTournament}
            >
              Add Tournament
            </button>
            <button
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-bold hover:bg-white dark:hover:bg-gray-800"
              onClick={exportJson}
              title="Copies JSON to clipboard"
            >
              Export JSON
            </button>
            <button
              className="px-4 py-2 rounded-lg border border-red-300 text-red-700 text-sm font-bold hover:bg-red-50"
              onClick={resetToDefaults}
            >
              Reset Defaults
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* News */}
          <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
              <h2 className="font-bold text-gray-900 dark:text-white">News</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Pinned items appear first.</p>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {newsSorted.map((n) => (
                <div key={n.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm font-bold text-gray-900 dark:text-white"
                          value={n.title}
                          onChange={(e) => updateNews(n.id, { title: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <input
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"
                          value={n.dateText}
                          onChange={(e) => updateNews(n.id, { dateText: e.target.value })}
                          placeholder="Date"
                        />
                        <input
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"
                          value={n.badge}
                          onChange={(e) => updateNews(n.id, { badge: e.target.value })}
                          placeholder="Badge"
                        />
                        <input
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm md:col-span-2"
                          value={n.imageUrl}
                          onChange={(e) => updateNews(n.id, { imageUrl: e.target.value })}
                          placeholder="Image URL"
                        />
                        <textarea
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm md:col-span-2"
                          value={n.excerpt}
                          onChange={(e) => updateNews(n.id, { excerpt: e.target.value })}
                          rows={2}
                          placeholder="Excerpt"
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                        <label className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                          <input
                            type="checkbox"
                            checked={n.pinned}
                            onChange={(e) => updateNews(n.id, { pinned: e.target.checked })}
                          />
                          Pinned
                        </label>
                        <label className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                          <input
                            type="radio"
                            name="featured"
                            checked={n.featured}
                            onChange={() => setFeatured(n.id)}
                          />
                          Featured
                        </label>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 shrink-0">
                      <button
                        className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-700"
                        onClick={() => reorderNewsByPinnedFirst(n.id, -1)}
                      >
                        Up
                      </button>
                      <button
                        className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-700"
                        onClick={() => reorderNewsByPinnedFirst(n.id, 1)}
                      >
                        Down
                      </button>
                      <button
                        className="px-3 py-1.5 rounded-lg border border-red-300 text-red-700 text-xs font-bold hover:bg-red-50"
                        onClick={() => removeNews(n.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Tournaments */}
          <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
              <h2 className="font-bold text-gray-900 dark:text-white">Tournaments</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Pinned items appear first.</p>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {tournamentsSorted.map((t) => (
                <div key={t.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <input
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm font-bold text-gray-900 dark:text-white mb-2"
                        value={t.title}
                        onChange={(e) => updateTournament(t.id, { title: e.target.value })}
                        placeholder="Title"
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <input
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"
                          value={t.location}
                          onChange={(e) => updateTournament(t.id, { location: e.target.value })}
                          placeholder="Location"
                        />
                        <select
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"
                          value={t.status}
                          onChange={(e) => updateTournament(t.id, { status: e.target.value as TournamentStatus })}
                        >
                          <option value="CONFIRMED">CONFIRMED</option>
                          <option value="REGISTRATION OPEN">REGISTRATION OPEN</option>
                          <option value="TENTATIVE">TENTATIVE</option>
                        </select>
                        <input
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"
                          value={t.month}
                          onChange={(e) => updateTournament(t.id, { month: e.target.value })}
                          placeholder="Month (e.g. FEB)"
                        />
                        <input
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"
                          value={t.day}
                          onChange={(e) => updateTournament(t.id, { day: e.target.value })}
                          placeholder="Day (e.g. 16)"
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                        <label className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                          <input
                            type="checkbox"
                            checked={t.pinned}
                            onChange={(e) => updateTournament(t.id, { pinned: e.target.checked })}
                          />
                          Pinned
                        </label>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 shrink-0">
                      <button
                        className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-700"
                        onClick={() => reorderTournamentsByPinnedFirst(t.id, -1)}
                      >
                        Up
                      </button>
                      <button
                        className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-700"
                        onClick={() => reorderTournamentsByPinnedFirst(t.id, 1)}
                      >
                        Down
                      </button>
                      <button
                        className="px-3 py-1.5 rounded-lg border border-red-300 text-red-700 text-xs font-bold hover:bg-red-50"
                        onClick={() => removeTournament(t.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Import */}
        <section className="mt-10 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
            <h2 className="font-bold text-gray-900 dark:text-white">Import JSON</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Paste exported content JSON and click Import.
            </p>
          </div>
          <div className="p-4">
            <textarea
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"
              rows={6}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="{ ... }"
            />
            <div className="flex gap-2 mt-3">
              <button
                className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90"
                onClick={doImport}
              >
                Import
              </button>
              <button
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-bold hover:bg-gray-50 dark:hover:bg-gray-700"
                onClick={() => setImportText('')}
              >
                Clear
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
