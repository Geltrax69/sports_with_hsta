import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { fetchPlayers } from '../lib/playersApi'
import type { Player, PlayerType } from '../types/player'
import { Skeleton } from 'boneyard-js/react'
import { useDistricts } from '../context/DistrictsContext'

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

/** Stat pill shown on each player card */
function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center bg-gray-50 rounded-lg px-2 py-1.5 min-w-0">
      <span className="text-base font-black text-[#5a0a8f] leading-none">{value}</span>
      <span className="text-[9px] font-bold uppercase tracking-wide text-gray-500 mt-0.5 text-center leading-tight">
        {label}
      </span>
    </div>
  )
}

/** Player avatar with graceful fallback */
function PlayerAvatar({ src, name, size = 64 }: { src: string; name: string; size?: number }) {
  const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=5a0a8f&color=fff&size=${size * 2}&bold=true&format=svg`
  return (
    <img
      alt={name}
      src={src || fallback}
      width={size}
      height={size}
      loading="lazy"
      className="rounded-full object-cover border-2 border-white shadow-md shrink-0"
      style={{ width: size, height: size }}
      onError={(e) => {
        const el = e.target as HTMLImageElement
        if (el.src !== fallback) el.src = fallback
      }}
    />
  )
}

export function PlayersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const { getDistrictById } = useDistricts()

  // Resolve a district code like "AMNW1712" → full name like "Ambala".
  // Falls back to the raw code if the district isn't found.
  const resolveDistrict = useCallback(
    (code: string) => getDistrictById(code)?.name || code,
    [getDistrictById],
  )

  const [currentMode, setCurrentMode] = useState<PlayerType>(
    tabParam === 'international' ? 'international' : 'national',
  )
  const [searchInput, setSearchInput]       = useState('')
  const [players, setPlayers]               = useState<Player[]>([])
  const [loading, setLoading]               = useState(true)
  const [openDistricts, setOpenDistricts]   = useState<Set<string>>(new Set())

  const searchQuery = useDebounce(searchInput, 300)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    fetchPlayers(undefined, true, controller.signal)
      .then((data) => { if (!controller.signal.aborted) setPlayers(data) })
      .catch(() => { if (!controller.signal.aborted) setPlayers([]) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => { controller.abort() }
  }, [])

  useEffect(() => {
    setCurrentMode(tabParam === 'international' ? 'international' : 'national')
  }, [tabParam])

  const setMode = useCallback(
    (mode: PlayerType) => {
      setCurrentMode(mode)
      setSearchInput('')
      setOpenDistricts(new Set())
      setSearchParams(mode === 'international' ? { tab: 'international' } : {}, { replace: true })
    },
    [setSearchParams],
  )

  const toggleDistrict = useCallback((name: string) => {
    setOpenDistricts((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }, [])

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

  const districtGroups = useMemo(() => {
    const map = new Map<string, Player[]>()
    filteredPlayers.forEach((p) => {
      const key = p.state?.trim() || 'Unassigned'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(p)
    })
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [filteredPlayers])

  // Auto-expand all matching districts when searching
  useEffect(() => {
    if (searchQuery) {
      setOpenDistricts(new Set(districtGroups.map(([name]) => name)))
    }
  }, [searchQuery, districtGroups])

  const allExpanded = openDistricts.size === districtGroups.length && districtGroups.length > 0

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
        <div className="bg-gray-50 border-b border-gray-200 py-3 sticky top-0 z-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                {(['national', 'international'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setMode(mode)}
                    className={`flex h-10 items-center justify-center rounded-lg px-5 text-sm font-semibold transition-colors ${
                      currentMode === mode
                        ? 'bg-[#5a0a8f] text-white shadow-md'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {mode === 'national' ? 'National Player' : 'International Player'}
                  </button>
                ))}
              </div>
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

          {/* Summary + expand-all */}
          {districtGroups.length > 0 && (
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-gray-600">
                <span className="font-bold text-gray-900">{filteredPlayers.length}</span>{' '}
                {currentMode} {filteredPlayers.length === 1 ? 'player' : 'players'} across{' '}
                <span className="font-bold text-gray-900">{districtGroups.length}</span>{' '}
                {districtGroups.length === 1 ? 'district' : 'districts'}
                {searchQuery && <span className="text-gray-400"> matching "{searchQuery}"</span>}
              </p>
              <button
                onClick={() =>
                  setOpenDistricts(
                    allExpanded ? new Set() : new Set(districtGroups.map(([n]) => n)),
                  )
                }
                className="text-xs font-semibold text-[#5a0a8f] hover:underline"
              >
                {allExpanded ? 'Collapse all' : 'Expand all'}
              </button>
            </div>
          )}

          {districtGroups.length === 0 ? (
            /* ── Empty state ── */
            <div className="flex flex-col items-center justify-center py-24 text-center">
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
            <div className="space-y-4">
              {districtGroups.map(([district, districtPlayers]) => {
                const isOpen = openDistricts.has(district)
                return (
                  <div
                    key={district}
                    className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm"
                  >
                    {/* ── Accordion header ── */}
                    <button
                      type="button"
                      onClick={() => toggleDistrict(district)}
                      className="w-full flex items-center justify-between px-6 py-5 bg-white hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        {/* Colour accent bar */}
                        <div className="w-1.5 h-10 rounded-full bg-[#5a0a8f] shrink-0" />
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#5a0a8f] mb-0.5">
                            DISTRICT
                          </p>
                          <p className="text-xl font-black text-gray-900 leading-tight tracking-tight">
                            {resolveDistrict(district)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-4">
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#5a0a8f]/10 px-3.5 py-1.5 text-sm font-bold text-[#5a0a8f]">
                          <span className="material-symbols-outlined text-[16px]">person</span>
                          {districtPlayers.length}{' '}
                          {districtPlayers.length === 1 ? 'player' : 'players'}
                        </span>
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                            isOpen ? 'bg-[#5a0a8f] text-white' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          <span
                            className={`material-symbols-outlined text-[22px] transition-transform duration-200 ${
                              isOpen ? 'rotate-180' : ''
                            }`}
                          >
                            keyboard_arrow_down
                          </span>
                        </div>
                      </div>
                    </button>

                    {/* ── Expanded player cards ── */}
                    {isOpen && (
                      <div className="border-t border-gray-100 bg-gradient-to-b from-gray-50 to-white px-6 py-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {districtPlayers.map((player) => (
                            <Link
                              key={player.id}
                              to={`/players/${encodeURIComponent(player.id)}`}
                              className="group flex flex-col bg-white rounded-2xl border border-gray-200 hover:border-[#5a0a8f]/40 hover:shadow-lg transition-all overflow-hidden"
                            >
                              {/* Card header strip */}
                              <div className="h-2 bg-gradient-to-r from-[#400466] via-[#5a0a8f] to-[#7c3aed]" />

                              <div className="p-5">
                                {/* Photo + name row */}
                                <div className="flex items-start gap-4 mb-4">
                                  <PlayerAvatar src={player.image} name={player.name} size={72} />
                                  <div className="min-w-0 flex-1 pt-1">
                                    <p className="text-base font-black text-gray-900 leading-tight group-hover:text-[#5a0a8f] transition-colors line-clamp-2">
                                      {player.name}
                                    </p>
                                    {player.role && (
                                      <p className="text-xs text-gray-500 mt-0.5 font-medium">
                                        {player.role}
                                      </p>
                                    )}
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                      {player.category && (
                                        <span className="inline-block rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-purple-800">
                                          {player.category}
                                        </span>
                                      )}
                                      {player.badge && (
                                        <span className="inline-block rounded-full bg-yellow-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-yellow-800">
                                          {player.badge}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* District label */}
                                <div className="flex items-center gap-1.5 mb-4 text-xs text-gray-500">
                                  <span className="material-symbols-outlined text-[14px] text-[#5a0a8f]">
                                    location_on
                                  </span>
                                  <span className="font-semibold text-gray-700">{resolveDistrict(district)}</span>
                                </div>

                                {/* Games stats */}
                                <div className="grid grid-cols-4 gap-1.5">
                                  <StatPill label="District" value={player.districtGames ?? 0} />
                                  <StatPill label="State" value={player.stateGames ?? 0} />
                                  <StatPill label="National" value={player.nationalGames ?? 0} />
                                  <StatPill label="Intl." value={player.internationalGames ?? 0} />
                                </div>

                                {/* View profile footer */}
                                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-end gap-1 text-xs font-bold text-[#5a0a8f] group-hover:gap-2 transition-all">
                                  View Profile
                                  <span className="material-symbols-outlined text-[16px]">
                                    arrow_forward
                                  </span>
                                </div>
                              </div>
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
