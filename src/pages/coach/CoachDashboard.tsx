import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { apiRequest, API_BASE_URL } from '../../lib/api'
import { PlayerIDCard } from '../../components/player/PlayerIDCard'

type Tournament = {
  _id: string
  title: string
  startDate?: string
  endDate?: string
  venueName?: string
  city?: string
  status?: string
  genderCategory?: 'male' | 'female' | 'both'
  imageUrl?: string
}

type MyTournamentRegistration = {
  _id: string
  tournamentId: string
  registerAs: 'player' | 'coach' | 'referee'
  status: 'pending' | 'approved' | 'rejected'
  appliedAt: string
  reviewedAt?: string
  reviewedBy?: string
  notes?: string
}

type CoachProfile = {
  _id: string
  fullName: string
  email?: string
  phone?: string
  district?: string
  coachId?: string
  profilePhoto?: string
  profilePhotoKey?: string
  status?: string
  fatherName?: string
  dateOfBirth?: string
  gender?: string
  category?: string
}

export function CoachDashboard() {
  const { user } = useAuth()

  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [myRegistrations, setMyRegistrations] = useState<MyTournamentRegistration[]>([])
  const [loadingTournaments, setLoadingTournaments] = useState(true)
  const [loadingRegs, setLoadingRegs] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [certificates, setCertificates] = useState<any[]>([])
  const [loadingCertificates, setLoadingCertificates] = useState(false)
  const [coachProfile, setCoachProfile] = useState<CoachProfile | null>(null)
  const [showIdCard, setShowIdCard] = useState(false)

  const identityProfile = useMemo(() => {
    const base = coachProfile || (user?.name ? { fullName: user.name, _id: user.id || 'pending' } : null)
    if (!base) return null
    return {
      ...base,
      role: 'Coach',
      playerId: coachProfile?.coachId || coachProfile?._id || user?.id || 'PENDING',
      fullName: base.fullName,
      fatherName: coachProfile?.fatherName || base.fatherName,
      phone: coachProfile?.phone || base.phone,
      dateOfBirth: coachProfile?.dateOfBirth || (base as any).dateOfBirth,
      gender: coachProfile?.gender || (base as any).gender,
      category: coachProfile?.category || (base as any).category,
      district: coachProfile?.district || (base as any).district,
    }
  }, [coachProfile, user])

  const refreshMyRegistrations = async () => {
    setLoadingRegs(true)
    try {
      const r = await apiRequest<{ registrations: MyTournamentRegistration[] }>(
        '/tournaments/registrations/me',
        { auth: true },
      )
      setMyRegistrations(Array.isArray(r.registrations) ? r.registrations : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load your tournament registrations')
    } finally {
      setLoadingRegs(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setError(null)
      setLoadingTournaments(true)
      try {
        const t = await apiRequest<{ tournaments: Tournament[] }>('/tournaments')
        if (cancelled) return
        setTournaments(Array.isArray(t.tournaments) ? t.tournaments : [])
      } catch (e) {
        if (cancelled) return
        setError(e instanceof Error ? e.message : 'Failed to load tournaments')
      } finally {
        if (!cancelled) setLoadingTournaments(false)
      }

      if (!cancelled) {
        await refreshMyRegistrations()
      }

      if (!cancelled) {
        setLoadingCertificates(true)
        try {
          const c = await apiRequest<{ certificates: any[] }>('/certificates/me', { auth: true })
          if (!cancelled) setCertificates(Array.isArray(c.certificates) ? c.certificates : [])
        } catch (e) {
          if (!cancelled) setCertificates([])
        } finally {
          if (!cancelled) setLoadingCertificates(false)
        }
      }

      if (!cancelled) {
        try {
          const resp = await apiRequest<{ profile: CoachProfile }>('/coaches/me', { auth: true })
          if (!cancelled) setCoachProfile(resp.profile || null)
        } catch (e) {
          if (!cancelled) setCoachProfile(null)
          if (!cancelled && !error) {
            setError((prev) => prev || (e instanceof Error ? e.message : 'Could not load coach ID'))
          }
        }
      }
    }

    void run()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const myRegsByTournament = useMemo(() => {
    const m = new Map<string, MyTournamentRegistration[]>()
    for (const r of myRegistrations) {
      const key = String(r.tournamentId)
      m.set(key, [...(m.get(key) || []), r])
    }
    return m
  }, [myRegistrations])

  const availableTournaments = useMemo(() => {
    return tournaments.filter((t) => t.status !== 'COMPLETED' && t.status !== 'TENTATIVE')
  }, [tournaments])

  const formatDateRange = (start?: string, end?: string) => {
    if (!start && !end) return '—'
    try {
      const s = start ? new Date(start) : null
      const e = end ? new Date(end) : null
      if (s && e) return `${s.toLocaleDateString()} - ${e.toLocaleDateString()}`
      if (s) return s.toLocaleDateString()
      if (e) return e.toLocaleDateString()
      return '—'
    } catch {
      return '—'
    }
  }

  const register = async (tournamentId: string) => {
    setError(null)
    try {
      await apiRequest(`/tournaments/${tournamentId}/registrations`, {
        method: 'POST',
        auth: true,
        body: JSON.stringify({ registerAs: 'coach' }),
      })
      await refreshMyRegistrations()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to register')
    }
  }

  const TournamentThumb = ({ url, title }: { url?: string; title: string }) => {
    const [failed, setFailed] = useState(false)

    if (!url || failed) {
      return <span className="material-symbols-outlined text-gray-400">image</span>
    }

    return (
      <img
        src={url}
        alt={title}
        className="w-full h-full object-cover"
        onError={() => setFailed(true)}
      />
    )
  }

  const coachRegistrations = myRegistrations.filter((r) => r.registerAs === 'coach')
  const approvedCount = coachRegistrations.filter((r) => r.status === 'approved').length
  const pendingCount = coachRegistrations.filter((r) => r.status === 'pending').length

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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">
            Welcome back, Coach {user?.name || ''}
          </h1>
          <p className="text-gray-600">Manage your team and tournament registrations.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowIdCard(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 font-semibold hover:bg-gray-50 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">badge</span>
            Coach ID
          </button>
          <Link
            to="/coach/tournaments"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#5a0a8f] text-white font-semibold hover:bg-[#400466] transition-colors"
          >
            <span className="material-symbols-outlined text-lg">event_available</span>
            View All Tournaments
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-medium text-gray-600">Tournaments Registered</div>
              <div className="text-3xl font-black text-gray-900 mt-2">{coachRegistrations.length}</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#5a0a8f]/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#5a0a8f]">emoji_events</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-medium text-gray-600">Approved Registrations</div>
              <div className="text-3xl font-black text-gray-900 mt-2">{approvedCount}</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-green-600">check_circle</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-medium text-gray-600">Pending Approvals</div>
              <div className="text-3xl font-black text-gray-900 mt-2">{pendingCount}</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-yellow-700">hourglass_empty</span>
            </div>
          </div>
        </div>

      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Available Tournaments */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-gray-900">Available Tournaments</h2>
            <p className="text-sm text-gray-600 mt-1">Register as a coach for upcoming events</p>
          </div>
          <Link
            to="/coach/tournaments"
            className="text-[#5a0a8f] font-semibold text-sm hover:underline"
          >
            View All →
          </Link>
        </div>

        {loadingTournaments ? (
          <div className="p-8 text-center text-gray-500">Loading tournaments...</div>
        ) : availableTournaments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No tournaments available at the moment.</div>
        ) : (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableTournaments.slice(0, 6).map((t) => {
              const myRegs = myRegsByTournament.get(String(t._id)) || []
              const coachReg = myRegs.find((r) => r.registerAs === 'coach')

              return (
                <div
                  key={t._id}
                  className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="h-32 bg-gray-100 flex items-center justify-center overflow-hidden">
                    <TournamentThumb url={t.imageUrl} title={t.title} />
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{t.title}</h3>
                    <div className="text-xs text-gray-500 space-y-1 mb-3">
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">calendar_month</span>
                        {formatDateRange(t.startDate, t.endDate)}
                      </div>
                      {t.venueName && (
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">location_on</span>
                          {t.venueName}, {t.city}
                        </div>
                      )}
                    </div>

                    {coachReg ? (
                      <div
                        className={`w-full px-3 py-2 rounded text-xs font-bold text-center ${coachReg.status === 'approved'
                            ? 'bg-green-100 text-green-700'
                            : coachReg.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                      >
                        {coachReg.status === 'approved'
                          ? '✓ Registered as Coach'
                          : coachReg.status === 'pending'
                            ? '⏳ Pending Approval'
                            : '✗ Registration Rejected'}
                      </div>
                    ) : (
                      <button
                        onClick={() => register(t._id)}
                        disabled={loadingRegs}
                        className="w-full px-3 py-2 bg-[#5a0a8f] text-white rounded text-sm font-semibold hover:bg-[#400466] transition-colors disabled:opacity-50"
                      >
                        Register as Coach
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Certificates */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-gray-900">My Certificates</h2>
            <p className="text-sm text-gray-600 mt-1">View and download your coaching certificates</p>
          </div>
          <Link to="/coach/certificates" className="text-[#5a0a8f] font-semibold text-sm hover:underline">
            View All →
          </Link>
        </div>

        {loadingCertificates ? (
          <div className="p-6 text-gray-500">Loading certificates...</div>
        ) : certificates.length === 0 ? (
          <div className="p-6 text-gray-500">No certificates found.</div>
        ) : (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {certificates.slice(0, 6).map((cert) => (
              <div key={cert._id} className="border border-gray-200 rounded-lg p-4 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                    <img
                      src={cert.fileUrl}
                      alt="Certificate"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Serial #{cert.serialNumber}</div>
                    <div className="text-xs text-gray-500">{cert.tournament?.title || 'Tournament'}</div>
                  </div>
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

      {/* My Registrations */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-black text-gray-900">My Tournament Registrations</h2>
          <p className="text-sm text-gray-600 mt-1">Track the status of your coaching applications</p>
        </div>

        {loadingRegs ? (
          <div className="p-8 text-center text-gray-500">Loading your registrations...</div>
        ) : coachRegistrations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            You haven't registered for any tournaments as a coach yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                    Tournament
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                    Applied On
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {coachRegistrations.map((reg) => {
                  const tournament = tournaments.find((t) => String(t._id) === String(reg.tournamentId))
                  return (
                    <tr key={reg._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">
                          {tournament?.title || 'Unknown Tournament'}
                        </div>
                        {tournament && (
                          <div className="text-xs text-gray-500">
                            {formatDateRange(tournament.startDate, tournament.endDate)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(reg.appliedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold ${reg.status === 'approved'
                              ? 'bg-green-100 text-green-700'
                              : reg.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                        >
                          {reg.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{reg.notes || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showIdCard && identityProfile && (
        <PlayerIDCard profile={identityProfile} onClose={() => setShowIdCard(false)} />
      )}
    </div>
  )
}
