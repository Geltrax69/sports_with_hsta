import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { apiRequest } from '../../lib/api'
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

export function PlayerDashboard() {
  const { user } = useAuth()

  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [myRegistrations, setMyRegistrations] = useState<MyTournamentRegistration[]>([])
  const [loadingTournaments, setLoadingTournaments] = useState(true)
  const [loadingRegs, setLoadingRegs] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [myCertificates, setMyCertificates] = useState<any[]>([])
  const [loadingCerts, setLoadingCerts] = useState(true)
  const [myMatches, setMyMatches] = useState<any[]>([])
  const [loadingMatches, setLoadingMatches] = useState(true)
  const [showIdCard, setShowIdCard] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      setLoadingProfile(true)
      try {
        const [t, p, c, m] = await Promise.all([
          apiRequest<{ tournaments: Tournament[] }>('/tournaments'),
          apiRequest<{ profile: any }>('/players/me', { auth: true }),
          apiRequest<{ certificates: any[] }>('/certificates/me', { auth: true }),
          apiRequest<{ matches: any[] }>('/tournaments/matches/me', { auth: true })
        ])

        if (cancelled) return
        setTournaments(Array.isArray(t.tournaments) ? t.tournaments : [])
        setProfile(p.profile)
        setMyCertificates(Array.isArray(c.certificates) ? c.certificates : [])
        setMyMatches(Array.isArray(m.matches) ? m.matches : [])
      } catch (e) {
        if (cancelled) return
        setError(e instanceof Error ? e.message : 'Failed to load dashboard data')
      } finally {
        if (!cancelled) {
          setLoadingTournaments(false)
          setLoadingProfile(false)
          setLoadingCerts(false)
          setLoadingMatches(false)
        }
      }

      if (!cancelled) {
        await refreshMyRegistrations()
      }
    }

    void run()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const availableTournaments = useMemo(() => {
    return tournaments.filter((t) => t.status !== 'COMPLETED' && t.status !== 'TENTATIVE')
  }, [tournaments])

  const myRegsByTournament = useMemo(() => {
    const m = new Map<string, MyTournamentRegistration[]>()
    for (const r of myRegistrations) {
      const key = String(r.tournamentId)
      m.set(key, [...(m.get(key) || []), r])
    }
    return m
  }, [myRegistrations])

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

  const register = async (tournamentId: string, registerAs: 'player' | 'coach' | 'referee') => {
    setError(null)
    try {
      await apiRequest(`/tournaments/${tournamentId}/registrations`, {
        method: 'POST',
        auth: true,
        body: JSON.stringify({ registerAs }),
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

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">
            Welcome back, {user?.name || 'Player'}
          </h1>
          <p className="text-gray-600">Here’s what’s happening with your profile today.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowIdCard(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 font-semibold hover:bg-gray-50 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">badge</span>
            Player ID
          </button>
          <Link
            to="/events"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#5a0a8f] text-white font-semibold hover:bg-[#400466] transition-colors"
          >
            <span className="material-symbols-outlined text-lg">event_available</span>
            Register for Event
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-medium text-gray-600">District Games</div>
              <div className="text-3xl font-black text-gray-900 mt-2">{profile?.districtGames || '0'}</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#5a0a8f]/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#5a0a8f]">location_on</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-medium text-gray-600">State Games</div>
              <div className="text-3xl font-black text-gray-900 mt-2">{profile?.stateGames || '0'}</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-green-600">flag</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-medium text-gray-600">National Games</div>
              <div className="text-3xl font-black text-gray-900 mt-2">{profile?.nationalGames || '0'}</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-yellow-700">stars</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-medium text-gray-600">International Games</div>
              <div className="text-3xl font-black text-gray-900 mt-2">{profile?.internationalGames || '0'}</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-blue-600">public</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Results */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Recent Results</h2>
          <Link to="/player/results" className="text-sm font-semibold text-[#5a0a8f] hover:underline">
            View all
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Matches Section */}
          {(loadingMatches || loadingCerts) && (
            <div className="md:col-span-3 py-8 flex flex-col items-center justify-center text-gray-400">
              <div className="w-5 h-5 border-2 border-[#5a0a8f] border-t-transparent rounded-full animate-spin mb-2"></div>
              <p className="text-[10px] font-bold uppercase tracking-widest">Loading Results...</p>
            </div>
          )}

          {!loadingMatches && !loadingCerts && myMatches.slice(0, 3).map((match) => (
            <div key={match._id} className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black text-[#5a0a8f] uppercase tracking-wider">{match.tournament?.title || 'MATCH'}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${match.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                  {match.status.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 text-center">
                  <div className="text-xs font-bold text-gray-900 truncate">{match.team1}</div>
                  <div className="text-lg font-black text-gray-900">{match.score?.team1 || 0}</div>
                </div>
                <div className="text-[10px] font-bold text-gray-400">VS</div>
                <div className="flex-1 text-center">
                  <div className="text-xs font-bold text-gray-900 truncate">{match.team2}</div>
                  <div className="text-lg font-black text-gray-900">{match.score?.team2 || 0}</div>
                </div>
              </div>
            </div>
          ))}

          {/* Certificates (Ranks) Section */}
          {myCertificates.length > 0 ? (
            myCertificates.slice(0, 2).map((cert) => (
              <div key={cert._id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-yellow-600">emoji_events</span>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">{cert.tournament?.title || 'Championship'}</div>
                    <div className="text-xs font-medium text-purple-700">{cert.position === 'Participation' ? 'Participation' : `Rank: ${cert.position}`}</div>
                  </div>
                </div>
                <a
                  href={cert.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-[#5a0a8f] hover:bg-purple-50 rounded-lg transition-colors"
                  title="Download Certificate"
                >
                  <span className="material-symbols-outlined">download</span>
                </a>
              </div>
            ))
          ) : null}

          {myMatches.length === 0 && myCertificates.length === 0 && (
            <div className="md:col-span-3 bg-gray-50 rounded-xl border border-dashed border-gray-300 p-6 text-center text-gray-500 italic">
              No recent results available. Complete tournament matches to see your results.
            </div>
          )}
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-6">
        {/* Upcoming tournaments */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Upcoming Tournaments</h2>
            <Link to="/events" className="text-sm font-semibold text-[#5a0a8f] hover:underline">
              View all
            </Link>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {error && (
              <div className="p-4 border-b border-gray-200 bg-red-50 text-red-700">{error}</div>
            )}

            {(loadingTournaments || loadingRegs || loadingProfile) && (
              <div className="p-10 flex flex-col items-center justify-center text-gray-500">
                <div className="w-8 h-8 border-4 border-[#5a0a8f] border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="font-medium">Loading your dashboard...</p>
              </div>
            )}

            {!loadingTournaments && !loadingRegs && !loadingProfile && availableTournaments.length === 0 && (
              <div className="p-5 text-gray-600">No tournaments available.</div>
            )}

            {!loadingTournaments &&
              !loadingRegs &&
              availableTournaments.map((t, idx) => {
                const regs = myRegsByTournament.get(t._id) || []
                const playerReg = regs.find((r) => r.registerAs === 'player')

                const location = [t.venueName, t.city].filter(Boolean).join(', ') || '—'

                const badge = (status?: string) => {
                  if (status === 'approved') return 'bg-green-100 text-green-700'
                  if (status === 'rejected') return 'bg-red-100 text-red-700'
                  if (status === 'pending') return 'bg-yellow-100 text-yellow-700'
                  return 'bg-gray-100 text-gray-700'
                }

                return (
                  <div
                    key={t._id}
                    className={`p-5 ${idx !== tournaments.length - 1 ? 'border-b border-gray-200' : ''}`}
                  >
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Tournament Image - Larger on mobile */}
                      <div className="w-full md:w-24 h-40 md:h-16 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                        <TournamentThumb url={t.imageUrl} title={t.title} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="font-bold text-gray-900 line-clamp-2 md:line-clamp-1">{t.title}</div>
                          <div className="flex gap-1 flex-shrink-0">
                            {t.status && (
                              <span className={`px-2 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${t.status === 'COMPLETED'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-gray-100 text-gray-700'
                                }`}>
                                {t.status}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-3">
                          {t.genderCategory && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">
                              {t.genderCategory === 'both'
                                ? 'Male & Female'
                                : t.genderCategory === 'male'
                                  ? 'Male'
                                  : 'Female'}
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <span className="material-symbols-outlined text-sm text-gray-400">calendar_today</span>
                            <span className="font-medium">{formatDateRange(t.startDate, t.endDate)}</span>
                          </div>
                          <div className="flex items-start gap-2 text-xs text-gray-600">
                            <span className="material-symbols-outlined text-sm text-gray-400 mt-0.5">location_on</span>
                            <span className="font-medium line-clamp-2">{location}</span>
                          </div>
                        </div>

                        {playerReg && (
                          <div className="mt-3">
                            <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${badge(playerReg.status)}`}>
                              {playerReg.status}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-end md:justify-center flex-shrink-0">
                        {!playerReg && (
                          t.status === 'COMPLETED' ? (
                            <button
                              disabled
                              className="w-full md:w-auto px-6 py-2.5 rounded-xl bg-gray-100 text-gray-400 text-xs font-bold cursor-not-allowed"
                            >
                              Tournament Completed
                            </button>
                          ) : (
                            <button
                              onClick={() => void register(t._id, 'player')}
                              className="w-full md:w-auto px-6 py-2.5 rounded-xl bg-[#5a0a8f] text-white text-xs font-bold hover:bg-[#400466] transition-all shadow-md shadow-purple-900/10 active:scale-95"
                            >
                              Register as Player
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      </div>

      {/* Certificates */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">My Certificates</h2>
          <Link to="/player/certificates" className="text-sm font-semibold text-[#5a0a8f] hover:underline">
            Manage
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loadingCerts && (
            <div className="md:col-span-4 py-12 flex flex-col items-center justify-center text-gray-500">
              <div className="w-6 h-6 border-2 border-[#5a0a8f] border-t-transparent rounded-full animate-spin mb-2"></div>
              <p className="text-xs">Loading certificates...</p>
            </div>
          )}

          {!loadingCerts && myCertificates.map((cert) => (
            <div key={cert._id} className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col">
              <div className="w-full h-32 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden mb-4 relative group">
                <img src={cert.fileUrl} alt="Certificate" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white font-bold text-xs">VIEW</span>
                </div>
              </div>
              <div className="flex-1">
                <div className="text-[10px] font-black tracking-wider text-[#5a0a8f] uppercase mb-1">
                  {cert.position === 'Participation' ? 'PARTICIPATION' : 'ACHIEVEMENT'}
                </div>
                <div className="text-sm font-bold text-gray-900 truncate">{cert.tournament?.title || 'Tournament'}</div>
                <div className="text-xs text-gray-500 mt-0.5">{cert.position}</div>
              </div>
              <a
                href={cert.fileUrl}
                download
                className="mt-4 w-full py-2 rounded-lg border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                Download
              </a>
            </div>
          ))}

          {!loadingCerts && myCertificates.length === 0 && (
            <div className="md:col-span-4 bg-gray-50 rounded-xl border border-dashed border-gray-300 p-12 text-center">
              <span className="material-symbols-outlined text-4xl text-gray-300 mb-3">workspace_premium</span>
              <p className="text-gray-500 text-sm">You haven't earned any certificates yet.</p>
            </div>
          )}

          <button
            type="button"
            className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-6 hover:border-[#5a0a8f] transition-colors flex flex-col items-center justify-center min-h-[220px]"
          >
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-gray-500">add</span>
            </div>
            <div className="text-sm font-semibold text-gray-700">Upload New</div>
            <div className="text-[10px] text-gray-400 mt-1 uppercase">External Certificates</div>
          </button>
        </div>
      </div>

      {showIdCard && (
        <PlayerIDCard profile={profile} onClose={() => setShowIdCard(false)} />
      )}
    </div>
  )
}
