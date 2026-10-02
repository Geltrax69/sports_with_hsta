import type { EventType } from './eventFormat'

export type GenderCategory = 'male' | 'female' | 'both'

export const EVENT_OPTIONS: { value: EventType; label: string; hint: string }[] = [
  { value: 'regu', label: 'Regu', hint: '3 players per team' },
  { value: 'double', label: 'Doubles', hint: '2 players per team' },
  { value: 'quad', label: 'Quad', hint: '4 players per team' },
]

export const GENDER_OPTIONS: { value: GenderCategory; label: string; icon: string }[] = [
  { value: 'male', label: 'Male only', icon: 'male' },
  { value: 'female', label: 'Female only', icon: 'female' },
  { value: 'both', label: 'Male & Female', icon: 'groups' },
]

export const GENDER_HINTS: Record<GenderCategory, string> = {
  male: 'Only male categories will be contested.',
  female: 'Only female categories will be contested.',
  both: 'Both male and female categories will be contested.',
}

/** Toggle a value in a multi-select, keeping at least one selected. */
export function toggleEventTypeValue(prev: EventType[], value: EventType): EventType[] {
  if (prev.includes(value)) {
    if (prev.length === 1) return prev
    return prev.filter((v) => v !== value)
  }
  return [...prev, value]
}
