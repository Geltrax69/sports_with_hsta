import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDistricts } from '../context/DistrictsContext'
import { apiRequest } from '../lib/api'
import { DatePickerField } from '../components/DatePickerField'

export function RegisterPage() {
  // const navigate = useNavigate()
  const { districts } = useDistricts()
  const [registrationType, setRegistrationType] = useState<'player' | 'coach' | 'referee'>('player')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [formData, setFormData] = useState({
    profilePhoto: null as File | null,
    fullName: '',
    fatherName: '',
    motherName: '',
    dateOfBirth: '',
    gender: '',
    category: '',
    aadhaarNumber: '',
    email: '',
    password: '',
    district: '',
    certificates: [] as File[],
    idProofType: '',
    idProofDocument: null as File | null,
  })

  const [profilePreview, setProfilePreview] = useState<string | null>(null)
  const [certificatePreviews, setCertificatePreviews] = useState<string[]>([])
  const [idProofPreview, setIdProofPreview] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Only image files are allowed (JPG/PNG/GIF).')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB')
        return
      }
      setFormData({ ...formData, profilePhoto: file })
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfilePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCertificateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Limit to 10 certificates
    const remainingSlots = 10 - formData.certificates.length
    const filesToAdd = files.slice(0, remainingSlots)

    filesToAdd.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        alert(`Certificate "${file.name}" is not an image. Only JPG/PNG/GIF allowed.`)
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`Certificate "${file.name}" is too large. Max size is 5MB.`)
        return
      }
    })

    const validFiles = filesToAdd.filter(
      (file) => file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024,
    )

    if (validFiles.length === 0) return

    const newCertificates = [...formData.certificates, ...validFiles].slice(0, 10)
    setFormData({ ...formData, certificates: newCertificates })

    // Create previews
    validFiles.forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setCertificatePreviews((prev) => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeCertificate = (index: number) => {
    const newCertificates = formData.certificates.filter((_, i) => i !== index)
    const newPreviews = certificatePreviews.filter((_, i) => i !== index)
    setFormData({ ...formData, certificates: newCertificates })
    setCertificatePreviews(newPreviews)
  }

  const handleIdProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
      if (!validTypes.includes(file.type)) {
        alert('Only image files (JPG/PNG/GIF) or PDF files are allowed.')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB')
        return
      }
      setFormData({ ...formData, idProofDocument: file })
      
      // Preview for images only, PDFs will show a document icon
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setIdProofPreview(reader.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        setIdProofPreview('pdf')
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    let formattedValue = value

    // Format Aadhaar number as XXXX-XXXX-XXXX
    if (name === 'aadhaarNumber') {
      const numbersOnly = value.replace(/\D/g, '')
      if (numbersOnly.length <= 12) {
        formattedValue = numbersOnly.replace(/(\d{4})(?=\d)/g, '$1-')
      } else {
        formattedValue = formData.aadhaarNumber
      }
    }

    setFormData({ ...formData, [name]: formattedValue })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSubmitting) return
    setSubmitResult(null)
    setIsSubmitting(true)

    if (!formData.profilePhoto) {
      alert('Please upload a profile photo.')
      setIsSubmitting(false)
      return
    }

    if (!formData.idProofType) {
      alert('Please select an ID proof type.')
      setIsSubmitting(false)
      return
    }

    if (!formData.idProofDocument) {
      alert('Please upload your ID proof document.')
      setIsSubmitting(false)
      return
    }

    if (registrationType === 'player' && !formData.gender) {
      alert('Please select a gender.')
      setIsSubmitting(false)
      return
    }

    if (registrationType === 'player' && !formData.category) {
      alert('Please select a category.')
      setIsSubmitting(false)
      return
    }

    try {
      const form = new FormData()
      form.append('fullName', formData.fullName)
      form.append('fatherName', formData.fatherName)
      form.append('motherName', formData.motherName)
      form.append('dateOfBirth', formData.dateOfBirth)
      if (registrationType === 'player') {
        form.append('gender', formData.gender)
        form.append('category', formData.category)
      }
      form.append('aadhaarNumber', formData.aadhaarNumber)
      form.append('email', formData.email)
      form.append('password', formData.password)
      form.append('district', formData.district)
      form.append('profilePhoto', formData.profilePhoto)
      formData.certificates.forEach((c) => form.append('certificates', c))
      form.append('idProofType', formData.idProofType)
      if (formData.idProofDocument) {
        form.append('idProofDocument', formData.idProofDocument)
      }

      const path = registrationType === 'player' 
        ? '/players/register' 
        : registrationType === 'coach' 
        ? '/coaches/register' 
        : '/referees/register'

      const data = await apiRequest<{ registration: { id: string } }>(path, {
        method: 'POST',
        body: form,
        headers: {},
      })

      setSubmitResult({
        type: 'success',
        message:
          'Registration submitted successfully! Your application is pending approval. Registration ID: ' +
          data.registration.id,
      })

      // Reset form
      setFormData({
        profilePhoto: null,
        fullName: '',
        fatherName: '',
        motherName: '',
        dateOfBirth: '',
        gender: '',
        category: '',
        aadhaarNumber: '',
        email: '',
        password: '',
        district: '',
        certificates: [],
        idProofType: '',
        idProofDocument: null,
      })
      setProfilePreview(null)
      setCertificatePreviews([])
      setIdProofPreview(null)
      setShowPassword(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed'
      setSubmitResult({ type: 'error', message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 py-8 md:py-12 px-4 sm:px-6 lg:px-8">
      {isSubmitting && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6 w-full max-w-sm">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#5a0a8f]">progress_activity</span>
              <div>
                <div className="font-bold text-gray-900">Submitting your application…</div>
                <div className="text-sm text-gray-600">Please wait. Don’t refresh or click again.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-[#5a0a8f] mb-2">Join the Federation</h1>
          <p className="text-lg text-[#5a0a8f]/70">
            Start your journey with the Haryana Sepak Takraw Association.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 md:p-8 lg:p-10">
          {submitResult && (
            <div
              className={`mb-6 rounded-xl border p-4 ${submitResult.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}
            >
              <div className="flex gap-3">
                <span
                  className={`material-symbols-outlined flex-shrink-0 ${submitResult.type === 'success' ? 'text-green-700' : 'text-red-700'
                    }`}
                >
                  {submitResult.type === 'success' ? 'check_circle' : 'error'}
                </span>
                <div className="text-sm">
                  <div className={`font-bold ${submitResult.type === 'success' ? 'text-green-900' : 'text-red-900'}`}>
                    {submitResult.type === 'success' ? 'Success' : 'Error'}
                  </div>
                  <div className={submitResult.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                    {submitResult.message}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Registration Type Tabs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
            <button
              type="button"
              onClick={() => setRegistrationType('player')}
              disabled={isSubmitting}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium text-sm transition-all border-2 ${registrationType === 'player'
                ? 'bg-[#5a0a8f] text-white shadow-md border-[#5a0a8f]'
                : 'text-gray-700 hover:bg-gray-100 border-gray-300'
                }`}
            >
              <span className="material-symbols-outlined text-xl">directions_run</span>
              <span>Player Registration</span>
            </button>
            <button
              type="button"
              onClick={() => setRegistrationType('coach')}
              disabled={isSubmitting}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium text-sm transition-all border-2 ${registrationType === 'coach'
                ? 'bg-[#5a0a8f] text-white shadow-md border-[#5a0a8f]'
                : 'text-gray-700 hover:bg-gray-100 border-gray-300'
                }`}
            >
              <span className="material-symbols-outlined text-xl">sports_volleyball</span>
              <span>Coach Registration</span>
            </button>
            <button
              type="button"
              onClick={() => setRegistrationType('referee')}
              disabled={isSubmitting}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium text-sm transition-all border-2 ${registrationType === 'referee'
                ? 'bg-[#5a0a8f] text-white shadow-md border-[#5a0a8f]'
                : 'text-gray-700 hover:bg-gray-100 border-gray-300'
                }`}
            >
              <span className="material-symbols-outlined text-xl">gavel</span>
              <span>Referee Registration</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Photo */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Profile Photo</label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 md:p-8 text-center hover:border-[#5a0a8f] transition-colors">
                {profilePreview ? (
                  <div className="flex flex-col items-center gap-4">
                    <img
                      src={profilePreview}
                      alt="Profile preview"
                      className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                    />
                    <div className="flex flex-col sm:flex-row gap-3 items-center">
                      <label className="cursor-pointer inline-flex items-center gap-2 bg-[#5a0a8f] text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-[#400466] transition-colors">
                        <span className="material-symbols-outlined text-lg">upload</span>
                        Change Photo
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/gif"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setProfilePreview(null)
                          setFormData({ ...formData, profilePhoto: null })
                        }}
                        className="text-sm text-gray-600 hover:text-gray-900"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border-4 border-gray-200">
                      <span className="material-symbols-outlined text-4xl text-gray-400">person_add</span>
                    </div>
                    <div>
                      <label className="cursor-pointer inline-flex items-center gap-2 bg-[#5a0a8f] text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-[#400466] transition-colors">
                        <span className="material-symbols-outlined text-lg">upload</span>
                        Upload Photo
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/gif"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                )}
                <p className="text-xs text-gray-600 mt-4">JPG, PNG or GIF. Max size 5MB.</p>
              </div>
            </div>

            {/* Full Legal Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-semibold text-gray-900 mb-2">
                Full Legal Name
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  person
                </span>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="e.g. Rahul Kumar"
                  required
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none transition-all text-gray-900 bg-white"
                />
              </div>
            </div>

            {/* Father's Name and Mother's Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="fatherName" className="block text-sm font-semibold text-gray-900 mb-2">
                  Father's Name
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    person
                  </span>
                  <input
                    type="text"
                    id="fatherName"
                    name="fatherName"
                    value={formData.fatherName}
                    onChange={handleInputChange}
                    placeholder="Father's Name"
                    required
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none transition-all text-gray-900 bg-white"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="motherName" className="block text-sm font-semibold text-gray-900 mb-2">
                  Mother's Name
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    person
                  </span>
                  <input
                    type="text"
                    id="motherName"
                    name="motherName"
                    value={formData.motherName}
                    onChange={handleInputChange}
                    placeholder="Mother's Name"
                    required
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none transition-all text-gray-900 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Date of Birth and Aadhaar Number */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-semibold text-gray-900 mb-2">
                  Date of Birth
                </label>
                <DatePickerField
                  id="dateOfBirth"
                  name="dateOfBirth"
                  label="Select date of birth"
                  value={formData.dateOfBirth}
                  onChange={(date) => setFormData({ ...formData, dateOfBirth: date })}
                  required
                />
              </div>
              <div>
                <label htmlFor="aadhaarNumber" className="block text-sm font-semibold text-gray-900 mb-2">
                  Aadhaar Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    fingerprint
                  </span>
                  <input
                    type="text"
                    id="aadhaarNumber"
                    name="aadhaarNumber"
                    value={formData.aadhaarNumber}
                    onChange={handleInputChange}
                    placeholder="XXXX-XXXX-XXXX"
                    pattern="[0-9]{4}-[0-9]{4}-[0-9]{4}"
                    maxLength={14}
                    required
                    inputMode="numeric"
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none transition-all text-gray-900 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* ID Proof Type Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                ID Proof Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label
                  className={`relative flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.idProofType === 'passport'
                      ? 'border-[#5a0a8f] bg-purple-50'
                      : 'border-gray-300 hover:border-[#5a0a8f]/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="idProofType"
                    value="passport"
                    checked={formData.idProofType === 'passport'}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-[#5a0a8f] focus:ring-[#5a0a8f]"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Passport</div>
                  </div>
                </label>

                <label
                  className={`relative flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.idProofType === 'aadhaar'
                      ? 'border-[#5a0a8f] bg-purple-50'
                      : 'border-gray-300 hover:border-[#5a0a8f]/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="idProofType"
                    value="aadhaar"
                    checked={formData.idProofType === 'aadhaar'}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-[#5a0a8f] focus:ring-[#5a0a8f]"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Aadhaar Card</div>
                  </div>
                </label>

                <label
                  className={`relative flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.idProofType === 'birth_certificate'
                      ? 'border-[#5a0a8f] bg-purple-50'
                      : 'border-gray-300 hover:border-[#5a0a8f]/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="idProofType"
                    value="birth_certificate"
                    checked={formData.idProofType === 'birth_certificate'}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-[#5a0a8f] focus:ring-[#5a0a8f]"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Birth Certificate</div>
                  </div>
                </label>
              </div>
            </div>

            {/* ID Proof Document Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Upload ID Proof Document <span className="text-red-500">*</span>
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 md:p-8 text-center hover:border-[#5a0a8f] transition-colors">
                {idProofPreview ? (
                  <div className="flex flex-col items-center gap-4">
                    {idProofPreview === 'pdf' ? (
                      <div className="w-24 h-24 rounded-lg bg-red-100 flex items-center justify-center border-4 border-gray-200">
                        <span className="material-symbols-outlined text-4xl text-red-600">picture_as_pdf</span>
                      </div>
                    ) : (
                      <img
                        src={idProofPreview}
                        alt="ID Proof preview"
                        className="w-32 h-32 rounded-lg object-cover border-4 border-gray-200"
                      />
                    )}
                    <div className="text-sm text-gray-700 font-medium">
                      {formData.idProofDocument?.name}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 items-center">
                      <label className="cursor-pointer inline-flex items-center gap-2 bg-[#5a0a8f] text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-[#400466] transition-colors">
                        <span className="material-symbols-outlined text-lg">upload</span>
                        Change Document
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/gif,application/pdf"
                          onChange={handleIdProofChange}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setIdProofPreview(null)
                          setFormData({ ...formData, idProofDocument: null })
                        }}
                        className="text-sm text-gray-600 hover:text-gray-900"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-center border-4 border-gray-200">
                      <span className="material-symbols-outlined text-4xl text-gray-400">upload_file</span>
                    </div>
                    <div>
                      <label className="cursor-pointer inline-flex items-center gap-2 bg-[#5a0a8f] text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-[#400466] transition-colors">
                        <span className="material-symbols-outlined text-lg">upload</span>
                        Upload Document
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/gif,application/pdf"
                          onChange={handleIdProofChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                )}
                <p className="text-xs text-gray-600 mt-4">
                  Upload a clear photo or PDF of your {formData.idProofType === 'passport' ? 'Passport' : formData.idProofType === 'aadhaar' ? 'Aadhaar Card' : formData.idProofType === 'birth_certificate' ? 'Birth Certificate' : 'selected ID proof'}. JPG, PNG, GIF or PDF. Max size 5MB.
                </p>
              </div>
            </div>

            {registrationType === 'player' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="gender" className="block text-sm font-semibold text-gray-900 mb-2">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      wc
                    </span>
                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none transition-all text-gray-900 bg-white"
                    >
                      <option value="" disabled>
                        Select gender
                      </option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-semibold text-gray-900 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      groups
                    </span>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none transition-all text-gray-900 bg-white"
                    >
                      <option value="" disabled>
                        Select category
                      </option>
                      <option value="SC">SC</option>
                      <option value="ST">ST</option>
                      <option value="General">General</option>
                      <option value="OBC">OBC</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Email and Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
                  Email ID
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    mail
                  </span>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="name@example.com"
                    required
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none transition-all text-gray-900 bg-white"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-900 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    lock
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Create a password"
                    required
                    minLength={8}
                    className="w-full pl-10 pr-12 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none transition-all text-gray-900 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* District Association */}
            <div>
              <label htmlFor="district" className="block text-sm font-semibold text-gray-900 mb-2">
                District Association
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  location_on
                </span>
                <select
                  id="district"
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-10 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none transition-all appearance-none bg-white text-gray-900"
                >
                  <option value="">Select your district</option>
                  {districts
                    .filter((d) => d.status === 'active')
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((district) => (
                      <option key={district.id} value={district.id}>
                        {district.name} {district.zone ? `(${district.zone})` : ''}
                      </option>
                    ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                  keyboard_arrow_down
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Select the district where you primarily reside or train.
              </p>
            </div>

            {/* Certificate Images */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Enter your 10 Certificate Images
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 md:p-6 hover:border-[#5a0a8f] transition-colors">
                {certificatePreviews.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {certificatePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview}
                            alt={`Certificate ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => removeCertificate(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <span className="material-symbols-outlined text-sm">close</span>
                          </button>
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs text-center py-1 rounded-b-lg">
                            Certificate {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                    {formData.certificates.length < 10 && (
                      <div className="text-center pt-2">
                        <label className="cursor-pointer inline-flex items-center gap-2 bg-[#5a0a8f] text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-[#400466] transition-colors">
                          <span className="material-symbols-outlined text-lg">add</span>
                          Add More Certificates ({formData.certificates.length}/10)
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/gif"
                            onChange={handleCertificateChange}
                            multiple
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="flex flex-col items-center gap-4">
                      <span className="material-symbols-outlined text-5xl text-gray-400">description</span>
                      <div>
                        <label className="cursor-pointer inline-flex items-center gap-2 bg-[#5a0a8f] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#400466] transition-colors">
                          <span className="material-symbols-outlined text-lg">upload</span>
                          Upload Certificates
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/gif"
                            onChange={handleCertificateChange}
                            multiple
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                )}
                <p className="text-xs text-gray-600 mt-4 text-center">
                  Upload up to 10 certificate images. JPG, PNG or GIF. Max size 5MB per image.
                </p>
                {formData.certificates.length > 0 && (
                  <p className="text-xs text-[#5a0a8f] font-medium mt-2 text-center">
                    {formData.certificates.length} certificate{formData.certificates.length > 1 ? 's' : ''} uploaded
                  </p>
                )}
              </div>
            </div>

            {/* Approval Process Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 md:p-5">
              <div className="flex gap-3">
                <span className="material-symbols-outlined text-blue-600 flex-shrink-0">info</span>
                <div>
                  <h3 className="font-bold text-blue-900 mb-1">Approval Process</h3>
                  <p className="text-sm text-blue-800">
                    Your registration status will be set to <strong>Pending</strong> immediately after
                    submission. It must be approved by a District Official before you can participate in
                    tournaments.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full bg-[#5a0a8f] text-white font-bold py-4 px-6 rounded-lg shadow-lg shadow-purple-900/20 transition-all flex items-center justify-center gap-2 text-base md:text-lg transform ${isSubmitting ? 'opacity-60 cursor-not-allowed' : 'hover:bg-[#400466] hover:-translate-y-0.5'
                }`}
            >
              <span>{isSubmitting ? 'Submitting…' : 'Submit Application'}</span>
              <span className="material-symbols-outlined">{isSubmitting ? 'hourglass_empty' : 'arrow_forward'}</span>
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-gray-600">
            Already registered?{' '}
            <Link to="/login" className="text-[#5a0a8f] font-bold hover:underline">
              Log in here
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
