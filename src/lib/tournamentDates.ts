/** End of calendar day in local timezone */
function endOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

export function isTournamentEnded(tournament: {
  endDate?: string
  status?: string
}): boolean {
  if (tournament.status === 'COMPLETED') return true
  if (!tournament.endDate) return false
  const end = endOfDay(new Date(tournament.endDate))
  return end.getTime() < Date.now()
}

export function isTournamentUpcoming(tournament: {
  endDate?: string
  status?: string
}): boolean {
  if (tournament.status === 'TENTATIVE') return false
  if (isTournamentEnded(tournament)) return false
  return true
}

export function winnerDisplayNames(winners?: {
  first?: Array<{ fullName?: string; name?: string }>
}): string {
  const first = winners?.first || []
  const names = first
    .map((p) => (p.fullName || p.name || '').trim())
    .filter(Boolean)
  return names.join(', ')
}
