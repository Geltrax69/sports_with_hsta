import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { apiRequest } from '../../lib/api'
import { DatePickerField } from '../../components/DatePickerField'

export function CreateTournament() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    tournamentName: '',
    tournamentType: '',
    eventType: 'regu',
    description: '',
    startDate: '',
    endDate: '',
    registrationOpens: '',
    registrationCloses: '',
    venueName: '',
    city: '',
    pincode: '110001',
  })

  const [customTournamentType, setCustomTournamentType] = useState('')

  const [genderCategory, setGenderCategory] = useState<'male' | 'female' | 'both'>('both')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.tournamentName.trim()) {
      setError('Tournament Name is required')
      return
    }

    const resolvedTournamentType =
      formData.tournamentType === '__custom__' ? customTournamentType.trim() : formData.tournamentType.trim()

    if (!resolvedTournamentType) {
      setError('Tournament Type is required')
      return
    }

    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('title', formData.tournamentName.trim())
      fd.append('tournamentType', resolvedTournamentType)
      if (formData.description) fd.append('description', formData.description)
      if (formData.startDate) fd.append('startDate', formData.startDate)
      if (formData.endDate) fd.append('endDate', formData.endDate)
      if (formData.registrationOpens) fd.append('registrationOpens', formData.registrationOpens)
      if (formData.registrationCloses) fd.append('registrationCloses', formData.registrationCloses)
      if (formData.venueName) fd.append('venueName', formData.venueName)
      if (formData.city) fd.append('city', formData.city)
      if (formData.pincode) fd.append('pincode', formData.pincode)
      fd.append('genderCategory', genderCategory)
      fd.append('eventType', formData.eventType)
      if (imageFile) fd.append('image', imageFile)

      await apiRequest('/admin/tournaments', {
        method: 'POST',
        auth: true,
        body: fd,
      })

      navigate('/admin/tournaments')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tournament')
    } finally {
      setSubmitting(false)
    }
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
        <span className="text-gray-900 font-medium">Create New</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">Create New Tournament</h1>
        <p className="text-gray-600">
          Fill in the details below to officially sanction and schedule a new Sepak Takraw district tournament.
        </p>
      </div>

      {/* Step Navigation */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#5a0a8f] text-white rounded-full flex items-center justify-center font-bold text-sm">
            1
          </div>
          <span className="font-semibold text-[#5a0a8f]">Tournament Details</span>
        </div>
        <div className="flex-1 h-0.5 bg-gray-200"></div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center font-bold text-sm">
            2
          </div>
          <span className="font-medium text-gray-600">Review & Publish</span>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Form Card */}
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
                placeholder="e.g., 2024 North District Championship"
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
                  <option value="National Championship">National Championship</option>
                  <option value="State Championship">State Championship</option>
                  <option value="District Championship">District Championship</option>
                  <option value="Zone Qualifiers">Zone Qualifiers</option>
                  <option value="Federation Cup">Federation Cup</option>
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
                    placeholder="e.g., Inter-University Invitational"
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
                placeholder="Enter a brief description, special rules, or announcements..."
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
                  onChange={(date) => setFormData({ ...formData, startDate: date })}
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
                  value={formData.endDate}
                  onChange={(date) => setFormData({ ...formData, endDate: date })}
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
                    onChange={(date) => setFormData({ ...formData, registrationOpens: date })}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Closes</label>
                  <DatePickerField
                    name="registrationCloses"
                    label="Registration closes"
                    value={formData.registrationCloses}
                    onChange={(date) => setFormData({ ...formData, registrationCloses: date })}
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
                placeholder="e.g., Rajiv Gandhi Indoor Stadium"
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
                  placeholder="City"
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
                  placeholder="110001"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none text-gray-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Map</label>
              <div className="relative h-64 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-300">
                <div className="absolute inset-0 flex items-center justify-center">
                  <button className="flex items-center gap-2 bg-[#5a0a8f] hover:bg-[#400466] text-white px-6 py-3 rounded-lg font-bold transition-colors">
                    <span className="material-symbols-outlined">location_on</span>
                    Pin Location on Map
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
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
            {submitting ? 'Creating…' : 'Create Tournament'}
          </button>
        </div>
      </form>
    </div>
  )
}
