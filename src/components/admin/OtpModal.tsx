import { useRef, useState, useEffect, useCallback } from 'react'

type Props = {
  email: string
  onVerify: (otp: string) => Promise<{ success: boolean; error?: string }>
  onResend: () => Promise<{ ok: boolean; waitSeconds?: number; error?: string }>
  onCancel: () => void
}

const RESEND_COOLDOWN = 60 // seconds
const OTP_LENGTH = 6

export function OtpModal({ email, onVerify, onResend, onCancel }: Props) {
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // ── Start cooldown timer on mount ──────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Auto-focus first input on open
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const resetCooldown = () => {
    setResendCooldown(RESEND_COOLDOWN)
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  // ── Digit input handlers ───────────────────────────────────────────────────

  const handleChange = (index: number, value: string) => {
    // Accept only digits
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = digit
    setDigits(next)
    setError('')

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all 6 filled
    if (digit && index === OTP_LENGTH - 1) {
      const complete = [...next]
      if (complete.every((d) => d !== '')) {
        void submitOtp(complete.join(''))
      }
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        const next = [...digits]
        next[index] = ''
        setDigits(next)
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus()
      }
    }
    if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus()
    if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus()
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (!pasted) return
    const next = [...digits]
    pasted.split('').forEach((ch, i) => { next[i] = ch })
    setDigits(next)
    // Focus the next empty box or the last one
    const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1)
    inputRefs.current[focusIdx]?.focus()

    if (pasted.length === OTP_LENGTH) {
      void submitOtp(pasted)
    }
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  const submitOtp = useCallback(async (otp: string) => {
    if (loading) return
    setLoading(true)
    setError('')

    const result = await onVerify(otp)
    setLoading(false)

    if (!result.success) {
      setError(result.error || 'Invalid OTP. Please try again.')
      // Clear digits on failure so user can re-enter
      setDigits(Array(OTP_LENGTH).fill(''))
      setTimeout(() => inputRefs.current[0]?.focus(), 50)
    }
    // On success, the parent handles navigation — modal unmounts
  }, [loading, onVerify])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const otp = digits.join('')
    if (otp.length < OTP_LENGTH) {
      setError('Please enter all 6 digits.')
      return
    }
    void submitOtp(otp)
  }

  // ── Resend ─────────────────────────────────────────────────────────────────

  const handleResend = async () => {
    if (resendCooldown > 0 || resendLoading) return
    setResendLoading(true)
    setResendSuccess(false)
    setError('')

    const result = await onResend()
    setResendLoading(false)

    if (result.ok) {
      setResendSuccess(true)
      setDigits(Array(OTP_LENGTH).fill(''))
      resetCooldown()
      setTimeout(() => { setResendSuccess(false); inputRefs.current[0]?.focus() }, 3000)
    } else if (result.waitSeconds) {
      setResendCooldown(result.waitSeconds)
    } else {
      setError(result.error || 'Failed to resend. Please try again.')
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const maskedEmail = email.replace(/(.{2}).+(@.+)/, '$1•••$2')

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md">

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">

          {/* Purple gradient header */}
          <div className="bg-gradient-to-br from-[#400466] via-[#5a0a8f] to-[#7c3aed] px-8 py-8 text-center">
            {/* Shield icon */}
            <div className="w-16 h-16 bg-white/15 border border-white/25 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-white text-4xl">verified_user</span>
            </div>
            <h2 className="text-white text-xl font-black tracking-tight">Admin Verification</h2>
            <p className="text-white/70 text-xs font-medium mt-1 uppercase tracking-widest">
              Haryana Sepak Takraw Association
            </p>
          </div>

          {/* Body */}
          <div className="px-8 py-7">
            {/* Info block */}
            <div className="bg-purple-50 border border-purple-100 rounded-xl px-4 py-3 mb-6 text-center">
              <p className="text-[13px] text-[#5a0a8f] font-semibold">
                🔐 &nbsp;6-digit code sent to:
              </p>
              <p className="text-[13px] text-gray-700 font-bold mt-0.5">{maskedEmail}</p>
              <p className="text-[11px] text-gray-500 mt-1">Code expires in 5 minutes · Single use</p>
            </div>

            <form onSubmit={handleSubmit}>

              {/* OTP digit inputs */}
              <div className="flex justify-center gap-2.5 mb-6" onPaste={handlePaste}>
                {digits.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    disabled={loading}
                    className={`
                      w-12 h-14 text-center text-2xl font-black rounded-xl border-2 outline-none
                      transition-all duration-150 tabular-nums
                      disabled:opacity-50 disabled:cursor-not-allowed
                      ${error
                        ? 'border-red-400 bg-red-50 text-red-700 focus:border-red-500'
                        : digit
                        ? 'border-[#5a0a8f] bg-purple-50 text-[#5a0a8f] focus:border-[#400466]'
                        : 'border-gray-300 bg-gray-50 text-gray-900 focus:border-[#5a0a8f] focus:bg-white'
                      }
                    `}
                    aria-label={`OTP digit ${i + 1}`}
                  />
                ))}
              </div>

              {/* Error message */}
              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5">
                  <span className="material-symbols-outlined text-red-500 text-[18px] mt-0.5 shrink-0">error</span>
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              )}

              {/* Resend success */}
              {resendSuccess && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-5">
                  <span className="material-symbols-outlined text-green-600 text-[18px]">check_circle</span>
                  <p className="text-sm text-green-700 font-semibold">New code sent to your email.</p>
                </div>
              )}

              {/* Verify button */}
              <button
                type="submit"
                disabled={loading || digits.some((d) => !d)}
                className="w-full bg-[#5a0a8f] hover:bg-[#400466] disabled:opacity-50 disabled:cursor-not-allowed
                           text-white font-bold py-3.5 rounded-xl transition-all
                           flex items-center justify-center gap-2 text-base shadow-lg shadow-purple-900/20"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying…</span>
                  </>
                ) : (
                  <>
                    <span>Verify Code</span>
                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                  </>
                )}
              </button>

              {/* Resend + Cancel row */}
              <div className="mt-5 flex items-center justify-between">
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={loading}
                  className="text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors disabled:opacity-50"
                >
                  ← Back to login
                </button>

                <button
                  type="button"
                  onClick={() => void handleResend()}
                  disabled={resendCooldown > 0 || resendLoading || loading}
                  className={`text-sm font-semibold transition-colors ${
                    resendCooldown > 0
                      ? 'text-gray-400 cursor-default'
                      : 'text-[#5a0a8f] hover:text-[#400466]'
                  } disabled:cursor-not-allowed`}
                >
                  {resendLoading ? (
                    'Sending…'
                  ) : resendCooldown > 0 ? (
                    `Resend in ${resendCooldown}s`
                  ) : (
                    'Resend code'
                  )}
                </button>
              </div>

            </form>
          </div>

          {/* Footer */}
          <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 text-center">
            <p className="text-[11px] text-gray-400">
              This code was sent to your registered admin email address.
              If you did not attempt to log in, contact support immediately.
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
