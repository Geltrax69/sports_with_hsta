import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useWebsiteContent } from '../../context/WebsiteContentContext'
import { API_BASE_URL, getAuthToken } from '../../lib/api'

const emptyForm = {
  name: '',
  title: '',
  role: '',
  region: '',
  email: '',
  phone: '',
  photoUrl: '',
}

export function OfficialsManagement() {
  const { content, addOfficial, updateOfficial, removeOfficial } = useWebsiteContent()
  const officials = [...(content.aboutPage.officials || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleChange = (field: keyof typeof emptyForm) => (e: ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [field]: e.target.value })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.title) return
    setSubmitting(true)
    try {
      if (editingId) {
        await updateOfficial(editingId, form)
      } else {
        await addOfficial(form)
      }
      setForm(emptyForm)
      setEditingId(null)
    } finally {
      setSubmitting(false)
    }
  }

  const startEdit = (officialId: string) => {
    const current = officials.find((o) => o.id === officialId)
    if (!current) return
    setForm({
      name: current.name || '',
      title: current.title || '',
      role: current.role || '',
      region: current.region || '',
      email: current.email || '',
      phone: current.phone || '',
      photoUrl: current.photoUrl || '',
    })
    setEditingId(current.id)
  }

  const handlePhotoSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError(null)
    setUploading(true)
    try {
      const token = getAuthToken()
      const formData = new FormData()
      formData.append('image', file)
      formData.append('name', file.name)
      const response = await fetch(`${API_BASE_URL}/uploads/images`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      })
      if (!response.ok) {
        throw new Error('Upload failed')
      }
      const data = await response.json()
      setForm({ ...form, photoUrl: data.url })
    } catch (err) {
      setUploadError('Photo upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
        <Link to="/admin/dashboard" className="hover:text-[#5a0a8f]">
          Admin
        </Link>
        <span>›</span>
        <span className="text-gray-900 font-medium">Officials</span>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">Manage Officials</h1>
          <p className="text-gray-600">Create, view, and manage federation official profiles.</p>
        </div>
        <div className="text-sm text-gray-500">Total officials: {officials.length}</div>
      </div>

      <form className="bg-white rounded-xl border border-gray-200 p-6 mb-8" onSubmit={handleSubmit}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Register New Official</h2>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 bg-[#5a0a8f] hover:bg-[#400466] disabled:opacity-60 text-white px-4 py-2 rounded-lg font-bold transition-colors"
          >
            <span className="material-symbols-outlined text-sm">person_add</span>
            {submitting ? 'Saving...' : editingId ? 'Update Official' : 'Add Official'}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Name *</label>
            <input
              required
              value={form.name}
              onChange={handleChange('name')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] text-gray-900 placeholder-gray-400"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Title *</label>
            <input
              required
              value={form.title}
              onChange={handleChange('title')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] text-gray-900 placeholder-gray-400"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Role</label>
            <input
              value={form.role}
              onChange={handleChange('role')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] text-gray-900 placeholder-gray-400"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Region / Jurisdiction</label>
            <input
              value={form.region}
              onChange={handleChange('region')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] text-gray-900 placeholder-gray-400"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={handleChange('email')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] text-gray-900 placeholder-gray-400"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Phone</label>
            <input
              value={form.phone}
              onChange={handleChange('phone')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] text-gray-900 placeholder-gray-400"
            />
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="text-sm font-medium text-gray-700">Photo</label>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                {uploading ? 'Uploading...' : 'Choose & Upload Photo'}
              </button>
              {uploadError && <span className="text-sm text-red-600">{uploadError}</span>}
            </div>
            {form.photoUrl && (
              <div className="flex items-center gap-3 mt-2">
                <img src={form.photoUrl} alt="Official" className="w-16 h-16 rounded-full object-cover border" />
                <span className="text-sm text-gray-600 break-all">{form.photoUrl}</span>
              </div>
            )}
          </div>
        </div>
      </form>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Current Officials</h2>
        {officials.length === 0 ? (
          <div className="text-gray-600">No officials added yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {officials.map((official) => (
              <div key={official.id} className="border border-gray-200 rounded-lg p-4 flex gap-3 items-start">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-bold uppercase">
                  {official.name.slice(0, 2)}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-gray-900">{official.name}</div>
                      <div className="text-sm text-gray-600">{official.title}</div>
                      <div className="text-xs text-gray-500">{official.role || official.region || 'National'}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => startEdit(official.id)}
                        className="text-[#5a0a8f] hover:text-[#400466] text-sm flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-base">edit</span>
                        Edit
                      </button>
                      <button
                        onClick={() => removeOfficial(official.id)}
                        className="text-red-600 hover:text-red-700 text-sm flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-gray-700 space-y-1">
                    {official.email && (
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">mail</span>
                        <a className="text-[#5a0a8f] hover:underline" href={`mailto:${official.email}`}>
                          {official.email}
                        </a>
                      </div>
                    )}
                    {official.phone && (
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">call</span>
                        <a className="text-[#5a0a8f] hover:underline" href={`tel:${official.phone}`}>
                          {official.phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
