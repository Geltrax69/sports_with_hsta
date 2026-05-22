import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'

import { AppProviders } from './AppProviders'
import { appRouter } from './router'

export default function App() {
  useEffect(() => {
    const t = window.setTimeout(() => document.body.classList.add('loaded'), 50)
    return () => window.clearTimeout(t)
  }, [])

  return (
    <AppProviders>
      <RouterProvider router={appRouter} unstable_useTransitions />
    </AppProviders>
  )
}
