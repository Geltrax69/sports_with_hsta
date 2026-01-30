import { useEffect } from 'react'
import { useWebsiteContent } from '../context/WebsiteContentContext'

export function AboutPage() {
  const { content: websiteContent } = useWebsiteContent()

  const withBase = (url: string) => (url.startsWith('/') ? `${import.meta.env.BASE_URL}${url.slice(1)}` : url)

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
                      src={withBase(item.imageUrl || '/assets/images/hero-bg-2.jpg')}
                      alt={item.title}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = withBase('/assets/images/hero-bg-2.jpg')
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
                    src={`${import.meta.env.BASE_URL}assets/images/hero-bg-2.jpg`}
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
                    src={`${import.meta.env.BASE_URL}assets/images/hero-bg.jpg`}
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
                    src={`${import.meta.env.BASE_URL}assets/images/hero-bg-2.jpg`}
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
                    src={`${import.meta.env.BASE_URL}assets/images/hero-bg.jpg`}
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
              <h3 className="mt-2 text-3xl font-black text-gray-900 sm:text-4xl">Office Bearers</h3>
              <p className="mt-2 text-gray-600 max-w-2xl">
                Meet the dedicated team leading the federation towards excellence.
              </p>
            </div>
            <a className="text-[#5a0a8f] font-bold text-sm hover:underline flex items-center gap-1" href="#">
              View Organizational Chart{' '}
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </a>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="group relative flex flex-col overflow-hidden rounded-xl shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl">
              <div className="aspect-[3/4] w-full overflow-hidden bg-[#f5f3f0]">
                <div
                  className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                  data-alt="Portrait of the President, a professional man in a suit"
                  style={{
                    backgroundImage:
                      'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCkVm7ICpGuvfBaNkf1IQzLMMo8-74TC39hyDJTNfcq8gv7BVwIXJ5Jb53TOAsS0wrgCTF3DnnoQYIADoQq2tTc9ixZQX_xI_hN-Y_ae1jaC-tOV1RoCpiXndJcbAbj-4rLx3yR9cdFlm2IAeVxzJUz-Csj8USFNwxsbXlY15G35S4-VbHfrgQrHYGT4jaywjt1Kg8nZPh6XLF2EzN4uFTItVztVlp6fuYQy12wMZVtczhe9wPxyfCzRDtwQ4wX8GWYmM5ErvM0lKA")',
                  }}
                ></div>
              </div>
              <div className="flex flex-1 flex-col p-5 bg-[#2c3e50]">
                <h4 className="text-lg font-bold text-white mb-1">Shri. Prem Singh</h4>
                <p className="text-sm font-medium text-white uppercase tracking-wide mb-4">PRESIDENT</p>
                <div className="mt-auto flex gap-3 pt-4 border-t border-white/20">
                  <a className="text-white/80 hover:text-white transition-colors" href="#">
                    <span className="material-symbols-outlined text-lg">mail</span>
                  </a>
                  <a className="text-white/80 hover:text-white transition-colors" href="#">
                    <span className="material-symbols-outlined text-lg">call</span>
                  </a>
                </div>
              </div>
            </div>

            <div className="group relative flex flex-col overflow-hidden rounded-xl shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl">
              <div className="aspect-[3/4] w-full overflow-hidden bg-[#f5f3f0]">
                <div
                  className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                  data-alt="Portrait of the General Secretary, a professional woman in business attire"
                  style={{
                    backgroundImage:
                      'url("https://lh3.googleusercontent.com/aida-public/AB6AXuD6WecTFDzi02HUHFCqhBAn_O3X4SWoJO-_ZW3Ve2ithZ4cuIYojUYu3S437rdiHBuP101vyh3nDgPV5nlR0iGrY2HPEqwhEMLQrpGcICL7mwI8-SQ1ADv44MrEuK5Y-hEfPJrbyLi1IkLEMR8rnr45GpiYB-T0tgT5OC8dlv9nwsSn1EWSl-wuZijspoFOJRwvFoTUD8xkITE9WYbQq6bLYq508Ua8jQ7HCBbkGxeGIvz4FsTQ50ZxKZRuXNpxggMeQfu4ESgnD2M")',
                  }}
                ></div>
              </div>
              <div className="flex flex-1 flex-col p-5 bg-[#2c3e50]">
                <h4 className="text-lg font-bold text-white mb-1">Smt. Anita Roy</h4>
                <p className="text-sm font-medium text-white uppercase tracking-wide mb-4">GENERAL SECRETARY</p>
                <div className="mt-auto flex gap-3 pt-4 border-t border-white/20">
                  <a className="text-white/80 hover:text-white transition-colors" href="#">
                    <span className="material-symbols-outlined text-lg">mail</span>
                  </a>
                  <a className="text-white/80 hover:text-white transition-colors" href="#">
                    <span className="material-symbols-outlined text-lg">call</span>
                  </a>
                </div>
              </div>
            </div>

            <div className="group relative flex flex-col overflow-hidden rounded-xl shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl">
              <div className="aspect-[3/4] w-full overflow-hidden bg-[#f5f3f0]">
                <div
                  className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                  data-alt="Portrait of the Treasurer, a smiling man with glasses"
                  style={{
                    backgroundImage:
                      'url("https://lh3.googleusercontent.com/aida-public/AB6AXuA4jifj84R4gr_b8eaJ1UpFpmvpx50cvakzmc-bBfGNWwKJ9aSIYOerM1ldiMuUmz8Jzec9MJJ363jaUufjN2_CTCogX0336WF8BZZsbXh20ML3dGat1VHWxf9gV-Eh9m_wVmh3ayUhKn1-oCXxME8xY4vvj8IjEBvLpLrDYSKVWzf_TN6w8XhxymEuq1hhwQ_FyCyy1Mc6nXDA2W5vGjUJCtco8e3p05W_427RxF_d7FrhYt-4eIkXvbFGmc3gyxGdcg6coBg_5pw")',
                  }}
                ></div>
              </div>
              <div className="flex flex-1 flex-col p-5 bg-[#2c3e50]">
                <h4 className="text-lg font-bold text-white mb-1">Mr. Rajesh Kumar</h4>
                <p className="text-sm font-medium text-white uppercase tracking-wide mb-4">TREASURER</p>
                <div className="mt-auto flex gap-3 pt-4 border-t border-white/20">
                  <a className="text-white/80 hover:text-white transition-colors" href="#">
                    <span className="material-symbols-outlined text-lg">mail</span>
                  </a>
                  <a className="text-white/80 hover:text-white transition-colors" href="#">
                    <span className="material-symbols-outlined text-lg">call</span>
                  </a>
                </div>
              </div>
            </div>

            <div className="group relative flex flex-col overflow-hidden rounded-xl shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl">
              <div className="aspect-[3/4] w-full overflow-hidden bg-[#f5f3f0]">
                <div
                  className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                  data-alt="Portrait of an Executive Member, a professional man in a dark suit"
                  style={{
                    backgroundImage:
                      'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCZhhObvddmwCtK7fldudo1dTJ1XOawpznF_2-xWrzRc17yWvsJWsTj9DGzEUUQduGqXnlIWVt7C_EsZnrBsH1nbz4RAcADjUlmJKdKYILDeh4hdM341wRbqjhzdvXPnYTj9SwADCS-oCu-PW0ywMAsEextylRYagQEVzWy9Xr_VUMUJmbLYqhU2r9qoiqBtugal8Pxqrc48Wg9fPilOBo4xN-3xP8wbpmExe-uOl3Wih_KCfnx9DBmws3zljKiTTW1ga3dmDLaYAo")',
                  }}
                ></div>
              </div>
              <div className="flex flex-1 flex-col p-5 bg-[#2c3e50]">
                <h4 className="text-lg font-bold text-white mb-1">Mr. Vinod Sharma</h4>
                <p className="text-sm font-medium text-white uppercase tracking-wide mb-4">VICE PRESIDENT</p>
                <div className="mt-auto flex gap-3 pt-4 border-t border-white/20">
                  <a className="text-white/80 hover:text-white transition-colors" href="#">
                    <span className="material-symbols-outlined text-lg">mail</span>
                  </a>
                  <a className="text-white/80 hover:text-white transition-colors" href="#">
                    <span className="material-symbols-outlined text-lg">call</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
