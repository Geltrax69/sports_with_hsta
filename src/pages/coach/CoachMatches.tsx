import { useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../../lib/api'

type Tournament = {
  _id: string
  title: string
  startDate?: string
  endDate?: string
  city?: string
  venueName?: string
}

type MyTournamentRegistration = {
  _id: string
  tournamentId: string
  registerAs: 'player' | 'coach' | 'referee'
  status: 'pending' | 'approved' | 'rejected'
  appliedAt: string
}

export function CoachMatches() {
  const [registrations, setRegistrations] = useState<MyTournamentRegistration[]>([])
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingTournaments, setLoadingTournaments] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const [regsRes, tRes] = await Promise.all([
          apiRequest<{ registrations: MyTournamentRegistration[] }>('/tournaments/registrations/me', { auth: true }),
          apiRequest<{ tournaments: Tournament[] }>('/tournaments')
        ])
        setRegistrations(Array.isArray(regsRes.registrations) ? regsRes.registrations : [])
        setTournaments(Array.isArray(tRes.tournaments) ? tRes.tournaments : [])
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load registrations')
      } finally {
        setLoading(false)
        setLoadingTournaments(false)
      }
    }

    void run()
  }, [])

  const coachRegs = useMemo(
    () => registrations.filter((r) => r.registerAs === 'coach'),
    [registrations]
  )

  const uniqueTournamentCount = useMemo(() => {
    const ids = new Set(coachRegs.map((r) => String(r.tournamentId)))
    return ids.size
  }, [coachRegs])

  const approvedCount = coachRegs.filter((r) => r.status === 'approved').length
  const pendingCount = coachRegs.filter((r) => r.status === 'pending').length

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

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex flex-col gap-2 mb-4">
        <h1 className="text-2xl font-black text-gray-900">My Matches</h1>
        <p className="text-gray-600">Track tournaments you are registered to coach.</p>
      </div>

      {loading ? (
        <div className="text-gray-500">Loading your registrations...</div>
      ) : error ? (
        <div className="text-red-600 text-sm font-semibold">{error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600">Tournaments Registered</div>
            <div className="text-3xl font-black text-gray-900 mt-1">{uniqueTournamentCount}</div>
            <div className="text-xs text-gray-500 mt-1">Unique tournaments you applied for</div>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600">Approved</div>
            <div className="text-3xl font-black text-green-600 mt-1">{approvedCount}</div>
            <div className="text-xs text-gray-500 mt-1">Accepted coaching slots</div>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600">Pending</div>
            <div className="text-3xl font-black text-yellow-600 mt-1">{pendingCount}</div>
            <div className="text-xs text-gray-500 mt-1">Awaiting approval</div>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg mt-6">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Your Registrations</h2>
          <p className="text-sm text-gray-600">Tournaments where you have registered as coach</p>
        </div>

        {loading || loadingTournaments ? (
          <div className="p-6 text-gray-500">Loading tournaments...</div>
        ) : coachRegs.length === 0 ? (
          <div className="p-6 text-gray-500">You have not registered for any tournaments yet.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {coachRegs.map((reg) => {
              const t = tournaments.find((x) => String(x._id) === String(reg.tournamentId))
              return (
                <div key={reg._id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="font-semibold text-gray-900">{t?.title || 'Tournament'}</div>
                    <div className="text-xs text-gray-500">{formatDateRange(t?.startDate, t?.endDate)}</div>
                    {t?.city && (
                      <div className="text-xs text-gray-500">{t.venueName ? `${t.venueName}, ` : ''}{t.city}</div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${reg.status === 'approved'
                        ? 'bg-green-100 text-green-700'
                        : reg.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                        }`}
                    >
                      {reg.status.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500">Applied {new Date(reg.appliedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}