import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'

import { Layout } from './components/Layout'
import { MaintenanceNotice } from './components/MaintenanceNotice'
import { RouteError } from './components/RouteErrorBoundary'
import { AdminLayout } from './components/admin/AdminLayout'
import { ProtectedRoute } from './components/admin/ProtectedRoute'
import { CoachLayout } from './components/coach/CoachLayout'
import { PlayerLayout } from './components/player/PlayerLayout'
import { RefereeLayout } from './components/referee/RefereeLayout'
import { DistrictLayout } from './components/district/DistrictLayout'

// ─── Page-level lazy imports ──────────────────────────────────────────────────
// Each page is loaded only when the user navigates to that route.
// This splits the 1.79 MB bundle into many small chunks loaded on demand.

const HomePage              = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })))
const AboutPage             = lazy(() => import('./pages/AboutPage').then(m => ({ default: m.AboutPage })))
const SubAboutPage          = lazy(() => import('./pages/SubAboutPage').then(m => ({ default: m.SubAboutPage })))
const EventsPage            = lazy(() => import('./pages/EventsPage').then(m => ({ default: m.EventsPage })))
const DocumentsPage         = lazy(() => import('./pages/DocumentsPage').then(m => ({ default: m.DocumentsPage })))
const NewsPage              = lazy(() => import('./pages/NewsPage').then(m => ({ default: m.NewsPage })))
const MediaPage             = lazy(() => import('./pages/MediaPage').then(m => ({ default: m.MediaPage })))
const LiveScoresPage        = lazy(() => import('./pages/LiveScoresPage').then(m => ({ default: m.LiveScoresPage })))
const NewsDetailPage        = lazy(() => import('./pages/NewsDetailPage').then(m => ({ default: m.NewsDetailPage })))
const FeatureStoryPage      = lazy(() => import('./pages/FeatureStoryPage').then(m => ({ default: m.FeatureStoryPage })))
const PlayersPage           = lazy(() => import('./pages/PlayersPage').then(m => ({ default: m.PlayersPage })))
const PlayerDetailPage      = lazy(() => import('./pages/PlayerDetailPage').then(m => ({ default: m.PlayerDetailPage })))
const NationalTeamPage      = lazy(() => import('./pages/NationalTeamPage').then(m => ({ default: m.NationalTeamPage })))
const InternationalTeamPage = lazy(() => import('./pages/InternationalTeamPage').then(m => ({ default: m.InternationalTeamPage })))
const RegisterPage          = lazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })))
const LoginPage             = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })))
const ForgotPasswordPage    = lazy(() => import('./pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })))
const TournamentApplication = lazy(() => import('./pages/TournamentApplication').then(m => ({ default: m.TournamentApplication })))
const ContactPage           = lazy(() => import('./pages/ContactPage').then(m => ({ default: m.ContactPage })))
const CertificatesPage      = lazy(() => import('./pages/CertificatesPage').then(m => ({ default: m.CertificatesPage })))

// Admin pages
const AdminPage                  = lazy(() => import('./pages/admin/AdminPage').then(m => ({ default: m.AdminPage })))
const AdminDashboard             = lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })))
const DistrictManagement         = lazy(() => import('./pages/admin/DistrictManagement').then(m => ({ default: m.DistrictManagement })))
const OfficialsManagement        = lazy(() => import('./pages/admin/OfficialsManagement').then(m => ({ default: m.OfficialsManagement })))
const PlayerManagement           = lazy(() => import('./pages/admin/PlayerManagement').then(m => ({ default: m.PlayerManagement })))
const CoachManagement            = lazy(() => import('./pages/admin/CoachManagement').then(m => ({ default: m.CoachManagement })))
const RefereeManagement          = lazy(() => import('./pages/admin/RefereeManagement').then(m => ({ default: m.RefereeManagement })))
const TournamentManagement       = lazy(() => import('./pages/admin/TournamentManagement').then(m => ({ default: m.TournamentManagement })))
const CreateTournament           = lazy(() => import('./pages/admin/CreateTournament').then(m => ({ default: m.CreateTournament })))
const EditTournament             = lazy(() => import('./pages/admin/EditTournament').then(m => ({ default: m.EditTournament })))
const NewsManagement             = lazy(() => import('./pages/admin/NewsManagement').then(m => ({ default: m.NewsManagement })))
const DocumentsManagement        = lazy(() => import('./pages/admin/DocumentsManagement').then(m => ({ default: m.DocumentsManagement })))
const WebsiteContentManagement   = lazy(() => import('./pages/admin/WebsiteContentManagement').then(m => ({ default: m.WebsiteContentManagement })))
const MediaManagement            = lazy(() => import('./pages/admin/MediaManagement').then(m => ({ default: m.MediaManagement })))
const GalleryImagesManagement    = lazy(() => import('./pages/admin/GalleryImagesManagement').then(m => ({ default: m.GalleryImagesManagement })))
const VideosManagement           = lazy(() => import('./pages/admin/VideosManagement').then(m => ({ default: m.VideosManagement })))
const AdminAboutPage             = lazy(() => import('./pages/admin/AdminAboutPage').then(m => ({ default: m.AdminAboutPage })))
const NationalTeamManagement     = lazy(() => import('./pages/admin/NationalTeamManagement').then(m => ({ default: m.NationalTeamManagement })))
const InternationalTeamManagement = lazy(() => import('./pages/admin/InternationalTeamManagement').then(m => ({ default: m.InternationalTeamManagement })))
const PlayersDataManagement      = lazy(() => import('./pages/admin/PlayersDataManagement').then(m => ({ default: m.PlayersDataManagement })))
const AdminManageDirectories     = lazy(() => import('./pages/admin/AdminManageDirectories').then(m => ({ default: m.AdminManageDirectories })))
const TournamentRegistrations    = lazy(() => import('./pages/admin/TournamentRegistrations').then(m => ({ default: m.TournamentRegistrations })))
const AdminCertificates          = lazy(() => import('./pages/admin/AdminCertificates').then(m => ({ default: m.AdminCertificates })))
const CertificateList            = lazy(() => import('./pages/admin/CertificateList').then(m => ({ default: m.CertificateList })))
const LetterheadPage             = lazy(() => import('./pages/admin/LetterheadPage').then(m => ({ default: m.LetterheadPage })))

