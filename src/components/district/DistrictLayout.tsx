import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { RouteErrorBoundary } from '../RouteErrorBoundary'

const NAV_ITEMS = [
  { to: '/district/dashboard', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/district/tournaments', label: 'Tournaments', icon: 'event', end: false },
  { to: '/district/teams', label: 'My Teams', icon: 'groups', end: false },
]

export function DistrictLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleLogout = () => {
    logout()
    navigate('/login')
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
            <img
              src={`${import.meta.env.BASE_URL}assets/images/logo.png`}
              alt="HSTA logo"
              className="w-10 h-10 rounded-lg object-contain flex-shrink-0 bg-white"
            />
            {sidebarOpen && (
              <div className="min-w-0">
                <div className="font-black text-sm text-gray-900">HSTA</div>
                <div className="text-xs text-gray-500 leading-tight">Haryana Sepak Takraw Association</div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors border ${
                  isActive
                    ? 'bg-[#5a0a8f]/10 text-[#5a0a8f] border-[#5a0a8f]/20 font-semibold'
                    : 'text-gray-700 hover:bg-gray-50 border-transparent'
                }`
              }
            >
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
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
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <button
                type="button"
                onClick={() => setSidebarOpen((v) => !v)}
                className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Toggle sidebar"
              >
                <span className="material-symbols-outlined text-xl">menu</span>
              </button>
              <span className="material-symbols-outlined text-[#5a0a8f]">location_on</span>
              <span className="font-semibold text-gray-900">District Portal</span>
            </div>

            <div className="flex items-center justify-end gap-4">
              <button
                className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Notifications"
              >
                <span className="material-symbols-outlined text-xl">notifications</span>
              </button>

              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                <img
                  src={user?.avatar || 'https://ui-avatars.com/api/?name=District&background=5a0a8f&color=fff'}
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
          <RouteErrorBoundary title="District page error" homeTo="/district/dashboard">
            <Outlet />
          </RouteErrorBoundary>
        </main>
      </div>
    </div>
  )
}
