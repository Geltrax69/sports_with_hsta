import { apiRequest } from './api'

export type TeamType = 'regu' | 'double' | 'quad'

export type GenderCategory = 'male' | 'female' | 'mixed'

export const GENDER_CATEGORY_LABELS: Record<GenderCategory, string> = {
  male: 'Male',
  female: 'Female',
  mixed: 'Mixed',
}

/** Legacy backend team value 'both' means 'mixed'. */
export function normalizeTeamGenderCategory(value: unknown): GenderCategory {
  const v = String(value || '').trim().toLowerCase()
  if (v === 'male') return 'male'
  if (v === 'female') return 'female'
  return 'mixed'
}

/** Display label for a team category, tolerant of the legacy 'both' value. */
export function teamGenderCategoryLabel(value: unknown): string {
  return GENDER_CATEGORY_LABELS[normalizeTeamGenderCategory(value)]
}

export const TEAM_TYPES: { value: TeamType; label: string; playersRequired: number }[] = [
  { value: 'regu', label: 'Regu', playersRequired: 5 },
  { value: 'double', label: 'Doubles', playersRequired: 3 },
  { value: 'quad', label: 'Quad', playersRequired: 6 },
]

// Minimum players per team type. Must stay in sync with TEAM_TYPE_ROSTER
// (sports-backend/src/controllers/districtTeamController.js), which enforces
// it as a minimum — districts may register larger squads.
export const MIN_PLAYERS_REQUIRED: Record<TeamType, number> = {
  regu: 5,
  double: 3,
  quad: 6,
}

export const teamTypeLabel = (teamType?: string): string => {
  const found = TEAM_TYPES.find((t) => t.value === teamType)
  return found ? found.label : teamType || '—'
}

export type TournamentOption = {
  _id: string
  title: string
  eventType?: string
  /** Full set of event types when the tournament mixes events. */
  eventTypes?: string[]
  status?: string
  startDate?: string
  endDate?: string
  venueName?: string
  city?: string
  registrationOpens?: string
  registrationCloses?: string
  imageUrl?: string
  genderCategory?: GenderCategory
  /** Full set of participation categories when the tournament offers several. */
  genderCategories?: string[]
}

/** Mirrors the backend's registration-open check for tournaments. */
export function isTournamentOpen(t: TournamentOption): boolean {
  if (t.status !== 'REGISTRATION OPEN') return false
  const now = new Date()
  if (t.registrationOpens && now < new Date(t.registrationOpens)) return false
  if (t.registrationCloses && now > new Date(t.registrationCloses)) return false
  return true
}

export type DistrictProfile = {
  _id: string
  code: string
  name: string
  zone: string
  status: 'active' | 'pending' | 'inactive'
  email?: string
}

export type DistrictPlayer = {
  _id: string
  fullName: string
  playerId?: string
  gender?: string
  district?: string
  dateOfBirth?: string
  profilePhoto?: string
}

export type DistrictCoach = {
  _id: string
  fullName: string
  coachId?: string
  gender?: string
  profilePhoto?: string
}

export type DistrictReferee = {
  _id: string
  fullName: string
  refereeId?: string
  gender?: string
  profilePhoto?: string
}

export type DistrictTeamMember = {
  _id: string
  fullName: string
  playerId?: string
  gender?: string
  profilePhoto?: string
}

export type DistrictTeam = {
  _id: string
  name: string
  teamType?: TeamType
  genderCategory?: GenderCategory
  status: 'pending' | 'approved' | 'rejected'
  maxMembers: number
  members: DistrictTeamMember[]
  coach?: DistrictCoach | null
  referee?: DistrictReferee | null
  /** Saved but not confirmed yet; confirming makes it final. */
  isDraft?: boolean
  confirmedAt?: string | null
  manager?: string
  district?: { _id: string; code: string; name: string }
  tournament?: { _id: string; title: string; eventType?: string; eventTypes?: string[]; status?: string; genderCategory?: GenderCategory; genderCategories?: string[] }
  createdAt: string
  updatedAt: string
}

export const districtApi = {
  getProfile: () => apiRequest<{ district: DistrictProfile }>('/district/profile', { auth: true }),

  listPlayers: (q?: string) => {
    const query = q?.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''
    return apiRequest<{ players: DistrictPlayer[]; count: number }>(`/district/players${query}`, {
      auth: true,
    })
  },

  listCoaches: () => apiRequest<{ coaches: DistrictCoach[] }>('/district/coaches', { auth: true }),

  listReferees: () => apiRequest<{ referees: DistrictReferee[] }>('/district/referees', { auth: true }),

  listTeams: () => apiRequest<{ teams: DistrictTeam[] }>('/district/teams', { auth: true }),

  getTeam: (id: string) => apiRequest<{ team: DistrictTeam }>(`/district/teams/${id}`, { auth: true }),

  createTeam: (payload: { tournamentId: string; teamType: TeamType; genderCategory?: GenderCategory; name?: string; memberIds: string[]; coachId?: string | null; refereeId?: string | null; manager?: string }) =>
    apiRequest<{ team: DistrictTeam }>('/district/teams', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    }),

  /** Confirm saved drafts — full and final. */
  confirmTeams: (teamIds: string[]) =>
    apiRequest<{ teams: DistrictTeam[] }>('/district/teams/confirm', {
      method: 'POST',
      auth: true,
      body: JSON.stringify({ teamIds }),
    }),

  /** Discard a draft (confirmed teams can't be deleted). */
  deleteDraft: (id: string) =>
    apiRequest<{ success: boolean }>(`/district/teams/${id}`, { method: 'DELETE', auth: true }),
}
