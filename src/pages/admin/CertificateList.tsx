import { useState, useEffect } from 'react'
import { apiRequest, API_BASE_URL } from '../../lib/api'

export function CertificateList() {
    const [certificates, setCertificates] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [tournaments, setTournaments] = useState<any[]>([])
    const [selectedTournament, setSelectedTournament] = useState('')

    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [deletingBulk, setDeletingBulk] = useState(false)

    useEffect(() => {
        fetchTournaments()
        fetchCertificates()
    }, [])

    const fetchTournaments = async () => {
        try {
            const response = await apiRequest<{ tournaments: any[] }>('/tournaments')
            setTournaments(response.tournaments || [])
        } catch (error) {
            console.error('Error fetching tournaments:', error)
        }
    }

    const fetchCertificates = async () => {
        setLoading(true)
        setSelectedIds([]) // Reset selection on fetch
        try {
            let url = '/admin/certificates'
            const params = new URLSearchParams()
            if (selectedTournament) params.append('tournamentId', selectedTournament)
            if (searchTerm) params.append('search', searchTerm)

            if (params.toString()) {
                url += `?${params.toString()}`
            }

            const response = await apiRequest<{ certificates: any[] }>(url, { auth: true })
            setCertificates(response.certificates || [])
        } catch (error) {
            console.error('Error fetching certificates:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this certificate?')) return

        try {
            await apiRequest(`/admin/certificates/${id}`, { method: 'DELETE', auth: true })
            setCertificates(prev => prev.filter(c => c._id !== id))
            setSelectedIds(prev => prev.filter(selectedId => selectedId !== id))
        } catch (error) {
            console.error('Error deleting certificate:', error)
            alert('Failed to delete certificate')
        }
    }

    const handleBulkDelete = async () => {
        if (!selectedIds.length) return
        if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} certificates?`)) return

        setDeletingBulk(true)
        try {
            await apiRequest('/admin/certificates/bulk', {
                method: 'DELETE',
                auth: true,
                body: JSON.stringify({ ids: selectedIds })
            })
            setCertificates(prev => prev.filter(c => !selectedIds.includes(c._id)))
            setSelectedIds([])
            alert('Bulk deletion successful')
        } catch (error) {
            console.error('Error in bulk delete:', error)
            alert('Failed to delete some certificates')
        } finally {
            setDeletingBulk(false)
        }
    }

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(certificates.map(c => c._id))
        } else {
            setSelectedIds([])
        }
    }

    const handleSelectOne = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
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
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Generated Certificates</h1>
                    <p className="text-gray-500">View and manage all generated certificates</p>
                </div>
                {selectedIds.length > 0 && (
                    <button
                        onClick={handleBulkDelete}
                        disabled={deletingBulk}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-100 disabled:opacity-50"
                    >
                        {deletingBulk ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <span className="material-symbols-outlined text-sm">delete_sweep</span>
                        )}
                        Delete Selected ({selectedIds.length})
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                    <input
                        type="text"
                        placeholder="Search by serial number, role, or position..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchCertificates()}
                    />
                </div>
                <select
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                    value={selectedTournament}
                    onChange={(e) => setSelectedTournament(e.target.value)}
                >
                    <option value="">All Tournaments</option>
                    {tournaments.map(t => (
                        <option key={t._id} value={t._id}>{t.title}</option>
                    ))}
                </select>
                <button
                    onClick={fetchCertificates}
                    className="px-6 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-colors"
                >
                    Apply Filters
                </button>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 w-10">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
                                        checked={certificates.length > 0 && selectedIds.length === certificates.length}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Sr. No</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Participant</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Role/Position</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Tournament</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Generated At</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                            <span>Loading certificates...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : certificates.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        No certificates found
                                    </td>
                                </tr>
                            ) : (
                                certificates.map((cert) => (
                                    <tr
                                        key={cert._id}
                                        className={`hover:bg-gray-50 transition-colors ${selectedIds.includes(cert._id) ? 'bg-purple-50/50' : ''}`}
                                    >
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
                                                checked={selectedIds.includes(cert._id)}
                                                onChange={() => handleSelectOne(cert._id)}
                                            />
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-900">{cert.serialNumber}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={cert.participant?.profilePhoto || `https://ui-avatars.com/api/?name=${cert.participant?.fullName}&background=random`}
                                                    alt=""
                                                    className="w-8 h-8 rounded-full object-cover"
                                                />
                                                <div className="font-medium text-gray-900">{cert.participant?.fullName}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900 font-medium">{cert.role}</div>
                                            <div className="text-xs text-gray-500">{cert.position || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                            {cert.tournament?.title}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(cert.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleDownload(cert._id, `Cert_${cert.serialNumber}.png`)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Download"
                                                >
                                                    <span className="material-symbols-outlined text-lg">download</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(cert._id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <span className="material-symbols-outlined text-lg">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
