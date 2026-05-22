import { useState, useEffect } from 'react'
import { apiRequest, API_BASE_URL } from '../lib/api'

export function CertificatesPage() {
    const [certificates, setCertificates] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [tournaments, setTournaments] = useState<any[]>([])
    const [selectedTournament, setSelectedTournament] = useState('')
    const [searched, setSearched] = useState(false)

    useEffect(() => {
        const controller = new AbortController()
        apiRequest<{ tournaments: any[] }>('/tournaments', { signal: controller.signal })
            .then((r) => { if (!controller.signal.aborted) setTournaments(r.tournaments || []) })
            .catch(() => { /* silently ignore — tournaments list is optional */ })
        return () => { controller.abort() }
    }, [])

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()

        if (!searchTerm && !selectedTournament) {
            alert('Please enter a search term or select a tournament')
            return
        }

        setLoading(true)
        setSearched(true)
        try {
            let url = '/certificates'
            const params = new URLSearchParams()
            if (selectedTournament) params.append('tournamentId', selectedTournament)
            if (searchTerm) params.append('search', searchTerm)

            if (params.toString()) {
                url += `?${params.toString()}`
            }

            const response = await apiRequest<{ certificates: any[] }>(url)
            setCertificates(response.certificates || [])
        } catch (error) {
            console.error('Error fetching certificates:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDownload = (certId: string, fileName: string) => {
        const url = `${API_BASE_URL}/certificates/${certId}/download`
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <main id="page-content" className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-4xl font-black text-gray-900 mb-4">Certificate Verification</h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Search and download your certificates by Serial Number, Player ID, or Tournament.
                    </p>
                </div>

                {/* Search Box */}
                <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 max-w-4xl mx-auto">
                    <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                            <input
                                type="text"
                                placeholder="Enter Serial Number or Player ID..."
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-gray-900"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select
                            className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all bg-white text-gray-900"
                            value={selectedTournament}
                            onChange={(e) => setSelectedTournament(e.target.value)}
                        >
                            <option value="">All Tournaments</option>
                            {tournaments.map(t => (
                                <option key={t._id} value={t._id}>{t.title}</option>
                            ))}
                        </select>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-8 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 active:scale-95 disabled:opacity-50"
                        >
                            {loading ? 'Searching...' : 'Search Now'}
                        </button>
                    </form>
                </div>

                {/* Results List */}
                {searched && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900 border-b pb-4">
                            {certificates.length} {certificates.length === 1 ? 'Result' : 'Results'} Found
                        </h2>

                        {loading ? (
                            <div className="flex flex-col items-center py-20 gap-4 text-gray-500">
                                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                <p className="font-medium">Searching our records...</p>
                            </div>
                        ) : certificates.length === 0 ? (
                            <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="material-symbols-outlined text-4xl text-gray-400">search_off</span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">No Certificates Found</h3>
                                <p className="text-gray-500">We couldn't find any results matching your search criteria. Please double-check the serial number or try a different name.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {certificates.map((cert) => (
                                    <div key={cert._id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow group">
                                        <div className="p-6">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-black uppercase tracking-wider">
                                                    {cert.serialNumber}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    {new Date(cert.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 mb-6">
                                                <img
                                                    src={cert.participant?.profilePhoto || `https://ui-avatars.com/api/?name=${cert.participant?.fullName}&background=6366f1&color=fff`}
                                                    alt=""
                                                    className="w-16 h-16 rounded-2xl object-cover ring-4 ring-gray-50"
                                                />
                                                <div>
                                                    <h3 className="font-black text-gray-900 text-lg uppercase leading-tight">
                                                        {cert.participant?.playerId || cert.participant?.coachId || cert.participant?.refereeId || 'ID PENDING'}
                                                    </h3>
                                                    <p className="text-sm font-bold text-gray-500">{cert.role}</p>
                                                    {cert.position && <p className="text-xs text-purple-600 font-bold">{cert.position}</p>}
                                                </div>
                                            </div>

                                            <div className="space-y-3 mb-6">
                                                <div className="flex items-start gap-2 text-sm text-gray-600">
                                                    <span className="material-symbols-outlined text-gray-400 text-lg">emoji_events</span>
                                                    <span className="font-medium line-clamp-2">{cert.tournament?.title}</span>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handleDownload(cert._id, `Certificate_${cert.serialNumber}.png`)}
                                                className="w-full flex items-center justify-center gap-2 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-all group-hover:scale-[1.02] active:scale-95 shadow-lg shadow-gray-200"
                                            >
                                                <span className="material-symbols-outlined">download</span>
                                                Download Certificate
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Info Section */}
                {!searched && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                        <div className="text-center p-6">
                            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined text-3xl text-blue-600">verified</span>
                            </div>
                            <h3 className="font-bold text-gray-900 mb-2">Official Records</h3>
                            <p className="text-sm text-gray-500 text-balance">All certificates are digitally signed and part of the official Haryana Sepaktakraw Association records.</p>
                        </div>
                        <div className="text-center p-6">
                            <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined text-3xl text-green-600">download</span>
                            </div>
                            <h3 className="font-bold text-gray-900 mb-2">Instant Download</h3>
                            <p className="text-sm text-gray-500 text-balance">Access and download your certificates instantly in high resolution format once generated by the association.</p>
                        </div>
                        <div className="text-center p-6">
                            <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined text-3xl text-purple-600">shield</span>
                            </div>
                            <h3 className="font-bold text-gray-900 mb-2">Secure Search</h3>
                            <p className="text-sm text-gray-500 text-balance">Verify the authenticity of any certificate by searching for the unique serial number printed on the document.</p>
                        </div>
                    </div>
                )}
            </div>
        </main>
    )
}
