import { useEffect, useRef, useState } from 'react'
import { apiRequest } from '../../lib/api'
import { eventTypeLabel, roundNamesForEvent, setWinnerByRule, isDeuce, SET_CAP } from '../../lib/eventFormat'

type Tournament = {
    _id: string
    title: string
    status: string
}

type Match = {
    _id: string
    team1: string
    team2: string
    date: string
    time: string
    status?: 'scheduled' | 'ongoing' | 'completed'
    description?: string
    bracket?: 'winner' | 'loser'
    eventType?: 'regu' | 'double' | 'quad'
    scorecard?: {
        matchNo?: string
        round?: string
        startTime?: string
        endTime?: string
        remarks?: string
        substitutions?: SubstitutionRecord[]
    }
    regus?: {
        reguName: string
        startTime?: string
        endTime?: string
        team1Score: number
        team2Score: number
        winner?: 'team1' | 'team2' | null
        sets: {
            setNumber: number
            team1Score: number
            team2Score: number
            winner?: 'team1' | 'team2' | null
            team1Timeouts?: string[]
            team2Timeouts?: string[]
        }[]
    }[]
    team1Players?: {
        player?: { _id?: string; fullName?: string; name?: string } | string
        jerseyNumber?: number
        isSubstitute?: boolean
        entryTime?: string
        exitTime?: string
    }[]
    team2Players?: {
        player?: { _id?: string; fullName?: string; name?: string } | string
        jerseyNumber?: number
        isSubstitute?: boolean
        entryTime?: string
        exitTime?: string
    }[]
    score?: {
        team1: number
        team2: number
    }
    winner?: string
    activeTimeout?: {
        team: 'team1' | 'team2'
        teamName: string
        at: string
    } | null
}

type SubstitutionRecord = {
    reguName: string
    team: 'team1' | 'team2'
    teamLabel: string
    playerInName: string
    playerInJerseyNumber?: number
    playerOutName: string
    playerOutJerseyNumber?: number
    entryTime: string
    // exitTime will be recorded when the player is subbed out (automatic)
    exitTime?: string
    timePlayed: string
    // score snapshots to compute points while on court
    entryMatchScore?: { team1: number; team2: number }
    exitMatchScore?: { team1: number; team2: number }
    entrySetScore?: { team1: number; team2: number } | null
    exitSetScore?: { team1: number; team2: number } | null
    entrySetNumber?: number | null
    exitSetNumber?: number | null
    pointsDuring?: { team1: number; team2: number }
}

type Props = {
    isOpen: boolean
    onClose: () => void
    preSelectedTournamentId?: string
    preSelectedMatch?: Match
}

/**
 * Team names here are full association names ("DISTRICT SEPAKTAKRAW ASSOCIATION
 * BHIWANI"), too long to repeat on every button. Drop the boilerplate so the
 * distinguishing part survives; the full name stays in the scoreboard and on hover.
 */
const NAME_FILLER = new Set([
    'district', 'sepaktakraw', 'sepak', 'takraw', 'association', 'club', 'academy',
    'sports', 'sporting', 'amature', 'amateur', 'team', 'of', 'the', 'and', 'a',
])

export const shortTeamName = (full?: string) => {
    const words = String(full || '').trim().split(/\s+/).filter(Boolean)
    if (words.length === 0) return '—'
    const kept = words.filter((w) => !NAME_FILLER.has(w.toLowerCase().replace(/[^a-z]/gi, '')))
    const label = (kept.length > 0 ? kept : words).join(' ')
    return label.length > 24 ? `${label.slice(0, 23)}…` : label
}

