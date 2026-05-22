import { useCallback, useRef, useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { resolveImageUrl } from '../lib/images'

type FeaturedGalleryItem = {
  title: string
  imageUrl: string
  alt: string
}

const DEFAULT_ITEMS: FeaturedGalleryItem[] = [
  {
    title: 'Training Camp',
    alt: 'Training session at sunset',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAoEZFC8ZpYKTzXH_BmnYWk1-2LX3b09RIETF0mtdkb-GRXxGSUNeBs-TJtdKqOZ_Os1fPj9yARVaam-5-OE0kbC-MlPscRUC_ouk7gMqbDPyowxP-CPBelKTwlJdEfnETwCN3V-3zR3-mKa28T3OiAGY5eA6ma6vZu_H1Rzcg2dUQvzJeeufYmv5_h-vO4vuDfPt-5npaiOwk6Qs6uex8Xm5xz7cnfPVObew9669DI_KnX2vzCkagBYfTryzJYlQTaMjGv8TpQzqM',
  },
  {
    title: 'Asian Games Final',
    alt: 'Action shot of a player performing a roll spike mid-air',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAJs3mEF9UHnamtvV7tArgtxURMeI0CwAA2TTzjFkxbaLdLndNBK1LR6tnrAF8j5Ie1QhvHhcGY9wgL1eOcH6xAjYPFk6mVUR1XFf-ZYrrS2FmQRyFmB8wJaTJ-v4HRExSU0xf4u7uQl7Zd1nPlJ-qy6lz1NSwRcNWlU1l7G2uNz0ycwzdBNv2TFZSujf5nKqJXD5h7bTju8T37nfOo73ooc7r0Mq6UhzYK51LTaKht9X-M6aLKBw3mrMKUYSf6x9YdUPZtWjD3fxQ',
  },
  {
    title: 'Team Spirit',
    alt: 'Team huddle before a match wearing national jerseys',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB_Yub5z-xFNi4ZPAAIQ62DCJz7tOvoQhu9vzqxobSIOoHr9BQEXzKpnRn-3qNPS2N5pc-ZWwUniIHdF6XytC4PExwH79o-oIZu_QswL8obzmZfaFFD-8QesO7ITgzijs5t2PamGDqPfDvovkCSnZTsGflakzcpYkOWuckgDYQ1fbasjxqCqUHxVWHwZL6QUb5ut2htd_mC-0Gte6Dkg4tj74iXI_SHVxatHl7RGHCWb9yahwHs28Lm6VjdvaV6fx6PbUaptgQ4De0',
  },
  {
    title: 'National Finals 2022',
    alt: 'Action shot of a takraw kick in mid-air',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDNfN2i_h9CnZcmdEmiaWSl6Uc9xn9k-daRQiWByg5lxZkuuHfKYM_CI193q6aaeeDRDIAYh3XGdVCQrWS0yJUssSj8hE-qqd9NfrgGNbq_DR3bNE4leckaUZU17a9gqUMgLVeoddd_B5sk-Wh8ikT_6KQe1PYO4vuyhOToVS2B81s2CtDTmDaYZKbrdwxa8hE6zn0ZgwmcovCCWYOhkpPu6h79UqCszqhHh8GAiqAqCb390HDAxMLzKUYgwioHs446wJQ64qZCuqQ',
  },
  {
    title: 'Team Celebration',
    alt: 'Athletes celebrating a victory',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDXzuCjxsgPDM342vUL0TjQCebpMeFTczMwCogcrCnfJkjh3AVIUB-1SbuDPM3Xr37J1t75bzlNRE5peblCPiBJXVV351_HyGIGvUmcMfWG6T8iTU_Z6yccJIEbIM3hi7Q99o7xRhWDPbHcPi4PJDtAbUd-kQZK9oOrwbBIW64hWoPtKbklrQQ7GwNvZo_dokAmepdY-YsylhkPOVd1Aso8MYNowAnU37Q2PfMxHQ1QzAfprckbl1WJ31Tqbrc3Je0-0f-KVNa7tHs',
  },
]

type FeaturedGalleryProps = {
  items?: FeaturedGalleryItem[]
  showHeader?: boolean
  viewAllHref?: string
  maxPreview?: number
  showSerial?: boolean
}

export function FeaturedGallery({
  items = DEFAULT_ITEMS,
  showHeader = true,
  viewAllHref = '/media',
  maxPreview = 9,
  showSerial = false,
}: FeaturedGalleryProps) {
  // Stable slice — new array every render would re-trigger the effect on every render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const previewItems = useMemo(() => items.slice(0, maxPreview), [items, maxPreview])
  const galleryRef = useRef<HTMLDivElement | null>(null)
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({})
  const [resolvedUrls, setResolvedUrls] = useState<Record<string, string>>({})

  // Resolve image URLs on mount and when items change.
  // `cancelled` flag stops the async loop if the component unmounts mid-loop.
  useEffect(() => {
    let cancelled = false
    const resolve = async () => {
      const resolved: Record<string, string> = {}
      for (const item of previewItems) {
        if (cancelled) break
        // Pass false for requireAuth since this is public homepage
        const url = await resolveImageUrl(item.imageUrl, false)
        if (!cancelled) resolved[item.imageUrl] = url
      }
      if (!cancelled) setResolvedUrls(resolved)
    }
    void resolve()
    return () => { cancelled = true }
  }, [previewItems])

  const handleImageLoad = useCallback((imageUrl: string) => {
    setLoadedImages(prev => ({ ...prev, [imageUrl]: true }))
  }, [])

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

  const galleryControls = (
    <div className="flex gap-2">
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
  )

  if (!showHeader) {
    return (
      <div
        id="gallery-container"
        ref={galleryRef}
        className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
        aria-label="Featured gallery"
      >
        {previewItems.map((g, index) => {
          const displayUrl = resolvedUrls[g.imageUrl] || g.imageUrl
          const label = g.title?.trim() || 'Gallery Image'
          return (
            <div
              key={`${g.imageUrl}-${index}`}
              className="min-w-[280px] sm:min-w-[360px] lg:min-w-[420px] h-64 md:h-80 rounded-xl overflow-hidden relative group snap-start flex-none bg-gray-200"
            >
              {showSerial && (
                <span className="absolute top-3 left-3 z-10 bg-[#5a0a8f] text-white text-xs font-black px-2.5 py-1 rounded-full shadow">
                  {index + 1}
                </span>
              )}
              <img
                src={displayUrl}
                alt={g.alt}
                loading={index < 3 ? 'eager' : 'lazy'}
                decoding="async"
                width="420"
                height="320"
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${
                  loadedImages[g.imageUrl] ? 'blur-0 opacity-100' : 'blur-md opacity-70'
                }`}
                onLoad={() => handleImageLoad(g.imageUrl)}
                onError={(e) => {
                  console.error('Image failed to load:', displayUrl, e)
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                <h3 className="text-white font-bold text-lg drop-shadow-md">{label}</h3>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <section className="bg-gray-50 py-16">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-4xl font-bold text-[#5a0a8f] flex items-center gap-3">
              <span className="w-1 h-12 bg-[#5a0a8f]"></span>
              Featured Gallery
            </h2>
            {items.length > maxPreview && (
              <p className="text-sm text-gray-600 mt-2 ml-4">
                Showing {maxPreview} of {items.length} images
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {viewAllHref && (
              <Link
                to={viewAllHref}
                className="px-5 py-2.5 rounded-lg border-2 border-[#5a0a8f] text-[#5a0a8f] font-bold hover:bg-purple-50 transition-colors bg-white"
              >
                View All
              </Link>
            )}
            {galleryControls}
          </div>
        </div>

        <div
          id="gallery-container"
          ref={galleryRef}
          className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
          aria-label="Featured gallery"
        >
          {previewItems.map((g, index) => {
            const displayUrl = resolvedUrls[g.imageUrl] || g.imageUrl
            const label = g.title?.trim() || 'Gallery Image'
            return (
              <div
                key={`${g.imageUrl}-${index}`}
                className="min-w-[280px] sm:min-w-[360px] lg:min-w-[420px] h-64 md:h-80 rounded-xl overflow-hidden relative group snap-start flex-none bg-gray-200"
              >
                {showSerial && (
                  <span className="absolute top-3 left-3 z-10 bg-[#5a0a8f] text-white text-xs font-black px-2.5 py-1 rounded-full shadow">
                    {index + 1}
                  </span>
                )}
                <img
                  src={displayUrl}
                  alt={g.alt}
                  loading={index < 3 ? 'eager' : 'lazy'}
                  decoding="async"
                  width="420"
                  height="320"
                  className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${
                    loadedImages[g.imageUrl] ? 'blur-0 opacity-100' : 'blur-md opacity-70'
                  }`}
                  onLoad={() => handleImageLoad(g.imageUrl)}
                  onError={(e) => {
                    console.error('Image failed to load:', displayUrl, e)
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                  <h3 className="text-white font-bold text-lg drop-shadow-md">{label}</h3>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
