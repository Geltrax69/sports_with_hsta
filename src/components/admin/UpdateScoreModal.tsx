import { useState, useEffect } from 'react'
import { apiRequest } from '../../lib/api'

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
    scorecard?: {
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

    const currentRegus = selectedMatch?.regus || []
    const activeRegu = currentRegus[selectedReguIndex]
    const activeReguName = activeRegu?.reguName || `Regu ${selectedReguIndex + 1}`

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

        const { updatedRegus: startedRegus, scorecardPatch } = ensureMatchAndReguStarted(currentRegus, selectedReguIndex)
        const newRegus = [...startedRegus]
        newRegus[selectedReguIndex] = {
            ...startedRegus[selectedReguIndex],
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

        const { updatedRegus: startedRegus, scorecardPatch } = ensureMatchAndReguStarted(currentRegus, selectedReguIndex)
        const newRegus = [...startedRegus]
        const currentSets = [...(activeRegu.sets || [])]
        const set = { ...currentSets[activeSetIndex] }

        if (team === 'team1') set.team1Score = Math.max(0, set.team1Score + delta)
        else set.team2Score = Math.max(0, set.team2Score + delta)

        currentSets[activeSetIndex] = set
        newRegus[selectedReguIndex] = { ...startedRegus[selectedReguIndex], sets: currentSets }

        handleUpdateScore(newRegus, 'ongoing', undefined, undefined, scorecardPatch)
    }

    const recordTimeout = (team: 'team1' | 'team2') => {
        if (!selectedMatch || !activeRegu || !activeSet || activeSetIndex === -1) return

        const { updatedRegus: startedRegus, scorecardPatch } = ensureMatchAndReguStarted(currentRegus, selectedReguIndex)
        const newRegus = [...startedRegus]
        const currentSets = [...(activeRegu.sets || [])]
        const set = { ...currentSets[activeSetIndex] }
        const now = formatNowHHMM()
        const field = team === 'team1' ? 'team1Timeouts' : 'team2Timeouts'
        const existing = [...(set[field] || [])]
        existing.push(now)
        set[field] = existing

        currentSets[activeSetIndex] = set
        newRegus[selectedReguIndex] = { ...startedRegus[selectedReguIndex], sets: currentSets }

        handleUpdateScore(newRegus, 'ongoing', undefined, undefined, scorecardPatch)
    }

    const declareSetWinner = (winner: 'team1' | 'team2') => {
        if (!selectedMatch || !activeRegu || !activeSet || activeSetIndex === -1) return
        if (!confirm(`Declare ${winner === 'team1' ? selectedMatch.team1 : selectedMatch.team2} as winner of Set ${activeSet.setNumber} for ${activeRegu.reguName}?`)) return

        const newRegus = [...currentRegus]
        const currentSets = [...(activeRegu.sets || [])]
        currentSets[activeSetIndex] = { ...currentSets[activeSetIndex], winner }
        newRegus[selectedReguIndex] = { ...activeRegu, sets: currentSets }
        
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
        
        handleUpdateScore(newRegus, undefined, undefined, updatedSubs)
    }

    const declareReguWinner = (winner: 'team1' | 'team2') => {
        if (!selectedMatch || !activeRegu) return
        if (!confirm(`Declare ${winner === 'team1' ? selectedMatch.team1 : selectedMatch.team2} as WINNER of ${activeRegu.reguName}?`)) return
        
        const newRegus = [...currentRegus]
        
        // Calculate regu overall scores based on sets
        const team1Score = activeRegu.sets?.filter(s => s.winner === 'team1').length || 0
        const team2Score = activeRegu.sets?.filter(s => s.winner === 'team2').length || 0
        
        const reguEndTime = formatNowHHMM()
        newRegus[selectedReguIndex] = {
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
        
        handleUpdateScore(newRegus, undefined, undefined, updatedSubs)
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
        })
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
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 bg-gradient-to-r from-[#5a0a8f] to-[#400466] text-white flex justify-between items-center rounded-t-xl sticky top-0 z-10">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <span className="material-symbols-outlined">score</span>
                            Update Match Score
                        </h2>
                    </div>
                    <button onClick={onClose} className="text-white hover:text-gray-200 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto bg-gray-50">
                    {/* Selection Phase - Only show if no pre-selected match */}
                    {!preSelectedMatch && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Select Tournament</label>
                            <select
                                className="w-full p-2.5 border-2 border-gray-200 rounded-lg disabled:opacity-50 bg-gray-50 focus:bg-white focus:border-[#5a0a8f] focus:ring-0 transition-colors text-gray-900 font-medium outline-none"
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
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Select Match</label>
                            <select
                                className="w-full p-2.5 border-2 border-gray-200 rounded-lg disabled:opacity-50 bg-gray-50 focus:bg-white focus:border-[#5a0a8f] focus:ring-0 transition-colors text-gray-900 font-medium outline-none"
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
                            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                                <div className="flex justify-between items-center">
                                    <div className="text-center w-1/3">
                                        <div className="text-xl font-black text-gray-900 break-words">{selectedMatch.team1}</div>
                                        <div className="text-4xl font-black text-[#5a0a8f] mt-2 tracking-tighter">
                                            {selectedMatch.score?.team1 || 0}
                                        </div>
                                        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Regus Won</div>
                                    </div>
                                    <div className="text-center w-1/3 flex flex-col items-center">
                                        <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Match Status</div>
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
                                    <div className="text-center w-1/3">
                                        <div className="text-xl font-black text-gray-900 break-words">{selectedMatch.team2}</div>
                                        <div className="text-4xl font-black text-[#5a0a8f] mt-2 tracking-tighter">
                                            {selectedMatch.score?.team2 || 0}
                                        </div>
                                        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Regus Won</div>
                                    </div>
                                </div>
                            </div>

                            {/* Regu Tabs */}
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="flex border-b border-gray-200 bg-gray-50/50">
                                    {currentRegus.map((regu, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedReguIndex(idx)}
                                            className={`flex-1 py-4 px-6 text-sm font-bold transition-all border-b-2 flex flex-col items-center gap-1 ${
                                                selectedReguIndex === idx 
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

                                <div className="p-6">
                                    {activeRegu && (
                                        <div className="space-y-6">
                                            {/* Active Set Controls */}
                                            {activeSet && !activeRegu.winner ? (
                                                <div className="bg-purple-50/50 rounded-2xl border border-purple-100 p-8 shadow-sm relative overflow-hidden">
                                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#5a0a8f] to-[#d400ff]"></div>
                                                    
                                                    <div className="text-center mb-8">
                                                        <span className="inline-flex items-center gap-2 bg-white text-[#5a0a8f] px-4 py-1.5 rounded-full text-sm font-black tracking-wide border border-purple-200 shadow-sm">
                                                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                                            SET {activeSet.setNumber} (LIVE)
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center justify-between gap-8 max-w-2xl mx-auto">
                                                        {/* Team 1 Controls */}
                                                        <div className="flex flex-col items-center gap-4 flex-1">
                                                            <div className="text-sm font-bold text-gray-600 truncate w-full text-center">{selectedMatch.team1}</div>
                                                            <button
                                                                onClick={() => updateSetPoint('team1', 1)}
                                                                className="w-20 h-20 rounded-full bg-white border-2 border-green-200 text-green-600 flex items-center justify-center hover:bg-green-50 hover:border-green-300 hover:scale-105 active:scale-95 transition-all shadow-sm"
                                                            >
                                                                <span className="material-symbols-outlined text-4xl font-bold">add</span>
                                                            </button>
                                                            <div className="text-6xl font-black text-gray-900 my-2 tracking-tighter tabular-nums">{activeSet.team1Score}</div>
                                                            <button
                                                                onClick={() => updateSetPoint('team1', -1)}
                                                                className="w-12 h-12 rounded-full bg-white border-2 border-red-100 text-red-500 flex items-center justify-center hover:bg-red-50 hover:border-red-200 hover:scale-105 active:scale-95 transition-all shadow-sm"
                                                            >
                                                                <span className="material-symbols-outlined text-xl">remove</span>
                                                            </button>
                                                        </div>

                                                        {/* VS */}
                                                        <div className="flex flex-col gap-4 items-center px-4">
                                                            <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-400 font-black italic text-sm">
                                                                VS
                                                            </div>
                                                        </div>

                                                        {/* Team 2 Controls */}
                                                        <div className="flex flex-col items-center gap-4 flex-1">
                                                            <div className="text-sm font-bold text-gray-600 truncate w-full text-center">{selectedMatch.team2}</div>
                                                            <button
                                                                onClick={() => updateSetPoint('team2', 1)}
                                                                className="w-20 h-20 rounded-full bg-white border-2 border-green-200 text-green-600 flex items-center justify-center hover:bg-green-50 hover:border-green-300 hover:scale-105 active:scale-95 transition-all shadow-sm"
                                                            >
                                                                <span className="material-symbols-outlined text-4xl font-bold">add</span>
                                                            </button>
                                                            <div className="text-6xl font-black text-gray-900 my-2 tracking-tighter tabular-nums">{activeSet.team2Score}</div>
                                                            <button
                                                                onClick={() => updateSetPoint('team2', -1)}
                                                                className="w-12 h-12 rounded-full bg-white border-2 border-red-100 text-red-500 flex items-center justify-center hover:bg-red-50 hover:border-red-200 hover:scale-105 active:scale-95 transition-all shadow-sm"
                                                            >
                                                                <span className="material-symbols-outlined text-xl">remove</span>
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="mt-8 border-t border-purple-200/50 pt-6">
                                                        <h4 className="font-black text-gray-400 text-xs uppercase tracking-widest mb-4 text-center">Time Out</h4>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                                                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                                                                <p className="text-sm font-bold text-gray-700 mb-2 truncate">{selectedMatch.team1}</p>
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
                                                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                                                                <p className="text-sm font-bold text-gray-700 mb-2 truncate">{selectedMatch.team2}</p>
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
                                                    </div>

                                                    <div className="mt-10 flex justify-center gap-4 border-t border-purple-200/50 pt-6">
                                                        <button
                                                            type="button"
                                                            onClick={() => declareSetWinner('team1')}
                                                            className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
                                                        >
                                                            {selectedMatch.team1} Wins Set
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => declareSetWinner('team2')}
                                                            className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
                                                        >
                                                            {selectedMatch.team2} Wins Set
                                                        </button>
                                                    </div>

                                                    <div className="mt-6 border-t border-gray-200 pt-6">
                                                        <h4 className="font-black text-gray-400 text-xs uppercase tracking-widest mb-4">Sub In / Sub Out</h4>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <button
                                                                type="button"
                                                                onClick={() => addSubstitution('team1')}
                                                                className="rounded-xl border-2 border-green-200 bg-green-50 px-4 py-3 text-left font-bold text-green-800 hover:bg-green-100 transition-colors"
                                                            >
                                                                {selectedMatch.team1} Sub In
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => addSubstitution('team2')}
                                                                className="rounded-xl border-2 border-blue-200 bg-blue-50 px-4 py-3 text-left font-bold text-blue-800 hover:bg-blue-100 transition-colors"
                                                            >
                                                                {selectedMatch.team2} Sub In
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

                                                                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                    <div>
                                                                        <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">Entry Time</label>
                                                                        <input
                                                                            type="time"
                                                                            value={substitutionDraft.entryTime}
                                                                            onChange={(e) => setSubstitutionDraft((prev) => prev ? { ...prev, entryTime: e.target.value } : prev)}
                                                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">Played</label>
                                                                        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 font-bold text-gray-900">
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
                                                                        className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={saveSubstitution}
                                                                        className="px-4 py-2 rounded-lg bg-[#5a0a8f] text-white font-semibold hover:bg-[#400466]"
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
                                                        className="flex items-center gap-2 px-8 py-4 bg-[#5a0a8f] text-white rounded-xl font-bold hover:bg-[#400466] transition-all transform hover:scale-105 shadow-md"
                                                    >
                                                        <span className="material-symbols-outlined">sports_score</span>
                                                        Start Next Set
                                                    </button>
                                                </div>
                                            )}

                                            {/* Regu Winner Section */}
                                            {activeRegu.winner ? (
                                                <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                                                    <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full text-green-700 font-black shadow-sm mb-2 border border-green-100">
                                                        <span className="material-symbols-outlined">verified</span>
                                                        {activeRegu.reguName} Completed
                                                    </div>
                                                    <p className="text-gray-600 font-medium mt-2">
                                                        Won by: <span className="font-bold text-gray-900">{activeRegu.winner === 'team1' ? selectedMatch.team1 : selectedMatch.team2}</span>
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="flex justify-center gap-4 pt-4 border-t border-gray-200 mt-6">
                                                    <button
                                                        onClick={() => declareReguWinner('team1')}
                                                        className="px-6 py-3 bg-white border-2 border-green-200 text-green-700 font-bold rounded-xl hover:bg-green-50 transition-colors shadow-sm flex items-center gap-2"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">emoji_events</span>
                                                        {selectedMatch.team1} Wins {activeRegu.reguName}
                                                    </button>
                                                    <button
                                                        onClick={() => declareReguWinner('team2')}
                                                        className="px-6 py-3 bg-white border-2 border-green-200 text-green-700 font-bold rounded-xl hover:bg-green-50 transition-colors shadow-sm flex items-center gap-2"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">emoji_events</span>
                                                        {selectedMatch.team2} Wins {activeRegu.reguName}
                                                    </button>
                                                </div>
                                            )}

                                            {/* Set History */}
                                            {activeRegu.sets && activeRegu.sets.length > 0 && (
                                                <div className="mt-8 pt-6 border-t border-gray-200">
                                                    <h4 className="font-black text-gray-400 text-xs uppercase tracking-widest mb-4">Set History for {activeRegu.reguName}</h4>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                                        {activeRegu.sets.map((set, idx) => (
                                                            <div key={idx} className={`p-4 rounded-xl border-2 transition-all ${set.winner ? 'bg-white border-gray-200 shadow-sm' : 'bg-purple-50/50 border-purple-200 border-dashed'}`}>
                                                                <div className="flex justify-between items-center mb-3">
                                                                    <span className="text-xs font-black text-gray-500 uppercase tracking-wider">Set {set.setNumber}</span>
                                                                    {set.winner ? (
                                                                        <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded uppercase truncate max-w-[120px]">
                                                                            {set.winner === 'team1' ? `${selectedMatch.team1} Won` : `${selectedMatch.team2} Won`}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-[10px] font-bold bg-purple-100 text-[#5a0a8f] px-2 py-1 rounded uppercase animate-pulse">
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
                                <div className="bg-gray-800 rounded-xl p-6 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
                                    <div>
                                        <h3 className="text-white font-bold">End Match</h3>
                                        <p className="text-gray-400 text-sm">Declare a final winner and close this match.</p>
                                    </div>
                                    <div className="flex gap-3 w-full sm:w-auto">
                                        <button
                                            onClick={() => declareMatchWinner('team1')}
                                            className="flex-1 sm:flex-none px-6 py-3 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-100 transition-colors shadow-sm flex justify-center items-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-green-600">emoji_events</span>
                                            {selectedMatch.team1}
                                        </button>
                                        <button
                                            onClick={() => declareMatchWinner('team2')}
                                            className="flex-1 sm:flex-none px-6 py-3 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-100 transition-colors shadow-sm flex justify-center items-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-green-600">emoji_events</span>
                                            {selectedMatch.team2}
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
