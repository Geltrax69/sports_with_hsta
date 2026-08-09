import { useState } from 'react'
import { emailChangeApi, type EmailChangeRole } from '../../lib/emailChange'

interface AdminEmailFieldProps {
  role: EmailChangeRole
  /** Mongo _id of the player/coach/referee record. */
  accountId: string
  email: string
  onChanged: (newEmail: string) => void
}

/**
 * Admin-side email change. No OTP — an admin acting on someone else's account
 * cannot receive the code, so the server-side audit log is the control here.
 * Saved immediately rather than with the rest of the form, because the change
 * moves the login identity and should not ride along silently.
 */
export function AdminEmailField({ role, accountId, email, onChanged }: AdminEmailFieldProps) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(email)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const save = async () => {
    const next = value.trim().toLowerCase()
    if (next === email.toLowerCase()) {
      setEditing(false)
      return
    }
    setError('')
    setBusy(true)
    try {
      const res = await emailChangeApi.adminChange(role, accountId, next)
      onChanged(res.email)
      setValue(res.email)
      setEditing(false)
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change the email address.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>

      {editing ? (
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            value={value}
            autoFocus
            onChange={(e) => setValue(e.target.value)}
            className="flex-1 min-w-0 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] outline-none text-gray-900"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={save}
              disabled={busy || !value.trim()}
              className="px-3 py-2 bg-[#5a0a8f] hover:bg-[#400466] disabled:opacity-50 text-white rounded-lg text-sm font-bold whitespace-nowrap"
            >
              {busy ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => {
                setValue(email)
                setError('')
                setEditing(false)
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            disabled
            className="flex-1 min-w-0 px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
          />
          <button
            type="button"
            onClick={() => {
              setSaved(false)
              setValue(email)
              setEditing(true)
            }}
            className="px-3 py-2 border border-[#5a0a8f] text-[#5a0a8f] hover:bg-[#5a0a8f]/5 rounded-lg text-sm font-bold whitespace-nowrap"
          >
            Change
          </button>
        </div>
      )}

      {error ? (
        <p className="text-[11px] text-red-600 mt-1">{error}</p>
      ) : saved ? (
        <p className="text-[11px] text-green-600 mt-1">Email updated — they now sign in with this address.</p>
      ) : (
        <p className="text-[10px] text-gray-400 mt-1">Changing this changes their login address.</p>
      )}
    </div>
  )
}
