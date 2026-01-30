import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWebsiteContent } from '../context/WebsiteContentContext'
import { useSiteContent } from '../content/SiteContentContext'
import { useAuth } from '../context/AuthContext'
import { ScoreCard } from '../components/ScoreCard'
import type { TournamentStatus } from '../content/types'
import { apiRequest } from '../lib/api'

type MatchResult = {
  id: string
  date: string
  tournament: string
  location: string
  winner: string
  actionType: 'scorecard' | 'squad'
}

type ScoreCardData = {
  tournamentName: string
  matchDate: string
  team1: string
  team2: string
  sets: Array<{ setNumber: number; team1Score: number; team2Score: number }>
  winner: string
  venue?: string
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

function statusBadgeClasses(status?: TournamentStatus) {
  if (status === 'REGISTRATION OPEN') return 'bg-green-100 text-green-700 border-green-200'
  if (status === 'CONFIRMED') return 'bg-blue-100 text-blue-700 border-blue-200'
  return 'bg-gray-100 text-gray-600 border-gray-200'
}

export function EventsPage() {
  const { content: websiteContent } = useWebsiteContent()
  const { content: siteContent } = useSiteContent()
  const { isAuthenticated } = useAuth()
  const [selectedScoreCard, setSelectedScoreCard] = useState<ScoreCardData | null>(null)
  const [isScoreCardOpen, setIsScoreCardOpen] = useState(false)
  const [selectedTournamentForDetails, setSelectedTournamentForDetails] = useState<string | null>(null)
  const [matchesForDetails, setMatchesForDetails] = useState<Match[]>([])
  const [loadingMatches, setLoadingMatches] = useState(false)

  const [tournaments, setTournaments] = useState<
    Array<{
      _id: string
      title: string
      tournamentType?: string
      startDate?: string
      endDate?: string
      venueName?: string
      city?: string
      status?: TournamentStatus
      imageUrl?: string
    }>
  >([])
  const [loadingTournaments, setLoadingTournaments] = useState(true)

  // Get featured tournaments or all tournaments, fallback to local content if API returns empty
  const displayedTournaments = useMemo(() => {
    // If API returned tournaments, use them
    if (tournaments.length > 0) {
      const list = tournaments.filter((t) => t.status !== 'TENTATIVE')
      const featured = (websiteContent.eventsPage.featuredEventIds || []).map(String)
      if (featured.length > 0) {
        const m = new Map(list.map((t) => [t._id, t]))
        return featured.map((id) => m.get(id)).filter((t): t is NonNullable<typeof t> => Boolean(t))
      }
      return list
    }
    // Fallback to local content - convert to API-compatible format
    return siteContent.tournaments
      .filter((t) => t.status !== 'TENTATIVE')
      .map((t) => ({
        _id: t.id,
        title: t.title,
        venueName: t.location,
        city: '',
        startDate: undefined,
        endDate: undefined,
        status: t.status,
        imageUrl: t.imageUrl,
        // Keep original fields for rendering
        location: t.location,
        month: t.month,
        day: t.day,
      }))
  }, [tournaments, websiteContent.eventsPage.featuredEventIds, siteContent.tournaments])

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setLoadingTournaments(true)
      try {
        const r = await apiRequest<{ tournaments: any[] }>('/tournaments')
        if (cancelled) return
        setTournaments(Array.isArray(r.tournaments) ? r.tournaments : [])
      } catch {
        if (cancelled) return
        setTournaments([])
      } finally {
        if (!cancelled) setLoadingTournaments(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [])

  const formatDateRange = (start?: string, end?: string, month?: string, day?: string) => {
    // Support local content format (month, day)
    if (month && day) return `${month} ${day}`
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

  const recentResults: MatchResult[] = [
    {
      id: '1',
      date: 'Sep 15, 2024',
      tournament: 'National Federation Cup',
      location: 'Goa',
      winner: 'Manipur',
      actionType: 'scorecard',
    },
    {
      id: '2',
      date: 'Aug 02, 2024',
      tournament: 'Asian Games Selection Trial',
      location: 'Bangalore SAI Center',
      winner: 'N/A',
      actionType: 'squad',
    },
    {
      id: '3',
      date: 'Jul 20, 2024',
      tournament: 'East Zone Championship',
      location: 'Patna, Bihar',
      winner: 'Assam',
      actionType: 'scorecard',
    },
  ]

  const handleViewScorecard = (result: MatchResult) => {
    if (result.actionType === 'scorecard') {
      // Mock scorecard data - in real app, this would come from API
      const scoreCardData: ScoreCardData = {
        tournamentName: result.tournament,
        matchDate: result.date,
        team1: result.winner,
        team2: result.winner === 'Manipur' ? 'Kerala' : 'West Bengal',
        sets: [
          { setNumber: 1, team1Score: 21, team2Score: 18 },
          { setNumber: 2, team1Score: 19, team2Score: 21 },
          { setNumber: 3, team1Score: 21, team2Score: 15 },
        ],
        winner: result.winner,
        venue: result.location,
      }
      setSelectedScoreCard(scoreCardData)
      setIsScoreCardOpen(true)
    } else {
      // Handle squad view
      alert('Squad view coming soon!')
    }
  }

  const handleViewDetails = async (tournamentId: string) => {
    setSelectedTournamentForDetails(tournamentId)
    setLoadingMatches(true)
    try {
      console.log('[handleViewDetails] Fetching matches for tournament:', tournamentId)
      const m = await apiRequest<{ matches: Match[] }>(
        `/tournaments/${tournamentId}/matches`,
      )
      console.log('[handleViewDetails] Matches received:', m.matches)
      setMatchesForDetails(Array.isArray(m.matches) ? m.matches : [])
    } catch (e) {
      console.log('Could not load matches:', e)
      setMatchesForDetails([])
    } finally {
      setLoadingMatches(false)
    }
  }

  return (
    <main id="page-content" className="flex-grow bg-white">
      {/* Hero Section */}
      <section className="relative bg-[#5a0a8f] text-white overflow-hidden py-20">
        <div className="absolute inset-0 bg-gradient-to-r from-[#5a0a8f]/95 via-[#5a0a8f]/90 to-transparent z-10"></div>
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-sm text-white/80 mb-4">
                <a className="hover:text-white transition-colors" href={import.meta.env.BASE_URL}>
                  Home
                </a>
                <span className="material-symbols-outlined text-xs">chevron_right</span>
                <span className="text-white font-medium">Events</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4">
                Tournaments & Events
              </h1>
              <p className="text-lg text-white/90 max-w-2xl">
                Official calendar of national championships, zonal tournaments, and selection trials. Stay updated with
                upcoming dates and venues.
              </p>
            </div>
            <div className="flex flex-col gap-6 border-t md:border-t-0 md:border-l border-white/20 pt-4 md:pt-0 md:pl-8">
              <div>
                <span className="block text-4xl font-bold text-white">12</span>
                <span className="text-xs text-white/80 uppercase tracking-wider font-semibold">UPCOMING</span>
              </div>
              <div>
                <span className="block text-4xl font-bold text-white">45</span>
                <span className="text-xs text-white/80 uppercase tracking-wider font-semibold">COMPLETED</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="bg-white border-b border-gray-200 shadow-sm -mt-1 relative z-30">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-lg">
                search
              </span>
              <input
                className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] w-full transition-all"
                placeholder="Search events..."
                type="text"
              />
            </div>
            <select className="py-2.5 pl-3 pr-8 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] cursor-pointer">
              <option>Year: 2026</option>
              <option>Year: 2025</option>
              <option>Year: 2024</option>
            </select>
            <select className="py-2.5 pl-3 pr-8 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] hidden sm:block cursor-pointer">
              <option value="">All Types</option>
              <option>National Championship</option>
              <option>Zonal</option>
              <option>Selection Trials</option>
              <option>Coaching Camp</option>
            </select>
            <select className="py-2.5 pl-3 pr-8 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] cursor-pointer">
              <option value="">Upcoming</option>
              <option>Ongoing</option>
              <option>Completed</option>
            </select>
          </div>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Upcoming Tournaments Section */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <span className="w-1 h-12 bg-[#5a0a8f]"></span>
                Upcoming Tournaments
              </h2>
              <div className="hidden sm:flex gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                  Registration Open
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
                  Confirmed
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
                  Tentative
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loadingTournaments ? (
                <div className="col-span-full text-center py-12 text-gray-500">Loading…</div>
              ) : displayedTournaments.length === 0 ? (
                <div className="col-span-full text-center py-12 text-gray-500">
                  No upcoming tournaments available. Check back later!
                </div>
              ) : (
                displayedTournaments.map((tournament) => (
                  <article
                    key={tournament._id}
                    className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden flex flex-col h-full"
                  >
                    <div className="relative h-48 overflow-hidden bg-gradient-to-br from-purple-600 to-purple-800">
                      {tournament.imageUrl && (
                        <div
                          className="absolute inset-0 bg-cover bg-center"
                          style={{ backgroundImage: `url('${tournament.imageUrl}')` }}
                        ></div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                      <div className="absolute top-4 right-4 z-10">
                        <span className={`text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm border ${tournament.status === 'REGISTRATION OPEN'
                          ? 'bg-green-500 border-green-400'
                          : tournament.status === 'CONFIRMED'
                            ? 'bg-blue-600 border-blue-500'
                            : 'bg-gray-500 border-gray-400'
                          }`}>
                          {tournament.status}
                        </span>
                      </div>
                      <div className="absolute bottom-0 left-0 p-4 text-white w-full">
                        <div className="bg-[#5a0a8f]/80 backdrop-blur-md px-3 py-1.5 rounded-md inline-block border border-white/30">
                          <span className="text-xs font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">calendar_month</span>
                            {formatDateRange(tournament.startDate, tournament.endDate, (tournament as any).month, (tournament as any).day)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-[#5a0a8f] transition-colors">
                        {tournament.title}
                      </h3>
                      <div className="flex items-start gap-2 text-sm text-gray-600 mb-4">
                        <span className="material-symbols-outlined text-[#5a0a8f] mt-0.5 text-[18px]">location_on</span>
                        <span>{[tournament.venueName, tournament.city].filter(Boolean).join(', ') || (tournament as any).location || '—'}</span>
                      </div>
                      <div className="border-t border-dashed border-gray-200 my-3"></div>
                      <div className="space-y-2 mb-6">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Status</span>
                          <span className={`px-2 py-1 rounded text-xs font-bold ${statusBadgeClasses(tournament.status)}`}>
                            {tournament.status}
                          </span>
                        </div>
                      </div>
                      {tournament.status === 'REGISTRATION OPEN' ? (
                        !isAuthenticated ? (
                          <div className="w-full mt-auto space-y-3">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                              <p className="text-xs text-blue-800 font-semibold mb-2">Login to apply</p>
                            </div>
                            <Link
                              to="/login"
                              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2"
                            >
                              <span className="material-symbols-outlined text-sm">login</span>
                              Login to Apply
                            </Link>
                            <Link
                              to="/register"
                              className="w-full py-2.5 bg-white border-2 border-[#5a0a8f] hover:bg-purple-50 text-[#5a0a8f] rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2"
                            >
                              <span className="material-symbols-outlined text-sm">person_add</span>
                              Create Account
                            </Link>
                          </div>
                        ) : (
                          <Link
                            to={`/tournaments/${tournament._id}/apply`}
                            className="w-full mt-auto py-2.5 bg-[#5a0a8f] hover:bg-[#400466] text-white rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2"
                          >
                            Apply for Tournament
                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                          </Link>
                        )
                      ) : (
                        <button
                          onClick={() => handleViewDetails(tournament._id)}
                          className="w-full mt-auto py-2.5 bg-white border-2 border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2"
                        >
                          <span className="material-symbols-outlined text-[18px]">info</span>
                          View Details
                        </button>
                      )}
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>

          {/* Recent Results Section */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3 mb-6">
              <span className="w-1 h-12 bg-[#5a0a8f]"></span>
              Recent Results
            </h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Tournament</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Location</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Winner</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {recentResults.map((result) => (
                      <tr key={result.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{result.date}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{result.tournament}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{result.location}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">{result.winner}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleViewScorecard(result)}
                            className="text-sm font-bold text-[#5a0a8f] hover:text-[#400466] transition-colors"
                          >
                            {result.actionType === 'scorecard' ? 'View Scorecard' : 'View Selected Squad'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <button className="w-full text-center text-sm font-bold text-gray-700 hover:text-[#5a0a8f] transition-colors">
                  LOAD MORE PAST EVENTS
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ScoreCard Modal */}
      <ScoreCard data={selectedScoreCard} isOpen={isScoreCardOpen} onClose={() => setIsScoreCardOpen(false)} />

      {/* Match Schedule Modal */}
      {selectedTournamentForDetails && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900">📅 Match Schedule</h2>
              <button
                onClick={() => {
                  setSelectedTournamentForDetails(null)
                  setMatchesForDetails([])
                }}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            <div className="p-3 sm:p-6">
              {loadingMatches ? (
                <div className="text-center py-8 text-gray-500">Loading matches…</div>
              ) : matchesForDetails.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No matches scheduled yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm sm:text-base">
                    <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                      <tr>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-700">Round</th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-700">Match</th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-700">Team 1</th>
                        <th className="px-1 sm:px-2 py-2 sm:py-3 text-center text-xs font-bold uppercase tracking-wide text-gray-700">VS</th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-700">Team 2</th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-700 whitespace-nowrap">📅 Date</th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-700 whitespace-nowrap">⏰ Time</th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-700">Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {matchesForDetails.map((match, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-900 text-xs sm:text-sm">
                            {idx < 4 ? 1 : idx < 6 ? 2 : idx < 7 ? 3 : idx < 8 ? 4 : 5}
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-900 text-xs sm:text-sm">#{idx + 1}</td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-900 text-xs sm:text-sm truncate">{match.team1}</td>
                          <td className="px-1 sm:px-2 py-2 sm:py-3 text-center font-bold text-purple-600 text-xs sm:text-sm">VS</td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-900 text-xs sm:text-sm truncate">{match.team2}</td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-600 whitespace-nowrap">{match.date}</td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-600 whitespace-nowrap font-semibold">{match.time}</td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3">
                            <span className={`inline-flex px-2 sm:px-3 py-1 rounded-full font-medium text-xs whitespace-nowrap ${match.bracket === 'winner'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-orange-100 text-orange-700'
                              }`}>
                              {match.bracket === 'winner' ? '🏆 Win' : '🔻 Lose'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
