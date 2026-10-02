import { GENDER_CATEGORY_LABELS, type GenderCategory } from '../lib/districtApi'

const STYLES: Record<GenderCategory, { badge: string; icon: string; label: string }> = {
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
  both: {
    badge: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: 'groups',
    label: GENDER_CATEGORY_LABELS.both,
  },
}

/** Distinctive color-coded badge for a team's gender category. */
export function GenderCategoryBadge({
  value,
  className = '',
}: {
  value?: GenderCategory | string | null
  className?: string
}) {
  const key: GenderCategory = value === 'male' || value === 'female' ? value : 'both'
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
