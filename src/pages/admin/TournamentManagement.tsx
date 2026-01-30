import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../../lib/api'

type AdminTournament = {
  _id: string
  title: string
  tournamentType?: string
  description?: string
  startDate?: string
  endDate?: string
  registrationOpens?: string
  registrationCloses?: string
  venueName?: string
  city?: string
  pincode?: string
  genderCategory?: 'male' | 'female' | 'both'
  imageUrl?: string
  status?: string
  createdAt?: string
}

type TournamentRegistrationSummary = Record<
  string,
  { total: number; pending: number; approved: number; rejected: number }
>

export function TournamentManagement() {
  const [tournaments, setTournaments] = useState<AdminTournament[]>([])
  const [summary, setSummary] = useState<TournamentRegistrationSummary>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  // Handler to close registration early
  const handleCloseRegistration = async (tournamentId: string) => {
    if (!window.confirm('Are you sure you want to close registration for this tournament?')) return;
    setActionLoading(tournamentId);
    try {
      await apiRequest(`/admin/tournaments/${tournamentId}`, {
        method: 'PATCH',
        auth: true,
        body: JSON.stringify({
          status: 'REGISTRATION CLOSED',
          registrationCloses: new Date().toISOString(),
        }),
      });
      // Refresh tournaments
      const tRes = await apiRequest<{ tournaments: AdminTournament[] }>('/admin/tournaments', { auth: true });
      setTournaments(Array.isArray(tRes.tournaments) ? tRes.tournaments : []);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to close registration');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteTournament = async (tournamentId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This will permanently remove the tournament, all its registrations, matches, and teams from the database and S3.`)) return;
    setActionLoading(tournamentId);
    try {
      await apiRequest(`/admin/tournaments/${tournamentId}`, {
        method: 'DELETE',
        auth: true,
      });
      // Refresh tournaments
      setTournaments(prev => prev.filter(t => t._id !== tournamentId));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to delete tournament');
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const [tRes, sRes] = await Promise.all([
          apiRequest<{ tournaments: AdminTournament[] }>('/admin/tournaments', { auth: true }),
          apiRequest<{ byTournament: TournamentRegistrationSummary }>('/admin/tournament-registrations/summary', {
            auth: true,
          }),
        ])

        if (cancelled) return
        setTournaments(Array.isArray(tRes.tournaments) ? tRes.tournaments : [])
        setSummary(sRes.byTournament || {})
      } catch (e) {
        if (cancelled) return
        setError(e instanceof Error ? e.message : 'Failed to load tournaments')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [])

  const filteredTournaments = useMemo(() => {
    return tournaments.filter((t) => {
      const matchesSearch =
        (t.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.city || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.venueName || '').toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === 'all' || (t.status || '') === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [tournaments, searchQuery, statusFilter])

  const stats = useMemo(() => {
    const active = tournaments.filter((t) => t.status === 'REGISTRATION OPEN').length
    const totalRegistrations = tournaments.reduce((sum, t) => sum + (summary[t._id]?.total || 0), 0)
    const pendingApprovals = tournaments.reduce((sum, t) => sum + (summary[t._id]?.pending || 0), 0)
    return { active, totalRegistrations, pendingApprovals }
  }, [tournaments, summary])

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
    <div>
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
        <Link to="/admin/dashboard" className="hover:text-[#5a0a8f]">
          Home
        </Link>
        <span>›</span>
        <Link to="/admin/tournaments" className="hover:text-[#5a0a8f]">
          Tournaments
        </Link>
        <span>›</span>
        <span className="text-gray-900 font-medium">Control Panel</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">Tournament Management</h1>
          <p className="text-gray-600">Manage lifecycle, registrations, and rules for all national events.</p>
        </div>
        <Link
          to="/admin/tournaments/create"
          className="flex items-center gap-2 bg-[#5a0a8f] hover:bg-[#400466] text-white px-5 py-2.5 rounded-lg font-bold transition-colors"
        >
          <span className="material-symbols-outlined">add</span>
          Create New Tournament
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border-2 border-orange-100 p-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10">
            <span className="material-symbols-outlined text-6xl text-orange-500">emoji_events</span>
          </div>
          <div className="relative">
            <div className="text-3xl font-black text-gray-900 mb-1">{stats.active}</div>
            <div className="text-xs text-green-600 font-semibold mb-2">Active tournaments</div>
            <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Active Tournaments</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border-2 border-blue-100 p-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10">
            <span className="material-symbols-outlined text-6xl text-blue-500">groups</span>
          </div>
          <div className="relative">
            <div className="text-3xl font-black text-gray-900 mb-1">{stats.totalRegistrations}</div>
            <div className="text-sm text-gray-600 mb-2">Across all tournaments</div>
            <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Total Applications
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border-2 border-red-100 p-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10">
            <span className="material-symbols-outlined text-6xl text-red-500">calendar_today</span>
          </div>
          <div className="relative">
            <div className="text-3xl font-black text-gray-900 mb-1">{stats.pendingApprovals}</div>
            <div className="text-xs text-red-600 font-bold mb-2">! Action required</div>
            <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Pending Approvals</div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 relative w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tournament by name or ID..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none text-gray-900"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none text-gray-900 bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="REGISTRATION OPEN">Registration Open</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="TENTATIVE">Tentative</option>
          </select>
          <select className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none text-gray-900 bg-white">
            <option>2023-2024</option>
            <option>2022-2023</option>
            <option>2021-2022</option>
          </select>
          <div className="flex gap-2">
            <button className="p-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors bg-gray-50">
              <span className="material-symbols-outlined text-gray-600">view_list</span>
            </button>
            <button className="p-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="material-symbols-outlined text-gray-600">grid_view</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tournaments Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {error && (
          <div className="px-6 py-4 border-b border-gray-200 bg-red-50 text-red-700">{error}</div>
        )}
        {loading && <div className="px-6 py-6 text-gray-600">Loading…</div>}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                  TOURNAMENT NAME
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                  DATE & LOCATION
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                  CATEGORIES
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                  STATUS
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {!loading && filteredTournaments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No tournaments found.
                  </td>
                </tr>
              ) : (
                filteredTournaments.map((tournament) => {
                  const counts = summary[tournament._id] || { total: 0, pending: 0, approved: 0, rejected: 0 }
                  const pendingCount = counts.pending

                  return (
                    <tr key={tournament._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-700 font-bold">
                            {tournament.title.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{tournament.title}</div>
                            <div className="text-xs text-gray-500">ID: {tournament._id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-base">calendar_today</span>
                            {formatDateRange(tournament.startDate, tournament.endDate)}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-base">location_on</span>
                            {[tournament.venueName, tournament.city].filter(Boolean).join(', ') || '—'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">{counts.total} applications</span>
                          {pendingCount > 0 && (
                            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">
                              {pendingCount} pending
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${tournament.status === 'REGISTRATION OPEN'
                              ? 'bg-green-500'
                              : tournament.status === 'CONFIRMED'
                                ? 'bg-blue-500'
                                : 'bg-gray-500'
                              }`}
                          ></span>
                          <span
                            className={`px-2 py-1 text-xs font-bold rounded ${tournament.status === 'REGISTRATION OPEN'
                              ? 'bg-green-100 text-green-700'
                              : tournament.status === 'CONFIRMED'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700'
                              }`}
                          >
                            {tournament.status}
                          </span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <Link
                            to={`/admin/tournaments/${tournament._id}/edit`}
                            className="text-[#5a0a8f] hover:underline text-sm font-medium"
                          >
                            Edit
                          </Link>
                          <Link
                            to={`/admin/tournaments/${tournament._id}/registrations`}
                            className="text-[#5a0a8f] hover:underline text-sm font-medium"
                          >
                            View Registrations ({counts.total})
                          </Link>
                          {tournament.status === 'REGISTRATION OPEN' && (
                            <button
                              className="text-red-600 hover:underline text-sm font-medium disabled:opacity-60"
                              disabled={actionLoading === tournament._id}
                              onClick={() => handleCloseRegistration(tournament._id)}
                            >
                              {actionLoading === tournament._id ? 'Closing…' : 'Close Registration'}
                            </button>
                          )}
                          <button
                            className="text-gray-500 hover:text-red-600 transition-colors disabled:opacity-60"
                            disabled={actionLoading === tournament._id}
                            onClick={() => handleDeleteTournament(tournament._id, tournament.title)}
                            title="Delete Tournament"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
