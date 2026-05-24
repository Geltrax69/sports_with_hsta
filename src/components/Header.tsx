import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useWebsiteContent } from '../context/WebsiteContentContext'

type DropdownItem = { name: string; to?: string; subDropdown?: { name: string; to: string }[] }
type RouteItem = {
  name: string
  to: string
  dropdown?: DropdownItem[]
}

export function Header() {
  const { pathname } = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const { content } = useWebsiteContent()

  const routes = useMemo<RouteItem[]>(
    () => {
      const aboutDropdown = [
        { name: 'About The Federation', to: '/about' },
        { name: 'Executive Board', to: '/about/executive-board' },
        { name: 'Member Unit', to: '/about/member-unit' },
        { name: 'Accounts', to: '/about/accounts' },
        { name: 'AGM Meetings', to: '/about/agm-meetings' },
        { name: 'RTI', to: '/about/rti' },
        { name: 'Annual Report', to: '/about/annual-report' },
        { name: 'Election Report', to: '/about/election-report' },
        { name: 'Documents', to: '/documents' },
        { name: 'Committees', to: '/about/committees' },
        { name: 'Constitution, Rules And Policies', to: '/about/constitution-rules-and-policies' },
        { name: 'Anti Doping', to: '/about/anti-doping' },
        { name: 'Affiliated District', to: '/about/affiliated-district' },
      ]

      if (content.aboutPage?.customPages) {
        const existingPaths = new Set(aboutDropdown.map((d) => d.to))
        content.aboutPage.customPages.forEach((p) => {
          const to = `/about/${p.slug}`
          if (!existingPaths.has(to)) {
            aboutDropdown.push({ name: p.title, to })
          }
        })
      }

      return [
        { name: 'Home', to: '/' },
        { 
          name: 'About', 
          to: '/about',
          dropdown: aboutDropdown
        },
        { name: 'Players', to: '/players' },
        { name: 'Events', to: '/events' },
        { name: 'News', to: '/news' },
        { name: 'Certificates', to: '/certificates' },
        { name: 'Contact Us', to: '/contact' },
      ]
    },
    [content.aboutPage?.customPages],
  )

  useEffect(() => {
    // Close mobile menu on route change
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false)
  }, [pathname])

  const desktopBase =
    'px-3 py-2 text-xs font-bold uppercase tracking-normal rounded-full transition-all whitespace-nowrap flex-shrink-0'
  const desktopActive = 'text-[#5a0a8f] bg-white shadow-sm'
  const desktopInactive = 'text-gray-600 hover:text-[#5a0a8f] hover:bg-white'

  const mobileBase =
    'block px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors'
  const mobileActive = 'text-[#5a0a8f] bg-primary/5'
  const mobileInactive = 'text-gray-700 hover:bg-primary/5 hover:text-primary'
  const isActiveRoute = (to: string) => (
    to === '/' ? pathname === '/' : pathname === to || pathname.startsWith(`${to}/`)
  )

  return (
    <>
      {/* Top Bar: Recognition & Affiliation */}
      <div className="bg-[#1b1022] text-white border-b border-white/10 text-[11px] md:text-xs overflow-hidden">
        <div className="w-full py-2 marquee-container">
          <div className="marquee-content">
            {/* Set 1 */}
            <div className="flex items-center gap-8 mx-4">
              <span className="inline-flex items-center gap-2">
                <span className="font-bold text-warm-highlight uppercase tracking-wider">Recognised By:</span>
                <span>Ministry of Youth Affairs and Sports</span>
                <span className="text-gray-400">|</span>
                <span className="font-bold">युवा कार्यक्रम और खेल मंत्रालय</span>
              </span>
              <span className="text-gray-400 hidden sm:inline">|</span>
              <span className="inline-flex items-center gap-2 opacity-90">
                Affiliated with SEPAKTAKRAW FEDERATION OF INDIA
              </span>
              <span className="text-warm-highlight">•</span>
            </div>
            {/* Set 2 (Duplicate) */}
            <div className="flex items-center gap-8 mx-4">
              <span className="inline-flex items-center gap-2">
                <span className="font-bold text-warm-highlight uppercase tracking-wider">Recognised By:</span>
                <span>Ministry of Youth Affairs and Sports</span>
                <span className="text-gray-400">|</span>
                <span className="font-bold">युवा कार्यक्रम और खेल मंत्रालय</span>
              </span>
              <span className="text-gray-400 hidden sm:inline">|</span>
              <span className="inline-flex items-center gap-2 opacity-90">
                Affiliated with SEPAKTAKRAW FEDERATION OF INDIA
              </span>
              <span className="text-warm-highlight">•</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <header className="sticky top-0 z-50 w-full bg-white border-b border-[#eee7f3] shadow-lg shadow-black/5 backdrop-blur-xl bg-white/95">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 md:h-24 transition-all duration-300">
            {/* Logo & Brand Area */}
            <Link
              to="/"
              className="flex items-center gap-4 group cursor-pointer"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-[#5a0a8f]/20 blur-xl rounded-full group-hover:bg-[#5a0a8f]/30 transition-all"></div>
                <img
                  src={`${import.meta.env.BASE_URL}assets/images/logo.png`}
                  alt="STFI Logo"
                  className="relative size-12 md:size-14 rounded-full object-contain bg-white shadow-sm border border-gray-100"
                />
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg md:text-2xl font-black leading-none tracking-tighter uppercase font-display">
                  <span className="text-[#5a0a8f]">Haryana Sepak Takraw</span> <br className="md:hidden" />
                  <span className="text-[#D0001A]">Association</span>
                </h1>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav
              id="desktop-nav"
              className="hidden lg:flex items-center gap-1 p-1 bg-gray-50 rounded-full border border-gray-100"
            >
              {routes.map((r) => (
                r.dropdown ? (
                  <div key={r.name} className="relative group">
                    <Link
                      to={r.to}
                      className={`${desktopBase} flex items-center gap-1 ${isActiveRoute(r.to) ? desktopActive : desktopInactive}`}
                    >
                      {r.name}
                      <span className="material-symbols-outlined text-[16px] transition-transform group-hover:rotate-180">expand_more</span>
                    </Link>
                    <div className="absolute left-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="bg-white rounded-xl shadow-xl border border-gray-100 py-2 w-56 flex flex-col">
                        {r.dropdown.map((drop, idx) => (
                          <div key={idx} className="relative group/sub">
                            {drop.to ? (
                              <Link
                                to={drop.to}
                                className={`px-4 py-2 text-sm font-semibold transition-colors flex justify-between items-center ${pathname === drop.to.split('#')[0] ? 'text-[#5a0a8f] bg-purple-50' : 'text-gray-700 hover:text-[#5a0a8f] hover:bg-gray-50'}`}
                              >
                                {drop.name}
                              </Link>
                            ) : (
                              <div className="px-4 py-2 text-sm font-semibold transition-colors flex justify-between items-center text-gray-700 hover:text-[#5a0a8f] hover:bg-gray-50 cursor-pointer">
                                {drop.name}
                                {drop.subDropdown && <span className="material-symbols-outlined text-[16px]">chevron_right</span>}
                              </div>
                            )}
                            {drop.subDropdown && (
                              <div className="absolute left-full top-0 pl-2 opacity-0 invisible group-hover/sub:opacity-100 group-hover/sub:visible transition-all duration-200 z-50">
                                <div className="bg-white rounded-xl shadow-xl border border-gray-100 py-2 w-48 flex flex-col">
                                  {drop.subDropdown.map(sub => (
                                    <Link
                                      key={sub.to}
                                      to={sub.to}
                                      className={`px-4 py-2 text-sm font-semibold transition-colors ${pathname === sub.to.split('#')[0] ? 'text-[#5a0a8f] bg-purple-50' : 'text-gray-700 hover:text-[#5a0a8f] hover:bg-gray-50'}`}
                                    >
                                      {sub.name}
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <Link
                    key={r.to}
                    to={r.to}
                    className={`${desktopBase} ${isActiveRoute(r.to) ? desktopActive : desktopInactive}`}
                  >
                    {r.name}
                  </Link>
                )
              ))}
            </nav>

            {/* Actions */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/login"
                className="text-gray-600 hover:text-[#5a0a8f] font-bold text-xs uppercase tracking-wider px-3 py-2 transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-[#5a0a8f] hover:bg-[#400466] text-white px-6 py-2.5 rounded-full text-xs font-bold shadow-lg shadow-purple-900/20 transition-all flex items-center gap-2 transform hover:-translate-y-0.5"
              >
                <span className="material-symbols-outlined text-[16px]">person_add</span>
                REGISTER
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              id="mobile-menu-btn"
              className="lg:hidden p-2 text-gray-600 hover:text-primary transition-colors rounded-lg"
              onClick={() => setMobileOpen((v) => !v)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
            >
              <span
                className="material-symbols-outlined text-3xl transition-transform duration-300"
                style={{ transform: mobileOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
              >
                {mobileOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Menu — always in DOM so tapping the hamburger only toggles a CSS
            class (no React re-render / DOM mount required). Invisible when closed. */}
        <div
          id="mobile-menu"
          aria-hidden={!mobileOpen}
          className={`lg:hidden bg-white border-b border-gray-100 absolute w-full left-0 top-full shadow-lg
            transition-all duration-200 origin-top
            ${mobileOpen
              ? 'visible opacity-100 translate-y-0 pointer-events-auto'
              : 'invisible opacity-0 -translate-y-1 pointer-events-none'
            }`}
        >
          <div className="px-4 py-6 space-y-4">
            <div className="space-y-1">
              {routes.map((r) => (
                <div key={r.name}>
                  <Link
                    to={r.to}
                    className={`${mobileBase} ${isActiveRoute(r.to) ? mobileActive : mobileInactive}`}
                  >
                    {r.name}
                  </Link>
                  {r.dropdown && (
                    <div className="pl-4 mt-1 space-y-1 border-l-2 border-gray-100 ml-4 mb-2">
                      {r.dropdown.map((drop, idx) => (
                        <div key={idx}>
                          {drop.to ? (
                            <Link
                              to={drop.to}
                              onClick={() => setMobileOpen(false)}
                              className={`block px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${pathname === drop.to.split('#')[0] ? 'text-[#5a0a8f] bg-primary/5' : 'text-gray-600 hover:bg-primary/5 hover:text-primary'}`}
                            >
                              {drop.name}
                            </Link>
                          ) : (
                            <div className="block px-4 py-2 rounded-lg text-sm font-bold text-[#5a0a8f]">
                              {drop.name}
                            </div>
                          )}
                          {drop.subDropdown && (
                            <div className="pl-4 mt-1 space-y-1 border-l-2 border-gray-100 ml-2 mb-2">
                              {drop.subDropdown.map(sub => (
                                <Link
                                  key={sub.to}
                                  to={sub.to}
                                  onClick={() => setMobileOpen(false)}
                                  className={`block px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${pathname === sub.to.split('#')[0] ? 'text-[#5a0a8f] bg-primary/5' : 'text-gray-600 hover:bg-primary/5 hover:text-primary'}`}
                                >
                                  {sub.name}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-4">
                Member Area
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="w-full text-center text-[#5a0a8f] border border-[#5a0a8f]/30 bg-[#5a0a8f]/5 hover:bg-[#5a0a8f]/10 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="w-full bg-[#5a0a8f] hover:bg-[#400466] text-white px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider shadow-md shadow-purple-900/20 transition-all flex items-center justify-center gap-2"
                >
                  Register
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  )
}
