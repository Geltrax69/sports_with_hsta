import { apiRequest } from './api'

export type LiveTimeout = {
  team: 'team1' | 'team2'
  teamName: string
  at: string
}

export type LiveSetData = {
  setNumber: number
  team1Score: number
  team2Score: number
  winner: 'team1' | 'team2' | null
  team1Timeouts: string[]
  team2Timeouts: string[]
}

export type LiveReguData = {
  reguName: string
  /** Sets won within this regu */
  team1Score: number
  team2Score: number
  winner: 'team1' | 'team2' | null
  sets: LiveSetData[]
}

export type LiveSubstitution = {
  reguName: string
  team: 'team1' | 'team2'
  teamLabel: string
  playerInName: string
  playerInJerseyNumber: number | null
  playerOutName: string
  playerOutJerseyNumber: number | null
}

export type LiveMatch = {
  id: string
  tournamentId: string
  tournamentTitle: string
  matchTitle: string
  team1: string
  team2: string
  status: 'ongoing' | 'completed' | string
  winner: 'team1' | 'team2' | 'tie' | null
  score: { team1: number; team2: number }
  activeRegu: string | null
  activeSet: number | null
  setScore: { team1: number; team2: number } | null
  timeout: LiveTimeout | null
  regus: LiveReguData[]
  substitutions: LiveSubstitution[]
  updatedAt?: string
}

export async function fetchLiveMatches(signal?: AbortSignal): Promise<LiveMatch[]> {
  const res = await apiRequest<{ matches: LiveMatch[] }>('/tournaments/live-matches', { signal })
  return Array.isArray(res.matches) ? res.matches : []
}
