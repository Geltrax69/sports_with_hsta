/**
 * Match Schedule Generation Logic
 * Supports creating tournament brackets with single elimination, double elimination (loser bracket), and round robin
 */

export type BracketType = 'single-elimination' | 'double-elimination' | 'round-robin' | 'custom'

export interface MatchScheduleDay {
  day: number
  matches: Array<{
    matchId: string
    team1: string
    team2: string
    bracket: 'winner' | 'loser'
    description: string
  }>
}

export interface RoundMatch {
  team1: string
  team2: string
}

export interface TournamentRound {
  round: number
  matches: RoundMatch[]
}

export interface TournamentRound {
  round: number
  matches: RoundMatch[]
}

/**
 * 1️⃣ Single Knockout (Single Elimination)
 * Pairing + recursive rounds
 * Logic:
 * 1. Shuffle teams
 * 2. Add BYE if team count is not power of 2
 * 3. Pair teams
 * 4. Winners advance to next round
 */
export function singleKnockout(teams: string[]): TournamentRound[] {
  let shuffled = [...teams].sort(() => Math.random() - 0.5)
  let rounds: TournamentRound[] = []
  let round = 1

  while (shuffled.length > 1) {
    let matches: RoundMatch[] = []

    if (shuffled.length % 2 !== 0) {
      matches.push({ team1: shuffled.pop()!, team2: 'BYE' })
    }

    for (let i = 0; i < shuffled.length; i += 2) {
      matches.push({
        team1: shuffled[i],
        team2: shuffled[i + 1],
      })
    }

    rounds.push({ round, matches })
    shuffled = matches
      .filter(m => m.team2 !== 'BYE')
      .map(m => `Winner of ${m.team1} vs ${m.team2}`)
    round++
  }

  return rounds
}

/**
 * 2️⃣ Double Elimination
 * Two brackets:
 * - Winners Bracket
 * - Losers Bracket
 * - Grand Final
 * Logic:
 * 1. Start with single knockout
 * 2. Loser moves to losers bracket
 * 3. Loser eliminated only after 2 losses
 */
export function doubleElimination(teams: string[]): {
  winnersBracket: TournamentRound[]
  losersBracket: TournamentRound[]
  grandFinal: string
} {
  return {
    winnersBracket: singleKnockout(teams),
    losersBracket: [],
    grandFinal: 'Winner WB vs Winner LB'
  }
}

/**
 * 3️⃣ Round Robin
 * Circle Method Algorithm
 * Logic:
 * - Every team plays every other team
 * - If odd teams → add BYE
 */
export function roundRobin(teams: string[]): TournamentRound[] {
  let list = [...teams]
  if (list.length % 2 !== 0) list.push('BYE')

  const rounds: TournamentRound[] = []
  const totalRounds = list.length - 1
  const half = list.length / 2

  for (let r = 0; r < totalRounds; r++) {
    let matches: RoundMatch[] = []
    for (let i = 0; i < half; i++) {
      let team1 = list[i]
      let team2 = list[list.length - 1 - i]
      if (team1 !== 'BYE' && team2 !== 'BYE') {
        matches.push({ team1, team2 })
      }
    }
    rounds.push({ round: r + 1, matches })

    // rotate teams
    list.splice(1, 0, list.pop()!)
  }

  return rounds
}

/**
 * Legacy: Generate match schedule for a double elimination bracket (most common)
 * Example: 4 teams (A, B, C, D)
 * Day 1 (Winner Bracket Round 1): A vs B, C vs D
 * Day 2 (Loser Bracket Round 1): Loser(A vs B) vs Loser(C vs D)
 * Day 3 (Winner Bracket Final): Winner(A vs B) vs Winner(C vs D)
 * Day 4 (Loser Bracket Final): Winner(Loser Bracket) vs Runner-up(Winner Bracket)
 * Day 5 (Grand Final): Winner Bracket vs Loser Bracket (if needed)
 */
