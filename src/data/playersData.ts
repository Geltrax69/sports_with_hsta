export type Player = {
  id: string
  name: string
  role: string
  state: string
  rank: string
  rankNumber: number
  age: number
  category: string
  image: string
  lastActive: string
  badge: string
  dob?: string
  height?: string
  weight?: string
  skills?: string[]
  biography?: string
  goldMedals?: number
  silverMedals?: number
  tournaments?: Array<{
    eventName: string
    year: number
    category: string
    team: string
    result: 'GOLD' | 'SILVER' | 'BRONZE'
  }>
  rankChange?: number
  rankDescription?: string
}

/** Legacy mock list removed — players load from /api/directory-players only. */
export const playersData: Player[] = []

export function getPlayerById(_id: string): Player | undefined {
  return undefined
}
