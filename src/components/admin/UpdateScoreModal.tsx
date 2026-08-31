import { useState, useEffect } from 'react'
import { apiRequest } from '../../lib/api'
import { roundNamesForEvent } from '../../lib/eventFormat'

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
        player?: { fullName?: string; name?: string } | string
        jerseyNumber?: number
        isSubstitute?: boolean
        entryTime?: string
        exitTime?: string
    }[]
    team2Players?: {
        player?: { fullName?: string; name?: string } | string
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

export function UpdateScoreModal({ isOpen, onClose, preSelectedTournamentId, preSelectedMatch }: Props) {
    const [loading, setLoading] = useState(false)
    const [tournaments, setTournaments] = useState<Tournament[]>([])
    const [selectedTournamentId, setSelectedTournamentId] = useState('')

    const [matches, setMatches] = useState<Match[]>([])
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
    const [selectedReguIndex, setSelectedReguIndex] = useState<number>(0)
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
        try {
            // Calculate overall match score based on Regu winners
            const team1Total = newRegus?.filter(r => r.winner === 'team1').length || 0
            const team2Total = newRegus?.filter(r => r.winner === 'team2').length || 0

            const mergedScorecard = {
                ...(selectedMatch.scorecard || {}),
                substitutions: subsToSave ?? substitutions,
                ...scorecardPatch,
            }

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
            alert('Failed to save score')
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

    const buildPlayerOptions = (players?: Match['team1Players']) =>
        (players || []).map((player, index) => ({
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
        if (!confirm(`Declare ${winner === 'team1' ? selectedMatch.team1 : selectedMatch.team2} as winner of Set ${activeSet.setNumber} for ${activeRegu.reguName}?`)) return

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
        if (!confirm(`Declare ${winner === 'team1' ? selectedMatch.team1 : selectedMatch.team2} as WINNER of ${activeRegu.reguName}?`)) return
        
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
        if (!confirm(`Declare ${winner === 'team1' ? selectedMatch?.team1 : winner === 'team2' ? selectedMatch?.team2 : 'Tie'} as MATCH WINNER? This will end the match.`)) return

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

        // Save to backend immediately
        handleUpdateScore(selectedMatch?.regus, selectedMatch?.status, selectedMatch?.winner, updatedSubs)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="flex h-full max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/40 bg-white shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 px-8 py-5 text-white shadow-sm">
                    <div>
                        <h2 className="flex items-center gap-2 text-2xl font-black tracking-tight">
                            <span className="material-symbols-outlined">score</span>
                            Update Match Score
                        </h2>
                    </div>
                    <button onClick={onClose} className="text-white hover:text-gray-200 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-white px-6 py-6 md:px-8 md:py-8">
                    {/* Selection Phase - Only show if no pre-selected match */}
                    {!preSelectedMatch && (
                    <div className="mb-6 grid grid-cols-1 gap-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:grid-cols-2">
                        <div className="min-w-0">
                            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-gray-500">Select Tournament</label>
                            <select
                                className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 p-3 text-sm font-medium text-gray-900 outline-none transition-colors focus:border-[#5a0a8f] focus:bg-white focus:ring-0 disabled:opacity-50"
                                value={selectedTournamentId}
                                onChange={e => setSelectedTournamentId(e.target.value)}
                                disabled={loading}
                            >
                                <option value="">{loading ? 'Loading...' : '-- Choose Tournament --'}</option>
                                {tournaments.map(t => (
                                    <option key={t._id} value={t._id}>{t.title}</option>
                                ))}
                            </select>
                        </div>
                        <div className="min-w-0">
                            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-gray-500">Select Match</label>
                            <select
                                className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 p-3 text-sm font-medium text-gray-900 outline-none transition-colors focus:border-[#5a0a8f] focus:bg-white focus:ring-0 disabled:opacity-50"
                                value={selectedMatch?._id || ''}
                                onChange={e => {
                                    const m = matches.find(x => x._id === e.target.value)
                                    setSelectedMatch(m || null)
                                }}
                                disabled={!selectedTournamentId || loading}
                            >
                                <option value="">{loading && selectedTournamentId ? 'Loading...' : '-- Choose Match --'}</option>
                                {matches.map(m => (
                                    <option key={m._id} value={m._id}>
                                        {m.description || `${m.team1} vs ${m.team2}`} ({m.date})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    )}

                    {/* Scoring Interface */}
                    {selectedMatch && (
                        <div className="space-y-6">
                            {/* Match Header */}
                            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-7">
                                <div className="flex flex-col items-stretch justify-between gap-6 md:flex-row md:items-center md:gap-8">
                                    <div className="min-w-0 flex-1 px-2 text-center md:text-left">
                                        <div className="mx-auto max-w-full break-words text-lg font-black leading-tight text-gray-900 md:mx-0 md:text-xl lg:text-2xl">
                                            {selectedMatch.team1}
                                        </div>
                                        <div className="mt-2 text-4xl font-black tracking-tighter text-[#5a0a8f]">
                                            {selectedMatch.score?.team1 || 0}
                                        </div>
                                        <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400">Regus Won</div>
                                    </div>
                                    <div className="flex shrink-0 flex-col items-center px-2 text-center">
                                        <div className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-gray-400">Match Status</div>
                                        <span className={`px-4 py-1.5 rounded-full text-xs font-black tracking-wider shadow-sm border ${selectedMatch.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                                            selectedMatch.status === 'ongoing' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                'bg-gray-50 text-gray-600 border-gray-200'
                                            }`}>
                                            {(selectedMatch.status || 'scheduled').toUpperCase()}
                                        </span>
                                        {selectedMatch.winner && (
                                            <div className="mt-3 text-sm font-bold text-green-600 flex items-center gap-1 bg-green-50 px-3 py-1 rounded-full">
                                                <span className="material-symbols-outlined text-sm">emoji_events</span>
                                                Winner: {selectedMatch.winner === 'team1' ? selectedMatch.team1 : selectedMatch.winner === 'team2' ? selectedMatch.team2 : 'Tie'}
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1 px-2 text-center md:text-right">
                                        <div className="mx-auto max-w-full break-words text-lg font-black leading-tight text-gray-900 md:ml-auto md:text-xl lg:text-2xl">
                                            {selectedMatch.team2}
                                        </div>
                                        <div className="mt-2 text-4xl font-black tracking-tighter text-[#5a0a8f]">
                                            {selectedMatch.score?.team2 || 0}
                                        </div>
                                        <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400">Regus Won</div>
                                    </div>
                                </div>
                            </div>

                            {/* Regu Tabs */}
                            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                                <div className="flex border-b border-gray-200 bg-gray-50/70">
                                    {currentRegus.map((regu, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedReguIndex(idx)}
                                            className={`flex flex-1 flex-col items-center gap-1 border-b-2 px-4 py-4 text-sm font-bold transition-all ${
                                                reguIndex === idx 
                                                    ? 'border-[#5a0a8f] text-[#5a0a8f] bg-white' 
                                                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                                            }`}
                                        >
                                            <span className="uppercase tracking-wide">{regu.reguName}</span>
                                            {regu.winner && (
                                                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[12px]">check_circle</span>
                                                    Won
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>

                                <div className="p-4 md:p-6">
                                    {activeRegu && (
                                        <div className="space-y-6">
                                            {/* Active Set Controls */}
                                            {activeSet && !activeRegu.winner ? (
                                                <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/80 p-5 shadow-sm md:p-8">
                                                    <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-slate-900 via-slate-700 to-amber-500"></div>
                                                    
                                                    <div className="mb-6 text-center md:mb-8">
                                                        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-black tracking-wide text-slate-700 shadow-sm">
                                                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                                            SET {activeSet.setNumber} (LIVE)
                                                        </span>
                                                    </div>

                                                    <div className="mx-auto flex max-w-3xl flex-col items-stretch justify-between gap-8 md:flex-row md:items-center md:gap-8">
                                                        {/* Team 1 Controls */}
                                                        <div className="flex min-w-0 flex-1 flex-col items-center gap-4">
                                                            <div className="w-full truncate text-center text-sm font-bold text-gray-600">{selectedMatch.team1}</div>
                                                            <button
                                                                onClick={() => updateSetPoint('team1', 1)}
                                                                className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-green-200 bg-white text-green-600 shadow-sm transition-all hover:border-green-300 hover:bg-green-50 hover:scale-105 active:scale-95"
                                                            >
                                                                <span className="material-symbols-outlined text-4xl font-bold">add</span>
                                                            </button>
                                                            <div className="my-2 text-5xl font-black tabular-nums tracking-tighter text-gray-900 md:text-6xl">{activeSet.team1Score}</div>
                                                            <button
                                                                onClick={() => updateSetPoint('team1', -1)}
                                                                className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-red-100 bg-white text-red-500 shadow-sm transition-all hover:border-red-200 hover:bg-red-50 hover:scale-105 active:scale-95"
                                                            >
                                                                <span className="material-symbols-outlined text-xl">remove</span>
                                                            </button>
                                                        </div>

                                                        {/* VS */}
                                                        <div className="flex flex-col items-center gap-4 px-4">
                                                            <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-400 font-black italic text-sm">
                                                                VS
                                                            </div>
                                                        </div>

                                                        {/* Team 2 Controls */}
                                                        <div className="flex min-w-0 flex-1 flex-col items-center gap-4">
                                                            <div className="w-full truncate text-center text-sm font-bold text-gray-600">{selectedMatch.team2}</div>
                                                            <button
                                                                onClick={() => updateSetPoint('team2', 1)}
                                                                className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-green-200 bg-white text-green-600 shadow-sm transition-all hover:border-green-300 hover:bg-green-50 hover:scale-105 active:scale-95"
                                                            >
                                                                <span className="material-symbols-outlined text-4xl font-bold">add</span>
                                                            </button>
                                                            <div className="my-2 text-5xl font-black tabular-nums tracking-tighter text-gray-900 md:text-6xl">{activeSet.team2Score}</div>
                                                            <button
                                                                onClick={() => updateSetPoint('team2', -1)}
                                                                className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-red-100 bg-white text-red-500 shadow-sm transition-all hover:border-red-200 hover:bg-red-50 hover:scale-105 active:scale-95"
                                                            >
                                                                <span className="material-symbols-outlined text-xl">remove</span>
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="mt-8 border-t border-slate-200 pt-6">
                                                        <h4 className="mb-4 text-center text-xs font-black uppercase tracking-[0.22em] text-gray-400">Timeouts</h4>

                                                        {/* ── Active timeout banner ── */}
                                                        {selectedMatch.activeTimeout ? (
                                                            <div className="mx-auto max-w-3xl rounded-2xl border-2 border-amber-400 bg-amber-50 p-5">
                                                                <div className="flex items-center gap-3 mb-4">
                                                                    <span className="text-2xl leading-none">⏱</span>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-[10px] font-black text-amber-900 uppercase tracking-widest">Timeout In Progress</p>
                                                                        <p className="text-base font-black text-amber-800 truncate">
                                                                            {selectedMatch.activeTimeout.teamName}
                                                                            <span className="ml-2 text-xs font-semibold text-amber-700">at {selectedMatch.activeTimeout.at}</span>
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={endTimeout}
                                                                    className="w-full rounded-xl border-2 border-green-400 bg-green-600 px-4 py-3 text-sm font-black text-white hover:bg-green-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                                                                >
                                                                    <span className="material-symbols-outlined text-base">play_circle</span>
                                                                    End Timeout — Resume Match
                                                                </button>
                                                                <p className="mt-3 text-[10px] text-amber-700 text-center">
                                                                    This will remove the timeout banner on the live score screen.
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            /* ── No active timeout — show record buttons ── */
                                                            <div className="mx-auto grid max-w-3xl grid-cols-1 gap-4 md:grid-cols-2">
                                                                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                                                                    <p className="mb-2 truncate text-sm font-bold text-gray-700">{selectedMatch.team1}</p>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => recordTimeout('team1')}
                                                                        className="w-full rounded-xl border-2 border-amber-300 bg-white px-4 py-2.5 text-sm font-bold text-amber-900 hover:bg-amber-100 transition-colors"
                                                                    >
                                                                        Record Timeout
                                                                    </button>
                                                                    {(activeSet.team1Timeouts || []).length > 0 ? (
                                                                        <p className="mt-3 text-xs text-amber-900 font-semibold">
                                                                            Recorded: {(activeSet.team1Timeouts || []).join(', ')}
                                                                        </p>
                                                                    ) : (
                                                                        <p className="mt-3 text-xs text-gray-400 italic">No timeout recorded for this set</p>
                                                                    )}
                                                                </div>
                                                                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                                                                    <p className="mb-2 truncate text-sm font-bold text-gray-700">{selectedMatch.team2}</p>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => recordTimeout('team2')}
                                                                        className="w-full rounded-xl border-2 border-amber-300 bg-white px-4 py-2.5 text-sm font-bold text-amber-900 hover:bg-amber-100 transition-colors"
                                                                    >
                                                                        Record Timeout
                                                                    </button>
                                                                    {(activeSet.team2Timeouts || []).length > 0 ? (
                                                                        <p className="mt-3 text-xs text-amber-900 font-semibold">
                                                                            Recorded: {(activeSet.team2Timeouts || []).join(', ')}
                                                                        </p>
                                                                    ) : (
                                                                        <p className="mt-3 text-xs text-gray-400 italic">No timeout recorded for this set</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="mt-10 flex flex-col justify-center gap-4 border-t border-slate-200 pt-6 md:flex-row">
                                                        <button
                                                            type="button"
                                                            onClick={() => declareSetWinner('team1')}
                                                            className="flex max-w-full items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50 md:px-6"
                                                        >
                                                            <span className="truncate">{selectedMatch.team1} Wins Set</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => declareSetWinner('team2')}
                                                            className="flex max-w-full items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50 md:px-6"
                                                        >
                                                            <span className="truncate">{selectedMatch.team2} Wins Set</span>
                                                        </button>
                                                    </div>

                                                    <div className="mt-6 border-t border-gray-200 pt-6">
                                                        <h4 className="mb-4 text-xs font-black uppercase tracking-[0.22em] text-gray-400">Sub In / Sub Out</h4>
                                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => addSubstitution('team1')}
                                                                className="rounded-2xl border-2 border-green-200 bg-green-50 px-4 py-3 text-left font-bold text-green-800 transition-colors hover:bg-green-100"
                                                            >
                                                                <span className="block truncate text-sm md:text-base">{selectedMatch.team1} Sub In</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => addSubstitution('team2')}
                                                                className="rounded-2xl border-2 border-blue-200 bg-blue-50 px-4 py-3 text-left font-bold text-blue-800 transition-colors hover:bg-blue-100"
                                                            >
                                                                <span className="block truncate text-sm md:text-base">{selectedMatch.team2} Sub In</span>
                                                            </button>
                                                        </div>

                                                        {substitutionDraft && (
                                                            <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                                                                <div className="flex items-center justify-between gap-3 mb-4">
                                                                    <div>
                                                                        <div className="text-sm font-black text-gray-900">{substitutionDraft.reguName}</div>
                                                                        <div className="text-xs text-gray-500">{substitutionDraft.teamLabel}</div>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => { setSubstitutionDraft(null); }}
                                                                        className="text-gray-400 hover:text-gray-600"
                                                                    >
                                                                        <span className="material-symbols-outlined">close</span>
                                                                    </button>
                                                                </div>

                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    <div>
                                                                        <div className="mb-2 text-xs font-bold uppercase tracking-wide text-green-700">Sub In</div>
                                                                        <div className="flex flex-wrap gap-2 rounded-xl border border-green-200 bg-green-50 p-3">
                                                                            {teamOptions[substitutionDraft.team].length > 0 ? teamOptions[substitutionDraft.team].map((player) => (
                                                                                <button
                                                                                    key={`in-${player.value}`}
                                                                                    type="button"
                                                                                    onClick={() => setSubstitutionDraft((prev) => prev ? { ...prev, playerInName: player.value, playerInJerseyNumber: player.jerseyNumber } : prev)}
                                                                                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${substitutionDraft.playerInName === player.value ? 'border-green-600 bg-green-200 text-green-900' : 'border-green-300 bg-white text-green-800'}`}
                                                                                >
                                                                                    {player.label}
                                                                                </button>
                                                                            )) : <span className="text-sm text-gray-500">No substitute players found.</span>}
                                                                        </div>
                                                                    </div>

                                                                    <div>
                                                                        <div className="mb-2 text-xs font-bold uppercase tracking-wide text-red-700">Sub Out</div>
                                                                        <div className="flex flex-wrap gap-2 rounded-xl border border-red-200 bg-red-50 p-3">
                                                                            {playingOptions[substitutionDraft.team].length > 0 ? playingOptions[substitutionDraft.team].map((player) => (
                                                                                <button
                                                                                    key={`out-${player.value}`}
                                                                                    type="button"
                                                                                    onClick={() => setSubstitutionDraft((prev) => prev ? { ...prev, playerOutName: player.value, playerOutJerseyNumber: player.jerseyNumber } : prev)}
                                                                                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${substitutionDraft.playerOutName === player.value ? 'border-red-600 bg-red-200 text-red-900' : 'border-red-300 bg-white text-red-800'}`}
                                                                                >
                                                                                    {player.label}
                                                                                </button>
                                                                            )) : <span className="text-sm text-gray-500">No playing players found.</span>}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                                                                    <div>
                                                                        <label className="mb-1 block text-xs font-bold uppercase tracking-[0.22em] text-gray-500">Entry Time</label>
                                                                        <input
                                                                            type="time"
                                                                            value={substitutionDraft.entryTime}
                                                                            onChange={(e) => setSubstitutionDraft((prev) => prev ? { ...prev, entryTime: e.target.value } : prev)}
                                                                            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-gray-900"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="mb-1 block text-xs font-bold uppercase tracking-[0.22em] text-gray-500">Played</label>
                                                                        <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 font-bold text-gray-900">
                                                                            {(() => {
                                                                                if (!substitutionDraft.entryTime || !substitutionDraft.exitTime) return '—'
                                                                                const start = new Date(`1970-01-01T${substitutionDraft.entryTime}`)
                                                                                const end = new Date(`1970-01-01T${substitutionDraft.exitTime}`)
                                                                                if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return '—'
                                                                                const minutes = Math.floor((end.getTime() - start.getTime()) / 60000)
                                                                                return `${minutes} min`
                                                                            })()}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="mt-4 flex justify-end gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => { setSubstitutionDraft(null); }}
                                                                        className="rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={saveSubstitution}
                                                                        className="rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white shadow-sm transition-colors hover:bg-slate-800"
                                                                    >
                                                                        Save Substitution
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {substitutions.length > 0 && (
                                                            <div className="mt-4 space-y-2">
                                                                {substitutions.map((item, index) => (
                                                                    <div key={`${item.reguName}-${index}`} className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm">
                                                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                                                            <div className="font-bold text-gray-900">{item.reguName} · {item.teamLabel}</div>
                                                                            <div className="text-xs font-semibold text-gray-500">{item.timePlayed}</div>
                                                                        </div>
                                                                        <div className="mt-1 text-gray-600">
                                                                            In: {item.playerInName || '—'} {item.playerInJerseyNumber ? `(#${item.playerInJerseyNumber})` : ''} | Out: {item.playerOutName || '—'} {item.playerOutJerseyNumber ? `(#${item.playerOutJerseyNumber})` : ''}
                                                                        </div>
                                                                        <div className="text-xs text-gray-500">{item.entryTime || '—'} to {item.exitTime || '—'}</div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : !activeRegu.winner && (
                                                <div className="flex justify-center py-8">
                                                    <button
                                                        onClick={createNewSet}
                                                        className="flex items-center gap-2 rounded-xl border border-amber-200 bg-slate-900 px-8 py-4 font-bold text-white shadow-lg shadow-slate-900/10 transition-all hover:-translate-y-0.5 hover:bg-slate-800"
                                                    >
                                                        <span className="material-symbols-outlined">sports_score</span>
                                                        Start Next Set
                                                    </button>
                                                </div>
                                            )}

                                            {/* Regu Winner Section */}
                                            {activeRegu.winner ? (
                                                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 text-center shadow-sm">
                                                    <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-4 py-2 font-black text-emerald-700 shadow-sm">
                                                        <span className="material-symbols-outlined">verified</span>
                                                        {activeRegu.reguName} Completed
                                                    </div>
                                                    <p className="mt-2 font-medium text-gray-600">
                                                        Won by: <span className="font-bold text-gray-900">{activeRegu.winner === 'team1' ? selectedMatch.team1 : selectedMatch.team2}</span>
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="mt-6 flex justify-center gap-4 border-t border-slate-200 pt-4">
                                                    <button
                                                        onClick={() => declareReguWinner('team1')}
                                                        className="flex max-w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 shadow-sm transition-colors hover:bg-amber-50 md:text-base"
                                                    >
                                                        <span className="material-symbols-outlined text-sm text-amber-500">emoji_events</span>
                                                        <span className="truncate">{selectedMatch.team1} Wins {activeRegu.reguName}</span>
                                                    </button>
                                                    <button
                                                        onClick={() => declareReguWinner('team2')}
                                                        className="flex max-w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 shadow-sm transition-colors hover:bg-amber-50 md:text-base"
                                                    >
                                                        <span className="material-symbols-outlined text-sm text-amber-500">emoji_events</span>
                                                        <span className="truncate">{selectedMatch.team2} Wins {activeRegu.reguName}</span>
                                                    </button>
                                                </div>
                                            )}

                                            {/* Set History */}
                                            {activeRegu.sets && activeRegu.sets.length > 0 && (
                                                <div className="mt-8 border-t border-slate-200 pt-6">
                                                    <h4 className="mb-4 text-xs font-black uppercase tracking-[0.22em] text-gray-400">Set History for {activeRegu.reguName}</h4>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                                        {activeRegu.sets.map((set, idx) => (
                                                            <div key={idx} className={`rounded-2xl border-2 p-4 transition-all ${set.winner ? 'border-gray-200 bg-white shadow-sm' : 'border-slate-200 bg-slate-50/70 border-dashed'}`}>
                                                                <div className="flex justify-between items-center mb-3">
                                                                    <span className="text-xs font-black text-gray-500 uppercase tracking-wider">Set {set.setNumber}</span>
                                                                    {set.winner ? (
                                                                        <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded uppercase truncate max-w-[120px]">
                                                                            {set.winner === 'team1' ? `${selectedMatch.team1} Won` : `${selectedMatch.team2} Won`}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-[10px] font-bold bg-slate-900/5 text-slate-700 px-2 py-1 rounded uppercase animate-pulse">
                                                                            Live
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center justify-between font-black text-2xl tabular-nums tracking-tighter">
                                                                    <span className={set.winner === 'team1' ? 'text-green-600' : 'text-gray-900'}>{set.team1Score}</span>
                                                                    <span className="text-gray-300 text-sm">-</span>
                                                                    <span className={set.winner === 'team2' ? 'text-green-600' : 'text-gray-900'}>{set.team2Score}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Match Actions */}
                            {selectedMatch.status !== 'completed' && (
                                <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/5 sm:flex-row">
                                    <div>
                                        <h3 className="font-bold text-slate-900">End Match</h3>
                                        <p className="text-sm text-slate-500">Declare a final winner and close this match.</p>
                                    </div>
                                    <div className="flex gap-3 w-full sm:w-auto">
                                        <button
                                            onClick={() => declareMatchWinner('team1')}
                                            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 shadow-sm transition-colors hover:bg-amber-50 sm:flex-none md:text-base"
                                        >
                                            <span className="material-symbols-outlined text-amber-500">emoji_events</span>
                                            <span className="truncate">{selectedMatch.team1}</span>
                                        </button>
                                        <button
                                            onClick={() => declareMatchWinner('team2')}
                                            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 shadow-sm transition-colors hover:bg-amber-50 sm:flex-none md:text-base"
                                        >
                                            <span className="material-symbols-outlined text-amber-500">emoji_events</span>
                                            <span className="truncate">{selectedMatch.team2}</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