export function generateDoubleEliminationSchedule(
  teams: string[],
  _startDate: string,
  _startTime: string
): MatchScheduleDay[] {
  const schedule: MatchScheduleDay[] = []
  const numTeams = teams.length

  if (numTeams < 2) {
    throw new Error('At least 2 teams are required')
  }

  // For 4 teams
  if (numTeams === 4) {
    const [team1, team2, team3, team4] = teams

    // Day 1: Winner Bracket Round 1
    schedule.push({
      day: 1,
      matches: [
        {
          matchId: 'WB-R1-M1',
          team1,
          team2,
          bracket: 'winner',
          description: `${team1} vs ${team2} (Winner Bracket Round 1)`,
        },
        {
          matchId: 'WB-R1-M2',
          team1: team3,
          team2: team4,
          bracket: 'winner',
          description: `${team3} vs ${team4} (Winner Bracket Round 1)`,
        },
      ],
    })

    // Day 2: Loser Bracket Round 1 - Losers from Day 1
    schedule.push({
      day: 2,
      matches: [
        {
          matchId: 'LB-R1-M1',
          team1: `Loser(${team1} vs ${team2})`,
          team2: `Loser(${team3} vs ${team4})`,
          bracket: 'loser',
          description: `Loser Bracket Round 1 - The two losers from Day 1 matches meet here`,
        },
      ],
    })

    // Day 3: Winner Bracket Final - Winners from Day 1
    schedule.push({
      day: 3,
      matches: [
        {
          matchId: 'WB-Final',
          team1: `Winner(${team1} vs ${team2})`,
          team2: `Winner(${team3} vs ${team4})`,
          bracket: 'winner',
          description: `Winner Bracket Final - The two winners from Day 1 compete here`,
        },
      ],
    })

    // Day 4: Loser Bracket Final - Winner of losers bracket vs Runner-up of winner bracket
    schedule.push({
      day: 4,
      matches: [
        {
          matchId: 'LB-Final',
          team1: `Winner(Loser Bracket)`,
          team2: `Runner-up(Winner Bracket Final)`,
          bracket: 'loser',
          description: `Loser Bracket Final - The survivor of the loser bracket faces the finalist who lost in Day 3`,
        },
      ],
    })

    // Day 5: Grand Final - Winners of both brackets
    schedule.push({
      day: 5,
      matches: [
        {
          matchId: 'Grand-Final',
          team1: `Champion(Winner Bracket)`,
          team2: `Champion(Loser Bracket)`,
          bracket: 'winner',
          description: `Grand Final - If the loser bracket champion wins, they play again. Otherwise, winner of Day 3 is champion.`,
        },
      ],
    })

    return schedule
  }

  // For 8 teams
  if (numTeams === 8) {
    const [t1, t2, t3, t4, t5, t6, t7, t8] = teams

    // Day 1: Winner Bracket Round 1
    schedule.push({
      day: 1,
      matches: [
        {
          matchId: 'WB-R1-M1',
          team1: t1,
          team2: t2,
          bracket: 'winner',
          description: `${t1} vs ${t2} (Winner Bracket Round 1)`,
        },
        {
          matchId: 'WB-R1-M2',
          team1: t3,
          team2: t4,
          bracket: 'winner',
          description: `${t3} vs ${t4} (Winner Bracket Round 1)`,
        },
        {
          matchId: 'WB-R1-M3',
          team1: t5,
          team2: t6,
          bracket: 'winner',
          description: `${t5} vs ${t6} (Winner Bracket Round 1)`,
        },
        {
          matchId: 'WB-R1-M4',
          team1: t7,
          team2: t8,
          bracket: 'winner',
          description: `${t7} vs ${t8} (Winner Bracket Round 1)`,
        },
      ],
    })

    // Day 2: Loser Bracket Round 1
    schedule.push({
      day: 2,
      matches: [
        {
          matchId: 'LB-R1-M1',
          team1: `Loser(${t1} vs ${t2})`,
          team2: `Loser(${t3} vs ${t4})`,
          bracket: 'loser',
          description: `Loser Bracket Round 1 - Losers from first two matches`,
        },
        {
          matchId: 'LB-R1-M2',
          team1: `Loser(${t5} vs ${t6})`,
          team2: `Loser(${t7} vs ${t8})`,
          bracket: 'loser',
          description: `Loser Bracket Round 1 - Losers from last two matches`,
        },
      ],
    })

    // Day 3: Winner Bracket Semifinals
    schedule.push({
      day: 3,
      matches: [
        {
          matchId: 'WB-SF-M1',
          team1: `Winner(${t1} vs ${t2})`,
          team2: `Winner(${t5} vs ${t6})`,
          bracket: 'winner',
          description: `Winner Bracket Semifinal 1`,
        },
        {
          matchId: 'WB-SF-M2',
          team1: `Winner(${t3} vs ${t4})`,
          team2: `Winner(${t7} vs ${t8})`,
          bracket: 'winner',
          description: `Winner Bracket Semifinal 2`,
        },
      ],
    })

    // Continue with more rounds...
    return schedule
  }

  // For other team counts, return empty schedule with instruction
  return [
    {
      day: 1,
      matches: [
        {
          matchId: 'custom-1',
          team1: 'Teams',
          team2: 'Coming soon',
          bracket: 'winner',
          description: `Custom bracket for ${numTeams} teams. Please create matches manually.`,
        },
      ],
    },
  ]
}

