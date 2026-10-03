import { GENDER_CATEGORY_LABELS, normalizeTeamGenderCategory } from '../lib/districtApi'

const STYLES = {
  male: {
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: 'male',
    label: GENDER_CATEGORY_LABELS.male,
  },
  female: {
    badge: 'bg-rose-100 text-rose-800 border-rose-200',
    icon: 'female',
    label: GENDER_CATEGORY_LABELS.female,
  },
  mixed: {
    badge: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: 'groups',
    label: GENDER_CATEGORY_LABELS.mixed,
  },
}

/** Distinctive color-coded badge for a team's gender category. */
export function GenderCategoryBadge({
  value,
  className = '',
}: {
  value?: string | null
  className?: string
}) {
  const key = normalizeTeamGenderCategory(value)
  const s = STYLES[key]
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${s.badge} ${className}`}
    >
      <span className="material-symbols-outlined text-sm filled">{s.icon}</span>
      {s.label}
    </span>
  )
}
