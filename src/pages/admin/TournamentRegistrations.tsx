import { Link, useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { apiRequest, getAuthToken } from '../../lib/api'
import { formatPersonListId, formatRegistrationDisplayId } from '../../lib/memberId'
import { resolveDistrictName } from '../../lib/districtDisplay'
import { UpdateScoreModal } from '../../components/admin/UpdateScoreModal'
import { ScorecardRemarksModal } from '../../components/admin/ScorecardRemarksModal'
import { useDistricts } from '../../context/DistrictsContext'
import { ListPagination } from '../../components/ListPagination'
import { fieldClass, selectClass } from '../../lib/formStyles'
import { eventTypeLabel, tournamentEventTypes, type EventType } from '../../lib/eventFormat'
import { GenderCategoryBadge } from '../../components/GenderCategoryBadge'

const squadLimitsForEvent = (eventType: EventType) => {
  const starters = ({ regu: 3, double: 2, quad: 4 }[eventType] ?? 3)
  const subs = 2
  return { starters, subs, total: starters + subs }
}

const formatMatchMetaLine = (match: Match) => {
  const parts: string[] = []
  if (match.date) parts.push(match.date)
  if (match.time) parts.push(match.time)
  parts.push(match.status || 'scheduled')
  if (match.scorecard?.round?.trim()) parts.push(`Round ${match.scorecard.round.trim()}`)
  if (match.scorecard?.matchNo?.trim()) parts.push(`Match #${match.scorecard.matchNo.trim()}`)
  if (match.score && (match.status === 'completed' || match.winner)) {
    parts.push(`Score ${match.score.team1}–${match.score.team2}`)
  }
  return parts.join(' · ')
}

const countSquad = (players: { isSubstitute?: boolean }[]) => ({
  starters: players.filter((p) => !p.isSubstitute).length,
  subs: players.filter((p) => p.isSubstitute).length,
  total: players.length,
})

type AdminTournament = {
  _id: string
  title: string
  eventType?: EventType
  eventTypes?: string[]
  startDate?: string
  endDate?: string
  venueName?: string
  city?: string
  status?: string
  winners?: {
    first: WinnerEntry[]
    second: WinnerEntry[]
    third: WinnerEntry[]
  }
}

type Applicant = {
  _id: string
  fullName: string
  playerId?: string
  coachId?: string
  refereeId?: string
  email: string
  district?: string
  profilePhoto?: string
}

type TournamentRegistration = {
  _id: string
  userId: string
  tournamentId: string
  applicant?: Applicant
  registerAs: 'player' | 'coach' | 'referee'
  category?: string
  status: 'pending' | 'approved' | 'rejected'
  appliedAt?: string
  notes?: string
}

type WinnerEntry = {
  key: string
  role: 'player' | 'coach' | 'referee' | 'written'
  refId?: string
  fullName: string
  district: string
  memberId?: string
  source?: 'registration' | 'match'
}

const toWinnerEntry = (item: {
  role?: string
  refId?: string
  _id?: string
  name?: string
  fullName?: string
  district?: string
}): WinnerEntry => {
  const role = (item.role || 'player') as WinnerEntry['role']
  const refId = item.refId || item._id
  const fullName = item.name || item.fullName || ''
  return {
    key: `${role}:${refId || fullName}`,
    role,
    refId,
    fullName,
    district: item.district || '',
  }
}

/** Approved registrants + match lineups for winner selection */
const buildWinnerPlayerOptions = (
  matchList: Match[],
  registrationList: TournamentRegistration[],
  districtId: string,
  districtMatches: (stored?: string) => boolean,
): WinnerEntry[] => {
  if (!districtId) return []
  const map = new Map<string, WinnerEntry>()
  const add = (entry: WinnerEntry) => {
    if (entry.fullName.trim() && !map.has(entry.key)) map.set(entry.key, entry)
  }

  for (const r of registrationList) {
    if (r.registerAs !== 'player' || r.status !== 'approved' || !r.applicant?.fullName?.trim()) continue
    if (!districtMatches(r.applicant.district)) continue
    const refId = r.applicant._id
    add({
      key: `player:${refId}`,
      role: 'player',
      refId,
      fullName: r.applicant.fullName.trim(),
      district: districtId,
      memberId: r.applicant.playerId?.trim() || undefined,
      source: 'registration',
    })
  }

  const addFromLineup = (lineup: Match['team1Players']) => {
    for (const tp of lineup || []) {
      const p = tp.player
      if (typeof p === 'object' && p) {
        if (p._id) {
          add({
            key: `player:${p._id}`,
            role: 'player',
            refId: p._id,
            fullName: p.fullName || p.name || 'Player',
            district: districtId,
            source: 'match',
          })
        } else if ((p.fullName || p.name)?.trim()) {
          const name = (p.fullName || p.name)!.trim()
          add({ key: `player:name:${name}`, role: 'player', fullName: name, district: districtId, source: 'match' })
        }
      } else if (typeof p === 'string' && p.trim() && !/^[0-9a-fA-F]{24}$/.test(p)) {
        add({ key: `player:name:${p.trim()}`, role: 'player', fullName: p.trim(), district: districtId, source: 'match' })
      }
    }
  }

  for (const m of matchList) {
    const team1Ok = districtMatches(m.team1District)
    const team2Ok = districtMatches(m.team2District)
    if (!team1Ok && !team2Ok) continue
    if (team1Ok) addFromLineup(m.team1Players)
    if (team2Ok) addFromLineup(m.team2Players)
  }

  return Array.from(map.values()).sort((a, b) => a.fullName.localeCompare(b.fullName))
}

const WINNER_PLACE_STYLES = {
  first: {
    title: '1st Place',
    medal: '🥇',
    card: 'relative overflow-hidden rounded-2xl border-2 border-amber-300/80 bg-gradient-to-br from-amber-50 via-yellow-50 to-white shadow-lg shadow-amber-100/60',
    header: 'bg-gradient-to-r from-amber-500 to-yellow-500',
    badge: 'bg-amber-100 text-amber-900 border-amber-200',
    ring: 'ring-amber-300/40',
  },
  second: {
    title: '2nd Place',
    medal: '🥈',
    card: 'relative overflow-hidden rounded-2xl border-2 border-slate-300 bg-gradient-to-br from-slate-50 via-gray-50 to-white shadow-lg shadow-slate-200/50',
    header: 'bg-gradient-to-r from-slate-500 to-gray-400',
    badge: 'bg-slate-100 text-slate-800 border-slate-200',
    ring: 'ring-slate-300/40',
  },
  third: {
    title: '3rd Place',
    medal: '🥉',
    card: 'relative overflow-hidden rounded-2xl border-2 border-orange-300/80 bg-gradient-to-br from-orange-50 via-amber-50/50 to-white shadow-lg shadow-orange-100/50',
    header: 'bg-gradient-to-r from-orange-600 to-amber-600',
    badge: 'bg-orange-100 text-orange-900 border-orange-200',
    ring: 'ring-orange-300/40',
  },
} as const

type Team = {
  _id: string
  name: string
  maxMembers: number
  teamType?: 'regu' | 'double' | 'quad'
  genderCategory?: 'male' | 'female' | 'both'
  status?: 'pending' | 'approved' | 'rejected'
  district?: { _id: string; code: string; name: string } | null
  createdAt?: string
  members: {
    _id: string
    name: string
    playerId: string
    fullName?: string
    gender?: string
    profilePhoto?: string
  }[]
}

/** Player avatar with initials fallback when the photo is missing or fails. */
function TeamMemberAvatar({ photo, name, size = 'md' }: { photo?: string; name: string; size?: 'sm' | 'md' }) {
  const [failed, setFailed] = useState(false)
  const initials = (name || '')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  const cls =
    size === 'sm'
      ? 'w-8 h-8 text-[10px]'
      : 'w-10 h-10 text-xs'
  if (!photo || failed) {
    return (
      <span
        className={`${cls} rounded-full bg-[#5a0a8f]/10 text-[#5a0a8f] flex items-center justify-center font-bold flex-shrink-0`}
      >
        {initials || '•'}
      </span>
    )
  }
  return (
    <img
      src={photo}
      alt={name}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`${cls} rounded-full object-cover flex-shrink-0 bg-gray-100`}
    />
  )
}

type Match = {
  _id: string
  team1: string
  team2: string
  date: string
  time: string
  bracket?: 'winner' | 'loser'
  eventType?: EventType
  description?: string
  status?: 'scheduled' | 'ongoing' | 'completed'
  score?: {
    team1: number
    team2: number
  }
  regus?: {
    reguName: string
    team1Score: number
    team2Score: number
    winner?: 'team1' | 'team2' | null
    sets: {
      setNumber: number
      team1Score: number
      team2Score: number
      winner?: 'team1' | 'team2' | null
    }[]
  }[]
  winner?: 'team1' | 'team2' | 'tie'
  team1District?: string
  team2District?: string
  team1Coach?: { _id?: string; fullName?: string; district?: string } | string
  team2Coach?: { _id?: string; fullName?: string; district?: string } | string
  team1CoachName?: string
  team2CoachName?: string
  referee?: { _id?: string; fullName?: string; district?: string } | string
  assistantReferee?: { _id?: string; fullName?: string; district?: string } | string
  officialReferee?: { _id?: string; fullName?: string; district?: string } | string
  scorecard?: {
    matchNo?: string
    round?: string
    startTime?: string
    endTime?: string
    remarks?: string
  }
  team1Players?: {
    player?: {
      _id?: string
      fullName?: string
      name?: string
      district?: string
    } | string
    jerseyNumber?: number
    position?: string
    isCaptain?: boolean
    isSubstitute?: boolean
    entryTime?: string
    exitTime?: string
  }[]
  team2Players?: {
    player?: {
      _id?: string
      fullName?: string
      name?: string
      district?: string
    } | string
    jerseyNumber?: number
    position?: string
    isCaptain?: boolean
    isSubstitute?: boolean
    entryTime?: string
    exitTime?: string
  }[]
}

type Stats = {
  total: number
  pending: number
  approved: number
  rejected: number
}

// New Simple Match State
type SimpleMatchPlayer = {
  _id: string
  fullName: string
  playerId: string
  profilePhoto?: string
  jerseyNumber?: number
  position?: string
  isCaptain?: boolean
  isSubstitute?: boolean
  entryTime?: string
  exitTime?: string
}

type Coach = {
  _id: string
  fullName: string
  email: string
  phone?: string
}

type Referee = {
  _id: string
  fullName: string
  email: string
  phone?: string
}

