import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { OtpModal } from '../components/admin/OtpModal'

export function LoginPage() {
  const navigate = useNavigate()
  const { login, verifyAdminOtp, resendAdminOtp } = useAuth()

  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe]     = useState(false)
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [error, setError]               = useState('')
  const [loading, setLoading]           = useState(false)

  // OTP modal state
  const [otpEmail, setOtpEmail]   = useState<string | null>(null)
  const [showOtp, setShowOtp]     = useState(false)

  // ── Step 1: password login ─────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!selectedRole) {
      setError('Please select your role before signing in.')
      return
    }

    setLoading(true)

    try {
      const role = selectedRole as 'admin' | 'coach' | 'player' | 'referee'
      const result = await login(email, password, role)

      if (result.status === 'success') {
        // Non-admin direct login — redirect immediately
        redirectByRole(role)
      } else if (result.status === 'otp_required') {
        // Admin 2FA — show OTP modal
        setOtpEmail(result.email)
        setShowOtp(true)
      } else {
        setError('Invalid email or password. Please try again.')
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2: OTP verification (admin only) ─────────────────────────────────

  const handleOtpVerify = async (otp: string) => {
    if (!otpEmail) return { success: false, error: 'Session error. Please log in again.' }

    const result = await verifyAdminOtp(otpEmail, otp)

    if (result.success) {
      setShowOtp(false)
      navigate('/admin/dashboard')
    }

    return result
  }

  const handleOtpResend = async () => {
    if (!otpEmail) return { ok: false, error: 'Session error.' }
    return resendAdminOtp(otpEmail)
  }

  const handleOtpCancel = () => {
    setShowOtp(false)
    setOtpEmail(null)
    setPassword('') // clear password for security
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  const redirectByRole = (role: string) => {
    if (role === 'admin')   navigate('/admin/dashboard')
    else if (role === 'player')  navigate('/player/dashboard')
    else if (role === 'coach')   navigate('/coach/dashboard')
    else if (role === 'referee') navigate('/referee/dashboard')
    else navigate('/')
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <main id="page-content" className="min-h-screen flex">

        {/* Left Section - Dark Background with Image */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-gray-900 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-60"
            style={{
              backgroundImage:
                'url("https://www.sarawaktribune.com/wp-content/uploads/2025/05/actakraw12_NSTfield_image_socialmedia.webp")',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 via-gray-900/80 to-blue-900/60" />

          <div className="relative z-10 flex flex-col justify-between p-8 md:p-12 text-white h-full">
            {/* Logo */}
            <div className="mb-8">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
                <img
                  src={`${import.meta.env.BASE_URL}assets/images/logo.png`}
                  alt="HSTA Logo"
                  className="w-12 h-12 object-contain"
                  onError={(e) => {
                    const t = e.target as HTMLImageElement
                    t.style.display = 'none'
                    t.parentElement!.innerHTML =
                      '<div class="w-full h-full flex items-center justify-center"><div class="text-white text-2xl font-bold">HSTA</div></div>'
                  }}
                />
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-center">
              <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
                Empowering Athletes, <br />
                Unifying the Federation.
              </h1>
              <p className="text-lg text-white/90 max-w-md leading-relaxed">
                The official management portal for Officials, Coaches, and Players. Streamline federation
                operations and track performance in one place.
              </p>
            </div>
          </div>
        </div>

        {/* Right Section - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center bg-white p-6 md:p-8 lg:p-12">
          <div className="w-full max-w-md">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-[#5a0a8f] mb-8">Please enter your details to access the dashboard.</p>

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
                  Email Address / Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="w-full pl-4 pr-12 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none transition-all bg-white text-gray-900 placeholder:text-gray-400"
                  />
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    mail
                  </span>
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-900 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full pl-4 pr-12 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none transition-all bg-white text-gray-900 placeholder:text-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <span className="material-symbols-outlined">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-[#5a0a8f] focus:ring-[#5a0a8f]"
                  />
                  <span className="text-sm text-gray-700">Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-sm text-[#5a0a8f] hover:underline font-medium">
                  Forgot Password?
                </Link>
              </div>

              {/* Role selector */}
              <div className="mb-6">
                <label htmlFor="role-select" className="block text-center text-sm font-semibold text-gray-700 mb-3">
                  Access for Authorized Personnel
                </label>
                <div className="relative">
                  <select
                    id="role-select"
                    value={selectedRole}
                    onChange={(e) => { setSelectedRole(e.target.value); setError('') }}
                    className="w-full pl-4 pr-10 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none transition-all appearance-none bg-white text-gray-900 font-medium"
                  >
                    <option value="">Select your role</option>
                    <option value="admin">ADMIN</option>
                    <option value="coach">COACHES</option>
                    <option value="player">PLAYERS</option>
                    <option value="referee">REFEREES</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                    keyboard_arrow_down
                  </span>
                </div>

                {/* 2FA notice for admin */}
                {selectedRole === 'admin' && (
                  <div className="mt-2 flex items-center gap-1.5 text-[12px] text-[#5a0a8f] bg-purple-50 border border-purple-100 rounded-lg px-3 py-2">
                    <span className="material-symbols-outlined text-[16px]">shield</span>
                    <span>Admin login requires 2-factor email verification.</span>
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#5a0a8f] hover:bg-[#400466] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 px-6 rounded-lg shadow-lg shadow-purple-900/20 transition-all flex items-center justify-center gap-2 text-base"
              >
                <span>{loading ? 'Signing in...' : 'Sign in'}</span>
                {!loading && <span className="material-symbols-outlined">arrow_forward</span>}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link to="/contact" className="text-[#5a0a8f] hover:underline font-semibold">
                  Contact Federation Official
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* OTP Modal — rendered outside main so it covers everything */}
      {showOtp && otpEmail && (
        <OtpModal
          email={otpEmail}
          onVerify={handleOtpVerify}
          onResend={handleOtpResend}
          onCancel={handleOtpCancel}
        />
      )}
    </>
  )
}
