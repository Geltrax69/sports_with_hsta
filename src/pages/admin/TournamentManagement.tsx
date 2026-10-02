import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../../lib/api'
import { eventTypesLabel, tournamentEventTypes } from '../../lib/eventFormat'

type AdminTournament = {
  _id: string
  title: string
  tournamentType?: string
  eventType?: string
  eventTypes?: string[]
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

type IconName =
  | 'add'
  | 'emoji_events'
  | 'groups'
  | 'calendar_today'
  | 'search'
  | 'view_list'
  | 'grid_view'
  | 'location_on'
  | 'delete'

function AdminIcon({ name, className = '' }: { name: IconName; className?: string }) {
  const base = 'inline-block shrink-0 align-middle'

  switch (name) {
    case 'add':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={`${base} ${className}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      )
    case 'emoji_events':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={`${base} ${className}`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 4h10v3a5 5 0 0 1-10 0V4Z" />
          <path d="M9 12a6 6 0 0 0 6 0" />
          <path d="M9 17h6" />
          <path d="M10 19h4" />
          <path d="M7 5H4a2 2 0 0 0 2 4h1" />
          <path d="M17 5h3a2 2 0 0 1-2 4h-1" />
        </svg>
      )
    case 'groups':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={`${base} ${className}`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 11a3 3 0 1 0-0.001-6.001A3 3 0 0 0 9 11Z" />
          <path d="M16 12a2.5 2.5 0 1 0-.001-5.001A2.5 2.5 0 0 0 16 12Z" />
          <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
          <path d="M13.5 20a4.5 4.5 0 0 1 7 0" />
        </svg>
      )
    case 'calendar_today':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={`${base} ${className}`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="5" width="16" height="15" rx="2" />
          <path d="M8 3v4M16 3v4M4 9h16" />
        </svg>
      )
    case 'search':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={`${base} ${className}`} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="6.5" />
          <path d="M16.2 16.2 20 20" />
        </svg>
      )
    case 'view_list':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={`${base} ${className}`} fill="currentColor">
          <rect x="4" y="6" width="3" height="3" rx="0.6" />
          <rect x="4" y="10.5" width="3" height="3" rx="0.6" />
          <rect x="4" y="15" width="3" height="3" rx="0.6" />
          <rect x="9" y="6.7" width="11" height="1.6" rx="0.8" />
          <rect x="9" y="11.2" width="11" height="1.6" rx="0.8" />
          <rect x="9" y="15.7" width="11" height="1.6" rx="0.8" />
        </svg>
      )
    case 'grid_view':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={`${base} ${className}`} fill="currentColor">
          <rect x="4" y="4" width="6" height="6" rx="1" />
          <rect x="14" y="4" width="6" height="6" rx="1" />
          <rect x="4" y="14" width="6" height="6" rx="1" />
          <rect x="14" y="14" width="6" height="6" rx="1" />
        </svg>
      )
    case 'location_on':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={`${base} ${className}`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 21s5-4.35 5-9a5 5 0 1 0-10 0c0 4.65 5 9 5 9Z" />
          <circle cx="12" cy="12" r="1.8" />
        </svg>
      )
    case 'delete':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={`${base} ${className}`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 7h16" />
          <path d="M9 7V5h6v2" />
          <path d="M7 7l1 12h8l1-12" />
          <path d="M10 11v5M14 11v5" />
        </svg>
      )
    default:
      return null
  }
}

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
          <AdminIcon name="add" className="size-5" />
          Create New Tournament
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border-2 border-orange-100 p-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10">
            <AdminIcon name="emoji_events" className="size-14 text-orange-500" />
          </div>
          <div className="relative">
            <div className="text-3xl font-black text-gray-900 mb-1">{stats.active}</div>
            <div className="text-xs text-green-600 font-semibold mb-2">Active tournaments</div>
            <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Active Tournaments</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border-2 border-blue-100 p-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10">
            <AdminIcon name="groups" className="size-14 text-blue-500" />
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
            <AdminIcon name="calendar_today" className="size-14 text-red-500" />
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
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="flex-1 relative w-full">
            <AdminIcon name="search" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tournament by name or ID..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none text-gray-900 placeholder-gray-500 text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none text-gray-900 bg-white text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="REGISTRATION OPEN">Registration Open</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="TENTATIVE">Tentative</option>
            <option value="COMPLETED">Completed</option>
          </select>
          <select className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none text-gray-900 bg-white text-sm">
            <option>2023-2024</option>
            <option>2022-2023</option>
            <option>2021-2022</option>
          </select>
          <div className="flex gap-2">
            <button className="p-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors bg-gray-50">
              <AdminIcon name="view_list" className="size-5 text-gray-600" />
            </button>
            <button className="p-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors bg-gray-50">
              <AdminIcon name="grid_view" className="size-5 text-gray-600" />
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
                            <div className="mt-1 flex flex-wrap gap-1">
                              {tournamentEventTypes(tournament).map((et) => (
                                <span
                                  key={et}
                                  className="rounded-full bg-[#5a0a8f]/10 px-2 py-px text-[11px] font-bold text-[#5a0a8f]"
                                >
                                  {eventTypesLabel({ eventTypes: [et] })}
                                </span>
                              ))}
                            </div>
                            <div className="mt-1 text-xs text-gray-500">ID: {tournament._id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <AdminIcon name="calendar_today" className="size-4 text-gray-600" />
                            {formatDateRange(tournament.startDate, tournament.endDate)}
                          </div>
                          <div className="flex items-center gap-2">
                            <AdminIcon name="location_on" className="size-4 text-gray-600" />
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
                                : tournament.status === 'COMPLETED'
                                  ? 'bg-amber-500'
                                  : 'bg-gray-500'
                              }`}
                          ></span>
                          <span
                            className={`px-2 py-1 text-xs font-bold rounded ${tournament.status === 'REGISTRATION OPEN'
                              ? 'bg-green-100 text-green-700'
                              : tournament.status === 'CONFIRMED'
                                ? 'bg-blue-100 text-blue-700'
                                : tournament.status === 'COMPLETED'
                                  ? 'bg-amber-100 text-amber-700 font-black'
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
                            <AdminIcon name="delete" className="size-5" />
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
