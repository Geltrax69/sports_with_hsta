import { apiRequest } from './api'

export type LiveTimeout = {
  team: 'team1' | 'team2'
  teamName: string
  at: string
}

export type LiveMatch = {
  id: string
  tournamentId: string
  tournamentTitle: string
  matchTitle: string
  team1: string
  team2: string
  status: string
  score: { team1: number; team2: number }
  activeRegu: string | null
  activeSet: number | null
  setScore: { team1: number; team2: number } | null
  timeout: LiveTimeout | null
  updatedAt?: string
}

export async function fetchLiveMatches(): Promise<LiveMatch[]> {
  const res = await apiRequest<{ matches: LiveMatch[] }>('/tournaments/live-matches')
  return Array.isArray(res.matches) ? res.matches : []
}