// Player portal pages
const PlayerDashboard    = lazy(() => import('./pages/player/PlayerDashboard').then(m => ({ default: m.PlayerDashboard })))
const PlayerEvents       = lazy(() => import('./pages/player/PlayerEvents').then(m => ({ default: m.PlayerEvents })))
const PlayerResults      = lazy(() => import('./pages/player/PlayerResults').then(m => ({ default: m.PlayerResults })))
const PlayerCertificates = lazy(() => import('./pages/player/PlayerCertificates').then(m => ({ default: m.PlayerCertificates })))
const PlayerStatusPage   = lazy(() => import('./pages/player/PlayerStatusPage').then(m => ({ default: m.PlayerStatusPage })))
const PlayerResubmitPage = lazy(() => import('./pages/player/PlayerResubmitPage').then(m => ({ default: m.PlayerResubmitPage })))
const PlayerSettings     = lazy(() => import('./pages/player/PlayerSettings').then(m => ({ default: m.PlayerSettings })))

// Coach portal pages
const CoachDashboard    = lazy(() => import('./pages/coach/CoachDashboard').then(m => ({ default: m.CoachDashboard })))
const CoachTournaments  = lazy(() => import('./pages/coach/CoachTournaments').then(m => ({ default: m.CoachTournaments })))
const CoachCertificates = lazy(() => import('./pages/coach/CoachCertificates').then(m => ({ default: m.CoachCertificates })))
const CoachMatches      = lazy(() => import('./pages/coach/CoachMatches').then(m => ({ default: m.CoachMatches })))
const CoachStatusPage   = lazy(() => import('./pages/coach/CoachStatusPage').then(m => ({ default: m.CoachStatusPage })))
const CoachResubmitPage = lazy(() => import('./pages/coach/CoachResubmitPage').then(m => ({ default: m.CoachResubmitPage })))
const CoachSettings     = lazy(() => import('./pages/coach/CoachSettings').then(m => ({ default: m.CoachSettings })))

