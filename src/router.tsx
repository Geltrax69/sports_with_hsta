import { createBrowserRouter, Navigate } from 'react-router-dom'

import { Layout } from './components/Layout'
import { MaintenanceNotice } from './components/MaintenanceNotice'
import { AdminLayout } from './components/admin/AdminLayout'
import { ProtectedRoute } from './components/admin/ProtectedRoute'
import { CoachLayout } from './components/coach/CoachLayout'
import { PlayerLayout } from './components/player/PlayerLayout'
import { RefereeLayout } from './components/referee/RefereeLayout'
import { AboutPage } from './pages/AboutPage'
import { SubAboutPage } from './pages/SubAboutPage'
import { EventsPage } from './pages/EventsPage'
import { DocumentsPage } from './pages/DocumentsPage'
import { NewsPage } from './pages/NewsPage'
import { MediaPage } from './pages/MediaPage'
import { LiveScoresPage } from './pages/LiveScoresPage'
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
import { NationalTeamPage } from './pages/NationalTeamPage'
import { InternationalTeamPage } from './pages/InternationalTeamPage'
import { HomePage } from './pages/HomePage'
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
import { MediaManagement } from './pages/admin/MediaManagement'
import { GalleryImagesManagement } from './pages/admin/GalleryImagesManagement'
import { VideosManagement } from './pages/admin/VideosManagement'
import { AdminAboutPage } from './pages/admin/AdminAboutPage'
import { NationalTeamManagement } from './pages/admin/NationalTeamManagement'
import { InternationalTeamManagement } from './pages/admin/InternationalTeamManagement'
import { PlayersDataManagement } from './pages/admin/PlayersDataManagement'
import { AdminManageDirectories } from './pages/admin/AdminManageDirectories'
import { TournamentRegistrations } from './pages/admin/TournamentRegistrations'
import { AdminCertificates } from './pages/admin/AdminCertificates'
import { CertificateList } from './pages/admin/CertificateList'
import { PlayerDashboard } from './pages/player/PlayerDashboard'
import { PlayerEvents } from './pages/player/PlayerEvents'
import { PlayerResults } from './pages/player/PlayerResults'
import { PlayerCertificates } from './pages/player/PlayerCertificates'
import { PlayerStatusPage } from './pages/player/PlayerStatusPage'
import { PlayerResubmitPage } from './pages/player/PlayerResubmitPage'
import { CoachDashboard } from './pages/coach/CoachDashboard'
import { CoachTournaments } from './pages/coach/CoachTournaments'
import { CoachCertificates } from './pages/coach/CoachCertificates'
import { CoachMatches } from './pages/coach/CoachMatches'
import { CoachStatusPage } from './pages/coach/CoachStatusPage'
import { CoachResubmitPage } from './pages/coach/CoachResubmitPage'
import { RefereeDashboard } from './pages/referee/RefereeDashboard'
import { RefereeTournaments } from './pages/referee/RefereeTournaments'
import { RefereeMatches } from './pages/referee/RefereeMatches'
import { RefereeCertificates } from './pages/referee/RefereeCertificates'
import { RefereeStatusPage } from './pages/referee/RefereeStatusPage'
import { RefereeResubmitPage } from './pages/referee/RefereeResubmitPage'

