import {
  EVENT_OPTIONS,
  GENDER_HINTS,
  GENDER_OPTIONS,
  toggleEventTypeValue,
  type GenderCategory,
} from '../../lib/tournamentFormOptions'
import type { EventType } from '../../lib/eventFormat'

/** Multi-select cards for the tournament's event types. */
export function EventTypeCards({
  value,
  onChange,
  error,
}: {
  value: EventType[]
  onChange: (next: EventType[]) => void
  error?: string | null
}) {
  return (
    <div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3" role="group" aria-label="Event types">
        {EVENT_OPTIONS.map((opt) => {
          const selected = value.includes(opt.value)
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(toggleEventTypeValue(value, opt.value))}
              className={`relative flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-[border-color,background-color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a0a8f] focus-visible:ring-offset-2 active:scale-[0.98] ${
                selected
                  ? 'border-[#5a0a8f] bg-[#5a0a8f]/[0.05] shadow-[0_2px_12px_-4px_rgba(90,10,143,0.25)]'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-[background-color,border-color] duration-200 ${
                  selected ? 'border-[#5a0a8f] bg-[#5a0a8f]' : 'border-gray-300 bg-white'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-sm font-bold text-white transition-[opacity,transform] duration-200 ${
                    selected ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
                  }`}
                >
                  check
                </span>
              </span>
              <span>
                <span
                  className={`block text-[15px] font-bold ${selected ? 'text-[#5a0a8f]' : 'text-gray-900'}`}
                >
                  {opt.label}
                </span>
                <span className="block text-xs text-gray-500">{opt.hint}</span>
              </span>
            </button>
          )
        })}
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}
    </div>
  )
}

/** Segmented control for who can participate. */
export function GenderSegmentedControl({
  value,
  onChange,
  hints,
}: {
  value: GenderCategory
  onChange: (next: GenderCategory) => void
  hints?: Record<GenderCategory, string>
}) {
  const hintText = (hints || GENDER_HINTS)[value]
  return (
    <div>
      <div
        className="grid grid-cols-3 gap-1.5 rounded-2xl border border-gray-200 bg-gray-100 p-1.5"
        role="radiogroup"
        aria-label="Gender categories"
      >
        {GENDER_OPTIONS.map((opt) => {
          const selected = value === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(opt.value)}
              className={`flex flex-col items-center gap-1 rounded-xl px-2 py-3 transition-[background-color,box-shadow,color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a0a8f] focus-visible:ring-offset-2 active:scale-[0.98] ${
                selected
                  ? 'bg-white text-[#5a0a8f] shadow-[0_1px_4px_rgba(16,24,40,0.12)]'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <span className={`material-symbols-outlined text-[22px] ${selected ? 'filled' : ''}`}>
                {opt.icon}
              </span>
              <span className="text-[13px] font-bold">{opt.label}</span>
            </button>
          )
        })}
      </div>
      <p className="mt-1.5 text-xs text-gray-500">{hintText}</p>
    </div>
  )
}
