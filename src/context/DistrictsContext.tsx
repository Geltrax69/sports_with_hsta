import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { apiRequest } from '../lib/api'
import { useAuth } from './AuthContext'

export type District = {
  id: string
  code?: string
  name: string
  zone: string
  secretary?: {
    name: string
    email: string
    phone: string
    since?: string
  }
  contact?: {
    phone: string
    email: string
  }
  stats?: {
    clubs: number
    players: number
  }
  status: 'active' | 'pending' | 'inactive'
  createdAt: string
}

type DistrictsContextType = {
  districts: District[]
  addDistrict: (district: Omit<District, 'id' | 'createdAt'>) => Promise<void>
  updateDistrict: (id: string, updates: Partial<District>) => Promise<void>
  deleteDistrict: (id: string) => Promise<void>
  getDistrictById: (id: string) => District | undefined
}

const DistrictsContext = createContext<DistrictsContextType | undefined>(undefined)

const STORAGE_KEY = 'stfi.districts.v1'

// Default districts
const DEFAULT_DISTRICTS: District[] = [
  {
    id: 'DIS-001',
    code: 'DIS-001',
    name: 'Bangalore Urban',
    zone: 'South Zone',
    secretary: {
      name: 'Ramesh Gupta',
      email: 'ramesh.g@stfi.org',
      phone: '+91 98765 43210',
      since: '2021',
    },
    contact: {
      phone: '+91 98765 43210',
      email: 'ramesh.g@stfi.org',
    },
    stats: {
      clubs: 12,
      players: 84,
    },
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'DIS-002',
    code: 'DIS-002',
    name: 'Mysore District',
    zone: 'South Zone',
    secretary: {
      name: 'Anand Kumar',
      email: 'anand.k@stfi.org',
      phone: '+91 91234 56789',
      since: '2023',
    },
    contact: {
      phone: '+91 91234 56789',
      email: 'anand.k@stfi.org',
    },
    stats: {
      clubs: 8,
      players: 56,
    },
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'DIS-003',
    code: 'DIS-003',
    name: 'Udupi District',
    zone: 'Coastal Zone',
    secretary: {
      name: 'Sneha P.',
      email: 'sneha.p@email.com',
      phone: '+91 99887 76655',
    },
    contact: {
      phone: '+91 99887 76655',
      email: 'sneha.p@email.com',
    },
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'DIS-004',
    code: 'DIS-004',
    name: 'Hubli-Dharwad',
    zone: 'North Zone',
    secretary: {
      name: 'Vikram Singh',
      email: 'vikram.s@stfi.org',
      phone: '+91 88776 65544',
      since: '2020',
    },
    contact: {
      phone: '+91 88776 65544',
      email: 'vikram.s@stfi.org',
    },
    stats: {
      clubs: 15,
      players: 102,
    },
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'DIS-005',
    code: 'DIS-005',
    name: 'Bellary District',
    zone: 'Central Zone',
    stats: {
      clubs: 2,
      players: 14,
    },
    status: 'inactive',
    createdAt: new Date().toISOString(),
  },
]

function loadFromStorage(): District[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_DISTRICTS
    const parsed = JSON.parse(raw) as District[]
    if (!Array.isArray(parsed)) return DEFAULT_DISTRICTS
    return parsed.map((d) => ({ ...d, id: (d.id || d.code || '').toString().trim().toUpperCase() }))
  } catch {
    return DEFAULT_DISTRICTS
  }
}

function saveToStorage(districts: District[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(districts))
}

type ApiDistrict = {
  code: string
  name: string
  zone: string
  status: 'active' | 'pending' | 'inactive'
  secretary?: {
    name?: string
    email?: string
    phone?: string
    since?: string
  }
  contact?: {
    phone?: string
    email?: string
  }
  stats?: {
    clubs?: number
    players?: number
  }
  createdAt?: string
}

const mapApiDistrict = (d: ApiDistrict): District => {
  const code = (d.code || (d as any)._id || '').toString().trim().toUpperCase()
  return {
    id: code,
    code,
    name: d.name,
    zone: d.zone,
    status: d.status,
    secretary: d.secretary
      ? {
          name: d.secretary.name || '',
          email: d.secretary.email || '',
          phone: d.secretary.phone || '',
          since: d.secretary.since || undefined,
        }
      : undefined,
    contact: d.contact
      ? {
          phone: d.contact.phone || '',
          email: d.contact.email || '',
        }
      : undefined,
    stats:
      d.stats && (d.stats.clubs !== undefined || d.stats.players !== undefined)
        ? {
            clubs: Number(d.stats.clubs || 0),
            players: Number(d.stats.players || 0),
          }
        : undefined,
    createdAt: d.createdAt || new Date().toISOString(),
  }
}

