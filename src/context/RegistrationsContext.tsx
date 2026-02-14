import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { apiRequest } from '../lib/api'
import { useAuth } from './AuthContext'

export type RegistrationStatus = 'pending' | 'approved' | 'rejected'

export type PlayerRegistration = {
  id: string
  playerId?: string
  coachId?: string
  refereeId?: string
  type: 'player' | 'coach' | 'referee'
  profilePhoto: string | null // base64 or URL
  fullName: string
  fatherName: string
  motherName: string
  phone: string
  dateOfBirth: string
  aadhaarNumber: string
  email: string
  password: string // In real app, this would be hashed
  district: string
  certificates: string[] // base64 or URLs
  status: RegistrationStatus
  submittedAt: string
  reviewedAt?: string
  reviewedBy?: string
  category?: string
  gender?: string
  aadhaarDocument?: string
  passportNumber?: string
  passportExpiryDate?: string
  passportIssuedPlace?: string
  passportDocument?: string
  // Tournament registration fields
  tournamentId?: string // ID of tournament they're applying for
  tournamentCategory?: string // Category they're applying for in tournament
  applicationStatus?: RegistrationStatus // Status of tournament application
  appliedAt?: string
  applicationReviewedAt?: string
  applicationReviewedBy?: string
  // Kit & Performance Details
  tShirtSize?: string
  trackSuitSize?: string
  shoesSize?: string
  pantSize?: string
  districtGames?: string
  stateGames?: string
  nationalGames?: string
  internationalGames?: string
}

export type TournamentRegistration = {
  id: string
  tournamentId: string
  registrationId: string // Links to PlayerRegistration
  category: string
  status: RegistrationStatus
  appliedAt: string
  reviewedAt?: string
  reviewedBy?: string
  notes?: string
}

type RegistrationsContextType = {
  registrations: PlayerRegistration[]
  tournamentRegistrations: TournamentRegistration[]
  addRegistration: (registration: Omit<PlayerRegistration, 'id' | 'submittedAt' | 'status'>) => string
  updateRegistration: (id: string, updates: Partial<PlayerRegistration>) => void
  deleteRegistration: (id: string) => void
  getRegistrationById: (id: string) => PlayerRegistration | undefined
  approveRegistration: (id: string, reviewedBy: string) => void
  rejectRegistration: (id: string, reviewedBy: string) => void
  // Tournament registration functions
  applyToTournament: (registrationId: string, tournamentId: string, category: string) => string
  getTournamentRegistrations: (tournamentId: string) => TournamentRegistration[]
  approveTournamentRegistration: (id: string, reviewedBy: string) => void
  rejectTournamentRegistration: (id: string, reviewedBy: string, notes?: string) => void
}

const RegistrationsContext = createContext<RegistrationsContextType | undefined>(undefined)

const STORAGE_KEY = 'stfi.registrations.v1'
const TOURNAMENT_REGISTRATIONS_KEY = 'stfi.tournamentRegistrations.v1'

