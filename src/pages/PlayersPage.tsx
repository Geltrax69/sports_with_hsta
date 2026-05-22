import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fetchDirectoryPlayers, toDisplayPlayer } from '../lib/directoryPlayers'
import { MaintenanceNotice } from '../components/MaintenanceNotice'
import type { DirectoryPlayer, PlayerType } from '../types/directoryPlayer'
import type { Player } from '../data/playersData'
import { Skeleton } from 'boneyard-js/react'

export function PlayersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const initialMode: PlayerType = tabParam === 'international' ? 'international' : 'national'
  const [currentMode, setCurrentMode] = useState<PlayerType>(initialMode)
  const [searchQuery, setSearchQuery] = useState('')
  const [stateFilter, setStateFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [sortBy, setSortBy] = useState<'rank' | 'name' | 'age'>('rank')
  const [currentPage, setCurrentPage] = useState(1)
  const [directoryPlayers, setDirectoryPlayers] = useState<DirectoryPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const itemsPerPage = 8

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const data = await fetchDirectoryPlayers()
        if (!cancelled) setDirectoryPlayers(data)
      } catch {
        if (!cancelled) setDirectoryPlayers([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const currentData: Player[] = directoryPlayers
    .filter((p) => p.playerType === currentMode)
    .map(toDisplayPlayer)

  const stateOptions = useMemo(() => {
    const states = new Set(
      currentData.map((p) => p.state?.trim()).filter((s): s is string => Boolean(s)),
    )
    return Array.from(states).sort((a, b) => a.localeCompare(b))
  }, [currentData])

  const categoryOptions = [
    { value: 'MEN', label: 'Men' },
    { value: 'WOMEN', label: 'Women' },
    { value: 'JUNIOR', label: 'Junior' },
  ]

  const filteredData = currentData.filter((item) => {
    const q = searchQuery.toLowerCase().trim()
    const matchesSearch =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.state.toLowerCase().includes(q)
    const matchesState = !stateFilter || item.state === stateFilter
    const matchesCategory =
      !categoryFilter || item.category.toUpperCase() === categoryFilter
    return matchesSearch && matchesState && matchesCategory
  })

  const sortedData = [...filteredData].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name)
    if (sortBy === 'age') return a.age - b.age
    return a.rankNumber - b.rankNumber
  })

  const totalPages = Math.ceil(sortedData.length / itemsPerPage)
  const startIdx = (currentPage - 1) * itemsPerPage
  const endIdx = startIdx + itemsPerPage
  const paginatedData = sortedData.slice(startIdx, endIdx)

  const setMode = (mode: PlayerType) => {
    setCurrentMode(mode)
    setSearchParams(mode === 'international' ? { tab: 'international' } : {}, { replace: true })
  }

  useEffect(() => {
    if (tabParam === 'international') setCurrentMode('international')
    else if (tabParam === 'national' || !tabParam) setCurrentMode('national')
  }, [tabParam])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1)
  }, [searchQuery, sortBy, currentMode, stateFilter, categoryFilter])

  useEffect(() => {
    setStateFilter('')
    setCategoryFilter('')
  }, [currentMode])

  return (
    <Skeleton name="players-page" loading={loading}>
      <main id="page-content" className="flex-grow w-full">
      <section className="relative w-full overflow-hidden bg-gray-900">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center opacity-40"
          style={{
            backgroundImage:
              'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCzcqh27nAbvpunxAQhCnua3I-E8L2OUzp7jE7rYXxUkdGUMGH1-SW8EZDl8533JtC6aRs5lC7dNUUI6m3_7qBj9-OEZpCWnIDwmAp584Eig-8tSI0GrYCIiNGhSQsaVXWwjf-Uanhb6ifKQk7nMcMDy3U9sHVBf99mV20b6lbAZPH0iX9R4h5GLSsp4WhKP3FRgBQw7md5XLfdPsGkIOjxSfvxJeI-1g1sZj2I9T03EsnOT9aVfLK-o5YuBO42hXQCxNdgpOnEoJ0")',
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 to-transparent z-10"></div>
        <div className="relative z-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
          <div className="flex items-center gap-2 text-xs font-medium text-white/70 mb-3">
            <a href={import.meta.env.BASE_URL} className="hover:text-white transition-colors">
              Home
            </a>
            <span className="opacity-50">›</span>
            <span className="opacity-80">Federation</span>
            <span className="opacity-50">›</span>
            <span className="text-white">Players &amp; Officials</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight mb-3">
            Players &amp; Officials
          </h1>
          <p className="text-white/80 max-w-2xl text-base sm:text-lg">
            Browse the official directory of registered athletes, referees, and coaching staff.
          </p>
        </div>
      </section>

      <div className="bg-gray-50 border-b border-gray-200 py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMode('national')}
                className={`flex h-10 items-center justify-center rounded-lg px-5 text-sm font-medium transition-colors ${currentMode === 'national'
                  ? 'bg-[#5a0a8f] text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
              >
                National Player
              </button>
              <button
                onClick={() => setMode('international')}
                className={`flex h-10 items-center justify-center rounded-lg px-5 text-sm font-medium transition-colors ${currentMode === 'international'
                  ? 'bg-[#5a0a8f] text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
              >
                International Player
              </button>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:w-auto w-full">
              <div className="relative flex-1 sm:min-w-[320px]">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <span className="material-symbols-outlined text-[20px]">search</span>
                </div>
                <input
                  type="text"
                  placeholder="Search by name or state..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 w-full rounded-lg border-0 bg-white pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-500 ring-1 ring-gray-200 focus:ring-2 focus:ring-[#5a0a8f]"
                />
              </div>

              <select
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="h-10 w-full sm:w-auto cursor-pointer rounded-lg border-0 bg-white pl-3 pr-10 text-sm text-gray-700 ring-1 ring-gray-200 focus:ring-2 focus:ring-[#5a0a8f] min-w-[140px]"
              >
                <option value="">All States</option>
                {stateOptions.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-10 w-full sm:w-auto cursor-pointer rounded-lg border-0 bg-white pl-3 pr-10 text-sm text-gray-700 ring-1 ring-gray-200 focus:ring-2 focus:ring-[#5a0a8f] min-w-[160px]"
              >
                <option value="">All Categories</option>
                {categoryOptions.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12 bg-white">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-600">
              <>
                Showing <span className="font-bold text-gray-900">{sortedData.length === 0 ? 0 : startIdx + 1}-{Math.min(endIdx, sortedData.length)}</span> of{' '}
                <span className="font-bold text-gray-900">{sortedData.length}</span>{' '}
                {currentMode === 'national' ? 'national' : 'international'} players
              </>
          </p>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'rank' | 'name' | 'age')}
            className="h-10 cursor-pointer rounded-lg border-0 bg-white pl-3 pr-10 text-sm text-gray-700 ring-1 ring-gray-200 focus:ring-2 focus:ring-[#5a0a8f] min-w-[180px]"
          >
            <option value="rank">Ranking (High to Low)</option>
            <option value="name">Name (A-Z)</option>
            <option value="age">Age (Youngest)</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {paginatedData.length > 0 ? (
            paginatedData.map((player) => (
              <a
                key={player.id}
                href={`${import.meta.env.BASE_URL}players/${encodeURIComponent(player.id)}`}
                className="group block overflow-hidden rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:border-[#5a0a8f]/30 transition-all"
              >
                <div className="relative h-48 bg-gray-100 flex items-center justify-center p-4">
                  <img
                    alt={`Profile photo of ${player.name}`}
                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                    src={player.image}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=random&size=128&bold=true`
                    }}
                  />
                  {player.badge && (
                    <div className="absolute top-3 right-3 rounded-full bg-[#fcd34d] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-900">
                      {player.badge}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="mb-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <h3 className="text-base font-bold text-gray-900 group-hover:text-[#5a0a8f] transition-colors truncate">
                        {player.name}
                      </h3>
                      <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-700 uppercase">
                        {player.category}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-gray-400">location_on</span>
                      <span>{player.state}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-gray-400">workspace_premium</span>
                      <span>Rank {player.rank}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-gray-400">cake</span>
                      <span>Age: {player.age}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end pt-3 border-t border-gray-100">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[#5a0a8f] group-hover:gap-2 transition-all">
                      View Profile
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </span>
                  </div>
                </div>
              </a>
            ))
          ) : (
            <div className="col-span-full">
              <MaintenanceNotice
                title="No Players Found"
                message="No players match your search or filters. Try adjusting your criteria."
                icon="search_off"
              />
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center">
            <nav className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center justify-center size-10 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span className="material-symbols-outlined text-lg">chevron_left</span>
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`flex items-center justify-center size-10 rounded-lg font-medium transition-colors ${currentPage === pageNum
                      ? 'bg-[#5a0a8f] text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <>
                  <span className="px-2 text-gray-500">...</span>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    className="flex items-center justify-center size-10 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    {totalPages}
                  </button>
                </>
              )}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center justify-center size-10 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span className="material-symbols-outlined text-lg">chevron_right</span>
              </button>
            </nav>
          </div>
        )}
      </div>
    </main>
    </Skeleton>
  )
}
