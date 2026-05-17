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

export type CustomPagePerson = {
  name: string
  post: string
  imageUrl: string
}

export type CustomPageSection = {
  heading: string
  people: CustomPagePerson[]
}

export type NationalTeamPlayer = {
  id?: string
  name: string
  imageUrl: string
}

export type NationalTeamBlock = {
  id?: string
  title: string
  players: NationalTeamPlayer[]
}

export type NationalTeamCategory = {
  title: string
  blocks: NationalTeamBlock[]
}

const normalizeNationalTeamBlock = (block: Partial<NationalTeamBlock>): NationalTeamBlock => ({
  id: block.id,
  title: block.title || '',
  players: Array.isArray(block.players)
    ? block.players.map((player) => ({
        id: player.id,
        name: player.name || '',
        imageUrl: player.imageUrl || '',
      }))
    : [],
})

const normalizeNationalTeamCategory = (category?: Partial<NationalTeamCategory> & { players?: NationalTeamPlayer[] }): NationalTeamCategory => {
  const blocks = Array.isArray(category?.blocks) && category.blocks.length > 0
    ? category.blocks
    : (Array.isArray(category?.players) ? [{ title: '', players: category.players }] : [])

  return {
    title: category?.title || '',
    blocks: blocks.map((block) => normalizeNationalTeamBlock(block)),
  }
}

export type NationalTeamPageSettings = {
  mensTeam: NationalTeamCategory
  juniorMensTeam: NationalTeamCategory
  womensTeam: NationalTeamCategory
  juniorWomensTeam: NationalTeamCategory
}

export type CustomPageTable = {
  headers: string[]
  rows: string[][]
}

export type CustomPage = {
  id: string
  title: string
  slug: string
  pageType?: 'content' | 'table' | 'people' | 'document'
  content: string
  tableData?: CustomPageTable
  peopleSections?: CustomPageSection[]
  documents?: DocumentLink[]
  createdAt?: string
}

export type RtiExecutiveBoard = {
  id?: string
  role: string
  number: string
}

export type DocumentLink = {
  id?: string
  title: string
  fileUrl: string
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
  permanentMembersHeading?: string
  associateMembers?: MemberUnit[]
  associateMembersHeading?: string
  academyMembers?: MemberUnit[]
  academyMembersHeading?: string
  hockeyMembers?: MemberUnit[]
  hockeyMembersHeading?: string
  rtiExecutiveBoard?: RtiExecutiveBoard[]
  rtiOfficers?: RtiOfficer[]
  customPages?: CustomPage[]
  accounts?: DocumentLink[]
  agmMeetings?: DocumentLink[]
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
  nationalTeamPage: NationalTeamPageSettings
}

type WebsiteContentContextType = {
  content: WebsiteContent
  updateHomepage: (updates: Partial<HomepageSettings>) => void
  updateAboutPage: (updates: Partial<AboutPageSettings>) => void
  updateEventsPage: (updates: Partial<EventsPageSettings>) => void
  updateNationalTeamPage: (updates: Partial<NationalTeamPageSettings>) => void
  addCustomPage: (page: Omit<CustomPage, 'id' | 'createdAt'>) => void
  updateCustomPage: (id: string, updates: Partial<CustomPage>) => void
  removeCustomPage: (id: string) => void
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
    customPages: [],
  },
  eventsPage: {
    featuredEventIds: [],
  },
  nationalTeamPage: {
    mensTeam: { title: "Men's Team", blocks: [] },
    juniorMensTeam: { title: "Junior Men's Team", blocks: [] },
    womensTeam: { title: "Women's Team", blocks: [] },
    juniorWomensTeam: { title: "Junior Women's Team", blocks: [] },
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
      nationalTeamPage: {
        mensTeam: normalizeNationalTeamCategory({
          ...DEFAULT_WEBSITE_CONTENT.nationalTeamPage.mensTeam,
          ...(data.nationalTeamPage?.mensTeam || {}),
        }),
        juniorMensTeam: normalizeNationalTeamCategory({
          ...DEFAULT_WEBSITE_CONTENT.nationalTeamPage.juniorMensTeam,
          ...(data.nationalTeamPage?.juniorMensTeam || {}),
        }),
        womensTeam: normalizeNationalTeamCategory({
          ...DEFAULT_WEBSITE_CONTENT.nationalTeamPage.womensTeam,
          ...(data.nationalTeamPage?.womensTeam || {}),
        }),
        juniorWomensTeam: normalizeNationalTeamCategory({
          ...DEFAULT_WEBSITE_CONTENT.nationalTeamPage.juniorWomensTeam,
          ...(data.nationalTeamPage?.juniorWomensTeam || {}),
        }),
      },
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

  const updateNationalTeamPage = async (updates: Partial<NationalTeamPageSettings>) => {
    const newContent = {
      ...content,
      nationalTeamPage: { ...content.nationalTeamPage, ...updates },
    }
    setContent(newContent)
    try {
      await updateContentOnServer('/national-team', updates)
    } catch (error) {
      setContent(content)
    }
  }

  const addCustomPage = async (page: Omit<CustomPage, 'id' | 'createdAt'>) => {
    try {
      await updateContentOnServer('/custom-pages', page, 'POST')
      const updatedContent = await fetchWebsiteContent()
      setContent(updatedContent)
    } catch (error) {
      console.error('Failed to add custom page:', error)
      // fallback for local testing
      const newPage = { ...page, id: Date.now().toString(), createdAt: new Date().toISOString() }
      setContent({
        ...content,
        aboutPage: {
          ...content.aboutPage,
          customPages: [...(content.aboutPage.customPages || []), newPage]
        }
      })
    }
  }

  const updateCustomPage = async (id: string, updates: Partial<CustomPage>) => {
    setContent({
      ...content,
      aboutPage: {
        ...content.aboutPage,
        customPages: content.aboutPage.customPages?.map(p => p.id === id ? { ...p, ...updates } : p) || []
      }
    })
    try {
      const token = getAuthToken()
      await fetch(`${API_BASE_URL}/website-content/custom-pages/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(updates),
      })
    } catch (error) {
      console.error('Failed to update custom page:', error)
      // Since it's a mock API sometimes, we just keep the optimistic update
    }
  }

  const removeCustomPage = async (id: string) => {
    setContent({
      ...content,
      aboutPage: {
        ...content.aboutPage,
        customPages: content.aboutPage.customPages?.filter(p => p.id !== id) || []
      }
    })
    try {
      const token = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/website-content/custom-pages/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
      if (!response.ok) {
        throw new Error('Failed to delete custom page')
      }
    } catch (error) {
      console.error('Failed to delete custom page:', error)
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
        updateNationalTeamPage,
        addCustomPage,
        updateCustomPage,
        removeCustomPage,
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
