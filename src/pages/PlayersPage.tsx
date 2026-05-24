import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { fetchPlayers } from '../lib/playersApi'
import type { Player, PlayerType } from '../types/player'
import { Skeleton } from 'boneyard-js/react'

/** Debounce a value by `delay` ms. */
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export function PlayersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')

  const [currentMode, setCurrentMode] = useState<PlayerType>(
    tabParam === 'international' ? 'international' : 'national',
  )
  const [searchInput, setSearchInput] = useState('')
  const [players, setPlayers]         = useState<Player[]>([])
  const [loading, setLoading]         = useState(true)
  const [openDistricts, setOpenDistricts] = useState<Set<string>>(new Set())

  const searchQuery = useDebounce(searchInput, 300)

  // Fetch all published players once
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    fetchPlayers(undefined, true, controller.signal)
      .then((data) => { if (!controller.signal.aborted) setPlayers(data) })
      .catch(() => { if (!controller.signal.aborted) setPlayers([]) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => { controller.abort() }
  }, [])

  // Sync tab from URL
  useEffect(() => {
    setCurrentMode(tabParam === 'international' ? 'international' : 'national')
  }, [tabParam])

  // Switch tab — reset search & open districts
  const setMode = useCallback(
    (mode: PlayerType) => {
      setCurrentMode(mode)
      setSearchInput('')
      setOpenDistricts(new Set())
      setSearchParams(mode === 'international' ? { tab: 'international' } : {}, { replace: true })
    },
    [setSearchParams],
  )

  // Toggle a district accordion open/closed
  const toggleDistrict = useCallback((name: string) => {
    setOpenDistricts((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }, [])

  // Players for current tab, filtered by search
  const tabPlayers = useMemo(
    () => players.filter((p) => p.playerType === currentMode),
    [players, currentMode],
  )

  const filteredPlayers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return tabPlayers
    return tabPlayers.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.state || '').toLowerCase().includes(q) ||
        (p.role || '').toLowerCase().includes(q),
    )
  }, [tabPlayers, searchQuery])

  // Group filtered players by state/district
  const districtGroups = useMemo(() => {
    const map = new Map<string, Player[]>()
    filteredPlayers.forEach((p) => {
      const key = p.state?.trim() || 'Unassigned'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(p)
    })
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [filteredPlayers])

  // Auto-expand all districts when searching
  useEffect(() => {
    if (searchQuery) {
      setOpenDistricts(new Set(districtGroups.map(([name]) => name)))
    }
  }, [searchQuery, districtGroups])

  const totalPlayers = filteredPlayers.length

  return (
    <Skeleton name="players-page" loading={loading}>
      <main id="page-content" className="flex-grow w-full">

        {/* ── Hero ── */}
        <section className="relative w-full overflow-hidden bg-gray-900">
          <div
            className="absolute inset-0 z-0 bg-cover bg-center opacity-40"
            style={{
              backgroundImage:
                'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCzcqh27nAbvpunxAQhCnua3I-E8L2OUzp7jE7rYXxUkdGUMGH1-SW8EZDl8533JtC6aRs5lC7dNUUI6m3_7qBj9-OEZpCWnIDwmAp584Eig-8tSI0GrYCIiNGhSQsaVXWwjf-Uanhb6ifKQk7nMcMDy3U9sHVBf99mV20b6lbAZPH0iX9R4h5GLSsp4WhKP3FRgBQw7md5XLfdPsGkIOjxSfvxJeI-1g1sZj2I9T03EsnOT9aVfLK-o5YuBO42hXQCxNdgpOnEoJ0")',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 to-transparent z-10" />
          <div className="relative z-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
            <div className="flex items-center gap-2 text-xs font-medium text-white/70 mb-3">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
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

        {/* ── Filters bar ── */}
        <div className="bg-gray-50 border-b border-gray-200 py-4 sticky top-0 z-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              {/* Tab switcher */}
              <div className="flex items-center gap-3">
                {(['national', 'international'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setMode(mode)}
                    className={`flex h-10 items-center justify-center rounded-lg px-5 text-sm font-medium transition-colors ${
                      currentMode === mode
                        ? 'bg-[#5a0a8f] text-white shadow-md'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {mode === 'national' ? 'National Player' : 'International Player'}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative sm:w-72">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <span className="material-symbols-outlined text-[20px]">search</span>
                </span>
                <input
                  type="text"
                  placeholder="Search by name or district…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="h-10 w-full rounded-lg border-0 bg-white pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-500 ring-1 ring-gray-200 focus:ring-2 focus:ring-[#5a0a8f]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 bg-white min-h-[400px]">

          {/* Summary line */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-gray-600">
              <span className="font-bold text-gray-900">{totalPlayers}</span>{' '}
              {currentMode} {totalPlayers === 1 ? 'player' : 'players'}
              {searchQuery && (
                <span className="text-gray-400"> matching "{searchQuery}"</span>
              )}
            </p>
            {districtGroups.length > 0 && (
              <button
                onClick={() =>
                  setOpenDistricts(
                    openDistricts.size === districtGroups.length
                      ? new Set()
                      : new Set(districtGroups.map(([n]) => n)),
                  )
                }
                className="text-xs font-semibold text-[#5a0a8f] hover:underline"
              >
                {openDistricts.size === districtGroups.length ? 'Collapse all' : 'Expand all'}
              </button>
            )}
          </div>

          {districtGroups.length === 0 ? (
            /* ── Empty state ── */
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-4xl text-yellow-500">person_search</span>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">No Players Found</h3>
              <p className="text-sm text-gray-500 max-w-xs">
                {searchQuery
                  ? 'No players match your search. Try different keywords.'
                  : 'No players have been added yet.'}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchInput('')}
                  className="mt-4 text-sm font-semibold text-[#5a0a8f] hover:underline"
                >
                  Clear search
                </button>
              )}
              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-yellow-300 bg-yellow-50 px-4 py-1.5 text-xs font-semibold text-yellow-700">
                <span className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse" />
                COMING SOON
              </div>
            </div>
          ) : (
            /* ── District accordion list ── */
            <div className="space-y-3">
              {districtGroups.map(([district, districtPlayers]) => {
                const isOpen = openDistricts.has(district)
                return (
                  <div
                    key={district}
                    className="rounded-xl border border-gray-200 overflow-hidden shadow-sm"
                  >
                    {/* Accordion header */}
                    <button
                      type="button"
                      onClick={() => toggleDistrict(district)}
                      className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-1 h-8 rounded-full bg-[#5a0a8f] shrink-0" />
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#5a0a8f] mb-0.5">
                            District
                          </p>
                          <p className="text-base font-black text-gray-900 leading-tight">
                            {district}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-4">
                        <span className="inline-flex items-center justify-center rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700">
                          {districtPlayers.length}{' '}
                          {districtPlayers.length === 1 ? 'player' : 'players'}
                        </span>
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                            isOpen ? 'bg-[#5a0a8f] text-white' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          <span
                            className={`material-symbols-outlined text-[20px] transition-transform duration-200 ${
                              isOpen ? 'rotate-180' : ''
                            }`}
                          >
                            keyboard_arrow_down
                          </span>
                        </div>
                      </div>
                    </button>

                    {/* Accordion content */}
                    {isOpen && (
                      <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {districtPlayers.map((player) => (
                            <Link
                              key={player.id}
                              to={`/players/${encodeURIComponent(player.id)}`}
                              className="group flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-4 py-3 hover:border-[#5a0a8f]/40 hover:shadow-md transition-all"
                            >
                              <img
                                alt={`Profile of ${player.name}`}
                                className="w-12 h-12 rounded-full object-cover border-2 border-white shadow shrink-0"
                                src={player.image}
                                loading="lazy"
                                onError={(e) => {
                                  ;(e.target as HTMLImageElement).src =
                                    `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=5a0a8f&color=fff&size=48&bold=true`
                                }}
                              />
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-gray-900 text-sm truncate group-hover:text-[#5a0a8f] transition-colors">
                                  {player.name}
                                </p>
                                <p className="text-xs text-gray-500 truncate">{player.role || player.category}</p>
                                {player.badge && (
                                  <span className="inline-block mt-1 rounded-full bg-yellow-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-yellow-800">
                                    {player.badge}
                                  </span>
                                )}
                              </div>
                              <span className="material-symbols-outlined text-gray-300 group-hover:text-[#5a0a8f] transition-colors text-[18px] shrink-0">
                                chevron_right
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </main>
    </Skeleton>
  )
}
