import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { apiRequest } from '../../lib/api'
import { useDistricts } from '../../context/DistrictsContext'
import { useAuth } from '../../context/AuthContext'

export function PlayerResubmitPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { districts } = useDistricts()
  const { user } = useAuth()

  const inputClass =
    'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] text-gray-900 placeholder:text-gray-400'

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [profileId, setProfileId] = useState<string>('')
  const [reviewRemarks, setReviewRemarks] = useState<string>('')
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected' | ''>('')
  const [email, setEmail] = useState<string>('')
  const [aadhaarUrl, setAadhaarUrl] = useState<string>('')
  const [passportUrl, setPassportUrl] = useState<string>('')
  const [certificateUrls, setCertificateUrls] = useState<string[]>([])
  const [aadhaarUpload, setAadhaarUpload] = useState<File | null>(null)
  const [passportUpload, setPassportUpload] = useState<File | null>(null)
  const [certificateUploads, setCertificateUploads] = useState<File[]>([])

  const [form, setForm] = useState({
    fullName: '',
    fatherName: '',
    motherName: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    category: '',
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
    profilePhoto: '' as string,
    profilePhotoFile: null as File | null,
  })

  const districtOptions = useMemo(() => districts.sort((a, b) => a.name.localeCompare(b.name)), [districts])

  const loadProfile = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiRequest<{ profile: any }>('/players/me', { auth: true })
      const p = res.profile || {}
      setProfileId(p._id || p.id || '')
      setReviewRemarks(p.reviewRemarks || '')
      setStatus((p.status || '').toLowerCase())
      setEmail(p.email || '')
      setAadhaarUrl(p.aadhaarDocument || '')
      setPassportUrl(p.passportDocument || '')
      setCertificateUrls(Array.isArray(p.certificates) ? p.certificates.filter(Boolean) : [])
      setForm({
        fullName: p.fullName || '',
        fatherName: p.fatherName || '',
        motherName: p.motherName || '',
        phone: p.phone || '',
        dateOfBirth: p.dateOfBirth ? String(p.dateOfBirth).slice(0, 10) : '',
        gender: p.gender || '',
        category: p.category || '',
        district: p.district || '',
        aadhaarNumber: p.aadhaarNumber || '',
        passportNumber: p.passportNumber || '',
        passportExpiryDate: p.passportExpiryDate ? String(p.passportExpiryDate).slice(0, 10) : '',
        passportIssuedPlace: p.passportIssuedPlace || '',
        tShirtSize: p.tShirtSize || '',
        trackSuitSize: p.trackSuitSize || '',
        shoesSize: p.shoesSize || '',
        pantSize: p.pantSize || '',
        districtGames: p.districtGames || '',
        stateGames: p.stateGames || '',
        nationalGames: p.nationalGames || '',
        internationalGames: p.internationalGames || '',
        profilePhoto: p.profilePhoto || '',
        profilePhotoFile: null,
      })
    } catch (err: any) {
      setError(err?.message || 'Failed to load your application')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const stateProfileId = (location.state as any)?.profileId as string | undefined
    const stateRemarks = (location.state as any)?.remarks as string | undefined
    if (stateRemarks) setReviewRemarks(stateRemarks)
    if (stateProfileId) setProfileId(stateProfileId)
    void loadProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const validateImage = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG/PNG/GIF).')
      return false
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Images must be under 5MB.')
      return false
    }
    return true
  }

  const validateDoc = (file: File) => {
    const ok = file.type.startsWith('image/') || file.type === 'application/pdf'
    if (!ok) {
      setError('Only images or PDF files are allowed.')
      return false
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Documents must be under 5MB.')
      return false
    }
    return true
  }

  const handleFile = (field: 'profilePhoto' | 'aadhaarDocument' | 'passportDocument', file: File | null) => {
    if (!file) {
      if (field === 'profilePhoto') setForm((f) => ({ ...f, profilePhotoFile: null }))
      if (field === 'aadhaarDocument') setAadhaarUpload(null)
      if (field === 'passportDocument') setPassportUpload(null)
      return
    }

    const valid = field === 'profilePhoto' ? validateImage(file) : validateDoc(file)
    if (!valid) return

    if (field === 'profilePhoto') {
      const reader = new FileReader()
      reader.onloadend = () => {
        setForm((f) => ({ ...f, profilePhotoFile: file, profilePhoto: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }

    if (field === 'aadhaarDocument') setAadhaarUpload(file)
    if (field === 'passportDocument') setPassportUpload(file)
  }

  const handleChange = (name: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profileId) return
    setSubmitting(true)
    setError(null)
    setMessage(null)

    try {
      // 1) Upload files if any changed
      if (certificateUploads.length > 10) {
        setError('Please upload at most 10 certificates.')
        setSubmitting(false)
        return
      }

      const formData = new FormData()
      if (form.profilePhotoFile) formData.append('profilePhoto', form.profilePhotoFile)
      if (aadhaarUpload) formData.append('aadhaarDocument', aadhaarUpload)
      if (passportUpload) formData.append('passportDocument', passportUpload)
      certificateUploads.forEach((file) => formData.append('certificates', file))
      if (Array.from(formData.keys()).length > 0) {
        await apiRequest(`/players/${encodeURIComponent(profileId)}/files`, {
          method: 'PATCH',
          auth: true,
          body: formData,
        })
      }

      // 2) Patch scalar fields
      const payload: Record<string, any> = {
        fullName: form.fullName.trim(),
        fatherName: form.fatherName.trim(),
        motherName: form.motherName.trim(),
        phone: form.phone.trim(),
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        category: form.category,
        district: form.district,
        aadhaarNumber: form.aadhaarNumber.trim(),
        passportNumber: form.passportNumber.trim(),
        passportExpiryDate: form.passportExpiryDate,
        passportIssuedPlace: form.passportIssuedPlace.trim(),
        tShirtSize: form.tShirtSize,
        trackSuitSize: form.trackSuitSize,
        shoesSize: form.shoesSize,
        pantSize: form.pantSize,
        districtGames: form.districtGames,
        stateGames: form.stateGames,
        nationalGames: form.nationalGames,
        internationalGames: form.internationalGames,
      }

      await apiRequest(`/players/${encodeURIComponent(profileId)}`, {
        method: 'PATCH',
        auth: true,
        body: JSON.stringify(payload),
      })

      await apiRequest(`/players/${encodeURIComponent(profileId)}/resubmit`, {
        method: 'POST',
        auth: true,
        body: JSON.stringify({}),
      })

      setMessage('Changes saved. Your application has been moved back to review.')
      setCertificateUploads([])
      setTimeout(() => navigate('/player/status', { replace: true }), 1200)
    } catch (err: any) {
      setError(err?.message || 'Failed to save changes')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-700">
        <div className="animate-pulse text-sm">Loading your application...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm max-w-6xl w-full p-8 space-y-7">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Update & Resubmit</h1>
            <p className="text-gray-600">Review your details, fix the issues, and resubmit for approval.</p>
          </div>
          <button
            onClick={() => navigate('/player/status')}
            className="text-sm text-gray-600 underline"
            disabled={submitting}
          >
            Back to Status
          </button>
        </div>

        {reviewRemarks && (
          <div className="border border-red-200 bg-red-50 text-red-800 rounded-lg p-4 text-sm">
            <div className="font-semibold mb-1">Remarks from Admin</div>
            <div className="whitespace-pre-line">{reviewRemarks}</div>
          </div>
        )}

        {status && (
          <div className="text-sm text-gray-600">
            Current status: <span className="font-semibold text-gray-900 capitalize">{status}</span>
          </div>
        )}

        {email && (
          <div className="text-sm text-gray-600">
            Registered email: <span className="font-semibold text-gray-900">{email}</span> (cannot change)
          </div>
        )}

        {error && <div className="border border-red-200 bg-red-50 text-red-700 rounded-lg p-3 text-sm">{error}</div>}
        {message && <div className="border border-green-200 bg-green-50 text-green-700 rounded-lg p-3 text-sm">{message}</div>}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800">Full Name</label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                required
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                required
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800">Email Address</label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-800"
              />
              <p className="text-xs text-gray-500">Email cannot be changed after registration.</p>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800">Account Password</label>
              <input
                type="password"
                value="********"
                disabled
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-800"
              />
              <p className="text-xs text-gray-500">Contact admin to reset your password if needed.</p>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800">Father's Name</label>
              <input
                type="text"
                value={form.fatherName}
                onChange={(e) => handleChange('fatherName', e.target.value)}
                required
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800">Mother's Name</label>
              <input
                type="text"
                value={form.motherName}
                onChange={(e) => handleChange('motherName', e.target.value)}
                required
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800">Date of Birth</label>
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                required
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800">Gender</label>
              <select
                value={form.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
                required
                className={`${inputClass} bg-white`}
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800">Category</label>
              <select
                value={form.category}
                onChange={(e) => handleChange('category', e.target.value)}
                required
                className={`${inputClass} bg-white`}
              >
                <option value="">Select category</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
                <option value="General">General</option>
                <option value="OBC">OBC</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800">District</label>
              <select
                value={form.district}
                onChange={(e) => handleChange('district', e.target.value)}
                required
                className={`${inputClass} bg-white`}
              >
                <option value="">Select district</option>
                {districtOptions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-semibold text-gray-800">Aadhaar Number</label>
              <input
                type="text"
                value={form.aadhaarNumber}
                onChange={(e) => handleChange('aadhaarNumber', e.target.value.replace(/\D/g, '').slice(0, 12))}
                required
                className={inputClass}
              />
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>Aadhaar number will be verified by admin.</span>
                {aadhaarUrl ? (
                  <button
                    type="button"
                    onClick={() => window.open(aadhaarUrl, '_blank')}
                    className="text-[#5a0a8f] font-semibold hover:underline"
                  >
                    View uploaded Aadhaar
                  </button>
                ) : (
                  <span className="text-red-600">No Aadhaar uploaded</span>
                )}
              </div>
              <div className="mt-2 space-y-2">
                <label className="block text-xs font-semibold text-gray-700">Upload Aadhaar (replace)</label>
                <div className="flex items-center gap-3">
                  <input
                    id="aadhaar-upload"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFile('aadhaarDocument', e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <label
                    htmlFor="aadhaar-upload"
                    className="inline-flex items-center gap-2 px-3 py-2 bg-[#5a0a8f] text-white text-xs font-semibold rounded-lg shadow-sm hover:bg-[#400466] cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">upload</span>
                    Choose file
                  </label>
                  <span className="text-xs text-gray-700">
                    {aadhaarUpload ? aadhaarUpload.name : 'No file chosen'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800">Passport Number</label>
              <input
                type="text"
                value={form.passportNumber}
                onChange={(e) => handleChange('passportNumber', e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800">Passport Expiry</label>
              <input
                type="date"
                value={form.passportExpiryDate}
                onChange={(e) => handleChange('passportExpiryDate', e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-semibold text-gray-800">Passport Issued Place</label>
              <input
                type="text"
                value={form.passportIssuedPlace}
                onChange={(e) => handleChange('passportIssuedPlace', e.target.value)}
                className={inputClass}
              />
              <div className="text-xs text-gray-600">
                {passportUrl ? (
                  <button
                    type="button"
                    onClick={() => window.open(passportUrl, '_blank')}
                    className="text-[#5a0a8f] font-semibold hover:underline"
                  >
                    View uploaded passport copy
                  </button>
                ) : (
                  <span className="text-gray-500">No passport copy uploaded</span>
                )}
              </div>
              <div className="mt-2 space-y-2">
                <label className="block text-xs font-semibold text-gray-700">Upload Passport (replace)</label>
                <div className="flex items-center gap-3">
                  <input
                    id="passport-upload"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFile('passportDocument', e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <label
                    htmlFor="passport-upload"
                    className="inline-flex items-center gap-2 px-3 py-2 bg-[#5a0a8f] text-white text-xs font-semibold rounded-lg shadow-sm hover:bg-[#400466] cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">upload</span>
                    Choose file
                  </label>
                  <span className="text-xs text-gray-700">
                    {passportUpload ? passportUpload.name : 'No file chosen'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800">T-Shirt Size</label>
              <input
                type="text"
                value={form.tShirtSize}
                onChange={(e) => handleChange('tShirtSize', e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800">Tracksuit Size</label>
              <input
                type="text"
                value={form.trackSuitSize}
                onChange={(e) => handleChange('trackSuitSize', e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800">Shoes Size</label>
              <input
                type="text"
                value={form.shoesSize}
                onChange={(e) => handleChange('shoesSize', e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800">Pant Size</label>
              <input
                type="text"
                value={form.pantSize}
                onChange={(e) => handleChange('pantSize', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800">District Games</label>
              <input
                type="number"
                min="0"
                value={form.districtGames}
                onChange={(e) => handleChange('districtGames', e.target.value.replace(/\D/g, ''))}
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800">State Games</label>
              <input
                type="number"
                min="0"
                value={form.stateGames}
                onChange={(e) => handleChange('stateGames', e.target.value.replace(/\D/g, ''))}
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800">National Games</label>
              <input
                type="number"
                min="0"
                value={form.nationalGames}
                onChange={(e) => handleChange('nationalGames', e.target.value.replace(/\D/g, ''))}
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800">International Games</label>
              <input
                type="number"
                min="0"
                value={form.internationalGames}
                onChange={(e) => handleChange('internationalGames', e.target.value.replace(/\D/g, ''))}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-1 space-y-3 border border-gray-200 rounded-xl p-4 bg-gray-50">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <span className="material-symbols-outlined text-base">account_circle</span>
                <span>Profile Photo</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-lg border border-gray-200 overflow-hidden bg-white flex items-center justify-center">
                  {form.profilePhoto ? (
                    <img src={form.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-gray-500">No photo</span>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <input
                    id="profile-photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFile('profilePhoto', e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <label
                    htmlFor="profile-photo-upload"
                    className="inline-flex items-center gap-2 px-3 py-2 bg-[#5a0a8f] text-white text-xs font-semibold rounded-lg shadow-sm hover:bg-[#400466] cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">upload</span>
                    Upload photo
                  </label>
                  <span className="text-xs text-gray-700">
                    {form.profilePhotoFile ? form.profilePhotoFile.name : 'No file chosen'}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-600">Clear headshot, max 5MB. Leave empty to keep the current one.</p>
            </div>

            <div className="lg:col-span-2 space-y-3 border border-gray-200 rounded-xl p-4 bg-gray-50">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <span className="material-symbols-outlined text-base">description</span>
                <span>Certificates</span>
              </div>
              <div className="flex flex-col gap-2">
                <input
                  id="certificates-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || [])
                    if (files.length === 0) return
                    const valid = files.every((f) => f.type.startsWith('image/') && f.size <= 5 * 1024 * 1024)
                    if (!valid) {
                      setError('Certificates must be images under 5MB each.')
                      return
                    }
                    setCertificateUploads(files)
                  }}
                  className="hidden"
                />
                <div className="flex items-center gap-3">
                  <label
                    htmlFor="certificates-upload"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#5a0a8f] text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-[#400466] cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">upload</span>
                    Upload certificates
                  </label>
                  {certificateUploads.length > 0 && (
                    <span className="text-xs text-gray-700">{certificateUploads.length} file(s) selected</span>
                  )}
                </div>
                <p className="text-xs text-gray-600">Upload up to 10 images (max 5MB each). Uploading replaces the current set.</p>
              </div>
              {certificateUrls.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {certificateUrls.map((url, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => window.open(url, '_blank')}
                      className="border border-gray-200 rounded-lg overflow-hidden bg-white hover:border-[#5a0a8f] transition-colors"
                    >
                      <img src={url} alt={`Certificate ${idx + 1}`} className="w-full h-24 object-cover" />
                      <div className="text-xs text-gray-700 text-center py-2">Certificate {idx + 1}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/player/status')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-[#5a0a8f] hover:bg-[#400466] text-white rounded-lg font-semibold disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save & Resubmit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
