export type PlayerType = 'national' | 'international'

export type TournamentResult = 'GOLD' | 'SILVER' | 'BRONZE'

export type PlayerTournament = {
  _id?: string
  eventName: string
  year: number
  category: string
  team: string
  result: TournamentResult
}

/**
 * Single unified player type used across the entire app — public pages and admin.
 * Previously there were two nearly-identical types (DirectoryPlayer + Player)
 * with a toDisplayPlayer() converter between them. Now there is only this one.
 */
export type Player = {
  _id?: string           // MongoDB id — used by admin for edit/delete operations
  id: string             // Same as _id, always normalised to a string
  playerType: PlayerType
  name: string
  role: string
  state: string
  rank: string           // Display string e.g. "#4"
  rankNumber: number     // Numeric value for sorting
  age: number
  category: string       // "MEN" | "WOMEN" | "JUNIOR"
  image: string
  badge: string
  dob?: string           // Formatted date string e.g. "12 Jan 2000"
  height?: string
  weight?: string
  skills?: string[]
  biography?: string
  goldMedals?: number
  silverMedals?: number
  districtGames?: number
  stateGames?: number
  nationalGames?: number
  internationalGames?: number
  rankChange?: number
  rankDescription?: string
  tournaments?: PlayerTournament[]
  published?: boolean    // Admin-only: controls public visibility
  order?: number         // Admin-only: display ordering
}

/** Form type for creating/editing a player in the admin panel. */
export type PlayerForm = Omit<Player, '_id' | 'id' | 'rankNumber'> & {
  skillsText?: string    // Comma-separated string version of `skills` for the text input
}
