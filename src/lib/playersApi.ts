import { apiRequest } from './api'
import type { Player, PlayerForm, PlayerType } from '../types/player'
import dayjs from 'dayjs'

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Normalise a raw API response object into a typed Player. */
function normalizePlayer(raw: Record<string, unknown>): Player {
  const id = String(raw._id || raw.id || '')
  const rawDob = raw.dob as string | undefined
  const formattedDob =
    rawDob && dayjs(rawDob).isValid() ? dayjs(rawDob).format('DD MMM YYYY') : rawDob

  return {
    ...(raw as Omit<Player, 'id' | '_id' | 'dob'>),
    _id: String(raw._id || id),
    id,
    dob: formattedDob,
  }
}

function toPayload(data: Partial<PlayerForm>): Record<string, unknown> {
  const skills =
    data.skillsText !== undefined
      ? data.skillsText.split(',').map((s) => s.trim()).filter(Boolean)
      : data.skills
  const { skillsText: _omit, ...rest } = data
  return { ...rest, skills }
}

// ---------------------------------------------------------------------------
// Public API — fetch
// ---------------------------------------------------------------------------

export async function fetchPlayers(
  type?: PlayerType,
  publishedOnly = true,
  signal?: AbortSignal,
): Promise<Player[]> {
  const params = new URLSearchParams()
  if (type) params.set('type', type)
  if (publishedOnly) params.set('published', 'true')
  const query = params.toString() ? `?${params.toString()}` : ''
  const data = await apiRequest<Record<string, unknown>[]>(`/directory-players${query}`, { signal })
  return data.map(normalizePlayer)
}

export async function fetchPlayer(id: string, signal?: AbortSignal): Promise<Player> {
  const raw = await apiRequest<Record<string, unknown>>(
    `/directory-players/${encodeURIComponent(id)}`,
    { signal },
  )
  return normalizePlayer(raw)
}

// ---------------------------------------------------------------------------
// Admin API — create / update / delete
// ---------------------------------------------------------------------------

export async function createPlayer(data: PlayerForm): Promise<Player> {
  const raw = await apiRequest<Record<string, unknown>>('/directory-players', {
    method: 'POST',
    auth: true,
    body: JSON.stringify(toPayload(data)),
  })
  return normalizePlayer(raw)
}

export async function updatePlayer(id: string, data: Partial<PlayerForm>): Promise<Player> {
  const raw = await apiRequest<Record<string, unknown>>(
    `/directory-players/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(toPayload(data)),
    },
  )
  return normalizePlayer(raw)
}

export async function deletePlayer(id: string): Promise<void> {
  await apiRequest(`/directory-players/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    auth: true,
  })
}

// ---------------------------------------------------------------------------
// Admin form helpers
// ---------------------------------------------------------------------------

export function emptyPlayerForm(): PlayerForm {
  return {
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
  }
}

export function playerToForm(p: Player): PlayerForm {
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
