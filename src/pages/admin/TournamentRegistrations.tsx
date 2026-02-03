import { Link, useParams, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../../lib/api'
import { UpdateScoreModal } from '../../components/admin/UpdateScoreModal'
import { GenerateScoreCardModal } from '../../components/admin/GenerateScoreCardModal'
import type { ScoreCardData } from '../../components/admin/GenerateScoreCardModal'

type AdminTournament = {
  _id: string
  title: string
  startDate?: string
  endDate?: string
  venueName?: string
  city?: string
  status?: string
}

type Applicant = {
  _id: string
  fullName: string
  email: string
  district?: string
  profilePhoto?: string
}

type TournamentRegistration = {
  _id: string
  userId: string
  tournamentId: string
  applicant?: Applicant
  registerAs: 'player' | 'coach' | 'referee'
  category?: string
  status: 'pending' | 'approved' | 'rejected'
  appliedAt?: string
  notes?: string
}

type Player = {
  _id: string
  fullName: string
  playerId: string
  district?: string
}

type Team = {
  _id: string
  name: string
  maxMembers: number
  members: {
    _id: string
    name: string
    playerId: string
  }[]
}

type Match = {
  _id: string
  team1: string
  team2: string
  date: string
  time: string
  bracket?: 'winner' | 'loser'
  description?: string
  status?: 'scheduled' | 'ongoing' | 'completed'
  score?: {
    team1: number
    team2: number
  }
  sets?: {
    setNumber: number
    team1Score: number
    team2Score: number
    winner?: 'team1' | 'team2' | null
  }[]
  winner?: 'team1' | 'team2' | 'tie'
}

type Stats = {
  total: number
  pending: number
  approved: number
  rejected: number
}

// New Simple Match State
type SimpleMatchPlayer = {
  _id: string
  fullName: string
  playerId: string
  jerseyNumber?: number
  position?: string
  isCaptain?: boolean
  isSubstitute?: boolean
}

type Coach = {
  _id: string
  fullName: string
  email: string
  phone?: string
}

type Referee = {
  _id: string
  fullName: string
  email: string
  phone?: string
}

type SimpleMatchState = {
  title: string
  round: number
  team1Name: string
  team2Name: string
  team1Players: SimpleMatchPlayer[]
  team2Players: SimpleMatchPlayer[]
  team1Coach: Coach | null
  team2Coach: Coach | null
  team1Manager: string
  team2Manager: string
  referee: Referee | null
  assistantReferee: Referee | null
  date: string
  time: string
}

type WizardState = {
  phase: 'idle' | 'create-match'
  simpleMatch: SimpleMatchState
}

export function TournamentRegistrations() {
  const { tournamentId } = useParams<{ tournamentId: string }>()
  const navigate = useNavigate()

  const [tournament, setTournament] = useState<AdminTournament | null>(null)
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedRegistration, setSelectedRegistration] = useState<string | null>(null)

  // UI State
  const [activeTab, setActiveTab] = useState<'registrations' | 'matches'>('registrations')

  // Score Card Modal State
  const [isScoreCardModalOpen, setIsScoreCardModalOpen] = useState(false)
  const [selectedMatchForScoreCard, setSelectedMatchForScoreCard] = useState<Match | null>(null)

  // Wizard State
  const [wizard, setWizard] = useState<WizardState>({
    phase: 'idle',
    simpleMatch: {
      title: '',
      round: 1,
      team1Name: 'Team A',
      team2Name: 'Team B',
      team1Players: [],
      team2Players: [],
      team1Coach: null,
      team2Coach: null,
      team1Manager: '',
      team2Manager: '',
      referee: null,
      assistantReferee: null,
      date: new Date().toISOString().split('T')[0],
      time: '10:00'
    }
  })

  // Player Search State for the Wizard
  const [playerSearch, setPlayerSearch] = useState('')
  const [activeSearchSide, setActiveSearchSide] = useState<1 | 2 | null>(null)
  const [playerResults, setPlayerResults] = useState<Player[]>([])

  // Coach and Referee Search States
  const [coachSearch, setCoachSearch] = useState('')
  const [coachResults, setCoachResults] = useState<Coach[]>([])
  const [activeCoachSide, setActiveCoachSide] = useState<1 | 2 | null>(null)

  const [refereeSearch, setRefereeSearch] = useState('')
  const [refereeResults, setRefereeResults] = useState<Referee[]>([])
  const [activeRefereeSide, setActiveRefereeSide] = useState<'main' | 'assistant' | null>(null)

  const [savingMatch, setSavingMatch] = useState(false)

  // Score Update Modal State
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false)
  const [selectedMatchForScore, setSelectedMatchForScore] = useState<Match | null>(null)

  // Fetch tournament details
  useEffect(() => {
    if (!tournamentId) return
    const fetchTournament = async () => {
      try {
        const res = await apiRequest<{ tournament: AdminTournament }>(
          `/admin/tournaments/${tournamentId}`,
          { auth: true }
        )
        setTournament(res.tournament)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to fetch tournament')
      }
    }
    fetchTournament()
  }, [tournamentId])

  // Fetch registrations
  useEffect(() => {
    if (!tournamentId) return
    const fetchRegistrations = async () => {
      setLoading(true)
      try {
        const res = await apiRequest<{ registrations: TournamentRegistration[] }>(
          `/admin/tournaments/${tournamentId}/registrations`,
          { auth: true }
        )
        setRegistrations(Array.isArray(res.registrations) ? res.registrations : [])
        setError(null)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to fetch registrations')
        setRegistrations([])
      } finally {
        setLoading(false)
      }
    }
    fetchRegistrations()
  }, [tournamentId])

  // Fetch teams
  const fetchTeams = async (id: string) => {
    try {
      const res = await apiRequest<{ teams: Team[] }>(`/admin/teams?tournamentId=${id}`, { auth: true })
      setTeams(Array.isArray(res.teams) ? res.teams : [])
    } catch (e) {
      setTeams([])
    }
  }

  // Fetch matches
  const fetchMatches = async (id: string) => {
    try {
      const res = await apiRequest<{ matches: Match[] }>(`/admin/matches?tournamentId=${id}`, { auth: true })
      setMatches(Array.isArray(res.matches) ? res.matches : [])
    } catch (e) {
      setMatches([])
    }
  }

  // Delete match
  const handleDeleteMatch = async (matchId: string, team1: string, team2: string) => {
    if (!window.confirm(`Are you sure you want to delete the match between ${team1} and ${team2}? This will also delete the associated teams.`)) {
      return
    }

    try {
      await apiRequest(`/admin/matches/${matchId}`, {
        method: 'DELETE',
        auth: true
      })

      // Refresh both matches and teams
      if (tournamentId) {
        await Promise.all([
          fetchMatches(tournamentId),
          fetchTeams(tournamentId)
        ])
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to delete match')
    }
  }

  // Download match PDF
  const handleDownloadMatchPdf = async (matchId: string) => {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://sports-backend-fgsp.onrender.com'
      const baseUrl = API_BASE.replace(/\/api$/, '') // Remove /api if present to add it back

      // Get token from localStorage using the same key as api.ts
      const token = window.localStorage.getItem('stfi.token')

      const response = await fetch(`${baseUrl}/api/admin/matches/${matchId}/pdf`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition')
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `match_${matchId}.pdf`

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to download PDF')
    }
  }

  useEffect(() => {
    if (tournamentId) {
      fetchTeams(tournamentId)
      fetchMatches(tournamentId)
    }
  }, [tournamentId])

  // Handle player search
  const handlePlayerSearch = async (query: string, side: 1 | 2) => {
    setPlayerSearch(query)
    setActiveSearchSide(side)

    if (!query.trim() || query.trim().length < 2) {
      setPlayerResults([])
      return
    }

    try {
      const res = await apiRequest<{ players: Player[] }>(
        `/admin/players/search?q=${encodeURIComponent(query)}`,
        { auth: true }
      )
      setPlayerResults(Array.isArray(res.players) ? res.players : [])
    } catch (e) {
      setPlayerResults([])
    }
  }

  // Start Create Match Wizard
  const startCreateMatch = () => {
    setWizard({
      phase: 'create-match',
      simpleMatch: {
        title: '',
        round: 1,
        team1Name: 'Team A',
        team2Name: 'Team B',
        team1Players: [],
        team2Players: [],
        team1Coach: null,
        team2Coach: null,
        team1Manager: '',
        team2Manager: '',
        referee: null,
        assistantReferee: null,
        date: new Date().toISOString().split('T')[0],
        time: '10:00'
      }
    })
    setPlayerSearch('')
    setPlayerResults([])
    setActiveSearchSide(null)
    setCoachSearch('')
    setCoachResults([])
    setActiveCoachSide(null)
    setRefereeSearch('')
    setRefereeResults([])
    setActiveRefereeSide(null)
  }

  const addPlayerToTeam = (side: 1 | 2, player: Player) => {
    setWizard(prev => {
      const newState = { ...prev }
      if (side === 1) {
        if (!newState.simpleMatch.team1Players.some(p => p._id === player._id)) {
          newState.simpleMatch.team1Players = [
            ...newState.simpleMatch.team1Players,
            { _id: player._id, fullName: player.fullName, playerId: player.playerId, jerseyNumber: undefined, position: '', isCaptain: false, isSubstitute: false }
          ]
        }
      } else {
        if (!newState.simpleMatch.team2Players.some(p => p._id === player._id)) {
          newState.simpleMatch.team2Players = [
            ...newState.simpleMatch.team2Players,
            { _id: player._id, fullName: player.fullName, playerId: player.playerId, jerseyNumber: undefined, position: '', isCaptain: false, isSubstitute: false }
          ]
        }
      }
      return newState
    })
    // Clear search after add
    setPlayerSearch('')
    setPlayerResults([])
  }

  const removePlayerFromTeam = (side: 1 | 2, playerId: string) => {
    setWizard(prev => {
      const newState = { ...prev }
      if (side === 1) {
        newState.simpleMatch.team1Players = newState.simpleMatch.team1Players.filter(p => p._id !== playerId)
      } else {
        newState.simpleMatch.team2Players = newState.simpleMatch.team2Players.filter(p => p._id !== playerId)
      }
      return newState
    })
  }

  const updatePlayerJerseyNumber = (side: 1 | 2, playerId: string, jerseyNumber: number) => {
    setWizard(prev => {
      const newState = { ...prev }
      if (side === 1) {
        newState.simpleMatch.team1Players = newState.simpleMatch.team1Players.map(p =>
          p._id === playerId ? { ...p, jerseyNumber } : p
        )
      } else {
        newState.simpleMatch.team2Players = newState.simpleMatch.team2Players.map(p =>
          p._id === playerId ? { ...p, jerseyNumber } : p
        )
      }
      return newState
    })
  }

  const updatePlayerPosition = (side: 1 | 2, playerId: string, position: string) => {
    setWizard(prev => {
      const newState = { ...prev }
      if (side === 1) {
        newState.simpleMatch.team1Players = newState.simpleMatch.team1Players.map(p =>
          p._id === playerId ? { ...p, position } : p
        )
      } else {
        newState.simpleMatch.team2Players = newState.simpleMatch.team2Players.map(p =>
          p._id === playerId ? { ...p, position } : p
        )
      }
      return newState
    })
  }

  const togglePlayerCaptain = (side: 1 | 2, playerId: string) => {
    setWizard(prev => {
      if (side === 1) {
        return {
          ...prev,
          simpleMatch: {
            ...prev.simpleMatch,
            team1Players: prev.simpleMatch.team1Players.map(p =>
              p._id === playerId ? { ...p, isCaptain: !p.isCaptain } : { ...p, isCaptain: false }
            )
          }
        }
      } else {
        return {
          ...prev,
          simpleMatch: {
            ...prev.simpleMatch,
            team2Players: prev.simpleMatch.team2Players.map(p =>
              p._id === playerId ? { ...p, isCaptain: !p.isCaptain } : { ...p, isCaptain: false }
            )
          }
        }
      }
    })
  }

  const togglePlayerSubstitute = (side: 1 | 2, playerId: string) => {
    setWizard(prev => {
      if (side === 1) {
        return {
          ...prev,
          simpleMatch: {
            ...prev.simpleMatch,
            team1Players: prev.simpleMatch.team1Players.map(p =>
              p._id === playerId ? { ...p, isSubstitute: !p.isSubstitute } : p
            )
          }
        }
      } else {
        return {
          ...prev,
          simpleMatch: {
            ...prev.simpleMatch,
            team2Players: prev.simpleMatch.team2Players.map(p =>
              p._id === playerId ? { ...p, isSubstitute: !p.isSubstitute } : p
            )
          }
        }
      }
    })
  }

  // Handle coach search
  const handleCoachSearch = async (query: string, side: 1 | 2) => {
    setCoachSearch(query)
    setActiveCoachSide(side)

    if (!query.trim() || query.trim().length < 2) {
      setCoachResults([])
      return
    }

    try {
      const res = await apiRequest<{ coaches: Coach[] }>(
        `/admin/coaches/search?q=${encodeURIComponent(query)}`,
        { auth: true }
      )
      setCoachResults(Array.isArray(res.coaches) ? res.coaches : [])
    } catch (e) {
      setCoachResults([])
    }
  }

  const selectCoach = (side: 1 | 2, coach: Coach) => {
    setWizard(prev => ({
      ...prev,
      simpleMatch: {
        ...prev.simpleMatch,
        ...(side === 1 ? { team1Coach: coach } : { team2Coach: coach })
      }
    }))
    setCoachSearch('')
    setCoachResults([])
    setActiveCoachSide(null)
  }

  const removeCoach = (side: 1 | 2) => {
    setWizard(prev => ({
      ...prev,
      simpleMatch: {
        ...prev.simpleMatch,
        ...(side === 1 ? { team1Coach: null } : { team2Coach: null })
      }
    }))
  }

  // Handle referee search
  const handleRefereeSearch = async (query: string, type: 'main' | 'assistant') => {
    setRefereeSearch(query)
    setActiveRefereeSide(type)

    if (!query.trim() || query.trim().length < 2) {
      setRefereeResults([])
      return
    }

    try {
      const res = await apiRequest<{ referees: Referee[] }>(
        `/admin/referees/search?q=${encodeURIComponent(query)}`,
        { auth: true }
      )
      setRefereeResults(Array.isArray(res.referees) ? res.referees : [])
    } catch (e) {
      setRefereeResults([])
    }
  }

  const selectReferee = (type: 'main' | 'assistant', referee: Referee) => {
    setWizard(prev => ({
      ...prev,
      simpleMatch: {
        ...prev.simpleMatch,
        ...(type === 'main' ? { referee } : { assistantReferee: referee })
      }
    }))
    setRefereeSearch('')
    setRefereeResults([])
    setActiveRefereeSide(null)
  }

  const removeReferee = (type: 'main' | 'assistant') => {
    setWizard(prev => ({
      ...prev,
      simpleMatch: {
        ...prev.simpleMatch,
        ...(type === 'main' ? { referee: null } : { assistantReferee: null })
      }
    }))
  }

  const saveSimpleMatch = async () => {
    if (!wizard.simpleMatch.title.trim()) {
      alert('Please enter a match title')
      return
    }
    if (!wizard.simpleMatch.team1Name.trim() || !wizard.simpleMatch.team2Name.trim()) {
      alert('Team names are required')
      return
    }

    setSavingMatch(true)
    try {
      // 1. Create Team 1
      const team1Res = await apiRequest<{ team: Team }>(`/admin/teams`, {
        method: 'POST',
        auth: true,
        body: JSON.stringify({
          tournamentId,
          name: wizard.simpleMatch.team1Name,
          maxMembers: 50, // Default generous limit
          memberIds: wizard.simpleMatch.team1Players.map(p => p._id),
        }),
      })

      // 2. Create Team 2
      const team2Res = await apiRequest<{ team: Team }>(`/admin/teams`, {
        method: 'POST',
        auth: true,
        body: JSON.stringify({
          tournamentId,
          name: wizard.simpleMatch.team2Name,
          maxMembers: 50,
          memberIds: wizard.simpleMatch.team2Players.map(p => p._id),
        }),
      })

      // 3. Create Match with all new fields
      await apiRequest<{ match: Match }>(`/admin/matches`, {
        method: 'POST',
        auth: true,
        body: JSON.stringify({
          tournamentId,
          team1: team1Res.team._id,
          team2: team2Res.team._id,
          round: wizard.simpleMatch.round,
          team1Coach: wizard.simpleMatch.team1Coach?._id || null,
          team2Coach: wizard.simpleMatch.team2Coach?._id || null,
          team1Manager: wizard.simpleMatch.team1Manager || null,
          team2Manager: wizard.simpleMatch.team2Manager || null,
          team1Players: wizard.simpleMatch.team1Players.map(p => ({
            player: p._id,
            jerseyNumber: p.jerseyNumber || null,
            position: p.position || null,
            isCaptain: p.isCaptain || false,
            isSubstitute: p.isSubstitute || false
          })),
          team2Players: wizard.simpleMatch.team2Players.map(p => ({
            player: p._id,
            jerseyNumber: p.jerseyNumber || null,
            position: p.position || null,
            isCaptain: p.isCaptain || false,
            isSubstitute: p.isSubstitute || false
          })),
          referee: wizard.simpleMatch.referee?._id || null,
          assistantReferee: wizard.simpleMatch.assistantReferee?._id || null,
          date: wizard.simpleMatch.date,
          time: wizard.simpleMatch.time,
          bracket: 'winner',
          description: wizard.simpleMatch.title,
        }),
      })

      alert('Match created successfully!')

      // Refresh and Close
      if (tournamentId) {
        fetchTeams(tournamentId)
        fetchMatches(tournamentId)
      }
      setWizard({ ...wizard, phase: 'idle' })

    } catch (e) {
      alert('Failed to save match: ' + (e instanceof Error ? e.message : 'Unknown error'))
    } finally {
      setSavingMatch(false)
    }
  }

  // Handle registration approval
  const handleApprove = async (registrationId: string) => {
    try {
      await apiRequest(`/admin/tournament-registrations/${registrationId}/status`, {
        method: 'PATCH',
        auth: true,
        body: JSON.stringify({ status: 'approved' }),
      })
      if (tournamentId) {
        const res = await apiRequest<{ registrations: TournamentRegistration[] }>(
          `/admin/tournaments/${tournamentId}/registrations`,
          { auth: true }
        )
        setRegistrations(Array.isArray(res.registrations) ? res.registrations : [])
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to approve registration')
    }
  }

  // Handle registration rejection
  const handleReject = async (registrationId: string) => {
    try {
      await apiRequest(`/admin/tournament-registrations/${registrationId}/status`, {
        method: 'PATCH',
        auth: true,
        body: JSON.stringify({ status: 'rejected' }),
      })
      if (tournamentId) {
        const res = await apiRequest<{ registrations: TournamentRegistration[] }>(
          `/admin/tournaments/${tournamentId}/registrations`,
          { auth: true }
        )
        setRegistrations(Array.isArray(res.registrations) ? res.registrations : [])
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to reject registration')
    }
  }

  // Calculate stats
  const stats: Stats = useMemo(() => {
    return {
      total: registrations.length,
      pending: registrations.filter(r => r.status === 'pending').length,
      approved: registrations.filter(r => r.status === 'approved').length,
      rejected: registrations.filter(r => r.status === 'rejected').length,
    }
  }, [registrations])

  // Filter registrations
  const filteredRegistrations = useMemo(() => {
    return registrations.filter(r => {
      const matchesSearch =
        !searchQuery ||
        r.applicant?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.applicant?.email?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter
      const matchesType = typeFilter === 'all' || r.registerAs === typeFilter
      return matchesSearch && matchesStatus && matchesType
    })
  }, [registrations, searchQuery, statusFilter, typeFilter])

  if (!tournament) {
    return (
      <div className="flex items-center justify-center h-screen">
        {loading ? <div>Loading...</div> : <div>Tournament not found</div>}
      </div>
    )
  }

  // Check if we show the wizard or the main content
  if (wizard.phase === 'create-match') {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#5a0a8f] to-[#400466] p-6 text-white flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-black">Create Match</h2>
              <p className="text-purple-100 text-sm mt-1">Set up teams and schedule a match</p>
            </div>
            <button
              onClick={() => setWizard({ ...wizard, phase: 'idle' })}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <span className="material-symbols-outlined text-3xl">close</span>
            </button>
          </div>

          <div className="p-6 flex-1 overflow-y-auto space-y-6">
            {/* Title and Round Input */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-3">
                <label className="block text-sm font-bold uppercase tracking-wide text-gray-700 mb-2">
                  Match Title / Description
                </label>
                <input
                  type="text"
                  autoFocus
                  value={wizard.simpleMatch.title}
                  onChange={(e) => setWizard(prev => ({
                    ...prev,
                    simpleMatch: { ...prev.simpleMatch, title: e.target.value }
                  }))}
                  placeholder="e.g. Quarter Final 1, League Match A vs B"
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5a0a8f] font-semibold text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-bold uppercase tracking-wide text-gray-700 mb-2">
                  Round
                </label>
                <input
                  type="number"
                  min="1"
                  value={wizard.simpleMatch.round}
                  onChange={(e) => setWizard(prev => ({
                    ...prev,
                    simpleMatch: { ...prev.simpleMatch, round: parseInt(e.target.value) || 1 }
                  }))}
                  placeholder="1"
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5a0a8f] font-semibold text-gray-900"
                />
              </div>
            </div>

            {/* Date and Time Input */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold uppercase tracking-wide text-gray-700 mb-2">
                  Match Date
                </label>
                <input
                  type="date"
                  value={wizard.simpleMatch.date}
                  onChange={(e) => setWizard(prev => ({
                    ...prev,
                    simpleMatch: { ...prev.simpleMatch, date: e.target.value }
                  }))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5a0a8f] font-semibold text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-bold uppercase tracking-wide text-gray-700 mb-2">
                  Match Time
                </label>
                <input
                  type="time"
                  value={wizard.simpleMatch.time}
                  onChange={(e) => setWizard(prev => ({
                    ...prev,
                    simpleMatch: { ...prev.simpleMatch, time: e.target.value }
                  }))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5a0a8f] font-semibold text-gray-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Team 1 Section */}
              <div className="bg-blue-50 rounded-xl p-5 border-2 border-blue-200">
                <h3 className="text-xl font-black text-blue-900 mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined">shield</span> Team A
                </h3>

                <div className="mb-4">
                  <label className="block text-xs font-bold uppercase text-blue-800 mb-1">Team Name</label>
                  <input
                    type="text"
                    value={wizard.simpleMatch.team1Name}
                    onChange={(e) => setWizard(prev => ({
                      ...prev,
                      simpleMatch: { ...prev.simpleMatch, team1Name: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-500 font-bold text-blue-900"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-bold uppercase text-blue-800 mb-1">Add Players</label>
                  <input
                    type="text"
                    value={activeSearchSide === 1 ? playerSearch : ''}
                    onFocus={() => {
                      setPlayerSearch('')
                      setActiveSearchSide(1)
                    }}
                    onChange={(e) => handlePlayerSearch(e.target.value, 1)}
                    placeholder="Search player by name or ID..."
                    className="w-full px-3 py-2 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white text-gray-900"
                  />
                  {activeSearchSide === 1 && playerResults.length > 0 && (
                    <div className="mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-40 overflow-y-auto">
                      {playerResults.map(p => (
                        <div
                          key={p._id}
                          onClick={() => addPlayerToTeam(1, p)}
                          className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b last:border-0 flex justify-between items-center"
                        >
                          <div>
                            <div className="font-semibold text-sm text-gray-900">{p.fullName}</div>
                            <div className="text-xs text-gray-500">{p.playerId}</div>
                          </div>
                          <span className="text-blue-600 font-bold">+</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {wizard.simpleMatch.team1Players.map(p => (
                    <div key={p._id} className="bg-white px-3 py-3 rounded-lg border border-blue-100 shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="font-semibold text-blue-900 text-base">{p.fullName}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{p.playerId || 'N/A'}</div>
                        </div>
                        <button onClick={() => removePlayerFromTeam(1, p._id)} className="text-red-500 hover:text-red-700 font-bold text-2xl leading-none ml-2">×</button>
                      </div>
                      <div className="grid grid-cols-1 gap-2.5">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-blue-700 font-semibold mb-1">Jersey #</label>
                            <input
                              type="number"
                              value={p.jerseyNumber || ''}
                              onChange={(e) => updatePlayerJerseyNumber(1, p._id, parseInt(e.target.value) || 0)}
                              placeholder="Number"
                              className="w-full px-3 py-2 border-2 border-blue-200 rounded-lg text-base font-semibold text-blue-900 focus:outline-none focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-blue-700 font-semibold mb-1">Position</label>
                            <input
                              type="text"
                              value={p.position || ''}
                              onChange={(e) => updatePlayerPosition(1, p._id, e.target.value)}
                              placeholder="e.g. Forward"
                              className="w-full px-3 py-2 border-2 border-blue-200 rounded-lg text-base font-semibold text-blue-900 focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                            <input
                              type="checkbox"
                              checked={p.isCaptain || false}
                              onChange={() => togglePlayerCaptain(1, p._id)}
                              className="w-4 h-4 rounded"
                            />
                            <span className="text-blue-700">Captain</span>
                          </label>
                          <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                            <input
                              type="checkbox"
                              checked={p.isSubstitute || false}
                              onChange={() => togglePlayerSubstitute(1, p._id)}
                              className="w-4 h-4 rounded"
                            />
                            <span className="text-blue-700">Sub</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                  {wizard.simpleMatch.team1Players.length === 0 && (
                    <div className="text-center py-4 text-blue-400 text-sm italic">No players added</div>
                  )}
                </div>

                {/* Team 1 Coach */}
                <div className="mt-4">
                  <label className="block text-xs font-bold uppercase text-blue-800 mb-1">Team Coach</label>
                  {wizard.simpleMatch.team1Coach ? (
                    <div className="bg-white px-3 py-2 rounded-lg border-2 border-blue-200 flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-blue-900">{wizard.simpleMatch.team1Coach.fullName}</div>
                        <div className="text-xs text-gray-500">{wizard.simpleMatch.team1Coach.email}</div>
                      </div>
                      <button onClick={() => removeCoach(1)} className="text-red-500 hover:text-red-700 font-bold text-xl">×</button>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="text"
                        value={activeCoachSide === 1 ? coachSearch : ''}
                        onFocus={() => {
                          setCoachSearch('')
                          setActiveCoachSide(1)
                        }}
                        onChange={(e) => handleCoachSearch(e.target.value, 1)}
                        placeholder="Search by name, email, phone, or district..."
                        className="w-full px-3 py-2 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white text-gray-900"
                      />
                      {activeCoachSide === 1 && coachResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-2 bg-white rounded-lg shadow-xl border-2 border-blue-300 max-h-48 overflow-y-auto">
                          {coachResults.map(c => (
                            <div
                              key={c._id}
                              onClick={() => selectCoach(1, c)}
                              className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b last:border-0 flex justify-between items-center"
                            >
                              <div>
                                <div className="font-semibold text-sm text-gray-900">{c.fullName}</div>
                                <div className="text-xs text-gray-500">{c.email} {c.phone && `• ${c.phone}`}</div>
                              </div>
                              <span className="text-blue-600 font-bold">+</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {activeCoachSide === 1 && coachSearch.length >= 2 && coachResults.length === 0 && (
                        <div className="absolute z-10 w-full mt-2 bg-white rounded-lg shadow-xl border-2 border-blue-300 px-3 py-2 text-sm text-gray-500 italic">
                          No coaches found
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Team 1 Manager */}
                <div className="mt-4">
                  <label className="block text-xs font-bold uppercase text-blue-800 mb-1">Team Manager</label>
                  <input
                    type="text"
                    value={wizard.simpleMatch.team1Manager}
                    onChange={(e) => setWizard(prev => ({
                      ...prev,
                      simpleMatch: { ...prev.simpleMatch, team1Manager: e.target.value }
                    }))}
                    placeholder="Enter manager name..."
                    className="w-full px-3 py-2 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white text-gray-900"
                  />
                </div>
              </div>

              {/* Team 2 Section */}
              <div className="bg-orange-50 rounded-xl p-5 border-2 border-orange-200">
                <h3 className="text-xl font-black text-orange-900 mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined">shield</span> Team B
                </h3>

                <div className="mb-4">
                  <label className="block text-xs font-bold uppercase text-orange-800 mb-1">Team Name</label>
                  <input
                    type="text"
                    value={wizard.simpleMatch.team2Name}
                    onChange={(e) => setWizard(prev => ({
                      ...prev,
                      simpleMatch: { ...prev.simpleMatch, team2Name: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border-2 border-orange-200 rounded-lg focus:outline-none focus:border-orange-500 font-bold text-orange-900"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-bold uppercase text-orange-800 mb-1">Add Players</label>
                  <input
                    type="text"
                    value={activeSearchSide === 2 ? playerSearch : ''}
                    onFocus={() => {
                      setPlayerSearch('')
                      setActiveSearchSide(2)
                    }}
                    onChange={(e) => handlePlayerSearch(e.target.value, 2)}
                    placeholder="Search player by name or ID..."
                    className="w-full px-3 py-2 border-2 border-orange-200 rounded-lg focus:outline-none focus:border-orange-500 bg-white text-gray-900"
                  />
                  {activeSearchSide === 2 && playerResults.length > 0 && (
                    <div className="mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-40 overflow-y-auto">
                      {playerResults.map(p => (
                        <div
                          key={p._id}
                          onClick={() => addPlayerToTeam(2, p)}
                          className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b last:border-0 flex justify-between items-center"
                        >
                          <div>
                            <div className="font-semibold text-sm text-gray-900">{p.fullName}</div>
                            <div className="text-xs text-gray-500">{p.playerId}</div>
                          </div>
                          <span className="text-orange-600 font-bold">+</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {wizard.simpleMatch.team2Players.map(p => (
                    <div key={p._id} className="bg-white px-3 py-3 rounded-lg border border-orange-100 shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="font-semibold text-orange-900 text-base">{p.fullName}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{p.playerId || 'N/A'}</div>
                        </div>
                        <button onClick={() => removePlayerFromTeam(2, p._id)} className="text-red-500 hover:text-red-700 font-bold text-2xl leading-none ml-2">×</button>
                      </div>
                      <div className="grid grid-cols-1 gap-2.5">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-orange-700 font-semibold mb-1">Jersey #</label>
                            <input
                              type="number"
                              value={p.jerseyNumber || ''}
                              onChange={(e) => updatePlayerJerseyNumber(2, p._id, parseInt(e.target.value) || 0)}
                              placeholder="Number"
                              className="w-full px-3 py-2 border-2 border-orange-200 rounded-lg text-base font-semibold text-orange-900 focus:outline-none focus:border-orange-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-orange-700 font-semibold mb-1">Position</label>
                            <input
                              type="text"
                              value={p.position || ''}
                              onChange={(e) => updatePlayerPosition(2, p._id, e.target.value)}
                              placeholder="e.g. Forward"
                              className="w-full px-3 py-2 border-2 border-orange-200 rounded-lg text-base font-semibold text-orange-900 focus:outline-none focus:border-orange-500"
                            />
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                            <input
                              type="checkbox"
                              checked={p.isCaptain || false}
                              onChange={() => togglePlayerCaptain(2, p._id)}
                              className="w-4 h-4 rounded"
                            />
                            <span className="text-orange-700">Captain</span>
                          </label>
                          <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                            <input
                              type="checkbox"
                              checked={p.isSubstitute || false}
                              onChange={() => togglePlayerSubstitute(2, p._id)}
                              className="w-4 h-4 rounded"
                            />
                            <span className="text-orange-700">Sub</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                  {wizard.simpleMatch.team2Players.length === 0 && (
                    <div className="text-center py-4 text-orange-400 text-sm italic">No players added</div>
                  )}
                </div>

                {/* Team 2 Coach */}
                <div className="mt-4">
                  <label className="block text-xs font-bold uppercase text-orange-800 mb-1">Team Coach</label>
                  {wizard.simpleMatch.team2Coach ? (
                    <div className="bg-white px-3 py-2 rounded-lg border-2 border-orange-200 flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-orange-900">{wizard.simpleMatch.team2Coach.fullName}</div>
                        <div className="text-xs text-gray-500">{wizard.simpleMatch.team2Coach.email}</div>
                      </div>
                      <button onClick={() => removeCoach(2)} className="text-red-500 hover:text-red-700 font-bold text-xl">×</button>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="text"
                        value={activeCoachSide === 2 ? coachSearch : ''}
                        onFocus={() => {
                          setCoachSearch('')
                          setActiveCoachSide(2)
                        }}
                        onChange={(e) => handleCoachSearch(e.target.value, 2)}
                        placeholder="Search by name, email, phone, or district..."
                        className="w-full px-3 py-2 border-2 border-orange-200 rounded-lg focus:outline-none focus:border-orange-500 bg-white text-gray-900"
                      />
                      {activeCoachSide === 2 && coachResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-2 bg-white rounded-lg shadow-xl border-2 border-orange-300 max-h-48 overflow-y-auto">
                          {coachResults.map(c => (
                            <div
                              key={c._id}
                              onClick={() => selectCoach(2, c)}
                              className="px-3 py-2 hover:bg-orange-50 cursor-pointer border-b last:border-0 flex justify-between items-center"
                            >
                              <div>
                                <div className="font-semibold text-sm text-gray-900">{c.fullName}</div>
                                <div className="text-xs text-gray-500">{c.email} {c.phone && `• ${c.phone}`}</div>
                              </div>
                              <span className="text-orange-600 font-bold">+</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {activeCoachSide === 2 && coachSearch.length >= 2 && coachResults.length === 0 && (
                        <div className="absolute z-10 w-full mt-2 bg-white rounded-lg shadow-xl border-2 border-orange-300 px-3 py-2 text-sm text-gray-500 italic">
                          No coaches found
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Team 2 Manager */}
                <div className="mt-4">
                  <label className="block text-xs font-bold uppercase text-orange-800 mb-1">Team Manager</label>
                  <input
                    type="text"
                    value={wizard.simpleMatch.team2Manager}
                    onChange={(e) => setWizard(prev => ({
                      ...prev,
                      simpleMatch: { ...prev.simpleMatch, team2Manager: e.target.value }
                    }))}
                    placeholder="Enter manager name..."
                    className="w-full px-3 py-2 border-2 border-orange-200 rounded-lg focus:outline-none focus:border-orange-500 bg-white text-gray-900"
                  />
                </div>
              </div>
            </div>

            {/* Match Officials Section */}
            <div className="bg-green-50 rounded-xl p-5 border-2 border-green-200">
              <h3 className="text-xl font-black text-green-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined">sports</span> Match Officials
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Referee */}
                <div>
                  <label className="block text-xs font-bold uppercase text-green-800 mb-1">Referee</label>
                  {wizard.simpleMatch.referee ? (
                    <div className="bg-white px-3 py-2 rounded-lg border-2 border-green-200 flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-green-900">{wizard.simpleMatch.referee.fullName}</div>
                        <div className="text-xs text-gray-500">{wizard.simpleMatch.referee.email}</div>
                      </div>
                      <button onClick={() => removeReferee('main')} className="text-red-500 hover:text-red-700 font-bold text-xl">×</button>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="text"
                        value={activeRefereeSide === 'main' ? refereeSearch : ''}
                        onFocus={() => {
                          setRefereeSearch('')
                          setActiveRefereeSide('main')
                        }}
                        onChange={(e) => handleRefereeSearch(e.target.value, 'main')}
                        placeholder="Search by name, email, phone, or district..."
                        className="w-full px-3 py-2 border-2 border-green-200 rounded-lg focus:outline-none focus:border-green-500 bg-white text-gray-900"
                      />
                      {activeRefereeSide === 'main' && refereeResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-2 bg-white rounded-lg shadow-xl border-2 border-green-300 max-h-48 overflow-y-auto">
                          {refereeResults.map(r => (
                            <div
                              key={r._id}
                              onClick={() => selectReferee('main', r)}
                              className="px-3 py-2 hover:bg-green-50 cursor-pointer border-b last:border-0 flex justify-between items-center"
                            >
                              <div>
                                <div className="font-semibold text-sm text-gray-900">{r.fullName}</div>
                                <div className="text-xs text-gray-500">{r.email} {r.phone && `• ${r.phone}`}</div>
                              </div>
                              <span className="text-green-600 font-bold">+</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {activeRefereeSide === 'main' && refereeSearch.length >= 2 && refereeResults.length === 0 && (
                        <div className="absolute z-10 w-full mt-2 bg-white rounded-lg shadow-xl border-2 border-green-300 px-3 py-2 text-sm text-gray-500 italic">
                          No referees found
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Assistant Referee */}
                <div>
                  <label className="block text-xs font-bold uppercase text-green-800 mb-1">Assistant Referee</label>
                  {wizard.simpleMatch.assistantReferee ? (
                    <div className="bg-white px-3 py-2 rounded-lg border-2 border-green-200 flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-green-900">{wizard.simpleMatch.assistantReferee.fullName}</div>
                        <div className="text-xs text-gray-500">{wizard.simpleMatch.assistantReferee.email}</div>
                      </div>
                      <button onClick={() => removeReferee('assistant')} className="text-red-500 hover:text-red-700 font-bold text-xl">×</button>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="text"
                        value={activeRefereeSide === 'assistant' ? refereeSearch : ''}
                        onFocus={() => {
                          setRefereeSearch('')
                          setActiveRefereeSide('assistant')
                        }}
                        onChange={(e) => handleRefereeSearch(e.target.value, 'assistant')}
                        placeholder="Search by name, email, phone, or district..."
                        className="w-full px-3 py-2 border-2 border-green-200 rounded-lg focus:outline-none focus:border-green-500 bg-white text-gray-900"
                      />
                      {activeRefereeSide === 'assistant' && refereeResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-2 bg-white rounded-lg shadow-xl border-2 border-green-300 max-h-48 overflow-y-auto">
                          {refereeResults.map(r => (
                            <div
                              key={r._id}
                              onClick={() => selectReferee('assistant', r)}
                              className="px-3 py-2 hover:bg-green-50 cursor-pointer border-b last:border-0 flex justify-between items-center"
                            >
                              <div>
                                <div className="font-semibold text-sm text-gray-900">{r.fullName}</div>
                                <div className="text-xs text-gray-500">{r.email} {r.phone && `• ${r.phone}`}</div>
                              </div>
                              <span className="text-green-600 font-bold">+</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {activeRefereeSide === 'assistant' && refereeSearch.length >= 2 && refereeResults.length === 0 && (
                        <div className="absolute z-10 w-full mt-2 bg-white rounded-lg shadow-xl border-2 border-green-300 px-3 py-2 text-sm text-gray-500 italic">
                          No referees found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
            <button
              onClick={() => setWizard({ ...wizard, phase: 'idle' })}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={saveSimpleMatch}
              disabled={savingMatch}
              className="px-8 py-3 bg-gradient-to-r from-[#5a0a8f] to-[#400466] hover:from-[#400466] hover:to-[#2d0333] text-white rounded-xl font-bold transition-all shadow-lg disabled:opacity-50"
            >
              {savingMatch ? 'Saving...' : 'Save & Exit'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ===== MAIN PAGE UI =====
  // Handle Score Card Generation
  const handleOpenScoreCardModal = (match: Match) => {
    setSelectedMatchForScoreCard(match)
    setIsScoreCardModalOpen(true)
  }

  const handleGenerateScoreCard = async (data: ScoreCardData) => {
    if (!selectedMatchForScoreCard) return

    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://sports-backend-fgsp.onrender.com'
      const baseUrl = API_BASE.replace(/\/api$/, '')
      const token = window.localStorage.getItem('stfi.token')

      const response = await fetch(`${baseUrl}/api/admin/matches/${selectedMatchForScoreCard._id}/scorecard-pdf`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('Failed to generate Score Card PDF')
      }

      const contentDisposition = response.headers.get('Content-Disposition')
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `scorecard_${selectedMatchForScoreCard._id}.pdf`

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to generate Score Card PDF')
    }
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
        <Link to="/admin/dashboard" className="hover:text-[#5a0a8f]">
          Dashboard
        </Link>
        <span>›</span>
        <Link to="/admin/tournaments" className="hover:text-[#5a0a8f]">
          Tournaments
        </Link>
        <span>›</span>
        <span className="text-gray-900 font-medium">{tournament.title} - Registrations</span>
      </div>

      {/* Header */}
      <div className="mb-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">{tournament.title}</h1>
            <p className="text-gray-600">
              Manage registrations, create teams, and schedule matches.
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/tournaments')}
            className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium"
          >
            Back to Tournaments
          </button>
        </div>

        {/* Tournament Info Card */}
        <div className="bg-gradient-to-r from-[#5a0a8f] to-[#400466] rounded-xl p-6 text-white mb-6 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm opacity-90 mb-1">Tournament Date</div>
              <div className="text-lg font-bold">
                {tournament.startDate ? new Date(tournament.startDate).toLocaleDateString() : '—'}
                {tournament.endDate ? ` - ${new Date(tournament.endDate).toLocaleDateString()}` : ''}
              </div>
            </div>
            <div>
              <div className="text-sm opacity-90 mb-1">Location</div>
              <div className="text-lg font-bold">
                {[tournament.venueName, tournament.city].filter(Boolean).join(', ') || '—'}
              </div>
            </div>
            <div>
              <div className="text-sm opacity-90 mb-1">Status</div>
              <div className="text-lg font-bold">{tournament.status || '—'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('registrations')}
          className={`pb-3 px-6 text-sm font-bold uppercase tracking-wide transition-colors relative ${activeTab === 'registrations'
            ? 'text-[#5a0a8f] border-b-2 border-[#5a0a8f]'
            : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          Registrations
        </button>
        <button
          onClick={() => setActiveTab('matches')}
          className={`pb-3 px-6 text-sm font-bold uppercase tracking-wide transition-colors relative ${activeTab === 'matches'
            ? 'text-[#5a0a8f] border-b-2 border-[#5a0a8f]'
            : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          Matches & Teams
        </button>
      </div>

      {activeTab === 'registrations' && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-xl border-2 border-blue-100 p-6">
              <div className="text-3xl font-black text-gray-900 mb-1">{stats.total}</div>
              <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Total Applications</div>
            </div>
            <div className="bg-white rounded-xl border-2 border-yellow-100 p-6">
              <div className="text-3xl font-black text-yellow-600 mb-1">{stats.pending}</div>
              <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Pending Review</div>
            </div>
            <div className="bg-white rounded-xl border-2 border-green-100 p-6">
              <div className="text-3xl font-black text-green-600 mb-1">{stats.approved}</div>
              <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Approved</div>
            </div>
            <div className="bg-white rounded-xl border-2 border-red-100 p-6">
              <div className="text-3xl font-black text-red-600 mb-1">{stats.rejected}</div>
              <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Rejected</div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1 relative w-full">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, email, or Aadhaar..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none text-gray-900"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none text-gray-900 bg-white"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none text-gray-900 bg-white"
              >
                <option value="all">All Types</option>
                <option value="player">Players</option>
                <option value="coach">Coaches</option>
                <option value="referee">Referees</option>
              </select>
            </div>
          </div>

          {/* Registrations Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            {error && (
              <div className="px-6 py-4 border-b border-gray-200 bg-red-50 text-red-700">{error}</div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">Applicant</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">Category</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">District</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">Applied On</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {!loading && filteredRegistrations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                        No registrations found for this tournament.
                      </td>
                    </tr>
                  ) : (
                    filteredRegistrations.map((tr) => (
                      <tr key={tr._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5a0a8f] to-[#400466] flex items-center justify-center text-white font-bold text-sm">
                              {tr.applicant?.fullName?.charAt(0).toUpperCase() || 'A'}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{tr.applicant?.fullName || '—'}</div>
                              <div className="text-sm text-gray-500">{tr.applicant?.email || ''}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 text-xs font-bold rounded ${tr.registerAs === 'player'
                              ? 'bg-blue-100 text-blue-700'
                              : tr.registerAs === 'coach'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-orange-100 text-orange-700'
                              }`}
                          >
                            {tr.registerAs === 'referee' ? 'REFEREE' : tr.registerAs.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                            {tr.category || '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{tr.applicant?.district || '—'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {tr.appliedAt ? new Date(tr.appliedAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 text-xs font-bold rounded ${tr.status === 'approved'
                              ? 'bg-green-100 text-green-700'
                              : tr.status === 'rejected'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-yellow-100 text-yellow-700'
                              }`}
                          >
                            {tr.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedRegistration(tr._id)}
                              className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                              title="View Details"
                            >
                              <span className="material-symbols-outlined text-lg">visibility</span>
                            </button>
                            {tr.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApprove(tr._id)}
                                  className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                                  title="Approve"
                                >
                                  <span className="material-symbols-outlined text-lg">check</span>
                                </button>
                                <button
                                  onClick={() => handleReject(tr._id)}
                                  className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                                  title="Reject"
                                >
                                  <span className="material-symbols-outlined text-lg">close</span>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'matches' && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Matches & Teams</h2>
              <p className="text-gray-500 mt-1">Create teams and schedule matches for this tournament</p>
            </div>
            <button
              onClick={startCreateMatch}
              className="px-6 py-3 bg-[#5a0a8f] hover:bg-[#400466] text-white rounded-xl font-bold transition-all shadow-md flex items-center gap-2 transform hover:scale-105 active:scale-95"
            >
              <span className="material-symbols-outlined">add_circle</span>
              Create Match
            </button>
          </div>

          {/* Teams List */}
          <div className="mb-10">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600">groups</span>
              Teams Created
            </h3>

            {teams.length === 0 ? (
              <div className="bg-gray-50 rounded-xl p-8 text-center border-2 border-dashed border-gray-200">
                <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">sports_kabaddi</span>
                <p className="text-gray-500 font-medium">No teams created yet. Create a match to automatically generate teams.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teams.map(team => (
                  <div key={team._id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-bold text-xl text-gray-900">{team.name}</h4>
                      <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-100">
                        {team.members.length} Players
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Roster</div>
                      <div className="flex flex-wrap gap-2">
                        {team.members.map((m: any, idx) => (
                          <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-md bg-gray-50 text-gray-700 text-sm border border-gray-200">
                            {m.fullName || m.name || 'Player'}
                          </span>
                        ))}
                        {team.members.length === 0 && (
                          <span className="text-gray-400 text-sm italic">No players assigned</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Scheduled Matches */}
          {matches.length > 0 && (
            <div className="border-t border-gray-100 pt-8">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-purple-600">calendar_month</span>
                Scheduled Matches
              </h3>

              <div className="space-y-4">
                {matches.map((match, idx) => (
                  <div key={idx} className={`bg-white rounded-xl border p-0 overflow-hidden transition-colors ${match.status === 'completed' ? 'border-purple-200 shadow-sm' : 'border-gray-200'
                    }`}>
                    <div className="flex flex-col md:flex-row">
                      {/* Date/Time Column */}
                      <div className="bg-gray-50 p-6 flex flex-col justify-center items-center min-w-[150px] border-b md:border-b-0 md:border-r border-gray-200">
                        <div className="text-2xl font-black text-gray-700">
                          {new Date(match.date).getDate()}
                        </div>
                        <div className="text-sm font-bold text-gray-500 uppercase tracking-wide">
                          {new Date(match.date).toLocaleDateString('en-US', { month: 'short' })}
                        </div>
                        <div className="mt-2 px-3 py-1 bg-white rounded-full text-xs font-bold text-gray-600 border border-gray-200 shadow-sm">
                          {new Date(`2000-01-01T${match.time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                        </div>
                        {match.status === 'completed' && (
                          <div className="mt-3 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-black uppercase tracking-wide border border-green-200">
                            Completed
                          </div>
                        )}
                      </div>

                      {/* Match Details */}
                      <div className="flex-1 p-6 flex flex-col justify-center">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                          {/* Team 1 */}
                          <div className={`flex-1 text-center md:text-right ${match.winner === 'team1' ? 'opacity-100' : match.winner ? 'opacity-50' : ''}`}>
                            <div className="text-xl font-black text-gray-900">{match.team1}</div>
                            {match.status === 'completed' && match.score && (
                              <div className="text-3xl font-black text-[#5a0a8f] mt-1">{match.score.team1} Sets</div>
                            )}
                          </div>

                          {/* VS Badge / Score */}
                          <div className="flex flex-col items-center">
                            {match.status === 'completed' ? (
                              <div className="flex flex-col items-center gap-1">
                                <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-700 font-black text-sm border-4 border-white shadow-sm ring-1 ring-green-100">
                                  ✓
                                </div>
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-black text-sm border-4 border-white shadow-sm ring-1 ring-purple-100">
                                VS
                              </div>
                            )}
                          </div>

                          {/* Team 2 */}
                          <div className={`flex-1 text-center md:text-left ${match.winner === 'team2' ? 'opacity-100' : match.winner ? 'opacity-50' : ''}`}>
                            <div className="text-xl font-black text-gray-900">{match.team2}</div>
                            {match.status === 'completed' && match.score && (
                              <div className="text-3xl font-black text-[#5a0a8f] mt-1">{match.score.team2} Sets</div>
                            )}
                          </div>
                        </div>

                        {/* Set Scores */}
                        {match.status === 'completed' && match.sets && match.sets.length > 0 && (
                          <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col items-center">
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Set Scores</div>
                            <div className="flex flex-wrap justify-center gap-3">
                              {match.sets.map((set, idx) => (
                                <div key={idx} className="flex flex-col items-center px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                                  <div className="text-xs font-bold text-gray-400 mb-1">SET {set.setNumber}</div>
                                  <div className="font-mono font-bold text-gray-900 text-lg">
                                    <span className={set.team1Score > set.team2Score ? 'text-green-600' : ''}>{set.team1Score}</span>
                                    <span className="mx-1 text-gray-300">-</span>
                                    <span className={set.team2Score > set.team1Score ? 'text-green-600' : ''}>{set.team2Score}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Description/Location footer */}
                        {match.description && (
                          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                            <span className="inline-block px-3 py-1 bg-gray-50 text-gray-600 text-sm font-medium rounded-lg">
                              {match.description}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Update Score Button - Separate column for better visibility */}
                      <div className="border-t md:border-t-0 md:border-l border-gray-200 bg-gray-50 p-4 flex flex-col gap-2 items-center justify-center min-w-[180px]">
                        <button
                          onClick={() => {
                            setSelectedMatchForScore(match)
                            setIsScoreModalOpen(true)
                          }}
                          className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
                        >
                          <span className="material-symbols-outlined text-lg">edit_square</span>
                          Update Score
                        </button>
                        <button
                          onClick={() => handleDownloadMatchPdf(match._id)}
                          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                        >
                          <span className="material-symbols-outlined text-lg">download</span>
                          Download PDF
                        </button>

                        {match.status === 'completed' && (
                          <button
                            onClick={() => handleOpenScoreCardModal(match)}
                            className="w-full px-4 py-2 bg-[#5a0a8f] hover:bg-[#400466] text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
                          >
                            <span className="material-symbols-outlined text-lg">sports_score</span>
                            Score Card
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteMatch(match._id, match.team1, match.team2)}
                          className="w-full px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 border border-red-200"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                          Delete Match
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {selectedRegistration && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-bold text-gray-900">Application Details</h2>
              <button
                onClick={() => setSelectedRegistration(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            <div className="p-6">
              {(() => {
                const tr = filteredRegistrations.find((r) => r._id === selectedRegistration)
                if (!tr) return null

                return (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-4">Applicant</h3>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm text-gray-600">Full Name</label>
                            <div className="font-semibold text-gray-900">{tr.applicant?.fullName || '—'}</div>
                          </div>
                          <div>
                            <label className="text-sm text-gray-600">Email</label>
                            <div className="font-semibold text-gray-900">{tr.applicant?.email || '—'}</div>
                          </div>
                          <div>
                            <label className="text-sm text-gray-600">District</label>
                            <div className="font-semibold text-gray-900">{tr.applicant?.district || '—'}</div>
                          </div>
                          <div>
                            <label className="text-sm text-gray-600">Registered As</label>
                            <div className="font-semibold text-gray-900">{tr.registerAs}</div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-semibold text-gray-900 mb-4">Details</h3>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm text-gray-600">Category</label>
                            <div className="font-semibold text-gray-900">{tr.category || '—'}</div>
                          </div>
                          <div>
                            <label className="text-sm text-gray-600">Status</label>
                            <div className="font-semibold text-gray-900">{tr.status}</div>
                          </div>
                          <div>
                            <label className="text-sm text-gray-600">Applied On</label>
                            <div className="font-semibold text-gray-900">
                              {tr.appliedAt ? new Date(tr.appliedAt).toLocaleString() : '—'}
                            </div>
                          </div>
                          <div>
                            <label className="text-sm text-gray-600">Notes</label>
                            <div className="font-semibold text-gray-900">{tr.notes || '—'}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    {tr.status === 'pending' && (
                      <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
                        <button
                          onClick={() => {
                            handleReject(tr._id)
                            setSelectedRegistration(null)
                          }}
                          className="px-5 py-2.5 border-2 border-red-300 rounded-lg hover:bg-red-50 transition-colors text-red-700 font-medium"
                        >
                          Reject Application
                        </button>
                        <button
                          onClick={() => {
                            handleApprove(tr._id)
                            setSelectedRegistration(null)
                          }}
                          className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-colors"
                        >
                          Approve Application
                        </button>
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Score Update Modal */}
      <UpdateScoreModal
        isOpen={isScoreModalOpen}
        onClose={() => {
          setIsScoreModalOpen(false)
          setSelectedMatchForScore(null)
          // Refresh matches after modal closes
          if (tournamentId) {
            fetchMatches(tournamentId)
          }
        }}
        preSelectedTournamentId={tournamentId}
        preSelectedMatch={selectedMatchForScore || undefined}
      />
      {isScoreCardModalOpen && selectedMatchForScoreCard && (
        <GenerateScoreCardModal
          isOpen={isScoreCardModalOpen}
          onClose={() => {
            setIsScoreCardModalOpen(false)
            setSelectedMatchForScoreCard(null)
          }}
          onGenerate={handleGenerateScoreCard}
          matchTitle={`${typeof selectedMatchForScoreCard.team1 === 'string' ? selectedMatchForScoreCard.team1 : selectedMatchForScoreCard.team1} vs ${typeof selectedMatchForScoreCard.team2 === 'string' ? selectedMatchForScoreCard.team2 : selectedMatchForScoreCard.team2}`}
        />
      )}
    </div>
  )
}