function loadFromStorage(): PlayerRegistration[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as PlayerRegistration[]
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

function saveToStorage(registrations: PlayerRegistration[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(registrations))
}

function loadTournamentRegistrations(): TournamentRegistration[] {
  try {
    const raw = window.localStorage.getItem(TOURNAMENT_REGISTRATIONS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as TournamentRegistration[]
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

function saveTournamentRegistrations(registrations: TournamentRegistration[]) {
  window.localStorage.setItem(TOURNAMENT_REGISTRATIONS_KEY, JSON.stringify(registrations))
}

export function RegistrationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [registrations, setRegistrations] = useState<PlayerRegistration[]>(loadFromStorage)
  const [tournamentRegistrations, setTournamentRegistrations] = useState<TournamentRegistration[]>(
    loadTournamentRegistrations,
  )

  useEffect(() => {
    saveToStorage(registrations)
  }, [registrations])

  useEffect(() => {
    saveTournamentRegistrations(tournamentRegistrations)
  }, [tournamentRegistrations])

  const refreshFromBackend = async () => {
    if (user?.role !== 'admin') return

    try {
      const [players, coaches, referees] = await Promise.all([
        apiRequest<{ registrations: any[] }>('/players', { auth: true }),
        apiRequest<{ registrations: any[] }>('/coaches', { auth: true }),
        apiRequest<{ registrations: any[] }>('/referees', { auth: true }),
      ])

      const normalize = (r: any): PlayerRegistration => ({
        id: String(r._id || r.id),
        playerId: r.playerId,
        coachId: r.coachId,
        refereeId: r.refereeId,
        type: r.type as 'player' | 'coach' | 'referee',
        profilePhoto: r.profilePhoto || null,
        fullName: r.fullName || '',
        fatherName: r.fatherName || '',
        motherName: r.motherName || '',
        phone: r.phone || '',
        dateOfBirth: r.dateOfBirth || '',
        aadhaarNumber: r.aadhaarNumber || '',
        email: r.email || '',
        password: '',
        district: r.district || '',
        certificates: Array.isArray(r.certificates) ? r.certificates : [],
        status: (r.status || 'pending') as RegistrationStatus,
        submittedAt: r.submittedAt ? new Date(r.submittedAt).toISOString() : new Date().toISOString(),
        reviewedAt: r.reviewedAt ? new Date(r.reviewedAt).toISOString() : undefined,
        reviewedBy: r.reviewedBy || undefined,
        category: r.category || undefined,
        gender: r.gender || undefined,
        aadhaarDocument: r.aadhaarDocument || undefined,
        passportNumber: r.passportNumber || undefined,
        passportExpiryDate: r.passportExpiryDate || undefined,
        passportIssuedPlace: r.passportIssuedPlace || undefined,
        passportDocument: r.passportDocument || undefined,
        tShirtSize: r.tShirtSize || undefined,
        trackSuitSize: r.trackSuitSize || undefined,
        shoesSize: r.shoesSize || undefined,
        pantSize: r.pantSize || undefined,
        districtGames: r.districtGames || undefined,
        stateGames: r.stateGames || undefined,
        nationalGames: r.nationalGames || undefined,
        internationalGames: r.internationalGames || undefined,
      })

      const combined = [
        ...players.registrations.map(normalize),
        ...coaches.registrations.map(normalize),
        ...referees.registrations.map(normalize),
      ].sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''))

      setRegistrations(combined)
    } catch {
      // Keep localStorage registrations as fallback
    }
  }

  useEffect(() => {
    void refreshFromBackend()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role])

  const addRegistration = (registrationData: Omit<PlayerRegistration, 'id' | 'submittedAt' | 'status'>): string => {
    const newRegistration: PlayerRegistration = {
      ...registrationData,
      id: `reg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      submittedAt: new Date().toISOString(),
      status: 'pending',
    }
    setRegistrations([...registrations, newRegistration])
    return newRegistration.id
  }

  const deleteRegistration = (id: string) => {
    const reg = registrations.find((r) => r.id === id)
    if (!reg || (reg.type !== 'player' && reg.type !== 'coach' && reg.type !== 'referee') || user?.role !== 'admin') {
      setRegistrations(registrations.filter((r) => r.id !== id))
      return
    }

    const path = reg.type === 'player' ? `/players/${id}` : reg.type === 'coach' ? `/coaches/${id}` : `/referees/${id}`
    void apiRequest(path, {
      method: 'DELETE',
      auth: true,
    }).then(() => {
      setRegistrations(registrations.filter((r) => r.id !== id))
      void refreshFromBackend()
    })
  }

  const updateRegistration = (id: string, updates: Partial<PlayerRegistration>) => {
    const reg = registrations.find((r) => r.id === id)
    if (!reg || (reg.type !== 'player' && reg.type !== 'coach' && reg.type !== 'referee') || user?.role !== 'admin') {
      setRegistrations(registrations.map((r) => (r.id === id ? { ...r, ...updates } : r)))
      return
    }

    const path = reg.type === 'player' ? `/players/${id}` : reg.type === 'coach' ? `/coaches/${id}` : `/referees/${id}`
    void apiRequest(path, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(updates),
    }).then(() => {
      void refreshFromBackend()
    })
  }

  const getRegistrationById = (id: string) => {
    return registrations.find((r) => r.id === id)
  }

  const approveRegistration = (id: string, reviewedBy: string) => {
    const reg = registrations.find((r) => r.id === id)
    if (!reg || (reg.type !== 'player' && reg.type !== 'coach') || user?.role !== 'admin') {
      updateRegistration(id, {
        status: 'approved',
        reviewedAt: new Date().toISOString(),
        reviewedBy,
      })
      return
    }

    const path = reg.type === 'player' ? `/players/${id}/status` : `/coaches/${id}/status`
    void apiRequest(path, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ status: 'approved', reviewedBy }),
    }).then(refreshFromBackend)
  }

  const rejectRegistration = (id: string, reviewedBy: string) => {
    const reg = registrations.find((r) => r.id === id)
    if (!reg || (reg.type !== 'player' && reg.type !== 'coach') || user?.role !== 'admin') {
      updateRegistration(id, {
        status: 'rejected',
        reviewedAt: new Date().toISOString(),
        reviewedBy,
      })
      return
    }

    const path = reg.type === 'player' ? `/players/${id}/status` : `/coaches/${id}/status`
    void apiRequest(path, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ status: 'rejected', reviewedBy }),
    }).then(refreshFromBackend)
  }

  const applyToTournament = (registrationId: string, tournamentId: string, category: string): string => {
    const newTournamentRegistration: TournamentRegistration = {
      id: `tournament-reg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      tournamentId,
      registrationId,
      category,
      status: 'pending',
      appliedAt: new Date().toISOString(),
    }
    setTournamentRegistrations([...tournamentRegistrations, newTournamentRegistration])
    return newTournamentRegistration.id
  }

  const getTournamentRegistrations = (tournamentId: string): TournamentRegistration[] => {
    return tournamentRegistrations.filter((tr) => tr.tournamentId === tournamentId)
  }

  const approveTournamentRegistration = (id: string, reviewedBy: string) => {
    setTournamentRegistrations(
      tournamentRegistrations.map((tr) =>
        tr.id === id
          ? {
            ...tr,
            status: 'approved',
            reviewedAt: new Date().toISOString(),
            reviewedBy,
          }
          : tr,
      ),
    )
  }

  const rejectTournamentRegistration = (id: string, reviewedBy: string, notes?: string) => {
    setTournamentRegistrations(
      tournamentRegistrations.map((tr) =>
        tr.id === id
          ? {
            ...tr,
            status: 'rejected',
            reviewedAt: new Date().toISOString(),
            reviewedBy,
            notes,
          }
          : tr,
      ),
    )
  }

  return (
    <RegistrationsContext.Provider
      value={{
        registrations,
        tournamentRegistrations,
        addRegistration,
        updateRegistration,
        deleteRegistration,
        getRegistrationById,
        approveRegistration,
        rejectRegistration,
        applyToTournament,
        getTournamentRegistrations,
        approveTournamentRegistration,
        rejectTournamentRegistration,
      }}
    >
      {children}
    </RegistrationsContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRegistrations() {
  const context = useContext(RegistrationsContext)
  if (context === undefined) {
    throw new Error('useRegistrations must be used within a RegistrationsProvider')
  }
  return context
}
