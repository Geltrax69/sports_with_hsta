import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { apiRequest } from '../../lib/api'
import { RouteErrorBoundary } from '../RouteErrorBoundary'

export function RefereeLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [checkingStatus, setCheckingStatus] = useState(true)
  const [profileStatus, setProfileStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const res = await apiRequest<{ profile: { status: string; _id?: string; id?: string } }>(
          '/referees/me',
          { auth: true },
        )
        if (cancelled) return
        const status = (res.profile?.status || '').toLowerCase() as typeof profileStatus
        setProfileStatus(status)

        const isStatus = location.pathname.startsWith('/referee/status')
        const isResubmit = location.pathname.startsWith('/referee/resubmit')

        if ((status === 'pending' || status === 'rejected') && !isStatus && !isResubmit) {
          navigate('/referee/status', { replace: true })
        }
        if (status === 'approved' && (isStatus || isResubmit)) {
          navigate('/referee/dashboard', { replace: true })
        }
      } catch (err) {
        console.error('Failed to load referee profile status', err)
        logout()
        navigate('/login', { replace: true })
      } finally {
        if (!cancelled) setCheckingStatus(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isStatusPage = location.pathname.startsWith('/referee/status') || location.pathname.startsWith('/referee/resubmit')

  if (checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-700">
        <div className="animate-pulse text-sm">Checking your application status...</div>
      </div>
    )
  }

  if (isStatusPage) {
    return (
      <RouteErrorBoundary title="Referee page error" homeTo="/referee/status">
        <Outlet />
      </RouteErrorBoundary>
    )
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col fixed h-full z-30`}
      >
        {/* Brand */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen((v) => !v)}
              className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 hover:bg-gray-200 transition-colors"
              aria-label="Toggle sidebar"
            >
              <span className="material-symbols-outlined text-gray-700">menu</span>
            </button>

            {sidebarOpen && (
              <div>
                <div className="font-black text-sm text-gray-900">HSTA</div>
                <div className="text-xs text-gray-500">Referee Portal</div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          <NavLink
            to="/referee/dashboard"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors border ${
                isActive
                  ? 'bg-[#5a0a8f]/10 text-[#5a0a8f] border-[#5a0a8f]/20 font-semibold'
                  : 'text-gray-700 hover:bg-gray-50 border-transparent'
              }`
            }
          >
            <span className="material-symbols-outlined text-xl">dashboard</span>
            {sidebarOpen && <span>Dashboard</span>}
          </NavLink>

          <NavLink
            to="/referee/tournaments"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors border ${
                isActive
                  ? 'bg-[#5a0a8f]/10 text-[#5a0a8f] border-[#5a0a8f]/20 font-semibold'
                  : 'text-gray-700 hover:bg-gray-50 border-transparent'
              }`
            }
          >
            <span className="material-symbols-outlined text-xl">emoji_events</span>
            {sidebarOpen && <span>Tournaments</span>}
          </NavLink>

          <NavLink
            to="/referee/matches"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors border ${
                isActive
                  ? 'bg-[#5a0a8f]/10 text-[#5a0a8f] border-[#5a0a8f]/20 font-semibold'
                  : 'text-gray-700 hover:bg-gray-50 border-transparent'
              }`
            }
          >
            <span className="material-symbols-outlined text-xl">sports</span>
            {sidebarOpen && <span>My Matches</span>}
          </NavLink>

          <NavLink
            to="/referee/certificates"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors border ${
                isActive
                  ? 'bg-[#5a0a8f]/10 text-[#5a0a8f] border-[#5a0a8f]/20 font-semibold'
                  : 'text-gray-700 hover:bg-gray-50 border-transparent'
              }`
            }
          >
            <span className="material-symbols-outlined text-xl">verified</span>
            {sidebarOpen && <span>Certificates</span>}
          </NavLink>

          <NavLink
            to="/referee/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors border ${
                isActive
                  ? 'bg-[#5a0a8f]/10 text-[#5a0a8f] border-[#5a0a8f]/20 font-semibold'
                  : 'text-gray-700 hover:bg-gray-50 border-transparent'
              }`
            }
          >
            <span className="material-symbols-outlined text-xl">settings</span>
            {sidebarOpen && <span>Settings</span>}
          </NavLink>

        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">logout</span>
            {sidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="px-6 py-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-full md:w-[520px]">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  search
                </span>
                <input
                  type="search"
                  placeholder="Search tournaments, matches..."
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5a0a8f] focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="relative p-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                aria-label="Notifications"
              >
                <span className="material-symbols-outlined text-gray-700">notifications</span>
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  2
                </span>
              </button>

              <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-gray-200 bg-white">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-orange-700">sports_score</span>
                </div>
                <div className="hidden md:block">
                  <div className="text-xs font-semibold text-gray-900">{user?.name || 'Referee'}</div>
                  <div className="text-[10px] text-gray-500">Referee</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          <RouteErrorBoundary title="Referee page error" homeTo="/referee/dashboard">
            <Outlet />
          </RouteErrorBoundary>
        </main>
      </div>
    </div>
  )
}
