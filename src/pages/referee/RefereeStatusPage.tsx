import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

export function RefereeStatusPage() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected' | ''>('')
  const [remarks, setRemarks] = useState<string>('')
  const [profileId, setProfileId] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiRequest<{ profile: any }>('/referees/me', { auth: true })
      const s = (res.profile?.status || '').toLowerCase() as typeof status
      setStatus(s)
      setRemarks(res.profile?.reviewRemarks || '')
      setProfileId(res.profile?._id || res.profile?.id || '')
      if (s === 'approved') {
        navigate('/referee/dashboard', { replace: true })
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load status')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleResubmit = async () => {
    if (!profileId) return
    navigate('/referee/resubmit', { state: { profileId, remarks } })
  }

  const handleRestart = async () => {
    if (!profileId) return
    const confirmed = window.confirm('This will delete your current application and account. Continue?')
    if (!confirmed) return
    setSubmitting(true)
    setError(null)
    try {
      await apiRequest(`/referees/${encodeURIComponent(profileId)}/restart`, {
        method: 'POST',
        auth: true,
      })
      logout()
      navigate('/register', { replace: true })
    } catch (err: any) {
      setError(err?.message || 'Failed to start a fresh application')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-700">
        <div className="animate-pulse text-sm">Loading your application status...</div>
      </div>
    )
  }

  const isPending = status === 'pending'
  const isRejected = status === 'rejected'

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm max-w-xl w-full p-8 space-y-6">
        <div className="flex items-center gap-3">
          <span
            className={`material-symbols-outlined text-3xl ${
              isPending ? 'text-orange-500' : isRejected ? 'text-red-500' : 'text-green-500'
            }`}
          >
            {isPending ? 'hourglass_top' : isRejected ? 'block' : 'check_circle'}
          </span>
          <div>
            <h1 className="text-2xl font-black text-gray-900">
              {isPending ? 'Application Under Review' : isRejected ? 'Application Rejected' : 'Application Approved'}
            </h1>
            <p className="text-gray-600">We will notify you as soon as the review is completed.</p>
          </div>
        </div>

        {isRejected && (
          <div className="border border-red-200 bg-red-50 text-red-800 rounded-lg p-4 text-sm">
            <div className="font-semibold mb-1">Remarks from Admin</div>
            <div>{remarks || 'No remarks provided.'}</div>
          </div>
        )}

        {error && <div className="border border-red-200 bg-red-50 text-red-700 rounded-lg p-3 text-sm">{error}</div>}

        <div className="space-y-3">
          {isRejected && (
            <button
              onClick={handleResubmit}
              disabled={submitting}
              className="w-full px-4 py-3 bg-[#5a0a8f] text-white rounded-lg font-semibold hover:bg-[#400466] disabled:opacity-50"
            >
              {submitting ? 'Resubmitting...' : 'Update & Resubmit for Review'}
            </button>
          )}

          <button
            onClick={handleRestart}
            disabled={submitting}
            className="w-full px-4 py-3 border border-gray-300 text-gray-800 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50"
          >
            {submitting ? 'Processing...' : 'Start a Fresh Application'}
          </button>

          <button
            onClick={() => {
              logout()
              navigate('/login', { replace: true })
            }}
            className="w-full px-4 py-3 text-sm text-gray-600 underline"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
