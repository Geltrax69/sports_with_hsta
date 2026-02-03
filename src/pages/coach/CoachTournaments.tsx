import { useEffect, useState } from 'react'
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
  description?: string
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

export function CoachTournaments() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [myRegistrations, setMyRegistrations] = useState<MyTournamentRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | 'upcoming' | 'ongoing' | 'completed'>('all')

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [tournamentsRes, registrationsRes] = await Promise.all([
          apiRequest<{ tournaments: Tournament[] }>('/tournaments'),
          apiRequest<{ registrations: MyTournamentRegistration[] }>('/tournaments/registrations/me', { auth: true }),
        ])
        setTournaments(tournamentsRes.tournaments || [])
        setMyRegistrations(registrationsRes.registrations || [])
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    void loadData()
  }, [])

  const register = async (tournamentId: string) => {
    setError(null)
    try {
      await apiRequest(`/tournaments/${tournamentId}/registrations`, {
        method: 'POST',
        auth: true,
        body: JSON.stringify({ registerAs: 'coach' }),
      })
      const registrationsRes = await apiRequest<{ registrations: MyTournamentRegistration[] }>(
        '/tournaments/registrations/me',
        { auth: true },
      )
      setMyRegistrations(registrationsRes.registrations || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to register')
    }
  }

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

  const TournamentThumb = ({ url, title }: { url?: string; title: string }) => {
    const [failed, setFailed] = useState(false)
    if (!url || failed) {
      return <span className="material-symbols-outlined text-6xl text-gray-400">emoji_events</span>
    }
    return <img src={url} alt={title} className="w-full h-full object-cover" onError={() => setFailed(true)} />
  }

  const myRegsByTournament = new Map(
    myRegistrations.filter((r) => r.registerAs === 'coach').map((r) => [String(r.tournamentId), r]),
  )

  const filteredTournaments = tournaments.filter((t) => {
    if (filterStatus === 'all') return true
    if (filterStatus === 'upcoming') return t.status === 'upcoming'
    if (filterStatus === 'ongoing') return t.status === 'ongoing'
    if (filterStatus === 'completed') return t.status === 'completed'
    return true
  })

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">Tournaments</h1>
        <p className="text-gray-600">Browse and register for tournaments as a coach</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
      )}

      {/* Filter */}
      <div className="mb-6 flex gap-3">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            filterStatus === 'all'
              ? 'bg-[#5a0a8f] text-white'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilterStatus('upcoming')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            filterStatus === 'upcoming'
              ? 'bg-[#5a0a8f] text-white'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setFilterStatus('ongoing')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            filterStatus === 'ongoing'
              ? 'bg-[#5a0a8f] text-white'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Ongoing
        </button>
        <button
          onClick={() => setFilterStatus('completed')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            filterStatus === 'completed'
              ? 'bg-[#5a0a8f] text-white'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Completed
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading tournaments...</div>
      ) : filteredTournaments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
          No tournaments found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTournaments.map((t) => {
            const coachReg = myRegsByTournament.get(String(t._id))

            return (
              <div
                key={t._id}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                  <TournamentThumb url={t.imageUrl} title={t.title} />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{t.title}</h3>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="material-symbols-outlined text-sm">calendar_month</span>
                      {formatDateRange(t.startDate, t.endDate)}
                    </div>
                    {t.venueName && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="material-symbols-outlined text-sm">location_on</span>
                        {t.venueName}, {t.city}
                      </div>
                    )}
                    {t.genderCategory && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="material-symbols-outlined text-sm">wc</span>
                        <span className="capitalize">{t.genderCategory}</span>
                      </div>
                    )}
                  </div>

                  <div className="mb-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                        t.status === 'upcoming'
                          ? 'bg-blue-100 text-blue-700'
                          : t.status === 'ongoing'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {t.status?.toUpperCase() || 'UNKNOWN'}
                    </span>
                  </div>

                  {coachReg ? (
                    <div
                      className={`w-full px-4 py-2 rounded-lg text-sm font-bold text-center ${
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
                      className="w-full px-4 py-2 bg-[#5a0a8f] text-white rounded-lg font-semibold hover:bg-[#400466] transition-colors"
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
  )
}
