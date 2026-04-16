import { useEffect, useMemo, useState } from 'react'
import { useDistricts } from '../../context/DistrictsContext'
import { DatePickerField } from '../DatePickerField'
import { processImageFile } from '../../lib/imageCompression'

type RoleType = 'player' | 'coach' | 'referee'

interface AdminCreateRegistrationModalProps {
  role: RoleType
  onClose: () => void
  onSubmit: (data: FormData) => Promise<void>
}

const roleLabelMap: Record<RoleType, string> = {
  player: 'Player',
  coach: 'Coach',
  referee: 'Referee',
}

const initialForm = {
  fullName: '',
  fatherName: '',
  motherName: '',
  phone: '',
  dateOfBirth: '',
  gender: '',
  category: '',
  email: '',
  password: '',
  district: '',
  aadhaarNumber: '',
  passportNumber: '',
  passportExpiryDate: '',
  passportIssuedPlace: '',
  tShirtSize: '',
  trackSuitSize: '',
  shoesSize: '',
  pantSize: '',
  districtGames: '',
  stateGames: '',
  nationalGames: '',
  internationalGames: '',
}

const fieldClass =
  'w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-[#5a0a8f] bg-white'

const fileButtonClass =
  'inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#5a0a8f] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#400466]'

export function AdminCreateRegistrationModal({ role, onClose, onSubmit }: AdminCreateRegistrationModalProps) {
  const { districts } = useDistricts()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null)
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null)
  const [aadhaarDocument, setAadhaarDocument] = useState<File | null>(null)
  const [aadhaarPreview, setAadhaarPreview] = useState<string | null>(null)
  const [passportDocument, setPassportDocument] = useState<File | null>(null)
  const [passportPreview, setPassportPreview] = useState<string | null>(null)
  const [certificates, setCertificates] = useState<File[]>([])

  const districtOptions = useMemo(() => [...districts].sort((a, b) => a.name.localeCompare(b.name)), [districts])

  useEffect(() => {
    return () => {
      if (profilePhotoPreview && profilePhotoPreview !== 'pdf') URL.revokeObjectURL(profilePhotoPreview)
      if (aadhaarPreview && aadhaarPreview !== 'pdf') URL.revokeObjectURL(aadhaarPreview)
      if (passportPreview && passportPreview !== 'pdf') URL.revokeObjectURL(passportPreview)
    }
  }, [profilePhotoPreview, aadhaarPreview, passportPreview])

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleAadhaarChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 12)
    const formatted = digits.replace(/(\d{4})(\d{0,4})(\d{0,4})/, (_m, a, b, c) => [a, b, c].filter(Boolean).join('-'))
    handleChange('aadhaarNumber', formatted)
  }

  const updatePreview = (
    file: File | null,
    currentPreview: string | null,
    setPreview: (value: string | null) => void,
  ) => {
    if (currentPreview && currentPreview !== 'pdf') {
      URL.revokeObjectURL(currentPreview)
    }

    if (!file) {
      setPreview(null)
      return
    }

    if (file.type === 'application/pdf') {
      setPreview('pdf')
      return
    }

    setPreview(URL.createObjectURL(file))
  }

  const handleProfilePhotoChange = async (file: File | null) => {
    try {
      setError(null)
      if (!file) {
        setProfilePhoto(null)
        updatePreview(null, profilePhotoPreview, setProfilePhotoPreview)
        return
      }

      const processed = await processImageFile(file)
      setProfilePhoto(processed)
      updatePreview(processed, profilePhotoPreview, setProfilePhotoPreview)
    } catch (err: any) {
      setError(err?.message || 'Failed to process profile photo')
    }
  }

  const handleDocumentChange = (
    file: File | null,
    currentPreview: string | null,
    setFile: (value: File | null) => void,
    setPreview: (value: string | null) => void,
    label: string,
  ) => {
    if (!file) {
      setFile(null)
      updatePreview(null, currentPreview, setPreview)
      return
    }

    const valid = file.type.startsWith('image/') || file.type === 'application/pdf'
    if (!valid) {
      setError(`${label} must be an image or PDF file`)
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(`${label} must be under 5MB`)
      return
    }

    setError(null)
    setFile(file)
    updatePreview(file, currentPreview, setPreview)
  }

  const handleCertificatesChange = (files: FileList | null) => {
    const nextFiles = Array.from(files || []).slice(0, 10)
    const invalid = nextFiles.find((file) => !(file.type.startsWith('image/') || file.type === 'application/pdf'))
    if (invalid) {
      setError('Certificates must be images or PDF files only')
      return
    }

    setError(null)
    setCertificates(nextFiles)
  }

  const validateForm = () => {
    if (!profilePhoto) return 'Profile photo is required.'
    if (!aadhaarDocument) return 'Aadhaar document is required.'
    if (form.phone.replace(/\D/g, '').length !== 10) return 'Phone number must be 10 digits.'
    if (form.aadhaarNumber.replace(/\D/g, '').length !== 12) return 'Aadhaar number must be 12 digits.'
    if (form.password.length < 8) return 'Password must be at least 8 characters.'
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const validationError = validateForm()
    if (validationError) {
      setSubmitting(false)
      setError(validationError)
      return
    }

    try {
      const payload = new FormData()
      Object.entries(form).forEach(([key, value]) => payload.append(key, value))
      payload.append('profilePhoto', profilePhoto!)
      payload.append('aadhaarDocument', aadhaarDocument!)
      if (passportDocument) payload.append('passportDocument', passportDocument)
      certificates.forEach((file) => payload.append('certificates', file))

      await onSubmit(payload)
      onClose()
    } catch (err: any) {
      setError(err?.message || `Failed to add ${roleLabelMap[role].toLowerCase()}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-6xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <div>
            <h2 className="text-2xl font-black text-gray-900">Add New {roleLabelMap[role]}</h2>
            <p className="text-sm text-gray-500">
              Fill the full registration details. Admin-created records are approved automatically.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 transition hover:text-gray-600" disabled={submitting}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[88vh] space-y-8 overflow-y-auto p-6">
          <section className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Personal Information</h3>
              <p className="text-sm text-gray-500">Same core details as the public registration form.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Full Name</label>
                <input value={form.fullName} onChange={(e) => handleChange('fullName', e.target.value)} required className={fieldClass} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Father's Name</label>
                <input value={form.fatherName} onChange={(e) => handleChange('fatherName', e.target.value)} required className={fieldClass} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Mother's Name</label>
                <input value={form.motherName} onChange={(e) => handleChange('motherName', e.target.value)} required className={fieldClass} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Phone</label>
                <input
                  value={form.phone}
                  onChange={(e) => handleChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  required
                  maxLength={10}
                  className={fieldClass}
                />
                <p className="mt-1 text-xs text-gray-500">10 digit mobile number</p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Date of Birth</label>
                <DatePickerField
                  id={`${role}-date-of-birth`}
                  name="dateOfBirth"
                  label="Select birth date"
                  value={form.dateOfBirth}
                  onChange={(date) => handleChange('dateOfBirth', date)}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">District</label>
                <select value={form.district} onChange={(e) => handleChange('district', e.target.value)} required className={fieldClass}>
                  <option value="">Select district</option>
                  {districtOptions.map((district) => (
                    <option key={district.id} value={district.id}>
                      {district.name} {district.zone ? `(${district.zone})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Gender</label>
                <select value={form.gender} onChange={(e) => handleChange('gender', e.target.value)} required className={fieldClass}>
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Category</label>
                <select value={form.category} onChange={(e) => handleChange('category', e.target.value)} required className={fieldClass}>
                  <option value="">Select category</option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                  <option value="General">General</option>
                  <option value="OBC">OBC</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t border-gray-100 pt-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Account Details</h3>
              <p className="text-sm text-gray-500">Email and password are required like public registration.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Email Address</label>
                <input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} required className={fieldClass} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Account Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    required
                    minLength={8}
                    className={`${fieldClass} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-[#5a0a8f]"
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">Minimum 8 characters</p>
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t border-gray-100 pt-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Identification Documents</h3>
              <p className="text-sm text-gray-500">Profile photo and Aadhaar are required. Passport is optional.</p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">Profile Photo</label>
                <div className="rounded-lg border-2 border-gray-200 bg-white p-4">
                  {profilePhotoPreview ? (
                    <div className="flex items-center gap-3">
                      <img src={profilePhotoPreview} alt="Profile preview" className="h-16 w-16 rounded-full object-cover border border-gray-200" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-gray-900">{profilePhoto?.name}</div>
                        <div className="mt-1 flex gap-3">
                          <label className="cursor-pointer text-xs font-bold text-[#5a0a8f] hover:underline">
                            Change
                            <input type="file" accept="image/*" onChange={(e) => void handleProfilePhotoChange(e.target.files?.[0] || null)} className="hidden" />
                          </label>
                          <button type="button" onClick={() => void handleProfilePhotoChange(null)} className="text-xs font-bold text-red-600 hover:underline">
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-gray-500">No profile photo uploaded</span>
                      <label className={fileButtonClass}>
                        <span className="material-symbols-outlined text-base">upload</span>
                        Upload Photo
                        <input type="file" accept="image/*" onChange={(e) => void handleProfilePhotoChange(e.target.files?.[0] || null)} className="hidden" />
                      </label>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500">Images larger than 500KB are compressed automatically.</p>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">Aadhaar Number</label>
                <input
                  value={form.aadhaarNumber}
                  onChange={(e) => handleAadhaarChange(e.target.value)}
                  placeholder="XXXX-XXXX-XXXX"
                  required
                  maxLength={14}
                  className={fieldClass}
                />
                <div className="rounded-lg border-2 border-gray-200 bg-white p-4">
                  {aadhaarPreview ? (
                    <div className="flex items-center gap-3">
                      {aadhaarPreview === 'pdf' ? (
                        <div className="flex h-16 w-16 items-center justify-center rounded bg-red-100">
                          <span className="material-symbols-outlined text-2xl text-red-600">picture_as_pdf</span>
                        </div>
                      ) : (
                        <img src={aadhaarPreview} alt="Aadhaar preview" className="h-16 w-16 rounded border border-gray-200 object-cover" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-gray-900">{aadhaarDocument?.name}</div>
                        <div className="text-xs text-gray-500">Aadhaar number will be verified by admin.</div>
                        <div className="mt-1 flex gap-3">
                          <label className="cursor-pointer text-xs font-bold text-[#5a0a8f] hover:underline">
                            Change
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              onChange={(e) =>
                                handleDocumentChange(
                                  e.target.files?.[0] || null,
                                  aadhaarPreview,
                                  setAadhaarDocument,
                                  setAadhaarPreview,
                                  'Aadhaar document',
                                )
                              }
                              className="hidden"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => handleDocumentChange(null, aadhaarPreview, setAadhaarDocument, setAadhaarPreview, 'Aadhaar document')}
                            className="text-xs font-bold text-red-600 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-gray-500">No Aadhaar uploaded</span>
                      <label className={fileButtonClass}>
                        <span className="material-symbols-outlined text-base">upload</span>
                        Upload Aadhaar
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) =>
                            handleDocumentChange(
                              e.target.files?.[0] || null,
                              aadhaarPreview,
                              setAadhaarDocument,
                              setAadhaarPreview,
                              'Aadhaar document',
                            )
                          }
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Passport Number</label>
                <input value={form.passportNumber} onChange={(e) => handleChange('passportNumber', e.target.value)} className={fieldClass} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Passport Expiry Date</label>
                <input type="date" value={form.passportExpiryDate} onChange={(e) => handleChange('passportExpiryDate', e.target.value)} className={fieldClass} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Passport Issued Place</label>
                <input value={form.passportIssuedPlace} onChange={(e) => handleChange('passportIssuedPlace', e.target.value)} className={fieldClass} />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">Passport Copy</label>
              <div className="rounded-lg border-2 border-gray-200 bg-white p-4">
                {passportPreview ? (
                  <div className="flex items-center gap-3">
                    {passportPreview === 'pdf' ? (
                      <div className="flex h-16 w-16 items-center justify-center rounded bg-red-100">
                        <span className="material-symbols-outlined text-2xl text-red-600">picture_as_pdf</span>
                      </div>
                    ) : (
                      <img src={passportPreview} alt="Passport preview" className="h-16 w-16 rounded border border-gray-200 object-cover" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-gray-900">{passportDocument?.name}</div>
                      <div className="mt-1 flex gap-3">
                        <label className="cursor-pointer text-xs font-bold text-[#5a0a8f] hover:underline">
                          Change
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={(e) =>
                              handleDocumentChange(
                                e.target.files?.[0] || null,
                                passportPreview,
                                setPassportDocument,
                                setPassportPreview,
                                'Passport copy',
                              )
                            }
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => handleDocumentChange(null, passportPreview, setPassportDocument, setPassportPreview, 'Passport copy')}
                          className="text-xs font-bold text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-gray-500">No passport copy uploaded</span>
                    <label className={fileButtonClass}>
                      <span className="material-symbols-outlined text-base">upload</span>
                      Upload Passport
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) =>
                          handleDocumentChange(
                            e.target.files?.[0] || null,
                            passportPreview,
                            setPassportDocument,
                            setPassportPreview,
                            'Passport copy',
                          )
                        }
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t border-gray-100 pt-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Kit & Performance Details</h3>
              <p className="text-sm text-gray-500">Same supporting fields collected in the public flow.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">T-Shirt Size</label>
                <select value={form.tShirtSize} onChange={(e) => handleChange('tShirtSize', e.target.value)} className={fieldClass}>
                  <option value="">Select size</option>
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                  <option value="XXL">XXL</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Tracksuit Size</label>
                <select value={form.trackSuitSize} onChange={(e) => handleChange('trackSuitSize', e.target.value)} className={fieldClass}>
                  <option value="">Select size</option>
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                  <option value="XXL">XXL</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Shoes Size</label>
                <input value={form.shoesSize} onChange={(e) => handleChange('shoesSize', e.target.value)} className={fieldClass} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Pant Size</label>
                <input value={form.pantSize} onChange={(e) => handleChange('pantSize', e.target.value)} className={fieldClass} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">District Games</label>
                <input value={form.districtGames} onChange={(e) => handleChange('districtGames', e.target.value)} className={fieldClass} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">State Games</label>
                <input value={form.stateGames} onChange={(e) => handleChange('stateGames', e.target.value)} className={fieldClass} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">National Games</label>
                <input value={form.nationalGames} onChange={(e) => handleChange('nationalGames', e.target.value)} className={fieldClass} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">International Games</label>
                <input value={form.internationalGames} onChange={(e) => handleChange('internationalGames', e.target.value)} className={fieldClass} />
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t border-gray-100 pt-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Certificates</h3>
              <p className="text-sm text-gray-500">Upload up to 10 certificates like the public registration flow.</p>
            </div>

            <div className="rounded-lg border-2 border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-gray-500">
                  {certificates.length > 0 ? `${certificates.length} certificate(s) selected` : 'No certificates uploaded'}
                </span>
                <label className={fileButtonClass}>
                  <span className="material-symbols-outlined text-base">upload</span>
                  Upload Certificates
                  <input
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    onChange={(e) => handleCertificatesChange(e.target.files)}
                    className="hidden"
                  />
                </label>
              </div>
              {certificates.length > 0 && (
                <div className="mt-3 space-y-2">
                  {certificates.map((file, index) => (
                    <div key={`${file.name}-${index}`} className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-sm">
                      <span className="truncate text-gray-800">{file.name}</span>
                      <span className="ml-3 shrink-0 text-xs text-gray-500">{Math.round(file.size / 1024)} KB</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

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
