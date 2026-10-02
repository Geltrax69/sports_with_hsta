import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, MotionConfig } from 'motion/react'
import { useAuth } from '../context/AuthContext'
import { OtpModal } from '../components/admin/OtpModal'

const ROLES = [
  { value: 'admin', label: 'Admin', icon: 'shield' },
  { value: 'coach', label: 'Coach', icon: 'sports' },
  { value: 'player', label: 'Player', icon: 'person' },
  { value: 'referee', label: 'Referee', icon: 'flag' },
  { value: 'district', label: 'District', icon: 'location_on' },
] as const

type RoleValue = (typeof ROLES)[number]['value']

// Staggered entrance: one variant shared by every content group.
const groupVariants = {
  hidden: { opacity: 0, y: 18, filter: 'blur(6px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
}

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
}

const inputClass =
  'h-12 w-full rounded-xl border border-gray-300 bg-white pl-11 pr-4 text-[15px] text-gray-900 placeholder:text-gray-400 ' +
  'transition-[border-color,box-shadow] duration-200 hover:border-gray-400 ' +
  'focus:border-[#5a0a8f] focus:outline-none focus:ring-4 focus:ring-[#5a0a8f]/15'

export function LoginPage() {
  const navigate = useNavigate()
  const { login, verifyAdminOtp, resendAdminOtp } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [selectedRole, setSelectedRole] = useState<RoleValue | ''>('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // OTP modal state
  const [otpEmail, setOtpEmail] = useState<string | null>(null)
  const [showOtp, setShowOtp] = useState(false)

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
      const result = await login(email, password, selectedRole)

      if (result.status === 'success') {
        // Non-admin direct login — redirect immediately
        redirectByRole(selectedRole)
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
    if (role === 'admin') navigate('/admin/dashboard')
    else if (role === 'player') navigate('/player/dashboard')
    else if (role === 'coach') navigate('/coach/dashboard')
    else if (role === 'referee') navigate('/referee/dashboard')
    else if (role === 'district') navigate('/district/dashboard')
    else navigate('/')
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <MotionConfig reducedMotion="user">
      <main id="page-content" className="min-h-screen lg:grid lg:grid-cols-[1.05fr_1fr] antialiased">
        {/* ── Left: brand panel ─────────────────────────────────────────── */}
        <div className="relative hidden overflow-hidden bg-[#17041f] lg:block">
          <img
            src="https://www.sarawaktribune.com/wp-content/uploads/2025/05/actakraw12_NSTfield_image_socialmedia.webp"
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full scale-105 object-cover"
          />
          {/* Layered depth: base tint + directional gradients + vignette */}
          <div className="absolute inset-0 bg-[#17041f]/35" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#17041f] via-[#17041f]/35 to-[#17041f]/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#17041f]/55 via-transparent to-transparent" />
          {/* Soft brand glow */}
          <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-[#5a0a8f]/40 blur-[120px]" />

          <div className="relative z-10 flex h-full flex-col justify-between px-10 py-8 xl:px-14">
            {/* Brand mark */}
            <div className="flex items-center gap-3.5">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-2 backdrop-blur-md">
                <img
                  src={`${import.meta.env.BASE_URL}assets/images/logo.png`}
                  alt="HSTA logo"
                  className="h-9 w-9 object-contain"
                  onError={(e) => {
                    const t = e.target as HTMLImageElement
                    t.style.display = 'none'
                    t.parentElement!.innerHTML =
                      '<div class="flex h-10 w-10 items-center justify-center"><div class="text-white text-sm font-black">HSTA</div></div>'
                  }}
                />
              </div>
              <div>
                <div className="text-[15px] font-extrabold tracking-tight text-white">HSTA</div>
                <div className="text-xs font-medium text-white/60">Haryana Sepak Takraw Association</div>
              </div>
            </div>

            {/* Headline block */}
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-purple-200/80">
                Federation Portal
              </p>
              <h1 className="max-w-lg text-balance text-4xl font-black leading-[1.05] tracking-tight text-white xl:text-[2.75rem]">
                Empowering athletes, unifying the federation.
              </h1>
              <p className="mt-3.5 max-w-md text-pretty text-[15px] leading-relaxed text-white/70">
                The official management portal for officials, coaches, districts and players —
                streamline operations and track performance in one place.
              </p>

              <div className="mt-5 flex flex-wrap gap-2.5">
                {[
                  { icon: 'speed', label: 'Live scores' },
                  { icon: 'verified', label: 'Digital certificates' },
                  { icon: 'shield', label: 'Secure admin 2FA' },
                ].map((f) => (
                  <span
                    key={f.label}
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-[13px] font-medium text-white/80 backdrop-blur-md"
                  >
                    <span className="material-symbols-outlined text-[18px] text-purple-200">{f.icon}</span>
                    {f.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: sign-in form ───────────────────────────────────────── */}
        <div className="relative flex min-h-screen items-center justify-center bg-white px-6 py-10 sm:px-10">
          {/* Faint brand tint */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_300px_at_50%_-80px,rgba(90,10,143,0.07),transparent)]"
          />

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="relative w-full max-w-[400px]"
          >
            {/* Mobile brand */}
            <motion.div variants={groupVariants} className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="rounded-xl bg-[#5a0a8f]/10 p-2">
                <img
                  src={`${import.meta.env.BASE_URL}assets/images/logo.png`}
                  alt="HSTA logo"
                  className="h-8 w-8 object-contain"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              </div>
              <div>
                <div className="text-sm font-extrabold tracking-tight text-gray-900">HSTA</div>
                <div className="text-[11px] font-medium text-gray-500">Haryana Sepak Takraw Association</div>
              </div>
            </motion.div>

            {/* Heading */}
            <motion.div variants={groupVariants}>
              <h2 className="text-balance text-4xl font-black tracking-tight text-gray-900">
                Welcome back
              </h2>
              <p className="mt-2.5 text-[15px] leading-relaxed text-gray-500">
                Sign in to access your dashboard.
              </p>
            </motion.div>

            <form onSubmit={handleSubmit} className="mt-8" noValidate>
              {/* Role picker */}
              <motion.div variants={groupVariants}>
                <span id="role-label" className="mb-2.5 block text-[13px] font-bold uppercase tracking-[0.08em] text-gray-500">
                  I am signing in as
                </span>
                <div role="radiogroup" aria-labelledby="role-label" className="grid grid-cols-5 gap-2">
                  {ROLES.map((role) => {
                    const active = selectedRole === role.value
                    return (
                      <button
                        key={role.value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => {
                          setSelectedRole(role.value)
                          setError('')
                        }}
                        className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-1 py-3 transition-[border-color,background-color,color,box-shadow,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a0a8f] focus-visible:ring-offset-2 ${
                          active
                            ? 'border-[#5a0a8f] bg-[#5a0a8f]/[0.06] text-[#5a0a8f] shadow-[0_2px_12px_-4px_rgba(90,10,143,0.35)]'
                            : 'border-gray-200 bg-white text-gray-400 hover:-translate-y-px hover:border-purple-300 hover:text-gray-600'
                        } active:scale-[0.96]`}
                      >
                        <span
                          className="material-symbols-outlined text-[22px] leading-none"
                          style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
                        >
                          {role.icon}
                        </span>
                        <span className={`text-[10.5px] font-bold leading-none ${active ? '' : 'font-semibold'}`}>
                          {role.label}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* 2FA notice for admin */}
                {selectedRole === 'admin' && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl border border-purple-200/70 bg-purple-50 px-3.5 py-2.5 text-[13px] font-medium text-[#5a0a8f]">
                    <span className="material-symbols-outlined text-[18px]">shield</span>
                    Admin sign-in needs a 2-factor email code.
                  </div>
                )}
              </motion.div>

              {/* Credentials */}
              <motion.div variants={groupVariants} className="mt-6 space-y-5">
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-semibold text-gray-900">
                    Email address
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-gray-400">
                      mail
                    </span>
                    <input
                      type="text"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.org"
                      required
                      autoComplete="email"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="mb-2 block text-sm font-semibold text-gray-900">
                    Password
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-gray-400">
                      lock
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      autoComplete="current-password"
                      className={`${inputClass} pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a0a8f]"
                    >
                      <span className="material-symbols-outlined block text-[20px]">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex cursor-pointer items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-[18px] w-[18px] cursor-pointer rounded-md border-gray-300 accent-[#5a0a8f]"
                    />
                    <span className="text-sm font-medium text-gray-600">Remember me</span>
                  </label>
                  <Link
                    to="/forgot-password"
                    className="rounded text-sm font-semibold text-[#5a0a8f] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a0a8f]"
                  >
                    Forgot password?
                  </Link>
                </div>
              </motion.div>

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                  role="alert"
                >
                  <span className="material-symbols-outlined mt-px text-[18px]">error</span>
                  {error}
                </motion.div>
              )}

              {/* Submit */}
              <motion.div variants={groupVariants} className="mt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="group flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#5a0a8f] pl-5 pr-4 text-[15.5px] font-bold text-white shadow-[0_10px_28px_-10px_rgba(90,10,143,0.55)] transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:bg-[#4c087c] hover:shadow-[0_14px_36px_-10px_rgba(90,10,143,0.65)] active:translate-y-0 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a0a8f] focus-visible:ring-offset-2"
                >
                  {loading ? (
                    <>
                      <span className="h-5 w-5 animate-spin rounded-full border-[2.5px] border-white/30 border-t-white" />
                      Signing in…
                    </>
                  ) : (
                    <>
                      Sign in
                      <span className="material-symbols-outlined text-[20px] transition-transform duration-200 group-hover:translate-x-1">
                        arrow_forward
                      </span>
                    </>
                  )}
                </button>
              </motion.div>
            </form>

            {/* Footer */}
            <motion.p variants={groupVariants} className="mt-8 text-center text-sm text-gray-500">
              Don&apos;t have an account?{' '}
              <Link
                to="/contact"
                className="font-semibold text-[#5a0a8f] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a0a8f]"
              >
                Contact Federation Official
              </Link>
            </motion.p>
          </motion.div>
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
    </MotionConfig>
  )
}
