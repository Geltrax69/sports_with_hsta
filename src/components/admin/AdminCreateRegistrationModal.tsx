import { useMemo, useState } from 'react'
import { useDistricts } from '../../context/DistrictsContext'
import type { PlayerRegistration } from '../../context/RegistrationsContext'

type RoleType = 'player' | 'coach' | 'referee'

interface AdminCreateRegistrationModalProps {
  role: RoleType
  onClose: () => void
  onSubmit: (data: Partial<PlayerRegistration>) => Promise<void>
}

const roleLabelMap: Record<RoleType, string> = {
  player: 'Player',
  coach: 'Coach',
  referee: 'Referee',
}

export function AdminCreateRegistrationModal({ role, onClose, onSubmit }: AdminCreateRegistrationModalProps) {
  const { districts } = useDistricts()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    district: '',
    gender: '',
    category: '',
    fatherName: '',
    motherName: '',
    aadhaarNumber: '',
  })

  const districtOptions = useMemo(
    () => [...districts].sort((a, b) => a.name.localeCompare(b.name)),
    [districts],
  )

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      await onSubmit({
        type: role,
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        dateOfBirth: form.dateOfBirth,
        district: form.district,
        gender: form.gender,
        category: form.category.trim(),
        fatherName: form.fatherName.trim(),
        motherName: form.motherName.trim(),
        aadhaarNumber: form.aadhaarNumber.trim(),
      })
      onClose()
    } catch (err: any) {
      setError(err?.message || `Failed to add ${roleLabelMap[role].toLowerCase()}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <div>
            <h2 className="text-2xl font-black text-gray-900">Add New {roleLabelMap[role]}</h2>
            <p className="text-sm text-gray-500">Admin-created records are approved automatically.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 transition hover:text-gray-600" disabled={submitting}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">Full Name</label>
              <input
                value={form.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-[#5a0a8f]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-[#5a0a8f]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">Phone</label>
              <input
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-[#5a0a8f]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">Date of Birth</label>
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-[#5a0a8f]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">District</label>
              <select
                value={form.district}
                onChange={(e) => handleChange('district', e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-[#5a0a8f]"
              >
                <option value="">Select district</option>
                {districtOptions.map((district) => (
                  <option key={district.id} value={district.id}>
                    {district.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">Gender</label>
              <select
                value={form.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-[#5a0a8f]"
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">Category</label>
              <input
                value={form.category}
                onChange={(e) => handleChange('category', e.target.value)}
                placeholder="General / OBC / SC / ST"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-[#5a0a8f]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">Aadhaar Number</label>
              <input
                value={form.aadhaarNumber}
                onChange={(e) => handleChange('aadhaarNumber', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-[#5a0a8f]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">Father's Name</label>
              <input
                value={form.fatherName}
                onChange={(e) => handleChange('fatherName', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-[#5a0a8f]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">Mother's Name</label>
              <input
                value={form.motherName}
                onChange={(e) => handleChange('motherName', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-[#5a0a8f]"
              />
            </div>
          </div>

          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2.5 font-medium text-gray-700 transition hover:bg-gray-50"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#5a0a8f] px-5 py-2.5 font-bold text-white transition hover:bg-[#400466] disabled:opacity-60"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : `Add ${roleLabelMap[role]}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
