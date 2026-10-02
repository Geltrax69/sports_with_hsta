import { Link, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { AnimatePresence, motion } from 'motion/react'
import { apiRequest } from '../../lib/api'
import { DatePickerField } from '../../components/DatePickerField'
import {
  EVENT_OPTIONS,
  GENDER_OPTIONS,
  type GenderCategory,
} from '../../lib/tournamentFormOptions'
import { EventTypeCards, GenderSegmentedControl } from '../../components/admin/TournamentEventFields'
import { eventTypesLabel, type EventType } from '../../lib/eventFormat'

const inputClass =
  'w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-gray-400 hover:border-gray-300 focus:border-[#5a0a8f] focus:ring-4 focus:ring-[#5a0a8f]/15'

function Section({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: string
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)] md:p-8">
      <div className="mb-6 flex items-center gap-3.5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#5a0a8f]/10">
          <span className="material-symbols-outlined text-[22px] text-[#5a0a8f]">{icon}</span>
        </div>
        <div>
          <h2 className="text-balance text-lg font-bold text-gray-900">{title}</h2>
          {subtitle && <p className="text-pretty text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
      <div className="space-y-6">{children}</div>
    </section>
  )
}

function Field({
  label,
  htmlFor,
  required,
  hint,
  children,
}: {
  label: string
  htmlFor?: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block text-sm font-semibold text-gray-900">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-gray-500">{hint}</p>}
    </div>
  )
}

const formatDate = (iso: string) => (iso ? dayjs(iso).format('D MMM YYYY') : '—')

