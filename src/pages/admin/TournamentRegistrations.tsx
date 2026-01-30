import { Link, useParams, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../../lib/api'
import { generateBracketSchedule, type BracketType, type MatchScheduleDay } from '../../lib/matchScheduleGenerator'

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

type Stats = {
  total: number
  pending: number
  approved: number
  rejected: number
}

type TeamData = {
  name: string
  players: string[] // player IDs
}

type Match = {
  team1: string
  team2: string
  date: string
  time: string
  bracket?: 'winner' | 'loser'
  description?: string
}

type WizardState = {
  phase: 'idle' | 'player-count' | 'teams' | 'review-teams' | 'matches' | 'review-matches' | 'bracket-type' | 'bracket-preview'
  playersPerTeam: number
  numberOfTeams: number
  teamsData: TeamData[]
  currentTeamIndex: number
  matches: Match[]
  bracketType?: BracketType
  generatedSchedule?: MatchScheduleDay[]
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

  // Wizard State
  const [wizard, setWizard] = useState<WizardState>({
    phase: 'idle',
    playersPerTeam: 7,
    numberOfTeams: 2,
    teamsData: [],
    currentTeamIndex: 0,
    matches: [],
  })

  const [playerSearch, setPlayerSearch] = useState('')
  const [playerResults, setPlayerResults] = useState<Player[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [teamLoading, setTeamLoading] = useState(false)
  const [teamError, setTeamError] = useState<string | null>(null)

  // Match form state
  const [matchForm, setMatchForm] = useState({
    team1: '',
    team2: '',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
  })

  // Bracket preview view mode state
  const [bracketViewMode, setBracketViewMode] = useState<'visual' | 'table' | 'bracket'>('bracket')

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

  useEffect(() => {
    if (tournamentId) {
      fetchTeams(tournamentId)
      fetchMatches(tournamentId)
    }
  }, [tournamentId])

  // Handle player search
  const handlePlayerSearch = async (query: string) => {
    setPlayerSearch(query)
    if (!query.trim() || query.trim().length < 2) {
      setPlayerResults([])
      return
    }
    setSearchLoading(true)
    try {
      const res = await apiRequest<{ players: Player[] }>(
        `/admin/players/search?q=${encodeURIComponent(query)}`,
        { auth: true }
      )
      setPlayerResults(Array.isArray(res.players) ? res.players : [])
    } catch (e) {
      setPlayerResults([])
    } finally {
      setSearchLoading(false)
    }
  }

  // Wizard handlers
  const startTeamWizard = (playersPerTeam: number, numberOfTeams: number) => {
    const teamsData = Array(numberOfTeams)
      .fill(null)
      .map(() => ({
        name: '',
        players: [],
      }))
    setWizard({
      phase: 'teams',
      playersPerTeam,
      numberOfTeams,
      teamsData,
      currentTeamIndex: 0,
      matches: [],
    })
    setPlayerSearch('')
    setPlayerResults([])
    setTeamError(null)
  }

  const updateCurrentTeam = (updates: Partial<TeamData>) => {
    const updated = [...wizard.teamsData]
    updated[wizard.currentTeamIndex] = {
      ...updated[wizard.currentTeamIndex],
      ...updates,
    }
    setWizard({ ...wizard, teamsData: updated })
  }

  const addPlayerToTeam = (playerId: string) => {
    const currentTeam = wizard.teamsData[wizard.currentTeamIndex]
    if (currentTeam.players.length < wizard.playersPerTeam && !currentTeam.players.includes(playerId)) {
      updateCurrentTeam({
        players: [...currentTeam.players, playerId],
      })
      setPlayerSearch('')
      setPlayerResults([])
    }
  }

  const removePlayerFromTeam = (playerId: string) => {
    const currentTeam = wizard.teamsData[wizard.currentTeamIndex]
    updateCurrentTeam({
      players: currentTeam.players.filter(id => id !== playerId),
    })
  }

  const goToNextTeam = () => {
    if (wizard.currentTeamIndex < wizard.numberOfTeams - 1) {
      setWizard({
        ...wizard,
        currentTeamIndex: wizard.currentTeamIndex + 1,
      })
      setPlayerSearch('')
      setPlayerResults([])
    } else {
      setWizard({ ...wizard, phase: 'review-teams' })
    }
  }

  const goToPreviousTeam = () => {
    if (wizard.currentTeamIndex > 0) {
      setWizard({
        ...wizard,
        currentTeamIndex: wizard.currentTeamIndex - 1,
      })
      setPlayerSearch('')
      setPlayerResults([])
    }
  }

  const submitAllTeams = async () => {
    setTeamLoading(true)
    setTeamError(null)
    try {
      for (const teamData of wizard.teamsData) {
        if (!teamData.name.trim()) {
          throw new Error('All teams must have a name')
        }
        if (teamData.players.length === 0) {
          throw new Error('All teams must have at least one player')
        }
        await apiRequest<{ team: Team }>(
          `/admin/teams`,
          {
            method: 'POST',
            auth: true,
            body: JSON.stringify({
              tournamentId,
              name: teamData.name,
              maxMembers: wizard.playersPerTeam,
              memberIds: teamData.players,
            }),
          }
        )
      }
      if (tournamentId) fetchTeams(tournamentId)
      // Move to bracket type selection phase
      setWizard({
        phase: 'bracket-type',
        playersPerTeam: wizard.playersPerTeam,
        numberOfTeams: wizard.numberOfTeams,
        teamsData: wizard.teamsData,
        currentTeamIndex: 0,
        matches: [],
      })
    } catch (e) {
      setTeamError(e instanceof Error ? e.message : 'Failed to create teams')
    } finally {
      setTeamLoading(false)
    }
  }

  const cancelWizard = async () => {
    if (wizard.matches.length === 0) {
      alert('Please add at least one match')
      return
    }

    try {
      // Save all matches to the backend
      for (const match of wizard.matches) {
        await apiRequest<{ match: Match }>(
          `/admin/matches`,
          {
            method: 'POST',
            auth: true,
            body: JSON.stringify({
              tournamentId,
              team1: match.team1,
              team2: match.team2,
              date: match.date,
              time: match.time,
              bracket: match.bracket || 'winner',
              description: match.description || '',
            }),
          }
        )
      }

      // Reset wizard after 2 seconds
      setTimeout(() => {
        setWizard({
          phase: 'idle',
          playersPerTeam: 7,
          numberOfTeams: 2,
          teamsData: [],
          currentTeamIndex: 0,
          matches: [],
        })
        setPlayerSearch('')
        setPlayerResults([])
        setTeamError(null)
        setMatchForm({
          team1: '',
          team2: '',
          date: new Date().toISOString().split('T')[0],
          time: '10:00',
        })
      }, 2000)
    } catch (e) {
      alert('Failed to save matches: ' + (e instanceof Error ? e.message : 'Unknown error'))
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

  const approvePlayers = registrations.filter(r => r.status === 'approved' && r.registerAs === 'player')

  // ===== PLAYER COUNT STEP =====
  if (wizard.phase === 'player-count') {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#5a0a8f] to-[#400466] p-8 text-white">
            <h2 className="text-3xl font-black">Team Creation Wizard</h2>
            <p className="text-purple-100 text-sm mt-2">Let's set up your tournament teams</p>
          </div>

          {/* Content */}
          <div className="p-8 space-y-10">
            {/* Players per team */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold uppercase tracking-wide text-gray-700 mb-2">
                  Players per Team
                </label>
                <div className="text-5xl font-black text-[#5a0a8f] text-center mb-4">
                  {wizard.playersPerTeam}
                </div>
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => setWizard({ ...wizard, playersPerTeam: Math.max(1, wizard.playersPerTeam - 1) })}
                    className="w-14 h-14 rounded-xl bg-gray-100 hover:bg-red-100 text-gray-900 hover:text-red-600 font-bold text-2xl transition-all shadow-md"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={wizard.playersPerTeam}
                    onChange={(e) => {
                      const val = parseInt(e.target.value)
                      if (!isNaN(val) && val >= 1 && val <= 30) {
                        setWizard({ ...wizard, playersPerTeam: val })
                      }
                    }}
                    className="w-32 px-4 py-3 text-center text-2xl font-bold text-gray-900 bg-gray-50 border-2 border-[#5a0a8f] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5a0a8f] focus:bg-white placeholder-gray-400"
                  />
                  <button
                    onClick={() => setWizard({ ...wizard, playersPerTeam: Math.min(30, wizard.playersPerTeam + 1) })}
                    className="w-14 h-14 rounded-xl bg-gray-100 hover:bg-green-100 text-gray-900 hover:text-green-600 font-bold text-2xl transition-all shadow-md"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Number of teams */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold uppercase tracking-wide text-gray-700 mb-2">
                  Number of Teams
                </label>
                <div className="text-5xl font-black text-[#5a0a8f] text-center mb-4">
                  {wizard.numberOfTeams}
                </div>
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => setWizard({ ...wizard, numberOfTeams: Math.max(1, wizard.numberOfTeams - 1) })}
                    className="w-14 h-14 rounded-xl bg-gray-100 hover:bg-red-100 text-gray-900 hover:text-red-600 font-bold text-2xl transition-all shadow-md"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={wizard.numberOfTeams}
                    onChange={(e) => {
                      const val = parseInt(e.target.value)
                      if (!isNaN(val) && val >= 1 && val <= 20) {
                        setWizard({ ...wizard, numberOfTeams: val })
                      }
                    }}
                    className="w-32 px-4 py-3 text-center text-2xl font-bold text-gray-900 bg-gray-50 border-2 border-[#5a0a8f] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5a0a8f] focus:bg-white placeholder-gray-400"
                  />
                  <button
                    onClick={() => setWizard({ ...wizard, numberOfTeams: Math.min(20, wizard.numberOfTeams + 1) })}
                    className="w-14 h-14 rounded-xl bg-gray-100 hover:bg-green-100 text-gray-900 hover:text-green-600 font-bold text-2xl transition-all shadow-md"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="px-8 py-4 bg-blue-50 border-t border-blue-100">
            <p className="text-center text-blue-900 text-sm font-semibold">
              You will create <span className="font-black text-lg">{wizard.numberOfTeams}</span> teams with{' '}
              <span className="font-black text-lg">{wizard.playersPerTeam}</span> players each
            </p>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 flex items-center justify-between gap-3 bg-gray-50">
            <button
              onClick={cancelWizard}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 font-bold transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => startTeamWizard(wizard.playersPerTeam, wizard.numberOfTeams)}
              className="flex-1 px-8 py-3 bg-gradient-to-r from-[#5a0a8f] to-[#400466] hover:from-[#400466] hover:to-[#2d0333] text-white rounded-xl font-bold transition-all shadow-lg"
            >
              Continue →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ===== TEAM DETAILS STEP =====
  if (wizard.phase === 'teams') {
    const currentTeam = wizard.teamsData[wizard.currentTeamIndex]
    
    // Safety check to prevent blank page
    if (!currentTeam) {
      return (
        <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 text-center">
            <p className="text-gray-700 font-bold mb-4">Loading teams...</p>
            <button
              onClick={() => setWizard({ ...wizard, phase: 'idle', currentTeamIndex: 0 })}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go Back
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl my-8">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-[#5a0a8f] to-[#400466] p-6 text-white z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-3xl font-black">Create Teams</h2>
                <p className="text-purple-100 text-sm mt-1">Team {wizard.currentTeamIndex + 1} of {wizard.numberOfTeams}</p>
              </div>
              <button onClick={cancelWizard} className="text-purple-200 hover:text-white text-3xl">
                ✕
              </button>
            </div>
            <div className="flex-1 h-3 bg-purple-300 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all"
                style={{
                  width: `${((wizard.currentTeamIndex + 1) / wizard.numberOfTeams) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
            {/* Team Name */}
            <div className="space-y-3">
              <label className="block text-sm font-bold uppercase tracking-wide text-gray-700">Team Name</label>
              <input
                type="text"
                value={currentTeam.name}
                onChange={(e) => updateCurrentTeam({ name: e.target.value })}
                placeholder="e.g., Red Warriors, Phoenix Squad"
                className="w-full px-5 py-4 text-lg text-gray-900 bg-gray-50 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] focus:bg-white placeholder-gray-400 font-semibold"
              />
            </div>

            {/* Add Players Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-bold uppercase tracking-wide text-gray-700">
                  Add Players
                </label>
                <span className="text-sm font-bold text-[#5a0a8f] bg-purple-50 px-3 py-1 rounded-full">
                  {currentTeam.players.length}/{wizard.playersPerTeam}
                </span>
              </div>

              {/* Approved players list */}
              {approvePlayers.length > 0 && (
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200 max-h-48 overflow-y-auto">
                  <h4 className="font-bold text-blue-900 mb-3 text-sm uppercase tracking-wide">Registered Players</h4>
                  <div className="space-y-2">
                    {approvePlayers.map(r => (
                      <label
                        key={r._id}
                        className="flex items-center gap-3 p-3 hover:bg-blue-200 rounded-lg cursor-pointer transition-all"
                      >
                        <input
                          type="checkbox"
                          checked={currentTeam.players.includes(r.userId)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              addPlayerToTeam(r.userId)
                            } else {
                              removePlayerFromTeam(r.userId)
                            }
                          }}
                          disabled={
                            currentTeam.players.length >= wizard.playersPerTeam &&
                            !currentTeam.players.includes(r.userId)
                          }
                          className="w-5 h-5 cursor-pointer"
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">{r.applicant?.fullName}</div>
                          <div className="text-xs text-gray-600">{r.applicant?.district}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Search other players */}
              <div className="space-y-3">
                <input
                  type="text"
                  value={playerSearch}
                  onChange={(e) => handlePlayerSearch(e.target.value)}
                  placeholder="Search player by name or ID (min 2 chars)..."
                  className="w-full px-4 py-3 text-gray-900 bg-gray-50 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] focus:bg-white placeholder-gray-400 font-medium"
                />

                {playerSearch.trim().length > 0 && playerSearch.trim().length < 2 && (
                  <div className="text-center py-3 text-amber-700 bg-amber-50 rounded-lg font-semibold text-sm">
                    Type at least 2 characters to search
                  </div>
                )}

                {searchLoading && (
                  <div className="text-center py-4 text-gray-600 font-semibold">
                    <div className="inline-block animate-spin text-[#5a0a8f] text-xl">⟳</div> Searching...
                  </div>
                )}

                {playerResults.length > 0 && (
                  <div className="border-2 border-gray-300 rounded-xl bg-gradient-to-b from-gray-50 to-white max-h-40 overflow-y-auto">
                    {playerResults.map(p => (
                      <div
                        key={p._id}
                        onClick={() => addPlayerToTeam(p._id)}
                        className={`flex items-center gap-3 px-4 py-3 hover:bg-purple-50 cursor-pointer border-b last:border-b-0 transition-all ${
                          currentTeam.players.includes(p._id) ? 'bg-green-50' : ''
                        }`}
                      >
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">{p.fullName}</div>
                          <div className="text-xs text-gray-600">{p.playerId} • {p.district}</div>
                        </div>
                        {currentTeam.players.includes(p._id) ? (
                          <span className="text-green-600 font-black text-lg">✓</span>
                        ) : (
                          <span className="text-gray-300 font-bold">+</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Selected Players */}
            {currentTeam.players.length > 0 && (
              <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border-2 border-green-200">
                <h4 className="font-bold text-green-900 mb-4 text-sm uppercase tracking-wide">
                  Selected Players ({currentTeam.players.length}/{wizard.playersPerTeam})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {currentTeam.players.map((playerId, idx) => {
                    const regPlayer = approvePlayers.find(r => r.userId === playerId)
                    const directPlayer = playerResults.find(p => p._id === playerId)
                    const playerName = regPlayer?.applicant?.fullName || directPlayer?.fullName || 'Player'
                    return (
                      <div
                        key={idx}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white text-green-700 border-2 border-green-300 rounded-full font-semibold shadow-sm"
                      >
                        {playerName}
                        <button
                          onClick={() => removePlayerFromTeam(playerId)}
                          className="text-green-600 hover:text-green-800 font-black text-lg leading-none"
                        >
                          ×
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {teamError && (
              <div className="p-4 bg-red-100 border-2 border-red-300 rounded-xl text-red-700 font-semibold">
                {teamError}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t-2 border-gray-200 p-6 flex items-center justify-between gap-3">
            <button
              onClick={cancelWizard}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 font-bold transition-all"
            >
              Cancel
            </button>

            <div className="flex items-center gap-3 flex-1">
              {wizard.currentTeamIndex > 0 && (
                <button
                  onClick={goToPreviousTeam}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 font-bold transition-all"
                >
                  ← Previous
                </button>
              )}
              <button
                onClick={goToNextTeam}
                disabled={!currentTeam.name || currentTeam.players.length === 0}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-[#5a0a8f] to-[#400466] hover:from-[#400466] hover:to-[#2d0333] text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
              >
                {wizard.currentTeamIndex === wizard.numberOfTeams - 1 ? 'Review →' : 'Next Team →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ===== REVIEW TEAMS STEP =====
  if (wizard.phase === 'review-teams') {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#5a0a8f] to-[#400466] p-6 text-white">
            <h2 className="text-3xl font-black mb-2">Review Teams</h2>
            <p className="text-purple-100">Confirm all teams before creation</p>
          </div>

          {/* Teams List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {wizard.teamsData.map((team, idx) => (
              <div key={idx} className="p-5 border-2 border-gray-200 rounded-xl hover:border-[#5a0a8f] transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5a0a8f] to-[#400466] text-white font-bold flex items-center justify-center">
                    {idx + 1}
                  </div>
                  <h4 className="text-lg font-bold text-gray-900">{team.name || `Team ${idx + 1}`}</h4>
                  <span className="ml-auto px-3 py-1 bg-purple-100 text-[#5a0a8f] rounded-full text-sm font-bold">
                    {team.players.length} players
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {team.players.map((playerId, pidx) => {
                    const regPlayer = approvePlayers.find(r => r.userId === playerId)
                    const directPlayer = playerResults.find(p => p._id === playerId)
                    const playerName = regPlayer?.applicant?.fullName || directPlayer?.fullName || 'Player'
                    return (
                      <span key={pidx} className="px-3 py-1 bg-blue-100 text-blue-700 font-medium text-xs rounded-full">
                        {playerName}
                      </span>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {teamError && (
            <div className="px-6 py-4 bg-red-100 border-t-2 border-red-300 text-red-700 font-semibold">
              {teamError}
            </div>
          )}

          {/* Footer */}
          <div className="bg-gray-50 border-t-2 border-gray-200 p-6 flex items-center justify-between gap-3">
            <button
              onClick={() => setWizard({ ...wizard, phase: 'teams', currentTeamIndex: 0 })}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 font-bold transition-all"
            >
              ← Edit Teams
            </button>
            <button
              onClick={submitAllTeams}
              disabled={teamLoading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
            >
              {teamLoading ? 'Creating...' : 'Create Teams & Continue →'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ===== BRACKET TYPE SELECTION STEP =====
  if (wizard.phase === 'bracket-type') {
    const createdTeams = teams.length > 0 ? teams : []
    const bracketOptions: Array<{ type: BracketType; label: string; description: string }> = [
      {
        type: 'single-elimination',
        label: '1️⃣ Single Knockout (Single Elimination)',
        description: 'Pairing + recursive rounds. One loss and you\'re out. Fast-paced and dramatic. Winner takes all.',
      },
      {
        type: 'double-elimination',
        label: '2️⃣ Double Elimination',
        description: 'Two brackets: Winners + Losers + Grand Final. Teams get a second chance. Loser eliminated only after 2 losses.',
      },
      {
        type: 'round-robin',
        label: '3️⃣ Round Robin',
        description: 'Circle Method Algorithm. Every team plays every other team. Best for league-style competition.',
      },
      {
        type: 'custom',
        label: '✋ Manual Match Creation',
        description: 'Create matches manually. Full control over the schedule.',
      },
    ]

    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl my-8 flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#5a0a8f] to-[#400466] p-6 text-white">
            <h2 className="text-3xl font-black mb-2">🎯 Choose Tournament Format</h2>
            <p className="text-purple-100">Select how you want to organize the matches for {createdTeams.length} teams</p>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {bracketOptions.map((option) => (
              <button
                key={option.type}
                onClick={() => {
                  if (option.type === 'custom') {
                    // Go directly to manual match creation
                    setWizard({ ...wizard, phase: 'matches', bracketType: option.type })
                  } else {
                    // Generate the bracket
                    try {
                      const generatedSchedule = generateBracketSchedule(
                        option.type,
                        createdTeams.map((t) => t.name)
                      )
                      setWizard({
                        ...wizard,
                        phase: 'bracket-preview',
                        bracketType: option.type,
                        generatedSchedule,
                      })
                    } catch (err) {
                      alert(`Cannot generate ${option.type} bracket: ${err instanceof Error ? err.message : 'Unknown error'}`)
                    }
                  }
                }}
                className="w-full p-6 text-left border-2 border-gray-200 rounded-xl hover:border-[#5a0a8f] hover:bg-purple-50 transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-black text-gray-900 group-hover:text-[#5a0a8f] transition-colors mb-2">
                      {option.label}
                    </h3>
                    <p className="text-sm text-gray-600">{option.description}</p>
                  </div>
                  <div className="text-2xl group-hover:scale-110 transition-transform">→</div>
                </div>
              </button>
            ))}

            {/* Info Box */}
            <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
              <p className="text-sm text-blue-900">
                <span className="font-bold">💡 Tip:</span> For {createdTeams.length} teams, we recommend{' '}
                <span className="font-bold">
                  {createdTeams.length === 4 ? 'Double Elimination' : createdTeams.length <= 2 ? 'Single Knockout' : createdTeams.length > 6 ? 'Round Robin' : 'based on your preference'}
                </span>{' '}
                for the fairest competition.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 border-t-2 border-gray-200 p-6 flex items-center justify-between gap-3">
            <button
              onClick={() => setWizard({ ...wizard, phase: 'review-teams', generatedSchedule: undefined, bracketType: undefined })}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 font-bold transition-all"
            >
              ← Back
            </button>
            <button
              onClick={cancelWizard}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#5a0a8f] to-[#400466] hover:from-[#400466] hover:to-[#2d0333] text-white rounded-xl font-bold transition-all shadow-lg"
            >
              Skip & Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ===== BRACKET PREVIEW STEP =====
  if (wizard.phase === 'bracket-preview') {
    const schedule = wizard.generatedSchedule || []
    
    const formatTitle = () => {
      switch (wizard.bracketType) {
        case 'single-elimination':
          return 'Single Knockout (Single Elimination)'
        case 'double-elimination':
          return 'Double Elimination'
        case 'round-robin':
          return 'Round Robin'
        default:
          return 'Tournament'
      }
    }

    // Flatten schedule for table view
    const flatMatches = schedule.flatMap(day =>
      day.matches.map(match => ({
        ...match,
        day: day.day,
      }))
    )

    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl max-w-7xl w-full shadow-2xl my-8 flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#5a0a8f] to-[#400466] p-6 text-white">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-2">
              <h2 className="text-3xl font-black">📋 {formatTitle()} Bracket Preview</h2>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setBracketViewMode('bracket')}
                  className={`px-3 py-2 rounded-lg font-bold transition-all text-sm ${
                    bracketViewMode === 'bracket'
                      ? 'bg-white text-[#5a0a8f]'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  🎯 Bracket
                </button>
                <button
                  onClick={() => setBracketViewMode('visual')}
                  className={`px-3 py-2 rounded-lg font-bold transition-all text-sm ${
                    bracketViewMode === 'visual'
                      ? 'bg-white text-[#5a0a8f]'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  📊 Rounds
                </button>
                <button
                  onClick={() => setBracketViewMode('table')}
                  className={`px-3 py-2 rounded-lg font-bold transition-all text-sm ${
                    bracketViewMode === 'table'
                      ? 'bg-white text-[#5a0a8f]'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  📋 Table
                </button>
              </div>
            </div>
            <p className="text-purple-100">Review the auto-generated match schedule. You can still add/modify matches manually.</p>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {schedule.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No bracket generated. Please try again.</p>
              </div>
            ) : bracketViewMode === 'bracket' ? (
              /* BRACKET TREE VIEW */
              <div className="w-full">
                <div className="grid grid-cols-1 gap-8">
                  {/* For each round, display matches grouped */}
                  {schedule.map((round) => (
                    <div key={round.day} className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-0.5 bg-gradient-to-r from-transparent to-purple-300 flex-1"></div>
                        <span className="bg-gradient-to-r from-[#5a0a8f] to-[#400466] text-white px-4 py-2 rounded-full font-black text-sm">
                          Round {round.day}
                        </span>
                        <div className="h-0.5 bg-gradient-to-l from-transparent to-purple-300 flex-1"></div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {round.matches.map((match, idx) => (
                          <div
                            key={match.matchId}
                            className={`p-5 rounded-xl border-3 transition-all hover:shadow-xl ${
                              match.bracket === 'loser'
                                ? 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-400'
                                : 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-400'
                            }`}
                          >
                            {/* Badge */}
                            <div className="mb-3 flex items-center justify-between">
                              <span className={`text-xs font-black px-2 py-1 rounded ${
                                match.bracket === 'loser'
                                  ? 'bg-orange-300 text-orange-900'
                                  : 'bg-blue-300 text-blue-900'
                              }`}>
                                {match.bracket === 'loser' ? '🔻 LOSER' : '🏆 WINNER'}
                              </span>
                              <span className="text-xs font-bold text-gray-600">Match {idx + 1}</span>
                            </div>

                            {/* Teams */}
                            <div className="space-y-2">
                              <div className="bg-white border-2 border-gray-200 rounded-lg p-3 text-center">
                                <div className="font-black text-gray-800 text-sm break-words">
                                  {match.team1}
                                </div>
                              </div>

                              <div className="flex justify-center">
                                <span className="inline-block bg-gray-300 text-gray-700 px-3 py-1 rounded-full font-black text-xs">
                                  VS
                                </span>
                              </div>

                              <div className="bg-white border-2 border-gray-200 rounded-lg p-3 text-center">
                                <div className="font-black text-gray-800 text-sm break-words">
                                  {match.team2}
                                </div>
                              </div>
                            </div>

                            {/* Match ID */}
                            <div className="mt-3 pt-3 border-t text-center">
                              <span className="text-xs font-mono text-gray-600">{match.matchId}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : bracketViewMode === 'visual' ? (
              /* VISUAL ROUNDS VIEW */
              schedule.map((day) => (
                <div key={day.day} className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border-2 border-purple-200">
                  <h3 className="font-black text-purple-900 mb-4 text-lg">📅 Round {day.day}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {day.matches.map((match, idx) => (
                      <div
                        key={idx}
                        className={`p-4 bg-white rounded-lg border-2 transition-all hover:shadow-lg ${
                          match.bracket === 'loser' ? 'border-orange-300 bg-orange-50' : 'border-blue-300 bg-blue-50'
                        }`}
                      >
                        <div className="mb-3">
                          <span
                            className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${
                              match.bracket === 'loser' ? 'bg-orange-200 text-orange-900' : 'bg-blue-200 text-blue-900'
                            }`}
                          >
                            {match.bracket === 'loser' ? '🔻 Loser Bracket' : '🏆 Winner Bracket'}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-2 bg-white rounded border-2 border-gray-200">
                            <span className="font-bold text-gray-800 text-sm">{match.team1}</span>
                            <span className="text-xs font-bold text-gray-400">vs</span>
                          </div>
                          <div className="text-center">
                            <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded">
                              Match {idx + 1}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-white rounded border-2 border-gray-200">
                            <span className="font-bold text-gray-800 text-sm">{match.team2}</span>
                            <span className="text-xs font-bold text-gray-400">vs</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              /* EXCEL STYLE TABLE VIEW */
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-[#5a0a8f] to-[#400466] text-white">
                      <th className="border-2 border-gray-300 px-4 py-3 text-left font-black">Round</th>
                      <th className="border-2 border-gray-300 px-4 py-3 text-left font-black">Match #</th>
                      <th className="border-2 border-gray-300 px-4 py-3 text-left font-black">Team 1</th>
                      <th className="border-2 border-gray-300 px-4 py-3 text-center font-black">VS</th>
                      <th className="border-2 border-gray-300 px-4 py-3 text-left font-black">Team 2</th>
                      <th className="border-2 border-gray-300 px-4 py-3 text-left font-black">Bracket Type</th>
                      <th className="border-2 border-gray-300 px-4 py-3 text-left font-black">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flatMatches.map((match, idx) => (
                      <tr
                        key={idx}
                        className={`${
                          idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        } hover:bg-yellow-100 transition-colors`}
                      >
                        <td className="border-2 border-gray-300 px-4 py-3 font-bold text-gray-700">
                          {match.day}
                        </td>
                        <td className="border-2 border-gray-300 px-4 py-3 font-bold text-gray-700">
                          {schedule.find(d => d.day === match.day)?.matches.indexOf(
                            schedule.find(d => d.day === match.day)?.matches.find(m => m.matchId === match.matchId)!
                          )! + 1}
                        </td>
                        <td className="border-2 border-gray-300 px-4 py-3">
                          <span className="inline-block bg-blue-200 text-blue-900 px-3 py-1 rounded font-semibold text-sm">
                            {match.team1}
                          </span>
                        </td>
                        <td className="border-2 border-gray-300 px-4 py-3 text-center">
                          <span className="font-black text-[#5a0a8f]">VS</span>
                        </td>
                        <td className="border-2 border-gray-300 px-4 py-3">
                          <span className="inline-block bg-orange-200 text-orange-900 px-3 py-1 rounded font-semibold text-sm">
                            {match.team2}
                          </span>
                        </td>
                        <td className="border-2 border-gray-300 px-4 py-3">
                          <span
                            className={`inline-block px-3 py-1 rounded font-bold text-xs ${
                              match.bracket === 'loser'
                                ? 'bg-orange-200 text-orange-900'
                                : 'bg-blue-200 text-blue-900'
                            }`}
                          >
                            {match.bracket === 'loser' ? '🔻 Loser' : '🏆 Winner'}
                          </span>
                        </td>
                        <td className="border-2 border-gray-300 px-4 py-3 text-xs text-gray-600">
                          {match.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Info */}
            <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl mt-6">
              <p className="text-sm text-green-900">
                <span className="font-bold">✅ Note:</span> This is an auto-generated bracket template. You can still add or modify matches manually after confirming.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 border-t-2 border-gray-200 p-6 flex items-center justify-between gap-3">
            <button
              onClick={() => setWizard({ ...wizard, phase: 'bracket-type', generatedSchedule: undefined, bracketType: undefined })}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 font-bold transition-all"
            >
              ← Back
            </button>
            
            {/* Export Dropdown */}
            <div className="relative group">
              <button className="flex-1 px-6 py-3 border-2 border-blue-400 text-blue-700 rounded-xl hover:bg-blue-50 font-bold transition-all flex items-center justify-center gap-2 min-w-[140px]">
                📥 Export
                <span className="text-xs">▼</span>
              </button>
              <div className="hidden group-hover:block absolute right-0 top-full mt-1 bg-white border-2 border-blue-400 rounded-lg shadow-xl z-10 min-w-[150px]">
                <button
                  onClick={() => {
                    const exportData = {
                      tournament: 'Tournament',
                      format: formatTitle(),
                      teamCount: teams.length,
                      teams: teams.map(t => t.name),
                      matches: flatMatches.map((m, idx) => ({
                        round: m.day,
                        matchNumber: idx + 1,
                        team1: m.team1,
                        team2: m.team2,
                        bracketType: m.bracket === 'loser' ? 'Loser Bracket' : 'Winner Bracket',
                      })),
                    }
                    // Dynamic import to avoid issues
                    import('../../lib/tournamentExport.ts').then(mod => {
                      mod.downloadAsCSV(exportData, `tournament-schedule-${Date.now()}.csv`)
                    })
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-blue-100 text-gray-800 font-semibold text-sm border-b"
                >
                  📊 CSV
                </button>
                <button
                  onClick={() => {
                    const exportData = {
                      tournament: 'Tournament',
                      format: formatTitle(),
                      teamCount: teams.length,
                      teams: teams.map(t => t.name),
                      matches: flatMatches.map((m, idx) => ({
                        round: m.day,
                        matchNumber: idx + 1,
                        team1: m.team1,
                        team2: m.team2,
                        bracketType: m.bracket === 'loser' ? 'Loser Bracket' : 'Winner Bracket',
                      })),
                    }
                    import('../../lib/tournamentExport.ts').then(mod => {
                      mod.downloadAsHTML(exportData, `tournament-schedule-${Date.now()}.html`)
                    })
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-blue-100 text-gray-800 font-semibold text-sm border-b"
                >
                  📋 Excel/HTML
                </button>
                <button
                  onClick={() => {
                    const exportData = {
                      tournament: 'Tournament',
                      format: formatTitle(),
                      teamCount: teams.length,
                      teams: teams.map(t => t.name),
                      matches: flatMatches.map((m, idx) => ({
                        round: m.day,
                        matchNumber: idx + 1,
                        team1: m.team1,
                        team2: m.team2,
                        bracketType: m.bracket === 'loser' ? 'Loser Bracket' : 'Winner Bracket',
                      })),
                    }
                    import('../../lib/tournamentExport.ts').then(mod => {
                      mod.downloadAsJSON(exportData, `tournament-schedule-${Date.now()}.json`)
                    })
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-blue-100 text-gray-800 font-semibold text-sm"
                >
                  📱 JSON
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                // Convert schedule to matches with actual team IDs and descriptions
                // For bracket formats, include ALL matches even with placeholder names
                const matches: Match[] = []
                const createdTeams = teams.length > 0 ? teams : []
                
                // Create a mapping of team names to team IDs
                const teamNameToId = new Map<string, string>()
                createdTeams.forEach((team) => {
                  teamNameToId.set(team.name, team._id)
                })
                
                console.log('Teams created:', createdTeams.map(t => ({ name: t.name, id: t._id })))
                
                // Generate matches with actual team IDs or placeholder names
                // Include ALL matches from the schedule (both actual and placeholder)
                for (const day of schedule) {
                  for (const scheduleMatch of day.matches) {
                    const team1Name = scheduleMatch.team1
                    const team2Name = scheduleMatch.team2
                    
                    // Try to map actual team names to IDs
                    let team1Id = teamNameToId.get(team1Name)
                    let team2Id = teamNameToId.get(team2Name)
                    
                    // For placeholder teams that don't have actual IDs, use the team name as ID
                    // This will be stored as a reference that can be updated later
                    if (!team1Id) {
                      team1Id = team1Name // Use team name as placeholder ID
                    }
                    
                    if (!team2Id) {
                      team2Id = team2Name // Use team name as placeholder ID
                    }
                    
                    matches.push({
                      team1: team1Id,
                      team2: team2Id,
                      date: new Date(new Date().getTime() + (day.day - 1) * 24 * 60 * 60 * 1000)
                        .toISOString()
                        .split('T')[0],
                      time: matchForm.time,
                      bracket: scheduleMatch.bracket,
                      description: scheduleMatch.description,
                    })
                  }
                }
                
                console.log('Final matches to save:', matches)
                
                setWizard({
                  ...wizard,
                  phase: 'matches',
                  matches,
                })
              }}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl font-bold transition-all shadow-lg"
            >
              ✅ Use This Schedule →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ===== MATCH SCHEDULE STEP =====
  if (wizard.phase === 'matches') {
    const createdTeams = teams.length > 0 ? teams : []

    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl my-8 flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#5a0a8f] to-[#400466] p-6 text-white">
            <h2 className="text-3xl font-black mb-2">⏰ Set Match Times & Dates</h2>
            <p className="text-purple-100">Edit the date and time for each match, then save</p>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {wizard.matches.length > 0 ? (
              <div className="space-y-6">
                {/* Matches Table with Editable Fields */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gradient-to-r from-[#5a0a8f] to-[#400466] text-white">
                        <th className="border-2 border-gray-300 px-4 py-3 text-left font-black">Match</th>
                        <th className="border-2 border-gray-300 px-4 py-3 text-left font-black">Team 1</th>
                        <th className="border-2 border-gray-300 px-4 py-3 text-center font-black">VS</th>
                        <th className="border-2 border-gray-300 px-4 py-3 text-left font-black">Team 2</th>
                        <th className="border-2 border-gray-300 px-4 py-3 text-left font-black">📅 Date</th>
                        <th className="border-2 border-gray-300 px-4 py-3 text-left font-black">⏰ Time</th>
                        <th className="border-2 border-gray-300 px-4 py-3 text-left font-black">Bracket</th>
                      </tr>
                    </thead>
                    <tbody>
                      {wizard.matches.map((match, idx) => {
                        // Try to get actual team names, fallback to the string (might be placeholder like "Loser(L vs A)")
                        const team1 = createdTeams.find(t => t._id === match.team1)?.name || match.team1
                        const team2 = createdTeams.find(t => t._id === match.team2)?.name || match.team2
                        const isPlaceholderTeam = typeof match.team1 === 'string' && (match.team1.startsWith('Winner') || match.team1.startsWith('Loser') || match.team1.startsWith('Runner-up') || match.team1.startsWith('Champion'))
                        
                        return (
                          <tr key={idx} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                            <td className="border-2 border-gray-300 px-4 py-3 font-bold text-gray-700">
                              #{idx + 1}
                            </td>
                            <td className="border-2 border-gray-300 px-4 py-3">
                              <span className={`inline-block px-3 py-1 rounded text-sm font-semibold ${
                                isPlaceholderTeam ? 'bg-gray-200 text-gray-900' : 'bg-blue-200 text-blue-900'
                              }`}>
                                {team1}
                              </span>
                            </td>
                            <td className="border-2 border-gray-300 px-4 py-3 text-center font-black text-[#5a0a8f]">
                              VS
                            </td>
                            <td className="border-2 border-gray-300 px-4 py-3">
                              <span className={`inline-block px-3 py-1 rounded text-sm font-semibold ${
                                isPlaceholderTeam ? 'bg-gray-200 text-gray-900' : 'bg-orange-200 text-orange-900'
                              }`}>
                                {team2}
                              </span>
                            </td>
                            <td className="border-2 border-gray-300 px-4 py-3">
                              <input
                                type="date"
                                value={match.date || ''}
                                placeholder={new Date().toISOString().split('T')[0]}
                                onChange={(e) => {
                                  const updatedMatches = [...wizard.matches]
                                  updatedMatches[idx] = { ...match, date: e.target.value }
                                  setWizard({ ...wizard, matches: updatedMatches })
                                }}
                                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5a0a8f] font-semibold text-gray-900"
                              />
                              {!match.date && <span className="text-xs text-gray-500 ml-1">Set date</span>}
                            </td>
                            <td className="border-2 border-gray-300 px-4 py-3">
                              <input
                                type="time"
                                value={match.time || '10:00'}
                                onChange={(e) => {
                                  const updatedMatches = [...wizard.matches]
                                  updatedMatches[idx] = { ...match, time: e.target.value }
                                  setWizard({ ...wizard, matches: updatedMatches })
                                }}
                                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5a0a8f] font-semibold text-gray-900"
                              />
                            </td>
                            <td className="border-2 border-gray-300 px-4 py-3">
                              <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                                match.bracket === 'loser'
                                  ? 'bg-orange-200 text-orange-900'
                                  : 'bg-blue-200 text-blue-900'
                              }`}>
                                {match.bracket === 'loser' ? '🔻 Loser' : '🏆 Winner'}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Note */}
                <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg text-sm text-green-900 font-semibold">
                  ✅ Edit the date and time for each match above, then click "Save & Close" to create the tournament
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg font-semibold">No matches found</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t-2 border-gray-200 p-6 bg-gray-50 flex gap-4">
            <button
              onClick={() => {
                setWizard({
                  ...wizard,
                  phase: 'bracket-preview',
                  matches: [],
                })
              }}
              className="flex-1 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition-all"
            >
              ← Back
            </button>
            <button
              onClick={() => {
                // Save all matches to the backend
                if (wizard.matches.length === 0) {
                  alert('Please add at least one match')
                  return
                }

                (async () => {
                  try {
                    // Save each match to the backend
                    for (const match of wizard.matches) {
                      await apiRequest<{ match: Match }>(
                        `/admin/matches`,
                        {
                          method: 'POST',
                          auth: true,
                          body: JSON.stringify({
                            tournamentId,
                            team1: match.team1,
                            team2: match.team2,
                            date: match.date,
                            time: match.time,
                            bracket: match.bracket || 'winner',
                            description: match.description || '',
                          }),
                        }
                      )
                    }

                    // Success! Show match schedule view
                    alert(`✅ Successfully created ${wizard.matches.length} match${wizard.matches.length > 1 ? 'es' : ''}!`)
                    
                    // Reset wizard state to show main registrations view
                    setWizard({
                      phase: 'idle',
                      playersPerTeam: 7,
                      numberOfTeams: 2,
                      teamsData: [],
                      currentTeamIndex: 0,
                      matches: [],
                    })
                    setPlayerSearch('')
                    setPlayerResults([])
                    setTeamError(null)
                    setMatchForm({
                      team1: '',
                      team2: '',
                      date: new Date().toISOString().split('T')[0],
                      time: '10:00',
                    })
                    
                    // Refresh the page data after a brief delay to ensure backend has processed
                    setTimeout(() => {
                      window.location.href = window.location.href
                    }, 500)
                  } catch (e) {
                    alert('Failed to save matches: ' + (e instanceof Error ? e.message : 'Unknown error'))
                  }
                })()
              }}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#5a0a8f] to-[#400466] hover:from-[#400466] hover:to-[#2d0333] text-white rounded-xl font-bold transition-all shadow-lg"
            >
              ✅ Save & Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ===== MAIN PAGE UI =====
  return (
    <div className="space-y-6">
      {/* Team Management Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Team Management</h2>
          <button
            onClick={() => {
              if (teams.length > 0) {
                // If teams exist, go to bracket type selection
                setWizard({
                  ...wizard,
                  phase: 'bracket-type',
                  matches: [],
                })
              } else {
                // Otherwise start from the beginning
                setWizard({ ...wizard, phase: 'player-count' })
              }
            }}
            className="px-6 py-3 bg-[#5a0a8f] hover:bg-[#400466] text-white rounded-lg font-bold transition-colors"
          >
            {teams.length > 0 ? '+ Create Match Schedule' : '+ Create Teams & Schedule'}
          </button>
        </div>

        {/* Teams Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">Team Name</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">Members</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">Capacity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {teams.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                    No teams created yet. Click "Create Teams & Schedule" to get started.
                  </td>
                </tr>
              ) : (
                teams.map(team => (
                  <tr key={team._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold text-gray-900">{team.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{team.members.map(m => m.name).join(', ')}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium text-sm">
                        {team.members.length}/{team.maxMembers}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Match Schedule Section */}
      {matches.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">📅 Match Schedule</h2>
            <button
              onClick={() => {
                setWizard({
                  ...wizard,
                  phase: 'bracket-type',
                  matches: [],
                })
              }}
              className="px-6 py-3 bg-[#5a0a8f] hover:bg-[#400466] text-white rounded-lg font-bold transition-colors"
            >
              ✏️ Edit Schedule
            </button>
          </div>

          {/* Matches Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">Match #</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">Team 1</th>
                  <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wide text-gray-700">VS</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">Team 2</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">📅 Date</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">⏰ Time</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">Bracket</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {matches.map((match, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold text-gray-900">#{idx + 1}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{match.team1}</td>
                    <td className="px-6 py-4 text-center font-bold text-purple-600">VS</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{match.team2}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(match.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{match.time}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full font-medium text-sm ${
                        match.bracket === 'winner' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {match.bracket === 'winner' ? '🏆 Winner' : '🔻 Loser'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Match Details */}
          {matches.some(m => m.description) && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">Match Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matches.map((match, idx) => 
                  match.description ? (
                    <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                      <div className="font-semibold text-gray-900 mb-2">Match #{idx + 1}</div>
                      <div className="text-sm text-gray-600">{match.description}</div>
                    </div>
                  ) : null
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Registrations Section */}
      <div>
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
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">{tournament.title} - Registrations</h1>
              <p className="text-gray-600">
                Manage players and coaches who have applied for this tournament. Review and approve/reject applications.
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
          <div className="bg-gradient-to-r from-[#5a0a8f] to-[#400466] rounded-xl p-6 text-white mb-6">
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
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
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
                          className={`px-2 py-1 text-xs font-bold rounded ${
                            tr.registerAs === 'player'
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
                          className={`px-2 py-1 text-xs font-bold rounded ${
                            tr.status === 'approved'
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
      </div>
    </div>
  )
}
