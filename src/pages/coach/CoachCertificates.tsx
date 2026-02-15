import { useEffect, useState } from 'react'
import { apiRequest, API_BASE_URL } from '../../lib/api'

export function CoachCertificates() {
  const [certificates, setCertificates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await apiRequest<{ certificates: any[] }>('/certificates/me', { auth: true })
        setCertificates(Array.isArray(res.certificates) ? res.certificates : [])
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to fetch certificates')
      } finally {
        setLoading(false)
      }
    }

    void run()
  }, [])

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
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h1 className="text-2xl font-black text-gray-900 mb-2">My Certificates</h1>
        <p className="text-gray-600">View and download your coaching certificates.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {loading ? (
          <div className="text-gray-500">Loading certificates...</div>
        ) : error ? (
          <div className="text-red-600 text-sm font-semibold">{error}</div>
        ) : certificates.length === 0 ? (
          <div className="text-gray-500">No certificates found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {certificates.map((cert) => (
              <div key={cert._id} className="border border-gray-200 rounded-lg p-4 flex flex-col gap-3">
                <div className="w-full h-32 bg-gray-50 rounded overflow-hidden flex items-center justify-center">
                  <img src={cert.fileUrl} alt="Certificate" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Serial #{cert.serialNumber}</div>
                  <div className="text-xs text-gray-500">{cert.tournament?.title || 'Tournament'}</div>
                </div>
                <button
                  onClick={() => handleDownload(cert._id, `Cert_${cert.serialNumber}.png`)}
                  className="inline-flex items-center gap-1 px-3 py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  Download
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