export function CreateTournament() {
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2>(1)

  const [formData, setFormData] = useState({
    tournamentName: '',
    tournamentType: '',
    description: '',
    startDate: '',
    endDate: '',
    registrationOpens: '',
    registrationCloses: '',
    venueName: '',
    city: '',
    pincode: '',
  })

  const [customTournamentType, setCustomTournamentType] = useState('')
  const [eventTypes, setEventTypes] = useState<EventType[]>(['regu'])
  const [genderCategory, setGenderCategory] = useState<GenderCategory>('both')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [eventsError, setEventsError] = useState<string | null>(null)

  const imagePreviewUrl = useMemo(() => imagePreview, [imagePreview])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setImageFile(file)
    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return file ? URL.createObjectURL(file) : null
    })
  }

  const resolvedTournamentType =
    formData.tournamentType === '__custom__'
      ? customTournamentType.trim()
      : formData.tournamentType.trim()

  const validateDetails = (): string | null => {
    if (!formData.tournamentName.trim()) return 'Tournament name is required.'
    if (!resolvedTournamentType) return 'Tournament type is required.'
    if (eventTypes.length === 0) {
      setEventsError('Select at least one event type.')
      return 'Select at least one event type.'
    }
    if (formData.startDate && formData.endDate && formData.endDate < formData.startDate) {
      return 'End date cannot be before start date.'
    }
    if (
      formData.registrationOpens &&
      formData.registrationCloses &&
      formData.registrationCloses < formData.registrationOpens
    ) {
      return 'Registration close date cannot be before open date.'
    }
    return null
  }

  const goToReview = () => {
    setError(null)
    const validationError = validateDetails()
    if (validationError) {
      setError(validationError)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setStep(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const validationError = validateDetails()
    if (validationError) {
      setError(validationError)
      setStep(1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('title', formData.tournamentName.trim())
      fd.append('tournamentType', resolvedTournamentType)
      if (formData.description.trim()) fd.append('description', formData.description.trim())
      if (formData.startDate) fd.append('startDate', formData.startDate)
      if (formData.endDate) fd.append('endDate', formData.endDate)
      if (formData.registrationOpens) fd.append('registrationOpens', formData.registrationOpens)
      if (formData.registrationCloses) fd.append('registrationCloses', formData.registrationCloses)
      if (formData.venueName.trim()) fd.append('venueName', formData.venueName.trim())
      if (formData.city.trim()) fd.append('city', formData.city.trim())
      if (formData.pincode.trim()) fd.append('pincode', formData.pincode.trim())
      fd.append('genderCategory', genderCategory)
      // Multi-event support; the backend keeps the first as the primary `eventType`.
      fd.append('eventTypes', JSON.stringify(eventTypes))
      fd.append('eventType', eventTypes[0])
      if (imageFile) fd.append('image', imageFile)

      await apiRequest('/admin/tournaments', {
        method: 'POST',
        auth: true,
        body: fd,
      })

      navigate('/admin/tournaments')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tournament')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setSubmitting(false)
    }
  }

  const reviewRows: { label: string; value: React.ReactNode }[] = [
    { label: 'Tournament', value: formData.tournamentName.trim() },
    { label: 'Type', value: resolvedTournamentType },
    {
      label: 'Events',
      value: (
        <span className="flex flex-wrap gap-1.5">
          {eventTypes.map((t) => (
            <span
              key={t}
              className="rounded-full bg-[#5a0a8f]/10 px-2.5 py-0.5 text-xs font-bold text-[#5a0a8f]"
            >
              {EVENT_OPTIONS.find((o) => o.value === t)?.label}
            </span>
          ))}
        </span>
      ),
    },
    {
      label: 'Categories',
      value: GENDER_OPTIONS.find((o) => o.value === genderCategory)?.label,
    },
    {
      label: 'Schedule',
      value: `${formatDate(formData.startDate)} → ${formatDate(formData.endDate)}`,
    },
    {
      label: 'Registration',
      value: `${formatDate(formData.registrationOpens)} → ${formatDate(formData.registrationCloses)}`,
    },
    {
      label: 'Venue',
      value: [formData.venueName.trim(), formData.city.trim(), formData.pincode.trim()]
        .filter(Boolean)
        .join(', ') || '—',
    },
  ]

  return (
    <div>
      {/* Breadcrumbs */}
      <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
        <Link to="/admin/dashboard" className="hover:text-[#5a0a8f]">
          Dashboard
        </Link>
        <span>›</span>
        <Link to="/admin/tournaments" className="hover:text-[#5a0a8f]">
          Tournaments
        </Link>
        <span>›</span>
        <span className="font-medium text-gray-900">Create New</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-balance text-3xl font-black text-gray-900 md:text-4xl">
          Create New Tournament
        </h1>
        <p className="text-pretty text-gray-600">
          Fill in the details below to officially sanction and schedule a new Sepak Takraw tournament.
        </p>
      </div>

      {/* Step Navigation */}
      <div className="mb-8 flex items-center gap-4" aria-label="Progress">
        {[
          { n: 1 as const, label: 'Tournament Details' },
          { n: 2 as const, label: 'Review & Publish' },
        ].map((s, i) => {
          const done = step > s.n
          const active = step === s.n
          return (
            <div key={s.n} className={`flex items-center gap-4 ${i === 0 ? 'flex-1' : ''}`}>
              <button
                type="button"
                onClick={() => (s.n === 1 ? setStep(1) : goToReview())}
                className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a0a8f] focus-visible:ring-offset-2"
                aria-current={active ? 'step' : undefined}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-[background-color,color] duration-200 ${
                    done
                      ? 'bg-green-600 text-white'
                      : active
                        ? 'bg-[#5a0a8f] text-white'
                        : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {done ? (
                    <span className="material-symbols-outlined text-base">check</span>
                  ) : (
                    s.n
                  )}
                </span>
                <span
                  className={`text-sm ${active ? 'font-bold text-[#5a0a8f]' : done ? 'font-semibold text-gray-900' : 'font-medium text-gray-500'}`}
                >
                  {s.label}
                </span>
              </button>
              {i === 0 && (
                <div className="h-0.5 flex-1 rounded-full bg-gray-200">
                  <div
                    className={`h-full rounded-full bg-[#5a0a8f] transition-[width] duration-300 ${step === 2 ? 'w-full' : 'w-0'}`}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700"
            role="alert"
          >
            <span className="material-symbols-outlined mt-0.5 text-lg">error</span>
            <span className="text-sm font-medium">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit}>
        <AnimatePresence mode="wait" initial={false}>
          {step === 1 ? (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="space-y-6"
            >
              {/* ── Basics ─────────────────────────────────────────── */}
              <Section
                icon="trophy"
                title="Tournament Basics"
                subtitle="Name it, pick a level, and add any rules or announcements."
              >
                <Field label="Tournament Name" htmlFor="tournamentName" required>
                  <input
                    type="text"
                    id="tournamentName"
                    name="tournamentName"
                    value={formData.tournamentName}
                    onChange={handleInputChange}
                    placeholder="e.g., 2026 Haryana State Championship"
                    className={inputClass}
                  />
                </Field>

                <Field label="Tournament Type" htmlFor="tournamentType" required>
                  <div className="relative">
                    <select
                      id="tournamentType"
                      name="tournamentType"
                      value={formData.tournamentType}
                      onChange={handleInputChange}
                      className={`${inputClass} appearance-none bg-white pr-10`}
                    >
                      <option value="">Select level…</option>
                      <option value="National Championship">National Championship</option>
                      <option value="State Championship">State Championship</option>
                      <option value="District Championship">District Championship</option>
                      <option value="Zone Qualifiers">Zone Qualifiers</option>
                      <option value="Federation Cup">Federation Cup</option>
                      <option value="__custom__">Custom…</option>
                    </select>
                    <span className="material-symbols-outlined pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                      keyboard_arrow_down
                    </span>
                  </div>
                  {formData.tournamentType === '__custom__' && (
                    <input
                      type="text"
                      value={customTournamentType}
                      onChange={(e) => setCustomTournamentType(e.target.value)}
                      placeholder="e.g., Inter-University Invitational"
                      aria-label="Custom tournament type"
                      className={`${inputClass} mt-3`}
                    />
                  )}
                </Field>

                <Field
                  label="Description & Rules"
                  htmlFor="description"
                  hint="Shown to districts and players on the tournament page."
                >
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Eligibility, format notes, prize details…"
                    maxLength={500}
                    className={`${inputClass} resize-y`}
                  />
                  <div className="mt-1 text-right text-xs tabular-nums text-gray-400">
                    {formData.description.length}/500
                  </div>
                </Field>

                <Field
                  label="Tournament Image"
                  hint={imageFile ? undefined : 'Optional — a banner shown on the tournament page.'}
                >
                  <div className="flex items-center gap-4">
                    {imagePreviewUrl ? (
                      <img
                        src={imagePreviewUrl}
                        alt="Tournament banner preview"
                        className="h-20 w-32 rounded-xl border border-gray-200 object-cover"
                      />
                    ) : (
                      <div className="flex h-20 w-32 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50">
                        <span className="material-symbols-outlined text-2xl text-gray-300">image</span>
                      </div>
                    )}
                    <label
                      htmlFor="tournamentImage"
                      className="cursor-pointer rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-[border-color,background-color] duration-200 hover:border-gray-300 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a0a8f] focus-visible:ring-offset-2"
                    >
                      {imageFile ? 'Change image' : 'Choose image'}
                    </label>
                    <input
                      id="tournamentImage"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="sr-only"
                    />
                  </div>
                  {imageFile && (
                    <p className="mt-1.5 truncate text-xs text-gray-500">{imageFile.name}</p>
                  )}
                </Field>
              </Section>

              {/* ── Events & Categories ────────────────────────────── */}
              <Section
                icon="sports"
                title="Events & Categories"
                subtitle="Which formats are played, and who can take part."
              >
                <Field
                  label="Event Types"
                  required
                  hint="Select all formats contested in this tournament — districts will register one team per event type."
                >
                  <EventTypeCards
                    value={eventTypes}
                    onChange={(next) => {
                      setEventsError(null)
                      setEventTypes(next)
                    }}
                    error={eventsError}
                  />
                </Field>

                <Field label="Who Can Participate" required>
                  <GenderSegmentedControl value={genderCategory} onChange={setGenderCategory} />
                </Field>
              </Section>

              {/* ── Schedule ───────────────────────────────────────── */}
              <Section
                icon="calendar_today"
                title="Schedule & Registration"
                subtitle="When the tournament runs and when districts can register teams."
              >
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <Field label="Start Date" htmlFor="startDate">
                    <DatePickerField
                      id="startDate"
                      name="startDate"
                      label="Select start date"
                      value={formData.startDate}
                      onChange={(date) => setFormData({ ...formData, startDate: date })}
                    />
                  </Field>
                  <Field label="End Date" htmlFor="endDate">
                    <DatePickerField
                      id="endDate"
                      name="endDate"
                      label="Select end date"
                      minDate={formData.startDate ? dayjs(formData.startDate) : undefined}
                      value={formData.endDate}
                      onChange={(date) => setFormData({ ...formData, endDate: date })}
                    />
                  </Field>
                </div>

                <div>
                  <span className="mb-2 block text-sm font-semibold text-gray-900">
                    Registration Window
                  </span>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <Field label="Opens" htmlFor="registrationOpens">
                      <DatePickerField
                        name="registrationOpens"
                        label="Registration opens"
                        value={formData.registrationOpens}
                        onChange={(date) => setFormData({ ...formData, registrationOpens: date })}
                      />
                    </Field>
                    <Field label="Closes" htmlFor="registrationCloses">
                      <DatePickerField
                        name="registrationCloses"
                        label="Registration closes"
                        minDate={formData.registrationOpens ? dayjs(formData.registrationOpens) : undefined}
                        value={formData.registrationCloses}
                        onChange={(date) => setFormData({ ...formData, registrationCloses: date })}
                      />
                    </Field>
                  </div>
                </div>
              </Section>

              {/* ── Venue ──────────────────────────────────────────── */}
              <Section
                icon="location_on"
                title="Venue Details"
                subtitle="Where the tournament will be held."
              >
                <Field label="Stadium / Venue Name" htmlFor="venueName">
                  <input
                    type="text"
                    id="venueName"
                    name="venueName"
                    value={formData.venueName}
                    onChange={handleInputChange}
                    placeholder="e.g., Rajiv Gandhi Indoor Stadium"
                    className={inputClass}
                  />
                </Field>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <Field label="City" htmlFor="city">
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="City"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Pincode" htmlFor="pincode">
                    <input
                      type="text"
                      id="pincode"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      placeholder="110001"
                      inputMode="numeric"
                      className={inputClass}
                    />
                  </Field>
                </div>

                <Field label="Map">
                  <div className="relative h-56 overflow-hidden rounded-xl border-2 border-gray-200 bg-gray-100">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button
                        type="button"
                        className="flex items-center gap-2 rounded-xl bg-[#5a0a8f] px-6 py-3 font-bold text-white shadow-[0_8px_20px_-8px_rgba(90,10,143,0.6)] transition-[background-color,transform] duration-200 hover:bg-[#4c087c] active:scale-[0.96]"
                      >
                        <span className="material-symbols-outlined">location_on</span>
                        Pin Location on Map
                      </button>
                    </div>
                  </div>
                </Field>
              </Section>
            </motion.div>
          ) : (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="space-y-6"
            >
              <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5 md:px-8">
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-600/10">
                      <span className="material-symbols-outlined text-[22px] text-green-700">
                        fact_check
                      </span>
                    </div>
                    <div>
                      <h2 className="text-balance text-lg font-bold text-gray-900">
                        Review & Publish
                      </h2>
                      <p className="text-pretty text-sm text-gray-500">
                        Check everything once — this is how the tournament will appear.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="rounded-xl border-2 border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-[border-color,background-color] duration-200 hover:border-gray-300 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a0a8f] focus-visible:ring-offset-2 active:scale-[0.98]"
                  >
                    Edit details
                  </button>
                </div>

                {imagePreviewUrl && (
                  <img
                    src={imagePreviewUrl}
                    alt="Tournament banner"
                    className="h-48 w-full border-b border-gray-100 object-cover"
                  />
                )}

                <dl className="divide-y divide-gray-100 px-6 md:px-8">
                  {reviewRows.map((row) => (
                    <div key={row.label} className="grid grid-cols-[140px_1fr] gap-4 py-4 md:grid-cols-[180px_1fr]">
                      <dt className="text-sm font-medium text-gray-500">{row.label}</dt>
                      <dd className="text-pretty text-sm font-semibold text-gray-900">{row.value}</dd>
                    </div>
                  ))}
                  {formData.description.trim() && (
                    <div className="grid grid-cols-[140px_1fr] gap-4 py-4 md:grid-cols-[180px_1fr]">
                      <dt className="text-sm font-medium text-gray-500">About</dt>
                      <dd className="text-pretty text-sm text-gray-700">{formData.description.trim()}</dd>
                    </div>
                  )}
                </dl>

                <div className="border-t border-gray-100 bg-gray-50/60 px-6 py-4 md:px-8">
                  <p className="flex items-start gap-2 text-xs text-gray-500">
                    <span className="material-symbols-outlined mt-0.5 text-sm">info</span>
                    Publishing opens the tournament to districts immediately with status
                    “Registration Open”. You can edit details later from Tournament Manager.
                  </p>
                </div>
              </section>

              <div className="rounded-2xl border border-[#5a0a8f]/20 bg-[#5a0a8f]/[0.04] p-5">
                <p className="text-sm text-gray-700">
                  <span className="font-bold text-gray-900">
                    {eventTypesLabel({ eventTypes })}
                  </span>{' '}
                  · {GENDER_OPTIONS.find((o) => o.value === genderCategory)?.label} · Districts will
                  register one team per event type ({eventTypes.map((t) => EVENT_OPTIONS.find((o) => o.value === t)?.hint).join(', ')}).
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sticky action bar */}
        <div className="sticky bottom-0 z-10 -mx-2 mt-8 px-2 pb-4 pt-2">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white/90 px-4 py-3 shadow-[0_8px_30px_-12px_rgba(16,24,40,0.25)] backdrop-blur-md md:px-6">
            <div>
              {step === 2 ? (
                <button
                  type="button"
                  onClick={() => {
                    setStep(1)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 transition-[background-color] duration-200 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a0a8f] focus-visible:ring-offset-2 active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined text-lg">arrow_back</span>
                  Back to details
                </button>
              ) : (
                <Link
                  to="/admin/tournaments"
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-500 transition-[background-color,color] duration-200 hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a0a8f] focus-visible:ring-offset-2"
                >
                  Cancel
                </Link>
              )}
            </div>
            {step === 1 ? (
              <button
                type="button"
                onClick={goToReview}
                className="flex items-center gap-2 rounded-xl bg-[#5a0a8f] px-6 py-3 text-[15px] font-bold text-white shadow-[0_10px_24px_-10px_rgba(90,10,143,0.6)] transition-[background-color,box-shadow,transform] duration-200 hover:bg-[#4c087c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a0a8f] focus-visible:ring-offset-2 active:scale-[0.96]"
              >
                Review & Publish
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 rounded-xl bg-[#5a0a8f] px-6 py-3 text-[15px] font-bold text-white shadow-[0_10px_24px_-10px_rgba(90,10,143,0.6)] transition-[background-color,box-shadow,transform] duration-200 hover:bg-[#4c087c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a0a8f] focus-visible:ring-offset-2 active:scale-[0.96] disabled:pointer-events-none disabled:opacity-70"
              >
                {submitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Publishing…
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">publish</span>
                    Publish Tournament
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
