import { useMemo, useState, useEffect } from 'react'
import { useSiteContent } from '../content/SiteContentContext'
import { useWebsiteContent } from '../context/WebsiteContentContext'
import { FeaturedGallery } from '../components/FeaturedGallery'
import { apiRequest } from '../lib/api'
import { resolveImageUrl } from '../lib/images'
import { getRelativeDate } from '../lib/dateUtils'
import { Skeleton } from 'boneyard-js/react'
import { LiveScoresCard } from '../components/LiveScoresCard'
import { fetchLiveMatches, type LiveMatch } from '../lib/liveScores'
import { isTournamentUpcoming } from '../lib/tournamentDates'

export function HomePage() {
  const { content } = useSiteContent()
  const { content: websiteContent, contentLoading } = useWebsiteContent()
  const [apiTournaments, setApiTournaments] = useState<any[]>([])
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([])
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({})
  const [resolvedNewsImages, setResolvedNewsImages] = useState<Record<string, string>>({})

  // Fetch tournaments from API
  useEffect(() => {
    const run = async () => {
      try {
        console.log('[HomePage] Fetching tournaments from API...')
        const r = await apiRequest<{ tournaments: any[] }>('/tournaments')
        console.log('[HomePage] API Response received:', r)
        setApiTournaments(Array.isArray(r.tournaments) ? r.tournaments : [])
      } catch (e) {
        console.error('[HomePage] Error fetching tournaments:', e)
        setApiTournaments([])
      }
    }
    void run()
  }, [])

  useEffect(() => {
    const loadLive = async () => {
      try {
        const data = await fetchLiveMatches()
        setLiveMatches(data)
      } catch {
        setLiveMatches([])
      }
    }
    void loadLive()
    const id = window.setInterval(() => void loadLive(), 15000)
    return () => window.clearInterval(id)
  }, [])

  // Get featured news from website content settings, or fallback to featured/pinned news
  const featuredNews = useMemo(() => {
    if (websiteContent.homepage.featuredNewsIds.length > 0) {
      return websiteContent.homepage.featuredNewsIds
        .map((id) => content.news.find((n) => n.id === id))
        .filter((n) => n !== undefined)
        .slice(0, 3)
    }
    const newsSorted = [...content.news].sort((a, b) => Number(b.pinned) - Number(a.pinned))
    return [newsSorted.find((n) => n.featured) ?? newsSorted[0], ...newsSorted.filter((n) => !n.featured)].filter(
      (n) => n !== undefined,
    ).slice(0, 3)
  }, [content.news, websiteContent.homepage.featuredNewsIds])

  const featured = featuredNews[0]
  const cards = featuredNews.slice(1, 3)
  const publicHref = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`

  // Resolve news image URLs (for S3 images that need signed URLs)
  useEffect(() => {
    const resolveUrls = async () => {
      const resolved: Record<string, string> = {}
      for (const newsItem of featuredNews) {
        if (newsItem?.imageUrl) {
          const url = await resolveImageUrl(newsItem.imageUrl, false)
          resolved[newsItem.id] = url
        }
      }
      setResolvedNewsImages(resolved)
    }
    void resolveUrls()
  }, [featuredNews])

  // Get featured tournaments from API, fallback to website content settings
  const tournaments = useMemo(() => {
    if (apiTournaments.length > 0) {
      return apiTournaments.filter((t) => isTournamentUpcoming(t))
    }
    if (websiteContent.homepage.featuredTournamentIds.length > 0) {
      return websiteContent.homepage.featuredTournamentIds
        .map((id) => content.tournaments.find((t) => t.id === id))
        .filter((t) => t !== undefined)
    }
    return [...content.tournaments].sort((a, b) => Number(b.pinned) - Number(a.pinned))
  }, [apiTournaments, content.tournaments, websiteContent.homepage.featuredTournamentIds])

  return (
    <Skeleton name="home-page" loading={contentLoading}>
      <main id="page-content" className="w-full overflow-x-hidden relative bg-white">
        {/* Hero Section */}
      <section className="relative w-full min-h-[600px] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          data-alt="Athletic action shot of players in a stadium"
          style={{
            backgroundImage:
              'url("mainteam.jpeg")',
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#5a0a8f]/90 via-[#be185d]/80 to-transparent z-10"></div>
        <div className="relative z-20 max-w-[1280px] w-full px-4 sm:px-6 lg:px-8 py-20 flex flex-col justify-center h-full">
          <div className="max-w-2xl">

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.1] mb-6 tracking-tight animate-entry delay-100">
              Elevating <span className="text-[#fcd34d]">Sepak Takraw</span> <br /> in Haryana
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-8 font-light leading-relaxed max-w-lg animate-entry delay-200">
              Join the movement, support our athletes, and witness the future of the sport. The HSTA is
              committed to excellence and growth.
            </p>
          </div>
        </div>
      </section>

      {/* Statistics Section - Overlapping Hero */}
      <section className="relative -mt-16 z-30 px-4 sm:px-6 lg:px-8 max-w-[1280px] mx-auto">
        <div className="bg-white rounded-xl shadow-xl p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-center gap-4 border-b md:border-b-0 md:border-r border-gray-200 pb-6 md:pb-0 md:pr-8">
            <div className="size-16 flex items-center justify-center">
              <span className="material-symbols-outlined text-5xl text-[#5a0a8f]">groups</span>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-gray-900">1,000+</h3>
              <p className="text-sm text-gray-600 font-medium">Registered Athletes</p>
            </div>
          </div>
          <div className="flex items-center gap-4 border-b md:border-b-0 md:border-r border-gray-200 pb-6 md:pb-0 md:pr-8">
            <div className="size-16 flex items-center justify-center">
              <svg className="w-12 h-12 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-gray-900">13</h3>
              <p className="text-sm text-gray-600 font-medium">Affiliated District</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="size-16 flex items-center justify-center">
              <span className="material-symbols-outlined text-5xl text-red-600">emoji_events</span>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-gray-900">30
                +</h3>
              <p className="text-sm text-gray-600 font-medium">Annual Championships</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Section */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col lg:flex-row gap-12">
        {/* Latest News Column */}
        <div className="w-full lg:w-2/3 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-4xl font-bold text-[#5a0a8f] flex items-center gap-3">
              <span className="w-1 h-12 bg-[#5a0a8f]"></span>
              LATEST NEWS
            </h2>
            <a
              className="text-[#5a0a8f] hover:text-[#5a0a8f]/80 text-sm font-bold flex items-center gap-1"
              href={publicHref('/news')}
            >
              View All News →
            </a>
          </div>

          <div className="flex flex-col gap-6">
            {/* Main Featured News */}
            {featured ? (
              <article className="group cursor-pointer">
                <div className="relative h-96 rounded-xl overflow-hidden">
                  <div className="absolute top-4 left-4 bg-white text-red-600 text-xs font-bold px-3 py-1.5 rounded z-10">
                    {featured.badge}
                  </div>
                  <img
                    src={resolvedNewsImages[featured.id] || featured.imageUrl}
                    alt="Close up of a sports ball and net in a stadium"
                    className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-105 ${loadedImages[featured.id] ? 'blur-0 opacity-100' : 'blur-md opacity-70'
                      }`}
                    onLoad={() => setLoadedImages(prev => ({ ...prev, [featured.id]: true }))}
                    onError={() => {
                      console.error('Failed to load featured news image:', featured.imageUrl)
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 p-8 text-white">
                    <span className="text-sm font-medium opacity-90 mb-3 block">
                      {featured.date ? getRelativeDate(featured.date) : featured.dateText}
                    </span>
                    <h3 className="text-3xl md:text-4xl font-bold leading-tight">
                      {featured.title}
                    </h3>
                  </div>
                </div>
              </article>
            ) : null}

            {/* Sub News Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {cards.map((item) => (
                <article
                  key={item.id}
                  className="flex flex-col gap-4 group cursor-pointer bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all"
                >
                  <div className="h-48 w-full overflow-hidden relative bg-gray-200">
                    <img
                      src={resolvedNewsImages[item.id] || item.imageUrl}
                      alt="Group of athletes training on a field"
                      className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${loadedImages[item.id] ? 'blur-0 opacity-100' : 'blur-md opacity-70'
                        }`}
                      onLoad={() => setLoadedImages(prev => ({ ...prev, [item.id]: true }))}
                      onError={() => {
                        console.error('Failed to load news card image:', item.imageUrl)
                      }}
                    />
                  </div>
                  <div className="flex flex-col flex-1 p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`${item.badge === 'TRIALS' ? 'bg-[#5a0a8f]' : 'bg-red-600'} text-white text-[10px] font-bold px-2.5 py-1 rounded`}>
                        {item.badge}
                      </span>
                      <span className="text-xs text-gray-500">
                        {item.date ? getRelativeDate(item.date) : item.dateText}
                      </span>
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2 leading-snug group-hover:text-[#5a0a8f] transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-sm text-gray-600 line-clamp-2">{item.excerpt}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar: Live Scores + Event Calendar */}
        <div className="w-full lg:w-1/3 flex flex-col gap-5">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-[#5a0a8f] text-white px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black">Live Scores</h3>
                <p className="text-xs text-white/80">Matches in progress</p>
              </div>
              <span className="material-symbols-outlined text-3xl text-white/40">sports_score</span>
            </div>
            <div className="p-4 space-y-3 max-h-[320px] overflow-y-auto">
              {liveMatches.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">No live matches right now.</p>
              ) : (
                liveMatches.slice(0, 2).map((m) => <LiveScoresCard key={m.id} match={m} compact />)
              )}
            </div>
            {liveMatches.length > 0 && (
              <div className="px-4 pb-4">
                <a
                  href={publicHref('/live-scores')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center py-2.5 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors"
                >
                  {liveMatches.length > 2 ? `View all ${liveMatches.length} live matches` : 'View live scores'}
                </a>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden flex flex-col">
            <div className="bg-[#5a0a8f] text-white px-5 py-4">
              <h3 className="text-lg font-bold mb-0.5">Event Calendar</h3>
              <p className="text-xs text-white/80">Upcoming tournaments</p>
            </div>

            <div className="space-y-3 p-4 max-h-[240px] overflow-y-auto">
              {tournaments
                .filter((t) => t.status !== 'TENTATIVE')
                .slice(0, 3)
                .map((tournament) => {
                  // Support both API data (venueName, city, startDate, endDate) and local content (location, month, day)
                  const locationDisplay = tournament.venueName || tournament.city
                    ? [tournament.venueName, tournament.city].filter(Boolean).join(', ')
                    : tournament.location || '—'

                  let dateDisplay = '—'
                  if (tournament.startDate && tournament.endDate) {
                    dateDisplay = `${new Date(tournament.startDate).toLocaleDateString()} - ${new Date(tournament.endDate).toLocaleDateString()}`
                  } else if (tournament.startDate) {
                    dateDisplay = new Date(tournament.startDate).toLocaleDateString()
                  } else if (tournament.month && tournament.day) {
                    dateDisplay = `${tournament.month} ${tournament.day}`
                  }

                  return (
                    <div key={tournament._id || tournament.id} className="pb-3 border-b border-gray-100 last:border-b-0 last:pb-0">
                      <h4 className="font-bold text-gray-900 mb-1 line-clamp-2 text-sm">
                        {tournament.title}
                      </h4>
                      <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                        <span className="material-symbols-outlined text-[14px]">location_on</span>
                        <span className="line-clamp-1">
                          {locationDisplay}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <span className="material-symbols-outlined text-[14px]">calendar_month</span>
                        <span>
                          {dateDisplay}
                        </span>
                      </div>
                    </div>
                  )
                })}
            </div>

            <div className="px-4 pb-4">
              <button type="button" className="w-full py-2 text-sm border-2 border-[#5a0a8f] text-[#5a0a8f] font-bold rounded-lg hover:bg-purple-50 transition-colors">
                Download Calendar PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      <FeaturedGallery
        viewAllHref="/media"
        maxPreview={9}
        items={
          websiteContent.homepage.galleryImages.length > 0
            ? websiteContent.homepage.galleryImages
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((img) => ({
                  title: img.title || 'Gallery Image',
                  alt: img.description || img.title || 'Gallery image',
                  imageUrl: img.imageUrl,
                }))
            : undefined
        }
      />
      </main>
    </Skeleton>
  )
}
