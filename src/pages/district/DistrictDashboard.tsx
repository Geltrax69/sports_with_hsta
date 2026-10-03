import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiRequest } from '../../lib/api'
import { districtApi, teamTypeLabel, isTournamentOpen, type DistrictProfile, type DistrictTeam, type TournamentOption } from '../../lib/districtApi'

export function DistrictDashboard() {
  const [profile, setProfile] = useState<DistrictProfile | null>(null)
  const [teams, setTeams] = useState<DistrictTeam[]>([])
  const [openCount, setOpenCount] = useState(0)
  const [playerCount, setPlayerCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      try {
        const [profileRes, teamsRes, tournamentsRes, playersRes] = await Promise.all([
          districtApi.getProfile(),
          districtApi.listTeams(),
          apiRequest<{ tournaments: TournamentOption[] }>('/tournaments', { signal: controller.signal }),
          districtApi.listPlayers(),
        ])
        if (controller.signal.aborted) return
        setProfile(profileRes.district)
        setTeams(teamsRes.teams || [])
        setOpenCount((tournamentsRes.tournaments || []).filter(isTournamentOpen).length)
        setPlayerCount(playersRes.count || 0)
      } catch {
        // Leave defaults; page still renders.
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [])

  const pendingTeams = teams.filter((t) => t.status === 'pending').length
  const draftTeams = teams.filter((t) => t.isDraft).length

  const stats = [
    { label: 'My Teams', value: teams.length, icon: 'groups', color: 'text-[#5a0a8f]' },
    { label: 'Open Tournaments', value: openCount, icon: 'event', color: 'text-green-600' },
    { label: 'Approved Players', value: playerCount, icon: 'person', color: 'text-blue-600' },
    { label: 'Pending Approval', value: pendingTeams, icon: 'hourglass_empty', color: 'text-orange-500' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">
          {loading ? 'District Dashboard' : `Welcome, ${profile?.name || 'District'}`}
        </h1>
        <p className="text-gray-600">
          Manage your district's teams and register them into open tournaments.
        </p>
      </div>

      {draftTeams > 0 && (
        <Link
          to="/district/teams"
          className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-wrap items-center justify-between gap-3 hover:bg-amber-100 transition-colors"
        >
          <span className="text-sm text-amber-900">
            <b>{draftTeams} saved team{draftTeams > 1 ? 's' : ''} not confirmed yet.</b> Confirm them in My Teams — full and final.
          </span>
          <span className="text-sm font-bold text-[#5a0a8f]">Confirm now →</span>
        </Link>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className={`material-symbols-outlined text-3xl ${s.color}`}>{s.icon}</span>
            </div>
            <div className="text-3xl font-black text-gray-900 mb-1">{loading ? '—' : s.value}</div>
            <div className="text-sm text-gray-600">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Link
          to="/district/tournaments"
          className="bg-white rounded-xl border border-gray-200 p-6 hover:border-[#5a0a8f] transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-gray-900 text-lg mb-1">View Tournaments</div>
              <div className="text-sm text-gray-600">Browse tournaments and register teams while entries are open.</div>
            </div>
            <span className="material-symbols-outlined text-3xl text-gray-300 group-hover:text-[#5a0a8f] transition-colors">
              arrow_forward
            </span>
          </div>
        </Link>
        <Link
          to="/district/teams"
          className="bg-white rounded-xl border border-gray-200 p-6 hover:border-[#5a0a8f] transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-gray-900 text-lg mb-1">Manage Teams</div>
              <div className="text-sm text-gray-600">Create Regu, Doubles and Quad teams from your player database.</div>
            </div>
            <span className="material-symbols-outlined text-3xl text-gray-300 group-hover:text-[#5a0a8f] transition-colors">
              arrow_forward
            </span>
          </div>
        </Link>
      </div>

      {/* Recent teams */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Recent Teams</h2>
          <Link to="/district/teams" className="text-sm font-semibold text-[#5a0a8f] hover:underline">
            View all
          </Link>
        </div>
        {loading ? (
          <p className="px-6 py-8 text-center text-gray-500 text-sm">Loading…</p>
        ) : teams.length === 0 ? (
          <p className="px-6 py-8 text-center text-gray-500 text-sm">
            No teams yet.{' '}
            <Link to="/district/tournaments" className="text-[#5a0a8f] font-semibold hover:underline">
              Browse open tournaments
            </Link>{' '}
            to create your first team.
          </p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {teams.slice(0, 5).map((t) => (
              <li key={t._id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900">{t.name}</div>
                  <div className="text-xs text-gray-500">
                    {teamTypeLabel(t.teamType)} · {t.tournament?.title || '—'} · {t.members.length} players
                  </div>
                </div>
                <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold capitalize bg-gray-100 text-gray-700">
                  {t.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
