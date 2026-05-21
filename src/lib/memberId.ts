const OBJECT_ID_RE = /^[a-f0-9]{24}$/i

export function isMongoObjectId(value?: string | null): boolean {
  return Boolean(value && OBJECT_ID_RE.test(value))
}

export function formatMemberDisplayId(
  registerAs: 'player' | 'coach' | 'referee',
  applicant?: {
    playerId?: string
    coachId?: string
    refereeId?: string
  } | null,
): string {
  if (!applicant) return '—'
  if (registerAs === 'player') return applicant.playerId?.trim() || '—'
  if (registerAs === 'coach') return applicant.coachId?.trim() || '—'
  if (registerAs === 'referee') return applicant.refereeId?.trim() || '—'
  return '—'
}

export function formatPersonListId(
  registerAs: 'player' | 'coach' | 'referee',
  person: {
    playerId?: string
    coachId?: string
    refereeId?: string
    _id?: string
  },
): string {
  const displayId = formatMemberDisplayId(registerAs, person)
  if (displayId !== '—') return displayId
  if (person._id && isMongoObjectId(person._id)) return '—'
  return person._id?.trim() || '—'
}

export function formatRegistrationDisplayId(
  registration: {
    registerAs: 'player' | 'coach' | 'referee'
    userId?: string
    applicant?: {
      playerId?: string
      coachId?: string
      refereeId?: string
      fullName?: string
    } | null
  },
): string {
  const fromApplicant = formatMemberDisplayId(registration.registerAs, registration.applicant)
  if (fromApplicant !== '—') return fromApplicant
  if (registration.userId && isMongoObjectId(registration.userId)) return '—'
  return registration.userId?.trim() || '—'
}
