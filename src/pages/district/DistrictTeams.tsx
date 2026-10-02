import { useEffect, useState } from 'react'
import { districtApi, teamTypeLabel, type DistrictTeam } from '../../lib/districtApi'
import { TeamFormModal } from '../../components/district/TeamFormModal'
import { GenderCategoryBadge } from '../../components/GenderCategoryBadge'

const statusStyle = (status: string) => {
  switch (status) {
    case 'approved':
      return 'bg-green-100 text-green-800'
    case 'rejected':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-orange-100 text-orange-800'
  }
}

const formatDate = (value?: string) => {
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function DistrictTeams() {
  const [teams, setTeams] = useState<DistrictTeam[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTeam, setEditingTeam] = useState<DistrictTeam | null>(null)
  const [viewingTeam, setViewingTeam] = useState<DistrictTeam | null>(null)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await districtApi.listTeams()
      setTeams(res.teams || [])
    } catch {
      setError('Failed to load your teams.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const handleSaved = (team: DistrictTeam) => {
    setTeams((prev) => {
      const exists = prev.some((t) => t._id === team._id)
      return exists ? prev.map((t) => (t._id === team._id ? team : t)) : [team, ...prev]
    })
    setEditingTeam(null)
  }

  const handleDelete = async (team: DistrictTeam) => {
    if (!window.confirm(`Delete team “${team.name}”? This cannot be undone.`)) return
    try {
      await districtApi.deleteTeam(team._id)
      setTeams((prev) => prev.filter((t) => t._id !== team._id))
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Failed to delete the team.')
    }
  }

  const editable = (team: DistrictTeam) => team.status === 'pending' || team.status === 'approved'

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">My Teams</h1>
          <p className="text-gray-600">Teams created by your district for tournament entries.</p>
        </div>
        <button
          onClick={() => {
            setEditingTeam(null)
            setModalOpen(true)
          }}
          className="flex items-center gap-2 bg-[#5a0a8f] hover:bg-[#400466] text-white px-5 py-2.5 rounded-lg font-bold transition-colors"
        >
          <span className="material-symbols-outlined">add</span>
          New Team
        </button>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['TEAM NAME', 'TYPE', 'TOURNAMENT', 'PLAYERS', 'STATUS', 'CREATED', 'ACTIONS'].map((h) => (
                  <th key={h} className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">Loading teams…</td>
                </tr>
              ) : teams.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No teams yet. Create your first team for an open tournament.
                  </td>
                </tr>
              ) : (
                teams.map((team) => (
                  <tr key={team._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-900">{team.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <div>{teamTypeLabel(team.teamType)}</div>
                      <div className="mt-1">
                        <GenderCategoryBadge value={team.genderCategory} />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{team.tournament?.title || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {team.members.length}
                      <span className="text-gray-400"> / {team.maxMembers}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold capitalize ${statusStyle(team.status)}`}>
                        {team.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(team.createdAt)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setViewingTeam(team)}
                          className="text-[#5a0a8f] hover:underline text-sm font-medium"
                        >
                          View
                        </button>
                        {editable(team) && (
                          <>
                            <button
                              onClick={() => {
                                setEditingTeam(team)
                                setModalOpen(true)
                              }}
                              className="text-[#5a0a8f] hover:underline text-sm font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(team)}
                              className="text-red-600 hover:underline text-sm font-medium"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Team detail modal */}
      {viewingTeam && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Team Details</h2>
              <button
                onClick={() => setViewingTeam(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase">Team Name</div>
                  <div className="font-semibold text-gray-900">{viewingTeam.name}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase">Team Type</div>
                  <div className="font-semibold text-gray-900">{teamTypeLabel(viewingTeam.teamType)}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase">Category</div>
                  <div className="mt-1">
                    <GenderCategoryBadge value={viewingTeam.genderCategory} />
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase">Tournament</div>
                  <div className="font-semibold text-gray-900">{viewingTeam.tournament?.title || '—'}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase">Status</div>
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold capitalize ${statusStyle(viewingTeam.status)}`}>
                    {viewingTeam.status}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Players</div>
                <ol className="space-y-2">
                  {viewingTeam.members.map((m, i) => (
                    <li key={m._id} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2">
                      <span className="w-7 h-7 rounded-full bg-[#5a0a8f]/10 text-[#5a0a8f] flex items-center justify-center text-xs font-bold">
                        {i + 1}
                      </span>
                      <div>
                        <div className="font-medium text-gray-900">{m.fullName}</div>
                        <div className="text-xs text-gray-500">
                          Player ID: {m.playerId || '—'}
                          {m.gender ? ` · ${m.gender}` : ''}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      <TeamFormModal
        open={modalOpen}
        editingTeam={editingTeam}
        onClose={() => {
          setModalOpen(false)
          setEditingTeam(null)
        }}
        onSaved={handleSaved}
      />
    </div>
  )
}
