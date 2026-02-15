import { useEffect, useRef } from 'react'
import { useWebsiteContent } from '../context/WebsiteContentContext'
import { imageRateLimiter } from '../lib/rateLimit'

export function AboutPage() {
  const { content: websiteContent } = useWebsiteContent()
  const failedImages = useRef<Set<string>>(new Set())

  const withBase = (url: string) => (url.startsWith('/') ? `${import.meta.env.BASE_URL}${url.slice(1)}` : url)
  
  const getPlaceholder = () => `${import.meta.env.BASE_URL}assets/images/placeholder.svg`
  const officials = [...(websiteContent.aboutPage.officials || [])].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0),
  )

  useEffect(() => {
    // Trigger entry animations on mount
    const triggerAnimations = () => {
      document.body.classList.add('loaded')
      // Force reflow to ensure animation triggers
      void document.body.offsetHeight
    }
    triggerAnimations()

    const timeline = document.querySelector<HTMLElement>('.timeline-container')
    const items = Array.from(document.querySelectorAll<HTMLElement>('.timeline-item'))
    if (!timeline || items.length === 0) return

    const firstImg = items[0].querySelector<HTMLImageElement>('.timeline__img')
    if (firstImg) {
      timeline.style.backgroundImage = `url(${firstImg.src})`
    }
    items[0].classList.add('timeline-item--active')

    const handleScroll = () => {
      const viewportCenter = window.innerHeight / 2

      let activeItem: HTMLElement | null = null
      let minDistance = Number.POSITIVE_INFINITY

      for (const item of items) {
        const rect = item.getBoundingClientRect()
        const itemCenter = rect.top + rect.height / 2
        const distance = Math.abs(viewportCenter - itemCenter)

        if (distance < minDistance) {
          minDistance = distance
          activeItem = item
        }
      }

      if (!activeItem) return

      for (const it of items) it.classList.remove('timeline-item--active')
      activeItem.classList.add('timeline-item--active')

      const img = activeItem.querySelector<HTMLImageElement>('.timeline__img')
      if (!img) return

      const bgUrl = `url(${img.src})`
      if (timeline.style.backgroundImage !== bgUrl) {
        timeline.style.backgroundImage = bgUrl
      }
    }

    window.addEventListener('scroll', handleScroll)
    const t = window.setTimeout(handleScroll, 100)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.clearTimeout(t)
    }
  }, [])

  return (
    <main id="page-content" className="w-full overflow-x-hidden relative">
      <section className="relative w-full overflow-hidden bg-[#5a0a8f] py-20 md:py-32">
        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <span className="mb-6 inline-block text-sm font-semibold uppercase tracking-wider text-white animate-entry">
            EST. 1982
          </span>
          <h1 className="mb-6 text-5xl font-black tracking-tight text-white sm:text-6xl md:text-7xl animate-entry delay-100">
            About The Federation
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-white md:text-xl animate-entry delay-200">
            Uniting India through Sepak Takraw. We are dedicated to promoting excellence, sportsmanship, and the
            unparalleled growth of the sport across the nation.
          </p>
        </div>
      </section>

      <section className="relative -mt-16 mb-20 px-4 sm:px-6 lg:px-8 z-30">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2">
          <div className="relative overflow-hidden rounded-xl bg-white p-8 shadow-xl border border-gray-200">
            <div className="flex flex-col items-start gap-6">
              <div className="flex size-14 items-center justify-center rounded-full bg-white border-2 border-orange-500">
                <span className="material-symbols-outlined text-orange-500 text-3xl">visibility</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Our Vision</h2>
                <p className="text-gray-700 leading-relaxed">
                  {websiteContent.aboutPage.vision ||
                    'To make Sepak Takraw a premier sport in India, recognized for its athleticism and competitive spirit on the global stage, inspiring a new generation of athletes.'}
                </p>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-xl bg-white p-8 shadow-xl border border-gray-200">
            <div className="flex flex-col items-start gap-6">
              <div className="flex size-14 items-center justify-center rounded-full bg-white border-2 border-orange-500">
                <span className="material-symbols-outlined text-orange-500 text-3xl">sync_alt</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Our Mission</h2>
                <p className="text-gray-700 leading-relaxed">
                  {websiteContent.aboutPage.mission ||
                    'Fostering talent through grassroots programs, organizing national championships with world-class standards, and building state-of-the-art infrastructure across all states.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div id="timeline-1" className="timeline-container relative bg-gray-800">
        <div className="timeline-header">
          <h2 className="timeline-header__title">OUR JOURNEY</h2>
          <h3 className="timeline-header__subtitle">HISTORY &amp; MILESTONES</h3>
        </div>
        <div className="timeline">
          {websiteContent.aboutPage.journeyItems.length > 0 ? (
            websiteContent.aboutPage.journeyItems
              .sort((a, b) => parseInt(a.year) - parseInt(b.year))
              .map((item) => (
                <div key={item.id} className="timeline-item" data-text={item.title.toUpperCase()}>
                  <div className="timeline__content">
                    <img
                      className="timeline__img"
                      src={withBase(item.imageUrl || '/assets/images/placeholder.svg')}
                      alt={item.title}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        const currentSrc = target.src
                        
                        // Prevent infinite retry loop
                        if (failedImages.current.has(currentSrc)) {
                          return
                        }
                        
                        failedImages.current.add(currentSrc)
                        
                        // Check rate limit before attempting fallback
                        if (!imageRateLimiter.canAttempt(currentSrc)) {
                          console.warn(`Rate limit exceeded for image: ${currentSrc}`)
                          target.src = getPlaceholder()
                          return
                        }
                        
                        imageRateLimiter.recordAttempt(currentSrc)
                        target.src = getPlaceholder()
                      }}
                    />
                    <span className="timeline__content-caption">{item.year}</span>
                    <h2 className="timeline__content-title">{item.title}</h2>
                    <p className="timeline__content-desc">{item.description}</p>
                  </div>
                </div>
              ))
          ) : (
            <>
              <div className="timeline-item" data-text="FEDERATION ESTABLISHED">
                <div className="timeline__content">
                  <img
                    className="timeline__img"
                    src={getPlaceholder()}
                    alt="1982 Federation"
                  />
                  <span className="timeline__content-caption">1982</span>
                  <h2 className="timeline__content-title">Foundation</h2>
                  <p className="timeline__content-desc">
                    The STFI was officially formed to govern and promote the sport in India, laying the groundwork for
                    structured competition. A humble beginning that sparked a national movement.
                  </p>
                </div>
              </div>
              <div className="timeline-item" data-text="FIRST NATIONALS">
                <div className="timeline__content">
                  <img
                    className="timeline__img"
                    src={getPlaceholder()}
                    alt="1984 First Nationals"
                  />
                  <span className="timeline__content-caption">1984</span>
                  <h2 className="timeline__content-title">First Championship</h2>
                  <p className="timeline__content-desc">
                    The inaugural National Championship was held in New Delhi, bringing together teams from 12 states.
                    This marked the first time the sport was played competitively at a national scale.
                  </p>
                </div>
              </div>
              <div className="timeline-item" data-text="ASIAN GAMES DEBUT">
                <div className="timeline__content">
                  <img
                    className="timeline__img"
                    src={getPlaceholder()}
                    alt="1990 Asian Games"
                  />
                  <span className="timeline__content-caption">1990</span>
                  <h2 className="timeline__content-title">International Debut</h2>
                  <p className="timeline__content-desc">
                    Indian National Team made its debut at the Asian Games in Beijing. It was a moment of pride as our
                    athletes stepped onto the international stage for the first time.
                  </p>
                </div>
              </div>
              <div className="timeline-item" data-text="HISTORIC BRONZE">
                <div className="timeline__content">
                  <img
                    className="timeline__img"
                    src={getPlaceholder()}
                    alt="2018 Bronze Medal"
                  />
                  <span className="timeline__content-caption">2018</span>
                  <h2 className="timeline__content-title">Asian Games Medal</h2>
                  <p className="timeline__content-desc">
                    History was made as India won its first-ever medal (Bronze) in Sepak Takraw at the 2018 Asian Games
                    in Jakarta Palembang. A testament to decades of hard work.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <section className="py-16 md:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-600">LEADERSHIP</h2>
              <h3 className="mt-2 text-3xl font-black text-gray-900 sm:text-4xl">Officials Directory</h3>
              <p className="mt-2 text-gray-600 max-w-2xl">
                Meet the dedicated officials guiding the federation across the country.
              </p>
            </div>
            <div className="text-sm text-gray-500"></div>
          </div>
          {officials.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-gray-600">
              Officials will appear here once added by the admin.
            </div>
          ) : (
            <div className="grid justify-center grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {officials.map((official) => (
                <div
                  key={official.id}
                  className="group relative flex w-full max-w-xs flex-col overflow-hidden rounded-xl shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="aspect-[4/5] w-full overflow-hidden bg-[#f5f3f0]">
                    <img
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      src={official.photoUrl ? withBase(official.photoUrl) : getPlaceholder()}
                      alt={official.name}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = getPlaceholder()
                      }}
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-5 bg-[#2c3e50]">
                    <h4 className="text-lg font-bold text-white mb-1">{official.name}</h4>
                    <p className="text-sm font-semibold text-white uppercase tracking-wide mb-2">
                      {official.title || 'Official'}
                    </p>
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90">
                      <span className="material-symbols-outlined text-base">badge</span>
                      {official.role || official.region || 'National'}
                    </div>
                    <div className="mt-auto space-y-2 pt-3 border-t border-white/20 text-white/80 text-sm">
                      {official.email && (
                        <a className="hover:text-white transition-colors flex items-center gap-2" href={`mailto:${official.email}`}>
                          <span className="material-symbols-outlined text-lg">mail</span>
                          <span className="break-all">{official.email}</span>
                        </a>
                      )}
                      {official.phone && (
                        <a className="hover:text-white transition-colors flex items-center gap-2" href={`tel:${official.phone}`}>
                          <span className="material-symbols-outlined text-lg">call</span>
                          <span>{official.phone}</span>
                        </a>
                      )}
                      {!official.email && !official.phone && <span>No contact provided</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
