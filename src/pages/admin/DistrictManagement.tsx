import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useDistricts, type District } from '../../context/DistrictsContext'

export function DistrictManagement() {
  const { districts, addDistrict, updateDistrict, deleteDistrict } = useDistricts()
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingDistrict, setEditingDistrict] = useState<District | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterZone, setFilterZone] = useState('all')

  const sanitizePhone10 = (value: string) => value.replace(/\D/g, '').slice(0, 10)

  const [formData, setFormData] = useState({
    name: '',
    zone: '',
    secretaryName: '',
    secretaryEmail: '',
    secretaryPhone: '',
    secretarySince: '',
    contactPhone: '',
    contactEmail: '',
    clubs: '',
    players: '',
    status: 'active' as 'active' | 'pending' | 'inactive',
    districtEmail: '',
    districtPassword: '',
  })

  const activeDistricts = districts.filter((d) => d.status === 'active')
  const pendingDistricts = districts.filter((d) => d.status === 'pending')
  const totalOfficials = districts.reduce((sum, d) => sum + (d.secretary ? 1 : 0), 0)

  const zones = Array.from(new Set(districts.map((d) => d.zone))).filter(Boolean)

  const filteredDistricts = districts.filter((district) => {
    const matchesSearch =
      district.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      district.secretary?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      district.contact?.email?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesZone = filterZone === 'all' || district.zone === filterZone
    return matchesSearch && matchesZone
  })

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      zone: '',
      secretaryName: '',
      secretaryEmail: '',
      secretaryPhone: '',
      secretarySince: '',
      contactPhone: '',
      contactEmail: '',
      clubs: '',
      players: '',
      status: 'active',
      districtEmail: '',
      districtPassword: '',
    })
    setEditingDistrict(null)
    setShowAddModal(true)
  }

  const handleOpenEdit = (district: District) => {
    const stripIndia = (v?: string) => {
      const digits = (v || '').replace(/\D/g, '')
      return digits.startsWith('91') && digits.length > 10 ? digits.slice(-10) : digits.slice(0, 10)
    }

    setFormData({
      name: district.name,
      zone: district.zone,
      secretaryName: district.secretary?.name || '',
      secretaryEmail: district.secretary?.email || '',
      secretaryPhone: stripIndia(district.secretary?.phone),
      secretarySince: district.secretary?.since || '',
      contactPhone: stripIndia(district.contact?.phone),
      contactEmail: district.contact?.email || '',
      clubs: district.stats?.clubs.toString() || '',
      players: district.stats?.players.toString() || '',
      status: district.status,
      districtEmail: district.email || '',
      // Never pre-fill the password — blank keeps the current one.
      districtPassword: '',
    })
    // Preserve the identifier; prefer code if available, normalized to uppercase for API.
    const idOrCode = (district.id || (district as any).code || '').trim().toUpperCase()
    setEditingDistrict({ ...district, id: idOrCode })
    setShowAddModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const toIndiaPhone = (raw: string) => {
      const digits = (raw || '').replace(/\D/g, '').slice(0, 10)
      return digits ? `+91${digits}` : ''
    }

    const districtData: Omit<District, 'id' | 'createdAt'> & { password?: string } = {
      name: formData.name,
      zone: formData.zone,
      status: formData.status,
      // Login credentials for the district portal. Email is optional on create;
      // the backend requires a password whenever an email is set.
      email: formData.districtEmail.trim() || undefined,
      password: formData.districtPassword || undefined,
      secretary:
        formData.secretaryName || formData.secretaryEmail || formData.secretaryPhone
          ? {
              name: formData.secretaryName,
              email: formData.secretaryEmail,
              phone: toIndiaPhone(formData.secretaryPhone),
              since: formData.secretarySince || undefined,
            }
          : undefined,
      contact:
        formData.contactPhone || formData.contactEmail
          ? {
              phone: toIndiaPhone(formData.contactPhone),
              email: formData.contactEmail,
            }
          : undefined,
      stats:
        formData.clubs || formData.players
          ? {
              clubs: parseInt(formData.clubs) || 0,
              players: parseInt(formData.players) || 0,
            }
          : undefined,
    }

    try {
      if (editingDistrict) {
        await updateDistrict(editingDistrict.id, districtData)
      } else {
        await addDistrict(districtData)
      }

      setShowAddModal(false)
      setEditingDistrict(null)
    } catch (err: any) {
      const message = err?.message || 'Failed to save district. Please try again.'
      window.alert(message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this district?')) return

    try {
      await deleteDistrict(id)
    } catch (err: any) {
      const message = err?.message || 'Failed to delete district. Please try again.'
      window.alert(message)
    }
  }

  return (
    <div>
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
        <Link to="/admin/dashboard" className="hover:text-[#5a0a8f]">
          Dashboard
        </Link>
        <span>›</span>
        <span className="text-gray-900 font-medium">Manage Districts</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">District Management</h1>
          <p className="text-gray-600">Manage all registered districts, officials, and regional data.</p>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium">
            <span className="material-symbols-outlined">download</span>
            Export
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-[#5a0a8f] hover:bg-[#400466] text-white px-5 py-2.5 rounded-lg font-bold transition-colors"
          >
            <span className="material-symbols-outlined">add</span>
            Add New District
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="material-symbols-outlined text-3xl text-[#5a0a8f]">folder</span>
          </div>
          <div className="text-3xl font-black text-gray-900 mb-1">{districts.length}</div>
          <div className="text-xs text-green-600 font-semibold mb-1">
            {districts.length > 0 ? `+${districts.length} total` : 'No districts'}
          </div>
          <div className="text-sm text-gray-600">Total Districts</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="material-symbols-outlined text-3xl text-green-600">check_circle</span>
          </div>
          <div className="text-3xl font-black text-gray-900 mb-1">{activeDistricts.length}</div>
          <div className="text-xs text-green-600 font-semibold mb-1">
            {activeDistricts.length > 0 ? '+5%' : 'No active'}
          </div>
          <div className="text-sm text-gray-600">Active Districts</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="material-symbols-outlined text-3xl text-orange-500">hourglass_empty</span>
          </div>
          <div className="text-3xl font-black text-gray-900 mb-1">{pendingDistricts.length}</div>
          <div className="text-xs text-orange-600 font-semibold mb-1">
            {pendingDistricts.length > 0 ? 'Needs review' : 'All clear'}
          </div>
          <div className="text-sm text-gray-600">Pending Approval</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="material-symbols-outlined text-3xl text-red-500">work</span>
          </div>
          <div className="text-3xl font-black text-gray-900 mb-1">{totalOfficials}</div>
          <div className="text-xs text-green-600 font-semibold mb-1">
            {totalOfficials > 0 ? '+12%' : 'No officials'}
          </div>
          <div className="text-sm text-gray-600">Total Officials</div>
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search districts, secretaries..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none text-gray-900"
            />
          </div>
          <select
            value={filterZone}
            onChange={(e) => setFilterZone(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none text-gray-900 bg-white"
          >
            <option value="all">Filter: All Zones</option>
            {zones.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>
          <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium whitespace-nowrap">
            <span className="material-symbols-outlined">sort</span>
            Sort: Name
          </button>
        </div>
      </div>

      {/* Districts Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                  DISTRICT INFO
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                  SECRETARY
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                  CONTACT
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                  LOGIN
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                  STATS
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
              {filteredDistricts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No districts found. Click "Add New District" to create one.
                  </td>
                </tr>
              ) : (
                filteredDistricts.map((district) => {
                  const actionId = (district.id || (district as any).code || '').trim().toUpperCase()
                  const hasActionId = !!actionId
                  return (
                    <tr key={actionId || district.name} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-gray-900">{district.name}</div>
                        <div className="text-xs text-gray-500 mt-1">ID: {district.id}</div>
                        {district.zone && <div className="text-xs text-gray-500">{district.zone}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {district.secretary ? (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold">
                            {district.secretary.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{district.secretary.name}</div>
                            {district.secretary.since && (
                              <div className="text-xs text-gray-500">Since {district.secretary.since}</div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400">Not Assigned</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {district.contact ? (
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-base">phone</span>
                            {district.contact.phone}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-base">mail</span>
                            {district.contact.email}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400">No contact</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {district.hasLogin || district.email ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <span className="material-symbols-outlined text-base">mail</span>
                            <span className="break-all">{district.email}</span>
                          </div>
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                            Login enabled
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">No login</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {district.stats ? (
                        <div className="text-sm text-gray-600">
                          <div>{district.stats.clubs} Clubs</div>
                          <div>{district.stats.players} Players</div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">No data yet</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            district.status === 'active'
                              ? 'bg-green-500'
                              : district.status === 'pending'
                                ? 'bg-orange-500'
                                : 'bg-gray-500'
                          }`}
                        ></span>
                        <span className="text-sm font-medium text-gray-900 capitalize">{district.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(district)}
                          className="text-[#5a0a8f] hover:underline text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          disabled={!hasActionId}
                          title={hasActionId ? '' : 'Missing district identifier'}
                          onClick={() => handleDelete(actionId)}
                          className="text-red-600 hover:underline text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingDistrict ? 'Edit District' : 'Add New District'}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    District Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none text-gray-900"
                    placeholder="e.g., Bangalore Urban"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Zone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.zone}
                    onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none text-gray-900"
                    placeholder="e.g., South Zone"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as 'active' | 'pending' | 'inactive' })
                    }
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none text-gray-900 bg-white"
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Secretary Information (Optional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Secretary Name</label>
                    <input
                      type="text"
                      value={formData.secretaryName}
                      onChange={(e) => setFormData({ ...formData, secretaryName: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Secretary Email</label>
                    <input
                      type="email"
                      value={formData.secretaryEmail}
                      onChange={(e) => setFormData({ ...formData, secretaryEmail: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Secretary Phone</label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]{10}"
                      maxLength={10}
                      value={formData.secretaryPhone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          secretaryPhone: sanitizePhone10(e.target.value),
                        })
                      }
                      onPaste={(e) => {
                        e.preventDefault()
                        const pasted = e.clipboardData.getData('text')
                        setFormData((prev) => ({
                          ...prev,
                          secretaryPhone: sanitizePhone10(`${prev.secretaryPhone}${pasted}`),
                        }))
                      }}
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none text-gray-900"
                      placeholder="10-digit mobile"
                    />
                    <div className="text-xs text-gray-500 mt-1">Saved as +91XXXXXXXXXX</div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Since (Year)</label>
                    <input
                      type="text"
                      value={formData.secretarySince}
                      onChange={(e) => setFormData({ ...formData, secretarySince: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none text-gray-900"
                      placeholder="e.g., 2021"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Contact Information (Optional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Contact Phone</label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]{10}"
                      maxLength={10}
                      value={formData.contactPhone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contactPhone: sanitizePhone10(e.target.value),
                        })
                      }
                      onPaste={(e) => {
                        e.preventDefault()
                        const pasted = e.clipboardData.getData('text')
                        setFormData((prev) => ({
                          ...prev,
                          contactPhone: sanitizePhone10(`${prev.contactPhone}${pasted}`),
                        }))
                      }}
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none text-gray-900"
                      placeholder="10-digit mobile"
                    />
                    <div className="text-xs text-gray-500 mt-1">Saved as +91XXXXXXXXXX</div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Contact Email</label>
                    <input
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none text-gray-900"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Statistics (Optional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Number of Clubs</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.clubs}
                      onChange={(e) => setFormData({ ...formData, clubs: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Number of Players</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.players}
                      onChange={(e) => setFormData({ ...formData, players: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none text-gray-900"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Login Credentials</h3>
                <p className="text-sm text-gray-500 mb-4">
                  {editingDistrict
                    ? 'Set the email and password this district uses to sign in. Leave the password blank to keep the current one.'
                    : 'Optional. Set the email and password this district will use to sign in to the district portal.'}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">District Email</label>
                    <input
                      type="email"
                      value={formData.districtEmail}
                      onChange={(e) => setFormData({ ...formData, districtEmail: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none text-gray-900"
                      placeholder="district@example.org"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      District Password {editingDistrict && <span className="font-normal text-gray-500">(blank = unchanged)</span>}
                    </label>
                    <input
                      type="password"
                      value={formData.districtPassword}
                      onChange={(e) => setFormData({ ...formData, districtPassword: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none text-gray-900"
                      placeholder={editingDistrict ? 'Enter a new password to change it' : 'Min. 6 characters'}
                      autoComplete="new-password"
                    />
                  </div>
                </div>
                {editingDistrict?.hasLogin && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-green-700">
                    <span className="material-symbols-outlined text-base">verified</span>
                    Login is enabled for this district.
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#5a0a8f] hover:bg-[#400466] text-white rounded-lg font-bold transition-colors"
                >
                  {editingDistrict ? 'Update District' : 'Add District'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
