import { useEffect, useState } from 'react'
import { apiRequest } from '../../lib/api'

export function PlayerResults() {
  const [matches, setMatches] = useState<any[]>([])
  const [certificates, setCertificates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [mRes, cRes] = await Promise.all([
          apiRequest<{ matches: any[] }>('/tournaments/matches/me', { auth: true }),
          apiRequest<{ certificates: any[] }>('/certificates/me', { auth: true })
        ])
        setMatches(mRes.matches)
        setCertificates(cRes.certificates)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch results')
      } finally {
        setLoading(false)
      }
    }
    void fetchData()
  }, [])

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h1 className="text-2xl font-black text-gray-900 mb-2">My Results</h1>
        <p className="text-gray-600">Track your tournament performance and match scores.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="w-8 h-8 border-4 border-[#5a0a8f] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">{error}</div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {/* Match Results */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-purple-700">sports_score</span>
              Match Performances
            </h2>
            {matches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {matches.map((match) => (
                  <div key={match._id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-50">
                      <div className="text-[10px] font-black text-[#5a0a8f] uppercase tracking-tighter truncate max-w-[150px]">
                        {match.tournament?.title}
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">
                        {match.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 py-2">
                      <div className="flex flex-col items-center flex-1">
                        <div className="text-[10px] font-bold text-gray-400 mb-1 uppercase">TEAM 1</div>
                        <div className="text-sm font-bold text-gray-900 text-center truncate w-full">{match.team1}</div>
                        <div className="text-2xl font-black text-gray-900 mt-1">{match.score?.team1 || 0}</div>
                      </div>

                      <div className="text-xs font-black text-gray-300">VS</div>

                      <div className="flex flex-col items-center flex-1">
                        <div className="text-[10px] font-bold text-gray-400 mb-1 uppercase">TEAM 2</div>
                        <div className="text-sm font-bold text-gray-900 text-center truncate w-full">{match.team2}</div>
                        <div className="text-2xl font-black text-gray-900 mt-1">{match.score?.team2 || 0}</div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-[11px] text-gray-500 font-medium">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">calendar_today</span>
                        {match.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        {match.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-500 italic">
                No match records found.
              </div>
            )}
          </section>

          {/* Tournament Rankings & Certificates */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-yellow-600">military_tech</span>
              Tournament Rankings & Certificates
            </h2>
            {certificates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {certificates.map((cert) => (
                  <div key={cert._id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-yellow-50 flex items-center justify-center">
                        <span className="material-symbols-outlined text-yellow-600 text-2xl font-bold">emoji_events</span>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900">{cert.tournament?.title}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${cert.position === '1st' ? 'bg-yellow-100 text-yellow-800' :
                              cert.position === '2nd' ? 'bg-gray-100 text-gray-800' :
                                cert.position === '3rd' ? 'bg-orange-100 text-orange-800' :
                                  'bg-blue-100 text-blue-800'
                            }`}>
                            {cert.position}
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Serial: {cert.serialNumber}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={cert.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-[#5a0a8f] hover:bg-purple-50 rounded-lg transition-colors border border-purple-100"
                        title="View Certificate"
                      >
                        <span className="material-symbols-outlined">visibility</span>
                      </a>
                      <a
                        href={cert.fileUrl}
                        download
                        className="p-2 bg-[#5a0a8f] text-white hover:bg-[#400466] rounded-lg transition-colors"
                        title="Download Certificate"
                      >
                        <span className="material-symbols-outlined">download</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-500 italic">
                No rankings or certificates recorded yet.
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
