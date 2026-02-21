import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiRequest } from '../lib/api'

type Role = 'coach' | 'player' | 'referee'

type VerifyResponse = {
  ok: boolean
  profile: {
    id: string
    fullName: string
    role: Role
    profilePhoto: string
  }
}

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [role, setRole] = useState<Role>('coach')
  const [phone, setPhone] = useState('')
  const [aadhaarNumber, setAadhaarNumber] = useState('')
  const [profile, setProfile] = useState<VerifyResponse['profile'] | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [saving, setSaving] = useState(false)
  const [photoLoadFailed, setPhotoLoadFailed] = useState(false)

  const roleLabel = useMemo(() => {
    if (role === 'coach') return 'Coach'
    if (role === 'player') return 'Player'
    return 'Referee'
  }, [role])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setProfile(null)
    setPhotoLoadFailed(false)

    if (!phone.trim() || !aadhaarNumber.trim()) {
      setError('Phone number and Aadhaar number are required.')
      return
    }

    setVerifying(true)
    try {
      const data = await apiRequest<VerifyResponse>('/auth/forgot-password/verify', {
        method: 'POST',
        body: JSON.stringify({ role, phone: phone.trim(), aadhaarNumber: aadhaarNumber.trim() }),
      })
      setProfile(data.profile)
      setPhotoLoadFailed(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed.')
    } finally {
      setVerifying(false)
    }
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!profile) {
      setError('Please verify your details first.')
      return
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmNewPassword) {
      setError('New password and confirm password do not match.')
      return
    }

    setSaving(true)
    try {
      await apiRequest('/auth/forgot-password/reset', {
        method: 'POST',
        body: JSON.stringify({
          role,
          phone: phone.trim(),
          aadhaarNumber: aadhaarNumber.trim(),
          newPassword,
        }),
      })
      setSuccess('Password updated successfully. You can now log in.')
      setTimeout(() => navigate('/login'), 900)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password reset failed.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="mx-auto w-full max-w-xl rounded-xl bg-white p-6 shadow-md">
        <h1 className="text-2xl font-black text-gray-900">Forgot Password</h1>
        <p className="mt-1 text-sm text-gray-600">Verify with phone number and Aadhaar number.</p>

        <form onSubmit={handleVerify} className="mt-6 space-y-4">
          <div>
            <label htmlFor="role" className="mb-1 block text-sm font-semibold text-gray-700">Role</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="forgot-select w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-[#5a0a8f] focus:outline-none"
              disabled={!!profile}
            >
              <option value="coach">Coach</option>
              <option value="player">Player</option>
              <option value="referee">Referee</option>
            </select>
          </div>

          <div>
            <label htmlFor="phone" className="mb-1 block text-sm font-semibold text-gray-700">Phone Number</label>
            <input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="Enter phone number"
              className="forgot-input w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 caret-gray-900 focus:border-[#5a0a8f] focus:outline-none"
              disabled={!!profile}
              required
            />
          </div>

          <div>
            <label htmlFor="aadhaar" className="mb-1 block text-sm font-semibold text-gray-700">Aadhaar Number</label>
            <input
              id="aadhaar"
              value={aadhaarNumber}
              onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
              placeholder="Enter Aadhaar number"
              className="forgot-input w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 caret-gray-900 focus:border-[#5a0a8f] focus:outline-none"
              disabled={!!profile}
              required
            />
          </div>

          {!profile && (
            <button
              type="submit"
              disabled={verifying}
              className="w-full rounded-lg bg-[#5a0a8f] px-4 py-2 font-semibold text-white hover:bg-[#4a0777] disabled:opacity-60"
            >
              {verifying ? 'Verifying...' : 'Verify Identity'}
            </button>
          )}
        </form>

        {profile && (
          <div className="mt-6 rounded-lg border border-gray-200 p-4">
            <h2 className="text-lg font-bold text-gray-900">{roleLabel} Verified</h2>
            <div className="mt-3 flex items-center gap-4">
              {profile.profilePhoto ? (
                !photoLoadFailed ? (
                  <img
                    src={profile.profilePhoto}
                    alt="Profile"
                    className="h-16 w-16 rounded-full object-cover"
                    onError={() => setPhotoLoadFailed(true)}
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-200 text-sm text-gray-600">No Photo</div>
                )
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-200 text-sm text-gray-600">No Photo</div>
              )}
              <div>
                <div className="text-sm text-gray-600">Name: <span className="font-semibold text-gray-900">{profile.fullName || 'N/A'}</span></div>
                <div className="text-sm text-gray-600">ID: <span className="font-semibold text-gray-900">{profile.id || 'N/A'}</span></div>
              </div>
            </div>

            <form onSubmit={handleReset} className="mt-4 space-y-3">
              <div>
                <label htmlFor="newPassword" className="mb-1 block text-sm font-semibold text-gray-700">New Password</label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="forgot-input w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 caret-gray-900 focus:border-[#5a0a8f] focus:outline-none"
                  required
                />
              </div>
              <div>
                <label htmlFor="confirmNewPassword" className="mb-1 block text-sm font-semibold text-gray-700">Confirm New Password</label>
                <input
                  id="confirmNewPassword"
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="forgot-input w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 caret-gray-900 focus:border-[#5a0a8f] focus:outline-none"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-lg bg-[#5a0a8f] px-4 py-2 font-semibold text-white hover:bg-[#4a0777] disabled:opacity-60"
              >
                {saving ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        )}

        {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        {success && <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{success}</div>}

        <div className="mt-5 text-center">
          <Link to="/login" className="text-sm font-medium text-[#5a0a8f] hover:underline">Back to Login</Link>
        </div>
      </div>
    </div>
  )
}
