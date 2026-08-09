import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { emailChangeApi } from '../../lib/emailChange'

const RESEND_COOLDOWN_S = 60

type Step = 'idle' | 'enter-email' | 'enter-otp' | 'done'

const errorText = (err: unknown, fallback: string) =>
  err instanceof Error && err.message ? err.message : fallback

/**
 * Self-service email change for players, coaches and referees.
 *
 * The code is sent to the NEW address, so entering it correctly is the proof
 * that the inbox belongs to the user. Nothing else has to move: every other
 * record points at the account by id, and the backend rewrites the mirrored
 * `users` row itself.
 */
export function ChangeEmailCard() {
  const { user, setUserEmail } = useAuth()

  const [step, setStep] = useState<Step>('idle')
  const [newEmail, setNewEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [cooldown, setCooldown] = useState(0)

  const otpInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (cooldown <= 0) return
    const id = window.setInterval(() => setCooldown((s) => (s <= 1 ? 0 : s - 1)), 1000)
    return () => window.clearInterval(id)
  }, [cooldown])

  useEffect(() => {
    if (step === 'enter-otp') otpInputRef.current?.focus()
  }, [step])

  const reset = () => {
    setStep('idle')
    setNewEmail('')
    setOtp('')
    setError('')
    setNotice('')
    setCooldown(0)
  }

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await emailChangeApi.request(newEmail.trim())
      setStep('enter-otp')
      setNotice(`We sent a 6-digit code to ${newEmail.trim()}. It expires in 5 minutes.`)
      setCooldown(RESEND_COOLDOWN_S)
    } catch (err) {
      setError(errorText(err, 'Could not send the verification code. Please try again.'))
    } finally {
      setBusy(false)
    }
  }

  const handleResend = async () => {
    if (cooldown > 0 || busy) return
    setError('')
    setBusy(true)
    try {
      await emailChangeApi.resend(newEmail.trim())
      setNotice(`A new code is on its way to ${newEmail.trim()}.`)
      setCooldown(RESEND_COOLDOWN_S)
    } catch (err) {
      setError(errorText(err, 'Could not resend the code. Please try again.'))
    } finally {
      setBusy(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const res = await emailChangeApi.verify(newEmail.trim(), otp.trim())
      setUserEmail(res.email)
      setStep('done')
      setNotice(`Your email address is now ${res.email}. Use it the next time you sign in.`)
    } catch (err) {
      setError(errorText(err, 'Verification failed. Please try again.'))
    } finally {
      setBusy(false)
    }
  }

  const inputClass =
    'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none text-gray-900'

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
      <div className="flex items-start gap-3 mb-4">
        <span className="material-symbols-outlined text-[#5a0a8f]">mail</span>
        <div className="min-w-0">
          <h2 className="text-lg font-black text-gray-900">Email Address</h2>
          <p className="text-sm text-gray-600 break-all">
            Signed in as <span className="font-semibold text-gray-900">{user?.email || '—'}</span>
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {notice && !error && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 break-words">
          {notice}
        </div>
      )}

      {step === 'idle' && (
        <button
          type="button"
          onClick={() => {
            setNotice('')
            setStep('enter-email')
          }}
          className="w-full sm:w-auto px-5 py-2.5 bg-[#5a0a8f] hover:bg-[#400466] text-white rounded-lg font-bold transition-colors"
        >
          Change Email Address
        </button>
      )}

      {step === 'enter-email' && (
        <form onSubmit={handleSendCode} className="space-y-4">
          <div>
            <label htmlFor="new-email" className="block text-sm font-semibold text-gray-700 mb-1">
              New email address
            </label>
            <input
              id="new-email"
              type="email"
              required
              autoFocus
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="you@example.com"
              className={inputClass}
            />
            <p className="text-xs text-gray-500 mt-1">
              We&apos;ll send a verification code there before making the switch.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
            <button
              type="button"
              onClick={reset}
              className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy || !newEmail.trim()}
              className="px-5 py-2.5 bg-[#5a0a8f] hover:bg-[#400466] disabled:opacity-50 text-white rounded-lg font-bold transition-colors"
            >
              {busy ? 'Sending…' : 'Send Code'}
            </button>
          </div>
        </form>
      )}

      {step === 'enter-otp' && (
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label htmlFor="email-otp" className="block text-sm font-semibold text-gray-700 mb-1">
              Verification code
            </label>
            <input
              id="email-otp"
              ref={otpInputRef}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className={`${inputClass} tracking-[0.5em] text-center text-lg font-bold`}
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0 || busy}
              className="text-sm font-semibold text-[#5a0a8f] disabled:text-gray-400 text-left"
            >
              {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
            </button>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={reset}
                className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy || otp.length !== 6}
                className="px-5 py-2.5 bg-[#5a0a8f] hover:bg-[#400466] disabled:opacity-50 text-white rounded-lg font-bold transition-colors"
              >
                {busy ? 'Verifying…' : 'Verify & Change'}
              </button>
            </div>
          </div>
        </form>
      )}

      {step === 'done' && (
        <button
          type="button"
          onClick={reset}
          className="w-full sm:w-auto px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
        >
          Done
        </button>
      )}
    </div>
  )
}
