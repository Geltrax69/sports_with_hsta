import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiRequest } from '../lib/api'

type Tournament = {
  _id: string
  title: string
  tournamentType?: string
  description?: string
  startDate?: string
  endDate?: string
  registrationOpens?: string
  registrationCloses?: string
  venueName?: string
  city?: string
  pincode?: string
  genderCategory?: 'male' | 'female' | 'both'
  imageUrl?: string
  status?: string
}

type MyTournamentRegistration = {
  _id: string
  tournamentId: string
  registerAs: 'player' | 'coach' | 'referee'
  category?: string
  status: string
  appliedAt?: string
}

type Match = {
  _id?: string
  team1: string
  team2: string
  date: string
  time: string
  bracket?: 'winner' | 'loser'
  description?: string
}

export function TournamentApplication() {
  const { tournamentId } = useParams<{ tournamentId: string }>()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const publicHref = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`

  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [myRegs, setMyRegs] = useState<MyTournamentRegistration[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showWelcome, setShowWelcome] = useState(true)

  const [registrationType, setRegistrationType] = useState<'player' | 'coach' | 'referee'>('player')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!tournamentId) return
    let cancelled = false

    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const t = await apiRequest<{ tournament: Tournament }>(`/tournaments/${tournamentId}`)
        if (cancelled) return
        setTournament(t.tournament)

        // Fetch matches if tournament registration is closed
        if (t.tournament.status === 'REGISTRATION CLOSED' || t.tournament.status === 'REGISTRATION_CLOSED') {
          try {
            const m = await apiRequest<{ matches: Match[] }>(
              `/tournaments/${tournamentId}/matches`,
            )
            if (!cancelled) {
              setMatches(Array.isArray(m.matches) ? m.matches : [])
            }
          } catch (e) {
            console.log('Could not load matches:', e)
            setMatches([])
          }
        }
      } catch (e) {
        if (cancelled) return
        setError(e instanceof Error ? e.message : 'Failed to load tournament')
        setTournament(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [tournamentId])

  useEffect(() => {
    if (!isAuthenticated) {
      setMyRegs([])
      return
    }
    let cancelled = false

    const run = async () => {
      try {
        const r = await apiRequest<{ registrations: MyTournamentRegistration[] }>(
          '/tournaments/registrations/me',
          { auth: true },
        )
        if (cancelled) return
        setMyRegs(r.registrations || [])
      } catch {
        if (cancelled) return
        setMyRegs([])
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [isAuthenticated])

  // Available categories based on registration type
  const availableCategories = useMemo(() => {
    if (registrationType === 'player') {
      return ['Men Regu', 'Women Regu', 'Men Team', 'Women Team', 'Mixed Doubles', 'Men U19', 'Women U19', 'Men U17', 'Women U17']
    } else if (registrationType === 'coach') {
      return ['Head Coach', 'Assistant Coach', 'Team Manager']
    } else if (registrationType === 'referee') {
      return ['Main Referee', 'Assistant Referee', 'Line Judge', 'Technical Official']
    }
    return []
  }, [registrationType])

  const alreadyApplied = useMemo(() => {
    if (!tournamentId) return false
    return myRegs.some(
      (r) => String(r.tournamentId) === String(tournamentId) && r.registerAs === registrationType,
    )
  }, [myRegs, registrationType, tournamentId])

  const existingRegStatus = useMemo(() => {
    if (!tournamentId) return null
    const match = myRegs.find(
      (r) => String(r.tournamentId) === String(tournamentId) && r.registerAs === registrationType,
    )
    return match ? match.status : null
  }, [myRegs, registrationType, tournamentId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!tournamentId) return

    if (!user) {
      window.location.assign(publicHref('/login'))
      return
    }

    if (!selectedCategory) {
      alert('Please fill in all required fields')
      return
    }

    if (alreadyApplied) {
      alert('You have already applied for this tournament with this role.')
      return
    }

    setSubmitting(true)
    void apiRequest(`/tournaments/${tournamentId}/registrations`, {
      method: 'POST',
      auth: true,
      body: JSON.stringify({ registerAs: registrationType, category: selectedCategory }),
    })
      .then(() => {
        alert('Application submitted successfully! It will be reviewed by the admin.')
        navigate('/player/dashboard')
      })
      .catch((err) => {
        alert(err instanceof Error ? err.message : 'Error submitting application. Please try again.')
      })
      .finally(() => setSubmitting(false))
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 py-8 md:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-gray-600">Loading…</p>
        </div>
      </main>
    )
  }

  if (!tournament) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 py-8 md:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Tournament Not Found</h1>
          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
          <a href={publicHref('/events')} className="text-[#5a0a8f] hover:underline">
            Back to Events
          </a>
        </div>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 py-8 md:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center">
            <div className="mb-6">
              <span className="inline-block p-4 bg-purple-100 rounded-full mb-4">
                <span className="material-symbols-outlined text-5xl text-purple-600">how_to_reg</span>
              </span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Apply for Tournament</h1>
            
            <div className="space-y-4 mb-10 text-left">
              <div className="flex gap-4 items-start p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex-shrink-0 w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-lg">1</div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-1">Register</h3>
                  <p className="text-gray-600">Create your account first</p>
                </div>
              </div>

              <div className="flex gap-4 items-start p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">2</div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-1">Login</h3>
                  <p className="text-gray-600">Sign in with your credentials</p>
                </div>
              </div>

              <div className="flex gap-4 items-start p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex-shrink-0 w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-lg">3</div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-1">Apply for Tournament</h3>
                  <p className="text-gray-600">Come back and apply for this tournament</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={publicHref('/register')}
                className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors inline-flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">person_add</span>
                Register Now
              </a>
              <a
                href={publicHref('/login')}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors inline-flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">login</span>
                Login
              </a>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 py-8 md:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Welcome Screen */}
        {showWelcome && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center mb-8">
            <div className="mb-6">
              <span className="inline-block p-4 bg-purple-100 rounded-full mb-4">
                <span className="material-symbols-outlined text-5xl text-purple-600">how_to_reg</span>
              </span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Apply for Tournament</h1>
            <p className="text-gray-600 mb-6">{tournament?.title}</p>
            
            <div className="space-y-4 mb-10 text-left">
              <div className="flex gap-4 items-start p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex-shrink-0 w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-lg">1</div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-1">Register</h3>
                  <p className="text-gray-600">Create your account first</p>
                </div>
              </div>

              <div className="flex gap-4 items-start p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">2</div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-1">Login</h3>
                  <p className="text-gray-600">Sign in with your credentials</p>
                </div>
              </div>

              <div className="flex gap-4 items-start p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex-shrink-0 w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-lg">3</div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-1">Apply for Tournament</h3>
                  <p className="text-gray-600">Come back and apply for this tournament</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setShowWelcome(false)}
                className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors inline-flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">arrow_forward</span>
                Continue to Application
              </button>
              <a
                href={publicHref('/events')}
                className="px-8 py-3 bg-white border-2 border-gray-300 hover:bg-gray-50 text-gray-700 font-bold rounded-lg transition-colors inline-flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">arrow_back</span>
                Back to Tournaments
              </a>
            </div>
          </div>
        )}

        {/* Application Form */}
        {!showWelcome && (
          <>
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-[#5a0a8f] mb-2">Apply to Tournament</h1>
          <p className="text-lg text-[#5a0a8f]/70">Submit your application to participate in this tournament.</p>
        </div>

        {/* Tournament Info Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{tournament.title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">Date</div>
              <div className="font-semibold text-gray-900">
                {tournament.startDate ? new Date(tournament.startDate).toLocaleDateString() : '—'}
                {tournament.endDate ? ` - ${new Date(tournament.endDate).toLocaleDateString()}` : ''}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Location</div>
              <div className="font-semibold text-gray-900">
                {[tournament.venueName, tournament.city].filter(Boolean).join(', ') || '—'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Status</div>
              <div className="font-semibold text-gray-900">{tournament.status || '—'}</div>
            </div>
          </div>
        </div>

        {/* Application Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Registration Type Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                I want to register as <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setRegistrationType('player')
                    setSelectedCategory('')
                  }}
                  className={`p-4 rounded-lg border-2 transition-all ${registrationType === 'player'
                    ? 'border-[#5a0a8f] bg-purple-50'
                    : 'border-gray-300 hover:border-gray-400'
                    }`}
                >
                  <span className="material-symbols-outlined text-3xl mb-2 block text-center">
                    directions_run
                  </span>
                  <div className="font-semibold text-gray-900 text-center">Player</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRegistrationType('coach')
                    setSelectedCategory('')
                  }}
                  className={`p-4 rounded-lg border-2 transition-all ${registrationType === 'coach'
                    ? 'border-[#5a0a8f] bg-purple-50'
                    : 'border-gray-300 hover:border-gray-400'
                    }`}
                >
                  <span className="material-symbols-outlined text-3xl mb-2 block text-center">
                    sports_volleyball
                  </span>
                  <div className="font-semibold text-gray-900 text-center">Coach</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRegistrationType('referee')
                    setSelectedCategory('')
                  }}
                  className={`p-4 rounded-lg border-2 transition-all ${registrationType === 'referee'
                    ? 'border-[#5a0a8f] bg-purple-50'
                    : 'border-gray-300 hover:border-gray-400'
                    }`}
                >
                  <span className="material-symbols-outlined text-3xl mb-2 block text-center">
                    gavel
                  </span>
                  <div className="font-semibold text-gray-900 text-center">Referee</div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Select {registrationType === 'player' ? 'Category' : registrationType === 'coach' ? 'Role' : 'Position'} <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                required
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none text-gray-900 bg-white"
              >
                <option value="">-- Select {registrationType === 'player' ? 'Category' : registrationType === 'coach' ? 'Role' : 'Position'} --</option>
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {alreadyApplied && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <span className="material-symbols-outlined text-yellow-600">info</span>
                  <div>
                    <h3 className="font-bold text-yellow-900 mb-1">Already Applied</h3>
                    <p className="text-sm text-yellow-800">
                      You have already submitted an application for this tournament. Status: {existingRegStatus || 'Pending'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!!tournament.status && tournament.status !== 'REGISTRATION OPEN' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <span className="material-symbols-outlined text-red-600">error</span>
                  <div>
                    <h3 className="font-bold text-red-900 mb-1">Registration Not Open</h3>
                    <p className="text-sm text-red-800">
                      This tournament is not currently accepting applications. Status: {tournament.status}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
              <a
                href={publicHref('/events')}
                className="px-5 py-2.5 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium"
              >
                Cancel
              </a>
              <button
                type="submit"
                disabled={
                  submitting ||
                  alreadyApplied ||
                  (!!tournament.status && tournament.status !== 'REGISTRATION OPEN') ||
                  !selectedCategory
                }
                className="px-6 py-2.5 bg-[#5a0a8f] hover:bg-[#400466] disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-bold transition-colors"
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        </div>

        {/* Match Schedule Section - Show if registration is closed and matches exist */}
        {(tournament.status === 'REGISTRATION CLOSED' || tournament.status === 'REGISTRATION_CLOSED') && matches.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 md:p-8 mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">📅 Match Schedule</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">Round</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">Match #</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">Team 1</th>
                    <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wide text-gray-700">VS</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">Team 2</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">Bracket Type</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {matches.map((match, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {/* Calculate round based on match description or bracket type */}
                        {idx < 4 ? 1 : idx < 6 ? 2 : idx < 7 ? 3 : idx < 8 ? 4 : 5}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {idx + 1}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">{match.team1}</td>
                      <td className="px-6 py-4 text-center font-bold text-purple-600">VS</td>
                      <td className="px-6 py-4 font-semibold text-gray-900">{match.team2}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full font-medium text-sm ${
                          match.bracket === 'winner' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {match.bracket === 'winner' ? '🏆 Winner' : '🔻 Loser'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{match.description || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
          </>
        )}
      </div>
    </main>
  )
}
