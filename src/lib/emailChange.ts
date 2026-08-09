import { apiRequest } from './api'

export type EmailChangeRole = 'player' | 'coach' | 'referee'

type OkResponse = { ok: true; email: string; previousEmail?: string }

export const emailChangeApi = {
  /** Sends a 6-digit code to the new address (self-service). */
  request: (newEmail: string) =>
    apiRequest<{ ok: true; email: string }>('/auth/email-change/request', {
      method: 'POST',
      body: JSON.stringify({ newEmail }),
      auth: true,
    }),

  resend: (newEmail: string) =>
    apiRequest<{ ok: true }>('/auth/email-change/resend', {
      method: 'POST',
      body: JSON.stringify({ newEmail }),
      auth: true,
    }),

  /** Confirms the code and moves the account onto the new address. */
  verify: (newEmail: string, otp: string) =>
    apiRequest<OkResponse>('/auth/email-change/verify', {
      method: 'POST',
      body: JSON.stringify({ newEmail, otp }),
      auth: true,
    }),

  /** Admin override — changes any account's address with no OTP. */
  adminChange: (role: EmailChangeRole, id: string, newEmail: string) =>
    apiRequest<OkResponse>('/auth/email-change/admin', {
      method: 'POST',
      body: JSON.stringify({ role, id, newEmail }),
      auth: true,
    }),
}