export const appRouter = createBrowserRouter(
  [
    {
      path: '/',
      element: <Layout />,
      children: [
        { index: true, element: <HomePage /> },
        { path: 'about', element: <AboutPage /> },
        { path: 'about/executive-board', element: <SubAboutPage title="Executive Board" /> },
        { path: 'about/member-unit', element: <SubAboutPage title="Member Unit" /> },
        { path: 'about/accounts', element: <SubAboutPage title="Accounts" /> },
        { path: 'about/agm-meetings', element: <SubAboutPage title="AGM Meetings" /> },
        { path: 'about/rti', element: <SubAboutPage title="RTI" /> },
        { path: 'about/annual-report', element: <SubAboutPage title="Annual Report" /> },
        { path: 'about/election-report', element: <SubAboutPage title="Election Report" /> },
        { path: 'about/:slug', element: <SubAboutPage /> },
        { path: 'events', element: <EventsPage /> },
        { path: 'documents', element: <DocumentsPage /> },
        { path: 'news', element: <NewsPage /> },
        { path: 'media', element: <MediaPage /> },
        { path: 'live-scores', element: <LiveScoresPage /> },
        { path: 'news/feature-story', element: <FeatureStoryPage /> },
        { path: 'news/:id', element: <NewsDetailPage /> },
        { path: 'players', element: <PlayersPage /> },
        { path: 'players/:playerId', element: <PlayerDetailPage /> },
        { path: 'national-team', element: <Navigate to="/national-team/mens-team" replace /> },
        { path: 'national-team/:teamSlug', element: <NationalTeamPage /> },
        { path: 'international-team', element: <Navigate to="/international-team/mens-team" replace /> },
        { path: 'international-team/:teamSlug', element: <InternationalTeamPage /> },
        { path: 'register', element: <RegisterPage /> },
        { path: 'login', element: <LoginPage /> },
        { path: 'forgot-password', element: <ForgotPasswordPage /> },
        { path: 'tournaments/:tournamentId/apply', element: <TournamentApplication /> },
        { path: 'contact', element: <ContactPage /> },
        { path: 'certificates', element: <CertificatesPage /> },
        { path: 'index.html', element: <Navigate to="/" replace /> },
        { path: 'pages/about.html', element: <Navigate to="/about" replace /> },
        { path: 'pages/events.html', element: <Navigate to="/events" replace /> },
        { path: 'pages/documents.html', element: <Navigate to="/documents" replace /> },
        { path: 'pages/news.html', element: <Navigate to="/news" replace /> },
        { path: 'pages/feature-story.html', element: <Navigate to="/news/feature-story" replace /> },
        { path: 'pages/players.html', element: <Navigate to="/players" replace /> },
        { path: 'pages/contact.html', element: <Navigate to="/contact" replace /> },
      ],
    },
    {
      path: '/admin',
      element: <ProtectedRoute requiredRole="admin" />,
      children: [
        {
          element: <AdminLayout />,
          children: [
            { index: true, element: <Navigate to="/admin/dashboard" replace /> },
            { path: 'dashboard', element: <AdminDashboard /> },
            { path: 'districts', element: <DistrictManagement /> },
            { path: 'officials', element: <OfficialsManagement /> },
            { path: 'players', element: <PlayerManagement /> },
            { path: 'coaches', element: <CoachManagement /> },
            { path: 'referees', element: <RefereeManagement /> },
            { path: 'tournaments', element: <TournamentManagement /> },
            { path: 'tournaments/create', element: <CreateTournament /> },
            { path: 'tournaments/:tournamentId/edit', element: <EditTournament /> },
            { path: 'tournaments/:tournamentId/registrations', element: <TournamentRegistrations /> },
            { path: 'national-team', element: <NationalTeamManagement /> },
            { path: 'international-team', element: <InternationalTeamManagement /> },
            { path: 'players-data', element: <PlayersDataManagement /> },
            { path: 'website', element: <WebsiteContentManagement /> },
            { path: 'media', element: <MediaManagement /> },
            { path: 'media/gallery', element: <GalleryImagesManagement /> },
            { path: 'media/videos', element: <VideosManagement /> },
            { path: 'about/manage-directories', element: <AdminManageDirectories /> },
            { path: 'about/:pageId', element: <AdminAboutPage /> },
            { path: 'news', element: <NewsManagement /> },
            { path: 'documents', element: <DocumentsManagement /> },
            { path: 'certificates', element: <AdminCertificates /> },
            { path: 'certificates/list', element: <CertificateList /> },
            {
              path: 'settings',
              element: (
                <div className="p-6">
                  <MaintenanceNotice
                    title="System Settings"
                    message="Advanced configuration and system administration tools are currently restricted for maintenance."
                    icon="settings"
                  />
                </div>
              ),
            },
            {
              path: 'reports',
              element: (
                <div className="p-6">
                  <MaintenanceNotice
                    title="Analytical Reports"
                    message="Match performance data and registration metrics reports are being compiled."
                    icon="bar_chart"
                  />
                </div>
              ),
            },
            { path: 'legacy', element: <AdminPage /> },
          ],
        },
      ],
    },
    {
      path: '/player',
      element: <ProtectedRoute requiredRole="player" />,
      children: [
        {
          element: <PlayerLayout />,
          children: [
            { path: 'status', element: <PlayerStatusPage /> },
            { path: 'resubmit', element: <PlayerResubmitPage /> },
            { index: true, element: <Navigate to="/player/dashboard" replace /> },
            { path: 'dashboard', element: <PlayerDashboard /> },
            { path: 'events', element: <PlayerEvents /> },
            { path: 'results', element: <PlayerResults /> },
            { path: 'certificates', element: <PlayerCertificates /> },
          ],
        },
      ],
    },
    {
      path: '/coach',
      element: <ProtectedRoute requiredRole="coach" />,
      children: [
        {
          element: <CoachLayout />,
          children: [
            { path: 'status', element: <CoachStatusPage /> },
            { path: 'resubmit', element: <CoachResubmitPage /> },
            { index: true, element: <Navigate to="/coach/dashboard" replace /> },
            { path: 'dashboard', element: <CoachDashboard /> },
            { path: 'tournaments', element: <CoachTournaments /> },
            { path: 'matches', element: <CoachMatches /> },
            { path: 'certificates', element: <CoachCertificates /> },
          ],
        },
      ],
    },
    {
      path: '/referee',
      element: <ProtectedRoute requiredRole="referee" />,
      children: [
        {
          element: <RefereeLayout />,
          children: [
            { path: 'status', element: <RefereeStatusPage /> },
            { path: 'resubmit', element: <RefereeResubmitPage /> },
            { index: true, element: <Navigate to="/referee/dashboard" replace /> },
            { path: 'dashboard', element: <RefereeDashboard /> },
            { path: 'tournaments', element: <RefereeTournaments /> },
            { path: 'matches', element: <RefereeMatches /> },
            { path: 'certificates', element: <RefereeCertificates /> },
          ],
        },
      ],
    },
  ],
  {
    basename: import.meta.env.BASE_URL,
  },
)
