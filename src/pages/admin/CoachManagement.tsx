import { Link } from 'react-router-dom'
import { useState, useMemo } from 'react'
import { useRegistrations, type PlayerRegistration } from '../../context/RegistrationsContext'
import { useDistricts } from '../../context/DistrictsContext'
import { useAuth } from '../../context/AuthContext'
import { EditCoachModal } from '../../components/admin/EditCoachModal'

export function CoachManagement() {
  const { registrations, approveRegistration, rejectRegistration, deleteRegistration, updateRegistration } = useRegistrations()
  const { districts } = useDistricts()
  const { user } = useAuth()
  const [selectedRegistration, setSelectedRegistration] = useState<PlayerRegistration | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [registrationToEdit, setRegistrationToEdit] = useState<PlayerRegistration | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [genderFilter, setGenderFilter] = useState<string>('all')

  // Filter only coaches
  const coaches = registrations.filter((r) => r.type === 'coach')
  const pendingCoaches = coaches.filter((r) => r.status === 'pending')
  const approvedCoaches = coaches.filter((r) => r.status === 'approved')
  const rejectedCoaches = coaches.filter((r) => r.status === 'rejected')

  const filteredCoaches = useMemo(() => {
    return coaches.filter((reg) => {
      const matchesSearch =
        reg.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reg.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reg.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (reg.aadhaarNumber && reg.aadhaarNumber.includes(searchQuery)) ||
        (reg.phone && reg.phone.includes(searchQuery))
      const matchesStatus = statusFilter === 'all' || reg.status === statusFilter
      const matchesGender = genderFilter === 'all' || reg.gender === genderFilter
      return matchesSearch && matchesStatus && matchesGender
    })
  }, [coaches, searchQuery, statusFilter, genderFilter])

  const handleViewDetails = (registration: PlayerRegistration) => {
    setSelectedRegistration(registration)
    setShowDetailModal(true)
  }

  const handleApprove = () => {
    if (selectedRegistration && user) {
      approveRegistration(selectedRegistration.id, user.name)
      setShowDetailModal(false)
      setSelectedRegistration(null)
    }
  }

  const requestRemarks = (existing?: string) => {
    const input = window.prompt('Add rejection remarks (shared with applicant)', existing || '')
    if (input === null) return null
    const trimmed = input.trim()
    if (!trimmed) {
      window.alert('Please add a short remark for the applicant.')
      return null
    }
    return trimmed
  }

  const handleReject = () => {
    if (selectedRegistration && user) {
      const remarks = requestRemarks(selectedRegistration.reviewRemarks)
      if (remarks === null) return
      rejectRegistration(selectedRegistration.id, user.name, remarks)
      setShowDetailModal(false)
      setSelectedRegistration(null)
    }
  }

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}? This will also delete all their uploaded documents from S3.`)) {
      deleteRegistration(id)
    }
  }

  const handleEdit = (registration: PlayerRegistration) => {
    setRegistrationToEdit(registration)
    setShowEditModal(true)
  }

  const getDistrictName = (districtId: string) => {
    const district = districts.find((d) => d.id === districtId)
    return district?.name || districtId
  }

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div>
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
        <Link to="/admin/dashboard" className="hover:text-[#5a0a8f]">
          Home
        </Link>
        <span>›</span>
        <span className="text-gray-900 font-medium">Coach Management</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">Coach Management</h1>
          <p className="text-gray-600">
            Manage coach registrations, verify credentials, and update statuses for the Haryana State Sepak Takraw
            Association.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium">
            <span className="material-symbols-outlined">upload</span>
            Bulk Upload
          </button>
          <Link
            to="/register-coach"
            className="flex items-center gap-2 bg-[#5a0a8f] hover:bg-[#400466] text-white px-5 py-2.5 rounded-lg font-bold transition-colors"
          >
            <span className="material-symbols-outlined">add</span>
            Add New Coach
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border-2 border-purple-100 p-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10">
            <span className="material-symbols-outlined text-6xl text-purple-500">hourglass_empty</span>
          </div>
          <div className="relative">
            <div className="text-3xl font-black text-gray-900 mb-1">{pendingCoaches.length}</div>
            <div className="text-sm text-gray-600 mb-2">
              {pendingCoaches.filter(
                (r) => new Date(r.submittedAt).toDateString() === new Date().toDateString(),
              ).length > 0
                ? `+${pendingCoaches.filter((r) => new Date(r.submittedAt).toDateString() === new Date().toDateString()).length} today`
                : 'No new today'}
            </div>
            <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">PENDING REQUESTS</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border-2 border-green-100 p-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10">
            <span className="material-symbols-outlined text-6xl text-green-500">check_circle</span>
          </div>
          <div className="relative">
            <div className="text-3xl font-black text-gray-900 mb-1">{approvedCoaches.length}</div>
            <div className="text-sm text-gray-600 mb-2">Total Active</div>
            <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">APPROVED COACHES</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border-2 border-red-100 p-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10">
            <span className="material-symbols-outlined text-6xl text-red-500">cancel</span>
          </div>
          <div className="relative">
            <div className="text-3xl font-black text-gray-900 mb-1">{rejectedCoaches.length}</div>
            <div className="text-sm text-gray-600 mb-2">This Season</div>
            <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">REJECTED</div>
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, phone, or ID"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none text-gray-900"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none text-gray-900 bg-white"
          >
            <option value="all">STATUS: All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a0a8f] focus:border-[#5a0a8f] outline-none text-gray-900 bg-white"
          >
            <option value="all">GENDER: All</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium">
            <span className="material-symbols-outlined">download</span>
            Export
          </button>
        </div>
      </div>

      {/* Coaches Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                  <input type="checkbox" className="rounded border-gray-300" />
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                  COACH NAME
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                  ID NUMBER
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                  CONTACT
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                  DISTRICT
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
              {filteredCoaches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No coach registrations found.
                  </td>
                </tr>
              ) : (
                filteredCoaches.map((registration) => {
                  const initials = registration.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)

                  return (
                    <tr key={registration.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <input type="checkbox" className="rounded border-gray-300" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {registration.profilePhoto ? (
                            <img
                              src={registration.profilePhoto}
                              alt={registration.fullName}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-bold">
                              {initials}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-gray-900">{registration.fullName}</div>
                            <div className="text-xs text-gray-500">{registration.gender || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{registration.coachId || registration.id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">{registration.phone || 'N/A'}</div>
                        <div className="text-xs text-gray-500">{registration.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{getDistrictName(registration.district)}</div>
                      </td>
                      <td className="px-6 py-4">
                        {registration.status === 'pending' ? (
                          <span className="inline-flex items-center gap-2">
                            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded">
                              Pending
                            </span>
                          </span>
                        ) : registration.status === 'approved' ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">
                            Approved
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">
                            Rejected
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {registration.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleViewDetails(registration)}
                                className="text-green-600 hover:text-green-700"
                                title="Approve"
                              >
                                <span className="material-symbols-outlined text-lg">check</span>
                              </button>
                              <button
                                onClick={() => {
                                  const remarks = requestRemarks(registration.reviewRemarks)
                                  if (remarks === null) return
                                  rejectRegistration(registration.id, user?.name || 'Admin', remarks)
                                }}
                                className="text-red-600 hover:text-red-700"
                                title="Reject"
                              >
                                <span className="material-symbols-outlined text-lg">close</span>
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleViewDetails(registration)}
                            className="text-gray-600 hover:text-gray-700"
                            title="View Details"
                          >
                            <span className="material-symbols-outlined text-lg">visibility</span>
                          </button>
                          <button
                            onClick={() => handleEdit(registration)}
                            className="text-blue-600 hover:text-blue-700"
                            title="Edit"
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(registration.id, registration.fullName)}
                            className="text-red-600 hover:text-red-700"
                            title="Delete"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
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

        {/* Pagination */}
        {filteredCoaches.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing <span className="font-bold text-gray-900">1-{filteredCoaches.length}</span> of{' '}
              <span className="font-bold text-gray-900">{filteredCoaches.length}</span> results
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
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedRegistration && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-bold text-gray-900">Coach Registration Details</h2>
              <button
                onClick={() => {
                  setShowDetailModal(false)
                  setSelectedRegistration(null)
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Profile Section */}
              <div className="flex items-start gap-6 pb-6 border-b border-gray-200">
                {selectedRegistration.profilePhoto ? (
                  <img
                    src={selectedRegistration.profilePhoto}
                    alt={selectedRegistration.fullName}
                    className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                  />
                ) : (
                  <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-bold text-2xl border-4 border-gray-200">
                    {selectedRegistration.fullName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedRegistration.fullName}</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div>
                      <span className="font-semibold">Coach ID:</span> {selectedRegistration.coachId || selectedRegistration.id}
                    </div>
                    <div>
                      <span className="font-semibold">Type:</span> Coach
                    </div>
                    <div>
                      <span className="font-semibold">Status:</span>{' '}
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold ${selectedRegistration.status === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : selectedRegistration.status === 'rejected'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                          }`}
                      >
                        {selectedRegistration.status.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold">Submitted:</span> {formatDate(selectedRegistration.submittedAt)}
                    </div>
                    {selectedRegistration.reviewedAt && (
                      <div>
                        <span className="font-semibold">Reviewed:</span> {formatDate(selectedRegistration.reviewedAt)} by{' '}
                        {selectedRegistration.reviewedBy}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-4">Personal Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                    <div className="text-gray-900">{selectedRegistration.fullName}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Date of Birth</label>
                    <div className="text-gray-900">
                      {selectedRegistration.dateOfBirth ? `${formatDate(selectedRegistration.dateOfBirth)} (${calculateAge(selectedRegistration.dateOfBirth)} years)` : 'Not provided'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Father's Name</label>
                    <div className="text-gray-900">{selectedRegistration.fatherName || 'Not provided'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Mother's Name</label>
                    <div className="text-gray-900">{selectedRegistration.motherName || 'Not provided'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Gender</label>
                    <div className="text-gray-900 capitalize">{selectedRegistration.gender || 'Not provided'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                    <div className="text-gray-900 capitalize">{selectedRegistration.category || 'Not provided'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Aadhaar Number</label>
                    <div className="text-gray-900">{selectedRegistration.aadhaarNumber || 'Not provided'}</div>
                  </div>
                  {selectedRegistration.aadhaarDocument && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Aadhaar Document</label>
                      <button
                        onClick={() => window.open(selectedRegistration.aadhaarDocument, '_blank')}
                        className="text-[#5a0a8f] text-sm font-bold hover:underline flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">visibility</span>
                        View Aadhaar
                      </button>
                    </div>
                  )}
                  {selectedRegistration.passportNumber && (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Passport Number</label>
                        <div className="text-gray-900">{selectedRegistration.passportNumber}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Passport Expiry</label>
                        <div className="text-gray-900">{selectedRegistration.passportExpiryDate || 'N/A'}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Issued Place</label>
                        <div className="text-gray-900">{selectedRegistration.passportIssuedPlace || 'N/A'}</div>
                      </div>
                    </>
                  )}
                  {selectedRegistration.passportDocument && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Passport Copy</label>
                      <button
                        onClick={() => window.open(selectedRegistration.passportDocument, '_blank')}
                        className="text-[#5a0a8f] text-sm font-bold hover:underline flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">visibility</span>
                        View Passport
                      </button>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                    <div className="text-gray-900">{selectedRegistration.phone || 'N/A'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                    <div className="text-gray-900">{selectedRegistration.email}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">District Association</label>
                    <div className="text-gray-900">{getDistrictName(selectedRegistration.district)}</div>
                  </div>
                </div>
              </div>

              {/* Kit & Performance Details */}
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-4">Kit & Coaching Performance</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">T-Shirt Size</label>
                    <div className="text-gray-900">{selectedRegistration.tShirtSize || 'Not specified'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Tracksuit Size</label>
                    <div className="text-gray-900">{selectedRegistration.trackSuitSize || 'Not specified'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Shoes Size</label>
                    <div className="text-gray-900">{selectedRegistration.shoesSize || 'Not specified'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Pant Size</label>
                    <div className="text-gray-900">{selectedRegistration.pantSize || 'Not specified'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">District Games Coached</label>
                    <div className="text-gray-900 font-medium">{selectedRegistration.districtGames || '0'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">State Games Coached</label>
                    <div className="text-gray-900 font-medium">{selectedRegistration.stateGames || '0'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">National Games Coached</label>
                    <div className="text-gray-900 font-medium">{selectedRegistration.nationalGames || '0'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">International Games Coached</label>
                    <div className="text-gray-900 font-medium">{selectedRegistration.internationalGames || '0'}</div>
                  </div>
                </div>
              </div>

              {/* Certificates */}
              {selectedRegistration.certificates && selectedRegistration.certificates.length > 0 && (
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-4">
                    Coaching Certificates ({selectedRegistration.certificates.length})
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {selectedRegistration.certificates.map((cert, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={cert}
                          alt={`Certificate ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border-2 border-gray-200 cursor-pointer hover:border-[#5a0a8f] transition-colors"
                          onClick={() => window.open(cert, '_blank')}
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs text-center py-1 rounded-b-lg">
                          Certificate {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {selectedRegistration.status === 'pending' && (
                <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowDetailModal(false)
                      setSelectedRegistration(null)
                    }}
                    className="px-5 py-2.5 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleReject}
                    className="px-5 py-2.5 border-2 border-red-300 rounded-lg hover:bg-red-50 transition-colors text-red-700 font-medium"
                  >
                    Reject
                  </button>
                  <button
                    onClick={handleApprove}
                    className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-colors"
                  >
                    Approve Coach
                  </button>
                </div>
              )}
              {selectedRegistration.status !== 'pending' && (
                <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowDetailModal(false)
                      setSelectedRegistration(null)
                    }}
                    className="px-5 py-2.5 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Edit Coach Modal */}
      {showEditModal && registrationToEdit && (
        <EditCoachModal
          registration={registrationToEdit}
          onClose={() => {
            setShowEditModal(false)
            setRegistrationToEdit(null)
          }}
          onSave={(updates: Partial<PlayerRegistration>) => {
            updateRegistration(registrationToEdit.id, updates)
            setShowEditModal(false)
            setRegistrationToEdit(null)
          }}
        />
      )}
    </div>
  )
}