// Referee portal pages
const RefereeDashboard    = lazy(() => import('./pages/referee/RefereeDashboard').then(m => ({ default: m.RefereeDashboard })))
const RefereeTournaments  = lazy(() => import('./pages/referee/RefereeTournaments').then(m => ({ default: m.RefereeTournaments })))
const RefereeMatches      = lazy(() => import('./pages/referee/RefereeMatches').then(m => ({ default: m.RefereeMatches })))
const RefereeCertificates = lazy(() => import('./pages/referee/RefereeCertificates').then(m => ({ default: m.RefereeCertificates })))
const RefereeStatusPage   = lazy(() => import('./pages/referee/RefereeStatusPage').then(m => ({ default: m.RefereeStatusPage })))
const RefereeResubmitPage = lazy(() => import('./pages/referee/RefereeResubmitPage').then(m => ({ default: m.RefereeResubmitPage })))
const RefereeSettings     = lazy(() => import('./pages/referee/RefereeSettings').then(m => ({ default: m.RefereeSettings })))

// District pages
const DistrictDashboard   = lazy(() => import('./pages/district/DistrictDashboard').then(m => ({ default: m.DistrictDashboard })))
const DistrictTournaments = lazy(() => import('./pages/district/DistrictTournaments').then(m => ({ default: m.DistrictTournaments })))
const DistrictTeams       = lazy(() => import('./pages/district/DistrictTeams').then(m => ({ default: m.DistrictTeams })))

// ─── Shared loading fallback ──────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-10 h-10 border-4 border-[#5a0a8f] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function SuspenseOutlet({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

