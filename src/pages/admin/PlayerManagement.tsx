import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useRegistrations, type PlayerRegistration } from '../../context/RegistrationsContext'
import { useDistricts } from '../../context/DistrictsContext'
import { useAuth } from '../../context/AuthContext'
import { EditPlayerModal } from '../../components/admin/EditPlayerModal.tsx'
import { AdminCreateRegistrationModal } from '../../components/admin/AdminCreateRegistrationModal'
import { downloadPlayersCsv } from '../../lib/adminPlayerExport'

export function PlayerManagement() {
  const { registrations, approveRegistration, rejectRegistration, deleteRegistration, updateRegistration, createAdminRegistration } = useRegistrations()
  const { districts } = useDistricts()
  const { user } = useAuth()

  const [selectedRegistration, setSelectedRegistration] = useState<PlayerRegistration | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [registrationToEdit, setRegistrationToEdit] = useState<PlayerRegistration | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [genderFilter, setGenderFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [districtFilter, setDistrictFilter] = useState<string>('all')
  const [dobFilter, setDobFilter] = useState('')

  const normalizeValue = (value?: string) => (value || '').trim().toLowerCase()
  const normalizeDateValue = (value?: string) => (value || '').trim().slice(0, 10)
  const matchesDateFilter = (dateValue: string, query: string) => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return true

    const normalizedDate = normalizeDateValue(dateValue)
    if (!normalizedDate) return false

    const parsedDate = new Date(normalizedDate)
    const searchParts = [
      normalizedDate,
      normalizedDate.replaceAll('-', ''),
      normalizedDate.split('-').reverse().join('/'),
      Number.isNaN(parsedDate.getTime())
        ? ''
        : parsedDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toLowerCase(),
      Number.isNaN(parsedDate.getTime()) ? '' : String(parsedDate.getFullYear()),
    ].filter(Boolean)

    return searchParts.some((part) => part.includes(normalizedQuery))
  }

  const resolveDistrictName = (districtValue?: string) => {
    const normalizedDistrictValue = normalizeValue(districtValue)
    if (!normalizedDistrictValue) return ''

    const matchingDistrict = districts.find((district) =>
      [district.id, district.code, district.name].some((candidate) => normalizeValue(candidate) === normalizedDistrictValue),
    )

    return matchingDistrict?.name || districtValue || ''
  }

  const players = useMemo(() => registrations.filter((registration) => registration.type === 'player'), [registrations])

  const districtOptions = useMemo(() => {
    const options = new Map<string, string>()

    districts.forEach((district) => {
      options.set(normalizeValue(district.id || district.code || district.name), district.name)
    })

    players.forEach((registration) => {
      const normalizedDistrict = normalizeValue(registration.district)
      if (!normalizedDistrict || options.has(normalizedDistrict)) return
      options.set(normalizedDistrict, resolveDistrictName(registration.district))
    })

    return Array.from(options.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [districts, players])

  const pendingRegistrations = players.filter((registration) => registration.status === 'pending')
  const approvedRegistrations = players.filter((registration) => registration.status === 'approved')
  const rejectedRegistrations = players.filter((registration) => registration.status === 'rejected')

  const filteredRegistrations = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase()

    return players.filter((registration) => {
      const districtName = resolveDistrictName(registration.district)
      const matchesSearch =
        !normalizedSearch ||
        registration.fullName.toLowerCase().includes(normalizedSearch) ||
        registration.email.toLowerCase().includes(normalizedSearch) ||
        registration.id.toLowerCase().includes(normalizedSearch) ||
        (registration.playerId || '').toLowerCase().includes(normalizedSearch) ||
        districtName.toLowerCase().includes(normalizedSearch) ||
        registration.aadhaarNumber.includes(searchQuery)

      const matchesStatus = statusFilter === 'all' || registration.status === statusFilter
      const matchesGender = genderFilter === 'all' || normalizeValue(registration.gender) === normalizeValue(genderFilter)
      const matchesCategory = categoryFilter === 'all' || normalizeValue(registration.category) === normalizeValue(categoryFilter)
      const matchesDistrict =
        districtFilter === 'all' ||
        [registration.district, districtName].some((districtValue) => normalizeValue(districtValue) === districtFilter)
      const matchesDob = matchesDateFilter(registration.dateOfBirth, dobFilter)

      return matchesSearch && matchesStatus && matchesGender && matchesCategory && matchesDistrict && matchesDob
    })
  }, [players, searchQuery, statusFilter, genderFilter, categoryFilter, districtFilter, dobFilter, districts])

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
    const district = districts.find((item) => item.id === districtId)
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

  const handleExport = () => {
    downloadPlayersCsv(
      filteredRegistrations.map((registration) => ({
        ...registration,
        districtName: resolveDistrictName(registration.district),
        age: calculateAge(registration.dateOfBirth),
      })),
      `players-${new Date().toISOString().slice(0, 10)}.csv`,
    )
  }

  const resetFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setGenderFilter('all')
    setCategoryFilter('all')
    setDistrictFilter('all')
    setDobFilter('')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Link to="/admin/dashboard" className="hover:text-[#5a0a8f]">
          Home
        </Link>
        <span>›</span>
        <span className="text-gray-900 font-medium">Player Management</span>
      </div>

      <div className="flex flex-col gap-4 rounded-3xl border border-[#eadcf7] bg-gradient-to-r from-white via-[#fcf8ff] to-[#f7f5ff] p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="mb-2 text-3xl font-black text-gray-900 md:text-4xl">Player Management</h1>
          <p className="text-gray-600">
            Review player registrations, filter them cleanly by district and status, and export the visible player list as CSV.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={handleExport}
            disabled={filteredRegistrations.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-[#5a0a8f]/25 hover:text-[#5a0a8f] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export CSV
          </button>
          <Link
            to="#"
            onClick={(e) => {
              e.preventDefault()
              setShowCreateModal(true)
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#5a0a8f] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#400466]"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Add New Player
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-[#eadcf7] bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#7b56a3]">Pending</p>
              <div className="mt-3 text-4xl font-black text-gray-900">{pendingRegistrations.length}</div>
            </div>
            <div className="rounded-2xl bg-[#f7efff] p-3 text-[#7b56a3]">
              <span className="material-symbols-outlined">hourglass_empty</span>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            {pendingRegistrations.filter((registration) => new Date(registration.submittedAt).toDateString() === new Date().toDateString()).length > 0
              ? `+${
                  pendingRegistrations.filter(
                    (registration) => new Date(registration.submittedAt).toDateString() === new Date().toDateString(),
                  ).length
                } submitted today`
              : 'No new submissions today'}
          </p>
        </div>

        <div className="rounded-2xl border border-[#d4f6df] bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#157f43]">Approved</p>
              <div className="mt-3 text-4xl font-black text-gray-900">{approvedRegistrations.length}</div>
            </div>
            <div className="rounded-2xl bg-[#edfff3] p-3 text-[#157f43]">
              <span className="material-symbols-outlined">check_circle</span>
            </div>
          </div>
          <p className="text-sm text-gray-600">Approved players ready for roster use, reporting, and export.</p>
        </div>

        <div className="rounded-2xl border border-[#ffdedd] bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#c93b32]">Rejected</p>
              <div className="mt-3 text-4xl font-black text-gray-900">{rejectedRegistrations.length}</div>
            </div>
            <div className="rounded-2xl bg-[#fff1f0] p-3 text-[#c93b32]">
              <span className="material-symbols-outlined">cancel</span>
            </div>
          </div>
          <p className="text-sm text-gray-600">Applications that still need corrections before approval.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Filters</h2>
            <p className="text-sm text-gray-500">Narrow the player list before reviewing or exporting.</p>
          </div>
          <div className="rounded-full bg-[#f5effb] px-4 py-2 text-sm font-medium text-[#5a0a8f]">
            {filteredRegistrations.length} player{filteredRegistrations.length === 1 ? '' : 's'} shown
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
          <label className="block xl:col-span-2">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">Search</span>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, player ID, or district"
                className="h-12 w-full rounded-xl border border-gray-300 bg-white pl-10 pr-4 text-sm text-gray-900 outline-none transition focus:border-[#5a0a8f] focus:ring-2 focus:ring-[#5a0a8f]/15"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">Status</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-[#5a0a8f] focus:ring-2 focus:ring-[#5a0a8f]/15"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">District</span>
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-[#5a0a8f] focus:ring-2 focus:ring-[#5a0a8f]/15"
            >
              <option value="all">All districts</option>
              {districtOptions.map((district) => (
                <option key={district.value} value={district.value}>
                  {district.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">Gender</span>
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-[#5a0a8f] focus:ring-2 focus:ring-[#5a0a8f]/15"
            >
              <option value="all">All genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">Date of Birth</span>
            <input
              type="text"
              value={dobFilter}
              onChange={(e) => setDobFilter(e.target.value)}
              placeholder="Search DOB or year, e.g. 2010"
              className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-[#5a0a8f] focus:ring-2 focus:ring-[#5a0a8f]/15"
            />
          </label>

          <label className="block md:col-span-2 xl:col-span-2">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">Category</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-[#5a0a8f] focus:ring-2 focus:ring-[#5a0a8f]/15"
            >
              <option value="all">All categories</option>
              <option value="General">General</option>
              <option value="OBC">OBC</option>
              <option value="SC">SC</option>
              <option value="ST">ST</option>
              <option value="Other">Other</option>
            </select>
          </label>

          <div className="flex items-end md:col-span-2 xl:col-span-2">
            <button
              onClick={resetFilters}
              className="inline-flex h-12 items-center justify-center rounded-xl border border-gray-200 px-4 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 bg-gray-50/80 px-6 py-4">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Registered Players</h3>
              <p className="text-sm text-gray-500">This screen now shows player records only.</p>
            </div>
            <div className="text-sm text-gray-600">
              Showing <span className="font-bold text-gray-900">{filteredRegistrations.length}</span> of{' '}
              <span className="font-bold text-gray-900">{players.length}</span> players
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">Player</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">Player ID</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">District</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">DOB / Age</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">Category</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRegistrations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No players matched the current filters.
                  </td>
                </tr>
              ) : (
                filteredRegistrations.map((registration) => {
                  const age = calculateAge(registration.dateOfBirth)
                  const initials = registration.fullName
                    .split(' ')
                    .map((name) => name[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)
                  const districtName = resolveDistrictName(registration.district)
                  const displayId = registration.playerId || registration.id

                  return (
                    <tr key={registration.id} className="transition-colors hover:bg-gray-50/70">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {registration.profilePhoto ? (
                            <img
                              src={registration.profilePhoto}
                              alt={registration.fullName}
                              className="h-11 w-11 rounded-full object-cover ring-2 ring-gray-100"
                            />
                          ) : (
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-purple-100 font-bold text-purple-700">
                              {initials}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-gray-900">{registration.fullName}</div>
                            <div className="truncate text-xs text-gray-500">{registration.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900">{displayId}</div>
                        <div className="text-xs text-gray-500">Reg: {registration.id.slice(-8)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{districtName || 'Unassigned'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700">{formatDate(registration.dateOfBirth)}</div>
                        <div className="text-xs text-gray-500">{age} years</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                          {registration.category || 'Not set'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {registration.status === 'pending' ? (
                          <span className="inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-800">
                            Pending
                          </span>
                        ) : registration.status === 'approved' ? (
                          <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                            Approved
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
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
                                className="rounded-lg p-2 text-green-600 transition hover:bg-green-50 hover:text-green-700"
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
                                className="rounded-lg p-2 text-red-600 transition hover:bg-red-50 hover:text-red-700"
                                title="Reject"
                              >
                                <span className="material-symbols-outlined text-lg">close</span>
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleViewDetails(registration)}
                            className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-700"
                            title="View Details"
                          >
                            <span className="material-symbols-outlined text-lg">visibility</span>
                          </button>
                          <button
                            onClick={() => handleEdit(registration)}
                            className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50 hover:text-blue-700"
                            title="Edit"
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(registration.id, registration.fullName)}
                            className="rounded-lg p-2 text-red-600 transition hover:bg-red-50 hover:text-red-700"
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
      </div>

      {showDetailModal && selectedRegistration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-8 max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white p-6">
              <h2 className="text-2xl font-bold text-gray-900">Registration Details</h2>
              <button
                onClick={() => {
                  setShowDetailModal(false)
                  setSelectedRegistration(null)
                }}
                className="text-gray-400 transition-colors hover:text-gray-600"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            <div className="space-y-6 p-6">
              <div className="flex items-start gap-6 border-b border-gray-200 pb-6">
                {selectedRegistration.profilePhoto ? (
                  <img
                    src={selectedRegistration.profilePhoto}
                    alt={selectedRegistration.fullName}
                    className="h-24 w-24 rounded-full border-4 border-gray-200 object-cover"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-gray-200 bg-purple-100 text-2xl font-bold text-purple-700">
                    {selectedRegistration.fullName
                      .split(' ')
                      .map((name) => name[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="mb-2 text-2xl font-bold text-gray-900">{selectedRegistration.fullName}</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div>
                      <span className="font-semibold">Registration ID:</span> {selectedRegistration.id}
                    </div>
                    <div>
                      <span className="font-semibold">Type:</span> <span className="capitalize">{selectedRegistration.type}</span>
                    </div>
                    <div>
                      <span className="font-semibold">Status:</span>{' '}
                      <span
                        className={`rounded px-2 py-1 text-xs font-bold ${
                          selectedRegistration.status === 'approved'
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
                    {selectedRegistration.reviewRemarks && (
                      <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
                        <div className="text-sm font-semibold text-red-700">Rejection remarks</div>
                        <div className="whitespace-pre-line text-sm text-gray-800">{selectedRegistration.reviewRemarks}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="mb-4 text-lg font-bold text-gray-900">Personal Information</h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">Full Name</label>
                    <div className="text-gray-900">{selectedRegistration.fullName}</div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">Date of Birth</label>
                    <div className="text-gray-900">
                      {formatDate(selectedRegistration.dateOfBirth)} ({calculateAge(selectedRegistration.dateOfBirth)} years)
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">Father&apos;s Name</label>
                    <div className="text-gray-900">{selectedRegistration.fatherName}</div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">Mother&apos;s Name</label>
                    <div className="text-gray-900">{selectedRegistration.motherName}</div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">Aadhaar Number</label>
                    <div className="text-gray-900">{selectedRegistration.aadhaarNumber || 'Not provided'}</div>
                  </div>
                  {selectedRegistration.aadhaarDocument && (
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-gray-700">Aadhaar Document</label>
                      <button
                        onClick={() => window.open(selectedRegistration.aadhaarDocument, '_blank')}
                        className="flex items-center gap-1 text-sm font-bold text-[#5a0a8f] hover:underline"
                      >
                        <span className="material-symbols-outlined text-sm">visibility</span>
                        View Aadhaar
                      </button>
                    </div>
                  )}
                  {selectedRegistration.passportNumber && (
                    <>
                      <div>
                        <label className="mb-1 block text-sm font-semibold text-gray-700">Passport Number</label>
                        <div className="text-gray-900">{selectedRegistration.passportNumber}</div>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-semibold text-gray-700">Passport Expiry</label>
                        <div className="text-gray-900">{selectedRegistration.passportExpiryDate || 'N/A'}</div>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-semibold text-gray-700">Issued Place</label>
                        <div className="text-gray-900">{selectedRegistration.passportIssuedPlace || 'N/A'}</div>
                      </div>
                    </>
                  )}
                  {selectedRegistration.passportDocument && (
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-gray-700">Passport Copy</label>
                      <button
                        onClick={() => window.open(selectedRegistration.passportDocument, '_blank')}
                        className="flex items-center gap-1 text-sm font-bold text-[#5a0a8f] hover:underline"
                      >
                        <span className="material-symbols-outlined text-sm">visibility</span>
                        View Passport
                      </button>
                    </div>
                  )}
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">Phone Number</label>
                    <div className="text-gray-900">{selectedRegistration.phone || 'N/A'}</div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">Email</label>
                    <div className="text-gray-900">{selectedRegistration.email}</div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">District Association</label>
                    <div className="text-gray-900">{getDistrictName(selectedRegistration.district)}</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="mb-4 text-lg font-bold text-gray-900">Kit & Performance Details</h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">T-Shirt Size</label>
                    <div className="text-gray-900">{selectedRegistration.tShirtSize || 'Not specified'}</div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">Tracksuit Size</label>
                    <div className="text-gray-900">{selectedRegistration.trackSuitSize || 'Not specified'}</div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">Shoes Size</label>
                    <div className="text-gray-900">{selectedRegistration.shoesSize || 'Not specified'}</div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">Pant Size</label>
                    <div className="text-gray-900">{selectedRegistration.pantSize || 'Not specified'}</div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">District Games</label>
                    <div className="font-medium text-gray-900">{selectedRegistration.districtGames || '0'}</div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">State Games</label>
                    <div className="font-medium text-gray-900">{selectedRegistration.stateGames || '0'}</div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">National Games</label>
                    <div className="font-medium text-gray-900">{selectedRegistration.nationalGames || '0'}</div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">International Games</label>
                    <div className="font-medium text-gray-900">{selectedRegistration.internationalGames || '0'}</div>
                  </div>
                </div>
              </div>

              {selectedRegistration.certificates.length > 0 && (
                <div>
                  <h4 className="mb-4 text-lg font-bold text-gray-900">Certificates ({selectedRegistration.certificates.length})</h4>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                    {selectedRegistration.certificates.map((certificate, index) => (
                      <div key={index} className="group relative">
                        <img
                          src={certificate}
                          alt={`Certificate ${index + 1}`}
                          className="h-32 w-full cursor-pointer rounded-lg border-2 border-gray-200 object-cover transition-colors hover:border-[#5a0a8f]"
                          onClick={() => window.open(certificate, '_blank')}
                        />
                        <div className="absolute bottom-0 left-0 right-0 rounded-b-lg bg-black/60 py-1 text-center text-xs text-white">
                          Certificate {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedRegistration.status === 'pending' && (
                <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-6">
                  <button
                    onClick={() => {
                      setShowDetailModal(false)
                      setSelectedRegistration(null)
                    }}
                    className="rounded-lg border-2 border-gray-300 px-5 py-2.5 font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleReject}
                    className="rounded-lg border-2 border-red-300 px-5 py-2.5 font-medium text-red-700 transition-colors hover:bg-red-50"
                  >
                    Reject
                  </button>
                  <button
                    onClick={handleApprove}
                    className="rounded-lg bg-green-600 px-6 py-2.5 font-bold text-white transition-colors hover:bg-green-700"
                  >
                    Approve Registration
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showEditModal && registrationToEdit && (
        <EditPlayerModal
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
      {showCreateModal && (
        <AdminCreateRegistrationModal
          role="player"
          onClose={() => setShowCreateModal(false)}
          onSubmit={(data) => createAdminRegistration('player', data)}
        />
      )}
    </div>
  )
}
