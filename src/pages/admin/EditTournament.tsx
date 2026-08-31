import { Link, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { apiRequest } from '../../lib/api'
import { DatePickerField } from '../../components/DatePickerField'
import { Autocomplete, TextField, Chip } from '@mui/material'

type Player = {
  _id: string
  fullName: string
  district?: string
  profilePhoto?: string
}

type Registration = {
  _id: string
  userId: string
  accountRole: 'player' | 'coach'
  applicant?: Player
  status: string
}

type AdminTournament = {
  _id: string
  title: string
  tournamentType?: string
  eventType?: 'regu' | 'double' | 'quad'
  description?: string
  startDate?: string
  endDate?: string
  registrationOpens?: string
  registrationCloses?: string
  venueName?: string
  city?: string
  pincode?: string
  genderCategory?: 'male' | 'female' | 'both'
  imageUrl?: string

  status?: string
  winners?: {
    first: Player[]
    second: Player[]
    third: Player[]
  }
}

const PRESET_TYPES = [
  'National Championship',
  'State Championship',
  'District Championship',
  'Zone Qualifiers',
  'Federation Cup',
]

const toDateInputValue = (value?: string) => {
  if (!value) return ''
  try {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return ''
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  } catch {
    return ''
  }
}

export function EditTournament() {
  const { tournamentId } = useParams<{ tournamentId: string }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [imageFile, setImageFile] = useState<File | null>(null)

  const [formData, setFormData] = useState({
    tournamentName: '',
    tournamentType: '',
    eventType: 'regu' as 'regu' | 'double' | 'quad',
    description: '',
    startDate: '',
    endDate: '',
    registrationOpens: '',
    registrationCloses: '',
    venueName: '',
    city: '',
    pincode: '110001',
  })

  const [genderCategory, setGenderCategory] = useState<'male' | 'female' | 'both'>('both')

  const [customTournamentType, setCustomTournamentType] = useState('')

  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [winners, setWinners] = useState<{
    first: Player[]
    second: Player[]
    third: Player[]
  }>({
    first: [],
    second: [],
    third: []
  })

  // Derived list of players from registrations for the dropdown
  const playerOptions = useMemo(() => {
    // Filter for approved player registrations
    return registrations
      .filter((r) => r.accountRole === 'player' && r.applicant) // && r.status === 'approved' ?
      .map((r) => r.applicant!)
      .filter((p, index, self) => index === self.findIndex((t) => t._id === p._id)) // Unique players
  }, [registrations])

  const resolvedTournamentType = useMemo(() => {
    return formData.tournamentType === '__custom__' ? customTournamentType.trim() : formData.tournamentType.trim()
  }, [customTournamentType, formData.tournamentType])

  useEffect(() => {
    if (!tournamentId) return
    let cancelled = false

    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const r = await apiRequest<{ tournament: AdminTournament }>(`/admin/tournaments/${tournamentId}`, {
          auth: true,
        })
        if (cancelled) return

        const t = r.tournament
        const type = (t.tournamentType || '').trim()
        const isPreset = PRESET_TYPES.includes(type)

        setFormData({
          tournamentName: t.title || '',
          tournamentType: type ? (isPreset ? type : '__custom__') : '',
          eventType: (t.eventType as 'regu' | 'double' | 'quad') || 'regu',
          description: t.description || '',
          startDate: toDateInputValue(t.startDate),
          endDate: toDateInputValue(t.endDate),
          registrationOpens: toDateInputValue(t.registrationOpens),
          registrationCloses: toDateInputValue(t.registrationCloses),
          venueName: t.venueName || '',
          city: t.city || '',
          pincode: t.pincode || '110001',
        })

        setCustomTournamentType(isPreset ? '' : type)

        setGenderCategory(t.genderCategory || 'both')

        if (t.winners) {
          setWinners({
            first: t.winners.first || [],
            second: t.winners.second || [],
            third: t.winners.third || []
          })
        }

        // Fetch registrations to populate the player dropdown
        const regRes = await apiRequest<{ registrations: Registration[] }>(
          `/admin/tournaments/${tournamentId}/registrations`,
          { auth: true },
        )
        if (!cancelled && regRes.registrations) {
          setRegistrations(regRes.registrations)
        }

      } catch (e) {
        if (cancelled) return
        setError(e instanceof Error ? e.message : 'Failed to load tournament')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [tournamentId])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!tournamentId) {
      setError('Missing tournament id')
      return
    }

    if (!formData.tournamentName.trim()) {
      setError('Tournament Name is required')
      return
    }

    if (!resolvedTournamentType) {
      setError('Tournament Type is required')
      return
    }

    if (formData.startDate && formData.endDate && formData.endDate < formData.startDate) {
      setError('End date cannot be before start date')
      return
    }

    if (
      formData.registrationOpens &&
      formData.registrationCloses &&
      formData.registrationCloses < formData.registrationOpens
    ) {
      setError('Registration close date cannot be before open date')
      return
    }

    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('title', formData.tournamentName.trim())
      fd.append('tournamentType', resolvedTournamentType)
      fd.append('description', formData.description)
      fd.append('startDate', formData.startDate)
      fd.append('endDate', formData.endDate)
      fd.append('registrationOpens', formData.registrationOpens)
      fd.append('registrationCloses', formData.registrationCloses)
      fd.append('venueName', formData.venueName)
      fd.append('city', formData.city)
      fd.append('pincode', formData.pincode)
      fd.append('genderCategory', genderCategory)
      fd.append('eventType', formData.eventType)
      fd.append('winners', JSON.stringify({
        first: winners.first.map(p => p._id),
        second: winners.second.map(p => p._id),
        third: winners.third.map(p => p._id),
      }))

      if (imageFile) fd.append('image', imageFile)

      await apiRequest(`/admin/tournaments/${tournamentId}`, {
        method: 'PATCH',
        auth: true,
        body: fd,
      })

      navigate('/admin/tournaments')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tournament')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="px-6 py-6 text-gray-600">Loading…</div>
  }

  return (
    <div>
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
        <Link to="/admin/dashboard" className="hover:text-[#5a0a8f]">
          Dashboard
        </Link>
        <span>›</span>
        <Link to="/admin/tournaments" className="hover:text-[#5a0a8f]">
          Tournaments
        </Link>
        <span>›</span>
        <span className="text-gray-900 font-medium">Edit</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">Edit Tournament</h1>
        <p className="text-gray-600">Update tournament details and image.</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-8 space-y-8">
        {/* General Information */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#5a0a8f] rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-white">info</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">General Information</h2>
          </div>

          <div className="space-y-6 pl-13">
            <div>
              <label htmlFor="tournamentName" className="block text-sm font-semibold text-gray-900 mb-2">
                Tournament Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="tournamentName"
                name="tournamentName"
                value={formData.tournamentName}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none text-gray-900"
              />
            </div>

            <div>
              <label htmlFor="tournamentType" className="block text-sm font-semibold text-gray-900 mb-2">
                Tournament Type <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="tournamentType"
                  name="tournamentType"
                  value={formData.tournamentType}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none appearance-none bg-white text-gray-900"
                >
                  <option value="">Select Type</option>
                  {PRESET_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                  <option value="__custom__">Custom…</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                  keyboard_arrow_down
                </span>
              </div>

              {formData.tournamentType === '__custom__' && (
                <div className="mt-3">
                  <label htmlFor="customTournamentType" className="block text-xs text-gray-600 mb-1">
                    Custom type
                  </label>
                  <input
                    id="customTournamentType"
                    type="text"
                    value={customTournamentType}
                    onChange={(e) => setCustomTournamentType(e.target.value)}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none text-gray-900"
                  />
                </div>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-gray-900 mb-2">
                Description & Rules
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={6}
                maxLength={500}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none resize-y text-gray-900"
              />
              <div className="text-xs text-gray-500 mt-1 text-right">{formData.description.length}/500 characters</div>
            </div>

            <div>
              <label htmlFor="eventType" className="block text-sm font-semibold text-gray-900 mb-2">
                Event Type <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="eventType"
                  name="eventType"
                  value={formData.eventType}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none appearance-none bg-white text-gray-900"
                >
                  <option value="regu">Regu</option>
                  <option value="double">Double</option>
                  <option value="quad">Quad</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                  keyboard_arrow_down
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="genderCategory" className="block text-sm font-semibold text-gray-900 mb-2">
                  Tournament For <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="genderCategory"
                    value={genderCategory}
                    onChange={(e) => setGenderCategory(e.target.value as 'male' | 'female' | 'both')}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none appearance-none bg-white text-gray-900"
                  >
                    <option value="both">Male & Female</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                    keyboard_arrow_down
                  </span>
                </div>
              </div>

              <div>
                <label htmlFor="tournamentImage" className="block text-sm font-semibold text-gray-900 mb-2">
                  Tournament Image
                </label>
                <input
                  id="tournamentImage"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none text-gray-900 bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Schedule & Registration */}
        <div className="border-t border-gray-200 pt-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#5a0a8f] rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-white">calendar_today</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Schedule & Registration</h2>
          </div>

          <div className="space-y-6 pl-13">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-semibold text-gray-900 mb-2">
                  Start Date
                </label>
                <DatePickerField
                  id="startDate"
                  name="startDate"
                  label="Select start date"
                  value={formData.startDate}
                  onChange={(date) => handleInputChange({ target: { name: 'startDate', value: date } } as any)}
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-semibold text-gray-900 mb-2">
                  End Date
                </label>
                <DatePickerField
                  id="endDate"
                  name="endDate"
                  label="Select end date"
                  minDate={formData.startDate ? dayjs(formData.startDate) : undefined}
                  value={formData.endDate}
                  onChange={(date) => handleInputChange({ target: { name: 'endDate', value: date } } as any)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">Registration Window</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Opens</label>
                  <DatePickerField
                    name="registrationOpens"
                    label="Registration opens"
                    value={formData.registrationOpens}
                    onChange={(date) => handleInputChange({ target: { name: 'registrationOpens', value: date } } as any)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Closes</label>
                  <DatePickerField
                    name="registrationCloses"
                    label="Registration closes"
                    minDate={formData.registrationOpens ? dayjs(formData.registrationOpens) : undefined}
                    value={formData.registrationCloses}
                    onChange={(date) => handleInputChange({ target: { name: 'registrationCloses', value: date } } as any)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Venue Details */}
        <div className="border-t border-gray-200 pt-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#5a0a8f] rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-white">location_on</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Venue Details</h2>
          </div>

          <div className="space-y-6 pl-13">
            <div>
              <label htmlFor="venueName" className="block text-sm font-semibold text-gray-900 mb-2">
                Stadium / Venue Name
              </label>
              <input
                type="text"
                id="venueName"
                name="venueName"
                value={formData.venueName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none text-gray-900"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-semibold text-gray-900 mb-2">
                  City
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none text-gray-900"
                />
              </div>
              <div>
                <label htmlFor="pincode" className="block text-sm font-semibold text-gray-900 mb-2">
                  Pincode
                </label>
                <input
                  type="text"
                  id="pincode"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none text-gray-900"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tournament Winners */}
        <div className="border-t border-gray-200 pt-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#5a0a8f] rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-white">emoji_events</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Tournament Winners</h2>
          </div>

          <div className="space-y-6 pl-13">

            {/* 1st Place */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                1st Place (Gold)
              </label>
              <Autocomplete
                multiple
                options={playerOptions}
                getOptionLabel={(option) => `${option.fullName} (${option.district || 'N/A'})`}
                value={winners.first}
                onChange={(_, newValue) => {
                  setWinners(prev => ({ ...prev, first: newValue }))
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Select Winner(s)"
                    variant="outlined"
                    className="bg-white"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '0.5rem' } }}
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => {
                    const { key, ...tagProps } = getTagProps({ index });
                    return (
                      <Chip
                        key={key}
                        variant="outlined"
                        label={option.fullName}
                        {...tagProps}
                      />
                    );
                  })
                }
                isOptionEqualToValue={(option, value) => option._id === value._id}
              />
            </div>

            {/* 2nd Place */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                2nd Place (Silver)
              </label>
              <Autocomplete
                multiple
                options={playerOptions}
                getOptionLabel={(option) => `${option.fullName} (${option.district || 'N/A'})`}
                value={winners.second}
                onChange={(_, newValue) => {
                  setWinners(prev => ({ ...prev, second: newValue }))
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Select Winner(s)"
                    variant="outlined"
                    className="bg-white"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '0.5rem' } }}
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => {
                    const { key, ...tagProps } = getTagProps({ index });
                    return (
                      <Chip
                        key={key}
                        variant="outlined"
                        label={option.fullName}
                        {...tagProps}
                      />
                    );
                  })
                }
                isOptionEqualToValue={(option, value) => option._id === value._id}
              />
            </div>

            {/* 3rd Place */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                3rd Place (Bronze)
              </label>
              <Autocomplete
                multiple
                options={playerOptions}
                getOptionLabel={(option) => `${option.fullName} (${option.district || 'N/A'})`}
                value={winners.third}
                onChange={(_, newValue) => {
                  setWinners(prev => ({ ...prev, third: newValue }))
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Select Winner(s)"
                    variant="outlined"
                    className="bg-white"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '0.5rem' } }}
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => {
                    const { key, ...tagProps } = getTagProps({ index });
                    return (
                      <Chip
                        key={key}
                        variant="outlined"
                        label={option.fullName}
                        {...tagProps}
                      />
                    );
                  })
                }
                isOptionEqualToValue={(option, value) => option._id === value._id}
              />
            </div>

          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
          <Link
            to="/admin/tournaments"
            className="px-5 py-2.5 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-[#5a0a8f] hover:bg-[#400466] text-white rounded-lg font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
