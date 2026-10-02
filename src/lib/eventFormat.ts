export type EventType = 'regu' | 'double' | 'quad'

/**
 * Match format per event type: how many rounds a match is played over.
 * Each round is 3 sets and prints one scorecard page.
 * Mirrors back/src/utils/eventFormat.js — add new event types in both.
 */
const ROUNDS_PER_EVENT: Record<string, number> = {
  regu: 1,
  double: 2,
  quad: 3,
}

export const normalizeEventType = (eventType?: string): EventType => {
  const v = String(eventType || '').trim().toLowerCase()
  return (v in ROUNDS_PER_EVENT ? v : 'regu') as EventType
}

export const eventTypeLabel = (eventType?: string) => {
  const v = normalizeEventType(eventType)
  return v.charAt(0).toUpperCase() + v.slice(1)
}

/** Effective event types for a tournament-like object (new array wins, legacy string falls back). */
export const tournamentEventTypes = (t?: { eventTypes?: string[]; eventType?: string }): EventType[] => {
  const arr = Array.isArray(t?.eventTypes) ? t.eventTypes : []
  const valid = arr.map((e) => String(e || '').trim().toLowerCase()).filter((e) => e in ROUNDS_PER_EVENT)
  if (valid.length) return [...new Set(valid)] as EventType[]
  return [normalizeEventType(t?.eventType)]
}

/** "Regu + Doubles" style label for a tournament's event types. */
const TOURNAMENT_EVENT_LABELS: Record<EventType, string> = {
  regu: 'Regu',
  double: 'Doubles',
  quad: 'Quad',
}

export const eventTypesLabel = (t?: { eventTypes?: string[]; eventType?: string }) =>
  tournamentEventTypes(t).map((e) => TOURNAMENT_EVENT_LABELS[e]).join(' + ')

export const roundsForEvent = (eventType?: string) => ROUNDS_PER_EVENT[normalizeEventType(eventType)]

/** Round names for a match, e.g. quad -> ['Quad 1', 'Quad 2', 'Quad 3'] */
export const roundNamesForEvent = (eventType?: string) =>
  Array.from({ length: roundsForEvent(eventType) }, (_, i) => `${eventTypeLabel(eventType)} ${i + 1}`)
