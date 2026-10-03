import { useEffect, useRef, useState } from 'react'
import { districtApi, teamTypeLabel, type DistrictTeam } from '../../lib/districtApi'
import { TeamFormModal } from '../../components/district/TeamFormModal'
import { GenderCategoryBadge } from '../../components/GenderCategoryBadge'
import { PlayerAvatar } from '../../components/PlayerAvatar'

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

  // Saving a slot again replaces its draft, so swap by id.
  const handleSaved = (team: DistrictTeam) =>
    setTeams((prev) => [team, ...prev.filter((t) => t._id !== team._id)])

  // ── Confirm drafts (full and final) ─────────────────────────────────────────
  const drafts = teams.filter((t) => t.isDraft)
  const [confirmIds, setConfirmIds] = useState<string[] | null>(null)
  const [confirmBusy, setConfirmBusy] = useState(false)
  const busyRef = useRef(false) // blocks double clicks before re-render
  const toConfirm = teams.filter((t) => confirmIds?.includes(t._id))

  const confirmTeams = async () => {
    if (!confirmIds?.length || busyRef.current) return
    busyRef.current = true
    setConfirmBusy(true)
    try {
      const res = await districtApi.confirmTeams(confirmIds)
      const byId = new Map(res.teams.map((t) => [t._id, t]))
      setTeams((prev) => prev.map((t) => byId.get(t._id) ?? t))
      setConfirmIds(null)
      setNotice(`${res.teams.length > 1 ? `${res.teams.length} teams` : `“${res.teams[0]?.name}”`} confirmed — full and final.`)
      window.setTimeout(() => setNotice(''), 6000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm. Please try again.')
    } finally {
      busyRef.current = false
      setConfirmBusy(false)
    }
  }

  const discardDraft = async (team: DistrictTeam) => {
    if (!window.confirm(`Discard the draft “${team.name}”?`)) return
    try {
      await districtApi.deleteDraft(team._id)
      setTeams((prev) => prev.filter((t) => t._id !== team._id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to discard the draft.')
    }
  }
  const [notice, setNotice] = useState('')

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">My Teams</h1>
          <p className="text-gray-600">Teams created by your district for tournament entries.</p>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base">lock</span>
            Confirmed teams are final and can only be viewed. Contact the HSTA admin for any correction.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-[#5a0a8f] hover:bg-[#400466] text-white px-5 py-2.5 rounded-lg font-bold transition-colors"
        >
          <span className="material-symbols-outlined">add</span>
          New Team
        </button>
      </div>

      {notice && (
        <div role="status" className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800 flex items-center gap-2">
          <span className="material-symbols-outlined text-green-600">check_circle</span>
          {notice}
        </div>
      )}

      {drafts.length > 0 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-amber-900">
            <b>{drafts.length} saved team{drafts.length > 1 ? 's' : ''} waiting for confirmation.</b> Teams count
            only after you confirm them — once confirmed they're full and final.
          </div>
          <button
            type="button"
            onClick={() => setConfirmIds(drafts.map((t) => t._id))}
            className="px-5 py-2 bg-[#5a0a8f] hover:bg-[#400466] text-white rounded-lg font-bold text-sm"
          >
            Review &amp; confirm {drafts.length > 1 ? `all ${drafts.length}` : ''}
          </button>
        </div>
      )}

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
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{team.name}</div>
                      {(team.coach || team.referee || team.manager) && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          {[
                            team.coach && `Coach: ${team.coach.fullName}`,
                            team.referee && `Referee: ${team.referee.fullName}`,
                            team.manager && `Manager: ${team.manager}`,
                          ].filter(Boolean).join(' · ')}
                        </div>
                      )}
                    </td>
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
                      {team.isDraft ? (
                        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                          Draft · not confirmed
                        </span>
                      ) : (
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold capitalize ${statusStyle(team.status)}`}>
                          {team.status === 'approved' ? 'Confirmed' : team.status}
                        </span>
                      )}
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
                        {team.isDraft && (
                          <>
                            <button
                              onClick={() => setConfirmIds([team._id])}
                              className="text-green-700 hover:underline text-sm font-bold"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => discardDraft(team)}
                              className="text-red-600 hover:underline text-sm font-medium"
                            >
                              Discard
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
                  <div className="text-xs font-semibold text-gray-500 uppercase">Referee</div>
                  <div className="font-semibold text-gray-900">
                    {viewingTeam.referee
                      ? `${viewingTeam.referee.fullName}${viewingTeam.referee.refereeId ? ` (${viewingTeam.referee.refereeId})` : ''}`
                      : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase">Manager</div>
                  <div className="font-semibold text-gray-900">{viewingTeam.manager || '—'}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase">Coach</div>
                  <div className="font-semibold text-gray-900">
                    {viewingTeam.coach
                      ? `${viewingTeam.coach.fullName}${viewingTeam.coach.coachId ? ` (${viewingTeam.coach.coachId})` : ''}`
                      : '—'}
                  </div>
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
                      <PlayerAvatar photo={m.profilePhoto} name={m.fullName} size="sm" />
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

      {/* Final confirmation */}
      {confirmIds && toConfirm.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div role="alertdialog" aria-labelledby="confirm-final-title" className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 id="confirm-final-title" className="text-xl font-bold text-gray-900">
              Please confirm {toConfirm.length > 1 ? `these ${toConfirm.length} teams` : 'this team'}
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              {toConfirm.map((t) => (
                <li key={t._id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="font-semibold text-gray-900">{t.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {[
                      t.tournament?.title,
                      `${t.members.length} players`,
                      t.coach && `Coach: ${t.coach.fullName}`,
                      t.referee && `Referee: ${t.referee.fullName}`,
                      t.manager && `Manager: ${t.manager}`,
                    ].filter(Boolean).join(' · ')}
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-900">
              <b>Full and final:</b> once confirmed, {toConfirm.length > 1 ? 'these teams' : 'this team'} can't be
              edited, replaced or deleted for this tournament. Contact the HSTA admin for any correction.
            </p>
            <div className="flex items-center justify-end gap-3 mt-5">
              <button
                type="button"
                onClick={() => setConfirmIds(null)}
                disabled={confirmBusy}
                className="px-5 py-2.5 border-2 border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmTeams}
                disabled={confirmBusy}
                aria-busy={confirmBusy}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#5a0a8f] hover:bg-[#400466] disabled:opacity-60 text-white rounded-lg font-bold"
              >
                {confirmBusy && <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" aria-hidden="true" />}
                {confirmBusy ? 'Confirming…' : 'Confirm — full and final'}
              </button>
            </div>
          </div>
        </div>
      )}

      <TeamFormModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={handleSaved} />
    </div>
  )
}
