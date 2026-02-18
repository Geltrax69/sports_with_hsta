import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { apiRequest } from '../../lib/api'

export function PlayerLayout() {
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
          '/players/me',
          { auth: true },
        )
        if (cancelled) return
        const status = (res.profile?.status || '').toLowerCase() as typeof profileStatus
        setProfileStatus(status)

        // Redirect pending/rejected users away from dashboards.
        const isStatus = location.pathname.startsWith('/player/status')
        const isResubmit = location.pathname.startsWith('/player/resubmit')

        if ((status === 'pending' || status === 'rejected') && !isStatus && !isResubmit) {
          navigate('/player/status', { replace: true })
        }
        if (status === 'approved' && (isStatus || isResubmit)) {
          navigate('/player/dashboard', { replace: true })
        }
      } catch (err) {
        // If we cannot load profile, force logout to avoid unauthorized access.
        console.error('Failed to load player profile status', err)
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

  const isStatusPage = location.pathname.startsWith('/player/status') || location.pathname.startsWith('/player/resubmit')

  if (checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-700">
        <div className="animate-pulse text-sm">Checking your application status...</div>
      </div>
    )
  }

  // For status page, render content without dashboard chrome.
  if (isStatusPage) {
    return <Outlet />
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
                <div className="text-xs text-gray-500">Haryana Sepak Takraw Association</div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          <NavLink
            to="/player/dashboard"
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
            to="/player/events"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors border ${
                isActive
                  ? 'bg-[#5a0a8f]/10 text-[#5a0a8f] border-[#5a0a8f]/20 font-semibold'
                  : 'text-gray-700 hover:bg-gray-50 border-transparent'
              }`
            }
          >
            <span className="material-symbols-outlined text-xl">event</span>
            {sidebarOpen && <span>Events</span>}
          </NavLink>

          <NavLink
            to="/player/results"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors border ${
                isActive
                  ? 'bg-[#5a0a8f]/10 text-[#5a0a8f] border-[#5a0a8f]/20 font-semibold'
                  : 'text-gray-700 hover:bg-gray-50 border-transparent'
              }`
            }
          >
            <span className="material-symbols-outlined text-xl">emoji_events</span>
            {sidebarOpen && <span>Results</span>}
          </NavLink>

          <NavLink
            to="/player/certificates"
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
                  type="text"
                  placeholder="Search tournaments, players, or news..."
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none transition-all bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-4">
              <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Notifications">
                <span className="material-symbols-outlined text-xl">notifications</span>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                <img
                  src={user?.avatar || 'https://ui-avatars.com/api/?name=Player&background=5a0a8f&color=fff'}
                  alt={user?.name}
                  className="w-10 h-10 rounded-full"
                />
                {user && (
                  <div className="hidden md:block">
                    <div className="text-sm font-semibold text-gray-900">{user.name}</div>
                    <div className="text-xs text-gray-500 capitalize">{user.role}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
