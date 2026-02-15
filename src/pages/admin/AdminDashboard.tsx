import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { useRegistrations } from '../../context/RegistrationsContext'
import { useDistricts } from '../../context/DistrictsContext'
import { apiRequest, API_BASE_URL } from '../../lib/api'
import { UpdateScoreModal } from '../../components/admin/UpdateScoreModal'

export function AdminDashboard() {
  const { registrations } = useRegistrations()
  const { districts } = useDistricts()
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false)

  const [tournaments, setTournaments] = useState<any[]>([])
  const [coachCertificates, setCoachCertificates] = useState<any[]>([])
  const [refereeCertificates, setRefereeCertificates] = useState<any[]>([])
  const [loadingCertificates, setLoadingCertificates] = useState(false)

  useEffect(() => {
    apiRequest<{ tournaments: any[] }>('/admin/tournaments', { auth: true })
      .then((res) => setTournaments(res.tournaments || []))
      .catch(() => setTournaments([]))
  }, [])

  useEffect(() => {
    const fetchCertificates = async () => {
      setLoadingCertificates(true)
      try {
        const [coachRes, refereeRes] = await Promise.all([
          apiRequest<{ certificates: any[] }>('/admin/certificates?search=Coach', { auth: true }),
          apiRequest<{ certificates: any[] }>('/admin/certificates?search=Referee', { auth: true })
        ])

        setCoachCertificates((coachRes.certificates || []).slice(0, 4))
        setRefereeCertificates((refereeRes.certificates || []).slice(0, 4))
      } catch (error) {
        console.error('Error fetching certificates', error)
        setCoachCertificates([])
        setRefereeCertificates([])
      } finally {
        setLoadingCertificates(false)
      }
    }

    void fetchCertificates()
  }, [])

  const stats = useMemo(() => {
    const players = registrations.filter((r) => r.type === 'player')
    const approvedPlayers = players.filter((r) => r.status === 'approved').length
    const pendingPlayers = players.filter((r) => r.status === 'pending').length
    const activeTournaments = tournaments.filter((t) => t.status === 'REGISTRATION OPEN').length
    return { approvedPlayers, pendingPlayers, activeTournaments }
  }, [registrations, tournaments])

  const recentPendingPlayers = useMemo(() => {
    return registrations
      .filter((r) => r.type === 'player' && r.status === 'pending')
      .slice()
      .sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''))
      .slice(0, 3)
  }, [registrations])

  const districtName = (code: string) => {
    const d = districts.find((x) => x.id === code)
    return d?.name || code
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
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">Dashboard Overview</h1>
        <p className="text-gray-600">Welcome back, Administrator</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl border-2 border-red-100 p-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10">
            <span className="material-symbols-outlined text-6xl text-red-500">groups</span>
          </div>
          <div className="relative">
            <div className="text-3xl font-black text-gray-900 mb-1">{stats.approvedPlayers}</div>
            <div className="flex items-center gap-2 text-sm mb-2">
              <span className="text-green-600 font-bold">+5%</span>
              <span className="text-gray-500">Verified registrations</span>
            </div>
            <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Total Players</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border-2 border-orange-100 p-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10">
            <span className="material-symbols-outlined text-6xl text-orange-500">emoji_events</span>
          </div>
          <div className="relative">
            <div className="text-3xl font-black text-gray-900 mb-1">{stats.activeTournaments}</div>
            <div className="text-sm text-gray-600 mb-2">Registration Open</div>
            <div className="text-xs text-gray-500">Managing current lifecycle</div>
            <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide mt-2">Active Tournaments</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border-2 border-red-100 p-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10">
            <span className="material-symbols-outlined text-6xl text-red-500">pending_actions</span>
          </div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <div className="text-3xl font-black text-gray-900">{stats.pendingPlayers}</div>
              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">Action Needed</span>
            </div>
            <div className="text-xs text-gray-500 mb-2">Players awaiting verification</div>
            <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Pending Approvals</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border-2 border-blue-100 p-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10">
            <span className="material-symbols-outlined text-6xl text-blue-500">map</span>
          </div>
          <div className="relative">
            <div className="text-3xl font-black text-gray-900 mb-1">{districts.length}</div>
            <div className="text-sm text-gray-600 mb-2">Across 12 states</div>
            <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Affiliated Districts</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/admin/players"
            className="bg-white rounded-xl border-2 border-gray-200 p-6 text-center hover:border-[#5a0a8f] hover:shadow-md transition-all"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-purple-600 text-2xl">person_add</span>
            </div>
            <div className="text-sm font-semibold text-gray-900">Add Player</div>
          </Link>

          <Link
            to="/admin/tournaments/create"
            className="bg-white rounded-xl border-2 border-gray-200 p-6 text-center hover:border-[#5a0a8f] hover:shadow-md transition-all"
          >
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-orange-600 text-2xl">add_circle</span>
            </div>
            <div className="text-sm font-semibold text-gray-900">Create Tournament</div>
          </Link>

          <button
            onClick={() => setIsScoreModalOpen(true)}
            className="bg-white rounded-xl border-2 border-gray-200 p-6 text-center hover:border-[#5a0a8f] hover:shadow-md transition-all cursor-pointer"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-blue-600 text-2xl">scoreboard</span>
            </div>
            <div className="text-sm font-semibold text-gray-900">Update Points</div>
          </button>
        </div>
      </div>

      <UpdateScoreModal isOpen={isScoreModalOpen} onClose={() => setIsScoreModalOpen(false)} />


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Pending Registrations */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Recent Pending Registrations</h2>
            <Link
              to="/admin/players"
              className="text-sm text-[#5a0a8f] hover:underline font-medium whitespace-nowrap"
            >
              View All
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                    Player Name
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                    District
                  </th>
                  <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                    Category
                  </th>
                  <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                    Date
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentPendingPlayers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 sm:px-6 py-8 text-center text-gray-500 whitespace-normal">
                      No pending player registrations.
                    </td>
                  </tr>
                ) : (
                  recentPendingPlayers.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={r.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.fullName)}&background=5a0a8f&color=fff`}
                            alt={r.fullName}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <div className="font-semibold text-gray-900">{r.fullName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm text-gray-600">{districtName(r.district)}</td>
                      <td className="hidden sm:table-cell px-6 py-4">
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded">
                          {r.category || '—'}
                        </span>
                      </td>
                      <td className="hidden sm:table-cell px-6 py-4 text-sm text-gray-600">
                        {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <Link to="/admin/players" className="text-red-600 hover:underline text-sm font-medium">
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column - Live Tournament & Activity */}
        <div className="space-y-6">
          {/* Live Tournament */}
          <div className="bg-gradient-to-br from-[#5a0a8f] to-[#7c3aed] rounded-xl p-6 text-white">
            <h3 className="text-lg font-bold mb-4">Live Tournament</h3>
            <div className="mb-4">
              <div className="text-xl font-black mb-2">NATIONAL CHAMPIONSHIP 2023</div>
              <div className="text-sm text-white/80 mb-4">Karnataka vs Manipur</div>
              <div className="flex items-center gap-4 text-2xl font-black mb-2">
                <span>21</span>
                <span className="text-white/50">:</span>
                <span>19</span>
              </div>
              <div className="text-sm text-red-300 font-bold">LIVE - Set 2</div>
            </div>
            <Link
              to="/admin/tournaments"
              className="inline-block w-full text-center bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              View Match Details
            </Link>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-900">New Coach Registration</div>
                  <div className="text-xs text-gray-600">
                    Amit Kumar registered as Head Coach for Haryana. <span className="text-gray-400">2 mins ago</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-900">District Profile Updated</div>
                  <div className="text-xs text-gray-600">
                    Maharashtra District Association updated contact details.{' '}
                    <span className="text-gray-400">1 hour ago</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-900">Tournament Schedule Published</div>
                  <div className="text-xs text-gray-600">
                    Fixture list for "North Zone Cup" has been released.{' '}
                    <span className="text-gray-400">Yesterday</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Referee & Coach Certificates */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[{ title: 'Referee Certificates', data: refereeCertificates, accentClass: 'text-blue-500' }, { title: 'Coach Certificates', data: coachCertificates, accentClass: 'text-green-500' }].map(({ title, data, accentClass }) => (
          <div key={title} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                <p className="text-xs text-gray-500">Latest generated certificates</p>
              </div>
              <span className={`material-symbols-outlined text-2xl ${accentClass}`}>workspace_premium</span>
            </div>

            {loadingCertificates ? (
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" aria-hidden></div>
                <span>Loading certificates...</span>
              </div>
            ) : data.length === 0 ? (
              <div className="text-sm text-gray-500">No certificates found.</div>
            ) : (
              <div className="space-y-3">
                {data.map((cert) => (
                  <div key={cert._id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                    <div className="flex items-center gap-3">
                      <img
                        src={cert.participant?.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(cert.participant?.fullName || 'N A')}&background=random`}
                        alt={cert.participant?.fullName || 'Participant'}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <div className="font-semibold text-gray-900">{cert.participant?.fullName || 'Unknown'}</div>
                        <div className="text-xs text-gray-500">Serial #{cert.serialNumber}</div>
                        <div className="text-xs text-gray-500">{cert.tournament?.title || 'Tournament'}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownload(cert._id, `Cert_${cert.serialNumber}.png`)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">download</span>
                      Download
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div >
  )
}
