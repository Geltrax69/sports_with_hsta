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
    status: string
    sets?: {
        setNumber: number
        team1Score: number
        team2Score: number
        winner?: 'team1' | 'team2' | null
    }[]
    score?: {
        team1: number
        team2: number
    }
    winner?: string
}

type Props = {
    isOpen: boolean
    onClose: () => void
}

export function UpdateScoreModal({ isOpen, onClose }: Props) {
    const [loading, setLoading] = useState(false)
    const [tournaments, setTournaments] = useState<Tournament[]>([])
    const [selectedTournamentId, setSelectedTournamentId] = useState('')

    const [matches, setMatches] = useState<Match[]>([])
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)

    // Load tournaments on mount/open
    useEffect(() => {
        if (isOpen) {
            loadTournaments()
        } else {
            // Reset state on close
            setSelectedTournamentId('')
            setMatches([])
            setSelectedMatch(null)
        }
    }, [isOpen])

    // Load matches when tournament selected
    useEffect(() => {
        if (selectedTournamentId) {
            loadMatches(selectedTournamentId)
        } else {
            setMatches([])
        }
    }, [selectedTournamentId])

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
            const res = await apiRequest<{ matches: Match[] }>(`/tournaments/${tId}/matches`)
            setMatches(res.matches || [])
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateScore = async (newSets: Match['sets'], matchStatus?: string, winner?: string) => {
        if (!selectedMatch) return
        try {
            const team1Total = newSets?.filter(s => s.winner === 'team1').length || 0
            const team2Total = newSets?.filter(s => s.winner === 'team2').length || 0

            const updated = await apiRequest<{ match: Match }>(`/admin/matches/${selectedMatch._id}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    sets: newSets,
                    status: matchStatus || selectedMatch.status,
                    score: { team1: team1Total, team2: team2Total },
                    winner: winner
                }),
                auth: true
            })
            setSelectedMatch(updated.match)
        } catch (err) {
            console.error('Failed to update score', err)
            alert('Failed to save score')
        }
    }

    // Helper to get current active set
    const activeSetIndex = selectedMatch?.sets?.findIndex(s => !s.winner) ?? -1
    const activeSet = activeSetIndex !== -1 && selectedMatch?.sets ? selectedMatch.sets[activeSetIndex] : null

    const createNewSet = () => {
        if (!selectedMatch) return
        const currentSets = selectedMatch.sets || []
        const nextSetNumber = currentSets.length + 1
        const newSets = [...currentSets, { setNumber: nextSetNumber, team1Score: 0, team2Score: 0, winner: null }]
        handleUpdateScore(newSets, 'ongoing')
    }

    const updateSetPoint = (team: 'team1' | 'team2', delta: number) => {
        if (!selectedMatch || !activeSet || activeSetIndex === -1) return
        const currentSets = [...(selectedMatch.sets || [])]
        const set = { ...currentSets[activeSetIndex] }

        if (team === 'team1') set.team1Score = Math.max(0, set.team1Score + delta)
        else set.team2Score = Math.max(0, set.team2Score + delta)

        currentSets[activeSetIndex] = set
        handleUpdateScore(currentSets)
    }

    const declareSetWinner = (winner: 'team1' | 'team2') => {
        if (!selectedMatch || !activeSet || activeSetIndex === -1) return
        if (!confirm(`Declare ${winner === 'team1' ? selectedMatch.team1 : selectedMatch.team2} as winner of Set ${activeSet.setNumber}?`)) return

        const currentSets = [...(selectedMatch.sets || [])]
        currentSets[activeSetIndex] = { ...currentSets[activeSetIndex], winner }
        handleUpdateScore(currentSets)
    }

    const declareMatchWinner = (winner: 'team1' | 'team2' | 'tie') => {
        if (!confirm(`Declare ${winner === 'team1' ? selectedMatch?.team1 : winner === 'team2' ? selectedMatch?.team2 : 'Tie'} as MATCH WINNER? This will end the match.`)) return
        handleUpdateScore(selectedMatch?.sets, 'completed', winner)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">Update Match Score</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                    {/* Selection Phase */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Select Tournament</label>
                            <select
                                className="w-full p-2 border border-gray-300 rounded-lg disabled:opacity-50 bg-white text-gray-900"
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
                                className="w-full p-2 border border-gray-300 rounded-lg disabled:opacity-50 bg-white text-gray-900"
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
                                        {m.team1} vs {m.team2} ({m.date})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Scoring Interface */}
                    {selectedMatch && (
                        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                            <div className="flex justify-between items-center mb-6">
                                <div className="text-center w-1/3">
                                    <div className="text-lg font-bold text-gray-900 break-words">{selectedMatch.team1}</div>
                                    <div className="text-3xl font-black text-[#5a0a8f] mt-2">
                                        {selectedMatch.score?.team1 || 0} Sets
                                    </div>
                                </div>
                                <div className="text-center w-1/3">
                                    <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Match Status</div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${selectedMatch.status === 'completed' ? 'bg-green-100 text-green-700' :
                                        selectedMatch.status === 'ongoing' ? 'bg-blue-100 text-blue-700' :
                                            'bg-gray-100 text-gray-600'
                                        }`}>
                                        {selectedMatch.status.toUpperCase()}
                                    </span>
                                </div>
                                <div className="text-center w-1/3">
                                    <div className="text-lg font-bold text-gray-900 break-words">{selectedMatch.team2}</div>
                                    <div className="text-3xl font-black text-[#5a0a8f] mt-2">
                                        {selectedMatch.score?.team2 || 0} Sets
                                    </div>
                                </div>
                            </div>

                            {/* Active Set Controls */}
                            {activeSet ? (
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                                    <div className="text-center mb-4">
                                        <span className="bg-[#5a0a8f] text-white px-3 py-1 rounded-full text-sm font-bold">
                                            Set {activeSet.setNumber} (Live)
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between gap-4">
                                        {/* Team 1 Controls */}
                                        <div className="flex flex-col items-center gap-2">
                                            <button
                                                onClick={() => updateSetPoint('team1', 1)}
                                                className="w-16 h-16 rounded-full bg-green-100 text-green-700 flex items-center justify-center hover:bg-green-200 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-3xl">add</span>
                                            </button>
                                            <div className="text-4xl font-black text-gray-900 my-2">{activeSet.team1Score}</div>
                                            <button
                                                onClick={() => updateSetPoint('team1', -1)}
                                                className="w-12 h-12 rounded-full bg-red-100 text-red-700 flex items-center justify-center hover:bg-red-200 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-xl">remove</span>
                                            </button>
                                        </div>

                                        {/* Set Actions */}
                                        <div className="flex flex-col gap-3">
                                            <button
                                                onClick={() => declareSetWinner('team1')}
                                                className="px-4 py-2 bg-purple-50 text-[#5a0a8f] font-bold text-sm rounded-lg hover:bg-purple-100"
                                            >
                                                {selectedMatch.team1} Wins Set
                                            </button>
                                            <button
                                                onClick={() => declareSetWinner('team2')}
                                                className="px-4 py-2 bg-purple-50 text-[#5a0a8f] font-bold text-sm rounded-lg hover:bg-purple-100"
                                            >
                                                {selectedMatch.team2} Wins Set
                                            </button>
                                        </div>

                                        {/* Team 2 Controls */}
                                        <div className="flex flex-col items-center gap-2">
                                            <button
                                                onClick={() => updateSetPoint('team2', 1)}
                                                className="w-16 h-16 rounded-full bg-green-100 text-green-700 flex items-center justify-center hover:bg-green-200 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-3xl">add</span>
                                            </button>
                                            <div className="text-4xl font-black text-gray-900 my-2">{activeSet.team2Score}</div>
                                            <button
                                                onClick={() => updateSetPoint('team2', -1)}
                                                className="w-12 h-12 rounded-full bg-red-100 text-red-700 flex items-center justify-center hover:bg-red-200 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-xl">remove</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex justify-center mb-6">
                                    {selectedMatch.status !== 'completed' && (
                                        <button
                                            onClick={createNewSet}
                                            className="flex items-center gap-2 px-6 py-3 bg-[#5a0a8f] text-white rounded-xl font-bold hover:bg-[#4a0876] transition-colors"
                                        >
                                            <span className="material-symbols-outlined">sports_score</span>
                                            Start New Set
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Set History */}
                            <div className="space-y-2 mb-6">
                                <h4 className="font-bold text-gray-700 text-sm uppercase">Set History</h4>
                                {selectedMatch.sets?.map((set, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-white p-3 rounded border border-gray-100">
                                        <span className="text-sm font-medium text-gray-500">Set {set.setNumber}</span>
                                        <div className="flex gap-4 font-bold text-gray-900">
                                            <span className={set.winner === 'team1' ? 'text-green-600' : ''}>{set.team1Score}</span>
                                            <span className="text-gray-300">-</span>
                                            <span className={set.winner === 'team2' ? 'text-green-600' : ''}>{set.team2Score}</span>
                                        </div>
                                        <span className="text-xs font-bold text-gray-400 w-20 text-right">
                                            {set.winner ? (set.winner === 'team1' ? 'Team 1 Won' : 'Team 2 Won') : 'In Progress'}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Match Actions */}
                            {selectedMatch.status !== 'completed' && (
                                <div className="border-t border-gray-200 pt-6 flex justify-end gap-3">
                                    <button
                                        onClick={() => declareMatchWinner('team1')}
                                        className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700"
                                    >
                                        Match Won by {selectedMatch.team1}
                                    </button>
                                    <button
                                        onClick={() => declareMatchWinner('team2')}
                                        className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700"
                                    >
                                        Match Won by {selectedMatch.team2}
                                    </button>
                                </div>
                            )}
                            {selectedMatch.status === 'completed' && (
                                <div className="border-t border-gray-200 pt-6 text-center">
                                    <div className="inline-block px-6 py-2 bg-green-100 text-green-800 rounded-full font-bold">
                                        🎉 Match Completed - Winner: {selectedMatch.winner === 'team1' ? selectedMatch.team1 : selectedMatch.winner === 'team2' ? selectedMatch.team2 : 'Tie'}
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
