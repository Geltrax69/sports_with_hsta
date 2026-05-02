import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { API_BASE_URL, getAuthToken } from '../lib/api'

export type GalleryImage = {
  id: string
  imageUrl: string
  title?: string
  description?: string
  order: number
  createdAt: string
}

export type JourneyItem = {
  id: string
  year: string
  title: string
  description: string
  imageUrl?: string
  order: number
}

export type OfficeBearer = {
  role: string
  name: string
  email: string
  mobile: string
  tenure: string
  address: string
}

export type ExecutiveBoardMember = {
  id?: string
  name: string
  post: string
  imageUrl: string
  order?: number
}

export type OtherBoardMemberPosition = {
  id?: string
  position: string
  number: string
  details?: string
}

export type PastOfficeBearer = {
  id?: string
  slNo: string
  tenure: string
  president: string
  secretaryGeneral: string
  treasurer: string
}

export type MemberUnit = {
  id?: string
  slNo: string
  unit: string
  president: string
  secretary: string
}

export type RtiExecutiveBoard = {
  id?: string
  role: string
  number: string
}

export type RtiOfficer = {
  id?: string
  name: string
  designation: string
}

export type Official = {
  id: string
  name: string
  title: string
  role?: string
  region?: string
  email?: string
  phone?: string
  photoUrl?: string
  order: number
  createdAt?: string
  updatedAt?: string
}

export type HomepageSettings = {
  featuredNewsIds: string[] // IDs of news items to show on homepage
  featuredTournamentIds: string[] // IDs of tournaments to show on homepage
  galleryImages: GalleryImage[]
  heroTitle?: string
  heroDescription?: string
  heroImageUrl?: string
}

export type AboutPageSettings = {
  journeyItems: JourneyItem[]
  mission?: string
  vision?: string
  aboutText?: string
  executiveBoardText?: string
  memberUnitText?: string
  rtiText?: string
  annualReportText?: string
  electionReportText?: string
  officials?: Official[]
  officeBearers?: OfficeBearer[]
  executiveBoardMembers?: ExecutiveBoardMember[]
  otherBoardMemberPositions?: OtherBoardMemberPosition[]
  pastOfficeBearers?: PastOfficeBearer[]
  permanentMembers?: MemberUnit[]
  associateMembers?: MemberUnit[]
  academyMembers?: MemberUnit[]
  hockeyMembers?: MemberUnit[]
  rtiExecutiveBoard?: RtiExecutiveBoard[]
  rtiOfficers?: RtiOfficer[]
}

export type EventsPageSettings = {
  featuredEventIds: string[]
  calendarSettings?: {
    showPastEvents: boolean
    defaultView: 'month' | 'week' | 'day'
  }
}

export type WebsiteContent = {
  homepage: HomepageSettings
  aboutPage: AboutPageSettings
  eventsPage: EventsPageSettings
}

type WebsiteContentContextType = {
  content: WebsiteContent
  updateHomepage: (updates: Partial<HomepageSettings>) => void
  updateAboutPage: (updates: Partial<AboutPageSettings>) => void
  updateEventsPage: (updates: Partial<EventsPageSettings>) => void
  addGalleryImage: (image: Omit<GalleryImage, 'id' | 'createdAt' | 'order'>) => void
  removeGalleryImage: (id: string) => void
  updateGalleryImageOrder: (id: string, newOrder: number) => void
  addJourneyItem: (item: Omit<JourneyItem, 'id' | 'order'>) => void
  updateJourneyItem: (id: string, updates: Partial<JourneyItem>) => void
  removeJourneyItem: (id: string) => void
  updateJourneyItemOrder: (id: string, newOrder: number) => void
  addOfficial: (official: Omit<Official, 'id' | 'order' | 'createdAt' | 'updatedAt'>) => void
  updateOfficial: (id: string, updates: Partial<Official>) => void
  removeOfficial: (id: string) => void
  updateOfficialOrder: (id: string, newOrder: number) => void
}

const WebsiteContentContext = createContext<WebsiteContentContextType | undefined>(undefined)

