import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { MaintenanceNotice } from './components/MaintenanceNotice'

import { AuthProvider } from './context/AuthContext'
import { DistrictsProvider } from './context/DistrictsContext'
import { RegistrationsProvider } from './context/RegistrationsContext'
import { DocumentsProvider } from './context/DocumentsContext'
import { WebsiteContentProvider } from './context/WebsiteContentContext'
import { SiteContentProvider } from './content/SiteContentContext'
import { Layout } from './components/Layout'
import { AdminLayout } from './components/admin/AdminLayout'
import { HomePage } from './pages/HomePage'
import { AboutPage } from './pages/AboutPage'
import { EventsPage } from './pages/EventsPage'
import { DocumentsPage } from './pages/DocumentsPage'
import { NewsPage } from './pages/NewsPage'
import { NewsDetailPage } from './pages/NewsDetailPage'
import { FeatureStoryPage } from './pages/FeatureStoryPage'
import { PlayersPage } from './pages/PlayersPage'
import { PlayerDetailPage } from './pages/PlayerDetailPage'
import { RegisterPage } from './pages/RegisterPage'
import { LoginPage } from './pages/LoginPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { TournamentApplication } from './pages/TournamentApplication'
import { ContactPage } from './pages/ContactPage'
import { CertificatesPage } from './pages/CertificatesPage'
import { ProtectedRoute } from './components/admin/ProtectedRoute'
import { AdminPage } from './pages/admin/AdminPage'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { DistrictManagement } from './pages/admin/DistrictManagement'
import { OfficialsManagement } from './pages/admin/OfficialsManagement'
import { PlayerManagement } from './pages/admin/PlayerManagement'
import { CoachManagement } from './pages/admin/CoachManagement'
import { RefereeManagement } from './pages/admin/RefereeManagement'
import { TournamentManagement } from './pages/admin/TournamentManagement'
import { CreateTournament } from './pages/admin/CreateTournament'
import { EditTournament } from './pages/admin/EditTournament'
import { NewsManagement } from './pages/admin/NewsManagement'
import { DocumentsManagement } from './pages/admin/DocumentsManagement'
import { WebsiteContentManagement } from './pages/admin/WebsiteContentManagement'
import { TournamentRegistrations } from './pages/admin/TournamentRegistrations'
import { AdminCertificates } from './pages/admin/AdminCertificates'
import { CertificateList } from './pages/admin/CertificateList'
import { PlayerLayout } from './components/player/PlayerLayout'
import { PlayerDashboard } from './pages/player/PlayerDashboard'
import { PlayerEvents } from './pages/player/PlayerEvents'
import { PlayerResults } from './pages/player/PlayerResults'
import { PlayerCertificates } from './pages/player/PlayerCertificates'
import { PlayerStatusPage } from './pages/player/PlayerStatusPage'
import { PlayerResubmitPage } from './pages/player/PlayerResubmitPage'
import { CoachLayout } from './components/coach/CoachLayout'
import { CoachDashboard } from './pages/coach/CoachDashboard'
import { CoachTournaments } from './pages/coach/CoachTournaments'
import { CoachCertificates } from './pages/coach/CoachCertificates'
import { CoachMatches } from './pages/coach/CoachMatches'
import { CoachStatusPage } from './pages/coach/CoachStatusPage'
import { CoachResubmitPage } from './pages/coach/CoachResubmitPage'
import { RefereeLayout } from './components/referee/RefereeLayout'
import { RefereeDashboard } from './pages/referee/RefereeDashboard'
import { RefereeTournaments } from './pages/referee/RefereeTournaments'
import { RefereeMatches } from './pages/referee/RefereeMatches'
import { RefereeCertificates } from './pages/referee/RefereeCertificates'
import { RefereeStatusPage } from './pages/referee/RefereeStatusPage'
import { RefereeResubmitPage } from './pages/referee/RefereeResubmitPage'

