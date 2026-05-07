
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
    regus?: {
        reguName: string
    }[]
    scorecard?: {
        substitutions?: ScoreCardSubstitution[]
    }
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
    reguName: string
    playerName: string
    jerseyNumber?: number
    playerInName?: string
    playerInJerseyNumber?: number
    playerOutName?: string
    playerOutJerseyNumber?: number
    entryTime: string
    exitTime: string
    timePlayed: string
}

type PlayerOption = {
    label: string
    value: string
    jerseyNumber?: number
    isSubstitute: boolean
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

const buildPlayerOptions = (players?: MatchPlayer[]): PlayerOption[] =>
    (players || []).map((player, index) => {
        const playerLabel =
            typeof player.player === 'string'
                ? player.player
                : player.player?.fullName || player.player?.name || `Player ${index + 1}`

        return {
            label: `${playerLabel}${player.jerseyNumber ? ` #${player.jerseyNumber}` : ''}`,
            value: playerLabel,
            jerseyNumber: player.jerseyNumber,
            isSubstitute: !!player.isSubstitute,
        }
    })

const buildSubstitutionsFromMatch = (match?: MatchForScoreCard | null): ScoreCardSubstitution[] => {
    if (!match) return []

    const savedSubstitutions = match.scorecard?.substitutions || []
    if (savedSubstitutions.length > 0) {
        return savedSubstitutions.map((substitution) => ({
            ...substitution,
            playerName: substitution.playerInName || substitution.playerName || '',
            teamLabel: substitution.teamLabel || (substitution.team === 'team1' ? match.team1 || 'Team A' : match.team2 || 'Team B'),
            reguName: substitution.reguName || match.regus?.[0]?.reguName || 'Regu 1',
            playerInName: substitution.playerInName || substitution.playerName || '',
            playerInJerseyNumber: substitution.playerInJerseyNumber,
            playerOutName: substitution.playerOutName || '',
            playerOutJerseyNumber: substitution.playerOutJerseyNumber,
            timePlayed: calculateTimePlayed(substitution.entryTime, substitution.exitTime),
        }))
    }

    return [
        {
            team: 'team1',
            teamLabel: match.team1 || 'Team A',
            reguName: match.regus?.[0]?.reguName || 'Regu 1',
            playerName: '',
            jerseyNumber: undefined,
            playerInName: '',
            playerInJerseyNumber: undefined,
            playerOutName: '',
            playerOutJerseyNumber: undefined,
            entryTime: '',
            exitTime: '',
            timePlayed: '—',
        },
    ]
}

const createEmptySubstitution = (match?: MatchForScoreCard | null): ScoreCardSubstitution => ({
    team: 'team1',
    teamLabel: match?.team1 || 'Team A',
    reguName: match?.regus?.[0]?.reguName || 'Regu 1',
    playerName: '',
    jerseyNumber: undefined,
    playerInName: '',
    playerInJerseyNumber: undefined,
    playerOutName: '',
    playerOutJerseyNumber: undefined,
    entryTime: '',
    exitTime: '',
    timePlayed: '—',
})

export function GenerateScoreCardModal({ isOpen, onClose, onGenerate, matchTitle, match }: GenerateScoreCardModalProps) {
    const [activePicker, setActivePicker] = useState<{ index: number; field: 'playerIn' | 'playerOut' } | null>(null)
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
        const substitutionsFromMatch = buildSubstitutionsFromMatch(match)
        setData((prev) => ({
            ...prev,
            substitutions: substitutionsFromMatch.length > 0 ? substitutionsFromMatch : [createEmptySubstitution(match)],
        }))
    }, [isOpen, match])

    if (!isOpen) return null

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onGenerate({
            ...data,
            substitutions: data.substitutions.map((substitution) => ({
                ...substitution,
                playerName: substitution.playerInName || substitution.playerName,
                timePlayed: calculateTimePlayed(substitution.entryTime, substitution.exitTime),
            })),
        })
        onClose()
    }

    const updateSubstitution = (index: number, patch: Partial<ScoreCardSubstitution>) => {
        setData((prev) => ({
            ...prev,
            substitutions: prev.substitutions.map((item, itemIndex) => {
                if (itemIndex !== index) return item

                const nextItem = { ...item, ...patch }
                if (patch.team) {
                    nextItem.teamLabel = patch.team === 'team1' ? match?.team1 || 'Team A' : match?.team2 || 'Team B'
                    nextItem.playerInName = ''
                    nextItem.playerInJerseyNumber = undefined
                    nextItem.playerOutName = ''
                    nextItem.playerOutJerseyNumber = undefined
                }
                return nextItem
            }),
        }))
    }

    const getPlayerOptions = (team: 'team1' | 'team2', field: 'playerIn' | 'playerOut') => {
        const teamPlayers = team === 'team1' ? buildPlayerOptions(match?.team1Players) : buildPlayerOptions(match?.team2Players)
        return field === 'playerIn'
            ? teamPlayers.filter((player) => player.isSubstitute)
            : teamPlayers.filter((player) => !player.isSubstitute)
    }

    const selectPlayer = (index: number, field: 'playerIn' | 'playerOut', option: PlayerOption) => {
        updateSubstitution(index, field === 'playerIn'
            ? { playerInName: option.value, playerInJerseyNumber: option.jerseyNumber }
            : { playerOutName: option.value, playerOutJerseyNumber: option.jerseyNumber })
        setActivePicker(null)
    }

    const addManualSubstitution = () => {
        setData((prev) => ({
            ...prev,
            substitutions: [...prev.substitutions, createEmptySubstitution(match)],
        }))
    }

    const removeSubstitution = (index: number) => {
        setData((prev) => ({
            ...prev,
            substitutions: prev.substitutions.filter((_, itemIndex) => itemIndex !== index),
        }))
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
                            Please fill in the official match details to generate the final Regu score sheet.
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
                                Pick a regu, choose who came in and who went out, then capture the entry and exit time.
                            </p>
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={addManualSubstitution}
                                className="inline-flex items-center gap-2 rounded-md border border-[#d8c1eb] bg-[#faf5ff] px-3 py-2 text-sm font-semibold text-[#5a0a8f] hover:bg-[#f4ebff]"
                            >
                                <span className="material-symbols-outlined text-sm">add</span>
                                Add Substitute
                            </button>
                        </div>

                        {data.substitutions.length === 0 ? (
                            <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-500">
                                No substitutions added yet.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {data.substitutions.map((substitution, index) => (
                                    <div key={`${substitution.team}-${substitution.reguName}-${substitution.playerName}-${index}`} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                                        <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                            <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-3">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
                                                    <select
                                                        className="w-full px-3 py-2 border rounded-md focus:ring-[#5a0a8f] focus:border-[#5a0a8f] text-gray-900 bg-white"
                                                        value={substitution.team}
                                                        onChange={(e) => updateSubstitution(index, { team: e.target.value as 'team1' | 'team2' })}
                                                    >
                                                        <option value="team1">{match?.team1 || 'Team A'}</option>
                                                        <option value="team2">{match?.team2 || 'Team B'}</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Regu</label>
                                                    <select
                                                        className="w-full px-3 py-2 border rounded-md focus:ring-[#5a0a8f] focus:border-[#5a0a8f] text-gray-900 bg-white"
                                                        value={substitution.reguName}
                                                        onChange={(e) => updateSubstitution(index, { reguName: e.target.value })}
                                                    >
                                                        {(match?.regus?.length ? match.regus : [{ reguName: 'Regu 1' }, { reguName: 'Regu 2' }, { reguName: 'Regu 3' }]).map((regu) => (
                                                            <option key={regu.reguName} value={regu.reguName}>{regu.reguName}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Time Played</label>
                                                    <div className="w-full rounded-md border bg-white px-3 py-2 text-sm font-semibold text-gray-900">
                                                        {calculateTimePlayed(substitution.entryTime, substitution.exitTime)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#5a0a8f] border border-[#e7d8f4]">
                                                Played: {calculateTimePlayed(substitution.entryTime, substitution.exitTime)}
                                            </div>
                                        </div>

                                        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between gap-2">
                                                    <label className="block text-sm font-medium text-gray-700">Sub In</label>
                                                    <button
                                                        type="button"
                                                        onClick={() => setActivePicker(activePicker?.index === index && activePicker.field === 'playerIn' ? null : { index, field: 'playerIn' })}
                                                        className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 hover:bg-green-100"
                                                    >
                                                        {activePicker?.index === index && activePicker.field === 'playerIn' ? 'Hide' : 'Choose Sub In'}
                                                    </button>
                                                </div>
                                                <div className="rounded-md border border-dashed border-green-200 bg-green-50/60 p-3 text-sm text-gray-700">
                                                    {substitution.playerInName || 'No sub-in player selected'}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between gap-2">
                                                    <label className="block text-sm font-medium text-gray-700">Sub Out</label>
                                                    <button
                                                        type="button"
                                                        onClick={() => setActivePicker(activePicker?.index === index && activePicker.field === 'playerOut' ? null : { index, field: 'playerOut' })}
                                                        className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                                                    >
                                                        {activePicker?.index === index && activePicker.field === 'playerOut' ? 'Hide' : 'Choose Sub Out'}
                                                    </button>
                                                </div>
                                                <div className="rounded-md border border-dashed border-red-200 bg-red-50/60 p-3 text-sm text-gray-700">
                                                    {substitution.playerOutName || 'No sub-out player selected'}
                                                </div>
                                            </div>
                                        </div>

                                        {activePicker?.index === index && (
                                            <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4">
                                                <div className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                                                    Select {activePicker.field === 'playerIn' ? 'Sub In' : 'Sub Out'} Player
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {getPlayerOptions(substitution.team, activePicker.field).length > 0 ? (
                                                        getPlayerOptions(substitution.team, activePicker.field).map((option) => (
                                                            <button
                                                                key={option.value}
                                                                type="button"
                                                                onClick={() => selectPlayer(index, activePicker.field, option)}
                                                                className="rounded-full border border-[#d8c1eb] bg-[#faf5ff] px-3 py-1.5 text-xs font-semibold text-[#5a0a8f] hover:bg-[#f4ebff]"
                                                            >
                                                                {option.label}
                                                            </button>
                                                        ))
                                                    ) : (
                                                        <span className="text-sm text-gray-500">No players available for this side.</span>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Entry Time</label>
                                                <input
                                                    type="time"
                                                    className="w-full px-3 py-2 border rounded-md focus:ring-[#5a0a8f] focus:border-[#5a0a8f] text-gray-900 bg-white"
                                                    value={substitution.entryTime}
                                                    onChange={(e) => updateSubstitution(index, { entryTime: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Exit Time</label>
                                                <input
                                                    type="time"
                                                    className="w-full px-3 py-2 border rounded-md focus:ring-[#5a0a8f] focus:border-[#5a0a8f] text-gray-900 bg-white"
                                                    value={substitution.exitTime}
                                                    onChange={(e) => updateSubstitution(index, { exitTime: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Time Played</label>
                                                <div className="w-full rounded-md border bg-white px-3 py-2 text-sm font-semibold text-gray-900">
                                                    {calculateTimePlayed(substitution.entryTime, substitution.exitTime)}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-transparent mb-1">Remove</label>
                                                <button
                                                    type="button"
                                                    onClick={() => removeSubstitution(index)}
                                                    className="w-full px-3 py-2 rounded-md border border-red-200 bg-red-50 text-sm font-semibold text-red-600 hover:bg-red-100"
                                                >
                                                    Remove
                                                </button>
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
