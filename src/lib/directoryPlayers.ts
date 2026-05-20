import { apiRequest } from './api'
import type { DirectoryPlayer, DirectoryPlayerForm, PlayerType } from '../types/directoryPlayer'
import type { Player } from '../data/playersData'
import dayjs from 'dayjs'

export async function fetchDirectoryPlayers(type?: PlayerType, publishedOnly = true): Promise<DirectoryPlayer[]> {
  const params = new URLSearchParams()
  if (type) params.set('type', type)
  if (publishedOnly) params.set('published', 'true')
  const query = params.toString() ? `?${params.toString()}` : ''
  return apiRequest<DirectoryPlayer[]>(`/directory-players${query}`)
}

export async function fetchDirectoryPlayer(id: string): Promise<DirectoryPlayer> {
  return apiRequest<DirectoryPlayer>(`/directory-players/${encodeURIComponent(id)}`)
}

export async function createDirectoryPlayer(data: DirectoryPlayerForm): Promise<DirectoryPlayer> {
  return apiRequest<DirectoryPlayer>('/directory-players', {
    method: 'POST',
    auth: true,
    body: JSON.stringify(toPayload(data)),
  })
}

export async function updateDirectoryPlayer(id: string, data: Partial<DirectoryPlayerForm>): Promise<DirectoryPlayer> {
  return apiRequest<DirectoryPlayer>(`/directory-players/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    auth: true,
    body: JSON.stringify(toPayload(data)),
  })
}

export async function deleteDirectoryPlayer(id: string): Promise<void> {
  await apiRequest(`/directory-players/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    auth: true,
  })
}

function toPayload(data: Partial<DirectoryPlayerForm>) {
  const skills = data.skillsText !== undefined
    ? data.skillsText.split(',').map((s) => s.trim()).filter(Boolean)
    : data.skills

  const { skillsText: _omit, ...rest } = data
  return { ...rest, skills }
}

function formatDob(dob?: string): string | undefined {
  if (!dob) return undefined
  const parsed = dayjs(dob)
  return parsed.isValid() ? parsed.format('DD MMM YYYY') : dob
}

export function toDisplayPlayer(p: DirectoryPlayer): Player {
  const id = p._id || p.id
  return {
    id,
    name: p.name,
    role: p.role,
    state: p.state,
    rank: p.rank,
    rankNumber: p.rankNumber,
    age: p.age,
    category: p.category,
    image: p.image,
    badge: p.badge,
    dob: formatDob(p.dob),
    height: p.height,
    weight: p.weight,
    skills: p.skills,
    biography: p.biography,
    goldMedals: p.goldMedals,
    silverMedals: p.silverMedals,
    tournaments: p.tournaments?.map((t) => ({
      eventName: t.eventName,
      year: t.year,
      category: t.category,
      team: t.team,
      result: t.result,
    })),
    rankChange: p.rankChange,
    rankDescription: p.rankDescription,
  }
}

export const emptyDirectoryPlayerForm = (): DirectoryPlayerForm => ({
  playerType: 'national',
  name: '',
  role: '',
  state: '',
  rank: '',
  age: 0,
  category: '',
  image: '',
  badge: '',
  dob: '',
  height: '',
  weight: '',
  skills: [],
  skillsText: '',
  biography: '',
  goldMedals: 0,
  silverMedals: 0,
  rankChange: 0,
  rankDescription: '',
  tournaments: [],
  published: true,
  order: 0,
})

export function formFromPlayer(p: DirectoryPlayer): DirectoryPlayerForm {
  return {
    playerType: p.playerType,
    name: p.name,
    role: p.role,
    state: p.state,
    rank: p.rank,
    age: p.age,
    category: p.category,
    image: p.image,
    badge: p.badge,
    dob: p.dob || '',
    height: p.height || '',
    weight: p.weight || '',
    skills: p.skills || [],
    skillsText: (p.skills || []).join(', '),
    biography: p.biography || '',
    goldMedals: p.goldMedals || 0,
    silverMedals: p.silverMedals || 0,
    rankChange: p.rankChange || 0,
    rankDescription: p.rankDescription || '',
    tournaments: p.tournaments || [],
    published: p.published !== false,
    order: p.order || 0,
  }
}
