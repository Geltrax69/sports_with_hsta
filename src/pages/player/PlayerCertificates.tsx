import { useEffect, useState } from 'react'
import { apiRequest } from '../../lib/api'

export function PlayerCertificates() {
  const [certificates, setCertificates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCertificates = async () => {
      setLoading(true)
      try {
        const res = await apiRequest<{ certificates: any[] }>('/certificates/me', { auth: true })
        setCertificates(res.certificates)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch certificates')
      } finally {
        setLoading(false)
      }
    }
    void fetchCertificates()
  }, [])

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">My Certificates</h1>
          <p className="text-gray-600">View and download your earned certificates.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#5a0a8f] text-white rounded-lg font-bold hover:bg-[#400466] transition-colors shadow-lg shadow-purple-900/10">
          <span className="material-symbols-outlined text-sm">cloud_upload</span>
          Upload Experience
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 bg-white rounded-xl border border-gray-100">
          <div className="w-10 h-10 border-4 border-[#5a0a8f] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 font-medium">Fetching your credentials...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-6 rounded-xl border border-red-200 flex items-center gap-3">
          <span className="material-symbols-outlined">error</span>
          {error}
        </div>
      ) : certificates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((cert) => (
            <div key={cert._id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl transition-all group">
              <div className="aspect-[1.414/1] bg-gray-50 border-b border-gray-100 relative overflow-hidden">
                <img
                  src={cert.fileUrl}
                  alt="Certificate"
                  className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <a
                    href={cert.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-white text-gray-900 rounded-full flex items-center justify-center hover:bg-[#5a0a8f] hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined">visibility</span>
                  </a>
                  <a
                    href={cert.fileUrl}
                    download
                    className="w-10 h-10 bg-[#5a0a8f] text-white rounded-full flex items-center justify-center hover:bg-[#400466] transition-colors"
                  >
                    <span className="material-symbols-outlined">download</span>
                  </a>
                </div>
                <div className="absolute top-3 right-3">
                  <span className="px-2 py-1 bg-white/90 backdrop-blur rounded text-[10px] font-black uppercase text-[#5a0a8f] shadow-sm">
                    {cert.position === 'Participation' ? 'Participation' : 'Award'}
                  </span>
                </div>
              </div>
              <div className="p-5">
                <div className="text-[10px] font-black text-purple-700 uppercase tracking-widest mb-1 truncate">
                  {cert.tournament?.title}
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-4">{cert.position} Certificate</h3>
                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Serial No.</span>
                    <span className="text-xs font-black text-gray-700">{cert.serialNumber}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Event</span>
                    <span className="text-xs font-black text-gray-700">{cert.eventType || 'Regu'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-20 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-gray-300 text-5xl font-light">workspace_premium</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Certificates Found</h2>
          <p className="text-gray-500 max-w-sm mx-auto mb-8">
            You haven't been issued any tournament certificates yet. Participate in state or national events to earn official recognition.
          </p>
          <button className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors">
            <span className="material-symbols-outlined">explore</span>
            Browse Events
          </button>
        </div>
      )}
    </div>
  )
}
