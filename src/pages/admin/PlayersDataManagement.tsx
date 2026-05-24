import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { apiRequest } from '../../lib/api'
import { DatePickerField } from '../../components/DatePickerField'
import {
  createPlayer,
  deletePlayer,
  emptyPlayerForm,
  fetchPlayers,
  playerToForm,
  updatePlayer,
} from '../../lib/playersApi'
import type { Player, PlayerForm, PlayerTournament, PlayerType } from '../../types/player'

/** Approved player registration — minimal shape for the quick-fill dropdown. */
type ApprovedReg = {
  _id: string
  fullName: string
  district?: string
  dateOfBirth?: string
  gender?: string
  category?: string
  profilePhoto?: string     // signed / public URL — for preview display
  profilePhotoKey?: string  // raw S3 key — used to copy to public location
  // Games played counts (stored as strings in the registration model)
  districtGames?: string
  stateGames?: string
  nationalGames?: string
  internationalGames?: string
}

function calcAgeFromDob(dob?: string): number {
  if (!dob) return 0
  const birth = new Date(dob)
  if (isNaN(birth.getTime())) return 0
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  if (
    now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())
  ) age--
  return Math.max(0, age)
}

function mapGenderToCategory(gender?: string): string {
  const g = (gender || '').toUpperCase()
  if (g === 'MALE' || g === 'M') return 'MEN'
  if (g === 'FEMALE' || g === 'F') return 'WOMEN'
  if (g === 'JUNIOR') return 'JUNIOR'
  return ''
}