type SimpleMatchState = {
  title: string
  matchNo: string
  round: string
  team1Name: string
  team2Name: string
  team1District: string
  team2District: string
  team1Players: SimpleMatchPlayer[]
  team2Players: SimpleMatchPlayer[]
  team1Coach: Coach | null
  team2Coach: Coach | null
  team1CoachName: string
  team2CoachName: string
  team1Manager: string
  team2Manager: string
  referee: Referee | null
  assistantReferee: Referee | null
  officialReferee: Referee | null
  refereeName: string
  assistantRefereeName: string
  officialRefereeName: string
  date: string
  time: string
}

type WizardState = {
  phase: 'idle' | 'create-match'
  simpleMatch: SimpleMatchState
}

type MatchDistrict = {
  id: string
  code: string
  name: string
  zone: string
}

export function TournamentRegistrations() {
  const { tournamentId } = useParams<{ tournamentId: string }>()
  const { districts, getDistrictById } = useDistricts()

  const [tournament, setTournament] = useState<AdminTournament | null>(null)
  const [tournamentLoading, setTournamentLoading] = useState(true)
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  // UI State
  const [activeTab, setActiveTab] = useState<'registrations' | 'matches' | 'teams' | 'winners'>('registrations')
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)

  const teamTypeLabel = (teamType?: string) =>
    teamType === 'regu' ? 'Regu' : teamType === 'double' ? 'Doubles' : teamType === 'quad' ? 'Quad' : '—'

  const teamMemberName = (m: Team['members'][number]) => m.fullName || m.name || '—'

  const [winners, setWinners] = useState<{
    first: WinnerEntry[]
    second: WinnerEntry[]
    third: WinnerEntry[]
  }>({
    first: [],
    second: [],
    third: []
  })
  const [winnerDistricts, setWinnerDistricts] = useState({
    first: '',
    second: '',
    third: '',
  })
  const [savingWinners, setSavingWinners] = useState(false)

  type WinnerPlace = 'first' | 'second' | 'third'

  const toggleWinnerPick = (place: WinnerPlace, entry: WinnerEntry) => {
    setWinners((prev) => {
      const list = prev[place]
      const exists = list.some((w) => w.key === entry.key)
      const district = winnerDistricts[place]
      return {
        ...prev,
        [place]: exists
          ? list.filter((w) => w.key !== entry.key)
          : [...list, { ...entry, district }],
      }
    })
  }

  const tournamentDistrictOptions = useMemo<MatchDistrict[]>(() => {
    const seen = new Set<string>()
    const options: MatchDistrict[] = []

    const pushDistrict = (raw: string | undefined | null) => {
      const value = raw?.trim()
      if (!value) return
      const district = getDistrictById(value)
      const id = (district?.id || district?.code || value).trim()
      const key = id.toLowerCase()
      if (seen.has(key)) return
      seen.add(key)
      options.push({
        id,
        code: district?.code || id,
        name: district?.name || value,
        zone: district?.zone || '',
      })
    }

    // Districts with approved individual player registrations…
    for (const registration of registrations) {
      if (registration.registerAs !== 'player' || registration.status !== 'approved') continue
      pushDistrict(registration.applicant?.district)
    }

    // …plus districts with registered (non-rejected) teams. A team-only
    // tournament has no individual registrations, so without this the
    // district dropdown in Create Match would be empty.
    for (const team of teams) {
      if (team.status === 'rejected') continue
      const d = team.district
      pushDistrict(typeof d === 'string' ? d : d?.code || d?.name)
    }

    return options.sort((a, b) => a.name.localeCompare(b.name))
  }, [registrations, teams, getDistrictById])

  const availableDistrictsForMatch = useMemo(() => {
    return tournamentDistrictOptions.length > 0 ? tournamentDistrictOptions : []
  }, [tournamentDistrictOptions])

  const renderWinnerPlace = (place: WinnerPlace) => {
    const styles = WINNER_PLACE_STYLES[place]
    const districtId = winnerDistricts[place]
    const districtName = getDistrictById(districtId)?.name
    const playerOptions = winnerPlayersForPlace[place]
    const selected = winners[place]
    const registeredCount = playerOptions.filter((p) => p.source === 'registration').length

    return (
      <div className={styles.card}>
        <div className={`${styles.header} px-5 py-4 text-white flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden>{styles.medal}</span>
            <div>
              <h3 className="text-lg font-black tracking-tight">{styles.title}</h3>
              <p className="text-white/80 text-xs">Pick winning players for this district</p>
            </div>
          </div>
          {selected.length > 0 && (
            <span className="bg-white/20 backdrop-blur px-3 py-1 rounded-full text-xs font-bold">
              {selected.length} selected
            </span>
          )}
        </div>

        <div className="p-5">
          <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">District</label>
          <select
            value={districtId}
            onChange={(e) => {
              const nextDistrict = e.target.value
              setWinnerDistricts((prev) => ({ ...prev, [place]: nextDistrict }))
              const districtMatches = (stored?: string) => applicantMatchesDistrict(stored, nextDistrict)
              const options = buildWinnerPlayerOptions(matches, registrations, nextDistrict, districtMatches)
              setWinners((prev) => ({
                ...prev,
                [place]: prev[place].filter((w) => options.some((o) => o.key === w.key)),
              }))
            }}
            className="w-full mb-4 rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 font-medium focus:border-[#5a0a8f] focus:ring-2 focus:ring-[#5a0a8f]/20 outline-none"
          >
            <option value="">Choose district…</option>
            {availableDistrictsForMatch.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          {districtId ? (
            <div className={`rounded-xl border bg-white/80 p-4 ${styles.ring} ring-4`}>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <p className="text-sm font-bold text-gray-900">
                  {districtName || 'District'}
                </p>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${styles.badge}`}>
                  {playerOptions.length} player{playerOptions.length !== 1 ? 's' : ''}
                  {registeredCount > 0 ? ` · ${registeredCount} registered` : ''}
                </span>
              </div>

              {playerOptions.length === 0 ? (
                <div className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="font-semibold mb-1">No players for this district yet</p>
                  <p className="text-amber-800/90 text-xs">
                    Approve player registrations for this district, or add them to a match lineup.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 max-h-[280px] overflow-y-auto pr-1">
                  {playerOptions.map((player) => {
                    const isSelected = selected.some((w) => w.key === player.key)
                    return (
                      <button
                        key={player.key}
                        type="button"
                        onClick={() => toggleWinnerPick(place, player)}
                        className={`flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all duration-200 ${
                          isSelected
                            ? 'border-[#5a0a8f] bg-gradient-to-r from-purple-50 to-violet-50 shadow-md scale-[1.01]'
                            : 'border-gray-100 bg-gray-50/80 hover:border-purple-200 hover:bg-white hover:shadow-sm'
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0 shadow-inner ${
                            isSelected ? 'bg-[#5a0a8f]' : 'bg-gradient-to-br from-[#5a0a8f]/70 to-[#400466]'
                          }`}
                        >
                          {isSelected ? (
                            <span className="material-symbols-outlined text-xl">done</span>
                          ) : (
                            player.fullName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-gray-900 text-sm truncate">{player.fullName}</p>
                          <div className="flex flex-wrap gap-1.5 mt-0.5">
                            {player.memberId && (
                              <span className="text-[10px] font-mono font-bold text-[#5a0a8f] bg-purple-50 px-1.5 py-0.5 rounded">
                                {player.memberId}
                              </span>
                            )}
                            {player.source === 'registration' && (
                              <span className="text-[10px] font-semibold text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
                                Registered
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-6 border-2 border-dashed border-gray-200 rounded-xl">
              Select a district to load players
            </p>
          )}
        </div>
      </div>
    )
  }

  const handleSaveWinners = async () => {
    if (!tournamentId) return
    setSavingWinners(true)
    try {
      const toPayload = (list: WinnerEntry[]) =>
        list.map((e) => ({
          role: e.role,
          refId: e.refId || null,
          name: e.fullName,
          district: e.district || '',
        }))

      const winnersData = {
        first: toPayload(winners.first),
        second: toPayload(winners.second),
        third: toPayload(winners.third),
      }

      await apiRequest(`/admin/tournaments/${tournamentId}`, {
        method: 'PATCH',
        auth: true,
        body: JSON.stringify({ winners: winnersData })
      })

      // Fetch updated tournament details to get the new status
      const res = await apiRequest<{ tournament: AdminTournament }>(
        `/admin/tournaments/${tournamentId}`,
        { auth: true }
      )
      setTournament(res.tournament)

      alert('Winners saved successfully! Tournament marked as COMPLETED.')
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to save winners')
    } finally {
      setSavingWinners(false)
    }
  }

  // Score Card Modal State (Removed to bypass modal)

  // Wizard State
  const [wizard, setWizard] = useState<WizardState>({
    phase: 'idle',
    simpleMatch: {
      title: '',
      matchNo: '',
      round: '',
      team1Name: 'Team A',
      team2Name: 'Team B',
      team1District: '',
      team2District: '',
      team1Players: [],
      team2Players: [],
      team1Coach: null,
      team2Coach: null,
      team1CoachName: '',
      team2CoachName: '',
      team1Manager: '',
      team2Manager: '',
      referee: null,
      assistantReferee: null,
      officialReferee: null,
      refereeName: '',
      assistantRefereeName: '',
      officialRefereeName: '',
      date: new Date().toISOString().split('T')[0],
      time: '10:00'
    }
  })

  const [wizardEventType, setWizardEventType] = useState<EventType>('regu')
  const tournamentEventOptions = tournamentEventTypes(tournament ?? undefined)
  const matchEventType: EventType = wizardEventType
  const squadLimits = squadLimitsForEvent(matchEventType)

  // Coach and Referee Search States
  const [coachSearch, setCoachSearch] = useState('')
  const [coachResults, setCoachResults] = useState<Coach[]>([])
  const [activeCoachSide, setActiveCoachSide] = useState<1 | 2 | null>(null)

  const [refereeSearch, setRefereeSearch] = useState('')
  const [refereeResults, setRefereeResults] = useState<Referee[]>([])
  const [activeRefereeSide, setActiveRefereeSide] = useState<'main' | 'assistant' | 'official' | null>(null)

  const [savingMatch, setSavingMatch] = useState(false)

  // Registered district team selected per match side (connects a district's
  // tournament team into the Create Match squad picker).
  const [matchTeamSel, setMatchTeamSel] = useState<{ 1: string; 2: string }>({ 1: '', 2: '' })

  const [scorecardRemarksOpen, setScorecardRemarksOpen] = useState(false)
  const [scorecardRemarksMatch, setScorecardRemarksMatch] = useState<Match | null>(null)
  const [scorecardRemarksText, setScorecardRemarksText] = useState('')
  const [downloadingScorecard, setDownloadingScorecard] = useState(false)

  // Score Update Modal State
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false)
  const [selectedMatchForScore, setSelectedMatchForScore] = useState<Match | null>(null)

  // Quick Registration Modal State
  const [isQuickRegModalOpen, setIsQuickRegModalOpen] = useState(false)
  const [quickRegDistrict, setQuickRegDistrict] = useState('')
  const [quickRegSearch, setQuickRegSearch] = useState('')
  const [quickRegType, setQuickRegType] = useState<'player' | 'coach' | 'referee'>('player')
  const [quickRegResults, setQuickRegResults] = useState<any[]>([])
  const [quickRegLoading, setQuickRegLoading] = useState(false)
  const [quickRegBusyId, setQuickRegBusyId] = useState('')
  const [quickRegPage, setQuickRegPage] = useState(1)
  const QUICK_REG_PAGE_SIZE = 10

  // Fetch tournament details
  useEffect(() => {
    if (!tournamentId) return
    const fetchTournament = async () => {
      setTournamentLoading(true)
      try {
        const res = await apiRequest<{ tournament: AdminTournament }>(
          `/admin/tournaments/${tournamentId}`,
          { auth: true }
        )
        setTournament(res.tournament)
        if (res.tournament.winners) {
          const first = (res.tournament.winners.first || []).map(toWinnerEntry)
          const second = (res.tournament.winners.second || []).map(toWinnerEntry)
          const third = (res.tournament.winners.third || []).map(toWinnerEntry)
          setWinners({ first, second, third })
          setWinnerDistricts({
            first: first[0]?.district || '',
            second: second[0]?.district || '',
            third: third[0]?.district || '',
          })
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to fetch tournament')
        setTournament(null)
      } finally {
        setTournamentLoading(false)
      }
    }
    fetchTournament()
  }, [tournamentId])

  // Fetch registrations
  useEffect(() => {
    if (!tournamentId) return
    const fetchRegistrations = async () => {
      setLoading(true)
      try {
        const res = await apiRequest<{ registrations: TournamentRegistration[] }>(
          `/admin/tournaments/${tournamentId}/registrations`,
          { auth: true }
        )
        setRegistrations(Array.isArray(res.registrations) ? res.registrations : [])
        setError(null)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to fetch registrations')
        setRegistrations([])
      } finally {
        setLoading(false)
      }
    }
    fetchRegistrations()
  }, [tournamentId])

  // Fetch teams
  const fetchTeams = async (id: string) => {
    try {
      const res = await apiRequest<{ teams: Team[] }>(`/admin/teams?tournamentId=${id}`, { auth: true })
      setTeams(Array.isArray(res.teams) ? res.teams : [])
    } catch (e) {
      setTeams([])
    }
  }

  // Fetch matches
  const fetchMatches = async (id: string) => {
    try {
      const res = await apiRequest<{ matches: Match[] }>(`/admin/matches?tournamentId=${id}`, { auth: true })
      setMatches(Array.isArray(res.matches) ? res.matches : [])
    } catch (e) {
      setMatches([])
    }
  }

  // Delete match
  const handleDeleteMatch = async (matchId: string, team1: string, team2: string) => {
    if (!window.confirm(`Are you sure you want to delete the match between ${team1} and ${team2}? This will also delete the associated teams.`)) {
      return
    }

    try {
      await apiRequest(`/admin/matches/${matchId}`, {
        method: 'DELETE',
        auth: true
      })

      // Refresh both matches and teams
      if (tournamentId) {
        await Promise.all([
          fetchMatches(tournamentId),
          fetchTeams(tournamentId)
        ])
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to delete match')
    }
  }

  // Download schedule PDF
  const handleDownloadSchedulePdf = async () => {
    if (!tournamentId) return;
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://sports-backend-fgsp.onrender.com'
      const baseUrl = API_BASE.replace(/\/api$/, '')
      const token = getAuthToken()

      const response = await fetch(`${baseUrl}/api/admin/tournaments/${tournamentId}/match-schedule-pdf`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to generate Schedule PDF')
      }

      const contentDisposition = response.headers.get('Content-Disposition')
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '').trim()
        : `${(tournament?.title || 'Tournament').replace(/[/\\?%*:|"<>]/g, '').replace(/\s+/g, '_')}_Schedule.pdf`

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to download schedule')
    }
  }


  useEffect(() => {
    if (tournamentId) {
      fetchTeams(tournamentId)
      fetchMatches(tournamentId)
    }
  }, [tournamentId])

  // Refresh when the Teams tab is opened — a district may have registered a
  // team while this page was open.
  useEffect(() => {
    if (activeTab === 'teams' && tournamentId) {
      fetchTeams(tournamentId)
    }
  }, [activeTab, tournamentId])

  // Refresh when the tab regains focus, so new district teams appear
  // without a manual reload.
  useEffect(() => {
    const onFocus = () => {
      if (tournamentId) {
        fetchTeams(tournamentId)
        fetchMatches(tournamentId)
      }
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [tournamentId])

  const applicantMatchesDistrict = (applicantDistrict: string | undefined, districtId: string) => {
    if (!applicantDistrict?.trim() || !districtId) return false
    const meta = getDistrictById(districtId)
    const norm = applicantDistrict.trim().toUpperCase()
    const keys = [districtId, meta?.id, meta?.code, meta?.name]
      .filter(Boolean)
      .map((v) => String(v).trim().toUpperCase())
    if (keys.some((k) => k === norm)) return true
    if (meta?.name && applicantDistrict.trim().toLowerCase() === meta.name.trim().toLowerCase()) return true
    return false
  }

  const winnerPlayersForPlace = useMemo(() => {
    const forDistrict = (districtId: string) => {
      if (!districtId) return []
      const districtMatches = (stored?: string) => applicantMatchesDistrict(stored, districtId)
      return buildWinnerPlayerOptions(matches, registrations, districtId, districtMatches)
    }
    return {
      first: forDistrict(winnerDistricts.first),
      second: forDistrict(winnerDistricts.second),
      third: forDistrict(winnerDistricts.third),
    }
  }, [matches, registrations, winnerDistricts, districts])

  // Start Create Match Wizard
  const startCreateMatch = () => {
    setWizardEventType(tournamentEventTypes(tournament ?? undefined)[0] || 'regu')
    setWizard({
      phase: 'create-match',
      simpleMatch: {
        title: '',
        matchNo: '',
        round: '',
        team1Name: 'Team A',
        team2Name: 'Team B',
        team1District: '',
        team2District: '',
        team1Players: [],
        team2Players: [],
        team1Coach: null,
        team2Coach: null,
        team1CoachName: '',
        team2CoachName: '',
        team1Manager: '',
        team2Manager: '',
        referee: null,
        assistantReferee: null,
        officialReferee: null,
        refereeName: '',
        assistantRefereeName: '',
        officialRefereeName: '',
        date: new Date().toISOString().split('T')[0],
        time: '10:00'
      }
    })
    setMatchTeamSel({ 1: '', 2: '' })
    setCoachSearch('')
    setCoachResults([])
    setActiveCoachSide(null)
    setRefereeSearch('')
    setRefereeResults([])
    setActiveRefereeSide(null)
  }

  const removePlayerFromTeam = (side: 1 | 2, playerId: string) => {
    setWizard(prev => {
      const newState = { ...prev }
      if (side === 1) {
        newState.simpleMatch.team1Players = newState.simpleMatch.team1Players.filter(p => p._id !== playerId)
      } else {
        newState.simpleMatch.team2Players = newState.simpleMatch.team2Players.filter(p => p._id !== playerId)
      }
      return newState
    })
  }

  const updatePlayerJerseyNumber = (side: 1 | 2, playerId: string, jerseyNumber: number) => {
    setWizard(prev => {
      const newState = { ...prev }
      if (side === 1) {
        newState.simpleMatch.team1Players = newState.simpleMatch.team1Players.map(p =>
          p._id === playerId ? { ...p, jerseyNumber } : p
        )
      } else {
        newState.simpleMatch.team2Players = newState.simpleMatch.team2Players.map(p =>
          p._id === playerId ? { ...p, jerseyNumber } : p
        )
      }
      return newState
    })
  }

  const updatePlayerPosition = (side: 1 | 2, playerId: string, position: string) => {
    setWizard(prev => {
      const newState = { ...prev }
      if (side === 1) {
        newState.simpleMatch.team1Players = newState.simpleMatch.team1Players.map(p =>
          p._id === playerId ? { ...p, position } : p
        )
      } else {
        newState.simpleMatch.team2Players = newState.simpleMatch.team2Players.map(p =>
          p._id === playerId ? { ...p, position } : p
        )
      }
      return newState
    })
  }

  const togglePlayerCaptain = (side: 1 | 2, playerId: string) => {
    setWizard(prev => {
      if (side === 1) {
        return {
          ...prev,
          simpleMatch: {
            ...prev.simpleMatch,
            team1Players: prev.simpleMatch.team1Players.map(p =>
              p._id === playerId ? { ...p, isCaptain: !p.isCaptain } : { ...p, isCaptain: false }
            )
          }
        }
      } else {
        return {
          ...prev,
          simpleMatch: {
            ...prev.simpleMatch,
            team2Players: prev.simpleMatch.team2Players.map(p =>
              p._id === playerId ? { ...p, isCaptain: !p.isCaptain } : { ...p, isCaptain: false }
            )
          }
        }
      }
    })
  }

  const togglePlayerSubstitute = (side: 1 | 2, playerId: string) => {
    const squad = side === 1 ? wizard.simpleMatch.team1Players : wizard.simpleMatch.team2Players
    const player = squad.find((p) => p._id === playerId)
    if (!player) return

    const { starters, subs } = countSquad(squad)
    const willBeSub = !player.isSubstitute

    if (willBeSub && subs >= squadLimits.subs) {
      alert(`Maximum ${squadLimits.subs} substitutes per team for ${eventTypeLabel(matchEventType)}`)
      return
    }
    if (!willBeSub && starters >= squadLimits.starters) {
      alert(`Maximum ${squadLimits.starters} playing players per team for ${eventTypeLabel(matchEventType)}`)
      return
    }

    setWizard(prev => {
      const key = side === 1 ? 'team1Players' : 'team2Players'
      return {
        ...prev,
        simpleMatch: {
          ...prev.simpleMatch,
          [key]: prev.simpleMatch[key].map((p) =>
            p._id === playerId ? { ...p, isSubstitute: willBeSub } : p,
          ),
        },
      }
    })
  }

  // Handle coach search
  const handleCoachSearch = async (query: string, side: 1 | 2) => {
    setCoachSearch(query)
    setActiveCoachSide(side)

    if (!query.trim() || query.trim().length < 2) {
      setCoachResults([])
      return
    }

    const districtId = side === 1 ? wizard.simpleMatch.team1District : wizard.simpleMatch.team2District
    const districtParam = districtId ? `&district=${encodeURIComponent(districtId)}` : ''

    try {
      const res = await apiRequest<{ coaches: Coach[] }>(
        `/admin/coaches/search?q=${encodeURIComponent(query)}${districtParam}`,
        { auth: true }
      )
      setCoachResults(Array.isArray(res.coaches) ? res.coaches : [])
    } catch (e) {
      setCoachResults([])
    }
  }

  const selectCoach = (side: 1 | 2, coach: Coach) => {
    setWizard(prev => ({
      ...prev,
      simpleMatch: {
        ...prev.simpleMatch,
        ...(side === 1
          ? { team1Coach: coach, team1CoachName: coach.fullName }
          : { team2Coach: coach, team2CoachName: coach.fullName }),
      }
    }))
    setCoachSearch('')
    setCoachResults([])
    setActiveCoachSide(null)
  }

  const setCoachName = (side: 1 | 2, name: string) => {
    setWizard(prev => ({
      ...prev,
      simpleMatch: {
        ...prev.simpleMatch,
        ...(side === 1
          ? { team1CoachName: name, team1Coach: null }
          : { team2CoachName: name, team2Coach: null }),
      }
    }))
  }

  // Registered (non-rejected) teams for this tournament, for the Create Match
  // team picker. The other side's pick is excluded so a team can't face itself.
  const matchRegisteredTeams = (side: 1 | 2): Team[] => {
    const otherPick = matchTeamSel[side === 1 ? 2 : 1]
    return teams
      .filter((t) => t.status !== 'rejected' && t._id !== otherPick)
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  // Load a registered team's members into the match squad: first N as the
  // playing XI per the event's squad limits, the rest as substitutes. The
  // admin can then rearrange playing vs subs with the checkboxes.
  const loadTeamSquad = (side: 1 | 2, team: Team) => {
    const members = team.members || []
    const starters = squadLimits.starters
    const squadPlayers: SimpleMatchPlayer[] = members
      .slice(0, starters + squadLimits.subs)
      .map((m, i) => ({
        _id: m._id,
        fullName: teamMemberName(m),
        playerId: m.playerId,
        profilePhoto: m.profilePhoto,
        jerseyNumber: undefined,
        position: '',
        isCaptain: false,
        isSubstitute: i >= starters,
        entryTime: '',
        exitTime: '',
      }))
    setWizard((prev) => ({
      ...prev,
      simpleMatch: {
        ...prev.simpleMatch,
        ...(side === 1 ? { team1Players: squadPlayers } : { team2Players: squadPlayers }),
      },
    }))
  }

  // Picking a registered team sets the side's team name and district from the
  // team and loads its players into the squad; clearing the pick resets the
  // side. The admin can then rearrange playing / subs and set jersey numbers
  // and positions before saving.
  const handleMatchTeamSelect = (side: 1 | 2, teamId: string) => {
    setMatchTeamSel((prev) => ({ ...prev, [side]: teamId }))
    const team = teamId ? teams.find((t) => t._id === teamId) : undefined
    setWizard((prev) => ({
      ...prev,
      simpleMatch: {
        ...prev.simpleMatch,
        ...(side === 1
          ? {
              team1Name: team?.name || 'Team A',
              team1District: team?.district?.code || team?.district?.name || '',
              team1Players: [],
            }
          : {
              team2Name: team?.name || 'Team B',
              team2District: team?.district?.code || team?.district?.name || '',
              team2Players: [],
            }),
      },
    }))
    if (team) {
      loadTeamSquad(side, team)
    }
  }

  // Handle referee search
  const handleRefereeSearch = async (query: string, type: 'main' | 'assistant' | 'official') => {
    setRefereeSearch(query)
    setActiveRefereeSide(type)

    if (!query.trim() || query.trim().length < 2) {
      setRefereeResults([])
      return
    }

    try {
      const res = await apiRequest<{ referees: Referee[] }>(
        `/admin/referees/search?q=${encodeURIComponent(query)}`,
        { auth: true }
      )
      setRefereeResults(Array.isArray(res.referees) ? res.referees : [])
    } catch (e) {
      setRefereeResults([])
    }
  }

  const selectReferee = (type: 'main' | 'assistant' | 'official', referee: Referee) => {
    setWizard(prev => ({
      ...prev,
      simpleMatch: {
        ...prev.simpleMatch,
        ...(type === 'main'
          ? { referee, refereeName: referee.fullName }
          : type === 'assistant'
            ? { assistantReferee: referee, assistantRefereeName: referee.fullName }
            : { officialReferee: referee, officialRefereeName: referee.fullName }),
      }
    }))
    setRefereeSearch('')
    setRefereeResults([])
    setActiveRefereeSide(null)
  }

  const setRefereeName = (type: 'main' | 'assistant' | 'official', name: string) => {
    setWizard(prev => ({
      ...prev,
      simpleMatch: {
        ...prev.simpleMatch,
        ...(type === 'main'
          ? { refereeName: name, referee: null }
          : type === 'assistant'
            ? { assistantRefereeName: name, assistantReferee: null }
            : { officialRefereeName: name, officialReferee: null }),
      }
    }))
  }

  const saveSimpleMatch = async () => {
    if (!wizard.simpleMatch.title.trim()) {
      alert('Please enter a match title')
      return
    }
    if (!matchTeamSel[1] || !matchTeamSel[2]) {
      alert('Please select a registered team for both sides')
      return
    }
    if (!wizard.simpleMatch.team1Name.trim() || !wizard.simpleMatch.team2Name.trim()) {
      alert('Team names are required')
      return
    }

    const validateTeamSquad = (players: SimpleMatchPlayer[], teamLabel: string) => {
      const { starters, subs } = countSquad(players)
      if (starters < 1) {
        return `${teamLabel} needs at least 1 playing player`
      }
      if (starters > squadLimits.starters) {
        return `${teamLabel} has ${starters} playing players (max ${squadLimits.starters} for ${eventTypeLabel(matchEventType)})`
      }
      if (subs > squadLimits.subs) {
        return `${teamLabel} has ${subs} substitutes (max ${squadLimits.subs})`
      }
      if (players.length > squadLimits.total) {
        return `${teamLabel} has too many players (max ${squadLimits.total})`
      }
      return null
    }

    const team1Err = validateTeamSquad(wizard.simpleMatch.team1Players, 'Team A')
    const team2Err = validateTeamSquad(wizard.simpleMatch.team2Players, 'Team B')
    if (team1Err || team2Err) {
      alert(team1Err || team2Err)
      return
    }

    const resolveCoachName = (coach: Coach | null, manual: string) =>
      coach?.fullName?.trim() || manual.trim() || ''
    const resolveRefName = (ref: Referee | null, manual: string) =>
      ref?.fullName?.trim() || manual.trim() || ''

    setSavingMatch(true)
    try {
      // 1. Create Team 1
      const team1Res = await apiRequest<{ team: Team }>(`/admin/teams`, {
        method: 'POST',
        auth: true,
        body: JSON.stringify({
          tournamentId,
          name: wizard.simpleMatch.team1Name,
          maxMembers: 50, // Default generous limit
          memberIds: wizard.simpleMatch.team1Players.map(p => p._id),
        }),
      })

      // 2. Create Team 2
      const team2Res = await apiRequest<{ team: Team }>(`/admin/teams`, {
        method: 'POST',
        auth: true,
        body: JSON.stringify({
          tournamentId,
          name: wizard.simpleMatch.team2Name,
          maxMembers: 50,
          memberIds: wizard.simpleMatch.team2Players.map(p => p._id),
        }),
      })

      // 3. Create Match with all new fields
      await apiRequest<{ match: Match }>(`/admin/matches`, {
        method: 'POST',
        auth: true,
        body: JSON.stringify({
          tournamentId,
          team1: team1Res.team._id,
          team2: team2Res.team._id,
          eventType: matchEventType,
          matchNo: wizard.simpleMatch.matchNo || '',
          round: wizard.simpleMatch.round || '',
          team1District: wizard.simpleMatch.team1District,
          team2District: wizard.simpleMatch.team2District,
          team1Coach: wizard.simpleMatch.team1Coach?._id || null,
          team2Coach: wizard.simpleMatch.team2Coach?._id || null,
          team1CoachName: resolveCoachName(wizard.simpleMatch.team1Coach, wizard.simpleMatch.team1CoachName),
          team2CoachName: resolveCoachName(wizard.simpleMatch.team2Coach, wizard.simpleMatch.team2CoachName),
          team1Manager: wizard.simpleMatch.team1Manager || null,
          team2Manager: wizard.simpleMatch.team2Manager || null,
          team1Players: wizard.simpleMatch.team1Players.map(p => ({
            player: p._id,
            jerseyNumber: p.jerseyNumber || null,
            position: p.position || null,
            isCaptain: p.isCaptain || false,
            isSubstitute: p.isSubstitute || false,
            entryTime: p.isSubstitute ? p.entryTime || null : null,
            exitTime: p.isSubstitute ? p.exitTime || null : null
          })),
          team2Players: wizard.simpleMatch.team2Players.map(p => ({
            player: p._id,
            jerseyNumber: p.jerseyNumber || null,
            position: p.position || null,
            isCaptain: p.isCaptain || false,
            isSubstitute: p.isSubstitute || false,
            entryTime: p.isSubstitute ? p.entryTime || null : null,
            exitTime: p.isSubstitute ? p.exitTime || null : null
          })),
          referee: wizard.simpleMatch.referee?._id || null,
          assistantReferee: wizard.simpleMatch.assistantReferee?._id || null,
          officialReferee: wizard.simpleMatch.officialReferee?._id || null,
          refereeName: resolveRefName(wizard.simpleMatch.referee, wizard.simpleMatch.refereeName),
          assistantRefereeName: resolveRefName(
            wizard.simpleMatch.assistantReferee,
            wizard.simpleMatch.assistantRefereeName
          ),
          officialRefereeName: resolveRefName(
            wizard.simpleMatch.officialReferee,
            wizard.simpleMatch.officialRefereeName
          ),
          date: wizard.simpleMatch.date,
          time: wizard.simpleMatch.time,
          bracket: 'winner',
          description: wizard.simpleMatch.title,
        }),
      })

      alert('Match created successfully!')

      // Refresh and Close
      if (tournamentId) {
        fetchTeams(tournamentId)
        fetchMatches(tournamentId)
      }
      setWizard({ ...wizard, phase: 'idle' })

    } catch (e) {
      alert('Failed to save match: ' + (e instanceof Error ? e.message : 'Unknown error'))
    } finally {
      setSavingMatch(false)
    }
  }


  const openScorecardDownload = (match: Match) => {
    setScorecardRemarksMatch(match)
    setScorecardRemarksText('')
    setScorecardRemarksOpen(true)
  }

  const downloadScorecardPdf = async (remarks?: string) => {
    if (!scorecardRemarksMatch) return
    setDownloadingScorecard(true)
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://sports-backend-fgsp.onrender.com'
      const baseUrl = API_BASE.replace(/\/api$/, '')
      const token = getAuthToken()
      const body: Record<string, string> = {}
      if (remarks?.trim()) body.remarks = remarks.trim()
      const response = await fetch(
        `${baseUrl}/api/admin/matches/${scorecardRemarksMatch._id}/scorecard-pdf`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      )
      if (!response.ok) throw new Error('Failed to generate Score Card PDF')
      const contentDisposition = response.headers.get('Content-Disposition')
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `scorecard_${scorecardRemarksMatch._id}.pdf`
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      setScorecardRemarksOpen(false)
      setScorecardRemarksMatch(null)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to generate Score Card PDF')
    } finally {
      setDownloadingScorecard(false)
    }
  }

  // Handle registration approval
  const handleApprove = async (registrationId: string) => {
    try {
      await apiRequest(`/admin/tournament-registrations/${registrationId}/status`, {
        method: 'PATCH',
        auth: true,
        body: JSON.stringify({ status: 'approved' }),
      })
      if (tournamentId) {
        const res = await apiRequest<{ registrations: TournamentRegistration[] }>(
          `/admin/tournaments/${tournamentId}/registrations`,
          { auth: true }
        )
        setRegistrations(Array.isArray(res.registrations) ? res.registrations : [])
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to approve')
    }
  }

  // Quick Registration Handlers
  const fetchQuickRegPeople = async (districtId: string, type: 'player' | 'coach' | 'referee', query: string) => {
    if (!districtId) {
      setQuickRegResults([])
      return
    }

    let endpoint = ''
    if (type === 'player') endpoint = '/admin/players/search'
    else if (type === 'coach') endpoint = '/admin/coaches/search'
    else endpoint = '/admin/referees/search'

    const districtMeta = getDistrictById(districtId)
    const params = new URLSearchParams({ district: districtMeta?.code || districtMeta?.id || districtId })
    if (districtMeta?.name) {
      params.set('districtName', districtMeta.name)
    }
    if (query.trim().length >= 2) {
      params.set('q', query.trim())
    }

    const res = await apiRequest<any>(`${endpoint}?${params.toString()}`, { auth: true })

    setQuickRegPage(1)
    if (type === 'player') setQuickRegResults(res.players || [])
    else if (type === 'coach') setQuickRegResults(res.coaches || [])
    else setQuickRegResults(res.referees || [])
  }

  const handleQuickRegSearch = async (query: string) => {
    setQuickRegSearch(query)
    if (!quickRegDistrict) {
      setQuickRegResults([])
      return
    }

    try {
      setQuickRegLoading(true)
      await fetchQuickRegPeople(quickRegDistrict, quickRegType, query)
    } catch (e) {
      console.error('Search error:', e)
      setQuickRegResults([])
    } finally {
      setQuickRegLoading(false)
    }
  }

  const handleQuickRegDistrictChange = async (
    districtId: string,
    type: 'player' | 'coach' | 'referee' = quickRegType,
  ) => {
    setQuickRegDistrict(districtId)
    setQuickRegSearch('')
    if (!districtId) {
      setQuickRegResults([])
      return
    }
    try {
      setQuickRegLoading(true)
      await fetchQuickRegPeople(districtId, type, '')
    } catch (e) {
      console.error('District load error:', e)
      setQuickRegResults([])
    } finally {
      setQuickRegLoading(false)
    }
  }

  const resetQuickRegModal = () => {
    setIsQuickRegModalOpen(false)
    setQuickRegDistrict('')
    setQuickRegSearch('')
    setQuickRegResults([])
  }

  const handleQuickRegister = async (userId: string) => {
    if (!tournamentId) return

    // Per-row busy flag: the modal-wide loading flag swaps the whole list out
    // for "Loading…", which makes the box jump and lose its scroll position.
    setQuickRegBusyId(userId)
    try {
      await apiRequest(`/admin/tournaments/${tournamentId}/registrations`, {
        method: 'POST',
        auth: true,
        body: JSON.stringify({
          userId,
          registerAs: quickRegType
        })
      })

      // Refresh registrations so the row shows "Registered" without closing the modal
      const res = await apiRequest<{ registrations: TournamentRegistration[] }>(
        `/admin/tournaments/${tournamentId}/registrations`,
        { auth: true }
      )
      setRegistrations(Array.isArray(res.registrations) ? res.registrations : [])

    } catch (e: any) {
      alert(e?.message || 'Failed to register participant')
    } finally {
      setQuickRegBusyId('')
    }
  }

  // Handle registration rejection
  const handleReject = async (registrationId: string) => {
    try {
      await apiRequest(`/admin/tournament-registrations/${registrationId}/status`, {
        method: 'PATCH',
        auth: true,
        body: JSON.stringify({ status: 'rejected' }),
      })
      if (tournamentId) {
        const res = await apiRequest<{ registrations: TournamentRegistration[] }>(
          `/admin/tournaments/${tournamentId}/registrations`,
          { auth: true }
        )
        setRegistrations(Array.isArray(res.registrations) ? res.registrations : [])
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to reject registration')
    }
  }

  // Handle registration deletion
  const handleDeleteRegistration = async (registrationId: string) => {
    if (!window.confirm('Are you sure you want to remove this participant from the tournament?')) {
      return
    }

    try {
      await apiRequest(`/admin/tournament-registrations/${registrationId}`, {
        method: 'DELETE',
        auth: true,
      })
      if (tournamentId) {
        const res = await apiRequest<{ registrations: TournamentRegistration[] }>(
          `/admin/tournaments/${tournamentId}/registrations`,
          { auth: true }
        )
        setRegistrations(Array.isArray(res.registrations) ? res.registrations : [])
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to delete registration')
    }
  }

  // Calculate stats
  const stats: Stats = useMemo(() => {
    return {
      total: registrations.length,
      pending: registrations.filter(r => r.status === 'pending').length,
      approved: registrations.filter(r => r.status === 'approved').length,
      rejected: registrations.filter(r => r.status === 'rejected').length,
    }
  }, [registrations])

  const resolveDistrict = (value?: string) => resolveDistrictName(value, districts)

  // Filter registrations
  const filteredRegistrations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return registrations.filter((r) => {
      const districtLabel = resolveDistrictName(r.applicant?.district, districts).toLowerCase()
      const displayId = formatRegistrationDisplayId(r).toLowerCase()
      const matchesSearch =
        !q ||
        r.applicant?.fullName?.toLowerCase().includes(q) ||
        r.applicant?.email?.toLowerCase().includes(q) ||
        displayId.includes(q) ||
        districtLabel.includes(q) ||
        (r.applicant?.district || '').toLowerCase().includes(q)
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter
      const matchesType = typeFilter === 'all' || r.registerAs === typeFilter
      return matchesSearch && matchesStatus && matchesType
    })
  }, [registrations, searchQuery, statusFilter, typeFilter, districts])

  if (tournamentLoading || !tournament) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        {tournamentLoading ? (
          <p className="text-gray-500">Loading tournament…</p>
        ) : (
          <div className="text-center space-y-2">
            <p className="text-gray-700 font-semibold">Tournament not found</p>
            <Link to="/admin/tournaments" className="text-[#5a0a8f] font-bold hover:underline">
              Back to Tournaments
            </Link>
          </div>
        )}
      </div>
    )
  }

  // Check if we show the wizard or the main content
  if (wizard.phase === 'create-match') {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#5a0a8f] to-[#400466] p-6 text-white flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-black">Create Match</h2>
              <p className="text-purple-100 text-sm mt-1">Set up teams and schedule a match</p>
            </div>
            <button
              onClick={() => setWizard({ ...wizard, phase: 'idle' })}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <span className="material-symbols-outlined text-3xl">close</span>
            </button>
          </div>

          <div className="p-6 flex-1 overflow-y-auto space-y-6">
            <div className="rounded-lg border border-purple-200 bg-purple-50 px-4 py-3 text-sm text-purple-900">
              {tournamentEventOptions.length > 1 ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold">Event Type:</span>
                  <div className="inline-flex rounded-lg border border-purple-200 bg-white p-0.5" role="radiogroup" aria-label="Match event type">
                    {tournamentEventOptions.map((et) => (
                      <button
                        key={et}
                        type="button"
                        role="radio"
                        aria-checked={wizardEventType === et}
                        onClick={() => setWizardEventType(et)}
                        className={`rounded-md px-3 py-1.5 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a0a8f] ${
                          wizardEventType === et
                            ? 'bg-[#5a0a8f] text-white'
                            : 'text-purple-900 hover:bg-purple-100'
                        }`}
                      >
                        {eventTypeLabel(et)}
                      </button>
                    ))}
                  </div>
                  <span>
                    {squadLimits.starters} playing player{squadLimits.starters !== 1 ? 's' : ''} +{' '}
                    {squadLimits.subs} substitute{squadLimits.subs !== 1 ? 's' : ''} per team (
                    {squadLimits.total} total)
                  </span>
                </div>
              ) : (
                <>
                  <span className="font-bold">Event Type:</span> {eventTypeLabel(matchEventType)} —{' '}
                  {squadLimits.starters} playing player{squadLimits.starters !== 1 ? 's' : ''} +{' '}
                  {squadLimits.subs} substitute{squadLimits.subs !== 1 ? 's' : ''} per team (
                  {squadLimits.total} total)
                </>
              )}
            </div>

            {/* Title, match no, round */}
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-bold uppercase tracking-wide text-gray-700 mb-2">
                  Match Title / Description
                </label>
                <input
                  type="text"
                  autoFocus
                  value={wizard.simpleMatch.title}
                  onChange={(e) => setWizard(prev => ({
                    ...prev,
                    simpleMatch: { ...prev.simpleMatch, title: e.target.value }
                  }))}
                  placeholder="e.g. Quarter Final 1, League Match A vs B"
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5a0a8f] font-semibold text-gray-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold uppercase tracking-wide text-gray-700 mb-2">
                  Match No.
                </label>
                <input
                  type="text"
                  value={wizard.simpleMatch.matchNo}
                  onChange={(e) =>
                    setWizard((prev) => ({
                      ...prev,
                      simpleMatch: { ...prev.simpleMatch, matchNo: e.target.value },
                    }))
                  }
                  placeholder="e.g. 12"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5a0a8f] font-semibold text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-bold uppercase tracking-wide text-gray-700 mb-2">
                  Round
                </label>
                <input
                  type="text"
                  value={wizard.simpleMatch.round}
                  onChange={(e) =>
                    setWizard((prev) => ({
                      ...prev,
                      simpleMatch: { ...prev.simpleMatch, round: e.target.value },
                    }))
                  }
                  placeholder="e.g. Quarter Final"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5a0a8f] font-semibold text-gray-900"
                />
              </div>
            </div>


            {/* Date and Time Input */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold uppercase tracking-wide text-gray-700 mb-2">
                  Match Date
                </label>
                <input
                  type="date"
                  value={wizard.simpleMatch.date}
                  onChange={(e) => setWizard(prev => ({
                    ...prev,
                    simpleMatch: { ...prev.simpleMatch, date: e.target.value }
                  }))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5a0a8f] font-semibold text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-bold uppercase tracking-wide text-gray-700 mb-2">
                  Match Time
                </label>
                <input
                  type="time"
                  value={wizard.simpleMatch.time}
                  onChange={(e) => setWizard(prev => ({
                    ...prev,
                    simpleMatch: { ...prev.simpleMatch, time: e.target.value }
                  }))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5a0a8f] font-semibold text-gray-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Team 1 Section */}
              <div className="bg-blue-50 rounded-xl p-5 border-2 border-blue-200">
                <h3 className="text-xl font-black text-blue-900 mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined">shield</span> Team A
                </h3>

                <div className="mb-4">
                  <label className="block text-xs font-bold uppercase text-blue-800 mb-1">Registered Team</label>
                  <select
                    value={matchTeamSel[1]}
                    onChange={(e) => handleMatchTeamSelect(1, e.target.value)}
                    className="w-full px-3 py-2 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white text-gray-900"
                  >
                    <option value="">Select team…</option>
                    {matchRegisteredTeams(1).map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name} · {teamTypeLabel(t.teamType)} ({(t.members || []).length} players)
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[11px] text-blue-700">
                    {matchTeamSel[1]
                      ? 'Team name is taken from the registered team — adjust playing / subs below.'
                      : 'Pick a registered team to load its players.'}
                  </p>
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-bold uppercase text-blue-800 mb-1">Squad</label>
                  {(() => {
                    const c = countSquad(wizard.simpleMatch.team1Players)
                    return (
                      <p className="text-xs font-semibold text-blue-700 mb-2">
                        Playing: {c.starters}/{squadLimits.starters} · Subs: {c.subs}/{squadLimits.subs} · Total:{' '}
                        {c.total}/{squadLimits.total}
                      </p>
                    )
                  })()}
                </div>

                <div className="space-y-3">
                  {wizard.simpleMatch.team1Players.map(p => (
                    <div key={p._id} className="bg-white px-3 py-3 rounded-lg border border-blue-100 shadow-sm">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex-1 flex items-center gap-3">
                          <TeamMemberAvatar photo={p.profilePhoto} name={p.fullName} size="sm" />
                          <div>
                            <div className="font-semibold text-blue-900 text-base">{p.fullName}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{p.playerId || 'N/A'}</div>
                          </div>
                        </div>
                        <button onClick={() => removePlayerFromTeam(1, p._id)} className="text-red-500 hover:text-red-700 font-bold text-2xl leading-none ml-2">×</button>
                      </div>
                      <div className="grid grid-cols-1 gap-2.5">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-blue-700 font-semibold mb-1">Jersey #</label>
                            <input
                              type="number"
                              value={p.jerseyNumber || ''}
                              onChange={(e) => updatePlayerJerseyNumber(1, p._id, parseInt(e.target.value) || 0)}
                              placeholder="Number"
                              className="w-full px-3 py-2 border-2 border-blue-200 rounded-lg text-base font-semibold text-blue-900 focus:outline-none focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-blue-700 font-semibold mb-1">Position</label>
                            <input
                              type="text"
                              value={p.position || ''}
                              onChange={(e) => updatePlayerPosition(1, p._id, e.target.value)}
                              placeholder="e.g. Forward"
                              className="w-full px-3 py-2 border-2 border-blue-200 rounded-lg text-base font-semibold text-blue-900 focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                            <input
                              type="checkbox"
                              checked={p.isCaptain || false}
                              onChange={() => togglePlayerCaptain(1, p._id)}
                              className="w-4 h-4 rounded"
                            />
                            <span className="text-blue-700">Captain</span>
                          </label>
                          <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                            <input
                              type="checkbox"
                              checked={p.isSubstitute || false}
                              onChange={() => togglePlayerSubstitute(1, p._id)}
                              className="w-4 h-4 rounded"
                            />
                            <span className="text-blue-700">Sub</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                  {wizard.simpleMatch.team1Players.length === 0 && (
                    <div className="text-center py-4 text-blue-400 text-sm italic">No players added</div>
                  )}
                </div>

                {/* Team 1 Coach */}
                <div className="mt-4">
                  <label className="block text-xs font-bold uppercase text-blue-800 mb-1">Team Coach</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={activeCoachSide === 1 ? coachSearch : wizard.simpleMatch.team1CoachName}
                      onFocus={() => {
                        setCoachSearch(wizard.simpleMatch.team1CoachName)
                        setActiveCoachSide(1)
                      }}
                      onChange={(e) => {
                        setCoachName(1, e.target.value)
                        handleCoachSearch(e.target.value, 1)
                      }}
                      placeholder="Type name or search to select..."
                      className="w-full px-3 py-2 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white text-gray-900"
                    />
                    {activeCoachSide === 1 && coachResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-2 bg-white rounded-lg shadow-xl border-2 border-blue-300 max-h-48 overflow-y-auto">
                        {coachResults.map((c) => (
                          <div
                            key={c._id}
                            onClick={() => selectCoach(1, c)}
                            className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b last:border-0 flex justify-between items-center"
                          >
                            <div>
                              <div className="font-semibold text-sm text-gray-900">{c.fullName}</div>
                              <div className="text-xs text-gray-500">{c.email} {c.phone && `• ${c.phone}`}</div>
                            </div>
                            <span className="text-blue-600 font-bold">+</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Team 1 Manager */}
                <div className="mt-4">
                  <label className="block text-xs font-bold uppercase text-blue-800 mb-1">Team Manager</label>
                  <input
                    type="text"
                    value={wizard.simpleMatch.team1Manager}
                    onChange={(e) => setWizard(prev => ({
                      ...prev,
                      simpleMatch: { ...prev.simpleMatch, team1Manager: e.target.value }
                    }))}
                    placeholder="Enter manager name..."
                    className="w-full px-3 py-2 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white text-gray-900"
                  />
                </div>
              </div>

              {/* Team 2 Section */}
              <div className="bg-orange-50 rounded-xl p-5 border-2 border-orange-200">
                <h3 className="text-xl font-black text-orange-900 mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined">shield</span> Team B
                </h3>

                <div className="mb-4">
                  <label className="block text-xs font-bold uppercase text-orange-800 mb-1">Registered Team</label>
                  <select
                    value={matchTeamSel[2]}
                    onChange={(e) => handleMatchTeamSelect(2, e.target.value)}
                    className="w-full px-3 py-2 border-2 border-orange-200 rounded-lg focus:outline-none focus:border-orange-500 bg-white text-gray-900"
                  >
                    <option value="">Select team…</option>
                    {matchRegisteredTeams(2).map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name} · {teamTypeLabel(t.teamType)} ({(t.members || []).length} players)
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[11px] text-orange-700">
                    {matchTeamSel[2]
                      ? 'Team name is taken from the registered team — adjust playing / subs below.'
                      : 'Pick a registered team to load its players.'}
                  </p>
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-bold uppercase text-orange-800 mb-1">Squad</label>
                  {(() => {
                    const c = countSquad(wizard.simpleMatch.team2Players)
                    return (
                      <p className="text-xs font-semibold text-orange-700 mb-2">
                        Playing: {c.starters}/{squadLimits.starters} · Subs: {c.subs}/{squadLimits.subs} · Total:{' '}
                        {c.total}/{squadLimits.total}
                      </p>
                    )
                  })()}
                </div>

                <div className="space-y-3">
                  {wizard.simpleMatch.team2Players.map(p => (
                    <div key={p._id} className="bg-white px-3 py-3 rounded-lg border border-orange-100 shadow-sm">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex-1 flex items-center gap-3">
                          <TeamMemberAvatar photo={p.profilePhoto} name={p.fullName} size="sm" />
                          <div>
                            <div className="font-semibold text-orange-900 text-base">{p.fullName}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{p.playerId || 'N/A'}</div>
                          </div>
                        </div>
                        <button onClick={() => removePlayerFromTeam(2, p._id)} className="text-red-500 hover:text-red-700 font-bold text-2xl leading-none ml-2">×</button>
                      </div>
                      <div className="grid grid-cols-1 gap-2.5">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-orange-700 font-semibold mb-1">Jersey #</label>
                            <input
                              type="number"
                              value={p.jerseyNumber || ''}
                              onChange={(e) => updatePlayerJerseyNumber(2, p._id, parseInt(e.target.value) || 0)}
                              placeholder="Number"
                              className="w-full px-3 py-2 border-2 border-orange-200 rounded-lg text-base font-semibold text-orange-900 focus:outline-none focus:border-orange-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-orange-700 font-semibold mb-1">Position</label>
                            <input
                              type="text"
                              value={p.position || ''}
                              onChange={(e) => updatePlayerPosition(2, p._id, e.target.value)}
                              placeholder="e.g. Forward"
                              className="w-full px-3 py-2 border-2 border-orange-200 rounded-lg text-base font-semibold text-orange-900 focus:outline-none focus:border-orange-500"
                            />
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                            <input
                              type="checkbox"
                              checked={p.isCaptain || false}
                              onChange={() => togglePlayerCaptain(2, p._id)}
                              className="w-4 h-4 rounded"
                            />
                            <span className="text-orange-700">Captain</span>
                          </label>
                          <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                            <input
                              type="checkbox"
                              checked={p.isSubstitute || false}
                              onChange={() => togglePlayerSubstitute(2, p._id)}
                              className="w-4 h-4 rounded"
                            />
                            <span className="text-orange-700">Sub</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                  {wizard.simpleMatch.team2Players.length === 0 && (
                    <div className="text-center py-4 text-orange-400 text-sm italic">No players added</div>
                  )}
                </div>

                
                <div className="mt-4">
                  <label className="block text-xs font-bold uppercase text-orange-800 mb-1">Team Coach</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={activeCoachSide === 2 ? coachSearch : wizard.simpleMatch.team2CoachName}
                      onFocus={() => {
                        setCoachSearch(wizard.simpleMatch.team2CoachName)
                        setActiveCoachSide(2)
                      }}
                      onChange={(e) => {
                        setCoachName(2, e.target.value)
                        handleCoachSearch(e.target.value, 2)
                      }}
                      placeholder="Type name or search to select..."
                      className="w-full px-3 py-2 border-2 border-orange-200 rounded-lg focus:outline-none focus:border-orange-500 bg-white text-gray-900"
                    />
                    {activeCoachSide === 2 && coachResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-2 bg-white rounded-lg shadow-xl border-2 border-orange-300 max-h-48 overflow-y-auto">
                        {coachResults.map((c) => (
                          <div
                            key={c._id}
                            onClick={() => selectCoach(2, c)}
                            className="px-3 py-2 hover:bg-orange-50 cursor-pointer border-b last:border-0 flex justify-between items-center"
                          >
                            <div>
                              <div className="font-semibold text-sm text-gray-900">{c.fullName}</div>
                              <div className="text-xs text-gray-500">{c.email} {c.phone && `• ${c.phone}`}</div>
                            </div>
                            <span className="text-orange-600 font-bold">+</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-xs font-bold uppercase text-orange-800 mb-1">Team Manager</label>
                  <input
                    type="text"
                    value={wizard.simpleMatch.team2Manager}
                    onChange={(e) => setWizard(prev => ({
                      ...prev,
                      simpleMatch: { ...prev.simpleMatch, team2Manager: e.target.value }
                    }))}
                    placeholder="Enter manager name..."
                    className="w-full px-3 py-2 border-2 border-orange-200 rounded-lg focus:outline-none focus:border-orange-500 bg-white text-gray-900"
                  />
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-xl p-5 border-2 border-green-200">
              <h3 className="text-lg font-black text-green-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined">gavel</span> Match Officials
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                <div>
                  <label className="block text-xs font-bold uppercase text-green-800 mb-1">Referee</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={activeRefereeSide === 'main' ? refereeSearch : wizard.simpleMatch.refereeName}
                      onFocus={() => {
                        setRefereeSearch(wizard.simpleMatch.refereeName)
                        setActiveRefereeSide('main')
                      }}
                      onChange={(e) => {
                        setRefereeName('main', e.target.value)
                        handleRefereeSearch(e.target.value, 'main')
                      }}
                      placeholder="Type or search referee..."
                      className="w-full px-3 py-2 border-2 border-green-200 rounded-lg focus:outline-none focus:border-green-500 bg-white text-gray-900"
                    />
                    {activeRefereeSide === 'main' && refereeResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-2 bg-white rounded-lg shadow-xl border-2 border-green-300 max-h-48 overflow-y-auto">
                        {refereeResults.map((r) => (
                          <div
                            key={r._id}
                            onClick={() => selectReferee('main', r)}
                            className="px-3 py-2 hover:bg-green-50 cursor-pointer border-b last:border-0"
                          >
                            <div className="font-semibold text-sm text-gray-900">{r.fullName}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-green-800 mb-1">Asst. Referee</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={activeRefereeSide === 'assistant' ? refereeSearch : wizard.simpleMatch.assistantRefereeName}
                      onFocus={() => {
                        setRefereeSearch(wizard.simpleMatch.assistantRefereeName)
                        setActiveRefereeSide('assistant')
                      }}
                      onChange={(e) => {
                        setRefereeName('assistant', e.target.value)
                        handleRefereeSearch(e.target.value, 'assistant')
                      }}
                      placeholder="Type or search assistant..."
                      className="w-full px-3 py-2 border-2 border-green-200 rounded-lg focus:outline-none focus:border-green-500 bg-white text-gray-900"
                    />
                    {activeRefereeSide === 'assistant' && refereeResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-2 bg-white rounded-lg shadow-xl border-2 border-green-300 max-h-48 overflow-y-auto">
                        {refereeResults.map((r) => (
                          <div
                            key={r._id}
                            onClick={() => selectReferee('assistant', r)}
                            className="px-3 py-2 hover:bg-green-50 cursor-pointer border-b last:border-0"
                          >
                            <div className="font-semibold text-sm text-gray-900">{r.fullName}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-green-800 mb-1">Official Referee</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={activeRefereeSide === 'official' ? refereeSearch : wizard.simpleMatch.officialRefereeName}
                      onFocus={() => {
                        setRefereeSearch(wizard.simpleMatch.officialRefereeName)
                        setActiveRefereeSide('official')
                      }}
                      onChange={(e) => {
                        setRefereeName('official', e.target.value)
                        handleRefereeSearch(e.target.value, 'official')
                      }}
                      placeholder="Type or search official referee..."
                      className="w-full px-3 py-2 border-2 border-green-200 rounded-lg focus:outline-none focus:border-green-500 bg-white text-gray-900"
                    />
                    {activeRefereeSide === 'official' && refereeResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-2 bg-white rounded-lg shadow-xl border-2 border-green-300 max-h-48 overflow-y-auto">
                        {refereeResults.map((r) => (
                          <div
                            key={r._id}
                            onClick={() => selectReferee('official', r)}
                            className="px-3 py-2 hover:bg-green-50 cursor-pointer border-b last:border-0"
                          >
                            <div className="font-semibold text-sm text-gray-900">{r.fullName}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
            <button
              onClick={() => setWizard({ ...wizard, phase: 'idle' })}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={saveSimpleMatch}
              disabled={savingMatch}
              className="px-6 py-3 bg-[#5a0a8f] text-white rounded-xl font-bold hover:bg-[#4a087a] transition-all disabled:opacity-60"
            >
              {savingMatch ? 'Saving…' : 'Save & Exit'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const isRegistered = (userId: string, type: string) =>
    registrations.some((r) => r.userId === userId && r.registerAs === type)

  const roleBadgeClass = (role: string) => {
    if (role === 'coach') return 'bg-blue-100 text-blue-800'
    if (role === 'referee') return 'bg-violet-100 text-violet-800'
    return 'bg-emerald-100 text-emerald-800'
  }

  return (
    <div className="max-w-7xl mx-auto w-full space-y-6">
        <div className="rounded-2xl bg-gradient-to-r from-[#5a0a8f] via-[#6d1ba8] to-[#400466] p-6 text-white shadow-lg">
          <Link to="/admin/tournaments" className="text-purple-200 hover:text-white text-sm font-semibold flex items-center gap-1 mb-3">
            <span className="material-symbols-outlined text-lg">arrow_back</span> Back to Tournaments
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-purple-200 text-xs font-bold uppercase tracking-widest mb-1">Tournament Manager</p>
              <h1 className="text-2xl md:text-3xl font-black">{tournament.title}</h1>
              <p className="text-purple-100/90 mt-2 text-sm">
                {tournament.venueName && `${tournament.venueName} · `}
                {eventTypeLabel(matchEventType)} · {tournament.status}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setIsQuickRegModalOpen(true)} className="px-4 py-2 bg-white/10 border-2 border-white/40 text-white rounded-lg font-bold hover:bg-white/20 backdrop-blur">Quick Registration</button>
              <button type="button" onClick={startCreateMatch} className="px-4 py-2 bg-white text-[#5a0a8f] rounded-lg font-bold hover:bg-purple-50 shadow">Create Match</button>
              <button type="button" onClick={handleDownloadSchedulePdf} className="px-4 py-2 bg-gray-900/80 text-white rounded-lg font-bold hover:bg-gray-900 border border-white/20">Download Schedule PDF</button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total', value: stats.total, color: 'bg-gray-100 text-gray-800' },
            { label: 'Pending', value: stats.pending, color: 'bg-amber-100 text-amber-800' },
            { label: 'Approved', value: stats.approved, color: 'bg-green-100 text-green-800' },
            { label: 'Rejected', value: stats.rejected, color: 'bg-red-100 text-red-800' },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
              <p className="text-sm font-semibold opacity-80">{s.label}</p>
              <p className="text-2xl font-black">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {(['registrations', 'matches', 'teams', 'winners'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-bold capitalize border-b-2 -mb-px ${
                activeTab === tab ? 'border-[#5a0a8f] text-[#5a0a8f]' : 'border-transparent text-gray-500'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">{error}</div>}

        {activeTab === 'registrations' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <input type="text" placeholder="Search by name, ID, or district..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white" />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white">
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white">
                <option value="all">All types</option>
                <option value="player">Players</option>
                <option value="coach">Coaches</option>
                <option value="referee">Referees</option>
              </select>
            </div>
            {loading ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
                Loading registrations…
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
                <table className="w-full text-sm min-w-[720px]">
                  <thead className="bg-gray-200 border-b border-gray-300">
                    <tr>
                      <th className="text-center px-3 py-3 text-xs font-black uppercase tracking-wide text-gray-900 w-14">S.No</th>
                      <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-wide text-gray-900">Name</th>
                      <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-wide text-gray-900">ID</th>
                      <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-wide text-gray-900">Type</th>
                      <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-wide text-gray-900">District</th>
                      <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-wide text-gray-900">Status</th>
                      <th className="text-right px-4 py-3 text-xs font-black uppercase tracking-wide text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredRegistrations.map((r, index) => (
                      <tr key={r._id} className="hover:bg-gray-50/80">
                        <td className="px-3 py-3 text-center font-bold text-gray-800">{index + 1}</td>
                        <td className="px-4 py-3 font-semibold text-gray-900">{r.applicant?.fullName?.trim() || 'Unknown participant'}</td>
                        <td className="px-4 py-3 text-gray-700 font-mono text-xs">{formatRegistrationDisplayId(r)}</td>
                        <td className="px-4 py-3">
                          <span className={`capitalize text-xs font-bold px-2.5 py-1 rounded-full ${roleBadgeClass(r.registerAs)}`}>
                            {r.registerAs}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-800">{resolveDistrict(r.applicant?.district)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${r.status === 'approved' ? 'bg-green-600 text-white' : r.status === 'rejected' ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'}`}>{r.status}</span>
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          {r.status === 'pending' && (
                            <>
                              <button type="button" onClick={() => handleApprove(r._id)} className="text-green-700 font-bold hover:underline">Approve</button>
                              <button type="button" onClick={() => handleReject(r._id)} className="text-red-700 font-bold hover:underline">Reject</button>
                            </>
                          )}
                          <button type="button" onClick={() => handleDeleteRegistration(r._id)} className="text-gray-700 hover:text-red-700 font-bold">Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredRegistrations.length === 0 && <p className="p-8 text-center text-gray-500">No registrations found.</p>}
              </div>
            )}
          </div>
        )}

        {activeTab === 'matches' && (
          <div className="space-y-4">
            {matches.length === 0 ? (
              <p className="text-gray-500">No matches yet. Create a match to get started.</p>
            ) : (
              matches.map((match) => {
                const label = match.description?.trim()
                const teamsLine = `${match.team1} vs ${match.team2}`
                const showLabel = Boolean(label && label.toLowerCase() !== teamsLine.toLowerCase())
                return (
                <div key={match._id} className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap justify-between gap-3 shadow-sm">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-lg text-gray-900">{teamsLine}</p>
                    <p className="text-sm text-gray-600 mt-0.5">{formatMatchMetaLine(match)}</p>
                    {showLabel && (
                      <p className="text-xs text-[#5a0a8f] font-semibold mt-1">Match label: {label}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => { setSelectedMatchForScore(match); setIsScoreModalOpen(true) }} className="px-3 py-1.5 bg-[#5a0a8f] text-white rounded-lg text-sm font-bold">Update Score</button>
                    <button type="button" onClick={() => openScorecardDownload(match)} className="px-3 py-1.5 border-2 border-[#5a0a8f] text-[#5a0a8f] rounded-lg text-sm font-bold">Score Card</button>
                    <button type="button" onClick={() => handleDeleteMatch(match._id, match.team1, match.team2)} className="px-3 py-1.5 border border-red-300 text-red-600 rounded-lg text-sm font-bold">Delete</button>
                  </div>
                </div>
              )})
            )}
          </div>
        )}

        {activeTab === 'teams' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {['TEAM', 'DISTRICT', 'TYPE', 'PLAYERS', 'STATUS', 'CREATED', 'ACTIONS'].map((h) => (
                        <th key={h} className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {teams.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                          No teams yet for this tournament.
                        </td>
                      </tr>
                    ) : (
                      teams.map((team) => (
                        <tr key={team._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-semibold text-gray-900">{team.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {team.district ? (
                              <span className="inline-flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-base text-[#5a0a8f]">location_on</span>
                                {team.district.name}
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            <div>{teamTypeLabel(team.teamType)}</div>
                            <div className="mt-1">
                              <GenderCategoryBadge value={team.genderCategory} />
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            <div className="font-semibold">{team.members.length}</div>
                            {team.members.length > 0 && (
                              <div className="text-xs text-gray-500 max-w-[220px] truncate" title={team.members.map((m) => teamMemberName(m)).join(', ')}>
                                {team.members.map((m) => teamMemberName(m)).join(', ')}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                                team.status === 'approved'
                                  ? 'bg-green-100 text-green-800'
                                  : team.status === 'rejected'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-orange-100 text-orange-800'
                              }`}
                            >
                              {team.status || 'pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {team.createdAt ? new Date(team.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => setSelectedTeam(team)}
                              className="text-[#5a0a8f] hover:underline text-sm font-medium"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Team details modal */}
            {selectedTeam && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Team Details</h2>
                    <button
                      onClick={() => setSelectedTeam(null)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label="Close"
                    >
                      <span className="material-symbols-outlined text-2xl">close</span>
                    </button>
                  </div>
                  <div className="p-6 space-y-4 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase">Team</div>
                        <div className="font-semibold text-gray-900">{selectedTeam.name}</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase">Team Type</div>
                        <div className="font-semibold text-gray-900">{teamTypeLabel(selectedTeam.teamType)}</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase">Category</div>
                        <div className="mt-1">
                          <GenderCategoryBadge value={selectedTeam.genderCategory} />
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase">District</div>
                        <div className="font-semibold text-gray-900">
                          {selectedTeam.district ? `${selectedTeam.district.name} (${selectedTeam.district.code})` : '—'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase">Tournament</div>
                        <div className="font-semibold text-gray-900">{tournament?.title || '—'}</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase">Registration Status</div>
                        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold capitalize bg-gray-100 text-gray-700">
                          {selectedTeam.status || 'pending'}
                        </span>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase">Created By</div>
                        <div className="font-semibold text-gray-900">
                          {selectedTeam.district ? 'District' : 'Admin'}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Players</div>
                      {selectedTeam.members.length === 0 ? (
                        <p className="text-gray-500">No players assigned.</p>
                      ) : (
                        <ol className="space-y-2">
                          {selectedTeam.members.map((m, i) => (
                            <li key={m._id} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2">
                              <span className="w-7 h-7 rounded-full bg-[#5a0a8f]/10 text-[#5a0a8f] flex items-center justify-center text-xs font-bold">
                                {i + 1}
                              </span>
                              <TeamMemberAvatar photo={m.profilePhoto} name={teamMemberName(m)} size="sm" />
                              <div>
                                <div className="font-medium text-gray-900">{teamMemberName(m)}</div>
                                <div className="text-xs text-gray-500">
                                  Player ID: {m.playerId || '—'}
                                  {m.gender ? ` · ${m.gender}` : ''}
                                </div>
                              </div>
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'winners' && (
          <div className="space-y-8">
            <div className="rounded-2xl bg-gradient-to-r from-[#5a0a8f] via-[#6d1ba8] to-[#400466] p-6 md:p-8 text-white shadow-xl">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-purple-200 text-xs font-bold uppercase tracking-widest mb-1">Podium</p>
                  <h2 className="text-2xl md:text-3xl font-black">Tournament Winners</h2>
                  <p className="text-purple-100/90 mt-2 max-w-xl text-sm">
                    Choose a district for each medal place, then select registered players. Approved registrations appear automatically.
                  </p>
                </div>
                <span className="material-symbols-outlined text-5xl text-white/30">emoji_events</span>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {renderWinnerPlace('first')}
              {renderWinnerPlace('second')}
              {renderWinnerPlace('third')}
            </div>

            <div className="flex flex-wrap justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleSaveWinners}
                disabled={savingWinners}
                className="px-8 py-3.5 bg-gradient-to-r from-[#5a0a8f] to-[#400466] text-white rounded-xl font-black shadow-lg shadow-purple-300/40 hover:shadow-xl disabled:opacity-60 transition-all"
              >
                {savingWinners ? 'Saving winners…' : 'Save all winners'}
              </button>
            </div>
          </div>
        )}

      <UpdateScoreModal isOpen={isScoreModalOpen} onClose={() => { setIsScoreModalOpen(false); setSelectedMatchForScore(null); if (tournamentId) fetchMatches(tournamentId) }} preSelectedTournamentId={tournamentId} preSelectedMatch={selectedMatchForScore || undefined} />
      <ScorecardRemarksModal isOpen={scorecardRemarksOpen} matchLabel={scorecardRemarksMatch ? `${scorecardRemarksMatch.team1} vs ${scorecardRemarksMatch.team2}` : undefined} remarks={scorecardRemarksText} downloading={downloadingScorecard} onRemarksChange={setScorecardRemarksText} onDownload={() => downloadScorecardPdf(scorecardRemarksText)} onClose={() => { if (!downloadingScorecard) { setScorecardRemarksOpen(false); setScorecardRemarksMatch(null) } }} />

      {isQuickRegModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="bg-[#5a0a8f] text-white p-5 flex justify-between items-center">
              <h2 className="text-xl font-black">Quick Registration</h2>
              <button type="button" onClick={resetQuickRegModal} className="text-white"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">District</label>
                <select value={quickRegDistrict} onChange={(e) => handleQuickRegDistrictChange(e.target.value)} className={selectClass}>
                  <option value="">Select district</option>
                  {districts.map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
                </select>
              </div>
              <div className="flex gap-2">
                {(['player', 'coach', 'referee'] as const).map((t) => (
                  <button key={t} type="button" onClick={() => { setQuickRegType(t); setQuickRegResults([]); if (quickRegDistrict) void handleQuickRegDistrictChange(quickRegDistrict, t) }} className={`px-3 py-1.5 rounded-lg text-sm font-bold capitalize ${quickRegType === t ? 'bg-[#5a0a8f] text-white' : 'bg-gray-100 text-gray-700'}`}>{t}</button>
                ))}
              </div>
              <input type="text" placeholder="Filter by name (optional)..." value={quickRegSearch} onChange={(e) => handleQuickRegSearch(e.target.value)} disabled={!quickRegDistrict} className={`${fieldClass} disabled:bg-gray-100 disabled:text-gray-500`} />
              {quickRegLoading ? <p className="text-gray-500 text-sm">Loading...</p> : !quickRegDistrict ? <p className="text-gray-500 text-sm">Select a district to see people.</p> : quickRegResults.length === 0 ? <p className="text-gray-500 text-sm">No {quickRegType}s found for this district.</p> : (
                <div className="space-y-2">
                  {quickRegResults
                    .slice((quickRegPage - 1) * QUICK_REG_PAGE_SIZE, quickRegPage * QUICK_REG_PAGE_SIZE)
                    .map((person: { _id: string; fullName: string; playerId?: string; coachId?: string; refereeId?: string }) => {
                    const already = isRegistered(person._id, quickRegType)
                    const displayId = formatPersonListId(quickRegType, person)
                    return (
                      <div key={person._id} className="flex justify-between items-center border rounded-lg p-3">
                        <div>
                          <p className="font-bold text-gray-900">{person.fullName}</p>
                          {displayId !== '—' && <p className="text-xs text-gray-500">{displayId}</p>}
                        </div>
                        {already ? <span className="text-green-600 text-sm font-bold">Registered</span> : (
                          <button type="button" disabled={quickRegBusyId === person._id} onClick={() => handleQuickRegister(person._id)} className="px-3 py-1 bg-[#5a0a8f] text-white rounded-lg text-sm font-bold disabled:opacity-60">{quickRegBusyId === person._id ? 'Registering…' : 'Register'}</button>
                        )}
                      </div>
                    )
                  })}
                  <ListPagination
                    page={quickRegPage}
                    totalItems={quickRegResults.length}
                    pageSize={QUICK_REG_PAGE_SIZE}
                    onPageChange={setQuickRegPage}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
