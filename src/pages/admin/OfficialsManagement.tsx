import { Link } from 'react-router-dom'

export function OfficialsManagement() {
  return (
    <div>
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
        <Link to="/admin/dashboard" className="hover:text-[#5a0a8f]">
          Admin
        </Link>
        <span>›</span>
        <span className="text-gray-900 font-medium">Officials</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">Manage Officials</h1>
          <p className="text-gray-600">Create, view, and manage federation official profiles and assignments.</p>
        </div>
        <button className="flex items-center gap-2 bg-[#5a0a8f] hover:bg-[#400466] text-white px-5 py-2.5 rounded-lg font-bold transition-colors">
          <span className="material-symbols-outlined">person_add</span>
          Register New Official
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border-2 border-purple-100 p-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10">
            <span className="material-symbols-outlined text-6xl text-purple-500">groups</span>
          </div>
          <div className="relative">
            <div className="text-3xl font-black text-gray-900 mb-1">124</div>
            <div className="flex items-center gap-2 text-sm mb-2">
              <span className="text-green-600 font-bold">+12% this month</span>
              <span className="material-symbols-outlined text-green-600 text-lg">trending_up</span>
            </div>
            <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Total Officials</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border-2 border-green-100 p-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10">
            <span className="material-symbols-outlined text-6xl text-green-500">check_circle</span>
          </div>
          <div className="relative">
            <div className="text-3xl font-black text-gray-900 mb-1">45</div>
            <div className="flex items-center gap-2 text-sm mb-2">
              <span className="text-green-600 font-bold">Healthy engagement</span>
              <span className="material-symbols-outlined text-green-600 text-lg">check</span>
            </div>
            <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Active Today</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border-2 border-red-100 p-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10">
            <span className="material-symbols-outlined text-6xl text-red-500">description</span>
          </div>
          <div className="relative">
            <div className="text-3xl font-black text-gray-900 mb-1">5</div>
            <div className="flex items-center gap-2 text-sm mb-2">
              <span className="text-red-600 font-bold">! Action required</span>
              <span className="material-symbols-outlined text-red-600 text-lg">error</span>
            </div>
            <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Pending Approval</div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 relative w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              search
            </span>
            <input
              type="text"
              placeholder="Search by name, ID, or email..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none text-gray-900"
            />
          </div>
          <select className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none text-gray-900 bg-white">
            <option>All Roles</option>
            <option>District Official</option>
            <option>State Secretary</option>
            <option>Technical Director</option>
          </select>
          <select className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none text-gray-900 bg-white">
            <option>All Statuses</option>
            <option>Active</option>
            <option>Pending Review</option>
            <option>On Leave</option>
            <option>Suspended</option>
          </select>
          <button className="p-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <span className="material-symbols-outlined text-gray-600">tune</span>
          </button>
        </div>
      </div>

      {/* Officials Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                  OFFICIAL
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                  ROLE & JURISDICTION
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                  CONTACT
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                  STATUS
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img
                      src="https://ui-avatars.com/api/?name=Rajesh+Kumar&background=5a0a8f&color=fff"
                      alt="Rajesh Kumar"
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <div className="font-semibold text-gray-900">Rajesh Kumar</div>
                      <div className="text-xs text-gray-500">ID: OFF-2023-001</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium text-gray-900">District Official</div>
                    <div className="text-sm text-gray-600">Pune, Maharashtra</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">mail</span>
                      rajesh.k@stfi.in
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">phone</span>
                      +91 98765 43210
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="text-sm font-medium text-gray-900">Active</span>
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button className="text-[#5a0a8f] hover:underline text-sm font-medium">View</button>
                </td>
              </tr>

              <tr className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-bold">
                      AS
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Anita Singh</div>
                      <div className="text-xs text-gray-500">ID: OFF-2023-042</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium text-gray-900">State Secretary</div>
                    <div className="text-sm text-gray-600">Uttar Pradesh</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">mail</span>
                      anita.singh@stfi.in
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">phone</span>
                      +91 88888 11111
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-2">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                    <span className="text-sm font-medium text-gray-900">Pending Review</span>
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button className="text-[#5a0a8f] hover:underline text-sm font-medium">Review</button>
                </td>
              </tr>

              <tr className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img
                      src="https://ui-avatars.com/api/?name=Vikram+Malhotra&background=10b981&color=fff"
                      alt="Vikram Malhotra"
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <div className="font-semibold text-gray-900">Vikram Malhotra</div>
                      <div className="text-xs text-gray-500">ID: OFF-2022-110</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium text-gray-900">Technical Director</div>
                    <div className="text-sm text-gray-600">National</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">mail</span>
                      vikram.m@stfi.in
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">phone</span>
                      +91 77777 22222
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-2">
                    <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                    <span className="text-sm font-medium text-gray-900">On Leave</span>
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button className="text-[#5a0a8f] hover:underline text-sm font-medium">View</button>
                </td>
              </tr>

              <tr className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-700 font-bold">
                      MK
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Manoj Kumar</div>
                      <div className="text-xs text-gray-500">ID: OFF-2021-005</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium text-gray-900">District Official</div>
                    <div className="text-sm text-gray-600">Delhi, DL</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">mail</span>
                      manoj.k@stfi.in
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">phone</span>
                      +91 99999 88888
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    <span className="text-sm font-medium text-gray-900">Suspended</span>
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button className="text-gray-500 hover:underline text-sm font-medium">View</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing <span className="font-bold text-gray-900">1 to 4</span> of <span className="font-bold text-gray-900">124</span> results
          </div>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed">
              Previous
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
