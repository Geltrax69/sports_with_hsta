export type PlayerType = 'national' | 'international'

export type TournamentResult = 'GOLD' | 'SILVER' | 'BRONZE'

export type DirectoryPlayerTournament = {
  _id?: string
  eventName: string
  year: number
  category: string
  team: string
  result: TournamentResult
}

export type DirectoryPlayer = {
  _id?: string
  id: string
  playerId?: string
  playerType: PlayerType
  name: string
  role: string
  state: string
  rank: string
  rankNumber: number
  age: number
  category: string
  image: string
  badge: string
  dob?: string
  height?: string
  weight?: string
  skills?: string[]
  biography?: string
  goldMedals?: number
  silverMedals?: number
  rankChange?: number
  rankDescription?: string
  tournaments?: DirectoryPlayerTournament[]
  published?: boolean
  order?: number
}

export type DirectoryPlayerForm = Omit<DirectoryPlayer, '_id' | 'id' | 'playerId' | 'rankNumber'> & {
  skillsText?: string
}
