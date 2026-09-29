import { useRef, useState } from 'react'
import { useDistricts } from '../context/DistrictsContext'
import { ApiError, apiRequest } from '../lib/api'
import { DatePickerField } from '../components/DatePickerField'

export function RegisterPage() {
  // const navigate = useNavigate()
  const { districts } = useDistricts()
  const [registrationType, setRegistrationType] = useState<'player' | 'coach' | 'referee'>('player')
  const loginHref = `${import.meta.env.BASE_URL}login`
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<
    { type: 'success' | 'error'; title?: string; message: string; reference?: string } | null
  >(null)
  const resultRef = useRef<HTMLDivElement>(null)

  const showResult = (result: { type: 'success' | 'error'; title?: string; message: string; reference?: string }) => {
    setSubmitResult(result)
    requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
  }
  const [formData, setFormData] = useState({
    profilePhoto: null as File | null,
    fullName: '',
    fatherName: '',
    motherName: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    category: '',
    aadhaarNumber: '',
    aadhaarDocument: null as File | null,
    email: '',
    password: '',
    district: '',
    certificates: [] as File[],
    // Passport Details
    passportNumber: '',
    passportExpiryDate: '',
    passportIssuedPlace: '',
    passportDocument: null as File | null,
    // Kit & Performance Details
    tShirtSize: '',
    trackSuitSize: '',
    shoesSize: '',
    pantSize: '',
    districtGames: '',
    stateGames: '',
    nationalGames: '',
    internationalGames: '',
  })

  const [profilePreview, setProfilePreview] = useState<string | null>(null)
  const [certificatePreviews, setCertificatePreviews] = useState<string[]>([])
  const [aadhaarPreview, setAadhaarPreview] = useState<string | null>(null)
  const [passportPreview, setPassportPreview] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const allowedPhotoTypes = ['image/jpeg', 'image/png']
      if (!allowedPhotoTypes.includes(file.type)) {
        alert('Only JPG or PNG files are allowed for profile photo.')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`Profile photo is ${(file.size / (1024 * 1024)).toFixed(1)}MB. Max allowed size is 5MB.`)
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
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        alert(`Certificate "${file.name}" is not valid. Only JPG or PNG files are allowed.`)
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`Certificate "${file.name}" is ${(file.size / (1024 * 1024)).toFixed(1)}MB. Max allowed size is 5MB.`)
        return
      }
    })

    const validFiles = filesToAdd.filter(
      (file) => ['image/jpeg', 'image/png'].includes(file.type) && file.size <= 5 * 1024 * 1024,
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

  const handleAadhaarDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'application/pdf']
      if (!validTypes.includes(file.type)) {
        alert('Only JPG, PNG, or PDF files are allowed.')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`Aadhaar document is ${(file.size / (1024 * 1024)).toFixed(1)}MB. Max allowed size is 5MB.`)
        return
      }
      setFormData({ ...formData, aadhaarDocument: file })

      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setAadhaarPreview(reader.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        setAadhaarPreview('pdf')
      }
    }
  }

  const handlePassportDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'application/pdf']
      if (!validTypes.includes(file.type)) {
        alert('Only JPG, PNG, or PDF files are allowed.')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`Passport document is ${(file.size / (1024 * 1024)).toFixed(1)}MB. Max allowed size is 5MB.`)
        return
      }
      setFormData({ ...formData, passportDocument: file })

      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setPassportPreview(reader.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        setPassportPreview('pdf')
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

    // Format Phone number
    if (name === 'phone') {
      formattedValue = value.replace(/\D/g, '').slice(0, 10)
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

    if (!formData.aadhaarNumber) {
      alert('Please provide your Aadhaar number.')
      setIsSubmitting(false)
      return
    }

    if (!formData.aadhaarDocument) {
      alert('Please upload your Aadhaar document.')
      setIsSubmitting(false)
      return
    }

    if (formData.passportNumber && !formData.passportDocument) {
      alert('Please upload your passport copy.')
      setIsSubmitting(false)
      return
    }

    if (!formData.gender) {
      alert('Please select a gender.')
      setIsSubmitting(false)
      return
    }

    if (!formData.category) {
      alert('Please select a category.')
      setIsSubmitting(false)
      return
    }

    try {
      const form = new FormData()
      form.append('fullName', formData.fullName)
      form.append('fatherName', formData.fatherName)
      form.append('motherName', formData.motherName)
      form.append('phone', formData.phone)
      form.append('dateOfBirth', formData.dateOfBirth)
      form.append('gender', formData.gender)
      form.append('category', formData.category)
      form.append('aadhaarNumber', formData.aadhaarNumber)


      // Email, Password, District
      // Email, Password, District
      form.append('email', formData.email)
      form.append('password', formData.password)
      form.append('district', formData.district)

      // Kit & Performance Details (Append BEFORE files)
      if (registrationType === 'player' || registrationType === 'coach' || registrationType === 'referee') {
        form.append('tShirtSize', formData.tShirtSize)
        form.append('trackSuitSize', formData.trackSuitSize)
        form.append('shoesSize', formData.shoesSize)
        form.append('pantSize', formData.pantSize)
        form.append('districtGames', formData.districtGames)
        form.append('stateGames', formData.stateGames)
        form.append('nationalGames', formData.nationalGames)
        form.append('internationalGames', formData.internationalGames)
      }

      // Passport Details (Text fields)
      if (formData.passportNumber) form.append('passportNumber', formData.passportNumber)
      if (formData.passportExpiryDate) form.append('passportExpiryDate', formData.passportExpiryDate)
      if (formData.passportIssuedPlace) form.append('passportIssuedPlace', formData.passportIssuedPlace)

      // Files (Append LAST)
      form.append('profilePhoto', formData.profilePhoto)
      formData.certificates.forEach((c) => form.append('certificates', c))
      if (formData.aadhaarDocument) form.append('aadhaarDocument', formData.aadhaarDocument)
      if (formData.passportDocument) form.append('passportDocument', formData.passportDocument)

      const path = registrationType === 'player'
        ? '/players/register'
        : registrationType === 'coach'
          ? '/coaches/register'
          : '/referees/register'

      const data = await apiRequest<{ registration: { id: string; playerId?: string; coachId?: string; refereeId?: string } }>(path, {
        method: 'POST',
        body: form,
        headers: {},
      })

      showResult({
        type: 'success',
        message:
          'Registration submitted successfully! Your application is pending approval. Your ID: ' +
          (data.registration.playerId || data.registration.coachId || data.registration.refereeId || data.registration.id),
      })

      // Reset form
      setFormData({
        profilePhoto: null,
        fullName: '',
        fatherName: '',
        motherName: '',
        phone: '',
        dateOfBirth: '',
        gender: '',
        category: '',
        aadhaarNumber: '',
        aadhaarDocument: null,
        email: '',
        password: '',
        district: '',
        certificates: [],
        passportNumber: '',
        passportExpiryDate: '',
        passportIssuedPlace: '',
        passportDocument: null,
        tShirtSize: '',
        trackSuitSize: '',
        shoesSize: '',
        pantSize: '',
        districtGames: '',
        stateGames: '',
        nationalGames: '',
        internationalGames: '',
      })
      setProfilePreview(null)
      setCertificatePreviews([])
      setAadhaarPreview(null)
      setPassportPreview(null)
      setShowPassword(false)
    } catch (err) {
      // The request layer has already classified this and written it to the console
      // and the server log. Here we only pick the heading the applicant sees.
      const titles: Record<string, string> = {
        offline: 'No internet connection',
        timeout: 'Upload took too long',
        network: 'Connection lost',
        ratelimit: 'Too many attempts',
        'too-large': 'File too big',
        server: 'Problem on our side',
        client: 'Please check your details',
      }
      const apiError = err instanceof ApiError ? err : null
      showResult({
        type: 'error',
        title: apiError?.status === 409 ? 'Already registered' : apiError ? titles[apiError.kind] ?? 'Registration failed' : 'Registration failed',
        message: err instanceof Error ? err.message : 'Registration failed. Please try again.',
        reference: apiError?.requestId,
      })
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
              ref={resultRef}
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
                    {submitResult.title ?? (submitResult.type === 'success' ? 'Success' : 'Error')}
                  </div>
                  <div className={submitResult.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                    {submitResult.message}
                  </div>
                  {submitResult.reference && (
                    <div className="mt-2 text-xs text-red-700">
                      Quote reference <span className="font-mono font-bold">{submitResult.reference}</span> if you
                      contact the association about this.
                    </div>
                  )}
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
                          accept="image/jpeg,image/png"
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
                          accept="image/jpeg,image/png"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                )}
                <p className="text-xs text-gray-600 mt-4">JPG or PNG only. Max size 5MB.</p>
              </div>
            </div>

            <div className="space-y-8 bg-white p-6 md:p-8 rounded-2xl shadow-xl shadow-purple-900/5 border border-purple-50">
              {/* Section 1: Personal Details */}
              <div className="space-y-6">
                <h3 className="font-bold text-[#5a0a8f] flex items-center gap-2 text-lg">
                  <span className="material-symbols-outlined">person</span>
                  Personal Information
                </h3>
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

                {/* Father's Name, Mother's Name and Phone Number */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  <div>
                    <label htmlFor="phone" className="block text-sm font-semibold text-gray-900 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        call
                      </span>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="10 digit number"
                        required
                        maxLength={10}
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none transition-all text-gray-900 bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Gender and Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="gender" className="block text-sm font-bold text-gray-700 mb-2">
                      Gender <span className="text-red-500">*</span>
                    </label>
                    <div className="relative group">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#5a0a8f] transition-colors">
                        wc
                      </span>
                      <select
                        id="gender"
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-10 pr-10 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none transition-all appearance-none bg-white text-gray-900 font-medium"
                      >
                        <option value="" disabled>
                          Select gender
                        </option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-focus-within:text-[#5a0a8f]">
                        keyboard_arrow_down
                      </span>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="category" className="block text-sm font-bold text-gray-700 mb-2">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <div className="relative group">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#5a0a8f] transition-colors">
                        groups
                      </span>
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-10 pr-10 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none transition-all appearance-none bg-white text-gray-900 font-medium"
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
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-focus-within:text-[#5a0a8f]">
                        keyboard_arrow_down
                      </span>
                    </div>
                  </div>
                </div>

                {/* Email and Password Side-by-Side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative group">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#5a0a8f] transition-colors">
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
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none transition-all text-gray-900 bg-white font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-2">
                      Account Password
                    </label>
                    <div className="relative group">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#5a0a8f] transition-colors">
                        lock
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Min. 8 characters"
                        required
                        minLength={8}
                        className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none transition-all text-gray-900 bg-white font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#5a0a8f] transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        <span className="material-symbols-outlined text-xl">
                          {showPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* District and Date of Birth Side-by-Side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="district" className="block text-sm font-bold text-gray-700 mb-2">
                      District Association
                    </label>
                    <div className="relative group">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#5a0a8f] transition-colors">
                        location_on
                      </span>
                      <select
                        id="district"
                        name="district"
                        value={formData.district}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-10 pr-10 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none transition-all appearance-none bg-white text-gray-900 font-medium"
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
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-focus-within:text-[#5a0a8f]">
                        keyboard_arrow_down
                      </span>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="dateOfBirth" className="block text-sm font-bold text-gray-700 mb-2">
                      Date of Birth <span className="text-red-500">*</span>
                    </label>
                    <DatePickerField
                      id="dateOfBirth"
                      name="dateOfBirth"
                      label="Select birth date"
                      value={formData.dateOfBirth}
                      onChange={(date) => setFormData({ ...formData, dateOfBirth: date })}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Identification Documents */}
              <div className="pt-8 border-t border-gray-100 space-y-6">
                <h3 className="font-bold text-[#5a0a8f] flex items-center gap-2 text-lg">
                  <span className="material-symbols-outlined">badge</span>
                  Identification Documents
                </h3>

                <div className="space-y-6">
                  {/* Aadhaar Details */}
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="aadhaarNumber" className="block text-sm font-semibold text-gray-700 mb-2">
                        Aadhaar Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
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
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none transition-all text-gray-900 bg-white"
                        />
                      </div>
                    </div>

                    <div className="border-2 border-gray-200 rounded-lg p-4 bg-white">
                      {aadhaarPreview ? (
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-3">
                            {aadhaarPreview === 'pdf' ? (
                              <div className="w-12 h-12 rounded bg-red-100 flex items-center justify-center">
                                <span className="material-symbols-outlined text-2xl text-red-600">picture_as_pdf</span>
                              </div>
                            ) : (
                              <img
                                src={aadhaarPreview}
                                alt="Aadhaar preview"
                                className="w-16 h-16 object-cover rounded border border-gray-200"
                              />
                            )}
                            <div className="flex-1 min-w-0 text-left">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {formData.aadhaarDocument?.name || 'Aadhaar Document'}
                              </p>
                              <div className="flex gap-3 mt-1">
                                <label className="cursor-pointer text-xs font-bold text-[#5a0a8f] hover:underline">
                                  Change
                                  <input
                                    type="file"
                                    accept="image/jpeg,image/png,application/pdf"
                                    onChange={handleAadhaarDocumentChange}
                                    className="hidden"
                                  />
                                </label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAadhaarPreview(null)
                                    setFormData({ ...formData, aadhaarDocument: null })
                                  }}
                                  className="text-xs font-bold text-red-600 hover:underline"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">No Aadhaar uploaded <span className="text-red-500">*</span></span>
                          <label className="cursor-pointer bg-[#5a0a8f] text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-[#400466] transition-colors">
                            Upload Aadhaar
                            <input
                              type="file"
                              accept="image/jpeg,image/png,application/pdf"
                              onChange={handleAadhaarDocumentChange}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Passport Details */}
                  <div className="space-y-4 pt-6 border-t border-gray-100 mt-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Passport Details <span className="font-normal text-xs text-gray-500 ml-1">(Optional)</span></h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="passportNumber" className="block text-sm font-semibold text-gray-700 mb-2">
                          Passport Number
                        </label>
                        <input
                          type="text"
                          id="passportNumber"
                          name="passportNumber"
                          value={formData.passportNumber}
                          onChange={handleInputChange}
                          placeholder="Enter passport number"
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none text-gray-900 bg-white"
                        />
                      </div>
                      <div>
                        <label htmlFor="passportExpiryDate" className="block text-sm font-semibold text-gray-700 mb-2">
                          Passport Expiry Date
                        </label>
                        <input
                          type="date"
                          id="passportExpiryDate"
                          name="passportExpiryDate"
                          value={formData.passportExpiryDate}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none text-gray-900 bg-white placeholder-gray-400"
                        />
                      </div>
                      <div>
                        <label htmlFor="passportIssuedPlace" className="block text-sm font-semibold text-gray-700 mb-2">
                          Passport Issued Place
                        </label>
                        <input
                          type="text"
                          id="passportIssuedPlace"
                          name="passportIssuedPlace"
                          value={formData.passportIssuedPlace}
                          onChange={handleInputChange}
                          placeholder="City/State"
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none text-gray-900 bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Passport Copy
                      </label>
                      <div className="border-2 border-gray-200 rounded-lg p-4 bg-white">
                        {passportPreview ? (
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                              {passportPreview === 'pdf' ? (
                                <div className="w-12 h-12 rounded bg-red-100 flex items-center justify-center">
                                  <span className="material-symbols-outlined text-2xl text-red-600">picture_as_pdf</span>
                                </div>
                              ) : (
                                <img
                                  src={passportPreview}
                                  alt="Passport preview"
                                  className="w-16 h-12 object-cover rounded border border-gray-200"
                                />
                              )}
                              <div className="flex-1 min-w-0 text-left">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {formData.passportDocument?.name || 'Passport Document'}
                                </p>
                                <div className="flex gap-3 mt-1">
                                  <label className="cursor-pointer text-xs font-bold text-[#5a0a8f] hover:underline">
                                    Change
                                    <input
                                      type="file"
                                      accept="image/jpeg,image/png,application/pdf"
                                      onChange={handlePassportDocumentChange}
                                      className="hidden"
                                    />
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPassportPreview(null)
                                      setFormData({ ...formData, passportDocument: null })
                                    }}
                                    className="text-xs font-bold text-red-600 hover:underline"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">No passport copy uploaded</span>
                            <label className="cursor-pointer bg-[#5a0a8f] text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-[#400466] transition-colors">
                              Upload Passport Copy
                              <input
                                type="file"
                                accept="image/jpeg,image/png,application/pdf"
                                onChange={handlePassportDocumentChange}
                                className="hidden"
                              />
                            </label>
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500 mt-2">Maximum size 5MB. JPG, PNG or PDF only.</p>
                    </div>
                  </div>

                  {(registrationType === 'player' || registrationType === 'coach' || registrationType === 'referee') && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-8">
                      {/* Kit Sizes */}
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <span className="material-symbols-outlined text-[#5a0a8f]">apparel</span>
                          <h4 className="text-lg font-bold text-gray-900">Kit Sizes & Performance Details</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">T-Shirt Size</label>
                            <div className="relative group">
                              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#5a0a8f]">apparel</span>
                              <select
                                name="tShirtSize"
                                value={formData.tShirtSize}
                                onChange={handleInputChange}
                                className="w-full pl-10 pr-10 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#5a0a8f] outline-none appearance-none bg-white text-gray-900 font-medium"
                              >
                                <option value="">Select Size</option>
                                <option value="S">Small (S)</option>
                                <option value="M">Medium (M)</option>
                                <option value="L">Large (L)</option>
                                <option value="XL">Extra Large (XL)</option>
                                <option value="XXL">XXL</option>
                              </select>
                              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-focus-within:text-[#5a0a8f]">keyboard_arrow_down</span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Tracksuit Size</label>
                            <div className="relative group">
                              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#5a0a8f]">straighten</span>
                              <select
                                name="trackSuitSize"
                                value={formData.trackSuitSize}
                                onChange={handleInputChange}
                                className="w-full pl-10 pr-10 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#5a0a8f] outline-none appearance-none bg-white text-gray-900 font-medium"
                              >
                                <option value="">Select Size</option>
                                <option value="S">Small (S)</option>
                                <option value="M">Medium (M)</option>
                                <option value="L">Large (L)</option>
                                <option value="XL">Extra Large (XL)</option>
                                <option value="XXL">XXL</option>
                              </select>
                              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-focus-within:text-[#5a0a8f]">keyboard_arrow_down</span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Shoes Size (UK/India)</label>
                            <div className="relative group">
                              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#5a0a8f]">footprint</span>
                              <input
                                type="text"
                                name="shoesSize"
                                value={formData.shoesSize}
                                onChange={handleInputChange}
                                placeholder="e.g. 8"
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#5a0a8f] outline-none bg-white text-gray-900 font-medium"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Pant Size</label>
                            <div className="relative group">
                              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#5a0a8f]">format_size</span>
                              <input
                                type="text"
                                name="pantSize"
                                value={formData.pantSize}
                                onChange={handleInputChange}
                                placeholder="e.g. 32"
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#5a0a8f] outline-none bg-white text-gray-900 font-medium"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <hr className="border-gray-100" />

                      {/* Performance Details */}
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <span className="material-symbols-outlined text-[#5a0a8f]">analytics</span>
                          <h4 className="text-lg font-bold text-gray-900">Performance Details</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">District Games Played</label>
                            <input
                              type="text"
                              name="districtGames"
                              value={formData.districtGames}
                              onChange={handleInputChange}
                              placeholder="e.g. 5"
                              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] outline-none bg-white text-gray-900"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">State-Level Games Played</label>
                            <input
                              type="text"
                              name="stateGames"
                              value={formData.stateGames}
                              onChange={handleInputChange}
                              placeholder="e.g. 3"
                              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] outline-none bg-white text-gray-900"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">National Games Played</label>
                            <input
                              type="text"
                              name="nationalGames"
                              value={formData.nationalGames}
                              onChange={handleInputChange}
                              placeholder="e.g. 1"
                              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] outline-none bg-white text-gray-900"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">International Games Played</label>
                            <input
                              type="text"
                              name="internationalGames"
                              value={formData.internationalGames}
                              onChange={handleInputChange}
                              placeholder="e.g. 0"
                              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] outline-none bg-white text-gray-900"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Certificate Images */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      10th / Birth Certificate / PAN Card
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
                                  accept="image/jpeg,image/png"
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
                                  accept="image/jpeg,image/png"
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
                        Upload up to 10 certificate images. JPG or PNG only. Max size 5MB per image.
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
                </div>
              </div>
            </div>
          </form>
        </div>


        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-gray-600">
            Already registered?{' '}
            <a href={loginHref} className="text-[#5a0a8f] font-bold hover:underline">
              Log in here
            </a>
          </p>
        </div>
      </div>
    </main>

  )
}