export function DistrictsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  // Start empty; we'll hydrate from API. Public pages will fall back to cached data if API fails.
  const [districts, setDistricts] = useState<District[]>([])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        // Admin panel needs all districts (incl. pending/inactive) with contact/secretary fields.
        if (user?.role === 'admin') {
          const data = await apiRequest<{ districts: ApiDistrict[] }>('/admin/districts', { auth: true })
          const mapped = data.districts.map(mapApiDistrict)
          if (!cancelled) setDistricts(mapped)
          return
        }

        // Public pages (registration) only need active districts.
        const data = await apiRequest<{ districts: ApiDistrict[] }>('/districts')
        const mapped = data.districts.map(mapApiDistrict)
        if (!cancelled) setDistricts(mapped)
      } catch {
        // Keep local cached/mock data as fallback for non-admin flows only.
        if (cancelled) return
        if (user?.role === 'admin') {
          setDistricts([])
        } else {
          setDistricts(loadFromStorage())
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [user?.role])

  useEffect(() => {
    // Cache for public pages only; admin data should always mirror API responses.
    if (user?.role !== 'admin') {
      saveToStorage(districts)
    }
  }, [districts, user?.role])

  const addDistrict = async (districtData: Omit<District, 'id' | 'createdAt'>) => {
    if (user?.role !== 'admin') {
      throw new Error('Not authorized')
    }

    try {
      const payload = {
        name: districtData.name,
        zone: districtData.zone,
        status: districtData.status,
        secretary: districtData.secretary,
        contact: districtData.contact,
        stats: districtData.stats,
      }

      const data = await apiRequest<{ district: ApiDistrict }>('/admin/districts', {
        method: 'POST',
        auth: true,
        body: JSON.stringify(payload),
      })

      setDistricts((prev) => [mapApiDistrict(data.district), ...prev])
    } catch (err) {
      console.error('Failed to add district', err)
      throw err
    }
  }

  const updateDistrict = async (id: string, updates: Partial<District>) => {
    if (user?.role !== 'admin') {
      throw new Error('Not authorized')
    }

    try {
      const targetCode = (id || updates.code || '').trim().toUpperCase()
      if (!targetCode) {
        throw new Error('District identifier is missing')
      }

      const payload: any = {}
      if (updates.name !== undefined) payload.name = updates.name
      if (updates.zone !== undefined) payload.zone = updates.zone
      if (updates.status !== undefined) payload.status = updates.status
      if (updates.secretary !== undefined) payload.secretary = updates.secretary
      if (updates.contact !== undefined) payload.contact = updates.contact
      if (updates.stats !== undefined) payload.stats = updates.stats

      const data = await apiRequest<{ district: ApiDistrict }>(`/admin/districts/${encodeURIComponent(targetCode)}`, {
        method: 'PATCH',
        auth: true,
        body: JSON.stringify(payload),
      })

      setDistricts((prev) =>
        prev.map((d) => ((d.id || d.code || '').toUpperCase() === targetCode ? mapApiDistrict(data.district) : d)),
      )
    } catch (err) {
      console.error('Failed to update district', err)
      throw err
    }
  }

  const deleteDistrict = async (id: string) => {
    if (user?.role !== 'admin') {
      throw new Error('Not authorized')
    }

    try {
      const targetCode = (id || '').trim().toUpperCase()
      if (!targetCode) {
        throw new Error('District identifier is missing')
      }

      await apiRequest<void>(`/admin/districts/${encodeURIComponent(targetCode)}`, { method: 'DELETE', auth: true })
      setDistricts((prev) => prev.filter((d) => (d.id || d.code || '').toUpperCase() !== targetCode))
    } catch (err) {
      console.error('Failed to delete district', err)
      throw err
    }
  }

  const getDistrictById = (id: string) => {
    return districts.find((d) => d.id === id)
  }

  return (
    <DistrictsContext.Provider
      value={{
        districts,
        addDistrict,
        updateDistrict,
        deleteDistrict,
        getDistrictById,
      }}
    >
      {children}
    </DistrictsContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDistricts() {
  const context = useContext(DistrictsContext)
  if (context === undefined) {
    throw new Error('useDistricts must be used within a DistrictsProvider')
  }
  return context
}
