
import { useEffect, useState } from 'react'

type GenerateScoreCardModalProps = {
    isOpen: boolean
    onClose: () => void
    onGenerate: (data: ScoreCardData) => void
    matchTitle: string
    match?: MatchForScoreCard | null
}

type MatchForScoreCard = {
    team1?: string
    team2?: string
    team1Players?: MatchPlayer[]
    team2Players?: MatchPlayer[]
}

type MatchPlayer = {
    player?: {
        fullName?: string
        name?: string
    } | string
    jerseyNumber?: number
    isSubstitute?: boolean
    entryTime?: string
    exitTime?: string
}

export type ScoreCardSubstitution = {
    team: 'team1' | 'team2'
    teamLabel: string
    playerName: string
    jerseyNumber?: number
    entryTime: string
    exitTime: string
    timePlayed: string
}

export type ScoreCardData = {
    matchNo: string
    court: string
    juryPresident: string
    referee: string
    assistantReferee: string
    umpire: string
    startTime: string
    endTime: string
    remarks: string
    category: 'men' | 'women'
    chiefReferee: string
    substitutions: ScoreCardSubstitution[]
}

const calculateTimePlayed = (entryTime?: string, exitTime?: string) => {
    if (!entryTime || !exitTime) return '—'
    const start = new Date(`1970-01-01T${entryTime}`)
    const end = new Date(`1970-01-01T${exitTime}`)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return '—'

    const minutes = Math.floor((end.getTime() - start.getTime()) / 60000)
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes} min`
}

const buildSubstitutionsFromMatch = (match?: MatchForScoreCard | null): ScoreCardSubstitution[] => {
    if (!match) return []

    const mapPlayer = (team: 'team1' | 'team2', teamLabel: string, players?: MatchPlayer[]) =>
        (players || [])
            .filter((player) => player.isSubstitute)
            .map((player) => ({
                team,
                teamLabel,
                playerName:
                    typeof player.player === 'string'
                        ? player.player
                        : player.player?.fullName || player.player?.name || 'Substitute',
                jerseyNumber: player.jerseyNumber,
                entryTime: player.entryTime || '',
                exitTime: player.exitTime || '',
                timePlayed: calculateTimePlayed(player.entryTime, player.exitTime),
            }))

    return [
        ...mapPlayer('team1', match.team1 || 'Team A', match.team1Players),
        ...mapPlayer('team2', match.team2 || 'Team B', match.team2Players),
    ]
}

export function GenerateScoreCardModal({ isOpen, onClose, onGenerate, matchTitle, match }: GenerateScoreCardModalProps) {
    const [data, setData] = useState<ScoreCardData>({
        matchNo: '',
        court: '',
        juryPresident: '',
        referee: '',
        assistantReferee: '',
        umpire: '',
        startTime: '',
        endTime: '',
        remarks: '',
        category: 'men',
        chiefReferee: '',
        substitutions: []
    })

    useEffect(() => {
        if (!isOpen) return
        setData((prev) => ({
            ...prev,
            substitutions: buildSubstitutionsFromMatch(match),
        }))
    }, [isOpen, match])

    if (!isOpen) return null

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onGenerate({
            ...data,
            substitutions: data.substitutions.map((substitution) => ({
                ...substitution,
                timePlayed: calculateTimePlayed(substitution.entryTime, substitution.exitTime),
            })),
        })
        onClose()
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-[#5a0a8f] to-[#400466] p-4 text-white flex justify-between items-center">
                    <h2 className="text-xl font-bold">Generate Score Card: {matchTitle}</h2>
                    <button onClick={onClose} className="text-white hover:text-gray-200">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    <div className="bg-blue-50 p-4 rounded-md border border-blue-100 mb-4">
                        <p className="text-sm text-blue-800">
                            Please fill in the official match details to generate the final Regu Score Sheet.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Match No</label>
                            <input
                                type="text"
                                required
                                className="w-full px-3 py-2 border rounded-md focus:ring-[#5a0a8f] focus:border-[#5a0a8f] text-gray-900 bg-white"
                                value={data.matchNo}
                                onChange={(e) => setData({ ...data, matchNo: e.target.value })}
                                placeholder="e.g. M-01"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Court</label>
                            <input
                                type="text"
                                required
                                className="w-full px-3 py-2 border rounded-md focus:ring-[#5a0a8f] focus:border-[#5a0a8f] text-gray-900 bg-white"
                                value={data.court}
                                onChange={(e) => setData({ ...data, court: e.target.value })}
                                placeholder="e.g. Court 1"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <select
                                className="w-full px-3 py-2 border rounded-md focus:ring-[#5a0a8f] focus:border-[#5a0a8f] text-gray-900 bg-white"
                                value={data.category}
                                onChange={(e) => setData({ ...data, category: e.target.value as 'men' | 'women' })}
                            >
                                <option value="men">Men</option>
                                <option value="women">Women</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                            <input
                                type="time"
                                required
                                className="w-full px-3 py-2 border rounded-md focus:ring-[#5a0a8f] focus:border-[#5a0a8f] text-gray-900 bg-white"
                                value={data.startTime}
                                onChange={(e) => setData({ ...data, startTime: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                            <input
                                type="time"
                                required
                                className="w-full px-3 py-2 border rounded-md focus:ring-[#5a0a8f] focus:border-[#5a0a8f] text-gray-900 bg-white"
                                value={data.endTime}
                                onChange={(e) => setData({ ...data, endTime: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-4 border-t pt-4">
                        <h3 className="font-semibold text-gray-900">Officials Signatories</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Official Referee</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border rounded-md focus:ring-[#5a0a8f] focus:border-[#5a0a8f] text-gray-900 bg-white"
                                    value={data.referee}
                                    onChange={(e) => setData({ ...data, referee: e.target.value })}
                                    placeholder="Name of Referee"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Asst. Referee</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border rounded-md focus:ring-[#5a0a8f] focus:border-[#5a0a8f] text-gray-900 bg-white"
                                    value={data.assistantReferee}
                                    onChange={(e) => setData({ ...data, assistantReferee: e.target.value })}
                                    placeholder="Name of Asst. Referee"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Jury President (Optional)</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border rounded-md focus:ring-[#5a0a8f] focus:border-[#5a0a8f] text-gray-900 bg-white"
                                    value={data.juryPresident}
                                    onChange={(e) => setData({ ...data, juryPresident: e.target.value })}
                                    placeholder="Name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Umpire (Optional)</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border rounded-md focus:ring-[#5a0a8f] focus:border-[#5a0a8f] text-gray-900 bg-white"
                                    value={data.umpire}
                                    onChange={(e) => setData({ ...data, umpire: e.target.value })}
                                    placeholder="Name"
                                />
                            </div>
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Official Referee (Footer Sign)</label>
                            <input
                                type="text"
                                required
                                className="w-full px-3 py-2 border rounded-md focus:ring-[#5a0a8f] focus:border-[#5a0a8f] text-gray-900 bg-white"
                                value={data.chiefReferee}
                                onChange={(e) => setData({ ...data, chiefReferee: e.target.value })}
                                placeholder="Name of Official Referee for Signature"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                        <textarea
                            className="w-full px-3 py-2 border rounded-md focus:ring-[#5a0a8f] focus:border-[#5a0a8f] text-gray-900 bg-white"
                            rows={3}
                            value={data.remarks}
                            onChange={(e) => setData({ ...data, remarks: e.target.value })}
                            placeholder="Any warnings, cards issued, or special observations..."
                        />
                    </div>

                    <div className="space-y-4 border-t pt-4">
                        <div>
                            <h3 className="font-semibold text-gray-900">Substitution Timings</h3>
                            <p className="text-sm text-gray-500">
                                Record when each substitute entered and exited the match. Time played is calculated automatically.
                            </p>
                        </div>

                        {data.substitutions.length === 0 ? (
                            <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-500">
                                No substitute players are marked for this match yet.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {data.substitutions.map((substitution, index) => (
                                    <div key={`${substitution.team}-${substitution.playerName}-${index}`} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                                        <div className="mb-3 flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                                            <div>
                                                <div className="font-semibold text-gray-900">{substitution.playerName}</div>
                                                <div className="text-xs text-gray-500">
                                                    {substitution.teamLabel}
                                                    {substitution.jerseyNumber ? ` • Jersey #${substitution.jerseyNumber}` : ''}
                                                </div>
                                            </div>
                                            <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#5a0a8f] border border-[#e7d8f4]">
                                                Played: {calculateTimePlayed(substitution.entryTime, substitution.exitTime)}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Entry Time</label>
                                                <input
                                                    type="time"
                                                    className="w-full px-3 py-2 border rounded-md focus:ring-[#5a0a8f] focus:border-[#5a0a8f] text-gray-900 bg-white"
                                                    value={substitution.entryTime}
                                                    onChange={(e) =>
                                                        setData((prev) => ({
                                                            ...prev,
                                                            substitutions: prev.substitutions.map((item, itemIndex) =>
                                                                itemIndex === index ? { ...item, entryTime: e.target.value } : item,
                                                            ),
                                                        }))
                                                    }
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Exit Time</label>
                                                <input
                                                    type="time"
                                                    className="w-full px-3 py-2 border rounded-md focus:ring-[#5a0a8f] focus:border-[#5a0a8f] text-gray-900 bg-white"
                                                    value={substitution.exitTime}
                                                    onChange={(e) =>
                                                        setData((prev) => ({
                                                            ...prev,
                                                            substitutions: prev.substitutions.map((item, itemIndex) =>
                                                                itemIndex === index ? { ...item, exitTime: e.target.value } : item,
                                                            ),
                                                        }))
                                                    }
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Time Played</label>
                                                <div className="w-full rounded-md border bg-white px-3 py-2 text-sm font-semibold text-gray-900">
                                                    {calculateTimePlayed(substitution.entryTime, substitution.exitTime)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-[#5a0a8f] text-white rounded-md hover:bg-[#400466] shadow-md font-medium flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-sm">download</span>
                            Generate Score Card
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