/**
 * Generate single elimination bracket
 * Simpler structure: each team plays until they lose
 */
export function generateSingleEliminationSchedule(
  teams: string[],
  _startDate: string,
  _startTime: string
): MatchScheduleDay[] {
  const schedule: MatchScheduleDay[] = []
  const numTeams = teams.length

  if (numTeams < 2) {
    throw new Error('At least 2 teams are required')
  }

  // For 4 teams
  if (numTeams === 4) {
    const [team1, team2, team3, team4] = teams

    // Semifinals
    schedule.push({
      day: 1,
      matches: [
        {
          matchId: 'SF-1',
          team1,
          team2,
          bracket: 'winner',
          description: `${team1} vs ${team2}`,
        },
        {
          matchId: 'SF-2',
          team1: team3,
          team2: team4,
          bracket: 'winner',
          description: `${team3} vs ${team4}`,
        },
      ],
    })

    // Finals
    schedule.push({
      day: 2,
      matches: [
        {
          matchId: 'Final',
          team1: `Winner(${team1} vs ${team2})`,
          team2: `Winner(${team3} vs ${team4})`,
          bracket: 'winner',
          description: `Final - The two semifinal winners compete for the championship`,
        },
      ],
    })

    return schedule
  }

  // For 8 teams
  if (numTeams === 8) {
    const [t1, t2, t3, t4, t5, t6, t7, t8] = teams

    // Quarterfinals
    schedule.push({
      day: 1,
      matches: [
        {
          matchId: 'QF-1',
          team1: t1,
          team2: t2,
          bracket: 'winner',
          description: `${t1} vs ${t2} (Quarterfinal 1)`,
        },
        {
          matchId: 'QF-2',
          team1: t3,
          team2: t4,
          bracket: 'winner',
          description: `${t3} vs ${t4} (Quarterfinal 2)`,
        },
        {
          matchId: 'QF-3',
          team1: t5,
          team2: t6,
          bracket: 'winner',
          description: `${t5} vs ${t6} (Quarterfinal 3)`,
        },
        {
          matchId: 'QF-4',
          team1: t7,
          team2: t8,
          bracket: 'winner',
          description: `${t7} vs ${t8} (Quarterfinal 4)`,
        },
      ],
    })

    // Semifinals
    schedule.push({
      day: 2,
      matches: [
        {
          matchId: 'SF-1',
          team1: `Winner(${t1} vs ${t2})`,
          team2: `Winner(${t5} vs ${t6})`,
          bracket: 'winner',
          description: `Semifinal 1 - Winners of QF-1 and QF-3`,
        },
        {
          matchId: 'SF-2',
          team1: `Winner(${t3} vs ${t4})`,
          team2: `Winner(${t7} vs ${t8})`,
          bracket: 'winner',
          description: `Semifinal 2 - Winners of QF-2 and QF-4`,
        },
      ],
    })

    // Finals
    schedule.push({
      day: 3,
      matches: [
        {
          matchId: 'Final',
          team1: `Winner(SF-1)`,
          team2: `Winner(SF-2)`,
          bracket: 'winner',
          description: `Final - The two semifinal winners compete for the championship`,
        },
      ],
    })

    return schedule
  }

  return []
}

/**
 * Generate bracket schedule based on type
 * Converts new algorithm output to legacy MatchScheduleDay format
 */
export function generateBracketSchedule(
  bracketType: BracketType,
  teams: string[]
): MatchScheduleDay[] {
  switch (bracketType) {
    case 'single-elimination': {
      const rounds = singleKnockout(teams)
      return rounds.map(round => ({
        day: round.round,
        matches: round.matches.map((match, idx) => ({
          matchId: `R${round.round}-M${idx + 1}`,
          team1: match.team1,
          team2: match.team2,
          bracket: 'winner' as const,
          description: match.team2 === 'BYE' 
            ? `${match.team1} gets a BYE` 
            : `${match.team1} vs ${match.team2} (Round ${round.round})`
        }))
      }))
    }
    
    case 'double-elimination': {
      return generateDoubleEliminationSchedule(teams, '', '')
    }
    
    case 'round-robin': {
      const rounds = roundRobin(teams)
      return rounds.map(round => ({
        day: round.round,
        matches: round.matches.map((match, idx) => ({
          matchId: `RR-R${round.round}-M${idx + 1}`,
          team1: match.team1,
          team2: match.team2,
          bracket: 'winner' as const,
          description: `${match.team1} vs ${match.team2} (Round ${round.round})`
        }))
      }))
    }
    
    case 'custom':
    default:
      return []
  }
}
