
import { useState } from 'react'

type GenerateScoreCardModalProps = {
    isOpen: boolean
    onClose: () => void
    onGenerate: (data: ScoreCardData) => void
    matchTitle: string
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
}

export function GenerateScoreCardModal({ isOpen, onClose, onGenerate, matchTitle }: GenerateScoreCardModalProps) {
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
        chiefReferee: ''
    })

    if (!isOpen) return null

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onGenerate(data)
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