export const appRouter = createBrowserRouter(
  [
    {
      path: '/',
      element: <Layout />,
      errorElement: <RouteError />,
      children: [
        { index: true,                             element: <SuspenseOutlet><HomePage /></SuspenseOutlet> },
        { path: 'about',                           element: <SuspenseOutlet><AboutPage /></SuspenseOutlet> },
        { path: 'about/executive-board',           element: <SuspenseOutlet><SubAboutPage title="Executive Board" /></SuspenseOutlet> },
        { path: 'about/member-unit',               element: <SuspenseOutlet><SubAboutPage title="Member Unit" /></SuspenseOutlet> },
        { path: 'about/accounts',                  element: <SuspenseOutlet><SubAboutPage title="Accounts" /></SuspenseOutlet> },
        { path: 'about/agm-meetings',              element: <SuspenseOutlet><SubAboutPage title="AGM Meetings" /></SuspenseOutlet> },
        { path: 'about/rti',                       element: <SuspenseOutlet><SubAboutPage title="RTI" /></SuspenseOutlet> },
        { path: 'about/annual-report',             element: <SuspenseOutlet><SubAboutPage title="Annual Report" /></SuspenseOutlet> },
        { path: 'about/election-report',           element: <SuspenseOutlet><SubAboutPage title="Election Report" /></SuspenseOutlet> },
        { path: 'about/:slug',                     element: <SuspenseOutlet><SubAboutPage /></SuspenseOutlet> },
        { path: 'events',                          element: <SuspenseOutlet><EventsPage /></SuspenseOutlet> },
        { path: 'documents',                       element: <SuspenseOutlet><DocumentsPage /></SuspenseOutlet> },
        { path: 'news',                            element: <SuspenseOutlet><NewsPage /></SuspenseOutlet> },
        { path: 'media',                           element: <SuspenseOutlet><MediaPage /></SuspenseOutlet> },
        { path: 'live-scores',                     element: <SuspenseOutlet><LiveScoresPage /></SuspenseOutlet> },
        { path: 'news/feature-story',              element: <SuspenseOutlet><FeatureStoryPage /></SuspenseOutlet> },
        { path: 'news/:id',                        element: <SuspenseOutlet><NewsDetailPage /></SuspenseOutlet> },
        { path: 'players',                         element: <SuspenseOutlet><PlayersPage /></SuspenseOutlet> },
        { path: 'players/:playerId',               element: <SuspenseOutlet><PlayerDetailPage /></SuspenseOutlet> },
        { path: 'national-team',                   element: <Navigate to="/national-team/mens-team" replace /> },
        { path: 'national-team/:teamSlug',         element: <SuspenseOutlet><NationalTeamPage /></SuspenseOutlet> },
        { path: 'international-team',              element: <Navigate to="/international-team/mens-team" replace /> },
        { path: 'international-team/:teamSlug',    element: <SuspenseOutlet><InternationalTeamPage /></SuspenseOutlet> },
        { path: 'register',                        element: <SuspenseOutlet><RegisterPage /></SuspenseOutlet> },
        { path: 'login',                           element: <SuspenseOutlet><LoginPage /></SuspenseOutlet> },
        { path: 'forgot-password',                 element: <SuspenseOutlet><ForgotPasswordPage /></SuspenseOutlet> },
        { path: 'tournaments/:tournamentId/apply', element: <SuspenseOutlet><TournamentApplication /></SuspenseOutlet> },
        { path: 'contact',                         element: <SuspenseOutlet><ContactPage /></SuspenseOutlet> },
        { path: 'certificates',                    element: <SuspenseOutlet><CertificatesPage /></SuspenseOutlet> },
        // Legacy HTML redirects
        { path: 'index.html',                      element: <Navigate to="/" replace /> },
        { path: 'pages/about.html',                element: <Navigate to="/about" replace /> },
        { path: 'pages/events.html',               element: <Navigate to="/events" replace /> },
        { path: 'pages/documents.html',            element: <Navigate to="/documents" replace /> },
        { path: 'pages/news.html',                 element: <Navigate to="/news" replace /> },
        { path: 'pages/feature-story.html',        element: <Navigate to="/news/feature-story" replace /> },
        { path: 'pages/players.html',              element: <Navigate to="/players" replace /> },
        { path: 'pages/contact.html',              element: <Navigate to="/contact" replace /> },
      ],
    },
    {
      path: '/admin',
      element: <ProtectedRoute requiredRole="admin" />,
      errorElement: <RouteError />,
      children: [
        {
          element: <AdminLayout />,
          children: [
            { index: true, element: <Navigate to="/admin/dashboard" replace /> },
            { path: 'dashboard',                                element: <SuspenseOutlet><AdminDashboard /></SuspenseOutlet> },
            { path: 'districts',                               element: <SuspenseOutlet><DistrictManagement /></SuspenseOutlet> },
            { path: 'officials',                               element: <SuspenseOutlet><OfficialsManagement /></SuspenseOutlet> },
            { path: 'players',                                 element: <SuspenseOutlet><PlayerManagement /></SuspenseOutlet> },
            { path: 'coaches',                                 element: <SuspenseOutlet><CoachManagement /></SuspenseOutlet> },
            { path: 'referees',                                element: <SuspenseOutlet><RefereeManagement /></SuspenseOutlet> },
            { path: 'tournaments',                             element: <SuspenseOutlet><TournamentManagement /></SuspenseOutlet> },
            { path: 'tournaments/create',                      element: <SuspenseOutlet><CreateTournament /></SuspenseOutlet> },
            { path: 'tournaments/:tournamentId/edit',          element: <SuspenseOutlet><EditTournament /></SuspenseOutlet> },
            { path: 'tournaments/:tournamentId/registrations', element: <SuspenseOutlet><TournamentRegistrations /></SuspenseOutlet> },
            { path: 'national-team',                           element: <SuspenseOutlet><NationalTeamManagement /></SuspenseOutlet> },
            { path: 'international-team',                      element: <SuspenseOutlet><InternationalTeamManagement /></SuspenseOutlet> },
            { path: 'players-data',                            element: <SuspenseOutlet><PlayersDataManagement /></SuspenseOutlet> },
            { path: 'website',                                 element: <SuspenseOutlet><WebsiteContentManagement /></SuspenseOutlet> },
            { path: 'media',                                   element: <SuspenseOutlet><MediaManagement /></SuspenseOutlet> },
            { path: 'media/gallery',                           element: <SuspenseOutlet><GalleryImagesManagement /></SuspenseOutlet> },
            { path: 'media/videos',                            element: <SuspenseOutlet><VideosManagement /></SuspenseOutlet> },
            { path: 'about/manage-directories',                element: <SuspenseOutlet><AdminManageDirectories /></SuspenseOutlet> },
            { path: 'about/:pageId',                           element: <SuspenseOutlet><AdminAboutPage /></SuspenseOutlet> },
            { path: 'news',                                    element: <SuspenseOutlet><NewsManagement /></SuspenseOutlet> },
            { path: 'documents',                               element: <SuspenseOutlet><DocumentsManagement /></SuspenseOutlet> },
            { path: 'certificates',                            element: <SuspenseOutlet><AdminCertificates /></SuspenseOutlet> },
            { path: 'certificates/list',                       element: <SuspenseOutlet><CertificateList /></SuspenseOutlet> },
            { path: 'letterhead',                              element: <SuspenseOutlet><LetterheadPage /></SuspenseOutlet> },
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
            { path: 'legacy', element: <SuspenseOutlet><AdminPage /></SuspenseOutlet> },
          ],
        },
      ],
    },
    {
      path: '/player',
      element: <ProtectedRoute requiredRole="player" />,
      errorElement: <RouteError />,
      children: [
        {
          element: <PlayerLayout />,
          children: [
            { path: 'status',    element: <SuspenseOutlet><PlayerStatusPage /></SuspenseOutlet> },
            { path: 'resubmit', element: <SuspenseOutlet><PlayerResubmitPage /></SuspenseOutlet> },
            { index: true,      element: <Navigate to="/player/dashboard" replace /> },
            { path: 'dashboard',     element: <SuspenseOutlet><PlayerDashboard /></SuspenseOutlet> },
            { path: 'events',        element: <SuspenseOutlet><PlayerEvents /></SuspenseOutlet> },
            { path: 'results',       element: <SuspenseOutlet><PlayerResults /></SuspenseOutlet> },
            { path: 'certificates',  element: <SuspenseOutlet><PlayerCertificates /></SuspenseOutlet> },
            { path: 'settings',      element: <SuspenseOutlet><PlayerSettings /></SuspenseOutlet> },
          ],
        },
      ],
    },
    {
      path: '/coach',
      element: <ProtectedRoute requiredRole="coach" />,
      errorElement: <RouteError />,
      children: [
        {
          element: <CoachLayout />,
          children: [
            { path: 'status',   element: <SuspenseOutlet><CoachStatusPage /></SuspenseOutlet> },
            { path: 'resubmit', element: <SuspenseOutlet><CoachResubmitPage /></SuspenseOutlet> },
            { index: true,      element: <Navigate to="/coach/dashboard" replace /> },
            { path: 'dashboard',    element: <SuspenseOutlet><CoachDashboard /></SuspenseOutlet> },
            { path: 'tournaments',  element: <SuspenseOutlet><CoachTournaments /></SuspenseOutlet> },
            { path: 'matches',      element: <SuspenseOutlet><CoachMatches /></SuspenseOutlet> },
            { path: 'certificates', element: <SuspenseOutlet><CoachCertificates /></SuspenseOutlet> },
            { path: 'settings',      element: <SuspenseOutlet><CoachSettings /></SuspenseOutlet> },
          ],
        },
      ],
    },
    {
      path: '/referee',
      element: <ProtectedRoute requiredRole="referee" />,
      errorElement: <RouteError />,
      children: [
        {
          element: <RefereeLayout />,
          children: [
            { path: 'status',   element: <SuspenseOutlet><RefereeStatusPage /></SuspenseOutlet> },
            { path: 'resubmit', element: <SuspenseOutlet><RefereeResubmitPage /></SuspenseOutlet> },
            { index: true,      element: <Navigate to="/referee/dashboard" replace /> },
            { path: 'dashboard',    element: <SuspenseOutlet><RefereeDashboard /></SuspenseOutlet> },
            { path: 'tournaments',  element: <SuspenseOutlet><RefereeTournaments /></SuspenseOutlet> },
            { path: 'matches',      element: <SuspenseOutlet><RefereeMatches /></SuspenseOutlet> },
            { path: 'certificates', element: <SuspenseOutlet><RefereeCertificates /></SuspenseOutlet> },
            { path: 'settings',      element: <SuspenseOutlet><RefereeSettings /></SuspenseOutlet> },
          ],
        },
      ],
    },
    {
      path: '/district',
      element: <ProtectedRoute requiredRole="district" />,
      errorElement: <RouteError />,
      children: [
        {
          element: <DistrictLayout />,
          children: [
            { index: true,      element: <Navigate to="/district/dashboard" replace /> },
            { path: 'dashboard',   element: <SuspenseOutlet><DistrictDashboard /></SuspenseOutlet> },
            { path: 'tournaments', element: <SuspenseOutlet><DistrictTournaments /></SuspenseOutlet> },
            { path: 'teams',       element: <SuspenseOutlet><DistrictTeams /></SuspenseOutlet> },
          ],
        },
      ],
    },
  ],
  {
    basename: import.meta.env.BASE_URL,
  },
)
