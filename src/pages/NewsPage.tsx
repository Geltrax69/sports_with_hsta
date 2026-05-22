import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { useSiteContent } from '../content/SiteContentContext'
import { useWebsiteContent } from '../context/WebsiteContentContext'
import { resolveImageUrl } from '../lib/images'
import { getRelativeDate } from '../lib/dateUtils'
import { Skeleton } from 'boneyard-js/react'

export function NewsPage() {
  const { content } = useSiteContent()
  const { content: websiteContent, contentLoading } = useWebsiteContent()
  const galleryRef = useRef<HTMLDivElement | null>(null)
  const [loadedGalleryImages, setLoadedGalleryImages] = useState<Record<string, boolean>>({})
  const [resolvedGalleryUrls, setResolvedGalleryUrls] = useState<Record<string, string>>({})
  const newsItems = useMemo(() => {
    const items = [...content.news]
    items.sort((a, b) => {
      // Featured items first
      if (a.featured !== b.featured) return b.featured ? 1 : -1
      // Then pinned items
      if (a.pinned !== b.pinned) return b.pinned ? 1 : -1
      // Then sort by date (newest first)
      const dateA = new Date(a.date || a.dateText || 0).getTime()
      const dateB = new Date(b.date || b.dateText || 0).getTime()
      return dateB - dateA
    })
    return items
  }, [content.news])

  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({})
  const [resolvedImages, setResolvedImages] = useState<Record<string, string>>({})
  const publicHref = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`

  // Gallery items
  const galleryItems = useMemo(() => {
    if (websiteContent.homepage.galleryImages.length > 0) {
      return websiteContent.homepage.galleryImages
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .map((img) => ({
          title: img.title || 'Gallery Image',
          alt: img.description || img.title || 'Gallery image',
          imageUrl: img.imageUrl,
        }))
    }
    return []
  }, [websiteContent.homepage.galleryImages])

  // Resolve all news image URLs (for S3 images that need signed URLs)
  useEffect(() => {
    const resolveUrls = async () => {
      const resolved: Record<string, string> = {}
      for (const newsItem of newsItems) {
        if (newsItem?.imageUrl) {
          const url = await resolveImageUrl(newsItem.imageUrl, false)
          resolved[newsItem.id] = url
        }
      }
      setResolvedImages(resolved)
    }
    void resolveUrls()
  }, [newsItems])

  // Resolve gallery image URLs
  useEffect(() => {
    const resolveUrls = async () => {
      const resolved: Record<string, string> = {}
      for (const item of galleryItems) {
        const url = await resolveImageUrl(item.imageUrl, false)
        resolved[item.imageUrl] = url
      }
      setResolvedGalleryUrls(resolved)
    }
    void resolveUrls()
  }, [galleryItems])

  const scrollGallery = useCallback((direction: 'next' | 'prev') => {
    const container = galleryRef.current
    if (!container) return

    const item = container.firstElementChild as HTMLElement | null
    if (!item) return

    const style = window.getComputedStyle(container)
    const gap = Number.parseFloat(style.gap) || 16
    const distance = item.offsetWidth + gap

    container.scrollBy({ left: direction === 'next' ? distance : -distance, behavior: 'smooth' })
  }, [])

  return (
    <Skeleton name="news-page" loading={contentLoading}>
      <main id="page-content" className="flex-1 bg-white">
        <section className="bg-white pt-12 pb-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-2">
            <h2 className="text-4xl font-black leading-tight tracking-tight text-gray-900">
              News &amp; Media
            </h2>
            <p className="text-gray-600 text-lg font-normal">
              Latest updates, match highlights, and press releases from the federation.
            </p>
          </div>
        </div>
      </section>

      {newsItems.length > 0 && (
        <section className="py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {newsItems.map((item) => (
                <article key={item.id} className="group flex flex-col overflow-hidden rounded-xl bg-white shadow-md border border-gray-200 transition-all hover:-translate-y-1 hover:shadow-lg h-full">
                  <div className="relative aspect-video w-full overflow-hidden bg-gray-200">
                    <img
                      src={resolvedImages[item.id] || item.imageUrl}
                      alt={item.title}
                      className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${loadedImages[item.id] ? 'blur-0 opacity-100' : 'blur-md opacity-70'
                        }`}
                      onLoad={() => setLoadedImages(prev => ({ ...prev, [item.id]: true }))}
                      onError={() => {
                        console.error('Failed to load news image:', item.imageUrl)
                      }}
                    />
                    {item.badge && (
                      <div className="absolute top-3 left-3 rounded bg-red-600 px-2.5 py-1 text-xs font-bold text-white uppercase shadow-md">
                        {item.badge}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-5 bg-white">
                    <div className="mb-3 flex items-center gap-2 text-xs font-medium text-gray-500">
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>calendar_today</span>
                      <span>{item.date ? getRelativeDate(item.date) : item.dateText}</span>
                    </div>
                    <h3 className="mb-3 text-xl font-bold leading-snug text-gray-900 group-hover:text-[#5a0a8f] transition-colors">
                      {item.title}
                    </h3>
                    {item.excerpt && (
                      <p className="mb-6 flex-1 text-sm leading-relaxed text-gray-600">{item.excerpt}</p>
                    )}
                    <a
                      href={publicHref(`/news/${item.id}`)}
                      className="inline-flex items-center text-sm font-bold text-[#5a0a8f] hover:text-[#400466] transition-colors"
                    >
                      Read Article →
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="text-3xl font-black text-gray-900 mb-2">Media Gallery</h2>
              <p className="text-gray-600">
                Relive the best moments from recent tournaments.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="/media"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2 rounded-lg border-2 border-[#5a0a8f] text-[#5a0a8f] font-bold hover:bg-purple-50 transition-colors"
              >
                View All
              </a>
              <button
                type="button"
                aria-label="Scroll gallery left"
                className="size-10 rounded-full border border-gray-300 bg-white text-gray-600 flex items-center justify-center hover:bg-gray-50 transition-colors"
                onClick={() => scrollGallery('prev')}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="size-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <button
                type="button"
                aria-label="Scroll gallery right"
                className="size-10 rounded-full border border-[#5a0a8f] bg-[#5a0a8f] text-white flex items-center justify-center hover:bg-[#400466] transition-colors"
                onClick={() => scrollGallery('next')}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="size-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>
            </div>
          </div>

          <div
            id="gallery-container"
            ref={galleryRef}
            className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
            aria-label="Media gallery"
          >
            {galleryItems.map((g, index) => {
              const displayUrl = resolvedGalleryUrls[g.imageUrl] || g.imageUrl
              return (
                <div
                  key={`${g.imageUrl}-${index}`}
                  className="min-w-[280px] sm:min-w-[360px] lg:min-w-[420px] h-64 md:h-80 rounded-xl overflow-hidden relative group snap-start flex-none bg-gray-200"
                >
                  <img
                    src={displayUrl}
                    alt={g.alt}
                    loading={index < 3 ? 'eager' : 'lazy'}
                    decoding="async"
                    width="420"
                    height="320"
                    className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${loadedGalleryImages[g.imageUrl] ? 'blur-0 opacity-100' : 'blur-md opacity-70'
                      }`}
                    onLoad={() => setLoadedGalleryImages(prev => ({ ...prev, [g.imageUrl]: true }))}
                    onError={(e) => {
                      console.error('Image failed to load:', displayUrl, e)
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"></div>
                  {g.title && (
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-white font-bold text-lg">{g.title}</h3>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </main>
    </Skeleton>
  )
}