export function PlayersDataManagement() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<PlayerType | 'all'>('all')
  const [form, setForm] = useState<PlayerForm>(emptyPlayerForm())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // ── Quick-fill from registered players ────────────────────────────────────
  const [regPlayers, setRegPlayers]   = useState<ApprovedReg[]>([])
  const [regSearch, setRegSearch]     = useState('')
  const [regOpen, setRegOpen]         = useState(false)
  const [copyingPhoto, setCopyingPhoto] = useState(false)
  const regDropRef = useRef<HTMLDivElement>(null)

  // Fetch approved registered players for quick-fill
  useEffect(() => {
    apiRequest<{ registrations: ApprovedReg[] }>('/players?status=approved', { auth: true })
      .then((d) => setRegPlayers(d.registrations || []))
      .catch(() => {})
  }, [])

  // Close quick-fill dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (regDropRef.current && !regDropRef.current.contains(e.target as Node)) {
        setRegOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filteredReg = regSearch.trim()
    ? regPlayers.filter(
        (p) =>
          p.fullName.toLowerCase().includes(regSearch.toLowerCase()) ||
          (p.district || '').toLowerCase().includes(regSearch.toLowerCase()),
      )
    : regPlayers

  const fillFromReg = async (reg: ApprovedReg) => {
    // Close dropdown immediately and fill text/number fields
    setRegSearch(reg.fullName)
    setRegOpen(false)
    setForm((prev) => ({
      ...prev,
      name:               reg.fullName    || prev.name,
      state:              reg.district    || prev.state,
      dob:                reg.dateOfBirth || prev.dob,
      age:                calcAgeFromDob(reg.dateOfBirth) || prev.age,
      category:           mapGenderToCategory(reg.gender) || reg.category || prev.category,
      districtGames:      Number(reg.districtGames)      || 0,
      stateGames:         Number(reg.stateGames)         || 0,
      nationalGames:      Number(reg.nationalGames)      || 0,
      internationalGames: Number(reg.internationalGames) || 0,
    }))

    // Show the signed preview immediately (even before copy finishes)
    if (reg.profilePhoto) setImagePreview(reg.profilePhoto)

    // Copy the private S3 photo to a permanent public location
    if (reg.profilePhotoKey) {
      setCopyingPhoto(true)
      try {
        const result = await apiRequest<{ url: string }>('/directory-players/copy-photo', {
          method: 'POST',
          auth: true,
          body: JSON.stringify({ sourceKey: reg.profilePhotoKey }),
        })
        if (result.url) {
          setForm((prev) => ({ ...prev, image: result.url }))
          setImagePreview(result.url)
        }
      } catch (err) {
        // Show error so admin knows to upload manually
        setUploadError(
          'Could not copy registration photo. Please upload a photo manually.'
        )
        console.error('[copyRegPhoto]', err)
      } finally {
        setCopyingPhoto(false)
      }
    }
  }

  const loadPlayers = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchPlayers(undefined, false)
      setPlayers(data)
    } catch {
      setMessage('Failed to load players. Check that the backend is running.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPlayers()
  }, [loadPlayers])

  const filtered = filterType === 'all'
    ? players
    : players.filter((p) => p.playerType === filterType)

  const handleChange = (field: keyof PlayerForm) => (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const value = e.target.type === 'number' ? Number(e.target.value) : e.target.value
    setForm({ ...form, [field]: value })
  }

  const handleCheckbox = (field: 'published') => (e: ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [field]: e.target.checked })
  }

  const handlePhotoSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError(null)

    const localPreview = URL.createObjectURL(file)
    setImagePreview(localPreview)

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      formData.append('name', file.name)
      const response = await apiRequest<{ url: string }>('/uploads/images', {
        method: 'POST',
        body: formData,
        auth: true,
      })
      if (response.url) {
        setForm((prev) => ({ ...prev, image: response.url }))
        setImagePreview(response.url)
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Photo upload failed. Please try again.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const addTournament = () => {
    const entry: PlayerTournament = {
      eventName: '',
      year: new Date().getFullYear(),
      category: '',
      team: '',
      result: 'GOLD',
    }
    setForm({ ...form, tournaments: [...(form.tournaments || []), entry] })
  }

  const updateTournament = (index: number, field: keyof PlayerTournament, value: string | number) => {
    const tournaments = [...(form.tournaments || [])]
    tournaments[index] = { ...tournaments[index], [field]: value }
    setForm({ ...form, tournaments })
  }

  const removeTournament = (index: number) => {
    setForm({ ...form, tournaments: (form.tournaments || []).filter((_, i) => i !== index) })
  }

  const resetForm = () => {
    setForm(emptyPlayerForm())
    setEditingId(null)
    setImagePreview(null)
    setUploadError(null)
    setRegSearch('')
    setRegOpen(false)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.name?.trim()) return
    setSubmitting(true)
    setMessage('')
    try {
      if (editingId) {
        await updatePlayer(editingId, form)
        setMessage('Player updated successfully.')
      } else {
        await createPlayer(form)
        setMessage('Player added successfully.')
      }
      resetForm()
      await loadPlayers()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to save player.')
    } finally {
      setSubmitting(false)
    }
  }

  const startEdit = (player: Player) => {
    setForm(playerToForm(player))
    setEditingId(player._id || player.id)
    setImagePreview(player.image || null)
    setUploadError(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this player profile?')) return
    try {
      await deletePlayer(id)
      if (editingId === id) resetForm()
      await loadPlayers()
      setMessage('Player deleted.')
    } catch {
      setMessage('Failed to delete player.')
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
        <Link to="/admin/dashboard" className="hover:text-[#5a0a8f]">Admin</Link>
        <span>›</span>
        <span className="text-gray-900 font-medium">Players Data</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">Players Data</h1>
          <p className="text-gray-600">
            Manage public player profiles. Categorize as National Player or International Player.
          </p>
        </div>
        <div className="text-sm text-gray-500">Total profiles: {players.length}</div>
      </div>

      {message && (
        <div className="mb-4 rounded-lg border border-[#5a0a8f]/20 bg-[#5a0a8f]/5 px-4 py-3 text-sm text-[#5a0a8f]">
          {message}
        </div>
      )}

      <form className="bg-white rounded-xl border border-gray-200 p-6 mb-8" onSubmit={handleSubmit}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <h2 className="text-lg font-bold text-gray-900">
            {editingId ? 'Edit Player Profile' : 'Add New Player Profile'}
          </h2>
          <div className="flex gap-2">
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 bg-[#5a0a8f] hover:bg-[#400466] disabled:opacity-60 text-white px-4 py-2 rounded-lg font-bold transition-colors"
            >
              <span className="material-symbols-outlined text-sm">save</span>
              {submitting ? 'Saving...' : editingId ? 'Update Player' : 'Add Player'}
            </button>
          </div>
        </div>

        {/* ── Quick-fill from Registered Player ── */}
        <div className="mb-6 p-4 rounded-xl bg-purple-50 border border-purple-200">
          <p className="text-xs font-bold text-[#5a0a8f] uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">person_search</span>
            Auto-fill from Registered Player
          </p>
          <div className="relative" ref={regDropRef}>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px] pointer-events-none">
                search
              </span>
              <input
                type="text"
                placeholder="Search by name or district…"
                value={regSearch}
                onChange={(e) => { setRegSearch(e.target.value); setRegOpen(true) }}
                onFocus={() => setRegOpen(true)}
                className="w-full pl-9 pr-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] text-gray-900 bg-white text-sm"
              />
              {regSearch && (
                <button
                  type="button"
                  onClick={() => { setRegSearch(''); setRegOpen(false) }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              )}
            </div>

            {regOpen && filteredReg.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-30 bg-white border border-gray-200 rounded-xl shadow-xl mt-1 max-h-56 overflow-y-auto">
                {filteredReg.map((reg) => (
                  <button
                    key={reg._id}
                    type="button"
                    onClick={() => void fillFromReg(reg)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-purple-50 text-left border-b border-gray-100 last:border-b-0 transition-colors"
                  >
                    <img
                      src={
                        reg.profilePhoto ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(reg.fullName)}&background=5a0a8f&color=fff&size=40`
                      }
                      alt={reg.fullName}
                      className="w-9 h-9 rounded-full object-cover shrink-0"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(reg.fullName)}&background=5a0a8f&color=fff&size=40`
                      }}
                    />
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 text-sm truncate">{reg.fullName}</div>
                      <div className="text-xs text-gray-500 truncate">{reg.district || 'No district assigned'}</div>
                    </div>
                    <span className="ml-auto shrink-0 text-xs text-[#5a0a8f] font-semibold">Select</span>
                  </button>
                ))}
              </div>
            )}

            {regOpen && regSearch && filteredReg.length === 0 && (
              <div className="absolute top-full left-0 right-0 z-30 bg-white border border-gray-200 rounded-xl shadow-xl mt-1 px-4 py-3 text-sm text-gray-500">
                No approved players match "{regSearch}".
              </div>
            )}
          </div>
          <p className="text-xs text-purple-700 mt-2">
            Select an approved registered player to auto-fill name, district, date of birth, and age.
            You can still edit any field after selecting.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Category *</label>
            <select
              required
              value={form.playerType}
              onChange={handleChange('playerType')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] text-gray-900"
            >
              <option value="national">National Player</option>
              <option value="international">International Player</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Full Name *</label>
            <input
              required
              value={form.name}
              onChange={handleChange('name')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] text-gray-900"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Role / Position</label>
            <input
              value={form.role}
              onChange={handleChange('role')}
              placeholder="Striker, Feeder, Tekong"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] text-gray-900"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">State</label>
            <input
              value={form.state}
              onChange={handleChange('state')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] text-gray-900"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Gender Category</label>
            <select
              value={form.category}
              onChange={handleChange('category')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] text-gray-900"
            >
              <option value="">Select</option>
              <option value="MEN">Men</option>
              <option value="WOMEN">Women</option>
              <option value="JUNIOR">Junior</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Age</label>
            <input
              type="number"
              value={form.age}
              onChange={handleChange('age')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] text-gray-900"
            />
          </div>
          <div className="flex flex-col gap-2">
            <DatePickerField
              label="Date of Birth"
              value={form.dob || ''}
              onChange={(date) => setForm({ ...form, dob: date })}
              maxDate={undefined}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Height</label>
            <input
              value={form.height}
              onChange={handleChange('height')}
              placeholder="170 cm"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] text-gray-900"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Weight</label>
            <input
              value={form.weight}
              onChange={handleChange('weight')}
              placeholder="65 kg"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] text-gray-900"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Badge Label</label>
            <input
              value={form.badge}
              onChange={handleChange('badge')}
              placeholder="NATIONAL TEAM"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] text-gray-900"
            />
          </div>
        </div>

        <div className="mb-6 p-4 border border-gray-200 rounded-xl bg-gray-50">
          <label className="text-sm font-medium text-gray-700 mb-3 block">Player Photo</label>
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="relative w-32 h-32 shrink-0 rounded-full overflow-hidden border-4 border-white shadow-md bg-white">
              {copyingPhoto ? (
                /* Copying spinner */
                <div className="w-full h-full flex flex-col items-center justify-center bg-purple-50 gap-1">
                  <div className="w-6 h-6 rounded-full border-2 border-[#5a0a8f] border-t-transparent animate-spin" />
                  <span className="text-[9px] font-bold text-[#5a0a8f] uppercase tracking-wide">Copying…</span>
                </div>
              ) : (imagePreview || form.image) ? (
                <img
                  src={imagePreview || form.image}
                  alt="Player preview"
                  className="w-full h-full object-cover"
                  onError={() => setImagePreview(null)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#5a0a8f]/10 text-[#5a0a8f]">
                  <span className="material-symbols-outlined text-5xl">person</span>
                </div>
              )}
              {/* Green tick when photo is saved */}
              {!copyingPhoto && form.image && (
                <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-[12px]">check</span>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-3">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || copyingPhoto}
                className="inline-flex items-center gap-2 bg-[#5a0a8f] hover:bg-[#400466] disabled:opacity-60 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-colors w-fit"
              >
                <span className="material-symbols-outlined text-lg">upload</span>
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
              <p className="text-xs text-gray-500">JPG or PNG, max 5MB. Photo appears on the public player profile.</p>
              {uploadError && <p className="text-red-600 text-sm">{uploadError}</p>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="text-sm font-medium text-gray-700">Biography</label>
            <textarea
              rows={4}
              value={form.biography}
              onChange={handleChange('biography')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] text-gray-900"
            />
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="text-sm font-medium text-gray-700">Skills (comma-separated)</label>
            <input
              value={form.skillsText}
              onChange={handleChange('skillsText')}
              placeholder="Sunback Spike, Agility, Team Leadership"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] text-gray-900"
            />
          </div>
        </div>

        <h3 className="text-md font-bold text-gray-900 mb-3">Career Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-3">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Gold Medals</label>
            <input type="number" min={0} value={form.goldMedals} onChange={handleChange('goldMedals')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Silver Medals</label>
            <input type="number" min={0} value={form.silverMedals} onChange={handleChange('silverMedals')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
          </div>
        </div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 mt-1">Games Played</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">District Games</label>
            <input type="number" min={0} value={form.districtGames ?? 0} onChange={handleChange('districtGames')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">State Games</label>
            <input type="number" min={0} value={form.stateGames ?? 0} onChange={handleChange('stateGames')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">National Games</label>
            <input type="number" min={0} value={form.nationalGames ?? 0} onChange={handleChange('nationalGames')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">International Games</label>
            <input type="number" min={0} value={form.internationalGames ?? 0} onChange={handleChange('internationalGames')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <h3 className="text-md font-bold text-gray-900">Tournament History</h3>
          <button type="button" onClick={addTournament} className="text-sm font-bold text-[#5a0a8f] hover:underline">
            + Add Tournament
          </button>
        </div>
        {(form.tournaments || []).map((t, idx) => (
          <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3 p-4 bg-gray-50 rounded-lg">
            <input
              placeholder="Event Name"
              value={t.eventName}
              onChange={(e) => updateTournament(idx, 'eventName', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
            />
            <input
              type="number"
              placeholder="Year"
              value={t.year}
              onChange={(e) => updateTournament(idx, 'year', Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
            />
            <input
              placeholder="Category"
              value={t.category}
              onChange={(e) => updateTournament(idx, 'category', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
            />
            <input
              placeholder="Team"
              value={t.team}
              onChange={(e) => updateTournament(idx, 'team', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
            />
            <div className="flex gap-2">
              <select
                value={t.result}
                onChange={(e) => updateTournament(idx, 'result', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
              >
                <option value="GOLD">Gold</option>
                <option value="SILVER">Silver</option>
                <option value="BRONZE">Bronze</option>
              </select>
              <button type="button" onClick={() => removeTournament(idx)} className="text-red-600 hover:text-red-800">
                <span className="material-symbols-outlined">delete</span>
              </button>
            </div>
          </div>
        ))}

        <div className="mt-4 flex items-center gap-2">
          <input
            id="published"
            type="checkbox"
            checked={form.published !== false}
            onChange={handleCheckbox('published')}
            className="rounded border-gray-300 text-[#5a0a8f] focus:ring-[#5a0a8f]"
          />
          <label htmlFor="published" className="text-sm text-gray-700">Published (visible on public site)</label>
        </div>
      </form>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-bold text-gray-900">All Player Profiles</h2>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as PlayerType | 'all')}
            className="ml-auto text-sm border border-gray-300 rounded-lg px-3 py-1.5 text-gray-700"
          >
            <option value="all">All Categories</option>
            <option value="national">National Player</option>
            <option value="international">International Player</option>
          </select>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No player profiles yet. Add your first player above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Player</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">State</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((player) => (
                  <tr key={player._id || player.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={player.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=5a0a8f&color=fff`}
                          alt={player.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <div className="font-semibold text-gray-900">{player.name}</div>
                          <div className="text-xs text-gray-500">{player.role}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold uppercase ${player.playerType === 'national' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                        {player.playerType === 'national' ? 'National' : 'International'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{player.state}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${player.published !== false ? 'text-green-600' : 'text-gray-400'}`}>
                        {player.published !== false ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => startEdit(player)}
                        className="text-[#5a0a8f] font-medium text-sm mr-3 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(player._id || player.id)}
                        className="text-red-600 font-medium text-sm hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