const DEFAULT_WEBSITE_CONTENT: WebsiteContent = {
  homepage: {
    featuredNewsIds: [],
    featuredTournamentIds: [],
    galleryImages: [],
  },
  aboutPage: {
    journeyItems: [],
    officials: [],
  },
  eventsPage: {
    featuredEventIds: [],
  },
}

async function fetchWebsiteContent(): Promise<WebsiteContent> {
  try {
    const response = await fetch(`${API_BASE_URL}/website-content`)
    if (!response.ok) {
      throw new Error('Failed to fetch website content')
    }
    const data = await response.json()
    return {
      homepage: { ...DEFAULT_WEBSITE_CONTENT.homepage, ...data.homepage },
      aboutPage: { ...DEFAULT_WEBSITE_CONTENT.aboutPage, ...data.aboutPage },
      eventsPage: { ...DEFAULT_WEBSITE_CONTENT.eventsPage, ...data.eventsPage },
    }
  } catch (error) {
    console.error('Error fetching website content:', error)
    return DEFAULT_WEBSITE_CONTENT
  }
}

async function updateContentOnServer(endpoint: string, data: unknown, method: 'POST' | 'PATCH' | 'PUT' = 'PATCH'): Promise<void> {
  const token = getAuthToken()
  try {
    const response = await fetch(`${API_BASE_URL}/website-content${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      throw new Error('Failed to update website content')
    }
  } catch (error) {
    console.error('Error updating website content:', error)
    throw error
  }
}

export function WebsiteContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<WebsiteContent>(DEFAULT_WEBSITE_CONTENT)

  useEffect(() => {
    fetchWebsiteContent().then((data) => {
      setContent(data)
    })
  }, [])

  const updateHomepage = async (updates: Partial<HomepageSettings>) => {
    const newContent = {
      ...content,
      homepage: { ...content.homepage, ...updates },
    }
    setContent(newContent)
    try {
      await updateContentOnServer('/homepage', updates)
    } catch (error) {
      // Revert on error
      setContent(content)
    }
  }

  const updateAboutPage = async (updates: Partial<AboutPageSettings>) => {
    const newContent = {
      ...content,
      aboutPage: { ...content.aboutPage, ...updates },
    }
    setContent(newContent)
    try {
      await updateContentOnServer('/about', updates)
    } catch (error) {
      // Revert on error
      setContent(content)
    }
  }

  const updateEventsPage = async (updates: Partial<EventsPageSettings>) => {
    const newContent = {
      ...content,
      eventsPage: { ...content.eventsPage, ...updates },
    }
    setContent(newContent)
    try {
      await updateContentOnServer('/events', updates)
    } catch (error) {
      // Revert on error
      setContent(content)
    }
  }

  const addGalleryImage = async (image: Omit<GalleryImage, 'id' | 'createdAt' | 'order'>) => {
    try {
      await updateContentOnServer('/gallery', image, 'POST')
      // Refetch to get the updated data with the new ID
      const updatedContent = await fetchWebsiteContent()
      setContent(updatedContent)
    } catch (error) {
      console.error('Failed to add gallery image:', error)
    }
  }

  const removeGalleryImage = async (id: string) => {
    const oldContent = content
    setContent({
      ...content,
      homepage: {
        ...content.homepage,
        galleryImages: content.homepage.galleryImages.filter((img) => img.id !== id),
      },
    })
    try {
      const token = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/website-content/gallery/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
      if (!response.ok) {
        throw new Error('Failed to delete gallery image')
      }
    } catch (error) {
      console.error('Failed to delete gallery image:', error)
      setContent(oldContent)
    }
  }

  const updateGalleryImageOrder = async (id: string, newOrder: number) => {
    try {
      await updateContentOnServer(`/gallery/${id}/order`, { newOrder })
      const updatedContent = await fetchWebsiteContent()
      setContent(updatedContent)
    } catch (error) {
      console.error('Failed to update gallery image order:', error)
    }
  }

  const addJourneyItem = async (item: Omit<JourneyItem, 'id' | 'order'>) => {
    try {
      await updateContentOnServer('/journey', item, 'POST')
      const updatedContent = await fetchWebsiteContent()
      setContent(updatedContent)
    } catch (error) {
      console.error('Failed to add journey item:', error)
    }
  }

  const updateJourneyItem = async (id: string, updates: Partial<JourneyItem>) => {
    const oldContent = content
    setContent({
      ...content,
      aboutPage: {
        ...content.aboutPage,
        journeyItems: content.aboutPage.journeyItems.map((item) =>
          item.id === id ? { ...item, ...updates } : item,
        ),
      },
    })
    try {
      const token = getAuthToken()
      await fetch(`${API_BASE_URL}/website-content/journey/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(updates),
      })
    } catch (error) {
      setContent(oldContent)
    }
  }

  const removeJourneyItem = async (id: string) => {
    const oldContent = content
    setContent({
      ...content,
      aboutPage: {
        ...content.aboutPage,
        journeyItems: content.aboutPage.journeyItems.filter((item) => item.id !== id),
      },
    })
    try {
      const token = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/website-content/journey/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
      if (!response.ok) {
        throw new Error('Failed to delete journey item')
      }
    } catch (error) {
      console.error('Failed to delete journey item:', error)
      setContent(oldContent)
    }
  }

  const updateJourneyItemOrder = async (id: string, newOrder: number) => {
    try {
      await updateContentOnServer(`/journey/${id}/order`, { newOrder })
      const updatedContent = await fetchWebsiteContent()
      setContent(updatedContent)
    } catch (error) {
      console.error('Failed to update journey item order:', error)
    }
  }

  const addOfficial = async (official: Omit<Official, 'id' | 'order' | 'createdAt' | 'updatedAt'>) => {
    try {
      await updateContentOnServer('/officials', official, 'POST')
      const updatedContent = await fetchWebsiteContent()
      setContent(updatedContent)
    } catch (error) {
      console.error('Failed to add official:', error)
    }
  }

  const updateOfficial = async (id: string, updates: Partial<Official>) => {
    const oldContent = content
    setContent({
      ...content,
      aboutPage: {
        ...content.aboutPage,
        officials: content.aboutPage.officials?.map((official) =>
          official.id === id ? { ...official, ...updates } : official,
        ),
      },
    })
    try {
      const token = getAuthToken()
      await fetch(`${API_BASE_URL}/website-content/officials/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(updates),
      })
    } catch (error) {
      setContent(oldContent)
    }
  }

  const removeOfficial = async (id: string) => {
    const oldContent = content
    setContent({
      ...content,
      aboutPage: {
        ...content.aboutPage,
        officials: content.aboutPage.officials?.filter((official) => official.id !== id),
      },
    })
    try {
      const token = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/website-content/officials/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
      if (!response.ok) {
        throw new Error('Failed to delete official')
      }
    } catch (error) {
      console.error('Failed to delete official:', error)
      setContent(oldContent)
    }
  }

  const updateOfficialOrder = async (id: string, newOrder: number) => {
    try {
      await updateContentOnServer(`/officials/${id}/order`, { newOrder })
      const updatedContent = await fetchWebsiteContent()
      setContent(updatedContent)
    } catch (error) {
      console.error('Failed to update official order:', error)
    }
  }

  return (
    <WebsiteContentContext.Provider
      value={{
        content,
        updateHomepage,
        updateAboutPage,
        updateEventsPage,
        addGalleryImage,
        removeGalleryImage,
        updateGalleryImageOrder,
        addJourneyItem,
        updateJourneyItem,
        removeJourneyItem,
        updateJourneyItemOrder,
        addOfficial,
        updateOfficial,
        removeOfficial,
        updateOfficialOrder,
      }}
    >
      {children}
    </WebsiteContentContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWebsiteContent() {
  const context = useContext(WebsiteContentContext)
  if (context === undefined) {
    throw new Error('useWebsiteContent must be used within a WebsiteContentProvider')
  }
  return context
}
