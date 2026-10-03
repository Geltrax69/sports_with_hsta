import { useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../../lib/api'
import { tournamentEventTypes } from '../../lib/eventFormat'
import {
  GENDER_OPTIONS,
  normalizeTeamGenderCategory,
  tournamentGenderCategories,
} from '../../lib/tournamentFormOptions'
import { GenderSegmentedControl } from '../admin/TournamentEventFields'
import { GenderCategoryBadge } from '../GenderCategoryBadge'
import { PlayerAvatar } from '../PlayerAvatar'
import {
  districtApi,
  teamTypeLabel,
  MIN_PLAYERS_REQUIRED,
  TEAM_TYPES,
  isTournamentOpen,
  GENDER_CATEGORY_LABELS,
  type DistrictCoach,
  type DistrictReferee,
  type DistrictPlayer,
  type DistrictTeam,
  type GenderCategory,
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
  const [genderCategory, setGenderCategory] = useState<GenderCategory>('mixed')
  const [teamName, setTeamName] = useState('')

  const [players, setPlayers] = useState<DistrictPlayer[]>([])
  const [loadingPlayers, setLoadingPlayers] = useState(false)
  const [search, setSearch] = useState('')
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all')
  // Players picked per team (event type + category), keyed "regu|male". In
  // create mode a district can fill Regu Male, Regu Female, Doubles Male…
  // in one go and save one team each. A player may be in several of them
  // (e.g. the same player in the Regu and the Doubles team).
  const [selectedByCat, setSelectedByCat] = useState<Record<string, string[]>>({})
  const selKey = `${teamType}|${genderCategory}`
  const selectedIds = useMemo(() => selectedByCat[selKey] || [], [selectedByCat, selKey])
  // Editing one team: switching type/category carries its picks along.
  const moveEditPicks = (nextKey: string) => {
    if (!isEdit) return
    setSelectedByCat((prev) => ({ [nextKey]: prev[selKey] || [] }))
    setCoachByKey((prev) => ({ [nextKey]: prev[selKey] || '' }))
    setRefereeByKey((prev) => ({ [nextKey]: prev[selKey] || '' }))
    setManagerByKey((prev) => ({ [nextKey]: prev[selKey] || '' }))
  }

  // Team coach per team (same key as the player picks). Optional; one coach
  // may be picked for several teams (e.g. Regu and Doubles).
  const [coaches, setCoaches] = useState<DistrictCoach[]>([])
  const [coachByKey, setCoachByKey] = useState<Record<string, string>>({})
  const coachName = (id?: string) => coaches.find((c) => c._id === id)?.fullName
  // Team referee (district's approved referees) and manager (typed name),
  // one each per team, kept per team like the coach.
  const [referees, setReferees] = useState<DistrictReferee[]>([])
  const [refereeByKey, setRefereeByKey] = useState<Record<string, string>>({})
  const [managerByKey, setManagerByKey] = useState<Record<string, string>>({})
  const refereeName = (id?: string) => referees.find((r) => r._id === id)?.fullName

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const minRequired = teamType ? MIN_PLAYERS_REQUIRED[teamType] : 0

  // Default the gender filter to the team's category (still overridable).
  useEffect(() => {
    setGenderFilter(genderCategory === 'male' ? 'male' : genderCategory === 'female' ? 'female' : 'all')
  }, [genderCategory])

  // In edit mode the previously selected members must stay visible even if
  // they are missing from the loaded player list.
  const displayPlayers = useMemo(() => {
    const ids = new Set(players.map((p) => p._id))
    const missing: DistrictPlayer[] = (editingTeam?.members || [])
      .filter((m) => !ids.has(m._id))
      .map((m) => ({ _id: m._id, fullName: m.fullName, playerId: m.playerId, gender: m.gender, profilePhoto: m.profilePhoto }))
    return [...missing, ...players]
  }, [players, editingTeam])

  // Gender filter for the picker; already-selected players always stay visible.
  // A Male only / Female only team can never take the other gender, so those
  // players are hidden (the backend rejects them anyway).
  const filteredPlayers = useMemo(() => {
    const g = (p: DistrictPlayer) => (p.gender || '').toLowerCase()
    const eligible = genderCategory === 'mixed'
      ? displayPlayers
      : displayPlayers.filter((p) => !g(p) || g(p) === genderCategory || selectedIds.includes(p._id))
    if (genderFilter === 'all') return eligible
    return eligible.filter((p) => selectedIds.includes(p._id) || g(p) === genderFilter)
  }, [displayPlayers, genderFilter, selectedIds, genderCategory])

  const selectedPlayers = useMemo(
    () => selectedIds.map((id) => displayPlayers.find((p) => p._id === id)).filter(Boolean) as DistrictPlayer[],
    [selectedIds, displayPlayers],
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
      const cat = normalizeTeamGenderCategory(editingTeam.genderCategory)
      setGenderCategory(cat)
      setTeamName(editingTeam.name || '')
      const key = `${editingTeam.teamType || ''}|${cat}`
      setSelectedByCat({ [key]: (editingTeam.members || []).map((m) => m._id) })
      setCoachByKey({ [key]: editingTeam.coach?._id || '' })
      setRefereeByKey({ [key]: editingTeam.referee?._id || '' })
      setManagerByKey({ [key]: editingTeam.manager || '' })
    } else {
      setTournamentId(tournament?._id || '')
      setTeamType(tournament?.eventType && TEAM_TYPES.some((t) => t.value === tournament.eventType)
        ? (tournament.eventType as TeamType)
        : '')
      const cats = tournamentGenderCategories(tournament || {})
      setGenderCategory(cats.length === 1 ? cats[0] : cats.includes('male') ? 'male' : cats[0])
      setTeamName('')
      setSelectedByCat({}); setCoachByKey({}); setRefereeByKey({}); setManagerByKey({})
    }
  }, [open, editingTeam, tournament])

  // ── Load district coaches (team coach picker) ──────────────────────────────
  useEffect(() => {
    if (!open) return
    let alive = true
    districtApi.listCoaches()
      .then((res) => { if (alive) setCoaches(res.coaches || []) })
      .catch(() => { if (alive) setCoaches([]) })
    districtApi.listReferees()
      .then((res) => { if (alive) setReferees(res.referees || []) })
      .catch(() => { if (alive) setReferees([]) })
    return () => { alive = false }
  }, [open])

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
    // No upper cap: districts may register larger squads (incl. substitutes).
    setSelectedByCat((prev) => {
      const cur = prev[selKey] || []
      return { ...prev, [selKey]: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] }
    })
  }

  // Teams this save will create: every type + category with players picked.
  const pendingTeams = useMemo(
    () => Object.entries(selectedByCat)
      .filter(([, ids]) => ids.length > 0)
      .map(([key, ids]) => {
        const [type, category] = key.split('|') as [TeamType, GenderCategory]
        return { key, type, category, ids, min: MIN_PLAYERS_REQUIRED[type] ?? 0 }
      })
      .filter((t) => t.min > 0),
    [selectedByCat],
  )
  const pendingLabel = (t: { type: TeamType; category: GenderCategory }) =>
    allowedGenders.length > 1 ? `${teamTypeLabel(t.type)} ${GENDER_CATEGORY_LABELS[t.category]}` : teamTypeLabel(t.type)

  const activeTournament: TournamentOption | undefined =
    tournament?._id === tournamentId
      ? tournament
      : tournaments.find((t) => t._id === tournamentId) ??
        // Editing from My Teams: the tournament list isn't loaded, but the team
        // carries its tournament (events + categories), so Mixed etc. only
        // show when the tournament offers them.
        (editingTeam?.tournament?._id === tournamentId ? (editingTeam.tournament as TournamentOption) : undefined)

  // Team types the active tournament allows. Districts pick one when the
  // tournament mixes events; a single-event tournament locks its type.
  const allowedTeamTypes = useMemo(
    () => TEAM_TYPES.filter((t) => tournamentEventTypes(activeTournament).includes(t.value)),
    [activeTournament],
  )

  // Participation categories the active tournament offers. A district may
  // register one team per category per event type (e.g. a male Regu team and
  // a female Regu team).
  const allowedGenders = useMemo(
    () => tournamentGenderCategories(activeTournament || {}),
    [activeTournament],
  )

  // Reset the picked team type when the tournament (or its events) change.
  useEffect(() => {
    if (isEdit) return
    setTeamType((prev) => {
      if (prev && allowedTeamTypes.some((t) => t.value === prev)) return prev
      return allowedTeamTypes.length === 1 ? allowedTeamTypes[0].value : ''
    })
    // Keep the team category inside the tournament's participation.
    setGenderCategory((prev) => {
      if (allowedGenders.includes(prev)) return prev
      return allowedGenders.includes('male') ? 'male' : allowedGenders[0]
    })
    setSelectedByCat({}); setCoachByKey({}); setRefereeByKey({}); setManagerByKey({})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId, allowedTeamTypes, isEdit])

  const canSave =
    !!tournamentId && !saving && pendingTeams.length > 0 && pendingTeams.every((t) => t.ids.length >= t.min)

  const handleSave = async () => {
    setError('')
    if (!tournamentId) return setError('Select a tournament.')
    if (pendingTeams.length === 0) return setError(teamType ? `Select at least ${minRequired} players.` : 'Select a team type.')
    const short = pendingTeams.find((t) => t.ids.length < t.min)
    if (short) {
      const which = pendingTeams.length > 1 ? ` (${pendingLabel(short)} team)` : ''
      return setError(`Select at least ${short.min} players for a ${teamTypeLabel(short.type)} team${which}. You can add more as substitutes.`)
    }
    setSaving(true)
    // Saved one by one; a saved team is dropped from the form so a retry after
    // an error doesn't create it twice.
    try {
      for (const t of pendingTeams) {
        const name = teamName.trim()
        const payload = {
          tournamentId,
          teamType: t.type,
          genderCategory: t.category,
          name: name ? (pendingTeams.length > 1 ? `${name} (${pendingLabel(t)})` : name) : undefined,
          memberIds: t.ids,
          // Edit sends null to clear; create omits an unset coach.
          coachId: coachByKey[t.key] || (isEdit ? null : undefined),
          refereeId: refereeByKey[t.key] || (isEdit ? null : undefined),
          manager: (managerByKey[t.key] || '').trim() || (isEdit ? '' : undefined),
        }
        const result = isEdit && editingTeam
          ? await districtApi.updateTeam(editingTeam._id, payload)
          : await districtApi.createTeam(payload)
        onSaved(result.team)
        setSelectedByCat((prev) => {
          const next = { ...prev }
          delete next[t.key]
          return next
        })
      }
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
                      // Picks are kept per type, so switching back restores them.
                      moveEditPicks(`${t.value}|${genderCategory}`)
                      setTeamType(t.value)
                    }}
                    className={`px-4 py-3 rounded-lg border-2 transition-colors text-left ${
                      active
                        ? 'border-[#5a0a8f] bg-[#5a0a8f]/5'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className={`font-bold ${active ? 'text-[#5a0a8f]' : 'text-gray-900'}`}>{t.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">min {t.playersRequired} players</div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Gender category for this team */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Team Category <span className="text-red-500">*</span>
            </label>
            {(() => {
              if (allowedGenders.length === 1) {
                const only = allowedGenders[0]
                return (
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-medium">
                    {GENDER_CATEGORY_LABELS[only]} <span className="text-gray-500 font-normal">— set by the tournament</span>
                  </div>
                )
              }
              const options = GENDER_OPTIONS.filter((o) => allowedGenders.includes(o.value))
              return (
                <GenderSegmentedControl
                  value={genderCategory}
                  onChange={(next) => {
                    moveEditPicks(`${teamType}|${next}`)
                    setGenderCategory(next)
                  }}
                  options={options}
                />
              )
            })()}
            {!isEdit && (allowedGenders.length > 1 || allowedTeamTypes.length > 1) && (
              <p className="text-xs text-gray-500 mt-2">
                Registering more than one team? Pick players under each team type and category —
                each one with players becomes its own team when you save. A player can be in
                more than one team (e.g. Regu and Doubles).
              </p>
            )}
            {!isEdit && pendingTeams.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {pendingTeams.map((t) => (
                  <span
                    key={t.key}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                      t.ids.length >= t.min
                        ? 'bg-green-50 border-green-200 text-green-800'
                        : 'bg-amber-50 border-amber-200 text-amber-800'
                    }`}
                  >
                    {pendingLabel(t)} team: {t.ids.length} player{t.ids.length === 1 ? '' : 's'}
                    {t.ids.length < t.min ? ` (need ${t.min})` : ' ✓'}
                    {coachName(coachByKey[t.key]) ? ` · Coach: ${coachName(coachByKey[t.key])}` : ''}
                    {refereeName(refereeByKey[t.key]) ? ` · Referee: ${refereeName(refereeByKey[t.key])}` : ''}
                    {managerByKey[t.key]?.trim() ? ` · Manager: ${managerByKey[t.key].trim()}` : ''}
                  </span>
                ))}
              </div>
            )}
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

          {/* Team coach */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Team Coach (optional)
              {!isEdit && teamType && (allowedGenders.length > 1 || allowedTeamTypes.length > 1) && (
                <span className="font-normal text-gray-500"> — for the {pendingLabel({ type: teamType, category: genderCategory })} team</span>
              )}
            </label>
            <select
              value={coachByKey[selKey] || ''}
              onChange={(e) => setCoachByKey((prev) => ({ ...prev, [selKey]: e.target.value }))}
              disabled={!teamType}
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none text-gray-900 bg-white disabled:bg-gray-50"
            >
              <option value="">No coach</option>
              {coaches.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.fullName}{c.coachId ? ` (${c.coachId})` : ''}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {coaches.length === 0
                ? 'No approved coaches in your district yet.'
                : 'Approved coaches from your district. The same coach can coach more than one team.'}
            </p>
          </div>

          {/* Team referee + manager */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Team Referee (optional)</label>
              <select
                value={refereeByKey[selKey] || ''}
                onChange={(e) => setRefereeByKey((prev) => ({ ...prev, [selKey]: e.target.value }))}
                disabled={!teamType}
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none text-gray-900 bg-white disabled:bg-gray-50"
              >
                <option value="">No referee</option>
                {referees.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.fullName}{r.refereeId ? ` (${r.refereeId})` : ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {referees.length === 0 ? 'No approved referees in your district yet.' : 'Approved referees from your district.'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Team Manager (optional)</label>
              <input
                type="text"
                value={managerByKey[selKey] || ''}
                onChange={(e) => setManagerByKey((prev) => ({ ...prev, [selKey]: e.target.value }))}
                disabled={!teamType}
                maxLength={120}
                placeholder="Manager's full name"
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none text-gray-900 disabled:bg-gray-50"
              />
            </div>
          </div>

          {/* Player selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-900">
                Select Players <span className="text-red-500">*</span>
              </label>
              <span
                className={`text-sm font-bold ${selectedIds.length >= minRequired && minRequired > 0 ? 'text-green-700' : 'text-gray-600'}`}
              >
                Players Selected: {selectedIds.length}
                {minRequired > 0 && <span className="font-medium text-gray-500"> (min {minRequired})</span>}
              </span>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <div className="relative flex-1">
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
              <div className="flex rounded-lg border border-gray-300 overflow-hidden flex-shrink-0" role="group" aria-label="Filter by gender">
                {(['all', 'male', 'female'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGenderFilter(g)}
                    className={`px-3 py-2.5 text-xs font-bold capitalize transition-colors ${
                      genderFilter === g
                        ? 'bg-[#5a0a8f] text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg max-h-72 overflow-y-auto divide-y divide-gray-100">
              {loadingPlayers ? (
                <p className="px-4 py-6 text-center text-sm text-gray-500">Loading players…</p>
              ) : filteredPlayers.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-gray-500">
                  No approved players found for your district.
                </p>
              ) : (
                filteredPlayers.map((p) => {
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
                      <PlayerAvatar photo={p.profilePhoto} name={p.fullName} />
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
                <p className="flex items-center gap-2">
                  <span className="font-semibold">Category:</span>
                  <GenderCategoryBadge value={genderCategory} />
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
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : pendingTeams.length > 1 ? `Save ${pendingTeams.length} Teams` : 'Save Team'}
          </button>
        </div>
      </div>
    </div>
  )
}
