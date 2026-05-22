import type { ReactNode } from 'react'

import { AuthProvider } from './context/AuthContext'
import { DistrictsProvider } from './context/DistrictsContext'
import { RegistrationsProvider } from './context/RegistrationsContext'
import { DocumentsProvider } from './context/DocumentsContext'
import { WebsiteContentProvider } from './context/WebsiteContentContext'
import { SiteContentProvider } from './content/SiteContentContext'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <DistrictsProvider>
        <RegistrationsProvider>
          <DocumentsProvider>
            <WebsiteContentProvider>
              <SiteContentProvider>{children}</SiteContentProvider>
            </WebsiteContentProvider>
          </DocumentsProvider>
        </RegistrationsProvider>
      </DistrictsProvider>
    </AuthProvider>
  )
}
