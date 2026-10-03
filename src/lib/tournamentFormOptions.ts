import type { EventType } from './eventFormat'

/**
 * Team gender category: 'male' | 'female' | 'mixed' (mixed = male and female
 * play together in the same team/match). 'both' is a legacy backend value
 * that means 'mixed'.
 */
export type GenderCategory = 'male' | 'female' | 'mixed'

export const EVENT_OPTIONS: { value: EventType; label: string; hint: string }[] = [
  { value: 'regu', label: 'Regu', hint: '3 players per team' },
  { value: 'double', label: 'Doubles', hint: '2 players per team' },
  { value: 'quad', label: 'Quad', hint: '4 players per team' },
]

/** Single-select options for a team's category (district team modal). */
export const GENDER_OPTIONS: { value: GenderCategory; label: string; icon: string }[] = [
  { value: 'male', label: 'Male only', icon: 'male' },
  { value: 'female', label: 'Female only', icon: 'female' },
  { value: 'mixed', label: 'Mixed', icon: 'groups' },
]

/** Multi-select options for tournament participation ("Who can participate"). */
export const PARTICIPATION_OPTIONS: { value: GenderCategory; label: string; hint: string; icon: string }[] = [
  { value: 'male', label: 'Male', hint: 'Male category contested', icon: 'male' },
  { value: 'female', label: 'Female', hint: 'Female category contested', icon: 'female' },
  { value: 'mixed', label: 'Mixed', hint: 'Male & female play together', icon: 'groups' },
]

export const GENDER_HINTS: Record<GenderCategory, string> = {
  male: 'Only male players can be picked for this team.',
  female: 'Only female players can be picked for this team.',
  mixed: 'Male and female players can be picked for this team.',
}

export const PARTICIPATION_HINTS: Record<GenderCategory, string> = {
  male: 'A male category will be contested — districts can register a male team.',
  female: 'A female category will be contested — districts can register a female team.',
  mixed: 'A mixed category will be contested — districts can register a mixed team.',
}

/** Map a raw backend value to a team category ('both' -> 'mixed'). */
export function normalizeTeamGenderCategory(value: unknown): GenderCategory {
  const v = String(value || '').trim().toLowerCase()
  if (v === 'male') return 'male'
  if (v === 'female') return 'female'
  return 'mixed'
}

/**
 * Effective participation categories for a tournament object. Prefers the
 * `genderCategories` array; falls back to the legacy single `genderCategory`
 * ('both' = all three).
 */
export function tournamentGenderCategories(t: {
  genderCategories?: unknown
  genderCategory?: unknown
}): GenderCategory[] {
  const raw = t.genderCategories
  if (Array.isArray(raw) && raw.length) {
    const out: GenderCategory[] = []
    for (const item of raw) {
      const v = normalizeTeamGenderCategory(item)
      if (!out.includes(v)) out.push(v)
    }
    if (out.length) return out
  }
  const legacy = String(t.genderCategory || '').trim().toLowerCase()
  if (legacy === 'male') return ['male']
  if (legacy === 'female') return ['female']
  return ['male', 'female', 'mixed']
}

/** "Male + Female" style label for a category set. */
export function genderCategoriesLabel(categories: GenderCategory[]): string {
  const labels: Record<GenderCategory, string> = { male: 'Male', female: 'Female', mixed: 'Mixed' }
  const cats = categories.filter((c) => labels[c])
  return cats.length ? cats.map((c) => labels[c]).join(' + ') : 'Male + Female + Mixed'
}

/** Toggle a value in a multi-select, keeping at least one selected. */
export function toggleEventTypeValue(prev: EventType[], value: EventType): EventType[] {
  if (prev.includes(value)) {
    if (prev.length === 1) return prev
    return prev.filter((v) => v !== value)
  }
  return [...prev, value]
}

/** Toggle a participation category, keeping at least one selected. */
export function toggleGenderCategoryValue(prev: GenderCategory[], value: GenderCategory): GenderCategory[] {
  if (prev.includes(value)) {
    if (prev.length === 1) return prev
    return prev.filter((v) => v !== value)
  }
  return [...prev, value]
}