export function UpdateScoreModal({ isOpen, onClose, preSelectedTournamentId, preSelectedMatch }: Props) {
    const [loading, setLoading] = useState(false)
    const [tournaments, setTournaments] = useState<Tournament[]>([])
    const [selectedTournamentId, setSelectedTournamentId] = useState('')

    const [matches, setMatches] = useState<Match[]>([])
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
    const [selectedReguIndex, setSelectedReguIndex] = useState<number>(0)
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState<string | null>(null)
    // Which action is waiting for a second click. One at a time.
    const [pendingConfirm, setPendingConfirm] = useState<string | null>(null)
    const substitutionRef = useRef<HTMLDivElement>(null)
    const [substitutionDraft, setSubstitutionDraft] = useState<SubstitutionRecord | null>(null)
    const [substitutions, setSubstitutions] = useState<SubstitutionRecord[]>([])

    // Load tournaments on mount/open
    useEffect(() => {
        if (isOpen) {
            // If a match is pre-selected, use it directly
            if (preSelectedMatch) {
                setSelectedMatch(preSelectedMatch)
            } else {
                loadTournaments()
                // Auto-select tournament if provided
                if (preSelectedTournamentId) {
                    setSelectedTournamentId(preSelectedTournamentId)
                }
            }
            setSelectedReguIndex(0)
        } else {
            // Reset state on close
            setSelectedTournamentId('')
            setMatches([])
            setSelectedMatch(null)
            setSelectedReguIndex(0)
            setSubstitutionDraft(null)
            setSubstitutions([])
        }
    }, [isOpen, preSelectedTournamentId, preSelectedMatch])

    // Load matches when tournament selected
    useEffect(() => {
        if (selectedTournamentId) {
            loadMatches(selectedTournamentId)
        } else {
            setMatches([])
        }
    }, [selectedTournamentId])

    // A pending confirmation belongs to the round and match it was raised on.
    useEffect(() => {
        setPendingConfirm(null)
    }, [selectedReguIndex, selectedMatch?._id, isOpen])

    // The substitution editor opens further down the scroll area than the button
    // that opened it, so bring it to the reader.
    useEffect(() => {
        if (substitutionDraft) {
            substitutionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
    }, [substitutionDraft?.team, substitutionDraft?.reguName])

    // Sync substitutions state when match is selected/updated
    useEffect(() => {
        if (selectedMatch?.scorecard?.substitutions) {
            setSubstitutions(selectedMatch.scorecard.substitutions)
        } else {
            setSubstitutions([])
        }
    }, [selectedMatch])

    const loadTournaments = async () => {
        try {
            setLoading(true)
            const res = await apiRequest<{ tournaments: Tournament[] }>('/tournaments')
            setTournaments(res.tournaments || [])
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const loadMatches = async (tId: string) => {
        try {
            setLoading(true)
            const res = await apiRequest<{ matches: Match[] }>(`/admin/matches?tournamentId=${tId}`, { auth: true })
            setMatches(res.matches || [])
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateScore = async (
        newRegus: Match['regus'],
        matchStatus?: string,
        winner?: string,
        subsToSave?: SubstitutionRecord[],
        scorecardPatch?: Partial<NonNullable<Match['scorecard']>>,
        extraFields?: Record<string, unknown>,
    ) => {
        if (!selectedMatch) return

        // Calculate overall match score based on Regu winners
        const team1Total = newRegus?.filter(r => r.winner === 'team1').length || 0
        const team2Total = newRegus?.filter(r => r.winner === 'team2').length || 0

        const mergedScorecard = {
            ...(selectedMatch.scorecard || {}),
            substitutions: subsToSave ?? substitutions,
            ...scorecardPatch,
        }

        // Show the change now; the request confirms it. Waiting for the round trip
        // made every tap — and "start set" especially — look like it did nothing.
        const previous = selectedMatch
        setSelectedMatch({
            ...selectedMatch,
            regus: newRegus,
            status: (matchStatus || selectedMatch.status || 'scheduled') as Match['status'],
            score: { team1: team1Total, team2: team2Total },
            scorecard: mergedScorecard,
            ...(winner !== undefined ? { winner } : null),
            ...('activeTimeout' in (extraFields || {})
                ? { activeTimeout: extraFields?.activeTimeout as Match['activeTimeout'] }
                : null),
        })

        setSaving(true)
        try {
            setSaveError(null)
            const updated = await apiRequest<{ match: Match }>(`/admin/matches/${selectedMatch._id}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    regus: newRegus,
                    status: matchStatus || selectedMatch.status || 'scheduled',
                    score: { team1: team1Total, team2: team2Total },
                    winner: winner,
                    scorecard: mergedScorecard,
                    ...extraFields,
                }),
                auth: true
            })
            setSelectedMatch(updated.match)
        } catch (err) {
            console.error('Failed to update score', err)
            setSelectedMatch(previous)
            setSaveError('That change could not be saved, so the score has been put back. Check your connection and try again.')
        } finally {
            setSaving(false)
        }
    }

    const ensureMatchAndReguStarted = (regus: Match['regus'], reguIndex: number) => {
        const now = formatNowHHMM()
        const scorecardPatch: Partial<NonNullable<Match['scorecard']>> = {}
        if (!selectedMatch?.scorecard?.startTime) {
            scorecardPatch.startTime = now
        }
        const updatedRegus = [...(regus || [])]
        if (updatedRegus[reguIndex] && !updatedRegus[reguIndex].startTime) {
            updatedRegus[reguIndex] = { ...updatedRegus[reguIndex], startTime: now }
        }
        return { updatedRegus, scorecardPatch }
    }

    // Rounds come from the event format (regu 1, double 2, quad 3), not from
    // whatever is stored: matches created before the format was enforced can
    // carry a different number. Saved rounds are reused by index.
    const savedRegus = selectedMatch?.regus || []
    const currentRegus = selectedMatch
        ? roundNamesForEvent(selectedMatch.eventType).map(
              (reguName, i) =>
                  savedRegus[i] || { reguName, team1Score: 0, team2Score: 0, winner: null, sets: [] },
          )
        : []
    const reguIndex = Math.min(selectedReguIndex, Math.max(currentRegus.length - 1, 0))
    const activeRegu = currentRegus[reguIndex]
    const activeReguName = activeRegu?.reguName || `Round ${reguIndex + 1}`

    const getPlayerName = (player?: { fullName?: string; name?: string } | string) => {
        if (!player) return ''
        if (typeof player === 'string') {
            // Hide raw DB ids (ObjectId-like strings) from the UI
            if (/^[0-9a-fA-F]{24}$/.test(player)) return ''
            return player
        }
        return player.fullName || player.name || ''
    }

    const formatNowHHMM = (d = new Date()) => {
        const hh = String(d.getHours()).padStart(2, '0')
        const mm = String(d.getMinutes()).padStart(2, '0')
        return `${hh}:${mm}`
    }

    const calcPlayed = (start?: string, end?: string) => {
        if (!start || !end) return '—'
        const s = new Date(`1970-01-01T${start}`)
        const e = new Date(`1970-01-01T${end}`)
        if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || e <= s) return '—'
        const minutes = Math.floor((e.getTime() - s.getTime()) / 60000)
        const hours = Math.floor(minutes / 60)
        const remaining = minutes % 60
        return hours > 0 ? `${hours}h ${remaining}m` : `${remaining} min`
    }

    const playerRefId = (player?: { _id?: string } | string) =>
        (typeof player === 'string' ? player : player?._id) || ''

    const buildPlayerOptions = (players?: Match['team1Players']) =>
        (players || []).map((player, index) => ({
            id: playerRefId(player.player),
            label: `${getPlayerName(player.player) || `Player ${index + 1}`}${player.jerseyNumber ? ` #${player.jerseyNumber}` : ''}`,
            value: getPlayerName(player.player) || `Player ${index + 1}`,
            jerseyNumber: player.jerseyNumber,
            isSubstitute: !!player.isSubstitute,
            entryTime: player.entryTime || '',
            exitTime: player.exitTime || '',
        }))

    const teamOptions = {
        team1: buildPlayerOptions(selectedMatch?.team1Players).filter(player => player.isSubstitute),
        team2: buildPlayerOptions(selectedMatch?.team2Players).filter(player => player.isSubstitute),
    }

    const playingOptions = {
        team1: buildPlayerOptions(selectedMatch?.team1Players).filter(player => !player.isSubstitute),
        team2: buildPlayerOptions(selectedMatch?.team2Players).filter(player => !player.isSubstitute),
    }

    // Helper to get current active set inside the active Regu
    const activeSetIndex = activeRegu?.sets?.findIndex(s => !s.winner) ?? -1
    const activeSet = activeSetIndex !== -1 && activeRegu?.sets ? activeRegu.sets[activeSetIndex] : null

    const createNewSet = () => {
        if (!selectedMatch || !activeRegu) return
        const currentSets = activeRegu.sets || []
        const nextSetNumber = currentSets.length + 1

        const { updatedRegus: startedRegus, scorecardPatch } = ensureMatchAndReguStarted(currentRegus, reguIndex)
        const newRegus = [...startedRegus]
        newRegus[reguIndex] = {
            ...startedRegus[reguIndex],
            sets: [...currentSets, {
                setNumber: nextSetNumber,
                team1Score: 0,
                team2Score: 0,
                winner: null,
                team1Timeouts: [],
                team2Timeouts: [],
            }],
        }

        handleUpdateScore(newRegus, 'ongoing', undefined, undefined, scorecardPatch)
    }

    const updateSetPoint = (team: 'team1' | 'team2', delta: number) => {
        if (!selectedMatch || !activeRegu || !activeSet || activeSetIndex === -1) return

        const { updatedRegus: startedRegus, scorecardPatch } = ensureMatchAndReguStarted(currentRegus, reguIndex)
        const newRegus = [...startedRegus]
        const currentSets = [...(activeRegu.sets || [])]
        const set = { ...currentSets[activeSetIndex] }

        if (team === 'team1') set.team1Score = Math.max(0, set.team1Score + delta)
        else set.team2Score = Math.max(0, set.team2Score + delta)

        currentSets[activeSetIndex] = set
        newRegus[reguIndex] = { ...startedRegus[reguIndex], sets: currentSets }

        handleUpdateScore(newRegus, 'ongoing', undefined, undefined, scorecardPatch)
    }

    const recordTimeout = (team: 'team1' | 'team2') => {
        if (!selectedMatch || !activeRegu || !activeSet || activeSetIndex === -1) return

        const { updatedRegus: startedRegus, scorecardPatch } = ensureMatchAndReguStarted(currentRegus, reguIndex)
        const newRegus = [...startedRegus]
        const currentSets = [...(activeRegu.sets || [])]
        const set = { ...currentSets[activeSetIndex] }
        const now = formatNowHHMM()
        const field = team === 'team1' ? 'team1Timeouts' : 'team2Timeouts'
        const existing = [...(set[field] || [])]
        existing.push(now)
        set[field] = existing

        currentSets[activeSetIndex] = set
        newRegus[reguIndex] = { ...startedRegus[reguIndex], sets: currentSets }

        // Mark the active timeout so live-score viewers see the banner immediately
        const teamName = team === 'team1' ? (selectedMatch.team1 as string) : (selectedMatch.team2 as string)
        handleUpdateScore(newRegus, 'ongoing', undefined, undefined, scorecardPatch, {
            activeTimeout: { team, teamName, at: now },
        })
    }

    // Clears the active timeout so the live-score banner disappears and the match resumes
    const endTimeout = () => {
        if (!selectedMatch) return
        handleUpdateScore(
            selectedMatch.regus,
            selectedMatch.status,
            selectedMatch.winner,
            substitutions,
            undefined,
            { activeTimeout: null },
        )
    }

    const declareSetWinner = (winner: 'team1' | 'team2') => {
        if (!selectedMatch || !activeRegu || !activeSet || activeSetIndex === -1) return

        const newRegus = [...currentRegus]
        const currentSets = [...(activeRegu.sets || [])]
        currentSets[activeSetIndex] = { ...currentSets[activeSetIndex], winner }
        newRegus[reguIndex] = { ...activeRegu, sets: currentSets }
        
        // Auto-close open substitutions for this set
        const updatedSubs = [...substitutions]
        let subsChanged = false
        const exit = formatNowHHMM()
        const exitMatchScore = selectedMatch?.score ? { ...selectedMatch.score } : undefined
        const exitSetScore = { team1: currentSets[activeSetIndex].team1Score, team2: currentSets[activeSetIndex].team2Score }

        for (let i = 0; i < updatedSubs.length; i++) {
            const sub = updatedSubs[i]
            if (!sub.exitTime || sub.timePlayed === '—') {
                updatedSubs[i] = {
                    ...sub,
                    exitTime: exit,
                    exitMatchScore,
                    exitSetScore,
                    exitSetNumber: activeSet.setNumber,
                    timePlayed: calcPlayed(sub.entryTime, exit),
                    pointsDuring: sub.entryMatchScore && exitMatchScore ? { team1: exitMatchScore.team1 - (sub.entryMatchScore.team1 || 0), team2: exitMatchScore.team2 - (sub.entryMatchScore.team2 || 0) } : undefined,
                }
                subsChanged = true
            }
        }
        
        if (subsChanged) {
            setSubstitutions(updatedSubs)
        }

        // Clear any active timeout when the set ends
        handleUpdateScore(newRegus, undefined, undefined, updatedSubs, undefined, { activeTimeout: null })
    }

    const declareReguWinner = (winner: 'team1' | 'team2') => {
        if (!selectedMatch || !activeRegu) return
        
        const newRegus = [...currentRegus]
        
        // Calculate regu overall scores based on sets
        const team1Score = activeRegu.sets?.filter(s => s.winner === 'team1').length || 0
        const team2Score = activeRegu.sets?.filter(s => s.winner === 'team2').length || 0
        
        const reguEndTime = formatNowHHMM()
        newRegus[reguIndex] = {
            ...activeRegu,
            winner,
            team1Score,
            team2Score,
            endTime: reguEndTime,
        }

        // Auto-close open substitutions
        const updatedSubs = [...substitutions]
        let subsChanged = false
        const exit = reguEndTime
        const exitMatchScore = selectedMatch?.score ? { ...selectedMatch.score } : undefined
        const exitSetScore = activeSet ? { team1: activeSet.team1Score, team2: activeSet.team2Score } : null

        for (let i = 0; i < updatedSubs.length; i++) {
            const sub = updatedSubs[i]
            if (!sub.exitTime || sub.timePlayed === '—') {
                updatedSubs[i] = {
                    ...sub,
                    exitTime: exit,
                    exitMatchScore,
                    exitSetScore,
                    exitSetNumber: activeSet?.setNumber || null,
                    timePlayed: calcPlayed(sub.entryTime, exit),
                    pointsDuring: sub.entryMatchScore && exitMatchScore ? { team1: exitMatchScore.team1 - (sub.entryMatchScore.team1 || 0), team2: exitMatchScore.team2 - (sub.entryMatchScore.team2 || 0) } : undefined,
                }
                subsChanged = true
            }
        }
        
        if (subsChanged) {
            setSubstitutions(updatedSubs)
        }

        // Clear any active timeout when the regu ends
        handleUpdateScore(newRegus, undefined, undefined, updatedSubs, undefined, { activeTimeout: null })
    }

    const declareMatchWinner = (winner: 'team1' | 'team2' | 'tie') => {

        // Auto-close open substitutions
        const updatedSubs = [...substitutions]
        let subsChanged = false
        const exit = formatNowHHMM()
        const exitMatchScore = selectedMatch?.score ? { ...selectedMatch.score } : undefined
        const exitSetScore = activeSet ? { team1: activeSet.team1Score, team2: activeSet.team2Score } : null

        for (let i = 0; i < updatedSubs.length; i++) {
            const sub = updatedSubs[i]
            if (!sub.exitTime || sub.timePlayed === '—') {
                updatedSubs[i] = {
                    ...sub,
                    exitTime: exit,
                    exitMatchScore,
                    exitSetScore,
                    exitSetNumber: activeSet?.setNumber || null,
                    timePlayed: calcPlayed(sub.entryTime, exit),
                    pointsDuring: sub.entryMatchScore && exitMatchScore ? { team1: exitMatchScore.team1 - (sub.entryMatchScore.team1 || 0), team2: exitMatchScore.team2 - (sub.entryMatchScore.team2 || 0) } : undefined,
                }
                subsChanged = true
            }
        }
        
        if (subsChanged) {
            setSubstitutions(updatedSubs)
        }

        const matchEndTime = formatNowHHMM()
        handleUpdateScore(selectedMatch?.regus, 'completed', winner, updatedSubs, {
            endTime: matchEndTime,
        }, { activeTimeout: null })
    }

    const addSubstitution = (team: 'team1' | 'team2') => {
        if (!activeRegu) return

        const teamLabel = team === 'team1' ? selectedMatch?.team1 || 'Team A' : selectedMatch?.team2 || 'Team B'
        const defaultIn = teamOptions[team][0] || null
        const defaultOut = playingOptions[team][0] || null

        setSubstitutionDraft({
            reguName: activeReguName,
            team,
            teamLabel,
            playerInName: defaultIn?.value || '',
            playerInJerseyNumber: defaultIn?.jerseyNumber,
            playerOutName: defaultOut?.value || '',
            playerOutJerseyNumber: defaultOut?.jerseyNumber,
            entryTime: formatNowHHMM(),
            timePlayed: '—',
            entryMatchScore: selectedMatch?.score ? { ...selectedMatch.score } : undefined,
            entrySetScore: activeSet ? { team1: activeSet.team1Score, team2: activeSet.team2Score } : null,
            entrySetNumber: activeSet ? activeSet.setNumber : null,
        })
    }

    const saveSubstitution = () => {
        if (!substitutionDraft) return

        let updatedSubs = [...substitutions]

        // If this draft includes a playerOut (swap or sub-out-only), try to close an existing sub-in
        if (substitutionDraft.playerOutName) {
            const prevIndex = updatedSubs.findIndex(s => s.playerInName === substitutionDraft.playerOutName && (!s.exitTime || s.timePlayed === '—'))
            if (prevIndex !== -1) {
                const prev = updatedSubs[prevIndex]
                const exit = formatNowHHMM()
                const exitMatchScore = selectedMatch?.score ? { ...selectedMatch.score } : undefined
                const exitSetScore = activeSet ? { team1: activeSet.team1Score, team2: activeSet.team2Score } : null
                updatedSubs[prevIndex] = {
                    ...prev,
                    exitTime: exit,
                    exitMatchScore,
                    exitSetScore,
                    exitSetNumber: activeSet ? activeSet.setNumber : null,
                    timePlayed: calcPlayed(prev.entryTime, exit),
                    pointsDuring: prev.entryMatchScore && exitMatchScore ? { team1: exitMatchScore.team1 - (prev.entryMatchScore.team1 || 0), team2: exitMatchScore.team2 - (prev.entryMatchScore.team2 || 0) } : undefined,
                }
            }
        }

        // If the draft contains a playerIn, append it as a new sub-in record
        if (substitutionDraft.playerInName) {
            const rec: SubstitutionRecord = {
                ...substitutionDraft,
                timePlayed: '—',
            }
            updatedSubs.push(rec)
        }

        setSubstitutions(updatedSubs)
        setSubstitutionDraft(null)

        // Recording the substitution is only half of it — the two players have to
        // actually exchange places, or the same names keep coming up as options.
        const squad = substitutionDraft.team === 'team1' ? teamOptions.team1 : teamOptions.team2
        const onCourt = substitutionDraft.team === 'team1' ? playingOptions.team1 : playingOptions.team2
        const inPlayerId = squad.find((p) => p.value === substitutionDraft.playerInName)?.id
        const outPlayerId = onCourt.find((p) => p.value === substitutionDraft.playerOutName)?.id

        handleUpdateScore(
            selectedMatch?.regus,
            selectedMatch?.status,
            selectedMatch?.winner,
            updatedSubs,
            undefined,
            inPlayerId || outPlayerId
                ? {
                      substitution: {
                          team: substitutionDraft.team,
                          inPlayerId,
                          outPlayerId,
                          at: substitutionDraft.entryTime || formatNowHHMM(),
                      },
                  }
                : undefined,
        )
    }

    if (!isOpen) return null

    const focusRing =
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a0a8f]/40 focus-visible:ring-offset-2'
    const ghostBtn =
        `inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white ${focusRing}`
    const selectBox =
        `w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 transition-colors focus:border-[#5a0a8f] ${focusRing} disabled:bg-gray-50 disabled:text-gray-400`

    const side = {
        team1: { dot: 'bg-[#5a0a8f]', text: 'text-[#5a0a8f]', solid: 'bg-[#5a0a8f] hover:bg-[#46076f]' },
        team2: { dot: 'bg-slate-700', text: 'text-slate-700', solid: 'bg-slate-800 hover:bg-slate-900' },
    } as const

    const teamName = (s: 'team1' | 'team2') => (s === 'team1' ? selectedMatch?.team1 : selectedMatch?.team2) || ''

    /** Team chip: colour dot + shortened name, full name on hover. */
    const teamChip = (s: 'team1' | 'team2', className = '') => (
        <span className={`inline-flex min-w-0 items-center gap-2 ${className}`}>
            <span className={`h-2 w-2 shrink-0 rounded-full ${side[s].dot}`} aria-hidden="true" />
            <span className="truncate" title={teamName(s)}>{shortTeamName(teamName(s))}</span>
        </span>
    )

/**
     * Consequential actions ask before they act. The question is asked on the
     * button itself — the operator just pressed it, so nothing needs restating.
     */
    const confirmable = (
        id: string,
        run: () => void,
        opts: {
            icon: string
            iconClass?: string
            label: React.ReactNode
            confirmLabel?: string
            title?: string
            className?: string
            disabled?: boolean
        },
    ) => {
        if (pendingConfirm !== id) {
            return (
                <button
                    type="button"
                    title={opts.title}
                    disabled={opts.disabled}
                    onClick={() => setPendingConfirm(id)}
                    className={`${ghostBtn} ${opts.className || ''}`}
                >
                    <span className={`material-symbols-outlined text-lg ${opts.iconClass || ''}`}>{opts.icon}</span>
                    {opts.label}
                </button>
            )
        }
        return (
            <span className={`inline-flex items-stretch gap-1 ${opts.className || ''}`}>
                <button
                    type="button"
                    autoFocus
                    onClick={() => {
                        setPendingConfirm(null)
                        run()
                    }}
                    className={`inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#5a0a8f] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#46076f] ${focusRing}`}
                >
                    <span className="material-symbols-outlined text-lg">check</span>
                    <span className="truncate">{opts.confirmLabel || 'Confirm'}</span>
                </button>
                <button
                    type="button"
                    aria-label="Cancel"
                    title="Cancel"
                    onClick={() => setPendingConfirm(null)}
                    className={`inline-flex shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white px-2 text-gray-500 transition-colors hover:bg-gray-50 ${focusRing}`}
                >
                    <span className="material-symbols-outlined text-lg">close</span>
                </button>
            </span>
        )
    }

    const roundLabel = activeRegu?.reguName || `Round ${reguIndex + 1}`
    const setsPlayed = activeRegu?.sets || []
    const decidedSets = setsPlayed.filter((s) => s.winner)
    const canDecideRound = decidedSets.length > 0

    /** One team's column in the top scoreboard. */
    const renderScoreSide = (s: 'team1' | 'team2') => (
        <div className="min-w-0">
            <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${side[s].dot}`} aria-hidden="true" />
                <span className="line-clamp-2 text-[13px] font-bold leading-snug text-gray-900 sm:text-sm" title={teamName(s)}>
                    {teamName(s)}
                </span>
            </div>
            <div className={`mt-1 text-3xl font-black tabular-nums tracking-tight sm:text-4xl ${side[s].text}`}>
                {(s === 'team1' ? selectedMatch?.score?.team1 : selectedMatch?.score?.team2) || 0}
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Rounds won</div>
        </div>
    )

    /** One team's scoring lane for the live set: name, stepper, per-set actions. */
    const renderLane = (s: 'team1' | 'team2') => {
        if (!activeSet) return null
        const score = s === 'team1' ? activeSet.team1Score : activeSet.team2Score
        const timeouts = (s === 'team1' ? activeSet.team1Timeouts : activeSet.team2Timeouts) || []
        const subsUsed = substitutions.filter((sub) => sub.team === s && sub.reguName === roundLabel).length
        // Set already decided by the 15 / deuce-to-17 rule → no more points.
        const ruleWinner = setWinnerByRule(activeSet.team1Score, activeSet.team2Score)

        return (
            <div className="flex min-w-0 flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${side[s].dot}`} aria-hidden="true" />
                    <span className="truncate" title={teamName(s)}>{shortTeamName(teamName(s))}</span>
                </div>

                <div className="flex items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={() => updateSetPoint(s, -1)}
                        disabled={score <= 0}
                        aria-label={`Remove a point from ${teamName(s)}`}
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30 ${focusRing}`}
                    >
                        <span className="material-symbols-outlined text-xl">remove</span>
                    </button>

                    <span className="text-5xl font-black tabular-nums tracking-tight text-gray-900 sm:text-6xl">
                        {score}
                    </span>

                    <button
                        type="button"
                        onClick={() => updateSetPoint(s, 1)}
                        disabled={!!ruleWinner}
                        aria-label={`Add a point for ${teamName(s)}`}
                        className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-white shadow-sm transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 ${side[s].solid} ${focusRing}`}
                    >
                        <span className="material-symbols-outlined text-3xl">add</span>
                    </button>
                </div>

                {ruleWinner === s ? (
                    <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
                        {teamName(s)} has won set {activeSet.setNumber} — award it below.
                    </p>
                ) : !ruleWinner && isDeuce(activeSet.team1Score, activeSet.team2Score) ? (
                    <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                        Deuce — first to {SET_CAP} wins the set.
                    </p>
                ) : null}

                <div className="flex flex-wrap items-center gap-2">
                    {confirmable(`set:${s}`, () => declareSetWinner(s), {
                        icon: 'check_circle',
                        iconClass: 'text-emerald-600',
                        label: `Won set ${activeSet.setNumber}`,
                        confirmLabel: `Award set ${activeSet.setNumber}`,
                        title: `Award set ${activeSet.setNumber} to ${teamName(s)}`,
                        className: 'w-full whitespace-nowrap',
                    })}
                    <button
                        type="button"
                        onClick={() => recordTimeout(s)}
                        disabled={!!selectedMatch?.activeTimeout}
                        title="Record a timeout"
                        className={`${ghostBtn} flex-1`}
                    >
                        <span className="material-symbols-outlined text-lg text-amber-600">timer</span>
                        Timeout
                    </button>
                    <button
                        type="button"
                        onClick={() => addSubstitution(s)}
                        title="Substitute a player"
                        className={`${ghostBtn} flex-1`}
                    >
                        <span className="material-symbols-outlined text-lg text-slate-500">swap_horiz</span>
                        Sub
                    </button>
                </div>

                {(timeouts.length > 0 || subsUsed > 0) && (
                    <p className="text-[11px] font-medium text-gray-500">
                        {timeouts.length > 0 && <span className="text-amber-700">Timeout {timeouts.join(', ')}</span>}
                        {timeouts.length > 0 && subsUsed > 0 && <span> · </span>}
                        {subsUsed > 0 && <span>{subsUsed} substitution{subsUsed > 1 ? 's' : ''}</span>}
                    </p>
                )}
            </div>
        )
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-2 backdrop-blur-sm sm:p-4">
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Update match score"
                className="flex h-full max-h-[96vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-gray-50 shadow-2xl sm:max-h-[92vh]"
            >
                {/* Header */}
                <div className="flex shrink-0 items-start justify-between gap-3 bg-slate-950 px-4 py-3 text-white sm:px-6 sm:py-4">
                    <div className="min-w-0">
                        <h2 className="text-lg font-bold tracking-tight">Update match score</h2>
                        {selectedMatch && (
                            <p className="mt-0.5 flex items-center gap-2 truncate text-sm text-slate-300">
                                <span className="truncate">
                                    {eventTypeLabel(selectedMatch.eventType)} · Round {reguIndex + 1} of {currentRegus.length}
                                    {selectedMatch.date ? ` · ${selectedMatch.date}` : ''}
                                </span>
                                {saving && (
                                    <span className="inline-flex shrink-0 items-center gap-1 text-xs text-slate-400">
                                        <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                                        Saving
                                    </span>
                                )}
                            </p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className={`-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-white/10 hover:text-white ${focusRing}`}
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3 sm:space-y-4 sm:px-6 sm:py-6">
                    {saveError && (
                        <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                            <span className="material-symbols-outlined text-lg text-red-600">error</span>
                            <p className="flex-1">{saveError}</p>
                            <button
                                type="button"
                                onClick={() => setSaveError(null)}
                                aria-label="Dismiss"
                                className={`-mr-1 -mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-red-500 hover:bg-red-100 ${focusRing}`}
                            >
                                <span className="material-symbols-outlined text-base">close</span>
                            </button>
                        </div>
                    )}
                    {/* Match picker — only when the modal wasn't opened from a match row */}
                    {!preSelectedMatch && (
                        <div className="grid grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-white p-4 md:grid-cols-2">
                            <div className="min-w-0">
                                <label htmlFor="score-tournament" className="mb-1.5 block text-xs font-semibold text-gray-600">
                                    Tournament
                                </label>
                                <select
                                    id="score-tournament"
                                    className={selectBox}
                                    value={selectedTournamentId}
                                    onChange={e => setSelectedTournamentId(e.target.value)}
                                    disabled={loading}
                                >
                                    <option value="">{loading ? 'Loading…' : 'Choose a tournament'}</option>
                                    {tournaments.map(t => (
                                        <option key={t._id} value={t._id}>{t.title}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="min-w-0">
                                <label htmlFor="score-match" className="mb-1.5 block text-xs font-semibold text-gray-600">
                                    Match
                                </label>
                                <select
                                    id="score-match"
                                    className={selectBox}
                                    value={selectedMatch?._id || ''}
                                    onChange={e => {
                                        const m = matches.find(x => x._id === e.target.value)
                                        setSelectedMatch(m || null)
                                    }}
                                    disabled={!selectedTournamentId || loading}
                                >
                                    <option value="">
                                        {loading && selectedTournamentId ? 'Loading…' : 'Choose a match'}
                                    </option>
                                    {matches.map(m => (
                                        <option key={m._id} value={m._id}>
                                            {m.description || `${m.team1} vs ${m.team2}`} ({m.date})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {!selectedMatch && !preSelectedMatch && (
                        <p className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-10 text-center text-sm text-gray-500">
                            Pick a tournament and a match to start scoring.
                        </p>
                    )}

                    {selectedMatch && (
                        <>
                            {/* Scoreboard */}
                            <section className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
                                <div className="grid grid-cols-2 items-start gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-4">
                                    {renderScoreSide('team1')}
                                    <div className="order-last col-span-2 flex flex-row items-center justify-center gap-2 border-t border-gray-100 pt-3 sm:order-none sm:col-span-1 sm:flex-col sm:border-0 sm:pt-0">
                                        <span
                                            className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
                                                selectedMatch.status === 'completed'
                                                    ? 'bg-emerald-50 text-emerald-700'
                                                    : selectedMatch.status === 'ongoing'
                                                        ? 'bg-blue-50 text-blue-700'
                                                        : 'bg-gray-100 text-gray-600'
                                            }`}
                                        >
                                            {selectedMatch.status || 'scheduled'}
                                        </span>
                                        {selectedMatch.winner && (
                                            <span className="inline-flex min-w-0 items-center gap-1.5 text-xs font-semibold text-emerald-700">
                                                <span className="material-symbols-outlined text-sm">emoji_events</span>
                                                {selectedMatch.winner === 'tie'
                                                    ? 'Tie'
                                                    : teamChip(selectedMatch.winner === 'team1' ? 'team1' : 'team2')}
                                            </span>
                                        )}
                                    </div>
                                    {renderScoreSide('team2')}
                                </div>
                            </section>

                            {/* Rounds */}
                            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                                <div className="flex gap-1 border-b border-gray-200 p-1" role="tablist">
                                    {currentRegus.map((regu, idx) => {
                                        const isActive = reguIndex === idx
                                        return (
                                            <button
                                                key={idx}
                                                type="button"
                                                role="tab"
                                                aria-selected={isActive}
                                                onClick={() => setSelectedReguIndex(idx)}
                                                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${focusRing} ${
                                                    isActive
                                                        ? 'bg-[#5a0a8f] text-white'
                                                        : 'text-gray-600 hover:bg-gray-100'
                                                }`}
                                            >
                                                {regu.reguName}
                                                {regu.winner && (
                                                    <span
                                                        className={`material-symbols-outlined text-base ${isActive ? 'text-white' : 'text-emerald-600'}`}
                                                        title="Round decided"
                                                    >
                                                        check_circle
                                                    </span>
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>

                                <div className="space-y-4 p-4 sm:p-5">
                                    {activeRegu?.winner ? (
                                        /* Round already decided */
                                        <div className="flex flex-wrap items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-6 text-sm">
                                            <span className="material-symbols-outlined text-emerald-600">verified</span>
                                            <span className="font-semibold text-emerald-900">{roundLabel} won by</span>
                                            {teamChip(activeRegu.winner === 'team1' ? 'team1' : 'team2', 'font-bold text-emerald-900')}
                                        </div>
                                    ) : activeSet ? (
                                        <>
                                            <div className="flex items-center justify-center gap-2">
                                                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" aria-hidden="true" />
                                                <span className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500">
                                                    Set {activeSet.setNumber} in play
                                                </span>
                                            </div>

                                            {selectedMatch.activeTimeout && (
                                                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
                                                    <p className="min-w-0 text-sm font-semibold text-amber-900">
                                                        <span className="material-symbols-outlined mr-1.5 align-middle text-base">timer</span>
                                                        Timeout — {selectedMatch.activeTimeout.teamName}
                                                        <span className="ml-1.5 font-medium text-amber-700">
                                                            at {selectedMatch.activeTimeout.at}
                                                        </span>
                                                    </p>
                                                    <button
                                                        type="button"
                                                        onClick={endTimeout}
                                                        className={`rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-700 ${focusRing}`}
                                                    >
                                                        Resume match
                                                    </button>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                                {renderLane('team1')}
                                                {renderLane('team2')}
                                            </div>
                                        </>
                                    ) : (
                                        /* No set in play */
                                        <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
                                            <p className="text-sm text-gray-500">
                                                {setsPlayed.length === 0
                                                    ? `No set played yet in ${roundLabel}.`
                                                    : `Set ${setsPlayed.length} is finished. ${roundLabel} runs to 3 sets.`}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={createNewSet}
                                                className={`inline-flex items-center gap-2 rounded-lg bg-[#5a0a8f] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#46076f] ${focusRing}`}
                                            >
                                                <span className="material-symbols-outlined text-base">play_arrow</span>
                                                Start set {setsPlayed.length + 1}
                                            </button>
                                        </div>
                                    )}

                                    {/* Sets played in this round */}
                                    {setsPlayed.length > 0 && (
                                        <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-4">
                                            {setsPlayed.map((set, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm ${
                                                        set.winner ? 'border-gray-200 bg-white' : 'border-dashed border-gray-300 bg-gray-50'
                                                    }`}
                                                >
                                                    <span className="text-xs font-semibold text-gray-500">Set {set.setNumber}</span>
                                                    <span className="font-bold tabular-nums text-gray-900">
                                                        <span className={set.winner === 'team1' ? side.team1.text : ''}>{set.team1Score}</span>
                                                        <span className="mx-1 font-normal text-gray-300">–</span>
                                                        <span className={set.winner === 'team2' ? side.team2.text : ''}>{set.team2Score}</span>
                                                    </span>
                                                    {!set.winner && !activeRegu?.winner && (
                                                        <span className="text-[10px] font-bold uppercase tracking-wide text-red-500">Live</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Decide the round */}
                                    {!activeRegu?.winner && (
                                        <div className="border-t border-gray-100 pt-4 sm:flex sm:items-center sm:gap-3">
                                            <p className="mb-2 text-sm text-gray-600 sm:mb-0 sm:mr-auto">
                                                {canDecideRound
                                                    ? `Who won ${roundLabel}?`
                                                    : 'Finish a set before deciding the round.'}
                                            </p>
                                            <div className="flex gap-2">
                                                {(['team1', 'team2'] as const).map((s) => (
                                                    <span key={s} className="flex min-w-0 flex-1 sm:flex-none">
                                                        {confirmable(`round:${s}`, () => declareReguWinner(s), {
                                                            icon: 'emoji_events',
                                                            iconClass: 'text-amber-500',
                                                            label: teamChip(s),
                                                            confirmLabel: `Award ${roundLabel}`,
                                                            title: `Award ${roundLabel} to ${teamName(s)}`,
                                                            className: 'min-w-0 flex-1',
                                                            disabled: !canDecideRound,
                                                        })}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Substitution editor */}
                            {substitutionDraft && (
                                <section ref={substitutionRef} className="rounded-xl border-2 border-[#5a0a8f]/30 bg-white p-4 sm:p-5">
                                    <div className="mb-4 flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <h3 className="text-sm font-bold text-gray-900">Substitution</h3>
                                            <p className="mt-0.5 truncate text-xs text-gray-500">
                                                {substitutionDraft.reguName} · {substitutionDraft.teamLabel}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setSubstitutionDraft(null)}
                                            aria-label="Cancel substitution"
                                            className={`flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 ${focusRing}`}
                                        >
                                            <span className="material-symbols-outlined text-lg">close</span>
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div>
                                            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                                                <span className="material-symbols-outlined text-base">login</span>
                                                Coming on
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {teamOptions[substitutionDraft.team].length > 0 ? (
                                                    teamOptions[substitutionDraft.team].map((player) => {
                                                        const picked = substitutionDraft.playerInName === player.value
                                                        return (
                                                            <button
                                                                key={`in-${player.value}`}
                                                                type="button"
                                                                onClick={() => setSubstitutionDraft((prev) => prev ? { ...prev, playerInName: player.value, playerInJerseyNumber: player.jerseyNumber } : prev)}
                                                                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${focusRing} ${
                                                                    picked
                                                                        ? 'border-emerald-600 bg-emerald-600 text-white'
                                                                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                                                                }`}
                                                            >
                                                                {player.label}
                                                            </button>
                                                        )
                                                    })
                                                ) : (
                                                    <p className="text-sm text-gray-500">No substitutes in this squad.</p>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                                <span className="material-symbols-outlined text-base">logout</span>
                                                Going off
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {playingOptions[substitutionDraft.team].length > 0 ? (
                                                    playingOptions[substitutionDraft.team].map((player) => {
                                                        const picked = substitutionDraft.playerOutName === player.value
                                                        return (
                                                            <button
                                                                key={`out-${player.value}`}
                                                                type="button"
                                                                onClick={() => setSubstitutionDraft((prev) => prev ? { ...prev, playerOutName: player.value, playerOutJerseyNumber: player.jerseyNumber } : prev)}
                                                                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${focusRing} ${
                                                                    picked
                                                                        ? 'border-slate-800 bg-slate-800 text-white'
                                                                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                                                                }`}
                                                            >
                                                                {player.label}
                                                            </button>
                                                        )
                                                    })
                                                ) : (
                                                    <p className="text-sm text-gray-500">No players on court.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-gray-100 pt-4">
                                        <div>
                                            <label htmlFor="sub-entry-time" className="mb-1.5 block text-xs font-semibold text-gray-600">
                                                Entry time
                                            </label>
                                            <input
                                                id="sub-entry-time"
                                                type="time"
                                                value={substitutionDraft.entryTime}
                                                onChange={(e) => setSubstitutionDraft((prev) => prev ? { ...prev, entryTime: e.target.value } : prev)}
                                                className={`rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 ${focusRing}`}
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <button type="button" onClick={() => setSubstitutionDraft(null)} className={ghostBtn}>
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                onClick={saveSubstitution}
                                                disabled={!substitutionDraft.playerInName || !substitutionDraft.playerOutName}
                                                className={`rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`}
                                            >
                                                Save substitution
                                            </button>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* Substitutions already recorded */}
                            {substitutions.length > 0 && (
                                <section className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
                                    <h3 className="mb-3 text-sm font-bold text-gray-900">Substitutions</h3>
                                    <ul className="divide-y divide-gray-100 text-sm">
                                        {substitutions.map((item, index) => (
                                            <li key={`${item.reguName}-${index}`} className="flex flex-wrap items-baseline gap-x-2 gap-y-1 py-2">
                                                <span className="font-semibold text-gray-900">
                                                    {item.playerInName || '—'}
                                                    {item.playerInJerseyNumber ? ` #${item.playerInJerseyNumber}` : ''}
                                                </span>
                                                <span className="material-symbols-outlined text-sm text-gray-400">arrow_forward</span>
                                                <span className="text-gray-600">
                                                    {item.playerOutName || '—'}
                                                    {item.playerOutJerseyNumber ? ` #${item.playerOutJerseyNumber}` : ''}
                                                </span>
                                                <span className="ml-auto text-xs text-gray-500">
                                                    {item.reguName} · {item.entryTime || '—'}
                                                    {item.timePlayed && item.timePlayed !== '—' ? ` · ${item.timePlayed}` : ''}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            )}
                        </>
                    )}
                </div>

                {/* Footer — end the match */}
                {selectedMatch && selectedMatch.status !== 'completed' && (
                    <div className="shrink-0 border-t border-gray-200 bg-white px-3 py-3 sm:flex sm:items-center sm:gap-3 sm:px-6">
                        <p className="mb-2 text-sm text-gray-600 sm:mb-0 sm:mr-auto">End match and declare the winner</p>
                        <div className="flex gap-2">
                            {(['team1', 'team2'] as const).map((s) => (
                                <span key={s} className="flex min-w-0 flex-1 sm:flex-none">
                                    {confirmable(`match:${s}`, () => declareMatchWinner(s), {
                                        icon: 'sports_score',
                                        iconClass: 'text-slate-400',
                                        label: teamChip(s),
                                        confirmLabel: 'End match',
                                        title: `End the match with ${teamName(s)} as winner`,
                                        className: 'min-w-0 flex-1',
                                    })}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
