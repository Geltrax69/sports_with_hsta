import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { apiRequest } from '../../lib/api'

type Tournament = {
  _id: string
  title: string
  startDate?: string
  endDate?: string
  venueName?: string
  city?: string
  status?: string
  genderCategory?: 'male' | 'female' | 'both'
  imageUrl?: string
}

type MyTournamentRegistration = {
  _id: string
  tournamentId: string
  registerAs: 'player' | 'coach' | 'referee'
  status: 'pending' | 'approved' | 'rejected'
  appliedAt: string
  reviewedAt?: string
  reviewedBy?: string
  notes?: string
}

export function PlayerDashboard() {
  const { user } = useAuth()

  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [myRegistrations, setMyRegistrations] = useState<MyTournamentRegistration[]>([])
  const [loadingTournaments, setLoadingTournaments] = useState(true)
  const [loadingRegs, setLoadingRegs] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshMyRegistrations = async () => {
    setLoadingRegs(true)
    try {
      const r = await apiRequest<{ registrations: MyTournamentRegistration[] }>(
        '/tournaments/registrations/me',
        { auth: true },
      )
      setMyRegistrations(Array.isArray(r.registrations) ? r.registrations : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load your tournament registrations')
    } finally {
      setLoadingRegs(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setError(null)
      setLoadingTournaments(true)
      try {
        const t = await apiRequest<{ tournaments: Tournament[] }>('/tournaments')
        if (cancelled) return
        setTournaments(Array.isArray(t.tournaments) ? t.tournaments : [])
      } catch (e) {
        if (cancelled) return
        setError(e instanceof Error ? e.message : 'Failed to load tournaments')
      } finally {
        if (!cancelled) setLoadingTournaments(false)
      }

      if (!cancelled) {
        await refreshMyRegistrations()
      }
    }

    void run()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const myRegsByTournament = useMemo(() => {
    const m = new Map<string, MyTournamentRegistration[]>()
    for (const r of myRegistrations) {
      const key = String(r.tournamentId)
      m.set(key, [...(m.get(key) || []), r])
    }
    return m
  }, [myRegistrations])

  const formatDateRange = (start?: string, end?: string) => {
    if (!start && !end) return '—'
    try {
      const s = start ? new Date(start) : null
      const e = end ? new Date(end) : null
      if (s && e) return `${s.toLocaleDateString()} - ${e.toLocaleDateString()}`
      if (s) return s.toLocaleDateString()
      if (e) return e.toLocaleDateString()
      return '—'
    } catch {
      return '—'
    }
  }

  const register = async (tournamentId: string, registerAs: 'player' | 'coach' | 'referee') => {
    setError(null)
    try {
      await apiRequest(`/tournaments/${tournamentId}/registrations`, {
        method: 'POST',
        auth: true,
        body: JSON.stringify({ registerAs }),
      })
      await refreshMyRegistrations()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to register')
    }
  }

  const TournamentThumb = ({ url, title }: { url?: string; title: string }) => {
    const [failed, setFailed] = useState(false)

    if (!url || failed) {
      return <span className="material-symbols-outlined text-gray-400">image</span>
    }

    return (
      <img
        src={url}
        alt={title}
        className="w-full h-full object-cover"
        onError={() => setFailed(true)}
      />
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">
            Welcome back, {user?.name || 'Player'}
          </h1>
          <p className="text-gray-600">Here’s what’s happening with your profile today.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 font-semibold hover:bg-gray-50 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">badge</span>
            Player ID
          </button>
          <Link
            to="/events"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#5a0a8f] text-white font-semibold hover:bg-[#400466] transition-colors"
          >
            <span className="material-symbols-outlined text-lg">event_available</span>
            Register for Event
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-medium text-gray-600">Total Matches</div>
              <div className="text-3xl font-black text-gray-900 mt-2">42</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#5a0a8f]/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#5a0a8f]">fitness_center</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-medium text-gray-600">Win Rate</div>
              <div className="text-3xl font-black text-gray-900 mt-2">68%</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-green-600">trending_up</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-medium text-gray-600">National Rank</div>
              <div className="text-3xl font-black text-gray-900 mt-2">#12</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-yellow-700">bar_chart</span>
            </div>
          </div>
        </div>

        <div className="bg-[#5a0a8f] rounded-xl p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-medium text-white/80">Next Match</div>
              <div className="text-3xl font-black mt-2">12 Days</div>
              <div className="text-sm text-white/80 mt-1">28th Senior National</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center">
              <span className="material-symbols-outlined">schedule</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming tournaments */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Upcoming Tournaments</h2>
            <Link to="/events" className="text-sm font-semibold text-[#5a0a8f] hover:underline">
              View all
            </Link>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {error && (
              <div className="p-4 border-b border-gray-200 bg-red-50 text-red-700">{error}</div>
            )}

            {(loadingTournaments || loadingRegs) && <div className="p-5 text-gray-600">Loading…</div>}

            {!loadingTournaments && !loadingRegs && tournaments.length === 0 && (
              <div className="p-5 text-gray-600">No tournaments available.</div>
            )}

            {!loadingTournaments &&
              !loadingRegs &&
              tournaments.map((t, idx) => {
                const regs = myRegsByTournament.get(t._id) || []
                const playerReg = regs.find((r) => r.registerAs === 'player')
                const coachReg = regs.find((r) => r.registerAs === 'coach')
                const refereeReg = regs.find((r) => r.registerAs === 'referee')

                const location = [t.venueName, t.city].filter(Boolean).join(', ') || '—'

                const badge = (status?: string) => {
                  if (status === 'approved') return 'bg-green-100 text-green-700'
                  if (status === 'rejected') return 'bg-red-100 text-red-700'
                  if (status === 'pending') return 'bg-yellow-100 text-yellow-700'
                  return 'bg-gray-100 text-gray-700'
                }

                return (
                  <div
                    key={t._id}
                    className={idx === 0 ? 'p-5 border-b border-gray-200' : 'p-5'}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-24 h-16 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                        <TournamentThumb url={t.imageUrl} title={t.title} />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="font-bold text-gray-900">{t.title}</div>
                          {t.status && (
                            <span className="px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                              {t.status}
                            </span>
                          )}
                          {t.genderCategory && (
                            <span className="px-2 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                              {t.genderCategory === 'both'
                                ? 'Male & Female'
                                : t.genderCategory === 'male'
                                  ? 'Male'
                                  : 'Female'}
                            </span>
                          )}
                        </div>

                        <div className="text-sm text-gray-600 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                          <span className="inline-flex items-center gap-1">
                            <span className="material-symbols-outlined text-base">calendar_today</span>
                            {formatDateRange(t.startDate, t.endDate)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <span className="material-symbols-outlined text-base">location_on</span>
                            {location}
                          </span>
                        </div>

                        {(playerReg || coachReg || refereeReg) && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {playerReg && (
                              <span className={`px-2 py-1 rounded text-xs font-bold ${badge(playerReg.status)}`}>
                                Player: {playerReg.status.toUpperCase()}
                              </span>
                            )}
                            {coachReg && (
                              <span className={`px-2 py-1 rounded text-xs font-bold ${badge(coachReg.status)}`}>
                                Coach: {coachReg.status.toUpperCase()}
                              </span>
                            )}
                            {refereeReg && (
                              <span className={`px-2 py-1 rounded text-xs font-bold ${badge(refereeReg.status)}`}>
                                Referee: {refereeReg.status.toUpperCase()}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        {!playerReg && (
                          <button
                            onClick={() => void register(t._id, 'player')}
                            className="px-3 py-2 rounded-lg bg-[#5a0a8f] text-white text-sm font-semibold hover:bg-[#400466] transition-colors"
                          >
                            Register as Player
                          </button>
                        )}
                        {!coachReg && (
                          <button
                            onClick={() => void register(t._id, 'coach')}
                            className="px-3 py-2 rounded-lg border border-gray-200 text-gray-900 text-sm font-semibold hover:bg-gray-50 transition-colors"
                          >
                            Register as Coach
                          </button>
                        )}
                        {!refereeReg && (
                          <button
                            onClick={() => void register(t._id, 'referee')}
                            className="px-3 py-2 rounded-lg border border-gray-200 text-gray-900 text-sm font-semibold hover:bg-gray-50 transition-colors"
                          >
                            Register as Referee
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Recent Results</h2>
              <Link to="/player/results" className="text-sm font-semibold text-[#5a0a8f] hover:underline">
                View all
              </Link>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-gray-900">Vs. Kerala State</div>
                  <div className="text-xs text-gray-500">21 Sept 2026</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm font-bold text-gray-900">2 - 1</div>
                  <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">WIN</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-gray-900">Vs. Manipur Team A</div>
                  <div className="text-xs text-gray-500">18 Sept 2026</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm font-bold text-gray-900">0 - 2</div>
                  <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">LOST</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-gray-900">Vs. Delhi Club</div>
                  <div className="text-xs text-gray-500">15 Sept 2026</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm font-bold text-gray-900">2 - 0</div>
                  <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">WIN</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl p-6 text-white border border-gray-800">
            <div className="text-lg font-bold mb-2">Federation News</div>
            <div className="text-sm text-white/80 mb-4">
              New regulations for the upcoming season have been published. Please review them.
            </div>
            <button className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 transition-colors text-sm font-semibold">
              Read Announcement
            </button>
          </div>
        </div>
      </div>

      {/* Certificates */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">My Certificates</h2>
          <Link to="/player/certificates" className="text-sm font-semibold text-[#5a0a8f] hover:underline">
            Manage
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="w-full h-28 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center">
              <span className="text-xs font-semibold text-gray-500">PARTICIPATION</span>
            </div>
            <div className="mt-4">
              <div className="text-sm font-bold text-gray-900">Participation</div>
              <div className="text-xs text-gray-500">2026 Nationals</div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="w-full h-28 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center">
              <span className="text-xs font-semibold text-gray-500">LICENSE</span>
            </div>
            <div className="mt-4">
              <div className="text-sm font-bold text-gray-900">License</div>
              <div className="text-xs text-gray-500">Level 2</div>
            </div>
          </div>

          <button
            type="button"
            className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-6 hover:border-[#5a0a8f] transition-colors flex items-center justify-center"
          >
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-gray-500">add</span>
              </div>
              <div className="mt-3 text-sm font-semibold text-gray-700">Upload New</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