export default function App() {
  useEffect(() => {
    const t = window.setTimeout(() => document.body.classList.add('loaded'), 50)
    return () => window.clearTimeout(t)
  }, [])

  return (
    <AuthProvider>
      <DistrictsProvider>
        <RegistrationsProvider>
          <DocumentsProvider>
            <WebsiteContentProvider>
              <SiteContentProvider>
                <Routes>
                  <Route element={<Layout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/events" element={<EventsPage />} />
                    <Route path="/documents" element={<DocumentsPage />} />
                    <Route path="/news" element={<NewsPage />} />
                    <Route path="/news/:id" element={<NewsDetailPage />} />
                    <Route path="/news/feature-story" element={<FeatureStoryPage />} />
                    <Route path="/players" element={<PlayersPage />} />
                    <Route path="/players/:playerId" element={<PlayerDetailPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/tournaments/:tournamentId/apply" element={<TournamentApplication />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/certificates" element={<CertificatesPage />} />

                    {/* Compatibility redirects for old static URLs */}
                    <Route path="/index.html" element={<Navigate to="/" replace />} />
                    <Route path="/pages/about.html" element={<Navigate to="/about" replace />} />
                    <Route path="/pages/events.html" element={<Navigate to="/events" replace />} />
                    <Route path="/pages/documents.html" element={<Navigate to="/documents" replace />} />
                    <Route path="/pages/news.html" element={<Navigate to="/news" replace />} />
                    <Route path="/pages/feature-story.html" element={<Navigate to="/news/feature-story" replace />} />
                    <Route path="/pages/players.html" element={<Navigate to="/players" replace />} />
                    <Route path="/pages/contact.html" element={<Navigate to="/contact" replace />} />
                  </Route>

                  {/* Admin Routes */}
                  <Route element={<ProtectedRoute requiredRole="admin" />}>
                    <Route path="/admin" element={<AdminLayout />}>
                      <Route index element={<Navigate to="/admin/dashboard" replace />} />
                      <Route path="dashboard" element={<AdminDashboard />} />
                      <Route path="districts" element={<DistrictManagement />} />
                      <Route path="officials" element={<OfficialsManagement />} />
                      <Route path="players" element={<PlayerManagement />} />
                      <Route path="coaches" element={<CoachManagement />} />
                      <Route path="referees" element={<RefereeManagement />} />
                      <Route path="tournaments" element={<TournamentManagement />} />
                      <Route path="tournaments/create" element={<CreateTournament />} />
                      <Route path="tournaments/:tournamentId/edit" element={<EditTournament />} />
                      <Route path="tournaments/:tournamentId/registrations" element={<TournamentRegistrations />} />
                      <Route path="coaches" element={<CoachManagement />} />
                      <Route path="website" element={<WebsiteContentManagement />} />
                      <Route path="news" element={<NewsManagement />} />
                      <Route path="documents" element={<DocumentsManagement />} />
                      <Route path="certificates" element={<AdminCertificates />} />
                      <Route path="certificates/list" element={<CertificateList />} />
                      <Route path="settings" element={<div className="p-6"><MaintenanceNotice title="System Settings" message="Advanced configuration and system administration tools are currently restricted for maintenance." icon="settings" /></div>} />
                      <Route path="reports" element={<div className="p-6"><MaintenanceNotice title="Analytical Reports" message="Match performance data and registration metrics reports are being compiled." icon="bar_chart" /></div>} />
                      <Route path="legacy" element={<AdminPage />} />
                    </Route>
                  </Route>

                  {/* Player Routes */}
                  <Route element={<ProtectedRoute requiredRole="player" />}>
                    <Route path="/player" element={<PlayerLayout />}>
                      <Route path="status" element={<PlayerStatusPage />} />
                      <Route path="resubmit" element={<PlayerResubmitPage />} />
                      <Route index element={<Navigate to="/player/dashboard" replace />} />
                      <Route path="dashboard" element={<PlayerDashboard />} />
                      <Route path="events" element={<PlayerEvents />} />
                      <Route path="results" element={<PlayerResults />} />
                      <Route path="certificates" element={<PlayerCertificates />} />
                    </Route>
                  </Route>

                  {/* Coach Routes */}
                  <Route element={<ProtectedRoute requiredRole="coach" />}>
                    <Route path="/coach" element={<CoachLayout />}>
                      <Route path="status" element={<CoachStatusPage />} />
                      <Route path="resubmit" element={<CoachResubmitPage />} />
                      <Route index element={<Navigate to="/coach/dashboard" replace />} />
                      <Route path="dashboard" element={<CoachDashboard />} />
                      <Route path="tournaments" element={<CoachTournaments />} />
                      <Route path="matches" element={<CoachMatches />} />
                      <Route path="certificates" element={<CoachCertificates />} />
                    </Route>
                  </Route>

                  {/* Referee Routes */}
                  <Route element={<ProtectedRoute requiredRole="referee" />}>
                    <Route path="/referee" element={<RefereeLayout />}>
                      <Route path="status" element={<RefereeStatusPage />} />
                      <Route path="resubmit" element={<RefereeResubmitPage />} />
                      <Route index element={<Navigate to="/referee/dashboard" replace />} />
                      <Route path="dashboard" element={<RefereeDashboard />} />
                      <Route path="tournaments" element={<RefereeTournaments />} />
                      <Route path="matches" element={<RefereeMatches />} />
                      <Route path="certificates" element={<RefereeCertificates />} />
                    </Route>
                  </Route>
                </Routes>
              </SiteContentProvider>
            </WebsiteContentProvider>
          </DocumentsProvider>
        </RegistrationsProvider>
      </DistrictsProvider>
    </AuthProvider>
  )
}
