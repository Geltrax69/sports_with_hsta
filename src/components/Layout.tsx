import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { Footer } from './Footer'
import { Header } from './Header'
import { Sponsors } from './Sponsors'

const BODY_CLASSES: Record<string, string> = {
  '/': 'bg-background-light dark:bg-background-dark text-[#160d1c] dark:text-white transition-colors duration-200',
  '/about': 'bg-background-light dark:bg-background-dark text-text-main dark:text-white transition-colors duration-200',
  '/events':
    'bg-background-light dark:bg-background-dark text-[#160d1c] dark:text-white transition-colors duration-200 flex flex-col min-h-screen',
  '/documents':
    'font-display bg-background-light dark:bg-background-dark text-[#160d1c] dark:text-white transition-colors duration-200',
  '/national-team':
    'bg-background-light dark:bg-background-dark text-[#160d1c] dark:text-white transition-colors duration-200',
  '/national-team/mens-team':
    'bg-background-light dark:bg-background-dark text-[#160d1c] dark:text-white transition-colors duration-200',
  '/national-team/junior-mens-team':
    'bg-background-light dark:bg-background-dark text-[#160d1c] dark:text-white transition-colors duration-200',
  '/national-team/womens-team':
    'bg-background-light dark:bg-background-dark text-[#160d1c] dark:text-white transition-colors duration-200',
  '/national-team/junior-womens-team':
    'bg-background-light dark:bg-background-dark text-[#160d1c] dark:text-white transition-colors duration-200',
  '/news':
    'relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark font-display text-[#160d1c] dark:text-white overflow-x-hidden',
  '/news/feature-story':
    'relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark font-display text-text-dark dark:text-text-light overflow-x-hidden transition-colors duration-200',
  '/players':
    'bg-background-light dark:bg-background-dark text-[#160d1c] dark:text-white transition-colors duration-200 flex flex-col min-h-screen',
  '/contact':
    'bg-background-light dark:bg-background-dark font-display flex flex-col min-h-screen text-[#160d1c] dark:text-white overflow-x-hidden',
  '/admin':
    'bg-background-light dark:bg-background-dark text-[#160d1c] dark:text-white transition-colors duration-200',
}

export function Layout() {
  const { pathname } = useLocation()

  useEffect(() => {
    document.documentElement.classList.remove('dark')
    document.documentElement.classList.add('light')

    // Match news detail routes with pattern /news/:id
    let cls = BODY_CLASSES[pathname]
    if (!cls && pathname.startsWith('/national-team')) {
      cls = BODY_CLASSES['/national-team']
    }
    if (!cls && pathname.startsWith('/news/') && pathname !== '/news/feature-story') {
      cls = BODY_CLASSES['/news']
    }
    cls = cls ?? BODY_CLASSES['/']
    document.body.className = cls
  }, [pathname])

  return (
    <div className="w-full">
      <div id="global-header">
        <Header />
      </div>

      <Outlet />

      <div id="global-sponsors">
        <Sponsors />
      </div>

      <div id="global-footer">
        <Footer />
      </div>
    </div>
  )
}
