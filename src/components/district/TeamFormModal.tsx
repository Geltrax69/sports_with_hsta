import { useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../../lib/api'
import { tournamentEventTypes } from '../../lib/eventFormat'
import {
  districtApi,
  teamTypeLabel,
  PLAYERS_REQUIRED,
  TEAM_TYPES,
  isTournamentOpen,
  type DistrictPlayer,
  type DistrictTeam,
  type TeamType,
  type TournamentOption,
} from '../../lib/districtApi'

type Props = {
  open: boolean
  onClose: () => void
  onSaved: (team: DistrictTeam) => void
  /** Pre-selected tournament (e.g. "Create Team" from the tournaments page). */
  tournament?: TournamentOption | null
  /** When set, the modal edits this team instead of creating one. */
  editingTeam?: DistrictTeam | null
}

export function TeamFormModal({ open, onClose, onSaved, tournament, editingTeam }: Props) {
  const isEdit = !!editingTeam

  const [tournaments, setTournaments] = useState<TournamentOption[]>([])
  const [loadingTournaments, setLoadingTournaments] = useState(false)

  const [tournamentId, setTournamentId] = useState('')
  const [teamType, setTeamType] = useState<TeamType | ''>('')
  const [teamName, setTeamName] = useState('')

  const [players, setPlayers] = useState<DistrictPlayer[]>([])
  const [loadingPlayers, setLoadingPlayers] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const required = teamType ? PLAYERS_REQUIRED[teamType] : 0
  const selectedPlayers = useMemo(
    () => selectedIds.map((id) => players.find((p) => p._id === id)).filter(Boolean) as DistrictPlayer[],
    [selectedIds, players],
  )

  // ── Load open tournaments (create mode, no pre-selected tournament) ────────
  useEffect(() => {
    if (!open || isEdit || tournament) return
    const controller = new AbortController()
    setLoadingTournaments(true)
    apiRequest<{ tournaments: TournamentOption[] }>('/tournaments', { signal: controller.signal })
      .then((res) => {
        if (!controller.signal.aborted) {
          setTournaments((res.tournaments || []).filter(isTournamentOpen))
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setLoadingTournaments(false)
      })
    return () => controller.abort()
  }, [open, isEdit, tournament])

  // ── Initialize form state when opened ───────────────────────────────────────
  useEffect(() => {
    if (!open) return
    setError('')
    setSearch('')
    if (editingTeam) {
      setTournamentId(editingTeam.tournament?._id || '')
      setTeamType((editingTeam.teamType as TeamType) || '')
      setTeamName(editingTeam.name || '')
      setSelectedIds((editingTeam.members || []).map((m) => m._id))
    } else {
      setTournamentId(tournament?._id || '')
      setTeamType(tournament?.eventType && TEAM_TYPES.some((t) => t.value === tournament.eventType)
        ? (tournament.eventType as TeamType)
        : '')
      setTeamName('')
      setSelectedIds([])
    }
  }, [open, editingTeam, tournament])

  // ── Load district players for selection ─────────────────────────────────────
  useEffect(() => {
    if (!open) return
    const controller = new AbortController()
    setLoadingPlayers(true)
    const t = window.setTimeout(() => {
      districtApi
        .listPlayers(search)
        .then((res) => {
          if (!controller.signal.aborted) setPlayers(res.players || [])
        })
        .catch(() => {
          if (!controller.signal.aborted) setPlayers([])
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoadingPlayers(false)
        })
    }, search ? 300 : 0)
    return () => {
      window.clearTimeout(t)
      controller.abort()
    }
  }, [open, search])

  const togglePlayer = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (teamType && prev.length >= PLAYERS_REQUIRED[teamType]) return prev
      return [...prev, id]
    })
  }

  const activeTournament: TournamentOption | undefined =
    tournament?._id === tournamentId
      ? tournament
      : tournaments.find((t) => t._id === tournamentId)

  // Team types the active tournament allows. Districts pick one when the
  // tournament mixes events; a single-event tournament locks its type.
  const allowedTeamTypes = useMemo(
    () => TEAM_TYPES.filter((t) => tournamentEventTypes(activeTournament).includes(t.value)),
    [activeTournament],
  )

  // Reset the picked team type when the tournament (or its events) change.
  useEffect(() => {
    if (isEdit) return
    setTeamType((prev) => {
      if (prev && allowedTeamTypes.some((t) => t.value === prev)) return prev
      return allowedTeamTypes.length === 1 ? allowedTeamTypes[0].value : ''
    })
    setSelectedIds([])
  }, [tournamentId, allowedTeamTypes, isEdit])

  const canSave =
    !!tournamentId && !!teamType && selectedIds.length === required && !saving

  const handleSave = async () => {
    setError('')
    if (!tournamentId) return setError('Select a tournament.')
    if (!teamType) return setError('Select a team type.')
    if (selectedIds.length !== required) {
      return setError(`Select exactly ${required} players for a ${teamTypeLabel(teamType)} team.`)
    }
    setSaving(true)
    try {
      const payload = {
        tournamentId,
        teamType: teamType as TeamType,
        name: teamName.trim() || undefined,
        memberIds: selectedIds,
      }
      const result = isEdit && editingTeam
        ? await districtApi.updateTeam(editingTeam._id, payload)
        : await districtApi.createTeam(payload)
      onSaved(result.team)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save the team. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Team' : 'Create Team'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Tournament */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Tournament <span className="text-red-500">*</span>
            </label>
            {isEdit || tournament ? (
              <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-medium">
                {tournament?.title || editingTeam?.tournament?.title || '—'}
              </div>
            ) : (
              <select
                value={tournamentId}
                onChange={(e) => setTournamentId(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none text-gray-900 bg-white"
              >
                <option value="">Select an open tournament</option>
                {tournaments.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.title}
                  </option>
                ))}
              </select>
            )}
            {loadingTournaments && <p className="text-xs text-gray-500 mt-1">Loading tournaments…</p>}
          </div>

          {/* Team type */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Team Type <span className="text-red-500">*</span>
            </label>
            {allowedTeamTypes.length > 1 && (
              <p className="text-xs text-gray-500 mb-2">
                This tournament has multiple events — pick the one this team is for.
              </p>
            )}
            <div className="grid grid-cols-3 gap-3">
              {allowedTeamTypes.map((t) => {
                const active = teamType === t.value
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => {
                      setTeamType(t.value)
                      setSelectedIds([])
                    }}
                    className={`px-4 py-3 rounded-lg border-2 transition-colors text-left ${
                      active
                        ? 'border-[#5a0a8f] bg-[#5a0a8f]/5'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className={`font-bold ${active ? 'text-[#5a0a8f]' : 'text-gray-900'}`}>{t.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{t.playersRequired} players</div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Team name */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Team Name (optional)</label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Defaults to “District Name + Team Type”"
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none text-gray-900"
            />
          </div>

          {/* Player selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-900">
                Select Players <span className="text-red-500">*</span>
              </label>
              <span
                className={`text-sm font-bold ${selectedIds.length === required && required > 0 ? 'text-green-700' : 'text-gray-600'}`}
              >
                Players Selected: {selectedIds.length} / Required: {required || '—'}
              </span>
            </div>

            <div className="relative mb-3">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                search
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search players by name or player ID…"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none text-gray-900"
              />
            </div>

            <div className="border border-gray-200 rounded-lg max-h-72 overflow-y-auto divide-y divide-gray-100">
              {loadingPlayers ? (
                <p className="px-4 py-6 text-center text-sm text-gray-500">Loading players…</p>
              ) : players.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-gray-500">
                  No approved players found for your district.
                </p>
              ) : (
                players.map((p) => {
                  const selected = selectedIds.includes(p._id)
                  return (
                    <button
                      key={p._id}
                      type="button"
                      onClick={() => togglePlayer(p._id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                        selected ? 'bg-[#5a0a8f]/5' : 'hover:bg-gray-50'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                          selected ? 'bg-[#5a0a8f] border-[#5a0a8f] text-white' : 'border-gray-300 text-transparent'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">check</span>
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block font-medium text-gray-900 truncate">{p.fullName}</span>
                        <span className="block text-xs text-gray-500">
                          {p.playerId ? `ID: ${p.playerId}` : 'ID: —'}
                          {p.gender ? ` · ${p.gender}` : ''}
                        </span>
                      </span>
                    </button>
                  )
                })
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Only approved players from your district are listed. Players are referenced from the
              existing player database — no duplicates are created.
            </p>
          </div>

          {/* Review */}
          {selectedPlayers.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-bold text-gray-900 mb-2">Review Team</h3>
              <div className="text-sm text-gray-700 space-y-1">
                <p>
                  <span className="font-semibold">Tournament:</span> {activeTournament?.title || '—'}
                </p>
                <p>
                  <span className="font-semibold">Team Type:</span> {teamTypeLabel(teamType)}
                </p>
                <p className="font-semibold pt-1">Players:</p>
                <ol className="list-decimal list-inside space-y-0.5">
                  {selectedPlayers.map((p) => (
                    <li key={p._id}>
                      {p.fullName}
                      {p.playerId ? <span className="text-gray-500"> (ID: {p.playerId})</span> : null}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 sticky bottom-0 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="px-6 py-2.5 bg-[#5a0a8f] hover:bg-[#400466] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-bold transition-colors"
          >
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Save Team'}
          </button>
        </div>
      </div>
    </div>
  )
}
