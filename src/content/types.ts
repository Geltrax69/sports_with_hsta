export type NewsCategory = string

export type NewsItem = {
  id: string
  featured: boolean
  pinned: boolean
  badge: NewsCategory
  date: string // ISO date string
  dateText: string // Kept for backward compatibility
  title: string
  excerpt?: string
  article?: string // Full article content
  imageUrl: string
}

export type TournamentStatus = 'CONFIRMED' | 'REGISTRATION OPEN' | 'TENTATIVE' | 'COMPLETED'

export type TournamentItem = {
  id: string
  pinned: boolean
  month: string
  day: string
  title: string
  location: string
  status: TournamentStatus
  imageUrl?: string
}

export type SiteContent = {
  news: NewsItem[]
  tournaments: TournamentItem[]
}
