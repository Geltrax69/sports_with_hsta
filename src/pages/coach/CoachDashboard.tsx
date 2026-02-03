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

export function CoachDashboard() {
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

  const register = async (tournamentId: string) => {
    setError(null)
    try {
      await apiRequest(`/tournaments/${tournamentId}/registrations`, {
        method: 'POST',
        auth: true,
        body: JSON.stringify({ registerAs: 'coach' }),
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

  const coachRegistrations = myRegistrations.filter((r) => r.registerAs === 'coach')
  const approvedCount = coachRegistrations.filter((r) => r.status === 'approved').length
  const pendingCount = coachRegistrations.filter((r) => r.status === 'pending').length

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">
            Welcome back, Coach {user?.name || ''}
          </h1>
          <p className="text-gray-600">Manage your team and tournament registrations.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 font-semibold hover:bg-gray-50 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">badge</span>
            Coach ID
          </button>
          <Link
            to="/coach/tournaments"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#5a0a8f] text-white font-semibold hover:bg-[#400466] transition-colors"
          >
            <span className="material-symbols-outlined text-lg">event_available</span>
            View All Tournaments
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-medium text-gray-600">Tournaments Registered</div>
              <div className="text-3xl font-black text-gray-900 mt-2">{coachRegistrations.length}</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#5a0a8f]/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#5a0a8f]">emoji_events</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-medium text-gray-600">Approved Registrations</div>
              <div className="text-3xl font-black text-gray-900 mt-2">{approvedCount}</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-green-600">check_circle</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-medium text-gray-600">Pending Approvals</div>
              <div className="text-3xl font-black text-gray-900 mt-2">{pendingCount}</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-yellow-700">hourglass_empty</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-medium text-gray-600">Team Members</div>
              <div className="text-3xl font-black text-gray-900 mt-2">0</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-blue-600">groups</span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Available Tournaments */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-gray-900">Available Tournaments</h2>
            <p className="text-sm text-gray-600 mt-1">Register as a coach for upcoming events</p>
          </div>
          <Link
            to="/coach/tournaments"
            className="text-[#5a0a8f] font-semibold text-sm hover:underline"
          >
            View All →
          </Link>
        </div>

        {loadingTournaments ? (
          <div className="p-8 text-center text-gray-500">Loading tournaments...</div>
        ) : tournaments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No tournaments available at the moment.</div>
        ) : (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.slice(0, 6).map((t) => {
              const myRegs = myRegsByTournament.get(String(t._id)) || []
              const coachReg = myRegs.find((r) => r.registerAs === 'coach')

              return (
                <div
                  key={t._id}
                  className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="h-32 bg-gray-100 flex items-center justify-center overflow-hidden">
                    <TournamentThumb url={t.imageUrl} title={t.title} />
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{t.title}</h3>
                    <div className="text-xs text-gray-500 space-y-1 mb-3">
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">calendar_month</span>
                        {formatDateRange(t.startDate, t.endDate)}
                      </div>
                      {t.venueName && (
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">location_on</span>
                          {t.venueName}, {t.city}
                        </div>
                      )}
                    </div>

                    {coachReg ? (
                      <div
                        className={`w-full px-3 py-2 rounded text-xs font-bold text-center ${
                          coachReg.status === 'approved'
                            ? 'bg-green-100 text-green-700'
                            : coachReg.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {coachReg.status === 'approved'
                          ? '✓ Registered as Coach'
                          : coachReg.status === 'pending'
                            ? '⏳ Pending Approval'
                            : '✗ Registration Rejected'}
                      </div>
                    ) : (
                      <button
                        onClick={() => register(t._id)}
                        disabled={loadingRegs}
                        className="w-full px-3 py-2 bg-[#5a0a8f] text-white rounded text-sm font-semibold hover:bg-[#400466] transition-colors disabled:opacity-50"
                      >
                        Register as Coach
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* My Registrations */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-black text-gray-900">My Tournament Registrations</h2>
          <p className="text-sm text-gray-600 mt-1">Track the status of your coaching applications</p>
        </div>

        {loadingRegs ? (
          <div className="p-8 text-center text-gray-500">Loading your registrations...</div>
        ) : coachRegistrations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            You haven't registered for any tournaments as a coach yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                    Tournament
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                    Applied On
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {coachRegistrations.map((reg) => {
                  const tournament = tournaments.find((t) => String(t._id) === String(reg.tournamentId))
                  return (
                    <tr key={reg._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">
                          {tournament?.title || 'Unknown Tournament'}
                        </div>
                        {tournament && (
                          <div className="text-xs text-gray-500">
                            {formatDateRange(tournament.startDate, tournament.endDate)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(reg.appliedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold ${
                            reg.status === 'approved'
                              ? 'bg-green-100 text-green-700'
                              : reg.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {reg.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{reg.notes || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
